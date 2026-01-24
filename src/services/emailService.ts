// Email Service for ComplyFlow
// Integrates with the send-email Edge Function

import { supabase } from '../lib/supabase';

export type EmailType =
    | 'welcome'
    | 'payment_success'
    | 'payment_failed'
    | 'compliance_alert'
    | 'weekly_digest'
    | 'trial_expiring'
    | 'password_reset'
    | 'team_invite'
    | 'visa_expiry_alert';

interface SendEmailOptions {
    type: EmailType;
    to: string;
    data?: Record<string, any>;
}

/**
 * Send a transactional email via the send-email Edge Function
 */
export async function sendEmail({ type, to, data }: SendEmailOptions): Promise<{ success: boolean; messageId?: string; error?: string }> {
    try {
        const { data: result, error } = await supabase.functions.invoke('send-email', {
            body: { type, to, data }
        });

        if (error) {
            console.error('Email send error:', error);
            return { success: false, error: error.message };
        }

        return { success: true, messageId: result?.messageId };
    } catch (error: any) {
        console.error('Email service error:', error);
        return { success: false, error: error.message };
    }
}

/**
 * Send welcome email to new users
 */
export async function sendWelcomeEmail(
    email: string,
    name: string,
    dashboardUrl: string = 'https://complyflow.uk/dashboard'
): Promise<boolean> {
    const result = await sendEmail({
        type: 'welcome',
        to: email,
        data: { name, dashboardUrl, trialDays: 14 }
    });
    return result.success;
}

/**
 * Send payment success email
 */
export async function sendPaymentSuccessEmail(
    email: string,
    planName: string,
    amount: number,
    invoiceId: string
): Promise<boolean> {
    const result = await sendEmail({
        type: 'payment_success',
        to: email,
        data: { planName, amount, invoiceId }
    });
    return result.success;
}

/**
 * Send compliance alert email
 */
export async function sendComplianceAlertEmail(
    email: string,
    title: string,
    description: string,
    severity: 'warning' | 'critical' = 'warning',
    alertType: string = 'Compliance Review'
): Promise<boolean> {
    const result = await sendEmail({
        type: 'compliance_alert',
        to: email,
        data: { title, description, severity, alertType }
    });
    return result.success;
}

/**
 * Send weekly digest email
 */
export async function sendWeeklyDigestEmail(
    email: string,
    organizationName: string,
    stats: {
        complianceScore?: number;
        alertsResolved?: number;
        trainingsCompleted?: number;
        visasExpiringSoon?: number;
        regulatoryUpdates?: string;
        actionItems?: string[];
    }
): Promise<boolean> {
    const result = await sendEmail({
        type: 'weekly_digest',
        to: email,
        data: { organizationName, ...stats }
    });
    return result.success;
}

/**
 * Send trial expiring reminder
 */
export async function sendTrialExpiringEmail(
    email: string,
    daysLeft: number,
    expiryDate: string
): Promise<boolean> {
    const result = await sendEmail({
        type: 'trial_expiring',
        to: email,
        data: { daysLeft, expiryDate, pricingUrl: 'https://complyflow.uk/pricing' }
    });
    return result.success;
}

/**
 * Send team invite email
 */
export async function sendTeamInviteEmail(
    email: string,
    inviterName: string,
    organizationName: string,
    role: string,
    inviteUrl: string
): Promise<boolean> {
    const result = await sendEmail({
        type: 'team_invite',
        to: email,
        data: { inviterName, organizationName, role, inviteUrl }
    });
    return result.success;
}

/**
 * Send visa expiry alert email
 */
export async function sendVisaExpiryEmail(
    email: string,
    workerName: string,
    visaType: string,
    expiryDate: string,
    daysRemaining: number,
    dashboardUrl: string = 'https://complyflow.uk/sponsor-guardian'
): Promise<boolean> {
    const result = await sendEmail({
        type: 'visa_expiry_alert',
        to: email,
        data: { workerName, visaType, expiryDate, daysRemaining, dashboardUrl }
    });
    return result.success;
}
