import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { BarChart3, AlertTriangle, CheckCircle, Clock, Download, ChevronRight, Activity, Shield, ClipboardList, TrendingUp, Award, Plus, X } from 'lucide-react';
import { useCompliance } from '../context/ComplianceContext';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';

export const GovernanceDashboard = () => {
    const navigate = useNavigate();
    const { companyName, getCurrentLocation } = useCompliance();
    const { profile } = useAuth();
    const [showAuditSchedule, setShowAuditSchedule] = useState(false);
    const [showRiskRegister, setShowRiskRegister] = useState(false);

    // Get currently selected location from Global Context
    const currentLocation = getCurrentLocation();
    const isHQ = !currentLocation || currentLocation.type === 'Head Office';

    // State for Real Data
    const [cqcData, setCqcData] = useState<any>(null);
    const [analyses, setAnalyses] = useState<any[]>([]);
    const [training, setTraining] = useState<any[]>([]);
    const [risks, setRisks] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        const fetchRealData = async () => {
            if (!profile?.organization_id) return;
            setLoading(true);
            try {
                // 1. Fetch CQC Live Ratings (HQ only)
                if (isHQ) {
                    const { data, error } = await supabase.functions.invoke('source-layer', {
                        body: { action: 'get-live-ratings', payload: { providerId: 'RXL' } }
                    });
                    if (!error && data) setCqcData(data);
                }

                // 2. Fetch AI Analyses History
                const { data: aData } = await supabase
                    .from('compliance_analyses')
                    .select('id, overall_score, summary, created_at, results')
                    .eq('organization_id', profile.organization_id)
                    .order('created_at', { ascending: false });
                if (aData) setAnalyses(aData);

                // 3. Fetch Training Completions
                const { data: tData } = await supabase
                    .from('training_completions')
                    .select('id, module_name, score, completed_at, profiles(full_name)')
                    .eq('organization_id', profile.organization_id)
                    .order('completed_at', { ascending: false });
                if (tData) setTraining(tData);

                // 4. Fetch Risk Register
                const { data: rData } = await supabase
                    .from('risk_register')
                    .select('*')
                    .eq('organization_id', profile.organization_id)
                    .order('created_at', { ascending: false });
                if (rData) setRisks(rData);

            } catch (err) {
                console.error("Failed to load governance data", err);
            } finally {
                setLoading(false);
            }
        };
        fetchRealData();
    }, [isHQ, profile?.organization_id]);

    // Branch Data Simulation (Mock - only used if no live data)
    const branchDomains = [
        { name: 'Safe', score: 'Good', trend: 'stable' },
        { name: 'Effective', score: 'Requires Improvement', trend: 'down' },
        { name: 'Caring', score: 'Good', trend: 'stable' },
        { name: 'Responsive', score: 'Good', trend: 'up' },
        { name: 'Well-led', score: 'Good', trend: 'up' }
    ];

    const hqDomains = [
        { name: 'Safe', score: 'Good', trend: 'stable' },
        { name: 'Effective', score: 'Good', trend: 'up' },
        { name: 'Caring', score: 'Outstanding', trend: 'stable' },
        { name: 'Responsive', score: 'Good', trend: 'down' },
        { name: 'Well-led', score: 'Requires Improvement', trend: 'down' }
    ];

    const displayDomains = cqcData ? cqcData.domains : (isHQ ? hqDomains : branchDomains);
    const providerName = cqcData ? cqcData.provider_name : (currentLocation?.name || "MeCare Health Services (Demo)");

    // Risk Register Logic
    const [newRisk, setNewRisk] = useState({ title: '', level: 'Medium', mitigation: '' });
    const [isAddingRisk, setIsAddingRisk] = useState(false);
    const [savingRisk, setSavingRisk] = useState(false);

    const handleAddRisk = async () => {
        if (!newRisk.title || !profile?.organization_id) return;
        setSavingRisk(true);
        try {
            const { data, error } = await supabase
                .from('risk_register')
                .insert({
                    organization_id: profile.organization_id,
                    title: newRisk.title,
                    level: newRisk.level,
                    mitigation: newRisk.mitigation,
                    created_by: profile.id
                })
                .select()
                .single();

            if (error) throw error;
            if (data) setRisks([data, ...risks]);

            setNewRisk({ title: '', level: 'Medium', mitigation: '' });
            setIsAddingRisk(false);
        } catch (error) {
            console.error('Error adding risk:', error);
            alert('Failed to save risk.');
        } finally {
            setSavingRisk(false);
        }
    };

    const getRiskColor = (level: string) => {
        switch (level) {
            case 'High': return 'var(--color-danger)';
            case 'Medium': return 'var(--color-warning)';
            default: return 'var(--color-success)';
        }
    };

    return (
        <div className="container animate-enter" style={{ padding: '2rem 1rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <div>
                    <h1 style={{ fontSize: '1.8rem', fontWeight: 700, color: 'var(--color-text-main)' }}>
                        Governance & Quality
                    </h1>
                    <p style={{ color: 'var(--color-text-secondary)' }}>
                        System oversight for <strong>{providerName}</strong>
                        <span style={{
                            display: 'inline-flex', alignItems: 'center', gap: '0.25rem',
                            marginLeft: '0.75rem', padding: '0.1rem 0.5rem',
                            background: isHQ ? '#e0f2fe' : '#fef9c3',
                            color: isHQ ? '#0369a1' : '#b45309',
                            borderRadius: '999px', fontSize: '0.75rem', fontWeight: 600,
                            border: `1px solid ${isHQ ? '#bae6fd' : '#fde047'}`
                        }}>
                            {currentLocation?.type || 'Head Office'}
                        </span>
                        {loading && <span style={{ fontSize: '0.8rem', marginLeft: '0.5rem' }}>(Syncing CQC...)</span>}
                    </p>
                </div>
                <div style={{ display: 'flex', gap: '1rem' }}>
                    <button
                        className="btn btn-primary"
                        onClick={() => {
                            const reportContent = `Board Compliance Report\n\nProvider: ${providerName}\nGenerated: ${new Date().toLocaleDateString()}\n\nCQC Ratings:\n${displayDomains.map((d: any) => `${d.name}: ${d.score}`).join('\n')}\n\nRisk Register:\n${risks.map(r => `${r.title} - ${r.level}`).join('\n')}`;
                            const blob = new Blob([reportContent], { type: 'text/plain' });
                            const url = URL.createObjectURL(blob);
                            const a = document.createElement('a');
                            a.href = url;
                            a.download = `board-report-${new Date().toISOString().split('T')[0]}.txt`;
                            a.click();
                            URL.revokeObjectURL(url);
                        }}
                    >
                        <Download size={16} style={{ marginRight: '0.5rem' }} /> Export Board Report
                    </button>
                    <button
                        className="btn btn-secondary"
                        onClick={() => setShowAuditSchedule(true)}
                    >
                        <Activity size={16} style={{ marginRight: '0.5rem' }} /> Audit Schedule
                    </button>
                </div>
            </div>

            {/* Top Level Stats - CQC Domains (Live) */}
            <div className="card" style={{ marginBottom: '2rem' }}>
                <h3 style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Shield size={20} color="var(--color-primary)" />
                    {isHQ ? 'CQC Ratings Overview (Consolidated)' : `Local Compliance: ${currentLocation?.name}`}
                    {cqcData && isHQ && <span className="badge badge-success" style={{ fontSize: '0.7rem' }}>LIVE DATA</span>}
                </h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '1rem' }}>
                    {displayDomains.map((d: any) => (
                        <div key={d.name} style={{ textAlign: 'center', padding: '1rem', background: '#f8fafc', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-border)' }}>
                            <div style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)', marginBottom: '0.5rem', fontWeight: 600 }}>{d.name.toUpperCase()}</div>
                            <div
                                className={`badge ${d.score === 'Outstanding' ? 'badge-success' :
                                    d.score === 'Good' ? 'badge-success' :
                                        d.score === 'Requires Improvement' ? 'badge-warning' : 'badge-danger'
                                    } `}
                                style={{ fontSize: '0.9rem', padding: '0.4rem 0.8rem' }}
                            >
                                {d.score}
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* AI Analysis History Section */}
            <div className="card" style={{ marginBottom: '2rem' }}>
                <h3 style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <TrendingUp size={20} color="var(--color-accent)" />
                    AI-Driven Gap Analysis History
                </h3>
                <div style={{ overflowX: 'auto' }}>
                    {analyses.length === 0 ? (
                        <p style={{ color: 'var(--color-text-tertiary)', textAlign: 'center', padding: '2rem' }}>No AI analyses found. Run a Gap Analysis to see data here.</p>
                    ) : (
                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                            <thead style={{ background: '#f8fafc', fontSize: '0.8rem', color: 'var(--color-text-tertiary)', textTransform: 'uppercase' }}>
                                <tr>
                                    <th style={{ textAlign: 'left', padding: '0.75rem' }}>Date</th>
                                    <th style={{ textAlign: 'left', padding: '0.75rem' }}>Score</th>
                                    <th style={{ textAlign: 'left', padding: '0.75rem' }}>Summary</th>
                                    <th style={{ textAlign: 'right', padding: '0.75rem' }}>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {analyses.map(a => (
                                    <tr key={a.id} style={{ borderBottom: '1px solid var(--color-border)', fontSize: '0.9rem' }}>
                                        <td style={{ padding: '0.75rem' }}>{new Date(a.created_at).toLocaleDateString()}</td>
                                        <td style={{ padding: '0.75rem' }}>
                                            <span style={{ fontWeight: 700, color: a.overall_score > 70 ? 'var(--color-success)' : 'var(--color-warning)' }}>
                                                {a.overall_score}%
                                            </span>
                                        </td>
                                        <td style={{ padding: '0.75rem' }}>{a.summary}</td>
                                        <td style={{ padding: '0.75rem', textAlign: 'right' }}>
                                            <button className="btn btn-secondary" style={{ fontSize: '0.7rem', padding: '0.2rem 0.5rem', height: 'auto' }}>
                                                View Full Report
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

                {/* Audit Schedule */}
                <div className="card">
                    <h3 className="flex items-center gap-2 mb-4 text-lg font-semibold">
                        <ClipboardList className="text-primary" size={20} />
                        Internal Audit Schedule
                    </h3>
                    <div className="space-y-3">
                        {[
                            { title: 'Infection Control', duedate: 'Overdue', status: 'Pending', color: 'text-danger' },
                            { title: 'Care Plans Audit', duedate: 'Due Today', status: 'In Progress', color: 'text-warning' },
                            { title: 'Health & Safety', duedate: 'Next Week', status: 'Scheduled', color: 'text-secondary' },
                        ].map((audit, i) => (
                            <div key={i} className="flex justify-between items-center p-3 bg-surface rounded-md border border-border">
                                <span className="font-medium text-main">{audit.title}</span>
                                <span className={`text - sm font - semibold ${audit.color} `}>{audit.duedate}</span>
                            </div>
                        ))}
                    </div>
                    <button
                        className="btn btn-secondary w-full mt-4 text-sm"
                        onClick={() => setShowAuditSchedule(true)}
                    >
                        View Full Schedule
                    </button>
                </div>

                {/* Risk Register */}
                <div className="card">
                    <h3 className="flex items-center gap-2 mb-4 text-lg font-semibold">
                        <AlertTriangle className="text-danger" size={20} />
                        Top Risks (Risk Register)
                    </h3>
                    <div className="space-y-3">
                        {risks.length === 0 ? (
                            <p className="text-center text-gray-500 py-4">No risks found.</p>
                        ) : risks.slice(0, 5).map((risk) => (
                            <div key={risk.id} className="p-3 bg-surface rounded-md border border-border relative overflow-hidden">
                                <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: '4px', background: getRiskColor(risk.level) }}></div>
                                <div className="flex justify-between items-start pl-2">
                                    <div>
                                        <div className="font-medium text-main">{risk.title}</div>
                                        <div className="text-xs text-secondary mt-1">Mitigation: {risk.mitigation}</div>
                                    </div>
                                    <span className="text-xs font-bold px-2 py-1 rounded bg-bg-page border border-border" style={{ color: getRiskColor(risk.level) }}>
                                        {risk.level}
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                    <button
                        className="btn btn-secondary w-full mt-4 text-sm"
                        onClick={() => setShowRiskRegister(true)}
                    >
                        Update Register
                    </button>
                </div>

                {/* Training Records Section */}
                <div className="card">
                    <h3 className="flex items-center gap-2 mb-4 text-lg font-semibold">
                        <Award className="text-success" size={20} />
                        Staff Training Compliance
                    </h3>
                    <div className="space-y-3">
                        {training.length === 0 ? (
                            <p style={{ textAlign: 'center', color: 'var(--color-text-tertiary)', padding: '1rem' }}>No training records found.</p>
                        ) : (
                            training.map(t => (
                                <div key={t.id} className="flex justify-between items-center p-3 bg-surface rounded-md border border-border">
                                    <div>
                                        <div className="font-medium text-main" style={{ fontSize: '0.9rem' }}>{t.module_name}</div>
                                        <div className="text-xs text-secondary">{t.profiles?.full_name || 'System User'} • {new Date(t.completed_at).toLocaleDateString()}</div>
                                    </div>
                                    <span className="badge badge-success" style={{ fontSize: '0.75rem' }}>{t.score}%</span>
                                </div>
                            ))
                        )}
                    </div>
                    <button className="btn btn-secondary w-full mt-4 text-sm" onClick={() => navigate('/training/evisa')}>Assign New Module</button>
                </div>

            </div>

            {/* KPI Section */}
            <div className="card mt-8">
                <h3 className="flex items-center gap-2 mb-6 text-lg font-semibold">
                    <TrendingUp className="text-success" size={20} />
                    Key Performance Indicators (Last 30 Days)
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                    <div className="text-center">
                        <div className="text-3xl font-bold text-main">98%</div>
                        <div className="text-sm text-secondary mt-1">Occupancy</div>
                    </div>
                    <div className="text-center">
                        <div className="text-3xl font-bold text-success">100%</div>
                        <div className="text-sm text-secondary mt-1">Mandatory Training</div>
                    </div>
                    <div className="text-center">
                        <div className="text-3xl font-bold text-danger">2</div>
                        <div className="text-sm text-secondary mt-1">Safeguarding Alerts</div>
                    </div>
                    <div className="text-center">
                        <div className="text-3xl font-bold text-main">4.8</div>
                        <div className="text-sm text-secondary mt-1">Review Score</div>
                    </div>
                </div>
            </div>

            {/* Audit Schedule Modal */}
            {showAuditSchedule && (
                <div style={{
                    position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000
                }}>
                    <div style={{
                        background: 'white', borderRadius: 'var(--radius-lg)',
                        padding: '2rem', maxWidth: '600px', width: '90%', maxHeight: '80vh', overflow: 'auto'
                    }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                            <h2 style={{ fontSize: '1.5rem', fontWeight: 700 }}>Full Audit Schedule</h2>
                            <button onClick={() => setShowAuditSchedule(false)} style={{ background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer' }}>×</button>
                        </div>
                        <div className="space-y-3">
                            {[
                                { title: 'Infection Control', date: 'Jan 15, 2026', status: 'Overdue', color: '#dc2626' },
                                { title: 'Care Plans Audit', date: 'Jan 20, 2026', status: 'In Progress', color: '#f59e0b' },
                                { title: 'Health & Safety', date: 'Jan 27, 2026', status: 'Scheduled', color: '#6b7280' },
                                { title: 'Medication Audit', date: 'Feb 5, 2026', status: 'Scheduled', color: '#6b7280' },
                                { title: 'Staff Training Review', date: 'Feb 15, 2026', status: 'Scheduled', color: '#6b7280' },
                                { title: 'Fire Safety Drill', date: 'Feb 28, 2026', status: 'Scheduled', color: '#6b7280' },
                            ].map((audit, i) => (
                                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem', background: '#f8fafc', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-border)' }}>
                                    <div>
                                        <div style={{ fontWeight: 600 }}>{audit.title}</div>
                                        <div style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)' }}>{audit.date}</div>
                                    </div>
                                    <span style={{ fontSize: '0.8rem', fontWeight: 600, color: audit.color }}>{audit.status}</span>
                                </div>
                            ))}
                        </div>
                        <button
                            className="btn btn-primary w-full mt-6"
                            onClick={() => setShowAuditSchedule(false)}
                        >
                            Close
                        </button>
                    </div>
                </div>
            )}

            {/* Risk Register Modal */}
            {showRiskRegister && (
                <div style={{
                    position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000
                }}>
                    <div style={{
                        background: 'white', borderRadius: 'var(--radius-lg)',
                        padding: '2rem', maxWidth: '700px', width: '90%', maxHeight: '80vh', overflow: 'auto'
                    }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                            <h2 style={{ fontSize: '1.5rem', fontWeight: 700 }}>Risk Register Management</h2>
                            <button onClick={() => setShowRiskRegister(false)} style={{ background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer' }}>×</button>
                        </div>
                        <p style={{ color: 'var(--color-text-secondary)', marginBottom: '1.5rem' }}>
                            Manage and track organizational risks. Update risk status, add mitigation strategies, and monitor progress.
                        </p>

                        {isAddingRisk ? (
                            <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg mb-4">
                                <h4 className="font-semibold mb-3">Add New Risk</h4>
                                <div className="space-y-3">
                                    <div>
                                        <label className="block text-sm font-medium mb-1">Risk Title</label>
                                        <input
                                            type="text"
                                            className="form-input w-full"
                                            value={newRisk.title}
                                            onChange={e => setNewRisk({ ...newRisk, title: e.target.value })}
                                            placeholder="e.g. Fire Safety Compliance"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium mb-1">Risk Level</label>
                                        <select
                                            className="form-input w-full"
                                            value={newRisk.level}
                                            onChange={e => setNewRisk({ ...newRisk, level: e.target.value })}
                                        >
                                            <option value="Low">Low</option>
                                            <option value="Medium">Medium</option>
                                            <option value="High">High</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium mb-1">Mitigation Strategy</label>
                                        <input
                                            type="text"
                                            className="form-input w-full"
                                            value={newRisk.mitigation}
                                            onChange={e => setNewRisk({ ...newRisk, mitigation: e.target.value })}
                                            placeholder="e.g. Daily checks implemented"
                                        />
                                    </div>
                                    <div className="flex gap-2 justify-end mt-2">
                                        <button className="btn btn-secondary text-sm" onClick={() => setIsAddingRisk(false)}>Cancel</button>
                                        <button className="btn btn-primary text-sm" onClick={handleAddRisk} disabled={savingRisk}>
                                            {savingRisk ? 'Saving...' : 'Save Risk'}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {risks.length === 0 ? <p className="text-center text-gray-500 py-4">No risks found.</p> : risks.map((risk) => (
                                    <div key={risk.id} style={{ padding: '1rem', background: '#f8fafc', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-border)', borderLeft: `4px solid ${getRiskColor(risk.level)}` }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                            <div>
                                                <div style={{ fontWeight: 600, marginBottom: '0.5rem' }}>{risk.title}</div>
                                                <div style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)' }}>Mitigation: {risk.mitigation}</div>
                                            </div>
                                            <span style={{ fontSize: '0.8rem', fontWeight: 600, padding: '0.25rem 0.5rem', borderRadius: 'var(--radius-sm)', background: getRiskColor(risk.level), color: 'white' }}>
                                                {risk.level}
                                            </span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}

                        <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem' }}>
                            {!isAddingRisk && (
                                <button
                                    className="btn btn-secondary flex-1"
                                    onClick={() => setIsAddingRisk(true)}
                                >
                                    <Plus size={16} className="mr-2" /> Add New Risk
                                </button>
                            )}
                            <button
                                className="btn btn-primary flex-1"
                                onClick={() => setShowRiskRegister(false)}
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}

        </div>
    );
};
