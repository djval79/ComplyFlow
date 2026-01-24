import { supabase } from '../lib/supabase';
import { callEdgeFunctionAI } from './aiCore';

export interface EvidenceItem {
    id: string;
    organization_id: string;
    name: string;
    file_path: string;
    file_type?: string;
    file_size?: number;
    quality_statement_id?: string;
    key_question?: 'safe' | 'effective' | 'caring' | 'responsive' | 'wellLed';
    evidence_type?: string; // New: corresponds to the ID in requiredEvidence
    category?: string;
    status: 'pending' | 'verified' | 'archived' | 'expiring';
    expiration_date?: string;
    ai_confidence?: number;
    ai_reasoning?: string;
    created_at: string;
    updated_at: string;
    uploaded_by?: string;
}

/**
 * Get all evidence for the organization
 */
export async function getEvidence(organizationId: string): Promise<EvidenceItem[]> {
    const { data, error } = await supabase
        .from('evidence_vault')
        .select('*')
        .eq('organization_id', organizationId)
        .order('created_at', { ascending: false });

    if (error) {
        console.error('Error fetching evidence:', error);
        throw error;
    }

    return data || [];
}

/**
 * Upload a new evidence file
 */
export async function uploadEvidence(
    organizationId: string,
    file: File,
    options?: {
        quality_statement_id?: string;
        key_question?: EvidenceItem['key_question'];
        category?: string;
        expiration_date?: string;
        ai_confidence?: number;
        ai_reasoning?: string;
    }
): Promise<EvidenceItem> {
    const { data: { user } } = await supabase.auth.getUser();

    // 1. Generate path
    const fileExt = file.name.split('.').pop();
    const fileName = `${Math.random().toString(36).substring(2)}_${Date.now()}.${fileExt}`;
    const filePath = `${organizationId}/vault/${fileName}`;

    // 2. Upload to Storage
    const { error: uploadError } = await supabase.storage
        .from('compliance-evidence')
        .upload(filePath, file);

    if (uploadError) {
        console.error('Upload error:', uploadError);
        throw uploadError;
    }

    // 3. AI Auto-tagging (if not manually provided)
    let aiOptions = {};
    if (!options?.quality_statement_id) {
        try {
            // Requesting AI auto-tagging for the new file
            const suggestion = await suggestTagging(file.name, options?.category);
            aiOptions = {
                quality_statement_id: suggestion.quality_statement_id,
                key_question: suggestion.key_question,
                ai_confidence: suggestion.confidence,
                ai_reasoning: suggestion.reasoning
            };
        } catch (err) {
            console.warn('AI Auto-tagging failed during upload:', err);
        }
    }

    // 4. Insert metadata
    const { data, error: insertError } = await supabase
        .from('evidence_vault')
        .insert({
            organization_id: organizationId,
            name: file.name,
            file_path: filePath,
            file_type: file.type,
            file_size: file.size,
            uploaded_by: user?.id,
            status: 'pending',
            ...aiOptions,
            ...options
        })
        .select()
        .single();

    if (insertError) {
        console.error('Insert error:', insertError);
        throw insertError;
    }

    return data;
}

/**
 * AI Auto-tagging: Suggest Quality Statement based on file metadata
 */
export async function suggestTagging(fileName: string, category?: string): Promise<{
    quality_statement_id?: string;
    key_question?: EvidenceItem['key_question'];
    evidence_type?: string;
    reasoning: string;
    confidence: number;
}> {
    try {
        const prompt = `
        You are a CQC Compliance Expert. Analyze this document metadata and suggest the most relevant CQC Quality Statement and Key Question it supports.
        
        DOCUMENT NAME: "${fileName}"
        CATEGORY: "${category || 'General'}"
        
        Respond ONLY with a JSON object in this format:
        {
            "quality_statement_id": "S1-S8 or E1-E7 or C1-C5 or R1-R7 or W1-W8",
            "key_question": "safe | effective | caring | responsive | wellLed",
            "evidence_type": "The ID of the specific required evidence if identified (e.g., S3-E1)",
            "reasoning": "Brief explanation",
            "confidence": 0.0 to 1.0
        }
        `;

        const result = await callEdgeFunctionAI('cqc-ai-proxy', {
            message: prompt,
            modelName: 'gemini-2.0-flash',
            systemInstruction: 'You are a document analyzer. Respond ONLY with valid JSON.'
        });

        const parsed = JSON.parse(result.text.replace(/```json\n?|\n?```/g, ''));
        return parsed;
    } catch (err) {
        console.error('AI Suggestion error:', err);
        return {
            reasoning: 'AI mapping failed. Please categorize manually.',
            confidence: 0
        };
    }
}

/**
 * Update evidence metadata (including manual verification)
 */
export async function updateEvidence(
    id: string,
    updates: Partial<EvidenceItem>
): Promise<EvidenceItem> {
    const { data, error } = await supabase
        .from('evidence_vault')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

    if (error) {
        console.error('Update error:', error);
        throw error;
    }

    return data;
}

/**
 * Delete evidence
 */
export async function deleteEvidence(id: string, filePath: string): Promise<void> {
    // 1. Delete from Storage
    const { error: storageError } = await supabase.storage
        .from('compliance-evidence')
        .remove([filePath]);

    if (storageError) {
        console.warn('Could not delete from storage, proceeding with DB deletion:', storageError);
    }

    // 2. Delete from DB
    const { error: dbError } = await supabase
        .from('evidence_vault')
        .delete()
        .eq('id', id);

    if (dbError) {
        console.error('DB deletion error:', dbError);
        throw dbError;
    }
}

/**
 * Get Public URL for a file
 */
export function getEvidenceUrl(filePath: string): string {
    const { data: { publicUrl } } = supabase.storage
        .from('compliance-evidence')
        .getPublicUrl(filePath);
    return publicUrl;
}
