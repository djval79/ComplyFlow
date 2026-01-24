import React, { useState, useEffect } from 'react';
import { ProductionErrorBoundary } from '../components/ProductionErrorBoundary';
import {
    TrendingUp,
    Shield,
    AlertTriangle,
    Activity,
    Users,
    Calendar,
    Download,
    Filter,
    ArrowUpRight,
    ArrowDownRight,
    Search,
    Brain,
    Target
} from 'lucide-react';
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    AreaChart,
    Area,
    BarChart,
    Bar,
    Legend
} from 'recharts';
import { useAuth } from '../context/AuthContext';
import { useCompliance } from '../context/ComplianceContext';
import { supabase } from '../lib/supabase';
import { format } from 'date-fns';

// Mock data for initial render
const TREND_DATA = [
    { name: 'Jan', score: 65, risks: 12 },
    { name: 'Feb', score: 68, risks: 10 },
    { name: 'Mar', score: 72, risks: 8 },
    { name: 'Apr', score: 70, risks: 9 },
    { name: 'May', score: 75, risks: 6 },
    { name: 'Jun', score: 82, risks: 4 },
];

const RISK_DATA = [
    { subject: 'Safety', A: 85, fullMark: 100 },
    { subject: 'Effective', A: 78, fullMark: 100 },
    { subject: 'Caring', A: 92, fullMark: 100 },
    { subject: 'Responsive', A: 80, fullMark: 100 },
    { subject: 'Well-led', A: 65, fullMark: 100 },
];

const IntelligenceHubContent = () => {
    const { profile } = useAuth();
    const { companyName } = useCompliance();
    const [loading, setLoading] = useState(true);
    const [timeframe, setTimeframe] = useState('6m');

    useEffect(() => {
        // Simulate loading data
        const timer = setTimeout(() => setLoading(false), 800);
        return () => clearTimeout(timer);
    }, []);

    return (
        <div className="container animate-enter" style={{ padding: '2rem 1rem' }}>
            <div className="flex justify-between items-end" style={{ marginBottom: '2.5rem' }}>
                <div>
                    <div className="flex items-center gap-2" style={{ marginBottom: '0.5rem' }}>
                        <span className="badge badge-primary" style={{ textTransform: 'uppercase', letterSpacing: '0.05em', fontSize: '0.7rem' }}>
                            Executive Insight
                        </span>
                    </div>
                    <h1 style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: '2rem' }}>
                        <Brain className="text-primary" />
                        Intelligence Hub
                    </h1>
                    <p style={{ color: 'var(--color-text-secondary)', marginTop: '0.5rem' }}>
                        Advanced compliance analytics for <strong>{companyName}</strong>.
                    </p>
                </div>

                <div className="flex gap-3">
                    <div className="flex p-1 bg-surface-secondary rounded-lg border border-divider">
                        {['1m', '3m', '6m', '1y'].map(t => (
                            <button
                                key={t}
                                onClick={() => setTimeframe(t)}
                                className={`px-3 py-1 rounded-md text-sm transition-all ${timeframe === t ? 'bg-white shadow-sm text-primary font-semibold' : 'text-secondary hover:text-primary'}`}
                            >
                                {t.toUpperCase()}
                            </button>
                        ))}
                    </div>
                    <button className="btn btn-secondary bg-white">
                        <Download size={16} />
                        Export Data
                    </button>
                </div>
            </div>

            {/* Top Level Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6" style={{ marginBottom: '2rem' }}>
                {[
                    { label: 'Avg Readiness Score', value: '82%', icon: <Shield />, trend: 'up', trendVal: '+12%' },
                    { label: 'Active Risks', value: '4', icon: <AlertTriangle />, trend: 'down', trendVal: '-2' },
                    { label: 'Training Rate', value: '94%', icon: <Users />, trend: 'up', trendVal: '+3%' },
                    { label: 'Forecasted Score', value: '88%', icon: <Target />, trend: 'none', trendVal: 'Proj.' }
                ].map((m, i) => (
                    <div key={i} className="card-glass p-6 border border-white/20">
                        <div className="flex justify-between items-start" style={{ marginBottom: '1rem' }}>
                            <div style={{ padding: '0.5rem', background: 'rgba(55, 114, 255, 0.1)', color: 'var(--color-primary)', borderRadius: '10px' }}>
                                {m.icon}
                            </div>
                            {m.trend !== 'none' && (
                                <div className={`flex items-center gap-1 text-xs font-bold ${m.trend === 'up' ? 'text-success' : 'text-error'}`}>
                                    {m.trend === 'up' ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
                                    {m.trendVal}
                                </div>
                            )}
                        </div>
                        <p className="text-secondary text-sm font-medium" style={{ margin: 0 }}>{m.label}</p>
                        <h2 style={{ fontSize: '1.75rem', fontWeight: 700, marginTop: '0.25rem' }}>{m.value}</h2>
                    </div>
                ))}
            </div>

            {/* Charts Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8" style={{ marginBottom: '2rem' }}>
                <div className="card p-6 min-h-[400px] flex flex-col">
                    <div className="flex justify-between items-center" style={{ marginBottom: '1.5rem' }}>
                        <h3 className="flex items-center gap-2">
                            <TrendingUp size={20} className="text-primary" />
                            Compliance Score Trend
                        </h3>
                        <div className="text-xs text-secondary italic">Updated 2h ago</div>
                    </div>
                    <div className="flex-1 w-full" style={{ minHeight: '300px' }}>
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={TREND_DATA}>
                                <defs>
                                    <linearGradient id="colorScore" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="var(--color-primary)" stopOpacity={0.1} />
                                        <stop offset="95%" stopColor="var(--color-primary)" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--color-border)" />
                                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: 'var(--color-text-tertiary)', fontSize: 12 }} />
                                <YAxis axisLine={false} tickLine={false} tick={{ fill: 'var(--color-text-tertiary)', fontSize: 12 }} domain={[0, 100]} />
                                <Tooltip
                                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)', padding: '12px' }}
                                />
                                <Area type="monotone" dataKey="score" stroke="var(--color-primary)" strokeWidth={3} fillOpacity={1} fill="url(#colorScore)" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                <div className="card p-6 min-h-[400px] flex flex-col">
                    <div className="flex justify-between items-center" style={{ marginBottom: '1.5rem' }}>
                        <h3 className="flex items-center gap-2">
                            <Shield size={20} className="text-success" />
                            CQC Regulation Breakdown
                        </h3>
                    </div>
                    <div className="flex-1 w-full" style={{ minHeight: '300px' }}>
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={RISK_DATA} layout="vertical">
                                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="var(--color-border)" />
                                <XAxis type="number" hide />
                                <YAxis type="category" dataKey="subject" width={90} axisLine={false} tickLine={false} tick={{ fill: 'var(--color-text-secondary)', fontSize: 12, fontWeight: 500 }} />
                                <Tooltip />
                                <Bar dataKey="A" radius={[0, 4, 4, 0]} fill="var(--color-primary)" barSize={24} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>

            {/* Bottom Row - Activity */}
            <div className="card p-0 overflow-hidden">
                <div className="p-6 border-b border-divider flex justify-between items-center">
                    <h3 className="flex items-center gap-2 m-0">
                        <Activity size={20} className="text-warning" />
                        Recent Compliance Activity
                    </h3>
                    <button className="text-primary text-sm font-semibold hover:underline">View All Audit Logs</button>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-surface-secondary text-tertiary text-xs uppercase letter-spacing-widest">
                            <tr>
                                <th className="px-6 py-4 text-left font-semibold">User</th>
                                <th className="px-6 py-4 text-left font-semibold">Action</th>
                                <th className="px-6 py-4 text-left font-semibold">Module</th>
                                <th className="px-6 py-4 text-left font-semibold">Date</th>
                                <th className="px-6 py-4 text-left font-semibold">Status</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-divider">
                            {[
                                { user: 'Sarah Jenkins', action: 'Gap Analysis Run', module: 'CQC Suite', date: 'Today, 2:14 PM', status: 'Success' },
                                { user: 'Sarah Jenkins', action: 'Policy Updated', module: 'Safeguarding', date: 'Today, 11:05 AM', status: 'Completed' },
                                { user: 'System Bot', action: 'Visa Expiry Alert', module: 'Sponsor Guardian', date: 'Yesterday, 9:00 AM', status: 'Alert Sent' },
                                { user: 'Sarah Jenkins', action: 'Document Download', module: 'MAR Chart', date: 'Jan 19, 4:45 PM', status: 'Export' }
                            ].map((row, i) => (
                                <tr key={i} className="hover:bg-surface-secondary/50 transition-colors">
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-xs">
                                                {row.user.split(' ').map(n => n[0]).join('')}
                                            </div>
                                            <span className="font-medium">{row.user}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-sm">{row.action}</td>
                                    <td className="px-6 py-4">
                                        <span className="badge badge-secondary">{row.module}</span>
                                    </td>
                                    <td className="px-6 py-4 text-sm text-tertiary">{row.date}</td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-1.5 text-xs font-semibold text-success">
                                            <div className="w-1.5 h-1.5 rounded-full bg-success"></div>
                                            {row.status}
                                        </div>
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

export const IntelligenceHub = () => (
    <ProductionErrorBoundary>
        <IntelligenceHubContent />
    </ProductionErrorBoundary>
);
