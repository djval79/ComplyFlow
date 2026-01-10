import React, { useState, useEffect } from 'react';
import { ShieldCheck, User, Clock, AlertTriangle, CheckCircle, Search, Calendar, Loader2, Plus } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';

import { complianceService } from '../services/complianceService';
import { UpgradePrompt } from '../components/ConversionWidgets';

export const SponsorGuardian = () => {
    const { profile, isDemo } = useAuth();
    const [workers, setWorkers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('');
    const [showCosModal, setShowCosModal] = useState(false);

    const [isSaving, setIsSaving] = useState(false);

    // New Worker State
    const [newWorker, setNewWorker] = useState({
        full_name: '',
        visa_type: 'Health & Care (SWV)',
        visa_expiry: '',
        cos_number: ''
    });

    useEffect(() => {
        if (profile?.organization_id) {
            fetchWorkers();
        }
    }, [profile?.organization_id]);

    const fetchWorkers = async () => {
        if (!profile?.organization_id) return;
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('sponsored_workers')
                .select('*')
                .eq('organization_id', profile.organization_id)
                .order('created_at', { ascending: false });

            if (error) throw error;
            if (data) setWorkers(data);
        } catch (err: any) {
            console.error('Fetch workers error:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleAddWorker = async (e: React.FormEvent) => {
        e.preventDefault();

        const orgId = profile?.organization_id;
        if (!orgId) {
            alert("Error: Your account profile is not fully loaded. This usually means your organization setup is incomplete. Try logging out and back in, or contact support.");
            return;
        }

        setIsSaving(true);
        try {
            console.log('[SponsorGuardian] Adding worker for org:', orgId);
            const { data, error } = await supabase
                .from('sponsored_workers')
                .insert({
                    ...newWorker,
                    organization_id: orgId,
                    status: 'compliant'
                })
                .select();

            if (error) {
                console.error('[SponsorGuardian] Insert error:', error);
                throw error;
            }

            console.log('[SponsorGuardian] Worker added successfully:', data);

            // Proactively refresh alerts to catch visa expiries
            try {
                await complianceService.refreshAlerts(orgId);
            } catch (alertErr) {
                console.warn('[SponsorGuardian] Alert refresh failed (non-critical):', alertErr);
            }

            setShowCosModal(false);
            await fetchWorkers();
            setNewWorker({ full_name: '', visa_type: 'Health & Care (SWV)', visa_expiry: '', cos_number: '' });
        } catch (err: any) {
            console.error('Error adding worker:', err);
            alert('Error adding worker: ' + (err.message || 'Unknown database error. Check your permissions.'));
        } finally {
            setIsSaving(false);
        }
    };

    if (!profile) {
        return (
            <div className="container" style={{ padding: '4rem 1rem', textAlign: 'center' }}>
                <div className="card">
                    <Loader2 className="animate-spin" size={40} style={{ margin: '0 auto 1rem', color: 'var(--color-primary)' }} />
                    <h2>Loading Your Profile...</h2>
                    <p style={{ color: 'var(--color-text-secondary)' }}>If this takes too long, please ensure your account is fully set up.</p>
                </div>
            </div>
        );
    }

    if (!profile.organization_id) {
        return (
            <div className="container" style={{ padding: '4rem 1rem', textAlign: 'center' }}>
                <div className="card" style={{ maxWidth: '500px', margin: '0 auto', borderTop: '4px solid var(--color-danger)' }}>
                    <AlertTriangle size={48} color="var(--color-danger)" style={{ margin: '0 auto 1rem' }} />
                    <h2 style={{ marginBottom: '1rem' }}>Organization Missing</h2>
                    <p style={{ color: 'var(--color-text-secondary)', marginBottom: '1.5rem' }}>
                        Your account profile is not linked to an organization. This is required to manage staff and compliance.
                    </p>
                    <div className="flex flex-col gap-3">
                        <button className="btn btn-primary" onClick={() => window.location.reload()}>
                            Refresh Dashboard
                        </button>
                        <button className="btn btn-secondary" onClick={() => window.location.href = '/setup'}>
                            Complete Setup
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    // FEATURE GATING: Pro Only
    if (!['pro', 'enterprise'].includes(profile.subscription_tier || '') && !isDemo) {
        return (
            <div className="container animate-enter" style={{ padding: '4rem 1rem', display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
                <div style={{ maxWidth: '500px', width: '100%' }}>
                    <UpgradePrompt
                        feature="Sponsor Licence Guardian"
                        description="Protect your A-Rating. Track visa expiries, mock audit your HR files, and get automated alerts. Essential for Home Office compliance."
                    />
                </div>
            </div>
        );
    }

    const getStatusColor = (s: string) => {
        if (s === 'compliant') return 'var(--color-success)';
        if (s === 'warning') return 'var(--color-warning)';
        if (s === 'alert' || s === 'expired') return 'var(--color-danger)';
        return 'var(--color-text-secondary)';
    };

    const filteredWorkers = workers.filter(w =>
        w.full_name.toLowerCase().includes(filter.toLowerCase())
    );

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
                            <div className="flex items-center gap-1"><User size={16} /> Sponsored Staff: <strong>{workers.length} Members</strong></div>
                        </div>
                    </div>

                    <div className="flex gap-2">
                        <button
                            className="btn btn-primary"
                            style={{ background: '#0284c7', borderColor: '#0284c7' }}
                            onClick={() => setShowCosModal(true)}
                        >
                            <Plus size={16} /> Add Worker / CoS
                        </button>
                    </div>
                </div>
            </div>

            {/* CoS Modal */}
            {showCosModal && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                    background: 'rgba(0,0,0,0.5)', zIndex: 999,
                    display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem'
                }}>
                    <form onSubmit={handleAddWorker} className="card animate-enter" style={{ width: '450px', padding: '2rem' }}>
                        <h2 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '1rem' }}>Assign New CoS</h2>

                        <div className="space-y-4 mb-6">
                            <div>
                                <label className="form-label">Full Name</label>
                                <input
                                    type="text" required className="form-input w-full"
                                    value={newWorker.full_name}
                                    onChange={e => setNewWorker({ ...newWorker, full_name: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="form-label">Visa Expiry Date</label>
                                <input
                                    type="date" required className="form-input w-full"
                                    value={newWorker.visa_expiry}
                                    onChange={e => setNewWorker({ ...newWorker, visa_expiry: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="form-label">CoS Number (Optional)</label>
                                <input
                                    type="text" className="form-input w-full" placeholder="e.g. C2X12345"
                                    value={newWorker.cos_number}
                                    onChange={e => setNewWorker({ ...newWorker, cos_number: e.target.value })}
                                />
                            </div>
                        </div>

                        <div className="flex justify-end gap-3">
                            <button type="button" className="btn btn-secondary" onClick={() => setShowCosModal(false)}>Cancel</button>
                            <button type="submit" className="btn btn-primary" disabled={isSaving}>
                                {isSaving ? <Loader2 className="animate-spin" size={18} /> : 'Save Worker'}
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {/* Workers List */}
            <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
                <div style={{ padding: '1rem', borderBottom: '1px solid var(--color-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#f8fafc' }}>
                    <h3 style={{ fontSize: '1.1rem' }}>Sponsored Workforce</h3>
                    <div className="flex gap-2">
                        <div style={{ position: 'relative' }}>
                            <Search size={16} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                            <input
                                type="text" placeholder="Search workers..." className="form-input"
                                style={{ paddingLeft: '2.2rem', width: '250px' }}
                                value={filter}
                                onChange={e => setFilter(e.target.value)}
                            />
                        </div>
                    </div>
                </div>

                <div style={{ overflowX: 'auto' }}>
                    {loading ? (
                        <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--color-text-secondary)' }}>
                            <Loader2 className="animate-spin mx-auto mb-2" /> Loading records...
                        </div>
                    ) : filteredWorkers.length === 0 ? (
                        <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--color-text-secondary)' }}>
                            No workers found. Add your first sponsored staff member to start tracking.
                        </div>
                    ) : (
                        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
                            <thead style={{ background: '#f1f5f9', color: '#475569', textAlign: 'left' }}>
                                <tr>
                                    <th style={{ padding: '1rem', fontWeight: 600 }}>Worker Name</th>
                                    <th style={{ padding: '1rem', fontWeight: 600 }}>Visa Type</th>
                                    <th style={{ padding: '1rem', fontWeight: 600 }}>Expiry Date</th>
                                    <th style={{ padding: '1rem', fontWeight: 600 }}>Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredWorkers.map(w => (
                                    <tr key={w.id} style={{ borderBottom: '1px solid var(--color-border)' }}>
                                        <td style={{ padding: '1rem', fontWeight: 500 }}>{w.full_name}</td>
                                        <td style={{ padding: '1rem' }}>{w.visa_type}</td>
                                        <td style={{ padding: '1rem' }}>
                                            <div className="flex items-center gap-2">
                                                {new Date(w.visa_expiry).toLocaleDateString()}
                                                {w.status !== 'compliant' && <Clock size={14} color={getStatusColor(w.status)} />}
                                            </div>
                                        </td>
                                        <td style={{ padding: '1rem' }}>
                                            <span className={`badge badge-${w.status === 'compliant' ? 'success' : 'warning'}`}>
                                                {w.status.toUpperCase()}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>

        </div>
    );
};
