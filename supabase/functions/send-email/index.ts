import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { Resend } from "https://esm.sh/resend@2.1.0"

/**
 * ComplyFlow Email Service
 * Sends transactional emails for various events
 */

const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
}

interface EmailRequest {
    type: 'welcome' | 'payment_success' | 'payment_failed' | 'compliance_alert' | 'weekly_digest' | 'trial_expiring' | 'password_reset' | 'team_invite' | 'visa_expiry_alert';
    to: string;
    data: Record<string, any>;
}

const EMAIL_TEMPLATES = {
    welcome: (data: any) => ({
        subject: 'Welcome to ComplyFlow – Your Compliance Journey Starts Now 🎉',
        html: `
            <!DOCTYPE html>
            <html>
            <head>
                <style>
                    body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #1e293b; margin: 0; padding: 0; background: #f8fafc; }
                    .container { max-width: 600px; margin: 0 auto; background: white; }
                    .header { background: linear-gradient(135deg, #1e40af 0%, #3b82f6 100%); padding: 40px 30px; text-align: center; }
                    .header h1 { color: white; margin: 0; font-size: 28px; }
                    .header p { color: #93c5fd; margin: 10px 0 0 0; }
                    .content { padding: 40px 30px; }
                    .content h2 { color: #1e40af; margin-top: 0; }
                    .btn { display: inline-block; background: #1e40af; color: white; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: 600; margin: 20px 0; }
                    .checklist { background: #f0f9ff; padding: 20px; border-radius: 8px; margin: 20px 0; }
                    .checklist li { margin: 8px 0; }
                    .footer { background: #f1f5f9; padding: 30px; text-align: center; font-size: 14px; color: #64748b; }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <h1>🏥 ComplyFlow</h1>
                        <p>AI-Powered CQC Compliance for Care Homes</p>
                    </div>
                    <div class="content">
                        <h2>Welcome, ${data.name || 'there'}!</h2>
                        <p>Thank you for choosing ComplyFlow. You've taken the first step towards stress-free CQC compliance.</p>
                        
                        <p>Your ${data.trialDays || 14}-day free trial is now active. Here's what you can do:</p>
                        
                        <div class="checklist">
                            <strong>🚀 Quick Start Checklist:</strong>
                            <ul>
                                <li>✅ Run your first <strong>AI Gap Analysis</strong> (takes 5 mins)</li>
                                <li>✅ Practice with the <strong>Mock CQC Inspection</strong> simulator</li>
                                <li>✅ Set up <strong>Sponsor Licence monitoring</strong> for your workers</li>
                                <li>✅ Browse our <strong>Policy Templates</strong> library</li>
                            </ul>
                        </div>
                        
                        <a href="${data.dashboardUrl || 'https://complyflow.uk/dashboard'}" class="btn">Go to Dashboard →</a>
                        
                        <p>If you have any questions, just reply to this email – we're here to help!</p>
                        
                        <p>Best regards,<br><strong>The ComplyFlow Team</strong></p>
                    </div>
                    <div class="footer">
                        <p>ComplyFlow by NovumSolvo Ltd</p>
                        <p>Helping care homes stay CQC-ready</p>
                    </div>
                </div>
            </body>
            </html>
        `
    }),

    payment_success: (data: any) => ({
        subject: `🎉 Payment Confirmed – Welcome to ComplyFlow ${data.planName || 'Professional'}!`,
        html: `
            <!DOCTYPE html>
            <html>
            <head>
                <style>
                    body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #1e293b; margin: 0; padding: 0; background: #f8fafc; }
                    .container { max-width: 600px; margin: 0 auto; background: white; }
                    .header { background: linear-gradient(135deg, #059669 0%, #10b981 100%); padding: 40px 30px; text-align: center; }
                    .header h1 { color: white; margin: 0; font-size: 28px; }
                    .content { padding: 40px 30px; }
                    .receipt { background: #f0fdf4; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #10b981; }
                    .btn { display: inline-block; background: #059669; color: white; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: 600; margin: 20px 0; }
                    .footer { background: #f1f5f9; padding: 30px; text-align: center; font-size: 14px; color: #64748b; }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <h1>✅ Payment Successful</h1>
                    </div>
                    <div class="content">
                        <h2>Thank you for your payment!</h2>
                        <p>Your subscription to ComplyFlow ${data.planName || 'Professional'} is now active.</p>
                        
                        <div class="receipt">
                            <strong>Receipt Details:</strong>
                            <p>
                                <strong>Plan:</strong> ${data.planName || 'Professional'}<br>
                                <strong>Amount:</strong> £${data.amount || '49'}/month<br>
                                <strong>Date:</strong> ${new Date().toLocaleDateString('en-GB')}<br>
                                <strong>Invoice #:</strong> ${data.invoiceId || 'INV-' + Date.now()}
                            </p>
                        </div>
                        
                        <p>You now have access to:</p>
                        <ul>
                            <li>✅ Unlimited AI Gap Analyses</li>
                            <li>✅ Full Mock Inspection Simulator</li>
                            <li>✅ Priority email support</li>
                            <li>✅ Premium policy templates</li>
                        </ul>
                        
                        <a href="${data.dashboardUrl || 'https://complyflow.uk/dashboard'}" class="btn">Continue to Dashboard →</a>
                    </div>
                    <div class="footer">
                        <p>Questions about your subscription? Reply to this email.</p>
                        <p>ComplyFlow by NovumSolvo Ltd</p>
                    </div>
                </div>
            </body>
            </html>
        `
    }),

    compliance_alert: (data: any) => ({
        subject: `⚠️ Compliance Alert: ${data.title || 'Action Required'}`,
        html: `
            <!DOCTYPE html>
            <html>
            <head>
                <style>
                    body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #1e293b; margin: 0; padding: 0; background: #f8fafc; }
                    .container { max-width: 600px; margin: 0 auto; background: white; }
                    .header { background: ${data.severity === 'critical' ? '#dc2626' : '#f59e0b'}; padding: 30px; text-align: center; }
                    .header h1 { color: white; margin: 0; font-size: 24px; }
                    .content { padding: 40px 30px; }
                    .alert-box { background: ${data.severity === 'critical' ? '#fef2f2' : '#fffbeb'}; border-left: 4px solid ${data.severity === 'critical' ? '#dc2626' : '#f59e0b'}; padding: 20px; border-radius: 8px; margin: 20px 0; }
                    .btn { display: inline-block; background: #1e40af; color: white; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: 600; margin: 20px 0; }
                    .footer { background: #f1f5f9; padding: 30px; text-align: center; font-size: 14px; color: #64748b; }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <h1>${data.severity === 'critical' ? '🚨' : '⚠️'} Compliance Alert</h1>
                    </div>
                    <div class="content">
                        <h2>${data.title || 'Action Required'}</h2>
                        
                        <div class="alert-box">
                            <strong>Alert Type:</strong> ${data.alertType || 'Compliance Review'}<br>
                            <strong>Severity:</strong> ${data.severity === 'critical' ? 'CRITICAL' : 'Warning'}<br>
                            <strong>Detected:</strong> ${new Date().toLocaleDateString('en-GB')}
                        </div>
                        
                        <p>${data.description || 'Please review this compliance issue in your dashboard.'}</p>
                        
                        ${data.recommendation ? `<p><strong>Recommended Action:</strong> ${data.recommendation}</p>` : ''}
                        
                        <a href="${data.dashboardUrl || 'https://complyflow.uk/dashboard'}" class="btn">Review in Dashboard →</a>
                    </div>
                    <div class="footer">
                        <p>This is an automated alert from ComplyFlow.</p>
                        <p>Configure your notification preferences in Settings.</p>
                    </div>
                </div>
            </body>
            </html>
        `
    }),

    weekly_digest: (data: any) => ({
        subject: `📊 Your Weekly Compliance Summary – ${new Date().toLocaleDateString('en-GB', { month: 'short', day: 'numeric' })}`,
        html: `
            <!DOCTYPE html>
            <html>
            <head>
                <style>
                    body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #1e293b; margin: 0; padding: 0; background: #f8fafc; }
                    .container { max-width: 600px; margin: 0 auto; background: white; }
                    .header { background: linear-gradient(135deg, #1e40af 0%, #3b82f6 100%); padding: 40px 30px; text-align: center; }
                    .header h1 { color: white; margin: 0; font-size: 24px; }
                    .content { padding: 40px 30px; }
                    .stat-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 15px; margin: 20px 0; }
                    .stat-box { background: #f0f9ff; padding: 15px; border-radius: 8px; text-align: center; }
                    .stat-number { font-size: 28px; font-weight: bold; color: #1e40af; }
                    .stat-label { font-size: 12px; color: #64748b; text-transform: uppercase; }
                    .updates-section { background: #faf5ff; padding: 20px; border-radius: 8px; margin: 20px 0; }
                    .btn { display: inline-block; background: #1e40af; color: white; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: 600; margin: 20px 0; }
                    .footer { background: #f1f5f9; padding: 30px; text-align: center; font-size: 14px; color: #64748b; }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <h1>📊 Weekly Compliance Digest</h1>
                        <p style="color: #93c5fd; margin: 10px 0 0 0;">${data.organizationName || 'Your Organization'}</p>
                    </div>
                    <div class="content">
                        <h2>Week of ${new Date().toLocaleDateString('en-GB', { month: 'long', day: 'numeric' })}</h2>
                        
                        <div class="stat-grid">
                            <div class="stat-box">
                                <div class="stat-number">${data.complianceScore || '--'}%</div>
                                <div class="stat-label">Compliance Score</div>
                            </div>
                            <div class="stat-box">
                                <div class="stat-number">${data.alertsResolved || 0}</div>
                                <div class="stat-label">Alerts Resolved</div>
                            </div>
                            <div class="stat-box">
                                <div class="stat-number">${data.trainingsCompleted || 0}</div>
                                <div class="stat-label">Trainings Done</div>
                            </div>
                            <div class="stat-box">
                                <div class="stat-number">${data.visasExpiringSoon || 0}</div>
                                <div class="stat-label">Visas Expiring Soon</div>
                            </div>
                        </div>
                        
                        <div class="updates-section">
                            <strong>🔔 Regulatory Updates This Week:</strong>
                            <p>${data.regulatoryUpdates || 'No new regulatory updates this week.'}</p>
                        </div>
                        
                        ${data.actionItems ? `
                        <p><strong>📋 Action Items:</strong></p>
                        <ul>
                            ${data.actionItems.map((item: string) => `<li>${item}</li>`).join('')}
                        </ul>
                        ` : ''}
                        
                        <a href="${data.dashboardUrl || 'https://complyflow.uk/dashboard'}" class="btn">View Full Dashboard →</a>
                    </div>
                    <div class="footer">
                        <p>Unsubscribe from weekly digests in your Settings.</p>
                        <p>ComplyFlow by NovumSolvo Ltd</p>
                    </div>
                </div>
            </body>
            </html>
        `
    }),

    trial_expiring: (data: any) => ({
        subject: `⏰ Your ComplyFlow trial expires in ${data.daysLeft || 3} days`,
        html: `
            <!DOCTYPE html>
            <html>
            <head>
                <style>
                    body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #1e293b; margin: 0; padding: 0; background: #f8fafc; }
                    .container { max-width: 600px; margin: 0 auto; background: white; }
                    .header { background: linear-gradient(135deg, #f59e0b 0%, #fbbf24 100%); padding: 40px 30px; text-align: center; }
                    .header h1 { color: white; margin: 0; font-size: 28px; }
                    .content { padding: 40px 30px; }
                    .countdown { background: #fffbeb; border: 2px solid #f59e0b; padding: 20px; border-radius: 8px; text-align: center; margin: 20px 0; }
                    .countdown strong { font-size: 48px; color: #f59e0b; }
                    .btn { display: inline-block; background: #1e40af; color: white; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: 600; margin: 20px 0; }
                    .btn-secondary { background: white; color: #1e40af; border: 2px solid #1e40af; }
                    .footer { background: #f1f5f9; padding: 30px; text-align: center; font-size: 14px; color: #64748b; }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <h1>⏰ Trial Ending Soon</h1>
                    </div>
                    <div class="content">
                        <h2>Don't lose access to ComplyFlow!</h2>
                        
                        <div class="countdown">
                            <strong>${data.daysLeft || 3}</strong>
                            <p style="margin: 5px 0 0 0; color: #92400e;">days remaining</p>
                        </div>
                        
                        <p>Your free trial of ComplyFlow Professional will expire on <strong>${data.expiryDate || 'soon'}</strong>.</p>
                        
                        <p>Upgrade now to keep:</p>
                        <ul>
                            <li>✅ All your compliance data and analyses</li>
                            <li>✅ Staff training records</li>
                            <li>✅ Policy documents</li>
                            <li>✅ Sponsor licence tracking</li>
                        </ul>
                        
                        <a href="${data.pricingUrl || 'https://complyflow.uk/pricing'}" class="btn">Upgrade Now – From £49/month →</a>
                        
                        <p style="font-size: 14px; color: #64748b; margin-top: 30px;">Need more time? Reply to this email and we'll extend your trial.</p>
                    </div>
                    <div class="footer">
                        <p>ComplyFlow by NovumSolvo Ltd</p>
                    </div>
                </div>
            </body>
            </html>
        `
    }),

    team_invite: (data: any) => ({
        subject: `You've been invited to join ${data.organizationName || 'a care home'} on ComplyFlow`,
        html: `
            <!DOCTYPE html>
            <html>
            <head>
                <style>
                    body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #1e293b; margin: 0; padding: 0; background: #f8fafc; }
                    .container { max-width: 600px; margin: 0 auto; background: white; }
                    .header { background: linear-gradient(135deg, #1e40af 0%, #3b82f6 100%); padding: 40px 30px; text-align: center; }
                    .header h1 { color: white; margin: 0; font-size: 28px; }
                    .content { padding: 40px 30px; }
                    .invite-box { background: #f0f9ff; border: 2px dashed #3b82f6; padding: 25px; border-radius: 8px; text-align: center; margin: 20px 0; }
                    .btn { display: inline-block; background: #1e40af; color: white; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: 600; margin: 20px 0; }
                    .footer { background: #f1f5f9; padding: 30px; text-align: center; font-size: 14px; color: #64748b; }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <h1>🤝 You're Invited!</h1>
                    </div>
                    <div class="content">
                        <h2>Join ${data.organizationName || 'your care home'} on ComplyFlow</h2>
                        
                        <p><strong>${data.inviterName || 'A colleague'}</strong> has invited you to join their team on ComplyFlow – the AI-powered CQC compliance platform.</p>
                        
                        <div class="invite-box">
                            <p style="margin: 0; color: #1e40af;"><strong>Your Role:</strong> ${data.role || 'Team Member'}</p>
                        </div>
                        
                        <p>With ComplyFlow, you'll be able to:</p>
                        <ul>
                            <li>Complete compliance training modules</li>
                            <li>Access policies and procedures</li>
                            <li>View your Right-to-Work status</li>
                            <li>Prepare for CQC inspections</li>
                        </ul>
                        
                        <a href="${data.inviteUrl || 'https://complyflow.uk/accept-invite'}" class="btn">Accept Invitation →</a>
                        
                        <p style="font-size: 14px; color: #64748b;">This invitation expires in 7 days.</p>
                    </div>
                    <div class="footer">
                        <p>If you weren't expecting this invitation, you can ignore this email.</p>
                        <p>ComplyFlow by NovumSolvo Ltd</p>
                    </div>
                </div>
            </body>
            </html>
        `
    }),

    password_reset: (data: any) => ({
        subject: 'Reset your ComplyFlow password',
        html: `
            <!DOCTYPE html>
            <html>
            <head>
                <style>
                    body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #1e293b; margin: 0; padding: 0; background: #f8fafc; }
                    .container { max-width: 600px; margin: 0 auto; background: white; }
                    .header { background: #1e293b; padding: 30px; text-align: center; }
                    .header h1 { color: white; margin: 0; font-size: 24px; }
                    .content { padding: 40px 30px; }
                    .btn { display: inline-block; background: #1e40af; color: white; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: 600; margin: 20px 0; }
                    .footer { background: #f1f5f9; padding: 30px; text-align: center; font-size: 14px; color: #64748b; }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <h1>🔒 Password Reset</h1>
                    </div>
                    <div class="content">
                        <h2>Reset your password</h2>
                        <p>We received a request to reset your ComplyFlow password. Click the button below to create a new password:</p>
                        
                        <a href="${data.resetUrl || '#'}" class="btn">Reset Password →</a>
                        
                        <p style="font-size: 14px; color: #64748b; margin-top: 30px;">This link expires in 1 hour. If you didn't request a password reset, you can ignore this email.</p>
                    </div>
                    <div class="footer">
                        <p>ComplyFlow by NovumSolvo Ltd</p>
                    </div>
                </div>
            </body>
            </html>
        `
    }),

    payment_failed: (data: any) => ({
        subject: '⚠️ Payment Failed – Action Required',
        html: `
            <!DOCTYPE html>
            <html>
            <head>
                <style>
                    body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #1e293b; margin: 0; padding: 0; background: #f8fafc; }
                    .container { max-width: 600px; margin: 0 auto; background: white; }
                    .header { background: linear-gradient(135deg, #dc2626 0%, #ef4444 100%); padding: 40px 30px; text-align: center; }
                    .header h1 { color: white; margin: 0; font-size: 28px; }
                    .content { padding: 40px 30px; }
                    .alert-box { background: #fef2f2; border-left: 4px solid #dc2626; padding: 20px; border-radius: 8px; margin: 20px 0; }
                    .btn { display: inline-block; background: #1e40af; color: white; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: 600; margin: 20px 0; }
                    .footer { background: #f1f5f9; padding: 30px; text-align: center; font-size: 14px; color: #64748b; }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <h1>❌ Payment Failed</h1>
                    </div>
                    <div class="content">
                        <h2>We couldn't process your payment</h2>
                        
                        <div class="alert-box">
                            <strong>Reason:</strong> ${data.reason || 'Your payment method was declined.'}
                        </div>
                        
                        <p>Please update your payment method to avoid any interruption to your ComplyFlow subscription.</p>
                        
                        <p><strong>What happens next?</strong></p>
                        <ul>
                            <li>We'll retry the payment in 3 days</li>
                            <li>Your access remains active during this time</li>
                            <li>Update your payment method now to avoid issues</li>
                        </ul>
                        
                        <a href="${data.billingUrl || 'https://complyflow.uk/settings/billing'}" class="btn">Update Payment Method →</a>
                        
                        <p style="font-size: 14px; color: #64748b; margin-top: 30px;">Need help? Reply to this email and we'll assist you.</p>
                    </div>
                    <div class="footer">
                        <p>ComplyFlow by NovumSolvo Ltd</p>
                    </div>
                </div>
            </body>
            </html>
        `
    }),

    visa_expiry_alert: (data: any) => ({
        subject: `⚠️ Visa Expiry Alert: ${data.workerName || 'Staff Member'} (${data.daysRemaining} days remaining)`,
        html: `
            <!DOCTYPE html>
            <html>
            <head>
                <style>
                    body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #1e293b; margin: 0; padding: 0; background: #f8fafc; }
                    .container { max-width: 600px; margin: 0 auto; background: white; }
                    .header { background: ${data.daysRemaining <= 30 ? '#dc2626' : '#f59e0b'}; padding: 40px 30px; text-align: center; }
                    .header h1 { color: white; margin: 0; font-size: 28px; }
                    .content { padding: 40px 30px; }
                    .alert-box { background: ${data.daysRemaining <= 30 ? '#fef2f2' : '#fffbeb'}; border-left: 4px solid ${data.daysRemaining <= 30 ? '#dc2626' : '#f59e0b'}; padding: 20px; border-radius: 8px; margin: 20px 0; }
                    .btn { display: inline-block; background: #1e40af; color: white; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: 600; margin: 20px 0; }
                    .footer { background: #f1f5f9; padding: 30px; text-align: center; font-size: 14px; color: #64748b; }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <h1>🚨 Visa Expiry Alert</h1>
                    </div>
                    <div class="content">
                        <h2>Action Required: Visa Renewal</h2>
                        <p>This is an automated alert from ComplyFlow regarding a sponsored worker's visa status.</p>
                        
                        <div class="alert-box">
                            <strong>Worker Name:</strong> ${data.workerName || 'N/A'}<br>
                            <strong>Visa Type:</strong> ${data.visaType || 'N/A'}<br>
                            <strong>Expiry Date:</strong> ${data.expiryDate || 'N/A'}<br>
                            <strong>Status:</strong> <span style="color: ${data.daysRemaining <= 30 ? '#dc2626' : '#d97706'}; font-weight: bold;">Expires in ${data.daysRemaining} days</span>
                        </div>
                        
                        <p><strong>Required Actions:</strong></p>
                        <ul>
                            <li>Contact the worker to confirm renewal plans</li>
                            <li>Review Certificate of Sponsorship (CoS) allocation</li>
                            <li>Update the reporting log once renewal is initiated</li>
                        </ul>
                        
                        <a href="${data.dashboardUrl || 'https://complyflow.uk/sponsor-guardian'}" class="btn">View Worker Details →</a>
                        
                        <p style="font-size: 14px; color: #64748b; margin-top: 30px;">This is a critical compliance notification. Failure to manage visa expiries can lead to Sponsor Licence suspension.</p>
                    </div>
                    <div class="footer">
                        <p>ComplyFlow by NovumSolvo Ltd</p>
                        <p>Helping care homes stay CQC and Home Office compliant</p>
                    </div>
                </div>
            </body>
            </html>
        `
    })
}

serve(async (req: Request) => {
    if (req.method === "OPTIONS") {
        return new Response("ok", { headers: corsHeaders })
    }

    try {
        const resendApiKey = Deno.env.get("RESEND_API_KEY")
        if (!resendApiKey) {
            throw new Error("RESEND_API_KEY is not configured")
        }

        const resend = new Resend(resendApiKey)
        const { type, to, data }: EmailRequest = await req.json()

        if (!type || !to) {
            throw new Error("Missing required fields: type, to")
        }

        const template = EMAIL_TEMPLATES[type]
        if (!template) {
            throw new Error(`Unknown email type: ${type}`)
        }

        const { subject, html } = template(data || {})

        const { data: emailData, error } = await resend.emails.send({
            from: 'ComplyFlow <noreply@complyflow.uk>',
            to: [to],
            subject,
            html
        })

        if (error) {
            throw new Error(`Resend error: ${error.message}`)
        }

        return new Response(
            JSON.stringify({ success: true, messageId: emailData?.id }),
            { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        )

    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error)
        console.error('Email error:', error)
        return new Response(
            JSON.stringify({ error: errorMessage }),
            {
                headers: { ...corsHeaders, "Content-Type": "application/json" },
                status: 500
            }
        )
    }
})
