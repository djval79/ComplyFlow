import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { GoogleGenerativeAI } from "https://esm.sh/@google/generative-ai@0.1.3";

/**
 * Generate Embedding Edge Function
 * 
 * Generates vector embeddings for text using Gemini's embedding model.
 * Used for RAG similarity search.
 */

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
    // Handle CORS preflight
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders });
    }

    try {
        const { text } = await req.json();

        if (!text || typeof text !== 'string') {
            throw new Error('Missing or invalid "text" parameter');
        }

        // Truncate text if too long (embedding model has limits)
        const truncatedText = text.slice(0, 10000);

        // Initialize Gemini
        const genAI = new GoogleGenerativeAI(Deno.env.get('GEMINI_API_KEY')!);
        const model = genAI.getGenerativeModel({ model: "embedding-001" });

        // Generate embedding
        const result = await model.embedContent(truncatedText);
        const embedding = result.embedding.values;

        return new Response(
            JSON.stringify({
                success: true,
                embedding,
                dimensions: embedding.length
            }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );

    } catch (error) {
        console.error('Error generating embedding:', error);
        return new Response(
            JSON.stringify({
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error'
            }),
            {
                status: 500,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            }
        );
    }
});
