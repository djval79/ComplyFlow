import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { GoogleGenerativeAI } from "https://esm.sh/@google/generative-ai@0.1.3";
// Text extraction packages would go here (e.g., pdf-parse), but for stability in this demo we will handle text files or assume text content is passed if possible, 
// or implement a basic text extractor. For now, we will focus on the pipeline logic.

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders });
    }

    try {
        const { fileId, organizationId } = await req.json();

        if (!fileId || !organizationId) {
            throw new Error('Missing fileId or organizationId');
        }

        // 1. Init Supabase
        const supabaseClient = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
        );

        // 2. Fetch File Metadata
        const { data: fileRecord, error: fetchError } = await supabaseClient
            .from('organization_knowledge_base')
            .select('*')
            .eq('id', fileId)
            .single();

        if (fetchError || !fileRecord) {
            throw new Error('File record not found');
        }

        // 3. Download File from Storage
        const { data: fileBlob, error: downloadError } = await supabaseClient
            .storage
            .from('knowledge_base')
            .download(fileRecord.storage_path);

        if (downloadError || !fileBlob) {
            throw new Error('Failed to download file from storage');
        }

        // 4. Extract Text
        // NOTE: This is a placeholder. Real implementation needs robust PDF/DOCX parsing.
        // For this MVP, we try to read as text. If it is binary (PDF), this will fail or produce garbage.
        // Ideally, call a Python service or use a Deno-compatible PDF parser like 'pdf-parse' (which requires Node polyfills).
        // optimizing: We will assume it's a text file or try to text() it.
        const textContent = await fileBlob.text();

        // Quick sanitization (remove binary chars if any) or just take mostly valid text
        const cleanText = textContent.replace(/[\x00-\x08\x0E-\x1F\x7F-\uFFFF]/g, "");

        if (cleanText.length < 50) {
            // If text is too short, maybe it was a binary file we failed to read.
            console.warn("Text content too short, skipping embedding generation.");
        }

        // 5. Chunk Text
        const chunkSize = 1000;
        const overlap = 200;
        const chunks = [];
        for (let i = 0; i < cleanText.length; i += (chunkSize - overlap)) {
            chunks.push(cleanText.slice(i, i + chunkSize));
        }

        // 6. Generate Embeddings (Gemini)
        const genAI = new GoogleGenerativeAI(Deno.env.get('GEMINI_API_KEY')!);
        const model = genAI.getGenerativeModel({ model: "embedding-001" });

        const vectorsToInsert = [];
        for (const chunk of chunks) {
            if (!chunk.trim()) continue;

            const result = await model.embedContent(chunk);
            const embedding = result.embedding.values; // Array of numbers

            vectorsToInsert.push({
                organization_id: organizationId,
                file_id: fileId,
                content: chunk,
                metadata: { source: fileRecord.file_name },
                embedding: embedding
            });
        }

        // 7. Store Vectors
        const { error: insertError } = await supabaseClient
            .from('organization_document_chunks')
            .insert(vectorsToInsert);

        if (insertError) throw insertError;

        // 8. Update File Status
        await supabaseClient
            .from('organization_knowledge_base')
            .update({ status: 'active' })
            .eq('id', fileId);

        return new Response(
            JSON.stringify({ success: true, chunksProcessed: vectorsToInsert.length }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );

    } catch (error) {
        return new Response(
            JSON.stringify({ error: error.message }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
    }
});
