/**
 * Usage Tracking Service - Phase 3 Monetization
 * Tracks AI analysis calls and document uploads against plan limits
 */

import { supabase } from '../lib/supabase';

export type UsageType = 'ai_analysis' | 'document_upload';

interface UsageRecord {
    usage_type: UsageType;
    count: number;
}

// Plan limits configuration
const USAGE_LIMITS: Record<string, Record<UsageType, number>> = {
    free: {
        ai_analysis: 3,      // 3 analyses per month
        document_upload: 10  // 10 documents per month
    },
    trial: {
        ai_analysis: -1,     // Unlimited during trial
        document_upload: -1
    },
    pro: {
        ai_analysis: -1,     // Unlimited
        document_upload: -1
    },
    enterprise: {
        ai_analysis: -1,     // Unlimited
        document_upload: -1
    }
};

/**
 * Track a usage event for the current organization
 */
export async function trackUsage(
    organizationId: string | undefined,
    usageType: UsageType
): Promise<boolean> {
    if (!organizationId) {
        console.warn('[UsageService] No organization ID provided');
        return false;
    }

    try {
        const { error } = await supabase.rpc('increment_usage', {
            org_id: organizationId,
            u_type: usageType
        });

        if (error) {
            console.error('[UsageService] Failed to track usage:', error);
            return false;
        }

        console.log(`[UsageService] Tracked ${usageType} for org ${organizationId}`);
        return true;
    } catch (err) {
        console.error('[UsageService] Error tracking usage:', err);
        return false;
    }
}

/**
 * Get current month's usage for an organization
 */
export async function getMonthlyUsage(
    organizationId: string | undefined
): Promise<Record<UsageType, number>> {
    const defaults: Record<UsageType, number> = {
        ai_analysis: 0,
        document_upload: 0
    };

    if (!organizationId) return defaults;

    try {
        const { data, error } = await supabase.rpc('get_monthly_usage', {
            org_id: organizationId
        });

        if (error) {
            console.error('[UsageService] Failed to get usage:', error);
            return defaults;
        }

        const usage = { ...defaults };
        (data as UsageRecord[] || []).forEach(record => {
            if (record.usage_type in usage) {
                usage[record.usage_type as UsageType] = record.count;
            }
        });

        return usage;
    } catch (err) {
        console.error('[UsageService] Error getting usage:', err);
        return defaults;
    }
}

/**
 * Check if user is within their plan limits
 * Returns { allowed: boolean, remaining: number, limit: number }
 */
export async function checkUsageLimit(
    organizationId: string | undefined,
    subscriptionTier: string | undefined,
    usageType: UsageType,
    isOnTrial: boolean = false
): Promise<{ allowed: boolean; remaining: number; limit: number; current: number }> {
    const tier = isOnTrial ? 'trial' : (subscriptionTier || 'free');
    const limit = USAGE_LIMITS[tier]?.[usageType] ?? USAGE_LIMITS.free[usageType];

    // -1 means unlimited
    if (limit === -1) {
        return { allowed: true, remaining: -1, limit: -1, current: 0 };
    }

    const usage = await getMonthlyUsage(organizationId);
    const current = usage[usageType];
    const remaining = Math.max(0, limit - current);

    return {
        allowed: current < limit,
        remaining,
        limit,
        current
    };
}

/**
 * Get usage limit for a specific tier and type
 */
export function getUsageLimit(tier: string, usageType: UsageType): number {
    return USAGE_LIMITS[tier]?.[usageType] ?? USAGE_LIMITS.free[usageType];
}
