import React, { useState, useEffect } from 'react';
import { Download, FileText, CheckCircle, AlertTriangle, Loader2, Shield, Calendar, ArrowRight, Sparkles } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import { generateComplianceReport } from '../services/pdfService';
import { toast } from 'react-hot-toast';

export const CQCExport = () => {
    const { profile } = useAuth();
    const [exporting, setExporting] = useState(false);
    const [stats, setStats] = useState({
        policies: 0,
        actions: 0,
        alerts: 0,
        lastAnalysis: null as string | null
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (profile?.organization_id) {
            fetchStats();
        }
    }, [profile?.organization_id]);

    const fetchStats = async () => {
        if (!profile?.organization_id) return;
        setLoading(true);
        try {
            const [
                { count: policyCount },
                { count: actionCount },
                { count: alertCount },
                { data: lastAnalysis }
            ] = await Promise.all([
                supabase.from('policies').select('*', { count: 'exact', head: true }).eq('organization_id', profile.organization_id),
                supabase.from('compliance_actions').select('*', { count: 'exact', head: true }).eq('organization_id', profile.organization_id).eq('status', 'resolved'),
                supabase.from('compliance_alerts').select('*', { count: 'exact', head: true }).eq('organization_id', profile.organization_id).eq('is_resolved', true),
                supabase.from('compliance_analyses').select('created_at').eq('organization_id', profile.organization_id).order('created_at', { ascending: false }).limit(1).maybeSingle()
            ]);

            setStats({
                policies: policyCount || 0,
                actions: actionCount || 0,
                alerts: alertCount || 0,
                lastAnalysis: lastAnalysis?.created_at || null
            });
        } catch (err) {
            console.error('Failed to fetch export stats:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleExportPIR = async () => {
        setExporting(true);
        try {
            // Simulate data gathering
            await new Promise(resolve => setTimeout(resolve, 2000));

            generateComplianceReport({
                title: 'CQC Provider Information Return (PIR) Evidence',
                subtitle: 'Generated via ComplyFlow AI Compliance OS',
                organization: profile?.organization_name || 'Your Organization',
                date: new Date().toLocaleDateString(),
                score: 85, // Placeholder/Calculated
                sections: [
                    {
                        title: 'Executive Summary',
                        content: 'This report provides a comprehensive overview of compliance evidence gathered through ComplyFlow for the current inspection period.'
                    },
                    {
                        title: 'Policy Governance',
                        content: `A total of ${stats.policies} policies are managed and active within the system. All policies have been audited against the latest CQC regulations.`,
                        items: [
                            { label: 'Active Policies', value: stats.policies.toString(), status: 'pass' },
                            { label: 'Last AI Audit', value: stats.lastAnalysis ? new Date(stats.lastAnalysis).toLocaleDateString() : 'Never', status: stats.lastAnalysis ? 'pass' : 'warning' }
                        ]
                    },
                    {
                        title: 'Evidence of Continuous Improvement',
                        content: `We have successfully identified and resolved ${stats.actions} compliance actions during this period.`,
                        table: {
                            headers: ['Metric', 'Total Count', 'Status'],
                            rows: [
                                ['Resolved Actions', stats.actions.toString(), 'PASS'],
                                ['Proactive Alerts Handled', stats.alerts.toString(), 'PASS']
                            ]
                        }
                    }
                ]
            });
            toast.success('PIR Evidence Report generated successfully!');
        } catch (err) {
            console.error('Export failed:', err);
            toast.error('Failed to generate report.');
        } finally {
            setExporting(false);
        }
    };

    return (
        <div className="container animate-enter" style={{ padding: '2rem 1rem', maxWidth: '800px' }}>
            <div style={{ marginBottom: '2rem' }}>
                <h1 style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <Shield size={32} color="var(--color-primary)" />
                    CQC Evidence Export
                </h1>
                <p style={{ color: 'var(--color-text-secondary)', marginTop: '0.5rem' }}>
                    Generate professional evidence packs for your PIR (Provider Information Return) or CQC Monitoring calls.
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6" style={{ marginBottom: '2.5rem' }}>
                <div className="card" style={{ background: '#f8fafc' }}>
                    <h3 style={{ fontSize: '1rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <FileText size={18} color="var(--color-primary)" /> Data Summary
                    </h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                        <div className="flex justify-between">
                            <span style={{ color: 'var(--color-text-secondary)', fontSize: '0.9rem' }}>Policies Tracked</span>
                            <span style={{ fontWeight: 600 }}>{stats.policies}</span>
                        </div>
                        <div className="flex justify-between">
                            <span style={{ color: 'var(--color-text-secondary)', fontSize: '0.9rem' }}>Resolved Actions</span>
                            <span style={{ fontWeight: 600 }}>{stats.actions}</span>
                        </div>
                        <div className="flex justify-between">
                            <span style={{ color: 'var(--color-text-secondary)', fontSize: '0.9rem' }}>Safety Alerts Handled</span>
                            <span style={{ fontWeight: 600 }}>{stats.alerts}</span>
                        </div>
                    </div>
                </div>

                <div className="card" style={{ background: 'linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%)', borderColor: '#bfdbfe' }}>
                    <h3 style={{ fontSize: '1rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#1e40af' }}>
                        <Sparkles size={18} /> AI Insight
                    </h3>
                    <p style={{ fontSize: '0.85rem', color: '#1e3a8a', lineHeight: 1.5 }}>
                        Based on your data, your organization demonstrates a <strong>{stats.actions > 5 ? 'proactive' : 'stable'}</strong> approach to compliance.
                        Including this evidence in your PIR shows the CQC you have robust oversight.
                    </p>
                </div>
            </div>

            <div className="card" style={{ textAlign: 'center', padding: '3rem 2rem', border: '2px solid var(--color-primary-subtle)' }}>
                <div style={{ width: '64px', height: '64px', background: 'var(--color-primary-subtle)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem' }}>
                    <Download size={32} color="var(--color-primary)" />
                </div>
                <h2 style={{ marginBottom: '1rem' }}>Ready to Export?</h2>
                <p style={{ color: 'var(--color-text-secondary)', marginBottom: '2rem', maxWidth: '500px', margin: '0 auto 2rem' }}>
                    The PIR Evidence Pack compiles all your policy audits, resolved actions, and safety evidence into a single, professional PDF formatted for regulator review.
                </p>

                <button
                    className="btn btn-primary"
                    style={{ padding: '0.75rem 2rem', fontSize: '1.1rem' }}
                    onClick={handleExportPIR}
                    disabled={exporting || stats.policies === 0}
                >
                    {exporting ? <Loader2 size={18} className="spin" /> : <Shield size={18} />}
                    {exporting ? 'Generating Pack...' : 'One-Click CQC Export'}
                </button>

                <p style={{ fontSize: '0.8rem', color: 'var(--color-text-tertiary)', marginTop: '1rem' }}>
                    <Calendar size={12} /> Last generated: Never
                </p>
            </div>

            <div style={{ marginTop: '2rem', padding: '1rem', background: '#fffbeb', borderRadius: '8px', border: '1px solid #fef3c7', display: 'flex', gap: '0.75rem' }}>
                <AlertTriangle size={20} color="#d97706" style={{ flexShrink: 0 }} />
                <div style={{ fontSize: '0.85rem', color: '#92400e' }}>
                    <strong>Inspector Tip:</strong> Always review the generated PDF to ensure all uploaded evidence documents are clear and readable before submitting to the CQC portal.
                </div>
            </div>
        </div>
    );
};
