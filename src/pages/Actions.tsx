import React, { useState, useEffect } from 'react';
import {
    CheckCircle, Circle, Clock, AlertTriangle, Plus, Filter,
    ChevronDown, Calendar, User, Tag, FileText, Loader2,
    Shield, Heart, Zap, Users, Award, X, Upload
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import {
    getActions, createAction, updateActionStatus, deleteAction,
    getActionStats, uploadActionEvidence, type ComplianceAction, type ActionStats
} from '../services/actionsService';

const KEY_QUESTION_CONFIG = {
    safe: { label: 'Safe', icon: Shield, color: '#10b981' },
    effective: { label: 'Effective', icon: Zap, color: '#3b82f6' },
    caring: { label: 'Caring', icon: Heart, color: '#ec4899' },
    responsive: { label: 'Responsive', icon: Users, color: '#f59e0b' },
    wellLed: { label: 'Well-Led', icon: Award, color: '#8b5cf6' }
};

const PRIORITY_CONFIG = {
    low: { label: 'Low', color: '#6b7280' },
    medium: { label: 'Medium', color: '#f59e0b' },
    high: { label: 'High', color: '#ef4444' },
    critical: { label: 'Critical', color: '#dc2626' }
};

const STATUS_CONFIG = {
    open: { label: 'Open', icon: Circle, color: '#6b7280' },
    in_progress: { label: 'In Progress', icon: Clock, color: '#3b82f6' },
    resolved: { label: 'Resolved', icon: CheckCircle, color: '#10b981' },
    overdue: { label: 'Overdue', icon: AlertTriangle, color: '#ef4444' },
    deferred: { label: 'Deferred', icon: Clock, color: '#9ca3af' }
};

export const Actions = () => {
    const { profile } = useAuth();
    const [actions, setActions] = useState<ComplianceAction[]>([]);
    const [stats, setStats] = useState<ActionStats | null>(null);
    const [loading, setLoading] = useState(true);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [selectedAction, setSelectedAction] = useState<ComplianceAction | null>(null);

    // Filters
    const [statusFilter, setStatusFilter] = useState<string>('all');
    const [priorityFilter, setPriorityFilter] = useState<string>('all');
    const [keyQuestionFilter, setKeyQuestionFilter] = useState<string>('all');

    // Load actions
    useEffect(() => {
        loadData();
    }, [statusFilter, priorityFilter, keyQuestionFilter]);

    const loadData = async () => {
        setLoading(true);
        try {
            const filters: Record<string, string> = {};
            if (statusFilter !== 'all') filters.status = statusFilter;
            if (priorityFilter !== 'all') filters.priority = priorityFilter;
            if (keyQuestionFilter !== 'all') filters.key_question = keyQuestionFilter;

            const [actionsData, statsData] = await Promise.all([
                getActions(filters as any),
                getActionStats()
            ]);

            setActions(actionsData);
            setStats(statsData);
        } catch (error) {
            console.error('Error loading actions:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleStatusChange = async (actionId: string, newStatus: ComplianceAction['status']) => {
        try {
            await updateActionStatus(actionId, newStatus);
            loadData();
        } catch (error) {
            console.error('Error updating status:', error);
        }
    };

    const handleDelete = async (actionId: string) => {
        if (!confirm('Are you sure you want to delete this action?')) return;
        try {
            await deleteAction(actionId);
            loadData();
        } catch (error) {
            console.error('Error deleting action:', error);
        }
    };

    const formatDate = (dateStr?: string) => {
        if (!dateStr) return '-';
        return new Date(dateStr).toLocaleDateString('en-GB', {
            day: 'numeric',
            month: 'short',
            year: 'numeric'
        });
    };

    const getDaysUntilDue = (dueDate?: string) => {
        if (!dueDate) return null;
        const due = new Date(dueDate);
        const today = new Date();
        const diff = Math.ceil((due.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
        return diff;
    };

    return (
        <div className="container animate-enter" style={{ padding: '2rem 1rem', maxWidth: '1400px' }}>
            {/* Header */}
            <div style={{ marginBottom: '2rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                    <div>
                        <h1 style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
                            <div style={{ padding: '0.5rem', background: 'var(--color-primary-light)', borderRadius: '8px', color: 'var(--color-primary)' }}>
                                <CheckCircle size={28} />
                            </div>
                            Compliance Actions
                        </h1>
                        <p style={{ color: 'var(--color-text-secondary)' }}>
                            Track and resolve issues from inspections, gap analyses, and regulatory updates.
                        </p>
                    </div>
                    <button className="btn btn-primary" onClick={() => setShowCreateModal(true)}>
                        <Plus size={18} /> New Action
                    </button>
                </div>

                {/* Stats Cards */}
                {stats && (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
                        <div className="card" style={{ padding: '1rem', textAlign: 'center' }}>
                            <div style={{ fontSize: '2rem', fontWeight: '700', color: 'var(--color-text-main)' }}>{stats.total}</div>
                            <div style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)' }}>Total</div>
                        </div>
                        <div className="card" style={{ padding: '1rem', textAlign: 'center' }}>
                            <div style={{ fontSize: '2rem', fontWeight: '700', color: '#6b7280' }}>{stats.open}</div>
                            <div style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)' }}>Open</div>
                        </div>
                        <div className="card" style={{ padding: '1rem', textAlign: 'center' }}>
                            <div style={{ fontSize: '2rem', fontWeight: '700', color: '#3b82f6' }}>{stats.in_progress}</div>
                            <div style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)' }}>In Progress</div>
                        </div>
                        <div className="card" style={{ padding: '1rem', textAlign: 'center' }}>
                            <div style={{ fontSize: '2rem', fontWeight: '700', color: '#ef4444' }}>{stats.overdue}</div>
                            <div style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)' }}>Overdue</div>
                        </div>
                        <div className="card" style={{ padding: '1rem', textAlign: 'center' }}>
                            <div style={{ fontSize: '2rem', fontWeight: '700', color: '#10b981' }}>{stats.resolved}</div>
                            <div style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)' }}>Resolved</div>
                        </div>
                    </div>
                )}

                {/* Filters */}
                <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--color-text-secondary)' }}>
                        <Filter size={16} /> Filters:
                    </div>

                    <select
                        className="form-input"
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        style={{ padding: '0.5rem 1rem', minWidth: '150px' }}
                    >
                        <option value="all">All Status</option>
                        {Object.entries(STATUS_CONFIG).map(([key, config]) => (
                            <option key={key} value={key}>{config.label}</option>
                        ))}
                    </select>

                    <select
                        className="form-input"
                        value={priorityFilter}
                        onChange={(e) => setPriorityFilter(e.target.value)}
                        style={{ padding: '0.5rem 1rem', minWidth: '150px' }}
                    >
                        <option value="all">All Priority</option>
                        {Object.entries(PRIORITY_CONFIG).map(([key, config]) => (
                            <option key={key} value={key}>{config.label}</option>
                        ))}
                    </select>

                    <select
                        className="form-input"
                        value={keyQuestionFilter}
                        onChange={(e) => setKeyQuestionFilter(e.target.value)}
                        style={{ padding: '0.5rem 1rem', minWidth: '150px' }}
                    >
                        <option value="all">All Key Questions</option>
                        {Object.entries(KEY_QUESTION_CONFIG).map(([key, config]) => (
                            <option key={key} value={key}>{config.label}</option>
                        ))}
                    </select>
                </div>
            </div>

            {/* Actions List */}
            {loading ? (
                <div style={{ display: 'flex', justifyContent: 'center', padding: '4rem' }}>
                    <Loader2 size={32} className="spin" style={{ color: 'var(--color-primary)' }} />
                </div>
            ) : actions.length === 0 ? (
                <div className="card" style={{ padding: '4rem', textAlign: 'center' }}>
                    <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>✅</div>
                    <h3 style={{ marginBottom: '0.5rem' }}>No Actions Found</h3>
                    <p style={{ color: 'var(--color-text-secondary)', marginBottom: '1.5rem' }}>
                        {statusFilter !== 'all' || priorityFilter !== 'all' || keyQuestionFilter !== 'all'
                            ? 'No actions match your current filters.'
                            : 'Run a Mock Inspection or Gap Analysis to generate compliance actions.'}
                    </p>
                    <button className="btn btn-primary" onClick={() => setShowCreateModal(true)}>
                        <Plus size={18} /> Create Manual Action
                    </button>
                </div>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    {actions.map(action => {
                        const statusConfig = STATUS_CONFIG[action.status];
                        const priorityConfig = PRIORITY_CONFIG[action.priority];
                        const keyQuestionConfig = action.key_question ? KEY_QUESTION_CONFIG[action.key_question] : null;
                        const daysUntilDue = getDaysUntilDue(action.due_date);
                        const StatusIcon = statusConfig.icon;
                        const KeyQuestionIcon = keyQuestionConfig?.icon;

                        return (
                            <div
                                key={action.id}
                                className="card"
                                style={{
                                    padding: '1.25rem',
                                    cursor: 'pointer',
                                    transition: 'all 0.2s',
                                    borderLeft: `4px solid ${priorityConfig.color}`
                                }}
                                onClick={() => setSelectedAction(action)}
                            >
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1rem' }}>
                                    <div style={{ flex: 1 }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
                                            <StatusIcon size={20} style={{ color: statusConfig.color }} />
                                            <h3 style={{ margin: 0, fontSize: '1rem' }}>{action.title}</h3>
                                        </div>

                                        {action.description && (
                                            <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.875rem', marginBottom: '0.75rem', lineHeight: '1.5' }}>
                                                {action.description.slice(0, 150)}
                                                {action.description.length > 150 && '...'}
                                            </p>
                                        )}

                                        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', fontSize: '0.8rem' }}>
                                            {keyQuestionConfig && KeyQuestionIcon && (
                                                <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', padding: '0.25rem 0.5rem', background: `${keyQuestionConfig.color}15`, color: keyQuestionConfig.color, borderRadius: '4px' }}>
                                                    <KeyQuestionIcon size={14} /> {keyQuestionConfig.label}
                                                </span>
                                            )}

                                            <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', padding: '0.25rem 0.5rem', background: `${priorityConfig.color}15`, color: priorityConfig.color, borderRadius: '4px' }}>
                                                <Tag size={14} /> {priorityConfig.label}
                                            </span>

                                            {action.due_date && (
                                                <span style={{
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    gap: '0.25rem',
                                                    padding: '0.25rem 0.5rem',
                                                    background: daysUntilDue !== null && daysUntilDue < 0 ? '#fef2f2' : daysUntilDue !== null && daysUntilDue <= 3 ? '#fffbeb' : '#f0fdf4',
                                                    color: daysUntilDue !== null && daysUntilDue < 0 ? '#dc2626' : daysUntilDue !== null && daysUntilDue <= 3 ? '#d97706' : '#16a34a',
                                                    borderRadius: '4px'
                                                }}>
                                                    <Calendar size={14} />
                                                    {daysUntilDue !== null && daysUntilDue < 0
                                                        ? `${Math.abs(daysUntilDue)} days overdue`
                                                        : daysUntilDue === 0
                                                            ? 'Due today'
                                                            : `Due in ${daysUntilDue} days`}
                                                </span>
                                            )}

                                            <span style={{ color: 'var(--color-text-tertiary)' }}>
                                                <FileText size={14} style={{ display: 'inline', marginRight: '0.25rem' }} />
                                                {action.source.replace('_', ' ')}
                                            </span>
                                        </div>
                                    </div>

                                    <div style={{ display: 'flex', gap: '0.5rem' }} onClick={(e) => e.stopPropagation()}>
                                        <select
                                            className="form-input"
                                            value={action.status}
                                            onChange={(e) => handleStatusChange(action.id, e.target.value as ComplianceAction['status'])}
                                            style={{ padding: '0.35rem 0.5rem', fontSize: '0.8rem', minWidth: '120px' }}
                                        >
                                            {Object.entries(STATUS_CONFIG).map(([key, config]) => (
                                                <option key={key} value={key}>{config.label}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Create Action Modal */}
            {showCreateModal && (
                <CreateActionModal
                    organizationId={profile?.organization_id || ''}
                    onClose={() => setShowCreateModal(false)}
                    onCreated={() => {
                        setShowCreateModal(false);
                        loadData();
                    }}
                />
            )}

            {/* Action Detail Modal */}
            {selectedAction && (
                <ActionDetailModal
                    action={selectedAction}
                    onClose={() => setSelectedAction(null)}
                    onUpdate={() => {
                        setSelectedAction(null);
                        loadData();
                    }}
                    onDelete={() => {
                        handleDelete(selectedAction.id);
                        setSelectedAction(null);
                    }}
                />
            )}
        </div>
    );
};

// Create Action Modal Component
const CreateActionModal = ({ organizationId, onClose, onCreated }: {
    organizationId: string;
    onClose: () => void;
    onCreated: () => void;
}) => {
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [keyQuestion, setKeyQuestion] = useState('');
    const [priority, setPriority] = useState<'low' | 'medium' | 'high' | 'critical'>('medium');
    const [dueDate, setDueDate] = useState('');
    const [submitting, setSubmitting] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!title.trim()) return;

        setSubmitting(true);
        try {
            await createAction(organizationId, {
                source: 'manual',
                title,
                description,
                key_question: keyQuestion as any || undefined,
                priority,
                due_date: dueDate || undefined
            });
            onCreated();
        } catch (error) {
            console.error('Error creating action:', error);
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1rem' }}>
            <div className="card" style={{ width: '100%', maxWidth: '500px', padding: '2rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                    <h2>Create New Action</h2>
                    <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '0.5rem' }}>
                        <X size={20} />
                    </button>
                </div>

                <form onSubmit={handleSubmit}>
                    <div style={{ marginBottom: '1rem' }}>
                        <label className="form-label">Title *</label>
                        <input
                            className="form-input"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            placeholder="e.g., Update safeguarding policy"
                            required
                        />
                    </div>

                    <div style={{ marginBottom: '1rem' }}>
                        <label className="form-label">Description</label>
                        <textarea
                            className="form-input"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="Add more details..."
                            rows={3}
                        />
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                        <div>
                            <label className="form-label">Key Question</label>
                            <select className="form-input" value={keyQuestion} onChange={(e) => setKeyQuestion(e.target.value)}>
                                <option value="">Select...</option>
                                {Object.entries(KEY_QUESTION_CONFIG).map(([key, config]) => (
                                    <option key={key} value={key}>{config.label}</option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="form-label">Priority</label>
                            <select className="form-input" value={priority} onChange={(e) => setPriority(e.target.value as any)}>
                                {Object.entries(PRIORITY_CONFIG).map(([key, config]) => (
                                    <option key={key} value={key}>{config.label}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div style={{ marginBottom: '1.5rem' }}>
                        <label className="form-label">Due Date</label>
                        <input
                            type="date"
                            className="form-input"
                            value={dueDate}
                            onChange={(e) => setDueDate(e.target.value)}
                        />
                    </div>

                    <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
                        <button type="button" className="btn btn-secondary" onClick={onClose}>
                            Cancel
                        </button>
                        <button type="submit" className="btn btn-primary" disabled={submitting || !title.trim()}>
                            {submitting ? <Loader2 size={16} className="spin" /> : <Plus size={16} />}
                            Create Action
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

// Action Detail Modal Component
const ActionDetailModal = ({ action, onClose, onUpdate, onDelete }: {
    action: ComplianceAction;
    onClose: () => void;
    onUpdate: () => void;
    onDelete: () => void;
}) => {
    const { profile } = useAuth();
    const [uploading, setUploading] = useState(false);
    const fileInputRef = React.useRef<HTMLInputElement>(null);
    const statusConfig = STATUS_CONFIG[action.status];
    const priorityConfig = PRIORITY_CONFIG[action.priority];
    const keyQuestionConfig = action.key_question ? KEY_QUESTION_CONFIG[action.key_question] : null;

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || !profile?.organization_id) return;

        setUploading(true);
        try {
            await uploadActionEvidence(action.id, profile.organization_id, file);
            onUpdate();
        } catch (error) {
            console.error('Upload failed:', error);
            alert('Failed to upload evidence. Please ensure storage bucket is configured.');
        } finally {
            setUploading(false);
        }
    };

    return (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1rem' }}>
            <div className="card" style={{ width: '100%', maxWidth: '600px', padding: '2rem', maxHeight: '90vh', overflowY: 'auto' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem' }}>
                    <div>
                        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem' }}>
                            <span style={{ padding: '0.25rem 0.5rem', background: `${statusConfig.color}15`, color: statusConfig.color, borderRadius: '4px', fontSize: '0.75rem' }}>
                                {statusConfig.label}
                            </span>
                            <span style={{ padding: '0.25rem 0.5rem', background: `${priorityConfig.color}15`, color: priorityConfig.color, borderRadius: '4px', fontSize: '0.75rem' }}>
                                {priorityConfig.label} Priority
                            </span>
                        </div>
                        <h2 style={{ margin: 0 }}>{action.title}</h2>
                    </div>
                    <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '0.5rem' }}>
                        <X size={20} />
                    </button>
                </div>

                {action.description && (
                    <div style={{ marginBottom: '1.5rem' }}>
                        <h4 style={{ color: 'var(--color-text-secondary)', marginBottom: '0.5rem' }}>Description</h4>
                        <p style={{ lineHeight: '1.6' }}>{action.description}</p>
                    </div>
                )}

                {action.recommendation && (
                    <div style={{ marginBottom: '1.5rem', padding: '1rem', background: '#f0fdf4', borderRadius: '8px', border: '1px solid #bbf7d0' }}>
                        <h4 style={{ color: '#16a34a', marginBottom: '0.5rem' }}>Recommendation</h4>
                        <p style={{ lineHeight: '1.6', color: '#166534' }}>{action.recommendation}</p>
                    </div>
                )}

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
                    <div>
                        <h4 style={{ color: 'var(--color-text-secondary)', marginBottom: '0.25rem', fontSize: '0.875rem' }}>Key Question</h4>
                        <p>{keyQuestionConfig?.label || '-'}</p>
                    </div>
                    <div>
                        <h4 style={{ color: 'var(--color-text-secondary)', marginBottom: '0.25rem', fontSize: '0.875rem' }}>Due Date</h4>
                        <p>{action.due_date ? new Date(action.due_date).toLocaleDateString('en-GB') : '-'}</p>
                    </div>
                    <div>
                        <h4 style={{ color: 'var(--color-text-secondary)', marginBottom: '0.25rem', fontSize: '0.875rem' }}>Source</h4>
                        <p style={{ textTransform: 'capitalize' }}>{action.source.replace('_', ' ')}</p>
                    </div>
                    <div>
                        <h4 style={{ color: 'var(--color-text-secondary)', marginBottom: '0.25rem', fontSize: '0.875rem' }}>Created</h4>
                        <p>{new Date(action.created_at).toLocaleDateString('en-GB')}</p>
                    </div>
                </div>

                <div style={{ marginBottom: '1.5rem', padding: '1.25rem', border: '1px dashed var(--color-border)', borderRadius: '8px', background: '#f8fafc' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                        <h4 style={{ color: 'var(--color-text-secondary)', margin: 0 }}>Evidence & Verification</h4>
                        <button
                            className="btn btn-secondary"
                            style={{ padding: '0.4rem 0.75rem', fontSize: '0.85rem' }}
                            onClick={() => fileInputRef.current?.click()}
                            disabled={uploading}
                        >
                            {uploading ? <Loader2 size={14} className="spin" /> : <Upload size={14} />}
                            {uploading ? 'Uploading...' : 'Upload File'}
                        </button>
                        <input
                            type="file"
                            ref={fileInputRef}
                            style={{ display: 'none' }}
                            onChange={handleFileUpload}
                            accept=".pdf,.doc,.docx,.jpg,.png"
                        />
                    </div>

                    {action.evidence_urls && action.evidence_urls.length > 0 ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                            {action.evidence_urls.map((url, idx) => (
                                <a
                                    key={idx}
                                    href={url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '0.5rem',
                                        fontSize: '0.9rem',
                                        color: 'var(--color-primary)',
                                        background: 'white',
                                        padding: '0.5rem',
                                        borderRadius: '4px',
                                        border: '1px solid var(--color-border)'
                                    }}
                                >
                                    <FileText size={14} /> Evidence Document {idx + 1}
                                </a>
                            ))}
                        </div>
                    ) : (
                        <p style={{ fontSize: '0.85rem', color: 'var(--color-text-tertiary)', textAlign: 'center', margin: '0.5rem 0' }}>
                            No evidence uploaded yet. Compliance requires proof of resolution.
                        </p>
                    )}
                </div>

                {action.resolution_notes && (
                    <div style={{ marginBottom: '1.5rem', padding: '1rem', background: '#f0fdf4', borderRadius: '8px' }}>
                        <h4 style={{ color: '#16a34a', marginBottom: '0.5rem' }}>Resolution Notes</h4>
                        <p>{action.resolution_notes}</p>
                        {action.resolved_at && (
                            <p style={{ fontSize: '0.8rem', color: 'var(--color-text-tertiary)', marginTop: '0.5rem' }}>
                                Resolved on {new Date(action.resolved_at).toLocaleDateString('en-GB')}
                            </p>
                        )}
                    </div>
                )}

                <div style={{ display: 'flex', gap: '1rem', justifyContent: 'space-between', paddingTop: '1rem', borderTop: '1px solid var(--color-border)' }}>
                    <button className="btn btn-secondary" onClick={onDelete} style={{ color: '#dc2626' }}>
                        Delete
                    </button>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <button className="btn btn-secondary" onClick={onClose}>
                            Close
                        </button>
                        {action.status !== 'resolved' && (
                            <button className="btn btn-primary" onClick={async () => {
                                await updateActionStatus(action.id, 'resolved');
                                onUpdate();
                            }}>
                                <CheckCircle size={16} /> Mark Resolved
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Actions;
