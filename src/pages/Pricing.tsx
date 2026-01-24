import React from 'react';
import { Check, Star, Shield, Zap, Briefcase, Loader2 } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCompliance } from '../context/ComplianceContext';
import { supabase } from '../lib/supabase';
import { toast } from 'react-hot-toast';
import { SUBSCRIPTION_TIERS, STANDALONE_OFFERS } from '../lib/subscriptionData';

export const Pricing = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { user, profile, isDemo } = useAuth();
    const { companyName } = useCompliance();
    const [loadingTier, setLoadingTier] = React.useState<string | null>(null);

    React.useEffect(() => {
        const query = new URLSearchParams(location.search);
        if (query.get('payment') === 'cancelled') {
            toast.error('Payment cancelled. No charges were made.');
            navigate('/pricing', { replace: true });
        }
    }, [location.search, navigate]);

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

        try {
            // Starting checkout session
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
                // Redirecting to Stripe
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

            {/* Standalone Strategic Offers (CEO Growth Levers) */}
            <div style={{ marginTop: '6rem' }}>
                <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
                    <h2 style={{ fontSize: '2rem', fontWeight: 700, marginBottom: '0.5rem' }}>One-Off Compliance Solutions</h2>
                    <p style={{ color: 'var(--color-text-secondary)', fontSize: '1.1rem' }}>No subscription required. Pay only for what you need.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8" style={{ maxWidth: '900px', margin: '0 auto' }}>
                    {STANDALONE_OFFERS.map((offer) => (
                        <div key={offer.id} className="card" style={{ display: 'flex', flexDirection: 'column', background: 'linear-gradient(135deg, white 0%, #f8fafc 100%)', border: '1px dashed var(--color-border)' }}>
                            <div style={{ marginBottom: '1.5rem' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                                    <h3 style={{ fontSize: '1.25rem', fontWeight: 700, margin: 0 }}>{offer.name}</h3>
                                    <span style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--color-primary)' }}>{offer.price}</span>
                                </div>
                                <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.9rem' }}>{offer.description}</p>
                            </div>

                            <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 2rem 0', display: 'flex', flexDirection: 'column', gap: '0.5rem', flex: 1 }}>
                                {offer.features.map((feat, i) => (
                                    <li key={i} style={{ display: 'flex', gap: '0.5rem', fontSize: '0.85rem', color: 'var(--color-text-secondary)' }}>
                                        <Zap size={14} color="var(--color-accent)" style={{ marginTop: '2px' }} />
                                        {feat}
                                    </li>
                                ))}
                            </ul>

                            <button
                                className="btn btn-secondary"
                                style={{ width: '100%', justifyContent: 'center', borderColor: 'var(--color-accent)', color: 'var(--color-accent)' }}
                                onClick={() => handleSubscribe(offer)}
                            >
                                {offer.cta}
                            </button>
                        </div>
                    ))}
                </div>
            </div>

            {/* Social Proof Strip */}
            <div style={{
                marginTop: '3rem',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                gap: '3rem',
                flexWrap: 'wrap',
                padding: '1.5rem',
                background: 'white',
                borderRadius: '12px',
                border: '1px solid var(--color-border)'
            }}>
                {[
                    { value: '147+', label: 'Care Homes Trust Us' },
                    { value: '98%', label: 'Customer Satisfaction' },
                    { value: '4.2hrs', label: 'Saved Per Week' },
                    { value: '£12K', label: 'Avg. Penalty Avoided' }
                ].map((stat, i) => (
                    <div key={i} style={{ textAlign: 'center' }}>
                        <div style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--color-primary)' }}>{stat.value}</div>
                        <div style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)' }}>{stat.label}</div>
                    </div>
                ))}
            </div>

            {/* Testimonials */}
            <div style={{ marginTop: '4rem' }}>
                <h2 style={{ textAlign: 'center', marginBottom: '2rem', fontSize: '1.5rem' }}>
                    Trusted by Care Home Managers Across the UK
                </h2>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem' }}>
                    {[
                        {
                            quote: "ComplyFlow's Gap Analyzer identified 7 policy gaps we didn't know we had. We fixed them before our CQC inspection and maintained our 'Good' rating.",
                            author: "Sarah Mitchell",
                            role: "Registered Manager, Sunrise Care Home",
                            rating: 5
                        },
                        {
                            quote: "The Sponsor Licence tracking alone has saved us from what could have been a devastating Home Office violation. Worth every penny.",
                            author: "James Oluwole",
                            role: "Operations Director, CareBridge Group",
                            rating: 5
                        },
                        {
                            quote: "Mock Inspections feature helped my team feel prepared and confident. Our actual CQC inspection went smoothly because of this practice.",
                            author: "Patricia Chen",
                            role: "Deputy Manager, Haven House",
                            rating: 5
                        }
                    ].map((testimonial, i) => (
                        <div key={i} className="card" style={{ background: 'white' }}>
                            <div style={{ display: 'flex', gap: '0.125rem', marginBottom: '0.75rem' }}>
                                {[...Array(testimonial.rating)].map((_, j) => (
                                    <Star key={j} size={16} fill="#fbbf24" color="#fbbf24" />
                                ))}
                            </div>
                            <p style={{ fontSize: '0.95rem', lineHeight: 1.6, color: 'var(--color-text-secondary)', marginBottom: '1rem', fontStyle: 'italic' }}>
                                "{testimonial.quote}"
                            </p>
                            <div>
                                <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>{testimonial.author}</div>
                                <div style={{ fontSize: '0.8rem', color: 'var(--color-text-tertiary)' }}>{testimonial.role}</div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* FAQ Section */}
            <div style={{ marginTop: '4rem' }}>
                <h2 style={{ textAlign: 'center', marginBottom: '2rem', fontSize: '1.5rem' }}>
                    Frequently Asked Questions
                </h2>
                <div style={{ maxWidth: '700px', margin: '0 auto' }}>
                    {[
                        {
                            q: "Can I cancel anytime?",
                            a: "Yes! All plans are month-to-month with no long-term commitment. Cancel anytime from your settings page."
                        },
                        {
                            q: "Is my data secure?",
                            a: "Absolutely. We use bank-level AES-256 encryption, and all data is stored in UK-based servers compliant with GDPR."
                        },
                        {
                            q: "Do you offer discounts for multiple locations?",
                            a: "Yes! Contact our sales team for custom Corporate pricing that scales with your care group."
                        },
                        {
                            q: "How quickly can I get started?",
                            a: "Immediately. Sign up, run your first Gap Analysis, and get actionable insights within 10 minutes."
                        }
                    ].map((faq, i) => (
                        <div key={i} style={{
                            padding: '1.25rem',
                            borderBottom: i < 3 ? '1px solid var(--color-border)' : 'none'
                        }}>
                            <div style={{ fontWeight: 600, marginBottom: '0.5rem', color: 'var(--color-text-main)' }}>{faq.q}</div>
                            <div style={{ fontSize: '0.9rem', color: 'var(--color-text-secondary)', lineHeight: 1.6 }}>{faq.a}</div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Money Back Guarantee */}
            <div style={{ marginTop: '4rem', textAlign: 'center', padding: '2.5rem', background: 'linear-gradient(135deg, #f0fdf4 0%, #ecfdf5 100%)', borderRadius: '16px', border: '1px solid #bbf7d0' }}>
                <div style={{
                    width: '60px', height: '60px',
                    background: '#10b981',
                    borderRadius: '50%',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    margin: '0 auto 1rem auto'
                }}>
                    <Shield size={28} color="white" />
                </div>
                <h3 style={{ marginBottom: '0.75rem', fontSize: '1.25rem', color: '#047857' }}>
                    30-Day Money-Back Guarantee
                </h3>
                <p style={{ color: '#065f46', maxWidth: '500px', margin: '0 auto', lineHeight: 1.6 }}>
                    Try ComplyFlow Professional completely risk-free. If you don't see measurable improvement in your compliance management within 30 days, we'll refund every penny. No questions asked.
                </p>
            </div>

            {/* Final CTA */}
            <div style={{ marginTop: '4rem', textAlign: 'center' }}>
                <h2 style={{ fontSize: '1.75rem', marginBottom: '1rem' }}>Ready to Transform Your Compliance?</h2>
                <p style={{ color: 'var(--color-text-secondary)', marginBottom: '1.5rem', maxWidth: '500px', margin: '0 auto 1.5rem auto' }}>
                    Join 147+ care homes already using ComplyFlow to stay CQC-ready and protect their business.
                </p>
                <button
                    className="btn btn-primary"
                    style={{ padding: '1rem 2.5rem', fontSize: '1.1rem' }}
                    onClick={() => navigate('/signup')}
                >
                    Start Free Trial
                </button>
            </div>

        </div>
    );
};
