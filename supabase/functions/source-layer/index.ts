
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.8.0";
import { GoogleGenerativeAI } from "https://esm.sh/@google/generative-ai@0.1.3";

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
    // Handle CORS preflight requests
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders });
    }

    try {
        // 1. Setup Clients
        const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
        const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
        const geminiKey = Deno.env.get('GEMINI_API_KEY') ?? '';

        if (!supabaseUrl || !supabaseKey || !geminiKey) {
            throw new Error("Missing Environment Variables (SUPABASE_URL, SERVICE_KEY, or GEMINI_API_KEY)");
        }

        const supabase = createClient(supabaseUrl, supabaseKey);
        const genAI = new GoogleGenerativeAI(geminiKey);
        const embeddingModel = genAI.getGenerativeModel({ model: "embedding-001" });
        const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

        const { action, payload } = await req.json();

        // ==========================================
        // ACTION: INGEST TEXT (Chunk & Embed)
        // ==========================================
        if (action === 'ingest-text') {
            const { text, metadata } = payload;

            // 1. Generate Embedding
            const result = await embeddingModel.embedContent(text);
            const embedding = result.embedding.values;

            // 2. Store in Knowledge Base (pgvector)
            const { error } = await supabase
                .from('knowledge_base')
                .insert({
                    content: text,
                    metadata: metadata,
                    embedding: embedding
                });

            if (error) throw error;

            return new Response(JSON.stringify({
                status: 'success',
                message: 'Text chunk embedded and stored.'
            }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
        }

        // ==========================================
        // ACTION: CQC CRAWLER (Real Logic)
        // ==========================================
        if (action === 'ingest-cqc') {
            const { providerId } = payload;

            console.log(`[Crawler] Starting harvest for CQC Provider: ${providerId}`);

            // FETCH REAL DATA FROM CQC API
            const response = await fetch(`https://api.cqc.org.uk/public/v1/providers/${providerId}`, {
                headers: { 'Content-Type': 'application/json' }
            });

            if (!response.ok) {
                throw new Error(`CQC API Error: ${response.status} ${response.statusText}`);
            }

            const cqcData = await response.json();

            // Extract relevant fields for our Knowledge Graph
            const inspectionSummary = `
            CQC Provider Report for ${cqcData.name} (ID: ${cqcData.providerId}).
            Overall Status: ${cqcData.registrationStatus}.
            Last Inspection Date: ${cqcData.inspectionArea?.date || 'N/A'}.
            Key Ratings:
            - Safe: ${cqcData.inspectionArea?.ratings?.find((r: any) => r.keyQuestion === 'Safe')?.rating || 'Not Rated'}
            - Effective: ${cqcData.inspectionArea?.ratings?.find((r: any) => r.keyQuestion === 'Effective')?.rating || 'Not Rated'}
            - Caring: ${cqcData.inspectionArea?.ratings?.find((r: any) => r.keyQuestion === 'Caring')?.rating || 'Not Rated'}
            - Responsive: ${cqcData.inspectionArea?.ratings?.find((r: any) => r.keyQuestion === 'Responsive')?.rating || 'Not Rated'}
            - Well-led: ${cqcData.inspectionArea?.ratings?.find((r: any) => r.keyQuestion === 'Well-led')?.rating || 'Not Rated'}
        `;

            // Generate Embedding for this Real Data
            const result = await embeddingModel.embedContent(inspectionSummary);

            // Store in Vector DB
            await supabase.from('knowledge_base').insert({
                content: inspectionSummary,
                metadata: {
                    source: 'CQC API (Live)',
                    providerId,
                    type: 'inspection_report',
                    raw_data: cqcData
                },
                embedding: result.embedding.values
            });

            return new Response(JSON.stringify({
                status: 'success',
                message: `Successfully harvested live CQC data for ${cqcData.name}`,
                data: cqcData
            }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
        }

        // ==========================================
        // ACTION: FETCH LIVE RATINGS (For Dashboard)
        // ==========================================
        if (action === 'get-live-ratings') {
            const { providerId } = payload;
            console.log(`[Dashboard] Fetching live ratings for: ${providerId}`);

            const response = await fetch(`https://api.cqc.org.uk/public/v1/providers/${providerId}`);
            if (!response.ok) throw new Error('Failed to fetch from CQC');
            const cqcData = await response.json();

            // Transform into Dashboard-friendly format
            const domains = [
                { name: 'Safe', score: cqcData.inspectionArea?.ratings?.find((r: any) => r.keyQuestion === 'Safe')?.rating || 'Not Rated' },
                { name: 'Effective', score: cqcData.inspectionArea?.ratings?.find((r: any) => r.keyQuestion === 'Effective')?.rating || 'Not Rated' },
                { name: 'Caring', score: cqcData.inspectionArea?.ratings?.find((r: any) => r.keyQuestion === 'Caring')?.rating || 'Not Rated' },
                { name: 'Responsive', score: cqcData.inspectionArea?.ratings?.find((r: any) => r.keyQuestion === 'Responsive')?.rating || 'Not Rated' },
                { name: 'Well-led', score: cqcData.inspectionArea?.ratings?.find((r: any) => r.keyQuestion === 'Well-led')?.rating || 'Not Rated' }
            ];

            return new Response(JSON.stringify({
                provider_name: cqcData.name,
                last_update: cqcData.inspectionArea?.date,
                domains
            }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
        }

        // ==========================================
        // ACTION: REASONING (RAG Pipeline)
        // ==========================================
        if (action === 'reasoning-query') {
            const { query } = payload;

            // 1. Embed the User Query
            const queryEmbResult = await embeddingModel.embedContent(query);
            const queryEmbedding = queryEmbResult.embedding.values;

            // 2. Similarity Search via RPC
            const { data: documents, error: matchError } = await supabase.rpc('match_documents', {
                query_embedding: queryEmbedding,
                match_threshold: 0.7, // Only relevant matches
                match_count: 3
            });

            if (matchError) throw matchError;

            // 3. Construct Context for LLM
            const contextText = documents?.map(d => d.content).join('\n---\n') || "No specific internal documents found.";

            // 4. Generate Answer with Gemini
            const prompt = `
        You are ComplyFlow's compliance expert. 
        Answer the user question based primarily on the context provided below.
        
        CONTEXT FROM KNOWLEDGE BASE:
        ${contextText}
        
        USER QUESTION: 
        ${query}
        
        Provide a concise, regulatory-focused answer.`;

            const chatResult = await model.generateContent(prompt);
            const responseText = chatResult.response.text();

            return new Response(JSON.stringify({
                response: responseText,
                citations: documents?.map(d => ({
                    source: d.metadata?.source || 'Internal Knowledge Base',
                    confidence: d.similarity
                }))
            }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
        }

        return new Response(JSON.stringify({ error: 'Unknown action' }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 400
        });

    } catch (error) {
        console.error("Error in Source Layer:", error);
        return new Response(JSON.stringify({ error: error.message }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 500
        });
    }
});
