import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useCompliance } from '../context/ComplianceContext';
import { getCompetencyMatrix } from '../services/competencyService';
import type { StaffCompetency, TrainingModule } from '../services/competencyService';
import { Loader2, CheckCircle, XCircle, Clock, Search, Filter, Download, Zap } from 'lucide-react';

export const StaffHeatmap = () => {
    const { profile, isDemo } = useAuth();
    const [loading, setLoading] = useState(true);
    const [modules, setModules] = useState<TrainingModule[]>([]);
    const [staff, setStaff] = useState<StaffCompetency[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [filterStatus, setFilterStatus] = useState<string>('all');

    useEffect(() => {
        const fetchData = async () => {
            if (profile?.organization_id || isDemo) {
                setLoading(true);
                // Simulate delay for "pro" feel
                setTimeout(async () => {
                    const data = await getCompetencyMatrix(profile?.organization_id || 'demo');
                    setModules(data.modules);
                    setStaff(data.staff);
                    setLoading(false);
                }, 800);
            }
        };
        fetchData();
    }, [profile?.organization_id, isDemo]);

    // Filtering logic
    const filteredStaff = staff.filter(person => {
        const matchesSearch = person.user_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            person.job_title.toLowerCase().includes(searchQuery.toLowerCase());

        if (filterStatus === 'all') return matchesSearch;

        // Check if person has ANY module with this status
        const hasStatus = Object.values(person.status).includes(filterStatus as any);
        return matchesSearch && hasStatus;
    });

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'valid': return 'bg-emerald-100 text-emerald-800 border-emerald-200 hover:bg-emerald-200';
            case 'expiring': return 'bg-amber-100 text-amber-800 border-amber-200 hover:bg-amber-200';
            case 'expired': return 'bg-rose-100 text-rose-800 border-rose-200 hover:bg-rose-200';
            case 'missing': return 'bg-slate-100 text-slate-500 border-slate-200 hover:bg-slate-200';
            default: return 'bg-gray-50 text-gray-400 border-gray-100';
        }
    };

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'valid': return <CheckCircle size={14} className="text-emerald-600" />;
            case 'expiring': return <Clock size={14} className="text-amber-600" />;
            case 'expired': return <XCircle size={14} className="text-rose-600" />;
            case 'missing': return <div className="w-2 h-2 rounded-full bg-slate-300" />;
            default: return null;
        }
    };

    return (
        <div className="container animate-enter" style={{ padding: '2rem 1rem', maxWidth: '1400px' }}>

            {/* Header */}
            <div className="flex justify-between items-start mb-8">
                <div>
                    <div className="flex items-center gap-2 mb-2">
                        <span className="badge badge-pro flex items-center gap-1">
                            <Zap size={10} fill="currentColor" /> Enterprise
                        </span>
                        <span className="text-sm text-slate-500 font-medium">Training & Compliance</span>
                    </div>
                    <h1 className="text-3xl font-bold text-slate-900 tracking-tight mb-2">
                        Competency Heatmap
                    </h1>
                    <p className="text-slate-500 max-w-2xl">
                        Visualise verified training status across your entire workforce. Identify expiry risks and gaps instantly.
                    </p>
                </div>
                <div className="flex gap-3">
                    <button className="btn btn-secondary flex items-center gap-2">
                        <Download size={16} /> Export Report
                    </button>
                    <button className="btn btn-primary flex items-center gap-2 shadow-lg shadow-blue-500/20">
                        <Filter size={16} /> Assign Training
                    </button>
                </div>
            </div>

            {/* Filters */}
            <div className="card mb-6 p-4 flex flex-wrap gap-4 items-center justify-between bg-white/80 backdrop-blur-sm border-slate-200/60 shadow-sm">
                <div className="flex items-center gap-4 flex-1">
                    <div className="relative flex-1 max-w-md">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                        <input
                            type="text"
                            placeholder="Search staff by name or role..."
                            className="form-input pl-10"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                    <div className="h-8 w-px bg-slate-200 mx-2" />
                    <div className="flex gap-2">
                        {['all', 'valid', 'expiring', 'expired', 'missing'].map(s => (
                            <button
                                key={s}
                                onClick={() => setFilterStatus(s)}
                                className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all ${filterStatus === s
                                        ? 'bg-slate-900 text-white shadow-md'
                                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                                    }`}
                            >
                                {s.charAt(0).toUpperCase() + s.slice(1)}
                            </button>
                        ))}
                    </div>
                </div>
                <div className="text-sm text-slate-500 font-medium">
                    Showing {filteredStaff.length} staff members
                </div>
            </div>

            {/* Matrix */}
            {loading ? (
                <div className="flex items-center justify-center h-64 card">
                    <Loader2 className="animate-spin text-blue-600" size={32} />
                    <span className="ml-3 text-slate-600 font-medium">Generating heatmap analysis...</span>
                </div>
            ) : (
                <div className="card overflow-hidden border-slate-200 shadow-xl shadow-slate-200/50 p-0">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left">
                            <thead className="text-xs text-slate-500 uppercase bg-slate-50 border-b border-slate-200">
                                <tr>
                                    <th className="px-6 py-4 font-semibold w-64 sticky left-0 bg-slate-50 z-10 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]">
                                        Staff Member
                                    </th>
                                    {modules.map(module => (
                                        <th key={module.id} className="px-4 py-4 min-w-[140px] font-semibold text-center group relative cursor-help">
                                            <div className="flex flex-col items-center gap-1">
                                                <span>{module.name}</span>
                                                <span className={`text-[10px] px-1.5 py-0.5 rounded border ${module.category === 'mandatory' ? 'bg-red-50 text-red-600 border-red-100' :
                                                        module.category === 'clinical' ? 'bg-blue-50 text-blue-600 border-blue-100' :
                                                            'bg-slate-100 text-slate-500 border-slate-200'
                                                    }`}>
                                                    {module.category}
                                                </span>
                                            </div>
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {filteredStaff.map((person) => (
                                    <tr key={person.user_id} className="hover:bg-slate-50/50 transition-colors">
                                        <td className="px-6 py-4 font-medium text-slate-900 sticky left-0 bg-white group-hover:bg-slate-50/50 z-10 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.05)] border-r border-slate-100">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold text-xs shadow-md">
                                                    {person.user_name.charAt(0)}
                                                </div>
                                                <div>
                                                    <div className="font-semibold">{person.user_name}</div>
                                                    <div className="text-xs text-slate-500 font-normal">{person.job_title}</div>
                                                </div>
                                            </div>
                                        </td>
                                        {modules.map(module => {
                                            const status = person.status[module.id] || 'missing';
                                            const expiry = person.expiries[module.id];

                                            return (
                                                <td key={module.id} className="px-2 py-3 text-center border-l border-slate-50">
                                                    <div className="relative group/cell">
                                                        <div className={`
                                                            flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-lg border font-medium transition-all duration-200
                                                            ${getStatusColor(status)}
                                                            lg:mx-2 cursor-default
                                                        `}>
                                                            {getStatusIcon(status)}
                                                            <span className="capitalize">{status}</span>
                                                        </div>

                                                        {/* Tooltip */}
                                                        {expiry && (
                                                            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 p-2 bg-slate-900 text-white text-xs rounded shadow-xl opacity-0 group-hover/cell:opacity-100 transition-opacity pointer-events-none z-20">
                                                                <div className="font-semibold mb-1">Expires:</div>
                                                                <div>{new Date(expiry).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}</div>
                                                                <div className="mt-1 text-slate-400 text-[10px]">Validity: {module.validity_months} months</div>
                                                                <div className="absolute bottom-[-4px] left-1/2 -translate-x-1/2 w-2 h-2 bg-slate-900 rotate-45"></div>
                                                            </div>
                                                        )}
                                                    </div>
                                                </td>
                                            );
                                        })}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {filteredStaff.length === 0 && (
                        <div className="p-12 text-center text-slate-500">
                            <Filter size={48} className="mx-auto mb-4 text-slate-300" />
                            <h3 className="text-lg font-medium text-slate-700 mb-1">No staff found</h3>
                            <p>Try adjusting your search or filters to see more results.</p>
                        </div>
                    )}
                </div>
            )}

            {/* Legend */}
            <div className="mt-6 flex gap-6 justify-center flex-wrap text-sm text-slate-600">
                <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-emerald-500"></div> Valid
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-amber-500"></div> Expiring (30 days)
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-rose-500"></div> Expired
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-slate-300"></div> Missing / Not Started
                </div>
            </div>
        </div>
    );
};
