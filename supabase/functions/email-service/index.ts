
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY') || 're_AKRjWJGk_2GuDgLH9fcEvmA5BSZJM1eW4';

serve(async (req: Request) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders });
    }

    try {
        const { to, subject, html, text } = await req.json();

        if (!to || !subject || (!html && !text)) {
            throw new Error("Missing required fields: to, subject, html or text");
        }

        console.log(`[EmailService] Sending email to: ${to} - Subject: ${subject}`);

        const response = await fetch('https://api.resend.com/emails', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${RESEND_API_KEY}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                from: 'ComplyFlow <notifications@novumsolvo.co.uk>',
                to,
                subject,
                html: html || text,
                text: text || html,
            }),
        });

        const data = await response.json();

        if (!response.ok) {
            console.error(`[EmailService] Resend API Error:`, data);
            throw new Error(data.message || 'Failed to send email via Resend');
        }

        return new Response(JSON.stringify({
            status: 'success',
            id: data.id
        }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

    } catch (error: any) {
        console.error("[EmailService] Error:", error);
        return new Response(JSON.stringify({ error: error.message || String(error) }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 500
        });
    }
});
