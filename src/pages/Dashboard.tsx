import React, { useEffect, useState } from 'react';
import { AlertTriangle, CheckCircle, FileText, Calendar, ArrowRight, BookOpen, Shield, Plus, Loader2, Sparkles, TrendingUp, Bell, ExternalLink } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCompliance } from '../context/ComplianceContext';
import { supabase } from '../lib/supabase';
import { complianceService } from '../services/complianceService';
import { ExecutiveSummary } from '../components/ExecutiveSummary';
import { OnboardingProgress, TrialBanner } from '../components/ConversionWidgets';
import { DEMO_REGULATORY_UPDATES } from '../services/regulatoryIntelligence';

export const Dashboard = () => {
    const { profile, isDemo } = useAuth();
    const { companyName } = useCompliance();
    const navigate = useNavigate();
    const [alerts, setAlerts] = useState<any[]>([]);
    const [latestScore, setLatestScore] = useState<number | null>(null);
    const [loadingAlerts, setLoadingAlerts] = useState(!isDemo);

    useEffect(() => {
        const orgId = profile?.organization_id;
        if (!isDemo && orgId) {
            const initDashboard = async () => {
                await complianceService.refreshAlerts(orgId);
                fetchAlerts();
            };
            initDashboard();
        }
    }, [profile?.organization_id, isDemo]);

    const fetchAlerts = async () => {
        const { data, error } = await supabase
            .from('compliance_alerts')
            .select('*')
            .eq('organization_id', profile?.organization_id)
            .eq('is_resolved', false)
            .limit(3);

        if (!error && data) setAlerts(data);

        // Also fetch latest score
        const { data: scoreData } = await supabase
            .from('compliance_analyses')
            .select('overall_score')
            .eq('organization_id', profile?.organization_id)
            .order('created_at', { ascending: false })
            .limit(1)
            .maybeSingle();

        if (scoreData) setLatestScore(scoreData.overall_score);
        setLoadingAlerts(false);
    };

    const displayName = profile?.organization_name || (isDemo ? companyName : 'Your Organization');

    return (
        <div className="container animate-enter" style={{ padding: '2rem 1rem' }}>

            {/* Welcome Header */}
            <div style={{ marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                        <span style={{ fontSize: '0.8rem', color: 'var(--color-text-tertiary)' }}>
                            {new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' })}
                        </span>
                    </div>
                    <h1 style={{ fontSize: '1.8rem', fontWeight: 700, color: 'var(--color-text-main)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        Good {new Date().getHours() < 12 ? 'morning' : new Date().getHours() < 18 ? 'afternoon' : 'evening'}, {profile?.full_name?.split(' ')[0] || 'there'}
                        <Sparkles size={24} color="#fbbf24" style={{ animation: 'pulse 2s infinite' }} />
                    </h1>
                    <p style={{ color: 'var(--color-text-secondary)', marginTop: '0.25rem' }}>
                        Compliance command center for <strong>{displayName}</strong>
                    </p>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    {isDemo && (
                        <div style={{ background: '#fef3c7', padding: '0.5rem 1rem', borderRadius: 'var(--radius-md)', border: '1px solid #fcd34d', fontSize: '0.8rem', color: '#92400e' }}>
                            <strong>Demo Sandbox</strong>: Data is not persisted.
                        </div>
                    )}
                    <button
                        onClick={() => navigate('/cqc/gap-analysis')}
                        className="btn btn-primary"
                        style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}
                    >
                        <TrendingUp size={16} />
                        Run Analysis
                    </button>
                </div>
            </div>

            {/* Executive Summary - CEO Level Metrics */}
            <ExecutiveSummary />

            {/* Onboarding Progress for new users */}
            <OnboardingProgress />

            {/* Critical Alerts Strip */}
            {!isDemo && alerts.length > 0 && (
                <div className="card" style={{ background: '#fef2f2', borderColor: '#fecaca', marginBottom: '2rem', padding: '1rem' }}>
                    <div className="flex items-center gap-3">
                        <AlertTriangle color="var(--color-danger)" />
                        <div style={{ flex: 1 }}>
                            <strong style={{ color: '#991b1b' }}>{alerts.length} Critical Alerts:</strong>
                            <span style={{ marginLeft: '0.5rem', color: '#b91c1c', fontSize: '0.9rem' }}>{alerts[0].title} and more require your attention.</span>
                        </div>
                        <button className="btn btn-secondary" style={{ padding: '0.25rem 0.75rem', fontSize: '0.8rem' }} onClick={() => navigate('/governance')}>View All</button>
                    </div>
                </div>
            )}

            {/* Action Grid & Score */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem', marginBottom: '2.5rem' }}>

                {/* Compliance Score Widget */}
                <div className="card" style={{ background: 'var(--color-bg-surface)', borderLeft: '4px solid #4f46e5' }}>
                    <h3 style={{ fontSize: '0.9rem', color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '1rem' }}>
                        Live Compliance Score
                    </h3>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
                        <div style={{
                            width: '80px', height: '80px', borderRadius: '50%', border: '6px solid #e2e8f0',
                            display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative'
                        }}>
                            <svg width="80" height="80" style={{ position: 'absolute', transform: 'rotate(-90deg)' }}>
                                <circle
                                    cx="40" cy="40" r="34" fill="transparent" stroke="#4f46e5" strokeWidth="6"
                                    strokeDasharray={`${(latestScore || 0) * 2.13} 213`} strokeLinecap="round"
                                />
                            </svg>
                            <span style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--color-text-main)' }}>{latestScore || '--'}%</span>
                        </div>
                        <div>
                            <div style={{ fontWeight: 600, color: (latestScore || 0) > 80 ? 'var(--color-success)' : 'var(--color-warning)' }}>
                                {(latestScore || 0) > 80 ? 'Good Standing' : (latestScore === null ? 'No Data' : 'Review Required')}
                            </div>
                            <p style={{ fontSize: '0.8rem', color: 'var(--color-text-tertiary)', marginTop: '0.25rem' }}>
                                Based on your last <strong>{latestScore === null ? '0' : '1'}</strong> AI Gap Analysis.
                            </p>
                        </div>
                    </div>
                </div>

                {/* Action Card 1: Setup / Gap Analysis */}
                <div className="card" style={{ borderTop: '4px solid var(--color-primary)' }}>
                    <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem', fontSize: '1.1rem' }}>
                        <Shield size={22} color="var(--color-primary)" /> CQC Compliance
                    </h3>
                    <p style={{ fontSize: '0.9rem', color: 'var(--color-text-secondary)', marginBottom: '1.5rem' }}>
                        Identify missing policies and high-risk regulatory gaps in minutes.
                    </p>
                    <button className="btn btn-primary btn-full" onClick={() => navigate('/cqc/gap-analysis')}>
                        Start Gap Analysis
                    </button>
                </div>

                {/* Action Card 2: Policies */}
                <div className="card" style={{ borderTop: '4px solid var(--color-success)' }}>
                    <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem', fontSize: '1.1rem' }}>
                        <FileText size={22} color="var(--color-success)" /> Policy Templates
                    </h3>
                    <p style={{ fontSize: '0.9rem', color: 'var(--color-text-secondary)', marginBottom: '1.5rem' }}>
                        Access our pre-vetted legal template library for Care Homes.
                    </p>
                    <button className="btn btn-secondary btn-full" onClick={() => navigate('/templates')}>
                        Browse Library
                    </button>
                </div>

                {/* Action Card 3: Staff */}
                <div className="card" style={{ borderTop: '4px solid var(--color-accent)' }}>
                    <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem', fontSize: '1.1rem' }}>
                        <CheckCircle size={22} color="var(--color-accent)" /> Sponsor Licence
                    </h3>
                    <p style={{ fontSize: '0.9rem', color: 'var(--color-text-secondary)', marginBottom: '1.5rem' }}>
                        Monitor visa expiries and Right-to-Work compliance for migrants.
                    </p>
                    <button className="btn btn-secondary btn-full" onClick={() => navigate('/sponsor')}>
                        Manage Workforce
                    </button>
                </div>
            </div>

            {/* Quick Actions & Intel */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem' }}>

                {/* Quick Start List */}
                <div className="card">
                    <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.25rem' }}>
                        <Plus size={20} /> Quick Tasks
                    </h3>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.75rem' }}>
                        {[
                            { label: 'Check Reg 9A (Visiting)', path: '/cqc/visiting-rights' },
                            { label: 'e-Visa Training Module', path: '/training/evisa' },
                            { label: 'Start AI Inspection Simulator', path: '/cqc/simulator' },
                            { label: 'Chat with CQC Advisor', path: '/cqc/advisor' }
                        ].map((item, i) => (
                            <div
                                key={i}
                                onClick={() => navigate(item.path)}
                                style={{
                                    padding: '0.75rem',
                                    border: '1px solid var(--color-border)',
                                    borderRadius: 'var(--radius-md)',
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center',
                                    cursor: 'pointer',
                                    transition: 'all 0.2s',
                                    background: 'white'
                                }}
                                onMouseEnter={(e) => {
                                    e.currentTarget.style.background = 'var(--color-bg-page)';
                                    e.currentTarget.style.borderColor = 'var(--color-accent)';
                                }}
                                onMouseLeave={(e) => {
                                    e.currentTarget.style.background = 'white';
                                    e.currentTarget.style.borderColor = 'var(--color-border)';
                                }}
                            >
                                <span style={{ color: 'var(--color-text-main)', fontSize: '0.85rem', fontWeight: 500 }}>{item.label}</span>
                                <ArrowRight size={14} color="var(--color-text-tertiary)" />
                            </div>
                        ))}
                    </div>
                </div>

                {/* Regulatory Intelligence */}
                <div className="card" style={{ background: '#fcfaff', borderColor: '#e9d5ff' }}>
                    <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
                        <Bell size={20} color="#7c3aed" /> Regulatory Updates
                        <span style={{
                            background: '#7c3aed',
                            color: 'white',
                            fontSize: '0.65rem',
                            fontWeight: 700,
                            padding: '0.15rem 0.4rem',
                            borderRadius: '9999px',
                            marginLeft: '0.25rem'
                        }}>
                            {DEMO_REGULATORY_UPDATES.filter(u => !u.is_read).length} new
                        </span>
                    </h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '1rem' }}>
                        {DEMO_REGULATORY_UPDATES.slice(0, 2).map((update, i) => (
                            <a
                                key={i}
                                href={update.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                style={{
                                    padding: '0.75rem',
                                    background: 'white',
                                    borderRadius: 'var(--radius-sm)',
                                    border: '1px solid #e9d5ff',
                                    textDecoration: 'none',
                                    fontSize: '0.8rem'
                                }}
                            >
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                    <div>
                                        <span style={{
                                            fontSize: '0.65rem',
                                            fontWeight: 600,
                                            color: '#7c3aed',
                                            textTransform: 'uppercase'
                                        }}>
                                            {update.source.replace('_', ' ')}
                                        </span>
                                        <div style={{ color: 'var(--color-text-main)', fontWeight: 500, marginTop: '0.25rem', lineHeight: 1.3 }}>
                                            {update.title.length > 60 ? update.title.slice(0, 60) + '...' : update.title}
                                        </div>
                                    </div>
                                    <ExternalLink size={12} color="#a78bfa" style={{ flexShrink: 0, marginLeft: '0.5rem' }} />
                                </div>
                            </a>
                        ))}
                    </div>
                    <button
                        className="btn btn-secondary btn-full"
                        style={{ background: 'white', color: '#7c3aed', borderColor: '#ddd6fe' }}
                        onClick={() => navigate('/resources')}
                    >
                        View All Updates &rarr;
                    </button>
                </div>

                {/* System Status / Governance */}
                <div className="card">
                    <h3 style={{ marginBottom: '1rem', fontSize: '1rem' }}>System Integrity</h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        <div className="flex justify-between items-center">
                            <span style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)' }}>AI Proxy Connectivity</span>
                            <span className="badge badge-success">Operational</span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)' }}>Vector Search Engine</span>
                            <span className="badge badge-success">Live</span>
                        </div>
                        <div style={{ marginTop: '0.5rem', padding: '1rem', background: 'var(--color-bg-page)', borderRadius: 'var(--radius-sm)' }}>
                            <div style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--color-text-tertiary)', textTransform: 'uppercase' }}>Upcoming Audit</div>
                            <div style={{ fontSize: '0.9rem', color: 'var(--color-text-main)', fontWeight: 600 }}>Home Office 2025 Readiness Check</div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
