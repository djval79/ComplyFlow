import React, { useState, useEffect } from 'react';
import { ShieldCheck, User, Clock, AlertTriangle, CheckCircle, Search, Calendar, Loader2, Plus, Edit3, Trash2, LayoutDashboard, List, Settings as SettingsIcon, FileText } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { sponsorService, type SponsoredWorker, type ReportingEvent } from '../services/sponsorService';
import { WorkerEditModal } from '../components/WorkerEditModal';
import { UpgradePrompt } from '../components/ConversionWidgets';
import { format } from 'date-fns';
import { SkeletonMetric, SkeletonTable } from '../components/SkeletonCards';

export const SponsorGuardian = () => {
    const { profile, isDemo } = useAuth();
    const [activeTab, setActiveTab] = useState<'workforce' | 'reporting' | 'licence'>('workforce');
    const [workers, setWorkers] = useState<SponsoredWorker[]>([]);
    const [reportingLog, setReportingLog] = useState<ReportingEvent[]>([]);
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState<any>(null);
    const [filter, setFilter] = useState('');

    // Modal State
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedWorker, setSelectedWorker] = useState<SponsoredWorker | null>(null);

    useEffect(() => {
        if (profile?.organization_id) {
            loadAllData();
        }
    }, [profile?.organization_id, activeTab]);

    const loadAllData = async () => {
        if (!profile?.organization_id) return;
        setLoading(true);
        try {
            const [workerData, logData, statData] = await Promise.all([
                sponsorService.getWorkers(profile.organization_id),
                sponsorService.getReportingLog(profile.organization_id),
                sponsorService.getSponsorStats(profile.organization_id)
            ]);
            setWorkers(workerData);
            setReportingLog(logData);
            setStats(statData);
        } catch (err) {
            console.error('Error loading sponsor data:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleSaveWorker = async (data: Partial<SponsoredWorker>) => {
        if (!profile?.organization_id) return;

        try {
            if (selectedWorker) {
                await sponsorService.updateWorker(selectedWorker.id, data, profile.organization_id);
            } else {
                await sponsorService.createWorker({
                    ...data,
                    organization_id: profile.organization_id,
                    status: 'compliant'
                });
            }
            loadAllData();
        } catch (err) {
            console.error(err);
            alert('Failed to save worker');
        }
    };

    const handleDeleteWorker = async (id: string) => {
        if (!confirm('Are you sure you want to delete this worker record? All history will be lost.')) return;
        try {
            await sponsorService.deleteWorker(id, profile!.organization_id!);
            loadAllData();
        } catch (err) {
            alert('Failed to delete worker');
        }
    };

    const handleReportEvent = async (id: string) => {
        try {
            await sponsorService.markAsReported(id, profile!.id);
            loadAllData();
        } catch (err) {
            alert('Failed to update event');
        }
    };

    // --- RENDER HELPERS ---

    const getStatusBadge = (status: string) => {
        const styles: any = {
            compliant: 'badge-success',
            warning: 'badge-warning',
            alert: 'badge-danger',
            expired: 'badge-danger'
        };
        return <span className={`badge ${styles[status] || 'badge-secondary'}`}>{status.toUpperCase()}</span>;
    };

    if (!profile) return <div className="p-8 text-center"><Loader2 className="animate-spin inline mr-2" /> Loading...</div>;

    // Feature Gate
    if (!['pro', 'enterprise'].includes(profile.subscription_tier || '') && !isDemo) {
        return (
            <div className="container py-12 flex justify-center">
                <div className="max-w-xl w-full">
                    <UpgradePrompt
                        feature="Sponsor Licence Guardian"
                        description="Protect your A-Rating. Track visa expiries, reporting deadlines, and CoS usage automatically."
                    />
                </div>
            </div>
        );
    }

    return (
        <div className="container animate-enter" style={{ padding: '2rem 1rem' }}>

            {/* Header / Stats Bar */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
                {loading ? (
                    <>
                        <SkeletonMetric />
                        <SkeletonMetric />
                        <SkeletonMetric />
                        <SkeletonMetric />
                    </>
                ) : (
                    <>
                        <div className="card bg-slate-900 text-white border-none p-4 relative overflow-hidden">
                            <div className="relative z-10">
                                <p className="text-slate-400 text-xs font-bold uppercase mb-1">Sponsor Licence</p>
                                <h2 className="text-xl font-bold flex items-center gap-2">
                                    A-Rated <CheckCircle size={18} className="text-emerald-400" />
                                </h2>
                            </div>
                        </div>
                        <div className="card p-4">
                            <p className="text-slate-400 text-xs font-bold uppercase mb-1">CoS Allocation</p>
                            <div className="flex items-end justify-between">
                                <h2 className="text-xl font-bold">{stats?.cosUsed || 0} / {stats?.cosAllocated || 0}</h2>
                                <span className="text-[10px] text-slate-500 mb-1">Used vs Allocated</span>
                            </div>
                        </div>
                        <div className="card p-4">
                            <p className="text-slate-400 text-xs font-bold uppercase mb-1">Expiring Visas</p>
                            <div className="flex items-end justify-between">
                                <h2 className={`text-xl font-bold ${stats?.urgentAlerts > 0 ? 'text-red-500' : ''}`}>{stats?.urgentAlerts || 0}</h2>
                                <span className="text-[10px] text-slate-500 mb-1">Next 30 Days</span>
                            </div>
                        </div>
                        <div className="card p-4">
                            <p className="text-slate-400 text-xs font-bold uppercase mb-1">Pending Reports</p>
                            <div className="flex items-end justify-between">
                                <h2 className={`text-xl font-bold ${stats?.pendingReports > 0 ? 'text-amber-500' : ''}`}>{stats?.pendingReports || 0}</h2>
                                <span className="text-[10px] text-slate-500 mb-1">Home Office SMS</span>
                            </div>
                        </div>
                    </>
                )}
            </div>

            {/* Main Interface */}
            <div className="card p-0 overflow-hidden">
                {/* Tabs */}
                <div className="flex items-center border-b bg-slate-50">
                    <button
                        onClick={() => setActiveTab('workforce')}
                        className={`px-6 py-4 text-sm font-semibold flex items-center gap-2 transition-all border-b-2 ${activeTab === 'workforce' ? 'text-blue-600 border-blue-600 bg-white' : 'text-slate-500 border-transparent hover:text-slate-700'}`}
                    >
                        <User size={16} /> Workforce
                    </button>
                    <button
                        onClick={() => setActiveTab('reporting')}
                        className={`px-6 py-4 text-sm font-semibold flex items-center gap-2 transition-all border-b-2 ${activeTab === 'reporting' ? 'text-blue-600 border-blue-600 bg-white' : 'text-slate-500 border-transparent hover:text-slate-700'}`}
                    >
                        <FileText size={16} /> Reporting Log
                        {stats?.pendingReports > 0 && <span className="bg-amber-500 text-white text-[10px] w-4 h-4 rounded-full flex items-center justify-center">{stats.pendingReports}</span>}
                    </button>
                    <button
                        onClick={() => setActiveTab('licence')}
                        className={`px-6 py-4 text-sm font-semibold flex items-center gap-2 transition-all border-b-2 ${activeTab === 'licence' ? 'text-blue-600 border-blue-600 bg-white' : 'text-slate-500 border-transparent hover:text-slate-700'}`}
                    >
                        <SettingsIcon size={16} /> Licence Details
                    </button>
                </div>

                {/* Tab Content */}
                <div className="p-6">
                    {loading ? (
                        <SkeletonTable rows={5} />
                    ) : (
                        <>
                            {activeTab === 'workforce' && (
                                <div>
                                    <div className="flex justify-between items-center mb-6">
                                        <div className="relative w-72">
                                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                                            <input
                                                type="text" placeholder="Filter by name..." className="w-full pl-10 p-2 border rounded-lg outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                                                value={filter}
                                                onChange={e => setFilter(e.target.value)}
                                            />
                                        </div>
                                        <button
                                            className="btn btn-primary flex items-center gap-2"
                                            onClick={() => { setSelectedWorker(null); setIsModalOpen(true); }}
                                        >
                                            <Plus size={16} /> Add New Worker
                                        </button>
                                    </div>

                                    <div className="overflow-x-auto">
                                        <table className="w-full text-left">
                                            <thead>
                                                <tr className="text-slate-500 text-xs font-bold border-b">
                                                    <th className="pb-3 text-center w-12">#</th>
                                                    <th className="pb-3">Worker Name</th>
                                                    <th className="pb-3">Visa Type</th>
                                                    <th className="pb-3">Expiry Date</th>
                                                    <th className="pb-3">Status</th>
                                                    <th className="pb-3 text-right">Actions</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y text-sm">
                                                {workers.filter(w => w.full_name.toLowerCase().includes(filter.toLowerCase())).map((w, idx) => (
                                                    <tr key={w.id} className="hover:bg-slate-50/50">
                                                        <td className="py-4 text-center text-slate-400">{idx + 1}</td>
                                                        <td className="py-4">
                                                            <div className="font-semibold text-slate-900">{w.full_name}</div>
                                                            <div className="text-xs text-slate-500">{w.job_title || 'N/A'}</div>
                                                        </td>
                                                        <td className="py-4 text-slate-600">{w.visa_type}</td>
                                                        <td className="py-4 text-slate-600">
                                                            {w.visa_expiry ? format(new Date(w.visa_expiry), 'dd MMM yyyy') : '-'}
                                                        </td>
                                                        <td className="py-4">{getStatusBadge(w.status)}</td>
                                                        <td className="py-4 text-right">
                                                            <button
                                                                onClick={() => { setSelectedWorker(w); setIsModalOpen(true); }}
                                                                className="p-1.5 hover:bg-slate-200 rounded text-slate-600 mr-1"
                                                            >
                                                                <Edit3 size={16} />
                                                            </button>
                                                            <button
                                                                onClick={() => handleDeleteWorker(w.id)}
                                                                className="p-1.5 hover:bg-red-50 rounded text-red-600"
                                                            >
                                                                <Trash2 size={16} />
                                                            </button>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            )}

                            {activeTab === 'reporting' && (
                                <div className="space-y-4">
                                    <div className="bg-amber-50 border border-amber-100 p-4 rounded-lg flex items-start gap-3 mb-6">
                                        <Clock className="text-amber-600 mt-1" size={20} />
                                        <div>
                                            <h4 className="font-bold text-amber-900 text-sm">Reporting Reminder</h4>
                                            <p className="text-amber-800 text-xs mt-1">
                                                Any changes to salary, role, or work location must be reported to the Home Office via SMS within <strong>10 working days</strong> of the change.
                                            </p>
                                        </div>
                                    </div>

                                    {reportingLog.length === 0 ? (
                                        <div className="text-center py-20 text-slate-400">
                                            <FileText size={32} className="mx-auto mb-2 opacity-20" />
                                            <p>No reportable events found in the log.</p>
                                        </div>
                                    ) : (
                                        <div className="space-y-3">
                                            {reportingLog.map(event => (
                                                <div key={event.id} className="border rounded-lg p-4 flex justify-between items-center hover:shadow-sm transition-shadow">
                                                    <div>
                                                        <div className="flex items-center gap-2 mb-1">
                                                            <span className={`text-[10px] font-bold uppercase px-1.5 py-0.5 rounded ${event.status === 'reported' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'}`}>
                                                                {event.status}
                                                            </span>
                                                            <span className="text-xs text-slate-400">Due: {event.deadline_date ? format(new Date(event.deadline_date), 'dd MMM yyyy') : 'N/A'}</span>
                                                        </div>
                                                        <h4 className="font-bold text-slate-900">{(event as any).worker?.full_name}: {event.event_type.replace('_', ' ')}</h4>
                                                        <p className="text-xs text-slate-500 mt-1">{event.description}</p>
                                                    </div>
                                                    {event.status === 'pending' && (
                                                        <button
                                                            onClick={() => handleReportEvent(event.id)}
                                                            className="text-xs btn btn-secondary flex items-center gap-2"
                                                        >
                                                            <CheckCircle size={14} /> Mark as Reported
                                                        </button>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}

                            {activeTab === 'licence' && (
                                <div className="max-w-2xl space-y-8">
                                    <section>
                                        <h4 className="font-bold text-slate-900 mb-4 pb-2 border-b">Licence Details</h4>
                                        <div className="grid grid-cols-2 gap-y-4 text-sm">
                                            <div className="text-slate-500">Licence Number</div>
                                            <div className="font-mono font-bold text-slate-900">{profile.sponsor_licence_number || 'TBC'}</div>
                                            <div className="text-slate-500">A-Rating Expiry</div>
                                            <div>14 Dec 2026</div>
                                            <div className="text-slate-500">Key Personnel</div>
                                            <div>{profile.full_name} (Level 1 User)</div>
                                        </div>
                                    </section>

                                    <section>
                                        <h4 className="font-bold text-slate-900 mb-4 pb-2 border-b">CoS Allocation Management</h4>
                                        <div className="p-4 bg-slate-50 rounded-lg">
                                            <div className="flex justify-between items-center mb-2">
                                                <span className="text-sm text-slate-600">Current Usage</span>
                                                <span className="text-sm font-bold">{stats?.cosUsed || 0} / {stats?.cosAllocated || 0}</span>
                                            </div>
                                            <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                                                <div
                                                    className="bg-blue-600 h-full transition-all"
                                                    style={{ width: `${Math.min(100, ((stats?.cosUsed || 0) / (stats?.cosAllocated || 1)) * 100)}%` }}
                                                ></div>
                                            </div>
                                            <p className="text-[10px] text-slate-500 mt-3 italic">
                                                Need more allocation? You must apply for an annual allocation increase via SMS before April each year, or request a priority increase (£200) for urgent needs.
                                            </p>
                                        </div>
                                    </section>
                                </div>
                            )}
                        </>
                    )}
                </div>
            </div>

            <WorkerEditModal
                isOpen={isModalOpen}
                onClose={() => { setIsModalOpen(false); setSelectedWorker(null); }}
                worker={selectedWorker}
                onSave={handleSaveWorker}
            />

        </div>
    );
};
