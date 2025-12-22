import React from 'react';
import { Check, Star, Shield, Zap, Briefcase, Loader2 } from 'lucide-react';
import { SUBSCRIPTION_TIERS } from '../lib/subscriptionData';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCompliance } from '../context/ComplianceContext';
import { supabase } from '../lib/supabase';

export const Pricing = () => {
    const navigate = useNavigate();
    const { user, profile, isDemo } = useAuth();
    const { companyName } = useCompliance();
    const [loadingTier, setLoadingTier] = React.useState<string | null>(null);

    const handleSubscribe = async (tier: any) => {
        // Prevent subscription in Demo Mode
        if (isDemo) {
            alert('Subscription features are disabled in Demo Mode. Please sign up for a real account to upgrade.');
            return;
        }

        if (!user) {
            console.warn('[Pricing] No user session found, redirecting to login');
            navigate('/login');
            return;
        }

        if (tier.id === 'tier_free' || tier.id === 'tier_trial') {
            navigate('/dashboard');
            return;
        }

        // Enterprise/Corporate usually requires manual setup or a different flow
        if (tier.id === 'tier_enterprise') {
            window.location.href = 'mailto:sales@novumsolvo.co.uk?subject=Corporate Plan Inquiry';
            return;
        }

        const orgId = profile?.organization_id;
        if (!orgId) {
            console.error('[Pricing] Missing organization_id for user:', user.email);
            alert('Your account is not properly linked to an organization. Please contact support.');
            return;
        }

        setLoadingTier(tier.id);
        console.log(`[Pricing] Starting checkout session for tier: ${tier.id}, org: ${orgId}`);

        try {
            const { data, error } = await supabase.functions.invoke('create-checkout-session', {
                body: {
                    tierId: tier.id,
                    organizationId: orgId,
                    organizationName: companyName || 'My Organization',
                    userEmail: user.email
                }
            });

            if (error) {
                console.error('[Pricing] Edge Function error:', error);
                throw error;
            }

            if (data?.url) {
                console.log('[Pricing] Redirecting to Stripe:', data.url);
                window.location.href = data.url;
            } else {
                console.error('[Pricing] No checkout URL returned from function', data);
                throw new Error('No checkout URL returned');
            }
        } catch (err: any) {
            console.error('[Pricing] Subscription flow failed:', err);
            alert(`Failed to start checkout: ${err.message || 'Unknown error'}`);
        } finally {
            setLoadingTier(null);
        }
    };

    return (
        <div className="container animate-enter" style={{ padding: '4rem 1rem', maxWidth: '1200px' }}>

            <div style={{ textAlign: 'center', marginBottom: '4rem' }}>
                <h1 style={{ fontSize: '2.5rem', fontWeight: 700, marginBottom: '1rem' }}>
                    Fair Pricing for Exceptional Care
                </h1>
                <p style={{ color: 'var(--color-text-secondary)', fontSize: '1.2rem', maxWidth: '600px', margin: '0 auto' }}>
                    Choose the plan that fits your organization. Upgrade anytime as you grow.
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {SUBSCRIPTION_TIERS.map((tier) => (
                    <div
                        key={tier.id}
                        className="card"
                        style={{
                            position: 'relative',
                            border: tier.recommended ? '2px solid var(--color-primary)' : '1px solid var(--color-border)',
                            transform: tier.recommended ? 'scale(1.05)' : 'none',
                            zIndex: tier.recommended ? 10 : 1,
                            display: 'flex',
                            flexDirection: 'column'
                        }}
                    >
                        {tier.recommended && (
                            <div style={{
                                position: 'absolute', top: '-12px', left: '50%', transform: 'translateX(-50%)',
                                background: 'var(--color-primary)', color: 'white', padding: '0.25rem 1rem',
                                borderRadius: '1rem', fontSize: '0.8rem', fontWeight: 600
                            }}>
                                MOST POPULAR
                            </div>
                        )}

                        <div style={{ marginBottom: '2rem' }}>
                            <h3 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '0.5rem' }}>{tier.name}</h3>
                            <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.25rem' }}>
                                <span style={{ fontSize: '2.5rem', fontWeight: 800, color: 'var(--color-text-main)' }}>{tier.price}</span>
                                <span style={{ color: 'var(--color-text-secondary)' }}>{tier.period !== 'forever' ? '/' : ''} {tier.period}</span>
                            </div>
                            <p style={{ color: 'var(--color-text-secondary)', marginTop: '1rem', fontSize: '0.95rem' }}>
                                {tier.description}
                            </p>
                        </div>

                        <div style={{ flex: 1 }}>
                            <div style={{ fontWeight: 600, marginBottom: '1rem', fontSize: '0.9rem', color: 'var(--color-text-main)' }}>FEATURES</div>
                            <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 2rem 0', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                                {tier.features.map((feat, i) => (
                                    <li key={i} style={{ display: 'flex', gap: '0.75rem', fontSize: '0.95rem', color: 'var(--color-text-secondary)' }}>
                                        <div style={{ marginTop: '2px' }}><Check size={16} color="var(--color-success)" /></div>
                                        {feat}
                                    </li>
                                ))}
                            </ul>

                            <div style={{ fontWeight: 600, marginBottom: '1rem', fontSize: '0.9rem', color: 'var(--color-text-main)' }}>INCLUDED RESOURCES</div>
                            <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 2rem 0', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                                {tier.resources.map((res, i) => (
                                    <li key={i} style={{ display: 'flex', gap: '0.75rem', fontSize: '0.95rem', color: 'var(--color-text-secondary)' }}>
                                        <div style={{ marginTop: '2px' }}><Star size={16} color="var(--color-warning)" /></div>
                                        {res}
                                    </li>
                                ))}
                            </ul>
                        </div>

                        <button
                            className={`btn ${tier.recommended ? 'btn-primary' : 'btn-secondary'}`}
                            style={{ width: '100%', justifyContent: 'center' }}
                            onClick={() => handleSubscribe(tier)}
                            disabled={!!loadingTier}
                        >
                            {loadingTier === tier.id ? (
                                <Loader2 size={18} className="animate-spin" />
                            ) : (
                                tier.cta
                            )}
                        </button>
                    </div>
                ))}
            </div>

            <div style={{ marginTop: '4rem', textAlign: 'center', padding: '2rem', background: '#f8fafc', borderRadius: 'var(--radius-lg)' }}>
                <h3 style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                    <Shield size={24} color="var(--color-primary)" /> 30-Day Money-Back Guarantee
                </h3>
                <p style={{ color: 'var(--color-text-secondary)' }}>
                    Try ComplyFlow Professional risk-free. If you don't see an improvement in your compliance efficiency, we'll refund you.
                </p>
            </div>

        </div>
    );
};
