import React from 'react';
import { ArrowLeft, BookOpen, Scale, ShieldAlert, GraduationCap, Globe, Sparkles } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const RegulatoryIntelligence = () => {
    const navigate = useNavigate();

    return (
        <div className="container animate-enter" style={{ padding: '2rem 1rem', maxWidth: '1000px' }}>

            {/* Header */}
            <div style={{ marginBottom: '2rem' }}>
                <button
                    className="btn btn-secondary"
                    onClick={() => navigate('/dashboard')}
                    style={{ marginBottom: '1rem', padding: '0.5rem 1rem' }}
                >
                    <ArrowLeft size={16} /> Back to Dashboard
                </button>
                <h1>Regulatory Intelligence</h1>
                <p style={{ color: 'var(--color-text-secondary)', marginTop: '0.5rem' }}>
                    The intersection of CQC Regulations and Home Office Sponsorship duties.
                </p>
            </div>

            {/* Matrix Section */}
            <div className="card" style={{ marginBottom: '2rem' }}>
                <h2 style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>
                    <Scale size={24} color="var(--color-primary)" />
                    Regulatory Intersection Point
                </h2>

                <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
                        <thead>
                            <tr style={{ background: 'var(--color-bg-surface)', borderBottom: '2px solid var(--color-border)' }}>
                                <th style={{ padding: '1rem', textAlign: 'left', width: '20%' }}>Requirement</th>
                                <th style={{ padding: '1rem', textAlign: 'left', width: '25%' }}>CQC Requirement</th>
                                <th style={{ padding: '1rem', textAlign: 'left', width: '25%' }}>Home Office Requirement</th>
                                <th style={{ padding: '1rem', textAlign: 'left', width: '30%' }}>Integrated Implication</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr style={{ borderBottom: '1px solid var(--color-border)' }}>
                                <td style={{ padding: '1rem', fontWeight: 600 }}>Eligibility</td>
                                <td style={{ padding: '1rem' }}>Active, non-dormant registration with the CQC.</td>
                                <td style={{ padding: '1rem' }}>Sponsor licence issued by UKVI.</td>
                                <td style={{ padding: '1rem', background: '#f8fafc' }}>
                                    Must complete CQC registration before applying for a sponsor licence for care roles.
                                </td>
                            </tr>
                            <tr style={{ borderBottom: '1px solid var(--color-border)' }}>
                                <td style={{ padding: '1rem', fontWeight: 600 }}>Staff Competence</td>
                                <td style={{ padding: '1rem' }}>Regulation 18: 'Sufficient numbers of suitably qualified, competent persons'.</td>
                                <td style={{ padding: '1rem' }}>Genuine vacancy test: Role must meet minimum skill/salary levels.</td>
                                <td style={{ padding: '1rem', background: '#f8fafc' }}>
                                    Evidence (training records, rosters) must simultaneously satisfy both regulators.
                                </td>
                            </tr>
                            <tr style={{ borderBottom: '1px solid var(--color-border)' }}>
                                <td style={{ padding: '1rem', fontWeight: 600 }}>Right-to-Work</td>
                                <td style={{ padding: '1rem' }}>Not a direct CQC requirement but relies on staff vetting (Reg 19).</td>
                                <td style={{ padding: '1rem' }}>Employers must perform checks before employment starts.</td>
                                <td style={{ padding: '1rem', background: '#f8fafc' }}>
                                    Employer must perform its own checks alongside accepting Home Office validation.
                                </td>
                            </tr>
                            <tr style={{ borderBottom: '1px solid var(--color-border)' }}>
                                <td style={{ padding: '1rem', fontWeight: 600 }}>Documentation</td>
                                <td style={{ padding: '1rem' }}>Nine mandatory policies (Recruitment, Safeguarding, etc).</td>
                                <td style={{ padding: '1rem' }}>Retention of extensive records (contracts, payslips, CoS).</td>
                                <td style={{ padding: '1rem', background: '#f8fafc' }}>
                                    Centralised HR system essential to store evidence for both CQC and Home Office audits.
                                </td>
                            </tr>
                            <tr>
                                <td style={{ padding: '1rem', fontWeight: 600 }}>Inspection Focus</td>
                                <td style={{ padding: '1rem' }}>Quality of care, safety, and well-being of service users.</td>
                                <td style={{ padding: '1rem' }}>Compliance with immigration rules and sponsor duties.</td>
                                <td style={{ padding: '1rem', background: '#f8fafc' }}>
                                    Providers with weak processes risk simultaneous enforcement actions from both bodies.
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Deep Dive Section */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem', marginBottom: '2rem' }}>
                <div className="card">
                    <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
                        <ShieldAlert size={20} color="var(--color-danger)" />
                        Systemic Risks
                    </h3>
                    <p style={{ lineHeight: '1.6', color: 'var(--color-text-secondary)', fontSize: '0.95rem' }}>
                        The UK health and social care sector faces risks from the interplay of regulatory demands.
                        <strong> "Closed cultures"</strong> are a major risk factor—environments with poor care, weak management,
                        and limited oversight. These create blind spots for scrutiny, increasing the risk of serious incidents
                        and exploitation of sponsored workers.
                    </p>
                    <div style={{ marginTop: '1rem', padding: '0.75rem', background: '#fef2f2', borderRadius: 'var(--radius-sm)', borderLeft: '3px solid var(--color-danger)' }}>
                        <small><strong>Mitigation:</strong> Move from reactive support to proactive gap analysis. Use the Gap Analyzer to identify missing policies before an inspection.</small>
                    </div>
                </div>

                <div className="card">
                    <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
                        <GraduationCap size={20} color="var(--color-accent)" />
                        Operational Integrity
                    </h3>
                    <p style={{ lineHeight: '1.6', color: 'var(--color-text-secondary)', fontSize: '0.95rem' }}>
                        <strong>Regulation 18</strong> imposes a duty to deploy suitably qualified persons. This is not static but dynamic.
                        Leadership (Regulation 5) requires "Fit and Proper Persons" at the board level.
                        Professional boundaries must be maintained—no gifts, borrowing money, or social media connections with service users.
                    </p>
                </div>
            </div>

            {/* TABS NAVIGATION */}
            <div style={{ display: 'flex', gap: '1rem', borderBottom: '1px solid var(--color-border)', marginBottom: '2rem' }}>
                <button
                    style={{ padding: '0.5rem 1rem', borderBottom: '2px solid var(--color-primary)', fontWeight: 600, color: 'var(--color-primary)' }}
                >
                    Knowledge Engine
                </button>
                <button
                    style={{ padding: '0.5rem 1rem', color: 'var(--color-text-secondary)' }}
                    onClick={() => {
                        // Simple toggle logic (for MVP, simply scrolling for now or we could add state)
                        document.getElementById('saf-explorer')?.scrollIntoView({ behavior: 'smooth' });
                    }}
                >
                    SAF Explorer (New)
                </button>
                <button
                    style={{ padding: '0.5rem 1rem', color: 'var(--color-text-secondary)' }}
                    onClick={() => {
                        // Simple toggle logic (for MVP, simply scrolling for now or we could add state)
                        document.getElementById('home-office-checklist')?.scrollIntoView({ behavior: 'smooth' });
                    }}
                >
                    Home Office Checklist (New)
                </button>
            </div>

            {/* Knowledge Engine Section (Previous Content) */}
            {/* Ingestion Interface */}
            <div className="card" style={{ marginBottom: '2rem', borderTop: '4px solid var(--color-success)' }}>
                {/* ... (Keep existing ingestion UI) ... */}
                <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
                    <BookOpen size={20} color="var(--color-success)" /> Knowledge Base Ingestion
                </h3>
                <div style={{ padding: '1rem', background: '#f8fafc', borderRadius: 'var(--radius-sm)', marginBottom: '1rem' }}>
                    <div className="flex justify-between items-center">
                        <div>
                            <h4 style={{ fontSize: '0.9rem', marginBottom: '0.25rem', fontWeight: 600 }}>Hydrate with 2025 Regulatory Data</h4>
                            <p style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)' }}>
                                Pre-load CQC Single Assessment Framework & Home Office 2025 Audit Rules.
                            </p>
                        </div>
                        <button
                            className="btn btn-primary"
                            onClick={async () => {
                                try {
                                    const { safQualityStatements, homeOffice2025Rules } = await import('../lib/complianceData');
                                    const { supabase } = await import('../lib/supabase');

                                    // Simulated Batch Ingestion
                                    const text = `
                                        CQC SINGLE ASSESSMENT FRAMEWORK (SAF) 2025:
                                        ${JSON.stringify(safQualityStatements, null, 2)}

                                        HOME OFFICE SPONSOR GUIDANCE 2025:
                                        ${JSON.stringify(homeOffice2025Rules, null, 2)}
                                    `;

                                    await supabase.functions.invoke('source-layer', {
                                        body: { action: 'ingest-text', payload: { text, metadata: { source: 'System Hydration 2025', type: 'official_guidance' } } }
                                    });
                                    alert('Knowledge Base Successfully Hydrated with 2025 Rules!');
                                } catch (e) { alert('Hydration Error: ' + e); }
                            }}
                        >
                            <Sparkles size={16} /> Auto-Hydrate
                        </button>
                    </div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>

                    {/* URL Ingestion */}
                    <div style={{ padding: '1rem', background: '#f8fafc', borderRadius: 'var(--radius-sm)' }}>
                        <h4 style={{ fontSize: '0.9rem', marginBottom: '0.5rem' }}>Ingest GOV.UK / CQC URL</h4>
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                            <input
                                type="text"
                                id="ingest-url"
                                placeholder="https://www.gov.uk/..."
                                style={{ flex: 1, padding: '0.5rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-border)' }}
                            />
                            <button
                                className="btn btn-secondary"
                                onClick={async () => {
                                    const url = (document.getElementById('ingest-url') as HTMLInputElement).value;
                                    if (!url) return;
                                    try {
                                        const { sourceLayerApi } = await import('../services/sourceLayer');
                                        await sourceLayerApi.ingestGovDoc(url);
                                        alert('URL Queued for Ingestion!');
                                    } catch (e) { alert('Error: ' + e); }
                                }}
                            >
                                Fetch
                            </button>
                        </div>
                    </div>

                    {/* Quick Text Drop */}
                    <div style={{ padding: '1rem', background: '#f8fafc', borderRadius: 'var(--radius-sm)' }}>
                        <h4 style={{ fontSize: '0.9rem', marginBottom: '0.5rem' }}>Paste Policy Text</h4>
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                            <input
                                type="text"
                                id="ingest-text"
                                placeholder="Paste text content..."
                                style={{ flex: 1, padding: '0.5rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-border)' }}
                            />
                            <button
                                className="btn btn-secondary"
                                onClick={async () => {
                                    const text = (document.getElementById('ingest-text') as HTMLInputElement).value;
                                    if (!text) return;
                                    try {
                                        // Manually call the generic ingest-text endpoint (we'll add this to service wrapper next)
                                        const { supabase } = await import('../lib/supabase');
                                        await supabase.functions.invoke('source-layer', {
                                            body: { action: 'ingest-text', payload: { text, metadata: { source: 'User Upload' } } }
                                        });
                                        alert('Text Embedded & Stored!');
                                    } catch (e) { alert('Error: ' + e); }
                                }}
                            >
                                Upload
                            </button>
                        </div>
                    </div>

                </div>
            </div>

            {/* RAG Query Interface (Previous Content) */}
            <div className="card" style={{ marginBottom: '3rem', borderTop: '4px solid var(--color-primary)' }}>
                {/* ... (Keep existing RAG UI) ... */}
                <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
                    <Sparkles size={20} color="var(--color-primary)" /> Ask the Knowledge Engine
                </h3>
                <div style={{ display: 'flex', gap: '1rem', flexDirection: 'column' }}>
                    <textarea
                        id="rag-query"
                        placeholder="e.g., What are the 'I statements' for Safe Care under the new SAF?"
                        style={{
                            width: '100%',
                            padding: '1rem',
                            borderRadius: 'var(--radius-md)',
                            border: '1px solid var(--color-border)',
                            minHeight: '100px'
                        }}
                    />
                    <button
                        className="btn btn-primary"
                        onClick={async () => {
                            const query = (document.getElementById('rag-query') as HTMLTextAreaElement).value;
                            const outputDiv = document.getElementById('rag-output');
                            if (outputDiv) outputDiv.innerText = 'Thinking... (Querying Vector DB & Gemini)';

                            try {
                                const { sourceLayerApi } = await import('../services/sourceLayer');
                                const result = await sourceLayerApi.queryKnowledgeBase(query);
                                if (outputDiv) {
                                    outputDiv.innerHTML = `<strong>Answer:</strong> ${result.response} <br/><br/> <small>Sources: ${JSON.stringify(result.citations)}</small>`;
                                }
                            } catch (e) {
                                if (outputDiv) outputDiv.innerText = 'Error: ' + e;
                            }
                        }}
                    >
                        Analyze & Search
                    </button>
                    <div id="rag-output" style={{ padding: '1rem', background: '#f8fafc', borderRadius: 'var(--radius-sm)', minHeight: '60px', whiteSpace: 'pre-wrap' }}>
                        Results will appear here...
                    </div>
                </div>
            </div>

            {/* SAF DATA VISUALIZER (NEW) */}
            <div id="saf-explorer" className="card" style={{ marginBottom: '2rem' }}>
                <h2 style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>
                    <Scale size={24} color="var(--color-accent)" />
                    SAF Explorer (2025 Framework)
                </h2>
                <p style={{ color: 'var(--color-text-secondary)', marginBottom: '1.5rem' }}>
                    Explore the 34 Quality Statements that replace the old KLOEs.
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Render a few key SAF items from the static file for immediate view */}
                    {[
                        { title: "Safe: Learning Culture", we: "We have a proactive and positive culture of safety...", i: "I feel safe and am supported to understand risks." },
                        { title: "Effective: Assessing Needs", we: "We maximise effectiveness by assessing needs...", i: "I have care that meets my needs." },
                        { title: "Well-led: Workforce EDI", we: "We value diversity... improving equality...", i: "I am treated with dignity and respect." }
                    ].map((item, i) => (
                        <div key={i} style={{ padding: '1rem', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', background: '#fff' }}>
                            <h4 style={{ color: 'var(--color-primary)', marginBottom: '0.5rem' }}>{item.title}</h4>
                            <div style={{ fontSize: '0.85rem', marginBottom: '0.5rem' }}>
                                <strong style={{ color: '#0f172a' }}>WE Statement:</strong> <span style={{ color: '#475569' }}>{item.we}</span>
                            </div>
                            <div style={{ fontSize: '0.85rem', padding: '0.5rem', background: '#f0fdf4', borderRadius: '4px', borderLeft: '3px solid #16a34a' }}>
                                <strong style={{ color: '#166534' }}>I Statement:</strong> <span style={{ color: '#15803d' }}>"{item.i}"</span>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Home Office Checklist (NEW) */}
            <div id="home-office-checklist" className="card" style={{ marginBottom: '3rem' }}>
                <h2 style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>
                    <ShieldAlert size={24} color="var(--color-danger)" />
                    Home Office Sponsor Licence Checklist (2025 Audit Ready)
                </h2>
                <p style={{ color: 'var(--color-text-secondary)', marginBottom: '1.5rem' }}>
                    Ensure your organisation is audit-ready for Home Office compliance.
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {[
                        { title: "Right to Work Checks", description: "Are all employees' right to work documents verified and recorded before employment starts? (e.g., Share Codes, Biometric Residence Permits)" },
                        { title: "Record Keeping", description: "Are all sponsor duties records (CoS, payslips, contact details, absences) maintained for the required period and accessible?" },
                        { title: "Reporting Duties", description: "Are changes in sponsored workers' circumstances (e.g., change of role, salary, address, unexplained absences) reported to UKVI within 10 working days?" },
                        { title: "Job Description & Skill Level", description: "Do all sponsored roles meet the appropriate RQF level and salary thresholds as per current immigration rules?" }
                    ].map((item, i) => (
                        <div key={i} style={{ padding: '1rem', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', background: '#fff' }}>
                            <h4 style={{ color: 'var(--color-danger)', marginBottom: '0.5rem' }}>{item.title}</h4>
                            <p style={{ fontSize: '0.85rem', color: '#475569' }}>{item.description}</p>
                        </div>
                    ))}
                </div>
            </div>

            {/* HORIZON SCANNING 2026 (NEW) */}
            <div className="card" style={{ marginBottom: '3rem', borderTop: '4px solid #8b5cf6' }}>
                <h2 style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>
                    <GraduationCap size={24} color="#8b5cf6" />
                    Horizon Scanning: Vision 2026
                </h2>
                <div style={{ padding: '1rem', background: '#f5f3ff', borderRadius: 'var(--radius-md)', marginBottom: '1.5rem', border: '1px solid #ddd6fe' }}>
                    <p style={{ fontSize: '0.9rem', color: '#5b21b6' }}>
                        <strong>Strategic Insight:</strong> The sector is moving towards "Smarter Regulation" (CQC) and "Contactless Borders" (Home Office).
                        Prepare for a fully digital ecosystem by late 2026.
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-4">
                    {[
                        {
                            domain: "CQC Strategy",
                            title: "Assessment Framework V2",
                            date: "Summer 2026",
                            desc: "Shift to dynamic, data-driven regulation. 9,000 assessments targeted.",
                            tag: "Strategy"
                        },
                        {
                            domain: "Immigration",
                            title: "End of Physical Visas",
                            date: "Late 2026",
                            desc: "Full transition to eVisas. BRP cards will cease to exist/be valid proof.",
                            tag: "Critical"
                        },
                        {
                            domain: "Immigration",
                            title: "Mandatory ETA",
                            date: "Feb 2026",
                            desc: "Visitors from EU/US will need Electronic Travel Auth to enter UK.",
                            tag: "Operations"
                        },
                        {
                            domain: "Legal",
                            title: "LPS Consultation",
                            date: "Q1 2026",
                            desc: "Replacement for DoLS (Liberty Protection Safeguards) enters final consultation.",
                            tag: "Legal"
                        }
                    ].map((item, i) => (
                        <div key={i} style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', padding: '1.25rem', background: 'white', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', position: 'relative', overflow: 'hidden' }}>
                            <div style={{ position: 'absolute', top: 0, right: 0, padding: '0.25rem 0.75rem', background: '#8b5cf6', color: 'white', fontSize: '0.7rem', fontWeight: 600, borderBottomLeftRadius: '8px' }}>
                                {item.date}
                            </div>
                            <div style={{ fontSize: '0.75rem', fontWeight: 600, color: '#8b5cf6', textTransform: 'uppercase' }}>{item.domain}</div>
                            <h4 style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--color-text-main)' }}>{item.title}</h4>
                            <p style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)' }}>{item.desc}</p>
                            <div style={{ marginTop: 'auto', paddingTop: '0.75rem' }}>
                                <span className="badge" style={{ background: '#ede9fe', color: '#5b21b6' }}>{item.tag}</span>
                            </div>
                        </div>
                    ))}
                </div>
            </div >

            <div style={{ marginTop: '1rem', textAlign: 'center', fontSize: '0.85rem', color: 'var(--color-text-tertiary)' }}>
                + 40 more official sources indexed in Virtual Inspector.
            </div>

            {/* Source Layer API Status (New) */}
            <div className="card" style={{ marginTop: '2rem', borderTop: '4px solid #6366f1' }}>
                <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
                    <Globe size={20} color="#6366f1" /> Source Layer API Status
                </h3>
                <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                    <div style={{ flex: 1, padding: '1rem', background: '#f8fafc', borderRadius: 'var(--radius-sm)' }}>
                        <div style={{ fontSize: '0.75rem', fontWeight: 600, color: '#64748b' }}>CRAWLERS</div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.25rem' }}>
                            <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#22c55e' }}></div>
                            <span style={{ fontWeight: 600, color: '#0f172a' }}>CQC API Link: Active</span>
                        </div>
                    </div>
                    <div style={{ flex: 1, padding: '1rem', background: '#f8fafc', borderRadius: 'var(--radius-sm)' }}>
                        <div style={{ fontSize: '0.75rem', fontWeight: 600, color: '#64748b' }}>KNOWLEDGE ENGINE</div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.25rem' }}>
                            <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#22c55e' }}></div>
                            <span style={{ fontWeight: 600, color: '#0f172a' }}>Vector DB: Ready</span>
                        </div>
                    </div>
                </div>
            </div>

        </div >
    );
};
