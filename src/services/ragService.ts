/**
 * RAG (Retrieval-Augmented Generation) Service
 * 
 * Provides vector search capabilities for organization documents
 * to enhance AI responses with organization-specific context.
 */

import { supabase } from '../lib/supabase';

export interface DocumentChunk {
    id: string;
    content: string;
    metadata: {
        source?: string;
        [key: string]: unknown;
    };
    similarity: number;
}

export interface RAGContext {
    chunks: DocumentChunk[];
    formattedContext: string;
}

/**
 * Search organization documents for relevant context
 * Uses pgvector similarity search via Supabase RPC
 */
export async function searchOrgDocuments(
    query: string,
    organizationId: string,
    options: {
        matchThreshold?: number;
        matchCount?: number;
    } = {}
): Promise<DocumentChunk[]> {
    const { matchThreshold = 0.5, matchCount = 5 } = options;

    try {
        // First, generate embedding for the query using Edge Function
        const { data: embeddingData, error: embeddingError } = await supabase.functions.invoke(
            'generate-embedding',
            { body: { text: query } }
        );

        if (embeddingError) {
            console.error('Error generating embedding:', embeddingError);
            return [];
        }

        const queryEmbedding = embeddingData?.embedding;
        if (!queryEmbedding) {
            console.warn('No embedding returned from Edge Function');
            return [];
        }

        // Search for similar documents using the RPC function
        const { data, error } = await supabase.rpc('match_org_documents', {
            query_embedding: queryEmbedding,
            match_threshold: matchThreshold,
            match_count: matchCount,
            filter_org_id: organizationId
        });

        if (error) {
            console.error('Error searching documents:', error);
            return [];
        }

        return (data || []).map((row: any) => ({
            id: row.id,
            content: row.content,
            metadata: row.metadata || {},
            similarity: row.similarity
        }));
    } catch (error) {
        console.error('RAG search failed:', error);
        return [];
    }
}

/**
 * Build formatted context from retrieved chunks
 * for injection into AI prompts
 */
export function buildRAGContext(chunks: DocumentChunk[]): RAGContext {
    if (!chunks.length) {
        return {
            chunks: [],
            formattedContext: ''
        };
    }

    const formattedContext = chunks
        .map((chunk, index) => {
            const source = chunk.metadata?.source || 'Unknown Document';
            return `[Document ${index + 1}: ${source}]\n${chunk.content}`;
        })
        .join('\n\n---\n\n');

    return {
        chunks,
        formattedContext: `
=== ORGANIZATION-SPECIFIC DOCUMENTS ===
The following excerpts are from the organization's own uploaded documents and policies:

${formattedContext}

=== END ORGANIZATION DOCUMENTS ===
`
    };
}

/**
 * Trigger document ingestion via Edge Function
 */
export async function triggerDocumentIngestion(
    fileId: string,
    organizationId: string
): Promise<{ success: boolean; chunksProcessed?: number; error?: string }> {
    try {
        const { data, error } = await supabase.functions.invoke(
            'ingest-knowledge-base',
            { body: { fileId, organizationId } }
        );

        if (error) {
            return { success: false, error: error.message };
        }

        return {
            success: true,
            chunksProcessed: data?.chunksProcessed || 0
        };
    } catch (error) {
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error'
        };
    }
}

/**
 * Check if organization has any indexed documents
 */
export async function hasIndexedDocuments(organizationId: string): Promise<boolean> {
    const { count, error } = await supabase
        .from('organization_document_chunks')
        .select('id', { count: 'exact', head: true })
        .eq('organization_id', organizationId);

    if (error) {
        console.error('Error checking indexed documents:', error);
        return false;
    }

    return (count || 0) > 0;
}
