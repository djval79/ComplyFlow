/**
 * UsageWidget Component - Phase 3 Monetization
 * Dashboard widget showing current month's usage against plan limits
 */

import React from 'react';
import { BarChart3, Zap, FileText, ArrowUpRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getMonthlyUsage, getUsageLimit } from '../services/usageService';
import type { UsageType } from '../services/usageService';

interface UsageData {
    ai_analysis: number;
    document_upload: number;
}

export const UsageWidget: React.FC = () => {
    const navigate = useNavigate();
    const { profile, isDemo } = useAuth();
    const [usage, setUsage] = React.useState<UsageData>({ ai_analysis: 0, document_upload: 0 });
    const [loading, setLoading] = React.useState(true);

    const tier = profile?.subscription_tier || 'free';
    const isOnTrial = profile?.trial_ends_at && new Date(profile.trial_ends_at) > new Date();
    const effectiveTier = isOnTrial ? 'trial' : tier;

    React.useEffect(() => {
        if (profile?.organization_id && !isDemo) {
            getMonthlyUsage(profile.organization_id)
                .then(setUsage)
                .finally(() => setLoading(false));
        } else {
            setLoading(false);
        }
    }, [profile?.organization_id, isDemo]);

    const aiLimit = getUsageLimit(effectiveTier, 'ai_analysis');
    const docLimit = getUsageLimit(effectiveTier, 'document_upload');
    const isUnlimited = aiLimit === -1;

    // Calculate warning thresholds
    const aiPercentage = aiLimit > 0 ? (usage.ai_analysis / aiLimit) * 100 : 0;
    const isNearLimit = aiPercentage >= 80 && !isUnlimited;
    const isAtLimit = aiPercentage >= 100 && !isUnlimited;

    if (loading) {
        return (
            <div className="card" style={{ padding: '1.5rem' }}>
                <div style={{ opacity: 0.5, textAlign: 'center' }}>Loading usage...</div>
            </div>
        );
    }

    return (
        <div className="card" style={{ padding: '1.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <BarChart3 size={20} color="var(--color-primary)" />
                    <h3 style={{ fontSize: '1rem', fontWeight: 600, margin: 0 }}>Usage This Month</h3>
                </div>
                {isNearLimit && (
                    <span style={{
                        fontSize: '0.7rem',
                        fontWeight: 600,
                        padding: '0.25rem 0.5rem',
                        background: isAtLimit ? '#fef2f2' : '#fefce8',
                        color: isAtLimit ? '#b91c1c' : '#a16207',
                        borderRadius: '4px'
                    }}>
                        {isAtLimit ? 'LIMIT REACHED' : 'NEAR LIMIT'}
                    </span>
                )}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {/* AI Analysis Usage */}
                <div>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.9rem' }}>
                            <Zap size={16} color="var(--color-accent)" />
                            AI Gap Analyses
                        </div>
                        <span style={{ fontSize: '0.9rem', fontWeight: 600 }}>
                            {usage.ai_analysis}{isUnlimited ? '' : ` / ${aiLimit}`}
                        </span>
                    </div>
                    {!isUnlimited && (
                        <div style={{
                            height: '6px',
                            background: '#e2e8f0',
                            borderRadius: '3px',
                            overflow: 'hidden'
                        }}>
                            <div style={{
                                height: '100%',
                                width: `${Math.min(100, aiPercentage)}%`,
                                background: isAtLimit ? '#ef4444' : isNearLimit ? '#f59e0b' : 'var(--color-primary)',
                                borderRadius: '3px',
                                transition: 'width 0.3s ease'
                            }} />
                        </div>
                    )}
                    {isUnlimited && (
                        <div style={{ fontSize: '0.75rem', color: 'var(--color-text-tertiary)' }}>
                            Unlimited on {isOnTrial ? 'Trial' : 'Pro'} plan
                        </div>
                    )}
                </div>

                {/* Document Upload Usage */}
                <div>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.9rem' }}>
                            <FileText size={16} color="var(--color-primary)" />
                            Documents Uploaded
                        </div>
                        <span style={{ fontSize: '0.9rem', fontWeight: 600 }}>
                            {usage.document_upload}{docLimit === -1 ? '' : ` / ${docLimit}`}
                        </span>
                    </div>
                </div>
            </div>

            {/* Upgrade prompt for free users */}
            {!isUnlimited && tier === 'free' && (
                <button
                    onClick={() => navigate('/pricing')}
                    style={{
                        marginTop: '1.25rem',
                        width: '100%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '0.5rem',
                        padding: '0.75rem',
                        background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)',
                        color: 'white',
                        border: 'none',
                        borderRadius: '8px',
                        fontWeight: 600,
                        fontSize: '0.9rem',
                        cursor: 'pointer'
                    }}
                >
                    Upgrade for Unlimited
                    <ArrowUpRight size={16} />
                </button>
            )}
        </div>
    );
};
