import React, { useState, useEffect } from 'react';
import { Crown, Check, Clock, Zap, TrendingUp, ArrowRight, X, Sparkles } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

interface TrialBannerProps {
    onDismiss?: () => void;
}

export const TrialBanner: React.FC<TrialBannerProps> = ({ onDismiss }) => {
    const navigate = useNavigate();
    const { isDemo } = useAuth();
    const [dismissed, setDismissed] = useState(false);
    const [daysRemaining, setDaysRemaining] = useState(14);

    // For demo, simulate trial period
    useEffect(() => {
        const stored = localStorage.getItem('complyflow_trial_start');
        if (!stored) {
            localStorage.setItem('complyflow_trial_start', new Date().toISOString());
        } else {
            const startDate = new Date(stored);
            const now = new Date();
            const daysPassed = Math.floor((now.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
            setDaysRemaining(Math.max(0, 14 - daysPassed));
        }
    }, []);

    if (dismissed) return null;

    const urgencyColor = daysRemaining <= 3 ? '#ef4444' : daysRemaining <= 7 ? '#f59e0b' : '#0ea5e9';
    const urgencyBg = daysRemaining <= 3 ? '#fef2f2' : daysRemaining <= 7 ? '#fffbeb' : '#f0f9ff';

    return (
        <div style={{
            background: `linear-gradient(90deg, ${urgencyBg} 0%, white 100%)`,
            borderBottom: `2px solid ${urgencyColor}20`,
            padding: '0.75rem 1rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '2rem',
            position: 'relative'
        }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <div style={{
                    display: 'flex', alignItems: 'center', gap: '0.375rem',
                    background: urgencyColor,
                    color: 'white',
                    padding: '0.25rem 0.75rem',
                    borderRadius: '9999px',
                    fontSize: '0.75rem',
                    fontWeight: 700
                }}>
                    <Clock size={12} />
                    {daysRemaining} {daysRemaining === 1 ? 'day' : 'days'} left
                </div>

                <span style={{ fontSize: '0.875rem', color: 'var(--color-text-main)' }}>
                    <strong>Professional Trial Active</strong>
                    <span style={{ color: 'var(--color-text-secondary)', marginLeft: '0.5rem' }}>
                        Unlock unlimited AI analyses and premium features
                    </span>
                </span>
            </div>

            <button
                onClick={() => navigate('/pricing')}
                style={{
                    display: 'flex', alignItems: 'center', gap: '0.375rem',
                    background: urgencyColor,
                    color: 'white',
                    border: 'none',
                    padding: '0.5rem 1rem',
                    borderRadius: '6px',
                    fontSize: '0.8rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                }}
            >
                <Crown size={14} />
                Upgrade Now
            </button>

            <button
                onClick={() => {
                    setDismissed(true);
                    onDismiss?.();
                }}
                style={{
                    position: 'absolute',
                    right: '1rem',
                    background: 'transparent',
                    border: 'none',
                    color: 'var(--color-text-tertiary)',
                    cursor: 'pointer',
                    padding: '0.25rem'
                }}
            >
                <X size={16} />
            </button>
        </div>
    );
};

// Upgrade Prompt Card - For feature gating
export const UpgradePrompt: React.FC<{
    feature: string;
    description: string;
    currentUsage?: number;
    maxUsage?: number;
}> = ({ feature, description, currentUsage, maxUsage }) => {
    const navigate = useNavigate();

    return (
        <div style={{
            background: 'linear-gradient(135deg, #fefce8 0%, #fef3c7 100%)',
            border: '1px solid #fcd34d',
            borderRadius: '12px',
            padding: '1.5rem',
            textAlign: 'center'
        }}>
            <div style={{
                width: '48px', height: '48px',
                background: 'linear-gradient(135deg, #f59e0b, #d97706)',
                borderRadius: '12px',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                margin: '0 auto 1rem auto'
            }}>
                <Zap size={24} color="white" />
            </div>

            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '0.5rem', color: '#92400e' }}>
                Unlock {feature}
            </h3>

            <p style={{ fontSize: '0.875rem', color: '#a16207', marginBottom: '1rem' }}>
                {description}
            </p>

            {currentUsage !== undefined && maxUsage !== undefined && (
                <div style={{ marginBottom: '1rem' }}>
                    <div style={{
                        display: 'flex', justifyContent: 'space-between',
                        fontSize: '0.75rem', color: '#a16207', marginBottom: '0.25rem'
                    }}>
                        <span>Usage this month</span>
                        <span>{currentUsage}/{maxUsage}</span>
                    </div>
                    <div style={{
                        height: '6px', background: '#fde68a', borderRadius: '3px', overflow: 'hidden'
                    }}>
                        <div style={{
                            height: '100%',
                            width: `${(currentUsage / maxUsage) * 100}%`,
                            background: '#f59e0b',
                            borderRadius: '3px'
                        }} />
                    </div>
                </div>
            )}

            <button
                onClick={() => navigate('/pricing')}
                className="btn"
                style={{
                    background: '#f59e0b',
                    color: 'white',
                    border: 'none',
                    width: '100%'
                }}
            >
                <Crown size={16} />
                Upgrade to Professional
            </button>
        </div>
    );
};

// Success Celebration Modal
export const SuccessCelebration: React.FC<{
    title: string;
    message: string;
    onClose: () => void;
}> = ({ title, message, onClose }) => {
    return (
        <div style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000
        }}>
            <div style={{
                background: 'white',
                borderRadius: '16px',
                padding: '2rem',
                textAlign: 'center',
                maxWidth: '400px',
                animation: 'bounceIn 0.4s ease-out'
            }}>
                <div style={{
                    width: '64px', height: '64px',
                    background: 'linear-gradient(135deg, #10b981, #059669)',
                    borderRadius: '50%',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    margin: '0 auto 1rem auto'
                }}>
                    <Sparkles size={32} color="white" />
                </div>

                <h2 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '0.5rem' }}>
                    {title}
                </h2>
                <p style={{ color: 'var(--color-text-secondary)', marginBottom: '1.5rem' }}>
                    {message}
                </p>

                <button onClick={onClose} className="btn btn-primary" style={{ width: '100%' }}>
                    Continue
                </button>
            </div>
        </div>
    );
};

// Onboarding Progress Widget
export const OnboardingProgress: React.FC = () => {
    const navigate = useNavigate();
    const { profile, isDemo } = useAuth();

    // We use state to track completion status
    const [progressState, setProgressState] = useState({
        profile: true, // Always true if they see dashboard
        gap: false,
        policy: false,
        inspection: false,
        team: false
    });

    // Load real status
    useEffect(() => {
        if (!profile?.organization_id || isDemo) return;

        const checkProgress = async () => {
            const orgId = profile.organization_id;

            // 1. Check policies
            const { count: policyCount } = await import('../lib/supabase').then(m => m.supabase
                .from('policies')
                .select('*', { count: 'exact', head: true })
                .eq('organization_id', orgId));

            // 2. Check analyses
            const { count: analysisCount } = await import('../lib/supabase').then(m => m.supabase
                .from('compliance_analyses')
                .select('*', { count: 'exact', head: true })
                .eq('organization_id', orgId));

            // 3. Check team
            const { count: teamCount } = await import('../lib/supabase').then(m => m.supabase
                .from('profiles')
                .select('*', { count: 'exact', head: true })
                .eq('organization_id', orgId));

            // 4. Check local storage for client-side actions like Mock Inspection
            const inspectionDone = localStorage.getItem('complyflow_inspection_complete') === 'true';

            setProgressState({
                profile: true,
                gap: (analysisCount || 0) > 0,
                policy: (policyCount || 0) > 0,
                inspection: inspectionDone,
                team: (teamCount || 1) > 1
            });
        };

        checkProgress();
    }, [profile?.organization_id, isDemo]);

    const steps = [
        { id: 'profile', label: 'Complete Profile', done: progressState.profile },
        { id: 'gap', label: 'Run First Gap Analysis', done: progressState.gap },
        { id: 'policy', label: 'Upload or Create a Policy', done: progressState.policy },
        { id: 'inspection', label: 'Try Mock Inspection', done: progressState.inspection },
        { id: 'team', label: 'Invite Team Member', done: progressState.team }
    ];

    const completedCount = steps.filter(s => s.done).length;
    const progress = (completedCount / steps.length) * 100;

    const stepActions: Record<string, string> = {
        gap: '/cqc/gap-analysis',
        policy: '/templates',
        inspection: '/cqc/mock-inspection',
        team: '/settings'
    };

    if (completedCount === steps.length) return null;

    return (
        <div style={{
            background: 'white',
            border: '1px solid var(--color-border)',
            borderRadius: '12px',
            padding: '1.25rem',
            marginBottom: '1.5rem',
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)'
        }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
                <div>
                    <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '0.25rem' }}>
                        🎯 Getting Started
                    </h3>
                    <p style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)' }}>
                        Complete these steps to unlock your full compliance potential
                    </p>
                </div>
                <div style={{
                    fontSize: '0.8rem', fontWeight: 700,
                    color: 'var(--color-primary)',
                    background: 'var(--color-accent-subtle)',
                    padding: '0.25rem 0.75rem',
                    borderRadius: '9999px'
                }}>
                    {completedCount}/{steps.length}
                </div>
            </div>

            {/* Progress bar */}
            <div style={{
                height: '6px', background: 'var(--color-bg-page)',
                borderRadius: '3px', marginBottom: '1rem', overflow: 'hidden'
            }}>
                <div style={{
                    height: '100%',
                    width: `${progress}%`,
                    background: 'linear-gradient(90deg, #10b981, #0ea5e9)',
                    borderRadius: '3px',
                    transition: 'width 0.5s ease'
                }} />
            </div>

            {/* Steps */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {steps.map((step) => (
                    <div
                        key={step.id}
                        onClick={() => !step.done && stepActions[step.id] && navigate(stepActions[step.id])}
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.75rem',
                            padding: '0.5rem 0.75rem',
                            borderRadius: '8px',
                            cursor: step.done ? 'default' : 'pointer',
                            background: step.done ? '#f0fdf4' : 'transparent',
                            transition: 'background 0.2s'
                        }}
                        onMouseEnter={(e) => !step.done && (e.currentTarget.style.background = 'var(--color-bg-page)')}
                        onMouseLeave={(e) => !step.done && (e.currentTarget.style.background = 'transparent')}
                    >
                        <div style={{
                            width: '24px', height: '24px',
                            borderRadius: '50%',
                            background: step.done ? '#10b981' : 'var(--color-border)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            flexShrink: 0
                        }}>
                            {step.done ? (
                                <Check size={14} color="white" />
                            ) : (
                                <span style={{ fontSize: '0.7rem', color: 'var(--color-text-tertiary)', fontWeight: 600 }}>
                                    {steps.indexOf(step) + 1}
                                </span>
                            )}
                        </div>
                        <span style={{
                            flex: 1,
                            fontSize: '0.875rem',
                            color: step.done ? '#047857' : 'var(--color-text-main)',
                            textDecoration: step.done ? 'line-through' : 'none',
                            fontWeight: step.done ? 400 : 500
                        }}>
                            {step.label}
                        </span>
                        {!step.done && stepActions[step.id] && (
                            <ArrowRight size={14} color="var(--color-text-tertiary)" />
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
};
