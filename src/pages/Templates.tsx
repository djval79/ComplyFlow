import React, { useState, useEffect } from 'react';
import { Download, Shield, Users, Globe, Search, Loader2, FileText, ClipboardCheck, BookOpen, AlertCircle, Sparkles, X, Save, RotateCcw, Lock } from 'lucide-react';
import { useCompliance } from '../context/ComplianceContext';
import { useAuth } from '../context/AuthContext';
import { getTemplates, getUserTemplates, logTemplateDownload, customizeTemplate, saveUserTemplate, type PolicyTemplate, type UserTemplate } from '../services/templatesService';
import { generateComplianceReport } from '../services/pdfService';
import { toast } from 'react-hot-toast';
import ReactMarkdown from 'react-markdown';
import { Link, useNavigate } from 'react-router-dom';

export const TemplateLibrary = () => {
    const { profile, isAuthenticated } = useAuth();
    const { companyName, serviceType } = useCompliance();
    const navigate = useNavigate();

    // State
    const [templates, setTemplates] = useState<PolicyTemplate[]>([]);
    const [userTemplates, setUserTemplates] = useState<UserTemplate[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('all');
    const [serviceFilter, setServiceFilter] = useState<string>(serviceType || 'all');
    const [searchQuery, setSearchQuery] = useState('');

    // Customization states
    const [customizingTemplate, setCustomizingTemplate] = useState<PolicyTemplate | null>(null);
    const [customPrompt, setCustomPrompt] = useState('');
    const [customizedContent, setCustomizedContent] = useState('');
    const [isGenerating, setIsGenerating] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        const loadAllData = async () => {
            try {
                setLoading(true);
                const [standardData, userData] = await Promise.all([
                    getTemplates(),
                    profile?.organization_id ? getUserTemplates(profile.organization_id) : Promise.resolve([])
                ]);
                setTemplates(standardData);
                setUserTemplates(userData);
            } catch (err) {
                console.error('Failed to fetch templates:', err);
                toast.error('Failed to load templates.');
            } finally {
                setLoading(false);
            }
        };

        loadAllData();
    }, [profile?.organization_id]);

    const formatServiceType = (type: string) => {
        if (type === 'domiciliary') return 'Domiciliary Care';
        if (type === 'supported') return 'Supported Living';
        return 'Residential Care';
    };

    const handleDownload = async (template: PolicyTemplate | UserTemplate) => {
        if (!isAuthenticated) {
            navigate('/signup');
            return;
        }

        try {
            // Log download to database if it's a standard template
            if ('is_published' in template && profile?.organization_id) {
                await logTemplateDownload(template.id, profile.organization_id, profile.id);
            }

            // Track in Analytics
            await import('../lib/posthog').then(({ captureEvent }) => {
                captureEvent('template_downloaded', {
                    template_name: 'name' in template ? template.name : (template as any).title,
                    category: template.category,
                    is_custom: (template as any).is_user || false
                });
            });

            const title = 'name' in template ? template.name : (template as any).title;
            const cleanContent = template.content
                .replace(/#+\s/g, '')
                .replace(/\*+/g, '')
                .replace(/\[Organisation Name\]/g, companyName);

            generateComplianceReport({
                title: title,
                subtitle: `Category: ${template.category.toUpperCase()}`,
                organization: companyName,
                date: new Date().toLocaleDateString('en-GB'),
                sections: [
                    {
                        title: 'Document Details',
                        items: [
                            { label: 'Organization', value: companyName },
                            { label: 'Service Type', value: formatServiceType(serviceType) },
                            { label: 'Reference Regulation', value: ('regulation_ids' in template ? template.regulation_ids?.join(', ') : 'N/A') || 'N/A' },
                            { label: 'Version', value: template.version || '1.0' }
                        ]
                    },
                    {
                        title: 'Template Content',
                        content: cleanContent
                    }
                ]
            });

            toast.success('Downloaded successfully');
        } catch (err) {
            console.error('Download failed:', err);
            toast.error('Failed to generate PDF.');
        }
    };

    const handleStartCustomization = (template: PolicyTemplate) => {
        if (!isAuthenticated) {
            navigate('/signup');
            return;
        }
        setCustomizingTemplate(template);
        setCustomizedContent(template.content);
        setCustomPrompt('');
    };

    const handleGenerateCustom = async () => {
        if (!customizingTemplate || !customPrompt.trim()) return;

        try {
            setIsGenerating(true);
            const result = await customizeTemplate(
                customizingTemplate.name,
                customizingTemplate.content,
                customPrompt,
                { companyName, serviceType }
            );
            setCustomizedContent(result);
            toast.success('AI refinement complete');
        } catch (err) {
            console.error('Customization failed:', err);
            toast.error('AI failed to refine template.');
        } finally {
            setIsGenerating(false);
        }
    };

    const handleSaveCustom = async () => {
        if (!customizingTemplate || !profile?.organization_id) return;

        try {
            setIsSaving(true);
            const saved = await saveUserTemplate({
                organization_id: profile.organization_id,
                base_template_id: customizingTemplate.id,
                name: `${customizingTemplate.name} (Custom)`,
                category: customizingTemplate.category,
                content: customizedContent,
                customization_prompt: customPrompt
            });
            setUserTemplates([saved, ...userTemplates]);
            setCustomizingTemplate(null);
            toast.success('Template saved to your library');
        } catch (err) {
            console.error('Save failed:', err);
            toast.error('Failed to save customized template.');
        } finally {
            setIsSaving(false);
        }
    };

    const getCategoryIcon = (category: string) => {
        switch (category) {
            case 'policy': return <FileText size={16} />;
            case 'form': return <ClipboardCheck size={16} />;
            case 'audit': return <Search size={16} />;
            case 'checklist': return <BookOpen size={16} />;
            case 'procedure': return <Users size={16} />;
            default: return <FileText size={16} />;
        }
    };

    // Merge standard and user templates for display
    const mergedTemplates = [
        ...userTemplates.map(ut => ({ ...ut, is_user: true })),
        ...templates.map(st => ({ ...st, is_user: false }))
    ];

    const filteredTemplates = mergedTemplates.filter(t => {
        const cat = 'category' in t ? t.category : 'all';
        const matchesCat = filter === 'all' || cat === filter;

        const types = 'service_types' in t ? t.service_types : ['residential', 'domiciliary', 'supported'];
        const matchesService = serviceFilter === 'all' || types?.includes(serviceFilter);

        const name = 'name' in t ? t.name : (t as any).title;
        const matchesSearch = name.toLowerCase().includes(searchQuery.toLowerCase());

        return matchesCat && matchesService && matchesSearch;
    });

    return (
        <div className="container animate-enter" style={{ padding: '2rem 1rem' }}>

            {!isAuthenticated && (
                <div style={{
                    background: 'linear-gradient(to right, #2563eb, #1da1f2)',
                    color: 'white',
                    padding: '1rem',
                    borderRadius: 'var(--radius-lg)',
                    marginBottom: '2rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    flexWrap: 'wrap',
                    gap: '1rem'
                }}>
                    <div className="flex items-center gap-3">
                        <Lock size={24} />
                        <div>
                            <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 600 }}>CQC Template Preview</h3>
                            <p style={{ margin: 0, opacity: 0.9, fontSize: '0.9rem' }}>
                                You are viewing a preview. Sign up for free to download and customize 100+ templates.
                            </p>
                        </div>
                    </div>
                    <Link to="/signup" className="btn" style={{ background: 'white', color: '#2563eb', border: 'none', fontWeight: 600 }}>
                        Create Free Account
                    </Link>
                </div>
            )}

            <div className="flex justify-between items-center" style={{ marginBottom: '2rem' }}>
                <div>
                    <h1 style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <span style={{ background: 'var(--color-bg-surface)', padding: '0.5rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)' }}>
                            📄
                        </span>
                        Template Library
                    </h1>
                    <p style={{ color: 'var(--color-text-secondary)', marginTop: '0.5rem' }}>
                        Automated compliance templates {serviceFilter === 'all' ? 'for all care sectors' : <>for <strong>{formatServiceType(serviceFilter)}</strong></>}.
                    </p>
                </div>
                <div className="flex gap-2">
                    <div className="relative">
                        <Search size={16} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-tertiary)' }} />
                        <input
                            type="text"
                            className="form-input"
                            placeholder="Search templates..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            style={{ paddingLeft: '2.5rem', width: '250px' }}
                        />
                    </div>
                </div>
            </div>

            {/* Service Niche Filter */}
            <div style={{ marginBottom: '1.5rem', padding: '1rem', background: 'var(--color-bg-surface)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--color-border)' }}>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: 'var(--color-text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.75rem' }}>
                    Select Service Niche
                </label>
                <div className="flex gap-2 flex-wrap">
                    {[
                        { id: 'all', label: 'All Sectors', icon: <Globe size={14} /> },
                        { id: 'domiciliary', label: 'Domiciliary Care', icon: <Users size={14} /> },
                        { id: 'residential', label: 'Residential Care', icon: <Shield size={14} /> },
                        { id: 'supported', label: 'Supported Living', icon: <Users size={14} /> }
                    ].map(niche => (
                        <button
                            key={niche.id}
                            onClick={() => setServiceFilter(niche.id)}
                            className={`btn ${serviceFilter === niche.id ? 'btn-primary' : 'btn-secondary'}`}
                            style={{
                                padding: '0.5rem 1rem',
                                fontSize: '0.875rem',
                                borderRadius: 'var(--radius-md)',
                                background: serviceFilter === niche.id ? 'var(--color-primary)' : 'white'
                            }}
                        >
                            {niche.icon}
                            {niche.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Filters */}
            <div className="flex gap-2" style={{ marginBottom: '2rem', overflowX: 'auto', paddingBottom: '0.5rem', scrollbarWidth: 'none' }}>
                {[
                    { id: 'all', label: 'All', icon: undefined },
                    { id: 'policy', label: 'Policies', icon: <FileText size={16} /> },
                    { id: 'form', label: 'Forms', icon: <ClipboardCheck size={16} /> },
                    { id: 'audit', label: 'Audits', icon: <Search size={16} /> },
                    { id: 'checklist', label: 'Checklists', icon: <BookOpen size={16} /> },
                    { id: 'procedure', label: 'Procedures', icon: <Users size={16} /> }
                ].map(opt => (
                    <button
                        key={opt.id}
                        onClick={() => setFilter(opt.id)}
                        className={`btn ${filter === opt.id ? 'btn-primary' : 'btn-secondary'}`}
                        style={{ borderRadius: '9999px', paddingLeft: '1.25rem', paddingRight: '1.25rem', whiteSpace: 'nowrap' }}
                    >
                        {opt.icon} {opt.label}
                    </button>
                ))}
            </div>

            {/* Grid */}
            {loading ? (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '300px', gap: '1rem' }}>
                    <Loader2 className="animate-spin" size={40} color="var(--color-primary)" />
                    <p style={{ color: 'var(--color-text-secondary)' }}>Loading templates...</p>
                </div>
            ) : filteredTemplates.length === 0 ? (
                <div className="card" style={{ textAlign: 'center', padding: '4rem 2rem' }}>
                    <AlertCircle size={40} color="var(--color-text-tertiary)" style={{ margin: '0 auto 1rem' }} />
                    <h3>No templates found</h3>
                    <p style={{ color: 'var(--color-text-secondary)' }}>Try adjusting your search or category filter.</p>
                </div>
            ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1.5rem' }}>
                    {filteredTemplates.map((t, idx) => (
                        <div key={idx} className="card" style={{ display: 'flex', flexDirection: 'column', padding: '1.5rem', transition: 'transform 0.2s ease', border: (t as any).is_user ? '1px solid var(--color-accent)' : undefined }}>
                            <div className="flex items-start justify-between" style={{ marginBottom: '1.25rem' }}>
                                <div style={{
                                    width: 44, height: 44,
                                    background: t.category === 'policy' ? '#dbeafe' : t.category === 'form' ? '#f0fdf4' : '#fff7ed',
                                    color: t.category === 'policy' ? '#2563eb' : t.category === 'form' ? '#16a34a' : '#d97706',
                                    borderRadius: '10px',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center'
                                }}>
                                    {getCategoryIcon(t.category)}
                                </div>
                                <div className="flex gap-2">
                                    {(t as any).is_user && <span className="badge badge-accent">Custom</span>}
                                    {'is_premium' in t && t.is_premium && <span className="badge badge-warning">Premium</span>}
                                    {'regulation_ids' in t && t.regulation_ids?.[0] && <span className="badge badge-success">{t.regulation_ids[0]}</span>}
                                </div>
                            </div>

                            <h3 style={{ fontSize: '1.15rem', marginBottom: '0.75rem', fontWeight: 600 }}>{'name' in t ? t.name : (t as any).title}</h3>
                            <p style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)', marginBottom: '1.5rem', flex: 1, lineClamp: 2, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                                {'description' in t ? t.description : `Custom template based on standard ${t.category}.`}
                            </p>

                            <div className="flex gap-2">
                                <button
                                    className="btn btn-secondary"
                                    style={{ flex: 1, justifyContent: 'center' }}
                                    onClick={() => handleDownload(t as any)}
                                >
                                    <Download size={16} />
                                    <span>{isAuthenticated ? 'PDF' : 'Download'}</span>
                                </button>
                                {!(t as any).is_user && (
                                    <button
                                        className="btn btn-primary"
                                        style={{ flex: 1, justifyContent: 'center', background: 'var(--color-accent)', borderColor: 'var(--color-accent)' }}
                                        onClick={() => handleStartCustomization(t as PolicyTemplate)}
                                    >
                                        <Sparkles size={16} />
                                        <span>{isAuthenticated ? 'AI Tailor' : 'Sign up'}</span>
                                    </button>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Customization Modal */}
            {customizingTemplate && isAuthenticated && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                    background: 'rgba(0,0,0,0.5)', zIndex: 1000,
                    display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem'
                }}>
                    <div className="card" style={{ width: '100%', maxWidth: '900px', maxHeight: '90vh', display: 'flex', flexDirection: 'column', padding: 0, overflow: 'hidden' }}>
                        <div style={{ padding: '1.25rem', borderBottom: '1px solid var(--color-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                <Sparkles size={20} color="var(--color-accent)" />
                                <h2 style={{ margin: 0, fontSize: '1.25rem' }}>AI Template Customization</h2>
                            </div>
                            <button onClick={() => setCustomizingTemplate(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-tertiary)' }}>
                                <X size={24} />
                            </button>
                        </div>

                        <div style={{ flex: 1, display: 'grid', gridTemplateColumns: '350px 1fr', overflow: 'hidden' }}>
                            {/* Controls */}
                            <div style={{ padding: '1.5rem', borderRight: '1px solid var(--color-border)', overflowY: 'auto', background: 'var(--color-bg-page)' }}>
                                <div style={{ marginBottom: '1.5rem' }}>
                                    <label style={{ display: 'block', fontWeight: 600, marginBottom: '0.5rem', fontSize: '0.9rem' }}>Template Source</label>
                                    <div style={{ padding: '0.75rem', background: 'white', borderRadius: '8px', border: '1px solid var(--color-border)', fontSize: '0.85rem' }}>
                                        {customizingTemplate.name}
                                    </div>
                                </div>

                                <div style={{ marginBottom: '1.5rem' }}>
                                    <label style={{ display: 'block', fontWeight: 600, marginBottom: '0.5rem', fontSize: '0.9rem' }}>AI Customization Prompt</label>
                                    <textarea
                                        className="form-input"
                                        placeholder="Example: Add a section for agency staff responsibilities and update the review period to 6 months."
                                        rows={6}
                                        value={customPrompt}
                                        onChange={(e) => setCustomPrompt(e.target.value)}
                                        style={{ fontSize: '0.85rem', lineHeight: '1.5' }}
                                    />
                                    <p style={{ fontSize: '0.75rem', color: 'var(--color-text-tertiary)', marginTop: '0.5rem' }}>
                                        The AI will use 10,000+ words of CQC guidance to ensure compliance while adding your specific details.
                                    </p>
                                </div>

                                <button
                                    className="btn btn-primary btn-full"
                                    onClick={handleGenerateCustom}
                                    disabled={isGenerating || !customPrompt.trim()}
                                    style={{ background: 'var(--color-accent)', borderColor: 'var(--color-accent)', marginBottom: '1rem' }}
                                >
                                    {isGenerating ? <Loader2 size={18} className="animate-spin" /> : <RotateCcw size={18} />}
                                    <span style={{ marginLeft: '0.5rem' }}>{isGenerating ? 'AI Writing...' : 'Generate with AI'}</span>
                                </button>

                                <button
                                    className="btn btn-secondary btn-full"
                                    onClick={handleSaveCustom}
                                    disabled={isSaving || isGenerating || !customizedContent}
                                >
                                    {isSaving ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
                                    <span style={{ marginLeft: '0.5rem' }}>Save to Library</span>
                                </button>
                            </div>

                            {/* Preview */}
                            <div style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                                <div style={{ padding: '0.75rem 1.5rem', background: 'white', borderBottom: '1px solid var(--color-border)', fontSize: '0.8rem', fontWeight: 600, color: 'var(--color-text-tertiary)', display: 'flex', justifyContent: 'space-between' }}>
                                    <span>LIVE PREVIEW</span>
                                    <span>{companyName || 'Your Org'} • {formatServiceType(serviceType || '')}</span>
                                </div>
                                <div style={{
                                    flex: 1, padding: '2rem', overflowY: 'auto',
                                    background: 'white',
                                    fontFamily: 'serif',
                                    lineHeight: '1.6'
                                }}>
                                    <div className="prose prose-blue max-w-none">
                                        <ReactMarkdown>{customizedContent || '# Generating preview...'}</ReactMarkdown>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

