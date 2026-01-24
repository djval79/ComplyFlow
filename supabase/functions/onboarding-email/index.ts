// Onboarding Email Sequence - Phase 5 Marketing
// Triggers welcome emails and follow-up sequence for new signups

import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SUPABASE_SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

interface EmailPayload {
    userId: string
    email: string
    fullName: string
    emailType: 'welcome' | 'day_3' | 'day_7' | 'trial_ending'
}

const EMAIL_TEMPLATES = {
    welcome: {
        subject: '🎉 Welcome to ComplyFlow - Let\'s get you CQC-ready!',
        html: (name: string) => `
            <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 2rem;">
                <div style="text-align: center; margin-bottom: 2rem;">
                    <div style="display: inline-block; width: 48px; height: 48px; background: #4f46e5; border-radius: 12px; line-height: 48px; color: white; font-size: 24px;">🛡️</div>
                </div>
                
                <h1 style="font-size: 24px; margin-bottom: 1rem;">Welcome to ComplyFlow, ${name}!</h1>
                
                <p style="color: #64748b; line-height: 1.6;">
                    You've just taken the first step towards stress-free CQC compliance. 
                    Our AI-powered platform is designed to help care homes like yours stay inspection-ready 24/7.
                </p>
                
                <div style="background: #f8fafc; border-radius: 8px; padding: 1.5rem; margin: 1.5rem 0;">
                    <h3 style="margin-top: 0;">🚀 Quick Start Checklist:</h3>
                    <ul style="color: #64748b; line-height: 1.8;">
                        <li><strong>Run your first Gap Analysis</strong> – Upload a policy and get instant AI feedback</li>
                        <li><strong>Explore the Evidence Vault</strong> – Store and tag your CQC evidence</li>
                        <li><strong>Try the Mock Inspection</strong> – Prepare for inspector questions</li>
                    </ul>
                </div>
                
                <a href="https://complyflow.uk/dashboard" style="display: inline-block; background: #4f46e5; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 600;">
                    Go to Dashboard →
                </a>
                
                <p style="color: #94a3b8; font-size: 14px; margin-top: 2rem;">
                    Questions? Just reply to this email – we read every message.<br>
                    — The ComplyFlow Team
                </p>
            </div>
        `
    },
    day_3: {
        subject: '💡 3 ways to get the most from ComplyFlow this week',
        html: (name: string) => `
            <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 2rem;">
                <h1 style="font-size: 24px; margin-bottom: 1rem;">Hey ${name}, how's it going?</h1>
                
                <p style="color: #64748b; line-height: 1.6;">
                    You've been with us for 3 days now. Here are some features our most successful users are loving:
                </p>
                
                <div style="margin: 1.5rem 0;">
                    <div style="padding: 1rem; border-left: 3px solid #4f46e5; margin-bottom: 1rem;">
                        <strong>🤖 AI CQC Advisor</strong><br>
                        <span style="color: #64748b;">Ask any compliance question and get instant, evidence-based answers.</span>
                    </div>
                    <div style="padding: 1rem; border-left: 3px solid #10b981; margin-bottom: 1rem;">
                        <strong>📊 Regulatory Intelligence</strong><br>
                        <span style="color: #64748b;">Stay ahead of CQC changes with our curated news feed.</span>
                    </div>
                    <div style="padding: 1rem; border-left: 3px solid #f59e0b; margin-bottom: 1rem;">
                        <strong>📝 Policy Templates</strong><br>
                        <span style="color: #64748b;">30+ CQC-compliant templates ready to customize.</span>
                    </div>
                </div>
                
                <a href="https://complyflow.uk/cqc/advisor" style="display: inline-block; background: #4f46e5; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 600;">
                    Try AI Advisor →
                </a>
                
                <p style="color: #94a3b8; font-size: 14px; margin-top: 2rem;">
                    — The ComplyFlow Team
                </p>
            </div>
        `
    },
    day_7: {
        subject: '📈 Your first week with ComplyFlow - what\'s next?',
        html: (name: string) => `
            <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 2rem;">
                <h1 style="font-size: 24px; margin-bottom: 1rem;">One week in, ${name}! 🎉</h1>
                
                <p style="color: #64748b; line-height: 1.6;">
                    You've had a full week to explore. Care homes using ComplyFlow save an average of 
                    <strong>4.2 hours per week</strong> on compliance tasks.
                </p>
                
                <div style="background: #f0fdf4; border: 1px solid #86efac; border-radius: 8px; padding: 1.5rem; margin: 1.5rem 0;">
                    <h3 style="margin-top: 0; color: #166534;">💬 What our users say:</h3>
                    <p style="color: #15803d; font-style: italic;">
                        "ComplyFlow helped us go from Requires Improvement to Good in just 3 months. 
                        The AI Gap Analysis was a game-changer."
                    </p>
                    <p style="color: #166534; font-size: 14px; margin-bottom: 0;">
                        — Sarah M., Registered Manager
                    </p>
                </div>
                
                <p style="color: #64748b; line-height: 1.6;">
                    Ready to upgrade? Get unlimited AI analyses and priority support with Pro.
                </p>
                
                <a href="https://complyflow.uk/pricing" style="display: inline-block; background: #4f46e5; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 600;">
                    View Plans →
                </a>
                
                <p style="color: #94a3b8; font-size: 14px; margin-top: 2rem;">
                    — The ComplyFlow Team
                </p>
            </div>
        `
    },
    trial_ending: {
        subject: '⏰ Your ComplyFlow trial ends in 3 days',
        html: (name: string) => `
            <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 2rem;">
                <h1 style="font-size: 24px; margin-bottom: 1rem;">Don't lose your progress, ${name}</h1>
                
                <p style="color: #64748b; line-height: 1.6;">
                    Your free trial ends in <strong>3 days</strong>. Upgrade now to keep all your evidence, 
                    gap analyses, and compliance history.
                </p>
                
                <div style="background: #fef3c7; border: 1px solid #fcd34d; border-radius: 8px; padding: 1.5rem; margin: 1.5rem 0;">
                    <h3 style="margin-top: 0; color: #92400e;">What you'll lose if you don't upgrade:</h3>
                    <ul style="color: #a16207; line-height: 1.8; margin-bottom: 0;">
                        <li>Unlimited AI Gap Analyses</li>
                        <li>Evidence Vault storage</li>
                        <li>Mock Inspection Centre</li>
                        <li>Priority support</li>
                    </ul>
                </div>
                
                <a href="https://complyflow.uk/pricing" style="display: inline-block; background: #4f46e5; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 600;">
                    Upgrade Now – Keep Your Data →
                </a>
                
                <p style="color: #94a3b8; font-size: 14px; margin-top: 2rem;">
                    Questions about pricing? Reply to this email.<br>
                    — The ComplyFlow Team
                </p>
            </div>
        `
    }
}

async function sendEmail(to: string, subject: string, html: string): Promise<boolean> {
    if (!RESEND_API_KEY) {
        console.log('[Onboarding] Resend API key not configured, skipping email')
        return false
    }

    try {
        const response = await fetch('https://api.resend.com/emails', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${RESEND_API_KEY}`,
            },
            body: JSON.stringify({
                from: 'ComplyFlow <hello@complyflow.uk>',
                to: [to],
                subject,
                html,
            }),
        })

        if (!response.ok) {
            const error = await response.text()
            console.error('[Onboarding] Failed to send email:', error)
            return false
        }

        return true
    } catch (error) {
        console.error('[Onboarding] Email error:', error)
        return false
    }
}

serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        const payload: EmailPayload = await req.json()
        const { userId, email, fullName, emailType } = payload

        if (!email || !emailType) {
            return new Response(JSON.stringify({ error: 'Missing required fields' }), {
                status: 400,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            })
        }

        const template = EMAIL_TEMPLATES[emailType]
        if (!template) {
            return new Response(JSON.stringify({ error: 'Invalid email type' }), {
                status: 400,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            })
        }

        const firstName = fullName?.split(' ')[0] || 'there'
        const success = await sendEmail(email, template.subject, template.html(firstName))

        // Track in database
        const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)
        await supabase.from('onboarding_emails').insert({
            user_id: userId,
            email_type: emailType,
            sent_at: new Date().toISOString()
        })

        return new Response(JSON.stringify({ success }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })
    } catch (error) {
        console.error('[Onboarding] Error:', error)
        return new Response(JSON.stringify({ error: 'Internal server error' }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })
    }
})
