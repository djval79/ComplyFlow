import React, { useState } from 'react';
import { ShieldCheck, User, Clock, AlertTriangle, CheckCircle, Search, Calendar } from 'lucide-react';

export const SponsorGuardian = () => {
    const [filter, setFilter] = useState('all');
    const [showCosModal, setShowCosModal] = useState(false);

    const workers = [
        { id: 'W001', name: 'Sarah Jenkins', visa: 'Health & Care (SWV)', expiry: '2027-03-15', status: 'compliant', lastCheck: '2024-03-15' },
        { id: 'W002', name: 'Raj Patel', visa: 'Health & Care (SWV)', expiry: '2025-06-20', status: 'compliant', lastCheck: '2024-01-10' },
        { id: 'W003', name: 'Elena Rodriguez', visa: 'Health & Care (SWV)', expiry: '2025-04-10', status: 'warning', lastCheck: '2022-04-11', note: 'Visa expiring in < 4 months' },
        { id: 'W004', name: 'Michael Chen', visa: 'Student (20hrs)', expiry: '2025-09-01', status: 'compliant', lastCheck: '2024-09-01' },
        { id: 'W005', name: 'Amara Okeke', visa: 'Health & Care (SWV)', expiry: '2026-11-30', status: 'alert', lastCheck: 'Pending', note: 'Address update unreported' },
    ];

    const getStatusColor = (s: string) => {
        if (s === 'compliant') return 'var(--color-success)';
        if (s === 'warning') return 'var(--color-warning)';
        return 'var(--color-danger)';
    };

    const getStatusBadge = (s: string) => {
        if (s === 'compliant') return <span className="badge badge-success">Compliant</span>;
        if (s === 'warning') return <span className="badge badge-warning">Review Needed</span>;
        return <span className="badge badge-danger">Action Required</span>;
    };

    return (
        <div className="container animate-enter" style={{ padding: '2rem 1rem' }}>

            {/* Licence Header */}
            <div className="card" style={{ marginBottom: '2rem', background: 'linear-gradient(to right, #f0f9ff, #e0f2fe)', borderColor: '#bae6fd' }}>
                <div className="flex justify-between items-center flex-wrap gap-4">
                    <div>
                        <h1 style={{ fontSize: '1.5rem', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.75rem', color: '#0369a1' }}>
                            <ShieldCheck /> Sponsor Licence Overview
                        </h1>
                        <div className="flex gap-4 text-sm" style={{ color: '#0c4a6e' }}>
                            <div className="flex items-center gap-1"><CheckCircle size={16} /> Status: <strong>A-Rated</strong></div>
                            <div className="flex items-center gap-1"><Calendar size={16} /> Renewal: <strong>14 Aug 2028</strong></div>
                            <div className="flex items-center gap-1"><User size={16} /> Certificates (CoS): <strong>8 / 15 Used</strong></div>
                        </div>
                    </div>

                    <div className="flex gap-2">
                        <button
                            className="btn btn-primary"
                            style={{ background: '#0284c7', borderColor: '#0284c7' }}
                            onClick={() => setShowCosModal(true)}
                        >
                            + Assign CoS
                        </button>
                        <button
                            className="btn btn-secondary"
                            style={{ background: 'white' }}
                            onClick={() => alert('Report Activity Module: Connecting to SMS... (Simulated)')}
                        >
                            Report Activity
                        </button>
                    </div>
                </div>
            </div>

            {/* CoS Modal (Simulated) */}
            {showCosModal && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                    background: 'rgba(0,0,0,0.5)', zIndex: 999,
                    display: 'flex', alignItems: 'center', justifyContent: 'center'
                }}>
                    <div className="card animate-enter" style={{ width: '400px', padding: '2rem' }}>
                        <h2 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '1rem' }}>Assign Certificate of Sponsorship</h2>
                        <p style={{ color: 'var(--color-text-secondary)', marginBottom: '1.5rem' }}>
                            Allocate an Undefined CoS to a new worker. Make sure you have verified their Right to Work first.
                        </p>

                        <div className="space-y-4 mb-6">
                            <div>
                                <label className="block text-sm font-medium mb-1">Worker Name</label>
                                <input type="text" className="form-input w-full" placeholder="e.g. John Doe" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1">Passport Number</label>
                                <input type="text" className="form-input w-full" placeholder="e.g. P12345678" />
                            </div>
                        </div>

                        <div className="flex justify-end gap-3">
                            <button
                                className="btn btn-secondary"
                                onClick={() => setShowCosModal(false)}
                            >
                                Cancel
                            </button>
                            <button
                                className="btn btn-primary"
                                onClick={() => {
                                    alert('CoS Generated! Reference: C1234X');
                                    setShowCosModal(false);
                                }}
                            >
                                Generate CoS
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Alerts */}
            <div className="flex gap-4 mb-6 flex-wrap">
                <div className="card flex-1" style={{ background: '#fef2f2', borderColor: '#fecaca', padding: '1rem' }}>
                    <div className="flex items-start gap-3">
                        <AlertTriangle color="#dc2626" className="mt-1" />
                        <div>
                            <h3 style={{ fontSize: '1rem', color: '#991b1b' }}>1 Unreported Change</h3>
                            <p style={{ fontSize: '0.875rem', color: '#b91c1c' }}>Worker W005 (Amara Okeke) changed address 8 days ago. Report by Friday.</p>
                            <button className="mt-2 text-sm font-medium" style={{ color: '#dc2626', textDecoration: 'underline', background: 'none', border: 'none', padding: 0 }}>Resolve now</button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Workers List */}
            <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
                <div style={{ padding: '1rem', borderBottom: '1px solid var(--color-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#f8fafc' }}>
                    <h3 style={{ fontSize: '1.1rem' }}>Sponsored Workers (5)</h3>
                    <div className="flex gap-2">
                        <div style={{ position: 'relative' }}>
                            <Search size={16} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                            <input type="text" placeholder="Search worker..." className="form-input" style={{ paddingLeft: '2.2rem', width: '250px' }} />
                        </div>
                    </div>
                </div>

                <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
                        <thead style={{ background: '#f1f5f9', color: '#475569', textAlign: 'left' }}>
                            <tr>
                                <th style={{ padding: '0.75rem 1rem', fontWeight: 600 }}>Worker</th>
                                <th style={{ padding: '0.75rem 1rem', fontWeight: 600 }}>Visa Type</th>
                                <th style={{ padding: '0.75rem 1rem', fontWeight: 600 }}>Expiry Date</th>
                                <th style={{ padding: '0.75rem 1rem', fontWeight: 600 }}>Compliance</th>
                                <th style={{ padding: '0.75rem 1rem', fontWeight: 600 }}>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {workers.map(w => (
                                <tr key={w.id} style={{ borderBottom: '1px solid var(--color-border)' }}>
                                    <td style={{ padding: '1rem' }}>
                                        <div style={{ fontWeight: 500 }}>{w.name}</div>
                                        <div style={{ fontSize: '0.75rem', color: '#64748b' }}>ID: {w.id}</div>
                                    </td>
                                    <td style={{ padding: '1rem' }}>{w.visa}</td>
                                    <td style={{ padding: '1rem' }}>
                                        <div className="flex items-center gap-2">
                                            {w.expiry}
                                            {w.status !== 'compliant' && <Clock size={14} color={getStatusColor(w.status)} />}
                                        </div>
                                    </td>
                                    <td style={{ padding: '1rem' }}>
                                        <div className="flex flex-col gap-1">
                                            {getStatusBadge(w.status)}
                                            {w.note && <span style={{ fontSize: '0.75rem', color: getStatusColor(w.status) }}>{w.note}</span>}
                                        </div>
                                    </td>
                                    <td style={{ padding: '1rem' }}>
                                        <button className="btn btn-secondary" style={{ padding: '0.25rem 0.5rem', fontSize: '0.8rem' }}>View File</button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

        </div>
    );
};
