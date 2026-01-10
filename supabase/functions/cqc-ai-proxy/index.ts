import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { GoogleGenerativeAI } from "https://esm.sh/@google/generative-ai@0.1.3";

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req: Request) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        const { history, message, modelName, systemInstruction, stream } = await req.json()
        const apiKey = Deno.env.get('GEMINI_API_KEY')

        if (!apiKey) {
            throw new Error('Missing GEMINI_API_KEY environment variable')
        }

        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({ model: modelName || "gemini-pro" });

        let chatHistory = [];
        if (systemInstruction) {
            chatHistory.push({
                role: 'user',
                parts: [{ text: "SYSTEM: " + systemInstruction }]
            });
            chatHistory.push({
                role: 'model',
                parts: [{ text: "Understood." }]
            });
        }

        if (history && Array.isArray(history)) {
            chatHistory = [...chatHistory, ...history];
        }

        const chat = model.startChat({
            history: chatHistory,
        });

        if (stream) {
            const result = await chat.sendMessageStream(message);

            const body = new ReadableStream({
                async start(controller) {
                    try {
                        for await (const chunk of result.stream) {
                            const text = chunk.text();
                            controller.enqueue(new TextEncoder().encode(text));
                        }
                    } catch (e) {
                        console.error("Stream error:", e);
                    } finally {
                        controller.close();
                    }
                }
            });

            return new Response(body, {
                headers: {
                    ...corsHeaders,
                    'Content-Type': 'text/plain; charset=utf-8',
                },
            });
        } else {
            const result = await chat.sendMessage(message);
            const response = await result.response;
            const text = response.text();

            return new Response(JSON.stringify({ text }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            })
        }

    } catch (error: any) {
        console.error("Edge Function Error:", error);
        return new Response(JSON.stringify({
            error: error instanceof Error ? error.message : String(error)
        }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
    }
})
