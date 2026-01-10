import React, { useState } from 'react';
import { ArrowLeft, BookOpen, Scale, ShieldAlert, GraduationCap, Globe, Sparkles, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { RegulatoryIntelligenceHub } from '../components/RegulatoryIntelligenceHub';

export const RegulatoryIntelligence = () => {
    const navigate = useNavigate();
    const [query, setQuery] = useState('');
    const [result, setResult] = useState<any>(null);
    const [loading, setLoading] = useState(false);
    const [hydrating, setHydrating] = useState(false);

    const handleQuery = async () => {
        if (!query) return;
        setLoading(true);
        setResult(null);
        try {
            const { data, error } = await supabase.functions.invoke('source-layer', {
                body: { action: 'reasoning-query', payload: { query } }
            });
            if (error) throw error;
            setResult(data);
        } catch (e: any) {
            alert('Knowledge Engine Error: ' + e.message);
        } finally {
            setLoading(false);
        }
    };

    const handleHydrate = async () => {
        setHydrating(true);
        try {
            const { safQualityStatements, homeOffice2025Rules } = await import('../lib/complianceData');

            // Chunking slightly for ingestion
            const text = `
                CQC SAF 2025: ${JSON.stringify(safQualityStatements)}
                HOME OFFICE RULES 2025: ${JSON.stringify(homeOffice2025Rules)}
            `;

            const { error } = await supabase.functions.invoke('source-layer', {
                body: { action: 'ingest-text', payload: { text, metadata: { source: 'System Hydration', type: 'rules_2025' } } }
            });

            if (error) throw error;
            alert('Knowledge Base Successfully Hydrated with 2025 Regulatory Rules!');
        } catch (e: any) {
            alert('Hydration Error: ' + e.message);
        } finally {
            setHydrating(false);
        }
    };

    return (
        <div className="container animate-enter" style={{ padding: '2rem 1rem', maxWidth: '1000px' }}>

            {/* Header */}
            <div style={{ marginBottom: '2rem' }}>
                <button
                    className="btn btn-secondary"
                    onClick={() => navigate('/dashboard')}
                    style={{ marginBottom: '1rem', padding: '0.5rem 1rem' }}
                >
                    <ArrowLeft size={16} /> Back to Dashboard
                </button>
                <h1>Regulatory Intelligence</h1>
                <p style={{ color: 'var(--color-text-secondary)', marginTop: '0.5rem' }}>
                    Real-time updates from CQC, Home Office, NICE, and DHSC. Stay ahead of regulatory changes.
                </p>
            </div>

            {/* Real-Time Regulatory Updates Hub */}
            <div style={{ marginBottom: '2rem' }}>
                <RegulatoryIntelligenceHub maxItems={10} showFilters={true} />
            </div>

            {/* Knowledge Engine Interface */}
            <div className="card" style={{ marginBottom: '2rem', borderTop: '4px solid var(--color-primary)' }}>
                <div className="flex justify-between items-center mb-4">
                    <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <Sparkles size={20} color="var(--color-primary)" /> Ask the Regulatory Knowledge Engine
                    </h3>
                    <button
                        className="btn btn-secondary"
                        style={{ fontSize: '0.8rem', padding: '0.4rem 0.8rem' }}
                        onClick={handleHydrate}
                        disabled={hydrating}
                    >
                        {hydrating ? <Loader2 className="animate-spin" size={14} /> : <Globe size={14} />}
                        {hydrating ? ' Hydrating...' : ' Sync 2025 Rules'}
                    </button>
                </div>

                <div className="flex flex-col gap-4">
                    <textarea
                        placeholder="e.g., What are the 'I statements' for Safe Care under the 2025 SAF?"
                        className="form-input"
                        style={{ minHeight: '100px', width: '100%', padding: '1rem' }}
                        value={query}
                        onChange={e => setQuery(e.target.value)}
                    />
                    <button
                        className="btn btn-primary btn-full"
                        onClick={handleQuery}
                        disabled={loading || !query}
                    >
                        {loading ? <Loader2 className="animate-spin" /> : <SearchIcon />}
                        {loading ? 'Consulting Knowledge Base...' : 'Analyze & Search'}
                    </button>

                    {result && (
                        <div className="animate-enter" style={{ padding: '1.5rem', background: '#f8fafc', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)' }}>
                            <div style={{ fontWeight: 600, marginBottom: '0.75rem', color: 'var(--color-primary)' }}>Expert Guidance:</div>
                            <div style={{ lineHeight: '1.6', color: 'var(--color-text-main)', fontSize: '0.95rem', whiteSpace: 'pre-wrap' }}>
                                {result.response}
                            </div>
                            {result.citations && (
                                <div style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid #e2e8f0' }}>
                                    <div style={{ fontSize: '0.75rem', fontWeight: 600, color: '#64748b', marginBottom: '0.5rem' }}>SOURCES:</div>
                                    <div className="flex gap-2 flex-wrap">
                                        {result.citations.map((c: any, i: number) => (
                                            <span key={i} className="badge" style={{ background: '#e0f2fe', color: '#0369a1', fontSize: '0.7rem' }}>
                                                {c.source} ({Math.round(c.confidence * 100)}%)
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* Matrix Section */}
            <div className="card" style={{ marginBottom: '2rem' }}>
                <h2 style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>
                    <Scale size={24} color="var(--color-primary)" />
                    Regulatory Intersection Point
                </h2>
                <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
                        <thead>
                            <tr style={{ background: 'var(--color-bg-surface)', borderBottom: '2px solid var(--color-border)' }}>
                                <th style={{ padding: '1rem', textAlign: 'left' }}>Requirement</th>
                                <th style={{ padding: '1rem', textAlign: 'left' }}>CQC View</th>
                                <th style={{ padding: '1rem', textAlign: 'left' }}>Home Office View</th>
                            </tr>
                        </thead>
                        <tbody>
                            {[
                                { req: 'Staff Competence', cqc: 'Reg 18: Sufficient & Qualified Staff', ho: 'Skills test & Salary thresholds' },
                                { req: 'Right-to-Work', cqc: 'Reg 19: Fit & Proper testing', ho: 'Mandatory RTW Digital Checks' },
                                { req: 'Record Keeping', cqc: 'Reg 17: Governance & auditing', ho: 'CoS Maintenance & Reporting' }
                            ].map((row, i) => (
                                <tr key={i} style={{ borderBottom: '1px solid var(--color-border)' }}>
                                    <td style={{ padding: '1rem', fontWeight: 600 }}>{row.req}</td>
                                    <td style={{ padding: '1rem' }}>{row.cqc}</td>
                                    <td style={{ padding: '1rem' }}>{row.ho}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Systemic Risks */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="card">
                    <h3 className="flex items-center gap-2 mb-3"><ShieldAlert color="var(--color-danger)" /> Systemic Risks</h3>
                    <p className="text-sm text-secondary">
                        <strong>"Closed cultures"</strong> are flagged by CQC as high-risk environments. For sponsors, this often overlaps with poor oversight of migrant worker welfare.
                    </p>
                </div>
                <div className="card">
                    <h3 className="flex items-center gap-2 mb-3"><GraduationCap color="var(--color-accent)" /> Compliance Horizon</h3>
                    <p className="text-sm text-secondary">
                        The 2025/2026 transition to fully digital <strong>eVisas</strong> is the single biggest risk point for care providers. Audit your BRP files now.
                    </p>
                </div>
            </div>

        </div>
    );
};

const SearchIcon = () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
);
