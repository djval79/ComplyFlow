import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Shield, CheckCircle, ArrowRight, Star, Users, FileText,
    Clock, TrendingUp, Zap, Award, ChevronRight, Play
} from 'lucide-react';

const features = [
    {
        icon: <Shield size={24} />,
        title: 'AI Gap Analyzer',
        description: 'Upload your policies and get instant CQC compliance analysis with actionable recommendations.',
        color: '#0ea5e9'
    },
    {
        icon: <Users size={24} />,
        title: 'Mock Inspections',
        description: 'Practice with AI-powered CQC inspectors. Prepare your team for the real thing.',
        color: '#8b5cf6'
    },
    {
        icon: <FileText size={24} />,
        title: 'Policy Templates',
        description: 'Access 50+ pre-vetted, CQC-compliant policy templates ready to customize.',
        color: '#10b981'
    },
    {
        icon: <Clock size={24} />,
        title: 'Visa Tracking',
        description: 'Never miss a Right-to-Work check or visa expiry with automated alerts.',
        color: '#f59e0b'
    }
];

const stats = [
    { value: '147+', label: 'Care Homes' },
    { value: '98%', label: 'Satisfaction' },
    { value: '4.2hrs', label: 'Saved Weekly' },
    { value: '£12K', label: 'Penalties Avoided' }
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
                padding: '4rem 2rem 6rem',
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
                    marginBottom: '1.5rem'
                }}>
                    <Zap size={16} />
                    Trusted by 147+ UK Care Homes
                </div>

                <h1 style={{
                    fontSize: 'clamp(2rem, 5vw, 3.5rem)',
                    fontWeight: 800,
                    color: 'var(--color-text-main)',
                    lineHeight: 1.1,
                    marginBottom: '1.5rem',
                    maxWidth: '800px',
                    margin: '0 auto 1.5rem auto'
                }}>
                    Stay CQC-Ready <span className="gradient-text">Without the Stress</span>
                </h1>

                <p style={{
                    fontSize: '1.25rem',
                    color: 'var(--color-text-secondary)',
                    maxWidth: '600px',
                    margin: '0 auto 2.5rem auto',
                    lineHeight: 1.6
                }}>
                    AI-powered compliance management for care homes. Identify gaps, prepare for inspections,
                    and protect your business — all in one platform.
                </p>

                <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
                    <button
                        onClick={() => navigate('/signup')}
                        className="btn btn-primary"
                        style={{
                            padding: '1rem 2rem',
                            fontSize: '1.1rem',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem'
                        }}
                    >
                        Start 14-Day Free Trial <ArrowRight size={18} />
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
                        <Play size={18} /> Watch Demo
                    </button>
                </div>

                <p style={{ marginTop: '1rem', fontSize: '0.85rem', color: 'var(--color-text-tertiary)' }}>
                    No credit card required • Setup in 2 minutes • Cancel anytime
                </p>
            </section>

            {/* Stats Bar */}
            <section style={{
                background: 'var(--color-primary)',
                padding: '2rem',
            }}>
                <div style={{
                    display: 'flex',
                    justifyContent: 'center',
                    gap: '4rem',
                    flexWrap: 'wrap',
                    maxWidth: '1000px',
                    margin: '0 auto'
                }}>
                    {stats.map((stat, i) => (
                        <div key={i} style={{ textAlign: 'center' }}>
                            <div style={{ fontSize: '2rem', fontWeight: 800, color: 'white' }}>{stat.value}</div>
                            <div style={{ fontSize: '0.9rem', color: 'rgba(255,255,255,0.7)' }}>{stat.label}</div>
                        </div>
                    ))}
                </div>
            </section>

            {/* Features Section */}
            <section style={{ padding: '5rem 2rem', maxWidth: '1200px', margin: '0 auto' }}>
                <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
                    <h2 style={{ fontSize: '2rem', fontWeight: 700, marginBottom: '0.75rem' }}>
                        Everything You Need for CQC Compliance
                    </h2>
                    <p style={{ color: 'var(--color-text-secondary)', fontSize: '1.1rem', maxWidth: '600px', margin: '0 auto' }}>
                        Replace spreadsheets, manual checks, and consultant fees with one intelligent platform.
                    </p>
                </div>

                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
                    gap: '1.5rem'
                }}>
                    {features.map((feature, i) => (
                        <div key={i} className="card" style={{
                            background: 'white',
                            textAlign: 'center',
                            padding: '2rem',
                            transition: 'all 0.2s'
                        }}>
                            <div style={{
                                width: '56px', height: '56px',
                                borderRadius: '12px',
                                background: `${feature.color}15`,
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                margin: '0 auto 1rem auto',
                                color: feature.color
                            }}>
                                {feature.icon}
                            </div>
                            <h3 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '0.5rem' }}>
                                {feature.title}
                            </h3>
                            <p style={{ fontSize: '0.9rem', color: 'var(--color-text-secondary)', lineHeight: 1.6 }}>
                                {feature.description}
                            </p>
                        </div>
                    ))}
                </div>
            </section>

            {/* Social Proof */}
            <section style={{ padding: '5rem 2rem', background: '#f1f5f9' }}>
                <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
                    <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
                        <h2 style={{ fontSize: '2rem', fontWeight: 700, marginBottom: '0.75rem' }}>
                            Loved by Care Home Managers
                        </h2>
                    </div>

                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
                        gap: '1.5rem'
                    }}>
                        {[
                            {
                                quote: "ComplyFlow identified 7 policy gaps we didn't know existed. We fixed them before our CQC inspection.",
                                author: "Sarah Mitchell",
                                role: "Registered Manager"
                            },
                            {
                                quote: "The Mock Inspection feature gave my team the confidence they needed. Our real inspection was a breeze.",
                                author: "James Chen",
                                role: "Deputy Manager"
                            },
                            {
                                quote: "Visa tracking alerts have saved us from potential Home Office violations twice now. Invaluable.",
                                author: "Priya Sharma",
                                role: "HR Manager"
                            }
                        ].map((testimonial, i) => (
                            <div key={i} className="card" style={{ background: 'white' }}>
                                <div style={{ display: 'flex', gap: '0.125rem', marginBottom: '0.75rem' }}>
                                    {[...Array(5)].map((_, j) => (
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
            </section>

            {/* CTA Section */}
            <section style={{
                padding: '5rem 2rem',
                background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
                textAlign: 'center'
            }}>
                <h2 style={{ fontSize: '2rem', fontWeight: 700, color: 'white', marginBottom: '1rem' }}>
                    Ready to Simplify Your Compliance?
                </h2>
                <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: '1.1rem', marginBottom: '2rem', maxWidth: '500px', margin: '0 auto 2rem auto' }}>
                    Join 147+ care homes already using ComplyFlow to stay inspection-ready.
                </p>
                <button
                    onClick={() => navigate('/signup')}
                    className="btn"
                    style={{
                        background: 'white',
                        color: 'var(--color-primary)',
                        padding: '1rem 2.5rem',
                        fontSize: '1.1rem',
                        fontWeight: 600
                    }}
                >
                    Start Your Free Trial
                </button>
            </section>

            {/* Footer */}
            <footer style={{
                padding: '2rem',
                textAlign: 'center',
                color: 'var(--color-text-tertiary)',
                fontSize: '0.85rem'
            }}>
                <div style={{ marginBottom: '0.5rem' }}>
                    © 2025 ComplyFlow by NovumSolvo. All rights reserved.
                </div>
                <div style={{ display: 'flex', gap: '1.5rem', justifyContent: 'center' }}>
                    <a href="#" style={{ color: 'var(--color-text-secondary)' }}>Privacy</a>
                    <a href="#" style={{ color: 'var(--color-text-secondary)' }}>Terms</a>
                    <a href="#" style={{ color: 'var(--color-text-secondary)' }}>Contact</a>
                </div>
            </footer>
        </div>
    );
};
