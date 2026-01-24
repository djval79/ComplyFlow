import React, { useState, useEffect } from 'react'; // Evidence Vault Component
import {
    Shield, FileText, Search, Upload, Filter,
    CheckCircle, AlertTriangle, Clock, Trash2,
    ChevronRight, Info, Brain, Download,
    TrendingUp, LayoutGrid, List, File,
    MoreVertical, CheckSquare, XCircle
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { QUALITY_STATEMENTS } from '../data/cqcInspectionData';
import {
    getEvidence, uploadEvidence, deleteEvidence,
    suggestTagging, updateEvidence, getEvidenceUrl
} from '../services/vaultService';
import type { EvidenceItem } from '../services/vaultService';
import { toast } from 'react-hot-toast';

const KEY_QUESTIONS = [
    { id: 'safe', title: 'Safe', color: '#ef4444', icon: <Shield size={18} /> },
    { id: 'effective', title: 'Effective', color: '#3b82f6', icon: <TrendingUp size={18} /> },
    { id: 'caring', title: 'Caring', color: '#ec4899', icon: <Info size={18} /> },
    { id: 'responsive', title: 'Responsive', color: '#10b981', icon: <CheckCircle size={18} /> },
    { id: 'wellLed', title: 'Well-led', color: '#8b5cf6', icon: <LayoutGrid size={18} /> }
];

export const EvidenceVault = () => {
    const { profile, isDemo } = useAuth();
    const [evidence, setEvidence] = useState<EvidenceItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [filterKey, setFilterKey] = useState<string | 'all'>('all');
    const [searchQuery, setSearchQuery] = useState('');
    const [uploading, setUploading] = useState(false);
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
    const [selectedQsId, setSelectedQsId] = useState<string | null>(null);

    // AI Suggestion State
    const [isSuggesting, setIsSuggesting] = useState(false);
    const [suggestedMapping, setSuggestedMapping] = useState<{
        quality_statement_id?: string;
        key_question?: EvidenceItem['key_question'];
        reasoning?: string;
    } | null>(null);

    useEffect(() => {
        if (profile?.organization_id) {
            fetchEvidence();
        }
    }, [profile?.organization_id]);

    const fetchEvidence = async () => {
        if (!profile?.organization_id) return;
        try {
            setLoading(true);
            const data = await getEvidence(profile.organization_id);
            setEvidence(data);
        } catch (err) {
            toast.error('Failed to load evidence vault');
        } finally {
            setLoading(false);
        }
    };

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || !profile?.organization_id) return;

        try {
            setUploading(true);
            setIsSuggesting(true);

            // 1. Get AI Suggestion first
            const suggestion = await suggestTagging(file.name);
            setSuggestedMapping(suggestion);

            // 2. Perform Upload
            const newEvidence = await uploadEvidence(profile.organization_id, file, {
                quality_statement_id: suggestion.quality_statement_id,
                key_question: suggestion.key_question,
                ai_confidence: suggestion.confidence,
                ai_reasoning: suggestion.reasoning
            });

            setEvidence(prev => [newEvidence, ...prev]);
            toast.success(`Uploaded and auto-tagged as ${suggestion.quality_statement_id || 'unclassified'}`);
        } catch (err) {
            toast.error('Upload failed');
        } finally {
            setUploading(false);
            setIsSuggesting(false);
        }
    };

    const handleDelete = async (item: EvidenceItem) => {
        if (!window.confirm('Are you sure you want to delete this evidence?')) return;

        try {
            await deleteEvidence(item.id, item.file_path);
            setEvidence(prev => prev.filter(e => e.id !== item.id));
            toast.success('Evidence deleted');
        } catch (err) {
            toast.error('Failed to delete');
        }
    };

    const toggleVerify = async (item: EvidenceItem) => {
        const newStatus = item.status === 'verified' ? 'pending' : 'verified';
        try {
            const updated = await updateEvidence(item.id, { status: newStatus as any });
            setEvidence(prev => prev.map(e => e.id === item.id ? updated : e));
            toast.success(newStatus === 'verified' ? 'Evidence verified' : 'Verification removed');
        } catch (err) {
            toast.error('Failed to update status');
        }
    };

    // Calculate Heatmap Stats
    const getQsEvidenceCount = (qsId: string) => evidence.filter(e => e.quality_statement_id === qsId).length;

    const getQsDetailedCoverage = (qsId: string) => {
        const qs = QUALITY_STATEMENTS.find(q => q.id === qsId);
        if (!qs || !qs.requiredEvidence || qs.requiredEvidence.length === 0) {
            return getQsEvidenceCount(qsId) > 0 ? 100 : 0;
        }

        const presentTypes = new Set(evidence
            .filter(e => e.quality_statement_id === qsId && e.evidence_type)
            .map(e => e.evidence_type));

        const covered = qs.requiredEvidence.filter(re => presentTypes.has(re.id)).length;
        return (covered / qs.requiredEvidence.length) * 100;
    };

    const getKeyQuestionCoverage = (kqId: string) => {
        const qsInKq = QUALITY_STATEMENTS.filter(qs => qs.keyQuestion === kqId);
        const totalCoverage = qsInKq.reduce((acc, qs) => acc + getQsDetailedCoverage(qs.id), 0);
        return totalCoverage / qsInKq.length;
    };

    const filteredEvidence = evidence.filter(item => {
        const matchesKey = filterKey === 'all' || item.key_question === filterKey;
        const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            item.quality_statement_id?.toLowerCase().includes(searchQuery.toLowerCase());
        return matchesKey && matchesSearch;
    });

    return (
        <div className="container animate-enter" style={{ padding: '2rem 1rem' }}>
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '2rem' }}>
                <div>
                    <h1 style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--color-text-main)', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <Shield size={32} color="var(--color-primary)" /> AI Evidence Vault
                    </h1>
                    <p style={{ color: 'var(--color-text-secondary)', marginTop: '0.5rem' }}>
                        Centralized regulatory document repository with AI-powered CQC mapping.
                    </p>
                </div>
                <div style={{ display: 'flex', gap: '0.75rem' }}>
                    <label className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                        <Upload size={18} />
                        {uploading ? 'Uploading...' : 'Upload Evidence'}
                        <input type="file" hidden onChange={handleFileUpload} disabled={uploading} />
                    </label>
                </div>
            </div>

            {/* Readiness Heatmap */}
            <div className="card" style={{ marginBottom: '2rem', padding: '1.5rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                    <h3 style={{ fontSize: '1.1rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <Brain size={20} color="var(--color-accent)" /> Inspection Readiness Heatmap
                    </h3>
                    <div style={{ fontSize: '0.8rem', color: 'var(--color-text-tertiary)' }}>
                        Showing coverage across 34 Quality Statements
                    </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '1rem' }}>
                    {KEY_QUESTIONS.map(kq => {
                        const coverage = getKeyQuestionCoverage(kq.id);
                        const qsInKq = QUALITY_STATEMENTS.filter(qs => qs.keyQuestion === kq.id);

                        return (
                            <div key={kq.id} style={{
                                padding: '1rem',
                                background: 'white',
                                borderRadius: '12px',
                                border: `1px solid ${kq.color}30`,
                                borderTop: `4px solid ${kq.color}`
                            }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
                                    <div style={{ color: kq.color }}>{kq.icon}</div>
                                    <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>{kq.title}</span>
                                </div>
                                <div style={{ height: '8px', background: '#e2e8f0', borderRadius: '4px', overflow: 'hidden', marginBottom: '0.5rem' }}>
                                    <div style={{
                                        width: `${coverage}%`,
                                        height: '100%',
                                        background: kq.color,
                                        transition: 'width 0.5s ease'
                                    }} />
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', marginBottom: '1rem' }}>
                                    <span style={{ color: 'var(--color-text-secondary)' }}>Coverage</span>
                                    <span style={{ fontWeight: 700, color: 'var(--color-text-main)' }}>{Math.round(coverage)}%</span>
                                </div>

                                {/* Granular Mini Grid */}
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '4px' }}>
                                    {qsInKq.map(qs => {
                                        const c = getQsDetailedCoverage(qs.id);
                                        return (
                                            <button
                                                key={qs.id}
                                                onClick={() => setSelectedQsId(qs.id)}
                                                title={`${qs.id}: ${qs.title} (${Math.round(c)}%)`}
                                                style={{
                                                    height: '16px',
                                                    borderRadius: '2px',
                                                    border: 'none',
                                                    cursor: 'pointer',
                                                    background: c === 100 ? kq.color : c > 0 ? `${kq.color}60` : '#f1f5f9',
                                                    transition: 'transform 0.2s'
                                                }}
                                                onMouseOver={(e) => e.currentTarget.style.transform = 'scale(1.2)'}
                                                onMouseOut={(e) => e.currentTarget.style.transform = 'scale(1)'}
                                            />
                                        );
                                    })}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Selected QS Detail Overlay */}
            {selectedQsId && (
                <div style={{
                    position: 'fixed', inset: 0, zIndex: 100,
                    background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(4px)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem'
                }} onClick={() => setSelectedQsId(null)}>
                    <div
                        className="card"
                        style={{ width: '100%', maxWidth: '600px', maxHeight: '90vh', overflowY: 'auto', padding: '2rem' }}
                        onClick={e => e.stopPropagation()}
                    >
                        {(() => {
                            const qs = QUALITY_STATEMENTS.find(q => q.id === selectedQsId);
                            if (!qs) return null;
                            const kq = KEY_QUESTIONS.find(k => k.id === qs.keyQuestion);
                            const coverage = getQsDetailedCoverage(qs.id);

                            return (
                                <>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem' }}>
                                        <div>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                                                <span style={{ color: kq?.color }}>{kq?.icon}</span>
                                                <span style={{ fontSize: '0.8rem', fontWeight: 600, color: kq?.color, textTransform: 'uppercase' }}>{kq?.title} Domain</span>
                                            </div>
                                            <h2 style={{ fontSize: '1.5rem', fontWeight: 800 }}>{qs.id}: {qs.title}</h2>
                                        </div>
                                        <button className="btn btn-secondary" onClick={() => setSelectedQsId(null)} style={{ padding: '0.5rem' }}><XCircle size={20} /></button>
                                    </div>

                                    <div style={{ background: 'var(--color-bg-page)', padding: '1.25rem', borderRadius: '12px', marginBottom: '2rem', borderLeft: `6px solid ${kq?.color}` }}>
                                        <h4 style={{ fontSize: '0.8rem', color: 'var(--color-text-tertiary)', textTransform: 'uppercase', marginBottom: '0.5rem', letterSpacing: '0.05em' }}>"We" Statement</h4>
                                        <p style={{ fontSize: '1rem', lineHeight: 1.5, color: 'var(--color-text-main)', fontStyle: 'italic' }}>"{qs.weStatement}"</p>
                                    </div>

                                    <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        Required Evidence
                                        <span style={{ fontSize: '0.9rem', color: kq?.color }}>{Math.round(coverage)}% Complete</span>
                                    </h3>

                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                                        {qs.requiredEvidence?.map(evidenceType => {
                                            const isPresent = evidence.some(e => e.quality_statement_id === qs.id && e.evidence_type === evidenceType.id);
                                            return (
                                                <div key={evidenceType.id} style={{
                                                    padding: '1rem', borderRadius: '10px', background: isPresent ? '#f0fdf4' : 'white',
                                                    border: `1px solid ${isPresent ? '#bbf7d0' : 'var(--color-border)'}`,
                                                    display: 'flex', alignItems: 'flex-start', gap: '1rem'
                                                }}>
                                                    <div style={{ marginTop: '0.25rem' }}>
                                                        {isPresent ? <CheckCircle size={20} color="#22c55e" /> : <AlertTriangle size={20} color="#f59e0b" />}
                                                    </div>
                                                    <div style={{ flex: 1 }}>
                                                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                                                            <span style={{ fontWeight: 700, color: 'var(--color-text-main)' }}>{evidenceType.name}</span>
                                                            {evidenceType.importance === 'critical' && (
                                                                <span style={{ fontSize: '0.65rem', background: '#fee2e2', color: '#b91c1c', padding: '0.1rem 0.4rem', borderRadius: '4px', fontWeight: 800 }}>CRITICAL</span>
                                                            )}
                                                        </div>
                                                        <p style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)' }}>{evidenceType.description}</p>
                                                        {isPresent && (
                                                            <div style={{ marginTop: '0.75rem', display: 'flex', gap: '0.5rem' }}>
                                                                {evidence.filter(e => e.quality_statement_id === qs.id && e.evidence_type === evidenceType.id).map(doc => (
                                                                    <a
                                                                        key={doc.id}
                                                                        href={getEvidenceUrl(doc.file_path)}
                                                                        target="_blank"
                                                                        rel="noreferrer"
                                                                        style={{ fontSize: '0.75rem', color: 'var(--color-primary)', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.25rem' }}
                                                                    >
                                                                        <FileText size={12} /> {doc.name.slice(0, 15)}...
                                                                    </a>
                                                                ))}
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            );
                                        })}
                                        {(!qs.requiredEvidence || qs.requiredEvidence.length === 0) && (
                                            <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--color-text-tertiary)', border: '1px dashed var(--color-border)', borderRadius: '12px' }}>
                                                Detailed evidence mapping coming soon for this statement.
                                            </div>
                                        )}
                                    </div>
                                </>
                            );
                        })()}
                    </div>
                </div>
            )}

            {/* Library Controls */}
            <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem' }}>
                <div style={{ position: 'relative', flex: 1 }}>
                    <Search style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-tertiary)' }} size={18} />
                    <input
                        type="text"
                        placeholder="Search evidence by name or Quality Statement (e.g. S3)..."
                        className="form-input"
                        style={{ paddingLeft: '3rem', width: '100%' }}
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
                <select
                    className="form-input"
                    style={{ width: '200px' }}
                    value={filterKey}
                    onChange={(e) => setFilterKey(e.target.value)}
                >
                    <option value="all">All Domains</option>
                    {KEY_QUESTIONS.map(kq => <option key={kq.id} value={kq.id}>{kq.title}</option>)}
                </select>
                <div style={{ display: 'flex', background: 'white', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', padding: '0.25rem' }}>
                    <button
                        onClick={() => setViewMode('grid')}
                        style={{ padding: '0.4rem', borderRadius: '4px', background: viewMode === 'grid' ? 'var(--color-bg-page)' : 'transparent', border: 'none', cursor: 'pointer' }}
                    >
                        <LayoutGrid size={18} />
                    </button>
                    <button
                        onClick={() => setViewMode('list')}
                        style={{ padding: '0.4rem', borderRadius: '4px', background: viewMode === 'list' ? 'var(--color-bg-page)' : 'transparent', border: 'none', cursor: 'pointer' }}
                    >
                        <List size={18} />
                    </button>
                </div>
            </div>

            {/* Evidence Grid/List */}
            {loading ? (
                <div style={{ textAlign: 'center', padding: '4rem' }}>
                    <Clock className="animate-spin" style={{ color: 'var(--color-primary)' }} />
                    <p style={{ marginTop: '1rem', color: 'var(--color-text-secondary)' }}>Loading your vault...</p>
                </div>
            ) : filteredEvidence.length === 0 ? (
                <div className="card" style={{ textAlign: 'center', padding: '4rem', background: 'white' }}>
                    <FileText size={48} color="#e2e8f0" style={{ margin: '0 auto 1.5rem' }} />
                    <h3 style={{ marginBottom: '0.5rem' }}>No evidence items found</h3>
                    <p style={{ color: 'var(--color-text-secondary)', marginBottom: '1.5rem' }}>Start by uploading policies, audits, or meeting minutes.</p>
                    <label className="btn btn-primary" style={{ cursor: 'pointer' }}>
                        Upload First Document
                        <input type="file" hidden onChange={handleFileUpload} disabled={uploading} />
                    </label>
                </div>
            ) : viewMode === 'grid' ? (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1.5rem' }}>
                    {filteredEvidence.map(item => (
                        <div key={item.id} className="card animate-enter" style={{ padding: '1.25rem', position: 'relative' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                                <div style={{
                                    width: '40px', height: '40px', borderRadius: '8px',
                                    background: 'var(--color-bg-page)', display: 'flex',
                                    alignItems: 'center', justifyContent: 'center', color: 'var(--color-primary)'
                                }}>
                                    <File size={22} />
                                </div>
                                <div style={{ display: 'flex', gap: '0.25rem' }}>
                                    <button
                                        onClick={() => toggleVerify(item)}
                                        title={item.status === 'verified' ? 'Verified' : 'Verify'}
                                        style={{ border: 'none', background: 'transparent', color: item.status === 'verified' ? '#10b981' : '#e2e8f0', cursor: 'pointer' }}
                                    >
                                        <CheckCircle size={18} />
                                    </button>
                                    <button
                                        onClick={() => handleDelete(item)}
                                        style={{ border: 'none', background: 'transparent', color: '#ef4444', cursor: 'pointer', opacity: 0.6 }}
                                    >
                                        <Trash2 size={18} />
                                    </button>
                                </div>
                            </div>

                            <h4 style={{ fontSize: '0.95rem', fontWeight: 700, marginBottom: '0.5rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={item.name}>
                                {item.name}
                            </h4>

                            {item.quality_statement_id ? (
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.75rem' }}>
                                    <span style={{
                                        fontSize: '0.65rem', fontWeight: 700, padding: '0.2rem 0.5rem',
                                        borderRadius: '4px', background: KEY_QUESTIONS.find(k => k.id === item.key_question)?.color + '15',
                                        color: KEY_QUESTIONS.find(k => k.id === item.key_question)?.color
                                    }}>
                                        {item.quality_statement_id}
                                    </span>
                                    <span style={{ fontSize: '0.7rem', color: 'var(--color-text-secondary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                        {QUALITY_STATEMENTS.find(qs => qs.id === item.quality_statement_id)?.title}
                                    </span>
                                </div>
                            ) : (
                                <div style={{ fontSize: '0.7rem', color: 'var(--color-warning)', fontStyle: 'italic', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                                    <AlertTriangle size={12} /> Unclassified
                                </div>
                            )}

                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid var(--color-border)' }}>
                                <span style={{ fontSize: '0.7rem', color: 'var(--color-text-tertiary)' }}>
                                    {new Date(item.created_at).toLocaleDateString()}
                                </span>
                                <a
                                    href={getEvidenceUrl(item.file_path)}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="btn btn-secondary"
                                    style={{ padding: '0.25rem 0.75rem', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}
                                >
                                    <Download size={12} /> View
                                </a>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead style={{ background: 'var(--color-bg-page)', borderBottom: '1px solid var(--color-border)' }}>
                            <tr>
                                <th style={{ textAlign: 'left', padding: '1rem', fontSize: '0.8rem', color: 'var(--color-text-tertiary)' }}>Name</th>
                                <th style={{ textAlign: 'left', padding: '1rem', fontSize: '0.8rem', color: 'var(--color-text-tertiary)' }}>Tagging</th>
                                <th style={{ textAlign: 'left', padding: '1rem', fontSize: '0.8rem', color: 'var(--color-text-tertiary)' }}>Status</th>
                                <th style={{ textAlign: 'left', padding: '1rem', fontSize: '0.8rem', color: 'var(--color-text-tertiary)' }}>Date</th>
                                <th style={{ textAlign: 'right', padding: '1rem', fontSize: '0.8rem', color: 'var(--color-text-tertiary)' }}>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredEvidence.map(item => (
                                <tr key={item.id} style={{ borderBottom: '1px solid var(--color-border)' }}>
                                    <td style={{ padding: '1rem' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                            <File size={18} color="var(--color-text-tertiary)" />
                                            <span style={{ fontSize: '0.9rem', fontWeight: 500 }}>{item.name}</span>
                                        </div>
                                    </td>
                                    <td style={{ padding: '1rem' }}>
                                        {item.quality_statement_id ? (
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                <span style={{
                                                    fontSize: '0.6rem', fontWeight: 800, padding: '0.15rem 0.4rem',
                                                    borderRadius: '4px', background: KEY_QUESTIONS.find(k => k.id === item.key_question)?.color + '15',
                                                    color: KEY_QUESTIONS.find(k => k.id === item.key_question)?.color
                                                }}>
                                                    {item.quality_statement_id}
                                                </span>
                                                <span style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)' }}>
                                                    {QUALITY_STATEMENTS.find(qs => qs.id === item.quality_statement_id)?.title}
                                                </span>
                                            </div>
                                        ) : (
                                            <span style={{ fontSize: '0.8rem', color: 'var(--color-warning)' }}>---</span>
                                        )}
                                    </td>
                                    <td style={{ padding: '1rem' }}>
                                        <span className={`badge badge-${item.status === 'verified' ? 'success' : 'warning'}`}>
                                            {item.status.toUpperCase()}
                                        </span>
                                    </td>
                                    <td style={{ padding: '1rem', fontSize: '0.8rem', color: 'var(--color-text-secondary)' }}>
                                        {new Date(item.created_at).toLocaleDateString()}
                                    </td>
                                    <td style={{ padding: '1rem', textAlign: 'right' }}>
                                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
                                            <a href={getEvidenceUrl(item.file_path)} target="_blank" rel="noreferrer" title="Download">
                                                <Download size={18} color="var(--color-text-tertiary)" />
                                            </a>
                                            <button onClick={() => toggleVerify(item)} style={{ border: 'none', background: 'transparent' }} title="Verify">
                                                <CheckSquare size={18} color={item.status === 'verified' ? '#10b981' : '#e2e8f0'} />
                                            </button>
                                            <button onClick={() => handleDelete(item)} style={{ border: 'none', background: 'transparent' }} title="Delete">
                                                <Trash2 size={18} color="#ef4444" style={{ opacity: 0.6 }} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
};
