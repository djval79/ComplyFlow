import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Shield, CheckCircle, ArrowRight, Star, Users, FileText,
    Clock, TrendingUp, Zap, Award, ChevronRight, Play, Globe
} from 'lucide-react';

const features = [
    {
        icon: <Shield size={24} />,
        title: 'AI Gap Analyzer',
        description: 'An Ex-Inspector in Your Pocket. Our AI highlights missing CQC clauses before an inspector does.',
        color: '#0ea5e9'
    },
    {
        icon: <Globe size={24} />, // Changed icon to represent Visa/Global nature better
        title: 'SponsorGuardian',
        description: 'Never miss a visa deadline. Automated Right-to-Work alerts that protect your Sponsor License.',
        color: '#f59e0b'
    },
    {
        icon: <Users size={24} />,
        title: 'Mock Inspections',
        description: 'Practice with AI inspectors who ask the hard questions. Fix weaknesses before the real day.',
        color: '#8b5cf6'
    },
    {
        icon: <FileText size={24} />,
        title: 'Live Governance',
        description: 'One dashboard for all your evidence. Replace Sunday night spreadsheet chaos with instant oversight.',
        color: '#10b981'
    }
];

const stats = [
    { value: '147+', label: 'Care Homes' },
    { value: '£12k', label: 'Avg. Saved / Year' },
    { value: '4.2hrs', label: 'Saved Weekly' },
    { value: '100%', label: 'Audit Ready' }
];

export const LandingPage: React.FC = () => {
    const navigate = useNavigate();

    return (
        <div style={{ background: 'var(--color-bg-page)', minHeight: '100vh' }}>
            {/* Navigation */}
            <nav style={{
                padding: '1rem 2rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                maxWidth: '1200px',
                margin: '0 auto'
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <div style={{
                        width: 36, height: 36,
                        background: 'var(--color-primary)',
                        borderRadius: '8px',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        color: 'white'
                    }}>
                        <Shield size={20} />
                    </div>
                    <span style={{ fontWeight: 700, fontSize: '1.25rem', color: 'var(--color-primary)' }}>ComplyFlow</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <button onClick={() => navigate('/login')} className="btn btn-secondary">
                        Sign In
                    </button>
                    <button onClick={() => navigate('/signup')} className="btn btn-primary">
                        Start Free Trial
                    </button>
                </div>
            </nav>

            {/* Hero Section */}
            <section style={{
                padding: '5rem 2rem 7rem',
                maxWidth: '1200px',
                margin: '0 auto',
                textAlign: 'center'
            }}>
                <div style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    background: '#ecfdf5',
                    color: '#047857',
                    padding: '0.5rem 1rem',
                    borderRadius: '9999px',
                    fontSize: '0.85rem',
                    fontWeight: 600,
                    marginBottom: '1.5rem',
                    border: '1px solid #d1fae5'
                }}>
                    <Zap size={16} fill="currentColor" />
                    Trusted by 147+ UK Care Leaders
                </div>

                <h1 style={{
                    fontSize: 'clamp(2.5rem, 5vw, 4rem)',
                    fontWeight: 800,
                    color: 'var(--color-text-main)',
                    lineHeight: 1.1,
                    marginBottom: '1.5rem',
                    maxWidth: '900px',
                    margin: '0 auto 1.5rem auto',
                    letterSpacing: '-0.02em'
                }}>
                    Compliance Without <br />
                    <span className="gradient-text">The Complexity.</span>
                </h1>

                <p style={{
                    fontSize: '1.35rem',
                    color: 'var(--color-text-secondary)',
                    maxWidth: '700px',
                    margin: '0 auto 2.5rem auto',
                    lineHeight: 1.6
                }}>
                    Stay CQC-Ready, 24/7. ComplyFlow is the AI shield that spots policy gaps instantly and protects your Sponsor License from Home Office violations.
                </p>

                <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
                    <button
                        onClick={() => navigate('/signup')}
                        className="btn btn-primary"
                        style={{
                            padding: '1rem 2.5rem',
                            fontSize: '1.1rem',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem',
                            boxShadow: '0 4px 6px -1px rgba(14, 165, 233, 0.2), 0 2px 4px -1px rgba(14, 165, 233, 0.1)'
                        }}
                    >
                        Start Your Compliance Shield <ArrowRight size={18} />
                    </button>
                    <button
                        onClick={() => navigate('/login')}
                        className="btn btn-secondary"
                        style={{
                            padding: '1rem 2rem',
                            fontSize: '1.1rem',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem'
                        }}
                    >
                        <Play size={18} /> Watch 2-Min Demo
                    </button>
                </div>

                <p style={{ marginTop: '1.5rem', fontSize: '0.875rem', color: 'var(--color-text-tertiary)' }}>
                    <span style={{ color: '#10b981', fontWeight: 600 }}>✓</span> No credit card required &nbsp;
                    <span style={{ color: '#10b981', fontWeight: 600 }}>✓</span> Cancel anytime
                </p>
            </section>

            {/* Stats Bar */}
            <section style={{
                background: 'var(--color-primary)',
                padding: '2.5rem 2rem',
                position: 'relative',
                overflow: 'hidden'
            }}>
                <div style={{
                    display: 'flex',
                    justifyContent: 'center',
                    gap: '4rem',
                    flexWrap: 'wrap',
                    maxWidth: '1200px',
                    margin: '0 auto',
                    position: 'relative',
                    zIndex: 2
                }}>
                    {stats.map((stat, i) => (
                        <div key={i} style={{ textAlign: 'center' }}>
                            <div style={{ fontSize: '2.5rem', fontWeight: 800, color: 'white', letterSpacing: '-0.02em' }}>{stat.value}</div>
                            <div style={{ fontSize: '0.9rem', color: 'rgba(255,255,255,0.8)', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{stat.label}</div>
                        </div>
                    ))}
                </div>
            </section>

            {/* Benefits / Pain Points Section */}
            <section style={{ padding: '6rem 2rem', maxWidth: '1200px', margin: '0 auto' }}>
                <div style={{ textAlign: 'center', marginBottom: '4rem' }}>
                    <h2 style={{ fontSize: '2.25rem', fontWeight: 700, marginBottom: '1rem', color: 'var(--color-text-main)' }}>
                        Everything You Need to Avoid "Requires Improvement"
                    </h2>
                    <p style={{ color: 'var(--color-text-secondary)', fontSize: '1.2rem', maxWidth: '650px', margin: '0 auto' }}>
                        Manual checks and spreadsheets are dangerous. Switch to intelligent, automated oversight.
                    </p>
                </div>

                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
                    gap: '2rem'
                }}>
                    {features.map((feature, i) => (
                        <div key={i} className="card" style={{
                            background: 'white',
                            textAlign: 'left', // Better readability
                            padding: '2rem',
                            transition: 'transform 0.2s, box-shadow 0.2s',
                            cursor: 'default'
                        }}>
                            <div style={{
                                width: '56px', height: '56px',
                                borderRadius: '12px',
                                background: `${feature.color}15`,
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                marginBottom: '1.5rem',
                                color: feature.color
                            }}>
                                {feature.icon}
                            </div>
                            <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '0.75rem' }}>
                                {feature.title}
                            </h3>
                            <p style={{ fontSize: '1rem', color: 'var(--color-text-secondary)', lineHeight: 1.6 }}>
                                {feature.description}
                            </p>
                        </div>
                    ))}
                </div>
            </section>

            {/* Social Proof */}
            <section style={{ padding: '5rem 2rem', background: '#f8fafc', borderTop: '1px solid var(--color-border)' }}>
                <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
                    <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
                        <h2 style={{ fontSize: '2rem', fontWeight: 700, marginBottom: '0.75rem' }}>
                            Loved by Registered Managers
                        </h2>
                    </div>

                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
                        gap: '2rem'
                    }}>
                        {[
                            {
                                quote: "ComplyFlow identified 7 policy gaps we didn't know existed. We fixed them before our CQC inspection and kept our rating.",
                                author: "Sarah Mitchell",
                                role: "Registered Manager"
                            },
                            {
                                quote: "The Mock Inspection feature gave my team the confidence they needed. It stopped them from panicking when the real inspectors arrived.",
                                author: "James Chen",
                                role: "Deputy Manager"
                            },
                            {
                                quote: "SponsorGuardian is a lifesaver. I used to worry about visa expiries keeping me up at night. Now I just get an alert.",
                                author: "Priya Sharma",
                                role: "HR & Compliance Lead"
                            }
                        ].map((testimonial, i) => (
                            <div key={i} className="card" style={{ background: 'white', padding: '2rem' }}>
                                <div style={{ display: 'flex', gap: '0.25rem', marginBottom: '1rem' }}>
                                    {[...Array(5)].map((_, j) => (
                                        <Star key={j} size={18} fill="#fbbf24" color="#fbbf24" style={{ filter: 'drop-shadow(0 1px 1px rgba(0,0,0,0.1))' }} />
                                    ))}
                                </div>
                                <p style={{ fontSize: '1.05rem', lineHeight: 1.6, color: 'var(--color-text-main)', marginBottom: '1.5rem', fontWeight: 500 }}>
                                    "{testimonial.quote}"
                                </p>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                    <div style={{ width: 40, height: 40, borderRadius: '50%', background: '#cbd5e1', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, color: '#64748b' }}>
                                        {testimonial.author.charAt(0)}
                                    </div>
                                    <div>
                                        <div style={{ fontWeight: 700, fontSize: '0.95rem' }}>{testimonial.author}</div>
                                        <div style={{ fontSize: '0.85rem', color: 'var(--color-text-tertiary)' }}>{testimonial.role}</div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* CTA Section */}
            <section style={{
                padding: '6rem 2rem',
                background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
                textAlign: 'center',
                color: 'white'
            }}>
                <h2 style={{ fontSize: '2.5rem', fontWeight: 700, marginBottom: '1.5rem', letterSpacing: '-0.02em' }}>
                    Ready to Sleep Better at Night?
                </h2>
                <p style={{ color: 'rgba(255,255,255,0.85)', fontSize: '1.25rem', marginBottom: '2.5rem', maxWidth: '600px', margin: '0 auto 2.5rem auto' }}>
                    Join 147+ care homes using ComplyFlow to protect their business and workforce.
                </p>
                <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', flexWrap: 'wrap' }}>
                    <button
                        onClick={() => navigate('/signup')}
                        className="btn"
                        style={{
                            background: 'white',
                            color: 'var(--color-primary)',
                            padding: '1rem 3rem',
                            fontSize: '1.15rem',
                            fontWeight: 700,
                            borderRadius: '8px'
                        }}
                    >
                        Start Your Free Trial
                    </button>
                    <button
                        onClick={() => navigate('/login')}
                        className="btn"
                        style={{
                            background: 'transparent',
                            color: 'white',
                            border: '1px solid rgba(255,255,255,0.3)',
                            padding: '1rem 3rem',
                            fontSize: '1.15rem',
                            fontWeight: 600,
                            borderRadius: '8px'
                        }}
                    >
                        Login
                    </button>
                </div>
            </section>

            {/* Footer */}
            <footer style={{
                padding: '3rem 2rem',
                textAlign: 'center',
                color: 'var(--color-text-tertiary)',
                fontSize: '0.9rem',
                background: 'var(--color-bg-page)'
            }}>
                <div style={{ marginBottom: '1rem', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.5rem' }}>
                    <Shield size={16} /> <span style={{ fontWeight: 600 }}>ComplyFlow</span>
                </div>
                <div style={{ marginBottom: '1rem' }}>
                    © 2026 ComplyFlow by NovumSolvo. All rights reserved.
                </div>
                <div style={{ display: 'flex', gap: '2rem', justifyContent: 'center' }}>
                    <a href="#" className="hover:text-primary transition-colors">Privacy Policy</a>
                    <a href="#" className="hover:text-primary transition-colors">Terms of Service</a>
                    <a href="#" className="hover:text-primary transition-colors">Contact Support</a>
                </div>
            </footer>
        </div>
    );
};
