import React, { useState, useEffect } from 'react';
import { BarChart3, AlertTriangle, CheckCircle, Clock, Download, ChevronRight, Activity, Shield, ClipboardList, TrendingUp } from 'lucide-react';
import { useCompliance } from '../context/ComplianceContext';
import { useAuth } from '../context/AuthContext';

export const GovernanceDashboard = () => {
    const { companyName, getCurrentLocation } = useCompliance(); // Removed 'locations' from here as we use the helper
    const { profile } = useAuth();

    // Get currently selected location from Global Context
    const currentLocation = getCurrentLocation();
    const isHQ = !currentLocation || currentLocation.type === 'Head Office';

    // State for CQC Data (Real)
    const [cqcData, setCqcData] = useState<any>(null);
    const [loading, setLoading] = useState(false);

    // Hardcoded ID for MVP demonstration
    const PROVIDER_ID = '1-1002345678';

    useEffect(() => {
        const fetchRealData = async () => {
            // Only fetch real data for HQ to simulate different sources
            if (!isHQ) {
                setCqcData(null); // Reset for branches (simulating different data source)
                return;
            }

            setLoading(true);
            try {
                const { supabase } = await import('../lib/supabase');
                const { data, error } = await supabase.functions.invoke('source-layer', {
                    body: { action: 'get-live-ratings', payload: { providerId: 'RXL' } }
                });
                if (error) throw error;
                if (data) setCqcData(data);
            } catch (err) {
                console.error("Failed to load live CQC data", err);
            } finally {
                setLoading(false);
            }
        };
        fetchRealData();
    }, [isHQ]); // Re-run when location changes

    // Branch Data Simulation (Mock)
    const branchDomains = [
        { name: 'Safe', score: 'Good', trend: 'stable' },
        { name: 'Effective', score: 'Requires Improvement', trend: 'down' }, // Different from HQ
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

    // Select Data Source based on Location
    const displayDomains = cqcData ? cqcData.domains : (isHQ ? hqDomains : branchDomains);
    const providerName = cqcData ? cqcData.provider_name : (currentLocation?.name || "MeCare Health Services (Demo)");

    // Mock Risk Register
    const risks = [
        { id: 1, title: 'Staff Vacancy Rate', level: 'High', mitigation: 'Recruitment drive active' },
        { id: 2, title: 'Medication Errors', level: 'Medium', mitigation: 'New eMAR system training' },
        { id: 3, title: 'Building Maintenance', level: 'Low', mitigation: 'Contractor scheduled' }
    ];

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
                        {/* Location Badge */}
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
                    <button className="btn btn-primary">
                        <Download size={16} style={{ marginRight: '0.5rem' }} /> Export Board Report
                    </button>
                    <button className="btn btn-secondary">
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
                    <button className="btn btn-secondary w-full mt-4 text-sm">View Full Schedule</button>
                </div>

                {/* Risk Register */}
                <div className="card">
                    <h3 className="flex items-center gap-2 mb-4 text-lg font-semibold">
                        <AlertTriangle className="text-danger" size={20} />
                        Top Risks (Risk Register)
                    </h3>
                    <div className="space-y-3">
                        {risks.map((risk) => (
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
                    <button className="btn btn-secondary w-full mt-4 text-sm">Update Register</button>
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

        </div>
    );
};
