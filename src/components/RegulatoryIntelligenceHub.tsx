import React, { useState, useEffect } from 'react';
import {
    Bell, ExternalLink, CheckCircle, Clock, Shield,
    Building2, FileText, AlertTriangle, Filter, RefreshCw,
    Brain, Sparkles, ChevronDown, ChevronUp, Plus
} from 'lucide-react';
import type { RegulatoryUpdate } from '../services/regulatoryIntelligence';
import {
    DEMO_REGULATORY_UPDATES,
    getCachedUpdates,
    triggerFeedRefresh
} from '../services/regulatoryIntelligence';
import { useAuth } from '../context/AuthContext';
import { createAction } from '../services/actionsService';
import toast from 'react-hot-toast';

interface RegulatoryIntelligenceHubProps {
    maxItems?: number;
    showFilters?: boolean;
}

const sourceIcons: Record<string, React.ReactNode> = {
    cqc: <Shield size={16} color="#1e40af" />,
    home_office: <Building2 size={16} color="#7c2d12" />,
    nice: <FileText size={16} color="#047857" />,
    dhsc: <Building2 size={16} color="#6b21a8" />
};

const sourceColors: Record<string, { bg: string; text: string }> = {
    cqc: { bg: '#dbeafe', text: '#1e40af' },
    home_office: { bg: '#ffedd5', text: '#7c2d12' },
    nice: { bg: '#d1fae5', text: '#047857' },
    dhsc: { bg: '#f3e8ff', text: '#6b21a8' }
};

export const RegulatoryIntelligenceHub: React.FC<RegulatoryIntelligenceHubProps> = ({
    maxItems = 10,
    showFilters = true
}) => {
    const { profile, isDemo } = useAuth();
    const [updates, setUpdates] = useState<RegulatoryUpdate[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState<string>('all');
    const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
    const [expandedUpdate, setExpandedUpdate] = useState<string | null>(null);
    const [creatingTask, setCreatingTask] = useState<string | null>(null);

    useEffect(() => {
        loadUpdates();
    }, [isDemo, profile]);

    const loadUpdates = async (forceRefresh = false) => {
        setLoading(true);
        try {
            if (isDemo || !profile?.organization_id) {
                // Use demo data
                setUpdates(DEMO_REGULATORY_UPDATES);
            } else {
                // If force refresh requested, trigger the edge function
                if (forceRefresh) {
                    await triggerFeedRefresh();
                }

                // In production, fetch from Supabase cache
                const cached = await getCachedUpdates(profile.organization_id, profile.id);
                setUpdates(cached.length > 0 ? cached : DEMO_REGULATORY_UPDATES);
            }
            setLastUpdated(new Date());
        } catch (error) {
            console.error('Error loading regulatory updates:', error);
            setUpdates(DEMO_REGULATORY_UPDATES);
        } finally {
            setLoading(false);
        }
    };

    const filteredUpdates = filter === 'all'
        ? updates
        : updates.filter(u => u.source === filter);

    const unreadCount = updates.filter(u => !u.is_read).length;

    const formatDate = (dateStr: string) => {
        const date = new Date(dateStr);
        const now = new Date();
        const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));

        if (diffDays === 0) return 'Today';
        if (diffDays === 1) return 'Yesterday';
        if (diffDays < 7) return `${diffDays} days ago`;
        return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
    };

    const handleCreateTask = async (update: RegulatoryUpdate, actionText: string) => {
        if (!profile?.organization_id) {
            toast.error('Sign in to create tasks');
            return;
        }

        setCreatingTask(`${update.id}-${actionText}`);
        try {
            await createAction(profile.organization_id, {
                source: 'regulatory_update',
                source_id: update.id,
                title: actionText,
                description: `Action item from regulatory update: ${update.title}`,
                priority: update.relevance_score >= 90 ? 'high' : 'medium',
                recommendation: `Follow step: ${actionText}`
            });
            toast.success('Task added to your list');
        } catch (error) {
            toast.error('Failed to create task');
        } finally {
            setCreatingTask(null);
        }
    };

    return (
        <div className="card" style={{ overflow: 'hidden' }}>
            {/* Header */}
            <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '1.5rem'
            }}>
                <div>
                    <h2 style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        fontSize: '1.25rem',
                        fontWeight: 600
                    }}>
                        <Bell size={22} color="var(--color-primary)" />
                        Regulatory Intelligence
                        {unreadCount > 0 && (
                            <span style={{
                                background: 'var(--color-danger)',
                                color: 'white',
                                fontSize: '0.7rem',
                                fontWeight: 700,
                                padding: '0.2rem 0.5rem',
                                borderRadius: '9999px',
                                marginLeft: '0.25rem'
                            }}>
                                {unreadCount} new
                            </span>
                        )}
                    </h2>
                    <p style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)', marginTop: '0.25rem' }}>
                        Real-time updates from CQC, Home Office, NICE & DHSC
                    </p>
                </div>
                <button
                    onClick={() => loadUpdates(true)}
                    className="btn btn-secondary"
                    style={{ padding: '0.5rem 0.75rem', fontSize: '0.8rem' }}
                    disabled={loading}
                >
                    <RefreshCw size={14} className={loading ? 'spin' : ''} />
                    Refresh
                </button>
            </div>

            {/* Filters */}
            {showFilters && (
                <div style={{
                    display: 'flex',
                    gap: '0.5rem',
                    marginBottom: '1rem',
                    flexWrap: 'wrap'
                }}>
                    {[
                        { id: 'all', label: 'All Sources' },
                        { id: 'cqc', label: 'CQC' },
                        { id: 'home_office', label: 'Home Office' },
                        { id: 'nice', label: 'NICE' },
                        { id: 'dhsc', label: 'DHSC' }
                    ].map(f => (
                        <button
                            key={f.id}
                            onClick={() => setFilter(f.id)}
                            style={{
                                padding: '0.375rem 0.75rem',
                                fontSize: '0.8rem',
                                borderRadius: '9999px',
                                border: filter === f.id ? '2px solid var(--color-primary)' : '1px solid var(--color-border)',
                                background: filter === f.id ? 'var(--color-accent-subtle)' : 'white',
                                color: filter === f.id ? 'var(--color-primary)' : 'var(--color-text-secondary)',
                                fontWeight: filter === f.id ? 600 : 500,
                                cursor: 'pointer',
                                transition: 'all 0.2s'
                            }}
                        >
                            {f.label}
                        </button>
                    ))}
                </div>
            )}

            {/* Updates List */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {loading ? (
                    <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--color-text-secondary)' }}>
                        <RefreshCw size={24} className="spin" style={{ marginBottom: '0.5rem' }} />
                        <p>Loading regulatory updates...</p>
                    </div>
                ) : filteredUpdates.length === 0 ? (
                    <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--color-text-secondary)' }}>
                        <p>No updates found for this filter.</p>
                    </div>
                ) : (
                    filteredUpdates.slice(0, maxItems).map(update => {
                        const colors = sourceColors[update.source] || sourceColors.cqc;
                        return (
                            <div
                                key={update.id}
                                style={{
                                    display: 'block',
                                    padding: '1rem',
                                    borderRadius: 'var(--radius-md)',
                                    border: '1px solid var(--color-border)',
                                    background: update.is_read ? 'white' : '#fefce8',
                                    transition: 'all 0.2s'
                                }}
                            >
                                <a
                                    href={update.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    style={{ textDecoration: 'none', color: 'inherit' }}
                                >
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1rem' }}>
                                        <div style={{ flex: 1 }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                                                <span style={{
                                                    display: 'inline-flex',
                                                    alignItems: 'center',
                                                    gap: '0.25rem',
                                                    padding: '0.2rem 0.5rem',
                                                    borderRadius: '4px',
                                                    fontSize: '0.7rem',
                                                    fontWeight: 600,
                                                    background: colors.bg,
                                                    color: colors.text,
                                                    textTransform: 'uppercase'
                                                }}>
                                                    {sourceIcons[update.source]}
                                                    {update.source.replace('_', ' ')}
                                                </span>
                                                <span style={{ fontSize: '0.75rem', color: 'var(--color-text-tertiary)' }}>
                                                    {update.category}
                                                </span>
                                                {!update.is_read && (
                                                    <span style={{
                                                        width: '8px',
                                                        height: '8px',
                                                        borderRadius: '50%',
                                                        background: 'var(--color-primary)'
                                                    }} />
                                                )}
                                            </div>
                                            <h4 style={{
                                                fontSize: '0.95rem',
                                                fontWeight: 600,
                                                color: 'var(--color-text-main)',
                                                marginBottom: '0.375rem',
                                                lineHeight: 1.4
                                            }}>
                                                {update.title}
                                            </h4>
                                            <p style={{
                                                fontSize: '0.85rem',
                                                color: 'var(--color-text-secondary)',
                                                lineHeight: 1.5
                                            }}>
                                                {update.summary}
                                            </p>
                                        </div>
                                        <div style={{
                                            display: 'flex',
                                            flexDirection: 'column',
                                            alignItems: 'flex-end',
                                            gap: '0.5rem',
                                            flexShrink: 0
                                        }}>
                                            <span style={{
                                                fontSize: '0.75rem',
                                                color: 'var(--color-text-tertiary)',
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '0.25rem'
                                            }}>
                                                <Clock size={12} />
                                                {formatDate(update.published_date)}
                                            </span>
                                            <ExternalLink size={14} color="var(--color-text-tertiary)" />
                                        </div>
                                    </div>
                                </a>

                                {update.relevance_score >= 90 && (
                                    <div style={{
                                        marginTop: '0.75rem',
                                        padding: '0.5rem 0.75rem',
                                        background: '#fef2f2',
                                        border: '1px solid #fecaca',
                                        borderRadius: '6px',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '0.5rem',
                                        fontSize: '0.8rem',
                                        color: '#b91c1c'
                                    }}>
                                        <AlertTriangle size={14} />
                                        <strong>High Relevance</strong> — This may directly affect your compliance obligations
                                    </div>
                                )}

                                {/* AI Insights Section */}
                                {(update.ai_summary || update.ai_action_items) && (
                                    <div style={{ marginTop: '0.75rem', borderTop: '1px dashed var(--color-border)', paddingTop: '0.75rem' }}>
                                        <button
                                            onClick={(e) => {
                                                e.preventDefault();
                                                setExpandedUpdate(expandedUpdate === update.id ? null : update.id);
                                            }}
                                            style={{
                                                width: '100%',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'space-between',
                                                background: 'none',
                                                border: 'none',
                                                padding: '0',
                                                cursor: 'pointer',
                                                color: 'var(--color-primary)',
                                                fontSize: '0.85rem',
                                                fontWeight: 600
                                            }}
                                        >
                                            <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                <Brain size={14} />
                                                AI Impact Analysis
                                                <Sparkles size={12} color="#f59e0b" />
                                            </span>
                                            {expandedUpdate === update.id ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                                        </button>

                                        {expandedUpdate === update.id && (
                                            <div className="animate-enter" style={{ marginTop: '0.75rem', padding: '1rem', background: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                                                <p style={{ fontSize: '0.85rem', color: 'var(--color-text-main)', marginBottom: '1rem', lineHeight: 1.5, fontWeight: 500 }}>
                                                    {update.ai_summary}
                                                </p>

                                                {update.ai_action_items && update.ai_action_items.length > 0 && (
                                                    <div>
                                                        <h5 style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--color-text-tertiary)', marginBottom: '0.5rem', letterSpacing: '0.05em' }}>Recommended Actions</h5>
                                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                                            {update.ai_action_items.map((action, idx) => (
                                                                <div key={idx} style={{
                                                                    display: 'flex',
                                                                    justifyContent: 'space-between',
                                                                    alignItems: 'center',
                                                                    padding: '0.6rem 0.75rem',
                                                                    background: 'white',
                                                                    borderRadius: '6px',
                                                                    border: '1px solid #eef2f6',
                                                                    fontSize: '0.8rem'
                                                                }}>
                                                                    <span style={{ color: 'var(--color-text-secondary)', flex: 1 }}>{action}</span>
                                                                    <button
                                                                        onClick={(e) => { e.preventDefault(); handleCreateTask(update, action); }}
                                                                        disabled={creatingTask === `${update.id}-${action}`}
                                                                        style={{
                                                                            marginLeft: '0.75rem',
                                                                            padding: '0.25rem 0.5rem',
                                                                            fontSize: '0.7rem',
                                                                            background: 'var(--color-bg-page)',
                                                                            border: '1px solid var(--color-border)',
                                                                            borderRadius: '4px',
                                                                            cursor: 'pointer',
                                                                            display: 'flex',
                                                                            alignItems: 'center',
                                                                            gap: '0.25rem',
                                                                            color: 'var(--color-text-main)',
                                                                            fontWeight: 600
                                                                        }}
                                                                    >
                                                                        <Plus size={12} />
                                                                        {creatingTask === `${update.id}-${action}` ? 'Adding...' : 'Add to Tasks'}
                                                                    </button>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        );
                    })
                )}
            </div >

            {/* Footer */}
            < div style={{
                marginTop: '1.5rem',
                paddingTop: '1rem',
                borderTop: '1px solid var(--color-border)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                fontSize: '0.8rem',
                color: 'var(--color-text-tertiary)'
            }}>
                <span>
                    Last updated: {lastUpdated.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}
                </span>
                <a href="/regulatory-intelligence" style={{ color: 'var(--color-primary)', fontWeight: 500 }}>
                    View All Updates →
                </a>
            </div >
        </div >
    );
};
