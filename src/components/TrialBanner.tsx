/**
 * TrialBanner Component - Phase 3 Monetization
 * Shows trial countdown and upgrade CTA for users on free trial
 */

import React from 'react';
import { Crown, X, Clock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export const TrialBanner: React.FC = () => {
    const navigate = useNavigate();
    const { profile, isDemo } = useAuth();
    const [dismissed, setDismissed] = React.useState(false);

    // Check for trial status
    const trialEndsAt = profile?.trial_ends_at ? new Date(profile.trial_ends_at) : null;
    const isOnTrial = trialEndsAt && trialEndsAt > new Date();

    // Calculate days remaining
    const daysRemaining = React.useMemo(() => {
        if (!trialEndsAt) return 0;
        const now = new Date();
        const diff = trialEndsAt.getTime() - now.getTime();
        return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
    }, [trialEndsAt]);

    // Reset dismissal after 24 hours (stored in localStorage)
    React.useEffect(() => {
        const dismissedAt = localStorage.getItem('trial_banner_dismissed');
        if (dismissedAt) {
            const dismissTime = new Date(dismissedAt).getTime();
            const now = new Date().getTime();
            // Re-show after 24 hours
            if (now - dismissTime > 24 * 60 * 60 * 1000) {
                localStorage.removeItem('trial_banner_dismissed');
                setDismissed(false);
            } else {
                setDismissed(true);
            }
        }
    }, []);

    const handleDismiss = () => {
        setDismissed(true);
        localStorage.setItem('trial_banner_dismissed', new Date().toISOString());
    };

    // Don't show if not on trial, dismissed, or in demo mode
    if (!isOnTrial || dismissed || isDemo) return null;

    const isUrgent = daysRemaining <= 3;

    return (
        <div
            style={{
                background: isUrgent
                    ? 'linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)'
                    : 'linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%)',
                padding: '0.75rem 1.5rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '1rem',
                position: 'relative',
                borderBottom: isUrgent ? '1px solid #f59e0b' : '1px solid #93c5fd'
            }}
        >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Clock size={18} color={isUrgent ? '#b45309' : '#1d4ed8'} />
                <span style={{
                    fontWeight: 600,
                    color: isUrgent ? '#92400e' : '#1e40af',
                    fontSize: '0.9rem'
                }}>
                    {daysRemaining === 1
                        ? '1 day left in your Pro trial!'
                        : daysRemaining === 0
                            ? 'Your trial ends today!'
                            : `${daysRemaining} days left in your Pro trial`
                    }
                </span>
            </div>

            <button
                onClick={() => navigate('/pricing')}
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.375rem',
                    background: isUrgent ? '#f59e0b' : '#3b82f6',
                    color: 'white',
                    border: 'none',
                    padding: '0.5rem 1rem',
                    borderRadius: '6px',
                    fontWeight: 600,
                    fontSize: '0.85rem',
                    cursor: 'pointer',
                    transition: 'background 0.2s'
                }}
            >
                <Crown size={16} />
                Upgrade Now
            </button>

            <button
                onClick={handleDismiss}
                style={{
                    position: 'absolute',
                    right: '1rem',
                    background: 'transparent',
                    border: 'none',
                    cursor: 'pointer',
                    padding: '0.25rem',
                    opacity: 0.6,
                    color: isUrgent ? '#92400e' : '#1e40af'
                }}
                title="Dismiss for 24 hours"
            >
                <X size={18} />
            </button>
        </div>
    );
};
