import React, { useState } from 'react';
import { Download, Shield, Users, Globe, Search } from 'lucide-react';

import { useCompliance } from '../context/ComplianceContext';

export const TemplateLibrary = () => {
    const { companyName, serviceType, staffCount } = useCompliance();
    const [filter, setFilter] = useState('all');

    const templates = [
        // HR & Staffing
        { id: 1, title: 'Induction Checklist', category: 'hr', type: 'PDF', size: '1.2 MB' },
        { id: 2, title: 'Supervision Record (Editable)', category: 'hr', type: 'DOCX', size: '45 KB' },
        { id: 3, title: 'Training Matrix Tracker', category: 'hr', type: 'XLSX', size: '250 KB' },
        { id: 4, title: 'Return to Work Interview', category: 'hr', type: 'DOCX', size: '30 KB' },
        { id: 5, title: 'Agency Worker Profile Checklist', category: 'hr', type: 'PDF', size: '1.1 MB' },

        // CQC: Safe
        { id: 6, title: 'Safeguarding Adults Policy', category: 'cqc', type: 'DOCX', size: '120 KB' },
        { id: 7, title: 'Medicines Administration Record (MAR)', category: 'cqc', type: 'DOCX', size: '120 KB' },
        { id: 8, title: 'Infection Control (IPC) Policy', category: 'cqc', type: 'DOCX', size: '145 KB' },
        { id: 9, title: 'Risk Assessment Framework', category: 'cqc', type: 'DOCX', size: '200 KB' },

        // CQC: Effective & Caring
        { id: 10, title: 'Person-Centred Care Plan', category: 'cqc', type: 'DOCX', size: '3.4 MB' },
        { id: 11, title: 'Mental Capacity Act (MCA) Assessment', category: 'cqc', type: 'DOCX', size: '60 KB' },
        { id: 12, title: 'Deprivation of Liberty (DoLS) Log', category: 'cqc', type: 'XLSX', size: '40 KB' },
        { id: 13, title: 'Nutrition & Hydration Chart', category: 'cqc', type: 'PDF', size: '500 KB' },

        // CQC: Well-led & Responsive
        { id: 14, title: 'Whistleblowing Policy', category: 'cqc', type: 'DOCX', size: '90 KB' },
        { id: 15, title: 'Complaints Procedure', category: 'cqc', type: 'DOCX', size: '85 KB' },
        { id: 16, title: 'Mock Inspection Audit Tool', category: 'cqc', type: 'XLSX', size: '300 KB' },
        { id: 17, title: 'Business Continuity Plan', category: 'cqc', type: 'DOCX', size: '1.5 MB' },

        // Home Office & Sponsorship
        { id: 18, title: 'Right-to-Work Checklist (Apr 2025)', category: 'homeoffice', type: 'PDF', size: '550 KB' },
        { id: 19, title: 'Sponsor Worker Record Bundle', category: 'homeoffice', type: 'ZIP', size: '8.1 MB' },
        { id: 20, title: 'Key Personnel Roles Guide', category: 'homeoffice', type: 'PDF', size: '2.2 MB' },
        { id: 21, title: 'Absence Reporting SOP', category: 'homeoffice', type: 'DOCX', size: '40 KB' },
    ];

    const formatServiceType = (type: string) => {
        if (type === 'domiciliary') return 'Domiciliary Care';
        if (type === 'supported') return 'Supported Living';
        return 'Residential Care';
    };

    const handleDownload = (templateTitle: string) => {
        const dummyContent = `NovumFlow Compliance Document\n\nTemplate: ${templateTitle}\nCompany: ${companyName}\nDate: ${new Date().toLocaleDateString()}\n\nThis is a generated placeholder document for demo purposes.`;
        const blob = new Blob([dummyContent], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${templateTitle.replace(/\s+/g, '_')}.txt`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    const filteredTemplates = filter === 'all' ? templates : templates.filter(t => t.category === filter);

    return (
        <div className="container animate-enter" style={{ padding: '2rem 1rem' }}>

            <div className="flex justify-between items-center" style={{ marginBottom: '2rem' }}>
                <div>
                    <h1 style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <span style={{ background: 'var(--color-bg-surface)', padding: '0.5rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)' }}>
                            📄
                        </span>
                        Template Library
                    </h1>
                    <p style={{ color: 'var(--color-text-secondary)', marginTop: '0.5rem' }}>
                        Pre-filled templates for <strong>{formatServiceType(serviceType)}</strong> ({staffCount} Staff).
                    </p>
                </div>
                <div>
                    <button className="btn btn-secondary">
                        <Search size={16} /> Search
                    </button>
                </div>
            </div>

            {/* Filters */}
            <div className="flex gap-2" style={{ marginBottom: '2rem', overflowX: 'auto', paddingBottom: '0.5rem' }}>
                {[
                    { id: 'all', label: 'All Templates', icon: undefined },
                    { id: 'hr', label: 'Staff & HR', icon: <Users size={16} /> },
                    { id: 'cqc', label: 'CQC Evidence', icon: <Shield size={16} /> },
                    { id: 'homeoffice', label: 'Home Office', icon: <Globe size={16} /> }
                ].map(opt => (
                    <button
                        key={opt.id}
                        onClick={() => setFilter(opt.id)}
                        className={`btn ${filter === opt.id ? 'btn-primary' : 'btn-secondary'}`}
                        style={{ borderRadius: '9999px', paddingLeft: '1rem', paddingRight: '1rem' }}
                    >
                        {opt.icon} {opt.label}
                    </button>
                ))}
            </div>

            {/* Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.5rem' }}>
                {filteredTemplates.map(t => (
                    <div key={t.id} className="card" style={{ display: 'flex', flexDirection: 'column', padding: '1.25rem' }}>
                        <div className="flex items-start justify-between" style={{ marginBottom: '1rem' }}>
                            <div style={{
                                width: 40, height: 40,
                                background: t.type === 'PDF' ? '#fee2e2' : t.type.includes('DOC') ? '#dbeafe' : '#f0fdf4',
                                color: t.type === 'PDF' ? '#ef4444' : t.type.includes('DOC') ? '#3b82f6' : '#10b981',
                                borderRadius: '8px',
                                display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '0.75rem'
                            }}>
                                {t.type}
                            </div>
                            {t.category === 'cqc' && <span className="badge badge-success">Reg 12</span>}
                            {t.category === 'homeoffice' && <span className="badge badge-warning">Required</span>}
                        </div>

                        <h3 style={{ fontSize: '1.1rem', marginBottom: '0.5rem', flex: 1 }}>{t.title}</h3>
                        <p style={{ fontSize: '0.875rem', color: 'var(--color-text-tertiary)', marginBottom: '1.5rem' }}>
                            Auto-filled with "{companyName}"
                        </p>

                        <button
                            className="btn btn-secondary btn-full"
                            style={{ justifyContent: 'space-between' }}
                            onClick={() => handleDownload(t.title)}
                        >
                            <span>Download</span>
                            <span style={{ fontSize: '0.75rem', color: 'var(--color-text-tertiary)' }}>{t.size}</span>
                            <Download size={16} />
                        </button>
                    </div>
                ))}
            </div>
        </div>
    );
};
