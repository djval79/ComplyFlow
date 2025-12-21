import React, { useState } from 'react';
import { CheckCircle, AlertTriangle, FileText, ArrowRight, HeartHandshake } from 'lucide-react';
import { useCompliance } from '../context/ComplianceContext';

export const VisitingRights = () => {
    const { companyName } = useCompliance();
    const [auditScore, setAuditScore] = useState<number | null>(null);

    const [checklist, setChecklist] = useState([
        { id: 1, text: "Do you have a written policy explicitly supporting 'unrestricted visiting' by default?", checked: false },
        { id: 2, text: "Are decisions to restrict visitors made on an individual risk-assessment basis (not blanket bans)?", checked: false },
        { id: 3, text: "Does your policy allow for 'essential care givers' even during outbreaks?", checked: false },
        { id: 4, text: "Have all staff been trained on the new 'Regulation 9A' requirements?", checked: false },
        { id: 5, text: "Is information about visiting rights accessible to residents in formats they understand?", checked: false },
    ]);

    const handleCheck = (id: number) => {
        const updated = checklist.map(item => item.id === id ? { ...item, checked: !item.checked } : item);
        setChecklist(updated);

        // rudimentary score calc
        const checkedCount = updated.filter(i => i.checked).length;
        setAuditScore(Math.round((checkedCount / updated.length) * 100));
    };

    const getStatusParams = () => {
        if (auditScore === null) return { color: 'var(--color-text-secondary)', text: 'Pending Audit', bg: '#f1f5f9' };
        if (auditScore === 100) return { color: 'var(--color-success)', text: 'Compliant', bg: 'var(--color-success-bg)' };
        if (auditScore >= 60) return { color: 'var(--color-warning)', text: 'Plan Needed', bg: '#fffbeb' };
        return { color: 'var(--color-danger)', text: 'Non-Compliant', bg: '#fef2f2' };
    };

    const status = getStatusParams();

    return (
        <div className="container animate-enter" style={{ padding: '2rem 1rem' }}>

            {/* Header */}
            <div style={{ marginBottom: '2rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
                <div>
                    <h1 style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <span style={{ background: 'var(--color-bg-surface)', padding: '0.5rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)' }}>
                            <HeartHandshake size={24} color="var(--color-primary)" />
                        </span>
                        Regulation 9A: Visiting Rights
                    </h1>
                    <p style={{ color: 'var(--color-text-secondary)', marginTop: '0.5rem' }}>
                        Compliance toolkit for the new CQC fundamental standard on visiting.
                    </p>
                </div>

                <div style={{
                    padding: '0.75rem 1.5rem',
                    borderRadius: 'var(--radius-md)',
                    background: status.bg,
                    border: `1px solid ${status.color}`,
                    textAlign: 'center'
                }}>
                    <div style={{ fontSize: '0.75rem', fontWeight: 600, color: status.color, textTransform: 'uppercase' }}>Current Status</div>
                    <div style={{ fontSize: '1.25rem', fontWeight: 700, color: status.color }}>{status.text}</div>
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '2rem' }}>

                {/* Checklist Section */}
                <div className="card">
                    <h3 style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <CheckCircle size={20} /> Self-Assessment
                    </h3>

                    <div className="flex flex-col gap-3">
                        {checklist.map(item => (
                            <label key={item.id} style={{
                                display: 'flex',
                                gap: '1rem',
                                padding: '1rem',
                                border: '1px solid var(--color-border)',
                                borderRadius: 'var(--radius-md)',
                                cursor: 'pointer',
                                transition: 'all 0.2s',
                                background: item.checked ? 'var(--color-bg-surface)' : 'white'
                            }}>
                                <input
                                    type="checkbox"
                                    checked={item.checked}
                                    onChange={() => handleCheck(item.id)}
                                    style={{ width: '20px', height: '20px', marginTop: '2px', accentColor: 'var(--color-primary)' }}
                                />
                                <span style={{ fontSize: '0.95rem', color: item.checked ? 'var(--color-text-main)' : 'var(--color-text-secondary)' }}>
                                    {item.text}
                                </span>
                            </label>
                        ))}
                    </div>

                    {auditScore !== null && auditScore < 100 && (
                        <div style={{ marginTop: '1.5rem', padding: '1rem', background: '#fff7ed', border: '1px solid #fed7aa', borderRadius: 'var(--radius-sm)' }}>
                            <strong style={{ color: '#9a3412', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <AlertTriangle size={16} /> Action Required
                            </strong>
                            <p style={{ fontSize: '0.9rem', color: '#7c2d12', marginTop: '0.5rem' }}>
                                You have unidentified gaps. Download our policy template to address points 2 and 3 immediately.
                            </p>
                        </div>
                    )}
                </div>

                {/* Resources & Tools */}
                <div className="flex flex-col gap-4">

                    {/* Policy Generator Card */}
                    <div className="card" style={{ background: 'linear-gradient(135deg, white 0%, #f0f9ff 100%)' }}>
                        <h3 style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <FileText size={20} color="var(--color-primary)" /> Policy Generator
                        </h3>
                        <p style={{ fontSize: '0.9rem', color: 'var(--color-text-secondary)', marginBottom: '1.5rem' }}>
                            Create a bespoke "Visiting in Care Homes" policy for <strong>{companyName}</strong> that meets Regulation 9A.
                        </p>
                        <button
                            className="btn btn-primary btn-full"
                            onClick={() => {
                                import('../lib/policyGenerator').then(({ generateVisitingPolicy }) => {
                                    const text = generateVisitingPolicy(companyName || 'Your Organization');
                                    const blob = new Blob([text], { type: 'text/plain' });
                                    const url = URL.createObjectURL(blob);
                                    const a = document.createElement('a');
                                    a.href = url;
                                    a.download = `Visiting_Policy_${new Date().toISOString().split('T')[0]}.txt`;
                                    document.body.appendChild(a);
                                    a.click();
                                    document.body.removeChild(a);
                                    URL.revokeObjectURL(url);
                                });
                            }}
                        >
                            Generate Policy <ArrowRight size={16} />
                        </button>
                        <div style={{ marginTop: '1rem', fontSize: '0.8rem', color: 'var(--color-text-tertiary)', textAlign: 'center' }}>
                            Updated for April 2024 Legislation
                        </div>
                    </div>

                    {/* Quick Guidance Info */}
                    <div className="card">
                        <h3 style={{ marginBottom: '1rem', fontSize: '1.1rem' }}>Key Requirements</h3>
                        <ul style={{ paddingLeft: '1.25rem', fontSize: '0.9rem', color: 'var(--color-text-secondary)', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                            <li>
                                <strong>No Blanket Bans:</strong> You cannot apply a "closed door" policy to the whole home unless specifically advised by Health Protection Teams during a major outbreak.
                            </li>
                            <li>
                                <strong>Out of Care Home Visits:</strong> Residents must be facilitated to go out (e.g., to vote, work, or education) without unnecessary isolation upon return.
                            </li>
                            <li>
                                <strong>Essential Care Givers:</strong> Every resident is entitled to one, who can visit even during outbreaks.
                            </li>
                        </ul>
                    </div>

                </div>

            </div>
        </div>
    );
};
