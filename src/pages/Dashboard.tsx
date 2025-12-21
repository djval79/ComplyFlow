import React from 'react';
import { AlertTriangle, CheckCircle, FileText, Calendar, ArrowRight, BookOpen, Shield, Plus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCompliance } from '../context/ComplianceContext';

export const Dashboard = () => {
    const { profile, isDemo } = useAuth();
    const { companyName } = useCompliance();
    const navigate = useNavigate();

    // Use organization name from profile if available, otherwise fallback to context/demo
    const displayName = profile?.organization_name || (isDemo ? companyName : 'Your Organization');

    // For a new real user, show onboarding prompts instead of fake stats
    const isNewUser = !isDemo && !profile?.organization_id; // Or simplistic check for now

    return (
        <div className="container animate-enter" style={{ padding: '2rem 1rem' }}>

            {/* Welcome Header */}
            <div style={{ marginBottom: '2rem' }}>
                <h1 style={{ fontSize: '1.8rem', fontWeight: 700, color: 'var(--color-text-main)' }}>
                    Welcome to ComplyFlow
                </h1>
                <p style={{ color: 'var(--color-text-secondary)', marginTop: '0.5rem' }}>
                    Compliance overview for <strong>{displayName}</strong>
                </p>
            </div>

            {/* Main Action Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem', marginBottom: '2.5rem' }}>

                {/* Action Card 1: Setup / Gap Analysis */}
                <div className="card" style={{ borderTop: '4px solid var(--color-primary)' }}>
                    <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem', fontSize: '1.1rem' }}>
                        <Shield size={22} color="var(--color-primary)" /> CQC Compliance
                    </h3>
                    <p style={{ fontSize: '0.9rem', color: 'var(--color-text-secondary)', marginBottom: '1.5rem' }}>
                        Start your first gap analysis to identify missing policies and risks.
                    </p>
                    <button
                        className="btn btn-primary btn-full"
                        onClick={() => navigate('/cqc/gap-analysis')}
                    >
                        Start Gap Analysis
                    </button>
                </div>

                {/* Action Card 2: Policies actions */}
                <div className="card" style={{ borderTop: '4px solid var(--color-success)' }}>
                    <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem', fontSize: '1.1rem' }}>
                        <FileText size={22} color="var(--color-success)" /> Policy Management
                    </h3>
                    <p style={{ fontSize: '0.9rem', color: 'var(--color-text-secondary)', marginBottom: '1.5rem' }}>
                        Upload and analyze your existing policies against CQC regulations.
                    </p>
                    <button
                        className="btn btn-secondary btn-full" // Assuming btn-secondary exists or use default
                        style={{ border: '1px solid var(--color-border)' }}
                        onClick={() => navigate('/templates')}
                    >
                        Manage Policies
                    </button>
                </div>

                {/* Action Card 3: Staff/Sponsor */}
                <div className="card" style={{ borderTop: '4px solid var(--color-accent)' }}>
                    <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem', fontSize: '1.1rem' }}>
                        <CheckCircle size={22} color="var(--color-accent)" /> Sponsor Licence
                    </h3>
                    <p style={{ fontSize: '0.9rem', color: 'var(--color-text-secondary)', marginBottom: '1.5rem' }}>
                        Track sponsored workers and ensure visa compliance.
                    </p>
                    <button
                        className="btn btn-secondary btn-full"
                        style={{ border: '1px solid var(--color-border)' }}
                        onClick={() => navigate('/sponsor')}
                    >
                        View Workers
                    </button>
                </div>

            </div>

            {/* Quick Actions & Updates Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem' }}>

                {/* Recent Activity / Quick Start */}
                <div className="card">
                    <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
                        <Plus size={20} /> Quick Actions
                    </h3>
                    <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                        <li onClick={() => navigate('/cqc/visiting-rights')} style={{ padding: '0.75rem 0', borderBottom: '1px solid var(--color-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }}>
                            <span style={{ color: 'var(--color-text-main)' }}>Check Reg 9A (Visiting Rights)</span> <ArrowRight size={16} color="var(--color-text-tertiary)" />
                        </li>
                        <li onClick={() => navigate('/templates')} style={{ padding: '0.75rem 0', borderBottom: '1px solid var(--color-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }}>
                            <span style={{ color: 'var(--color-text-main)' }}>Generate Staff Rota Evidence</span> <ArrowRight size={16} color="var(--color-text-tertiary)" />
                        </li>
                        <li onClick={() => navigate('/training/evisa')} style={{ padding: '0.75rem 0', borderBottom: '1px solid var(--color-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }}>
                            <span style={{ color: 'var(--color-text-main)' }}>e-Visa Training Module</span> <ArrowRight size={16} color="var(--color-text-tertiary)" />
                        </li>
                    </ul>
                </div>

                {/* Regulatory Intelligence */}
                <div className="card" style={{ borderTop: '4px solid var(--color-info)' }}>
                    <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
                        <BookOpen size={20} /> Regulatory Intelligence
                    </h3>
                    <p style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)', marginBottom: '1rem' }}>
                        <strong>Intersection Point:</strong> See how CQC Regulations and Home Office Sponsorship duties overlap.
                    </p>
                    <div className="flex" style={{ flexDirection: 'column', gap: '0.75rem' }}>
                        <div style={{ padding: '0.75rem', background: 'var(--color-bg-page)', borderRadius: 'var(--radius-sm)', fontSize: '0.85rem' }}>
                            <div className="flex items-center gap-2 mb-1">
                                <span className="badge badge-warning">Risk</span>
                                <strong style={{ color: 'var(--color-text-main)' }}>Closed Cultures</strong>
                            </div>
                            New guidance on systemic risks in isolated services.
                        </div>

                        <button
                            className="btn btn-secondary btn-full"
                            onClick={() => navigate('/resources')}
                            style={{ marginTop: '0.5rem' }}
                        >
                            Open Reference Library &rarr;
                        </button>
                    </div>
                </div>

                {/* Horizon Scanning (New) */}
                <div className="card" style={{ borderTop: '4px solid #8b5cf6' }}>
                    <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
                        <Shield size={20} color="#8b5cf6" /> 2026 Horizon
                    </h3>
                    <p style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)', marginBottom: '1rem' }}>
                        <strong>Future Readiness:</strong> Preparing for the "Contactless Border" & "Smarter Regulation".
                    </p>
                    <div className="flex" style={{ flexDirection: 'column', gap: '0.75rem' }}>
                        <div style={{ padding: '0.75rem', background: '#f5f3ff', borderRadius: 'var(--radius-sm)', fontSize: '0.85rem', border: '1px solid #ddd6fe' }}>
                            <div className="flex items-center gap-2 mb-1">
                                <span className="badge" style={{ background: '#8b5cf6', color: 'white' }}>Upcoming</span>
                                <strong style={{ color: '#4c1d95' }}>e-Visas Only (Late 2026)</strong>
                            </div>
                            Physical BRPs phase out. Digital-only status checks.
                        </div>

                        <button
                            className="btn btn-secondary btn-full"
                            onClick={() => navigate('/resources')} // Or anchor link if I could pass state
                            style={{ marginTop: '0.5rem', color: '#6d28d9', borderColor: '#ddd6fe' }}
                        >
                            View 2026 Roadmap &rarr;
                        </button>
                    </div>
                </div>

            </div>
        </div>
    );
};
