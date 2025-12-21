
import { supabase } from '../lib/supabase';

// Definition of the API payload structure
type SourceLayerAction =
    | 'ingest-cqc'
    | 'ingest-govuk-pdf'
    | 'reasoning-query';

interface SourceLayerResponse {
    status?: string;
    message?: string;
    response?: string;
    citations?: Array<{ source: string, url: string, confidence: number }>;
    error?: string;
}

export const sourceLayerApi = {

    /**
     * Trigger a new crawl of the CQC API for a specific provider.
     */
    triggerCqcIngest: async (providerId: string) => {
        const { data, error } = await supabase.functions.invoke('source-layer', {
            body: { action: 'ingest-cqc', payload: { providerId } }
        });
        if (error) throw error;
        return data as SourceLayerResponse;
    },

    /**
     * Queue a GOV.UK PDF for ingestion, chunking, and vector embedding.
     */
    ingestGovDoc: async (docUrl: string) => {
        const { data, error } = await supabase.functions.invoke('source-layer', {
            body: { action: 'ingest-govuk-pdf', payload: { docUrl } }
        });
        if (error) throw error;
        return data as SourceLayerResponse;
    },

    /**
     * Query the Knowledge Engine (RAG Pipeline).
     */
    queryKnowledgeBase: async (query: string, context?: any) => {
        const { data, error } = await supabase.functions.invoke('source-layer', {
            body: { action: 'reasoning-query', payload: { query, context } }
        });
        if (error) throw error;
        return data as SourceLayerResponse;
    }
};
