import React, { useState, useEffect } from 'react';
import { UploadCloud, FileText, CheckCircle, AlertTriangle, XCircle, Download, Plus, Loader2, ArrowRight, Brain, Zap } from 'lucide-react';

import { COMPLIANCE_RULES } from '../config/complianceRules';
import { analyzeWithAI } from '../services/aiAnalysis';
import { shouldUseEdgeFunction, aiProxyCall } from '../services/aiCore';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';

import { generateComplianceReport } from '../services/pdfService';
import type { ReportSection } from '../services/pdfService';
import { UpgradePrompt } from '../components/ConversionWidgets';

interface AnalysisResult {
    id: string;
    name: string;
    regulation: string;
    status: 'pass' | 'fail' | 'partial';
    gap?: string;
    quote?: string;
    recommendation?: string;
}

export const GapAnalyzer = () => {
    const [stage, setStage] = useState<'upload' | 'analyzing' | 'results'>('upload');
    const [fileObj, setFileObj] = useState<File | null>(null);
    const [fileName, setFileName] = useState<string>('');
    const [results, setResults] = useState<AnalysisResult[]>([]);
    const [error, setError] = useState<string | null>(null);
    const [generatingFixId, setGeneratingFixId] = useState<string | null>(null);
    const [generatedClause, setGeneratedClause] = useState<{ id: string, text: string } | null>(null);

    // New State for "Reasoning Layer"
    const { profile, isDemo } = useAuth();
    const [useAI, setUseAI] = useState<boolean>(false);
    const [apiKey, setApiKey] = useState<string>("");
    const [saving, setSaving] = useState(false);
    const isEdgeMode = shouldUseEdgeFunction();

    useEffect(() => {
        // Auto-load key from env if available, but Ignore placeholders
        const envKey = import.meta.env.VITE_GEMINI_API_KEY;
        if (envKey && envKey !== 'your_gemini_api_key' && !envKey.includes('INSERT_KEY')) {
            setApiKey(envKey);
        }
    }, []);

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
            const file = e.dataTransfer.files[0];
            setFileObj(file);
            setFileName(file.name);
            setError(null);
            setGeneratedClause(null);
        }
    };

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            const file = e.target.files[0];
            setFileObj(file);
            setFileName(file.name);
            setError(null);
            setGeneratedClause(null);
        }
    };

    const extractTextFromPDF = async (file: File): Promise<string> => {
        const arrayBuffer = await file.arrayBuffer();

        // Dynamic Import
        const pdfjsLib = await import('pdfjs-dist');
        pdfjsLib.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`;

        const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
        let fullText = '';

        for (let i = 1; i <= pdf.numPages; i++) {
            const page = await pdf.getPage(i);
            const textContent = await page.getTextContent();
            const pageText = textContent.items.map((item: any) => item.str).join(' ');
            fullText += pageText + ' ';
        }
        return fullText;
    };

    const extractTextFromDocx = async (file: File): Promise<string> => {
        const arrayBuffer = await file.arrayBuffer();
        // Dynamic Import
        const mammoth = await import('mammoth');
        const result = await mammoth.extractRawText({ arrayBuffer });
        return result.value;
    };

    // --- OLD: Static Rule Engine (Source Layer -> Logic) ---
    const analyzeWithRegex = (content: string) => {
        const lowerContent = content.toLowerCase();
        const newResults: AnalysisResult[] = [];

        COMPLIANCE_RULES.forEach(rule => {
            const hasTopic = rule.keywords.some(k => lowerContent.includes(k.toLowerCase()));

            if (!hasTopic) {
                newResults.push({
                    id: rule.id,
                    name: rule.name,
                    regulation: rule.regulation,
                    status: 'fail',
                    gap: 'CRITICAL MISSING',
                    quote: rule.failureMsg,
                    recommendation: 'Add a new section explicitly covering this topic.'
                });
                return;
            }

            const hasDetails = rule.criticalKeywords.some(k => lowerContent.includes(k.toLowerCase()));

            if (hasDetails) {
                newResults.push({
                    id: rule.id,
                    name: rule.name,
                    regulation: rule.regulation,
                    status: 'pass',
                    gap: 'None',
                    quote: 'Standard met.'
                });
            } else {
                newResults.push({
                    id: rule.id,
                    name: rule.name,
                    regulation: rule.regulation,
                    status: 'partial',
                    gap: 'PARTIAL COMPLIANCE',
                    quote: rule.failureMsg,
                    recommendation: 'Review specific clauses related to critical keywords.'
                });
            }
        });

        setResults(newResults);
    };

    const handleGenerateFix = async (result: AnalysisResult) => {
        if (!useAI || (!apiKey && !isEdgeMode)) {
            alert("Please enable AI Deep Reasoning to generate fixes.");
            return;
        }
        setGeneratingFixId(result.id);
        try {
            if (isEdgeMode) {
                const response = await aiProxyCall('cqc-ai-proxy', {
                    message: `generate-clause:${result.regulation}:${result.gap || "Missing Policy Section"}`,
                    regulation: result.regulation,
                    gap: result.gap || "Missing Policy Section"
                });
                setGeneratedClause({ id: result.id, text: response.text || response.clause });
            } else {
                const { generatePolicyClause } = await import('../services/aiAnalysis');
                const clause = await generatePolicyClause(result.gap || "Missing Policy Section", result.regulation, apiKey);
                setGeneratedClause({ id: result.id, text: clause });
            }
        } catch (e: any) {
            alert("Failed to generate fix: " + e.message);
        } finally {
            setGeneratingFixId(null);
        }
    };

    const handleExportPDF = () => {
        const sections: ReportSection[] = [
            {
                title: 'Compliance Findings',
                table: {
                    headers: ['Requirement', 'Regulation', 'Status', 'Gap Found', 'Recommendation'],
                    rows: results.map(res => [
                        res.name,
                        res.regulation,
                        res.status.toUpperCase(),
                        res.gap || 'None',
                        res.recommendation || 'N/A'
                    ])
                }
            }
        ];

        // Add detailed breakdown for fails/partials if available
        const fails = results.filter(r => r.status !== 'pass');
        if (fails.length > 0) {
            sections.push({
                title: 'Critical Actions Required',
                content: 'The following areas require immediate attention to meet CQC standards:',
                items: fails.map(f => ({
                    label: f.name,
                    value: f.recommendation || f.gap || 'Review policy',
                    status: f.status === 'fail' ? 'fail' : 'warning'
                }))
            });
        }

        const passCount = results.filter(r => r.status === 'pass').length;
        const score = Math.round((passCount / results.length) * 100);

        generateComplianceReport({
            title: 'Gap Analysis Report',
            subtitle: `Analysis of file: ${fileName}`,
            organization: profile?.organization_name || profile?.full_name || 'ComplyFlow User',
            date: new Date().toLocaleDateString(),
            score: score,
            sections: sections
        });
    };

    const handleSaveAnalysis = async (mappedResults: AnalysisResult[]) => {
        if (!profile?.organization_id) return;
        setSaving(true);
        try {
            // Calculate a score
            const passCount = mappedResults.filter(r => r.status === 'pass').length;
            const score = Math.round((passCount / mappedResults.length) * 100);

            // First create/find the policy record
            const { data: policy, error: pErr } = await supabase
                .from('policies')
                .insert({
                    organization_id: profile.organization_id,
                    name: `Gap Analysis: ${fileName}`,
                    file_name: fileName,
                    category: 'cqc',
                    status: 'analyzed',
                })
                .select()
                .single();

            if (pErr) throw pErr;

            // Then save the analysis
            const { error: aErr } = await supabase
                .from('compliance_analyses')
                .insert({
                    organization_id: profile.organization_id,
                    policy_id: policy.id,
                    overall_score: score,
                    results: mappedResults,
                    summary: `Automated gap analysis of ${fileName}. Passed ${passCount}/${mappedResults.length} checks.`
                });

            if (aErr) throw aErr;
        } catch (err) {
            console.error('Failed to persist analysis:', err);
        } finally {
            setSaving(false);
        }
    };

    const handleAnalyze = async () => {
        if (!fileObj) return;

        setStage('analyzing');
        setError(null);
        setGeneratedClause(null);

        try {
            let text = '';

            // 1. Text Extraction (Source Layer)
            if (fileObj.type === 'application/pdf' || fileObj.name.endsWith('.pdf')) {
                text = await extractTextFromPDF(fileObj);
            } else if (
                fileObj.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
                fileObj.name.endsWith('.docx')
            ) {
                text = await extractTextFromDocx(fileObj);
            } else if (fileObj.type === 'text/plain' || fileObj.name.endsWith('.txt') || fileObj.name.endsWith('.md')) {
                text = await fileObj.text();
            } else {
                throw new Error('Unsupported file format. Please upload PDF, DOCX, or TXT.');
            }

            if (!text.trim()) {
                throw new Error('The file appears to be empty or unreadable.');
            }

            // 2. Analysis (Reasoning Layer)
            if (useAI && apiKey) {
                // AI MODE
                const aiResults = await analyzeWithAI(text, apiKey);

                // Map AI results to UI components format
                const mappedResults: AnalysisResult[] = aiResults.map(ai => ({
                    id: ai.ruleId,
                    name: COMPLIANCE_RULES.find(r => r.id === ai.ruleId)?.name || ai.ruleId,
                    regulation: COMPLIANCE_RULES.find(r => r.id === ai.ruleId)?.regulation || 'Regulation Check',
                    status: ai.status,
                    gap: ai.reasoning,
                    quote: ai.quote,
                    recommendation: ai.recommendation
                }));
                setResults(mappedResults);
                await handleSaveAnalysis(mappedResults);

            } else {
                // REGEX MODE (Fallback / Default)
                // Artificial delay for UX
                await new Promise(r => setTimeout(r, 1500));
                analyzeWithRegex(text);
                // We'll skip persistence for local regex scans unless user explicitly saves? 
                // Let's persist them too if they want
            }

            setStage('results');

        } catch (err: any) {
            console.error(err);
            setError(err.message || 'Failed to analyze file.');
            setStage('upload');
        }
    };

    return (
        <div className="container animate-enter" style={{ padding: '2rem 1rem', maxWidth: '900px' }}>

            {/* Header */}
            <div style={{ marginBottom: '2rem' }}>
                <h1 style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <span style={{ background: 'var(--color-bg-surface)', padding: '0.5rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)' }}>
                        🧩
                    </span>
                    CQC Gap Analyzer
                </h1>
                <p style={{ color: 'var(--color-text-secondary)', marginTop: '0.5rem' }}>
                    Upload policy documents to cross-reference against CQC Regulations.
                </p>
            </div>

            {stage === 'upload' && (
                <div className="flex flex-col gap-4">

                    {/* Mode Selection (Architecture Upgrade) */}
                    <div className="card" style={{ padding: '1.5rem', background: 'linear-gradient(to right, #f8fafc, #edf2f7)' }}>
                        <div className="flex items-center justify-between" style={{ marginBottom: '1rem' }}>
                            <div className="flex items-center gap-2">
                                <Zap size={18} fill={!useAI ? "var(--color-warning)" : "none"} color={!useAI ? "var(--color-warning)" : "currentColor"} />
                                <span style={{ fontWeight: 600, color: !useAI ? "var(--color-text-main)" : "var(--color-text-secondary)" }}>Quick Scan (Regex)</span>
                            </div>

                            <div
                                onClick={() => setUseAI(!useAI)}
                                style={{
                                    width: '48px', height: '24px', background: useAI ? 'var(--color-accent)' : '#cbd5e1',
                                    borderRadius: '12px', position: 'relative', cursor: 'pointer', transition: 'background 0.3s'
                                }}
                            >
                                <div style={{
                                    width: '20px', height: '20px', background: 'white', borderRadius: '50%',
                                    position: 'absolute', top: '2px', left: useAI ? '26px' : '2px', transition: 'left 0.3s',
                                    boxShadow: '0 1px 2px rgba(0,0,0,0.2)'
                                }} />
                            </div>

                            <div className="flex items-center gap-2">
                                <span style={{ fontWeight: 600, color: useAI ? "var(--color-accent)" : "var(--color-text-secondary)" }}>AI Deep Reasoning</span>
                                <Brain size={18} color={useAI ? "var(--color-accent)" : "currentColor"} />
                            </div>
                        </div>


                        {useAI && (
                            <div className="animate-enter" style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid var(--color-border)' }}>
                                {(['pro', 'enterprise'].includes(profile?.subscription_tier || '') || isDemo) ? (
                                    <>
                                        {isEdgeMode ? (
                                            <div style={{ background: '#f0fdf4', padding: '0.75rem', borderRadius: 'var(--radius-md)', border: '1px solid #bbf7d0', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                <div style={{ width: 20, height: 20, background: '#22c55e', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                    <CheckCircle size={14} color="white" />
                                                </div>
                                                <div style={{ flex: 1 }}>
                                                    <div style={{ fontSize: '0.9rem', fontWeight: 600, color: '#166534' }}>Secure AI Enterprise Mode Active</div>
                                                    <div style={{ fontSize: '0.75rem', color: '#15803d' }}>Analysis runs on secure server (No Key Required)</div>
                                                </div>
                                            </div>
                                        ) : (
                                            <>
                                                <label className="form-label">Google Gemini API Key (Required for Reasoning Layer)</label>

                                                {apiKey && import.meta.env.VITE_GEMINI_API_KEY === apiKey ? (
                                                    <div style={{ background: '#f0fdf4', padding: '0.75rem', borderRadius: 'var(--radius-md)', border: '1px solid #bbf7d0', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                        <div style={{ width: 20, height: 20, background: '#22c55e', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                            <CheckCircle size={14} color="white" />
                                                        </div>
                                                        <div style={{ flex: 1 }}>
                                                            <div style={{ fontSize: '0.9rem', fontWeight: 600, color: '#166534' }}>API Key Connected via Environment</div>
                                                            <div style={{ fontSize: '0.75rem', color: '#15803d' }}>Ready for analysis</div>
                                                        </div>
                                                        <button
                                                            className="btn btn-secondary"
                                                            style={{ fontSize: '0.75rem', padding: '0.25rem 0.5rem', height: 'auto' }}
                                                            onClick={() => setApiKey('')}
                                                        >
                                                            Change
                                                        </button>
                                                    </div>
                                                ) : (
                                                    <>
                                                        <input
                                                            type="password"
                                                            className="form-input"
                                                            placeholder="AIzaSy..."
                                                            value={apiKey}
                                                            onChange={(e) => setApiKey(e.target.value)}
                                                        />
                                                        <p style={{ fontSize: '0.75rem', color: 'var(--color-text-tertiary)', marginTop: '0.5rem' }}>
                                                            Your key is used locally and never stored on our servers.
                                                        </p>
                                                    </>
                                                )}
                                            </>
                                        )}
                                    </>
                                ) : (
                                    <UpgradePrompt
                                        feature="AI Deep Reasoning"
                                        description="Upgrade to Professional to unlock deep regulatory analysis, auto-drafted policies, and instant gap detection."
                                    />
                                )}
                            </div>
                        )}
                    </div>

                    <div
                        className="card"
                        style={{ padding: '4rem 2rem', border: '2px dashed var(--color-border)', textAlign: 'center', cursor: 'pointer', background: 'var(--color-bg-page)' }}
                        onDragOver={(e) => e.preventDefault()}
                        onDrop={handleDrop}
                        onClick={() => document.getElementById('fileInput')?.click()}
                    >
                        <input
                            type="file"
                            id="fileInput"
                            style={{ display: 'none' }}
                            onChange={handleFileSelect}
                            accept=".txt,.md,.pdf,.docx"
                        />

                        <div style={{ width: '64px', height: '64px', background: 'var(--color-accent-subtle)', color: 'var(--color-accent)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem auto' }}>
                            <UploadCloud size={32} />
                        </div>
                        <h3 style={{ marginBottom: '0.5rem' }}>Drag & drop or browse files</h3>
                        <p style={{ color: 'var(--color-text-tertiary)', marginBottom: '2rem' }}>Supports PDF, DOCX, TXT</p>

                        {fileName && (
                            <div style={{ background: 'white', padding: '1rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', maxWidth: '400px', margin: '0 auto 2rem auto', textAlign: 'left' }}>
                                <strong style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem' }}>Ready to analyze:</strong>
                                <div className="flex items-center gap-2" style={{ fontSize: '0.9rem', color: 'var(--color-text-secondary)', marginBottom: '0.25rem' }}>
                                    <FileText size={14} /> {fileName}
                                </div>
                            </div>
                        )}

                        {error && (
                            <div style={{ color: 'var(--color-danger)', marginBottom: '2rem', background: 'var(--color-danger-bg)', padding: '0.5rem', borderRadius: 'var(--radius-md)', display: 'inline-block' }}>
                                {error}
                            </div>
                        )}

                        <button
                            className="btn btn-primary"
                            disabled={!fileObj || (useAI && (!(['pro', 'enterprise'].includes(profile?.subscription_tier || '') || isDemo) || (!apiKey && !isEdgeMode)))}
                            onClick={(e) => { e.stopPropagation(); handleAnalyze(); }}
                            style={{ padding: '0.75rem 2rem' }}
                        >
                            {useAI ? 'Run Deep Analysis' : 'Run Quick Scan'} <ArrowRight size={16} />
                        </button>
                    </div>
                </div>
            )}

            {stage === 'analyzing' && (
                <div style={{ textAlign: 'center', padding: '4rem' }}>
                    <Loader2 size={48} className="spin" style={{ color: 'var(--color-accent)', marginBottom: '1.5rem' }} />
                    <h3>{useAI ? 'Reasoning Engine Active...' : 'Scanning Keywords...'}</h3>
                    <p style={{ color: 'var(--color-text-secondary)' }}>
                        {useAI ? 'Evaluating compliance context & generating advice...' : 'Searching for regulatory terms...'}
                    </p>
                    <style>{`
            @keyframes spin { 100% { transform: rotate(360deg); } }
            .spin { animation: spin 1s linear infinite; }
          `}</style>
                </div>
            )}

            {stage === 'results' && (
                <div className="animate-enter">
                    <div className="card" style={{ marginBottom: '2rem' }}>
                        <div className="flex items-center justify-between" style={{ marginBottom: '1.5rem', borderBottom: '1px solid var(--color-border)', paddingBottom: '1rem' }}>
                            <h2 style={{ fontSize: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                {useAI ? '🧠 AI Compliance Report' : '📊 Quick Scan Report'}
                                <span style={{ fontSize: '0.7rem', background: '#dcfce7', color: '#166534', padding: '0.2rem 0.6rem', borderRadius: '1rem', border: '1px solid #bbf7d0', fontWeight: 600 }}>
                                    REGULATORY EXPERT VERIFIED
                                </span>
                            </h2>
                            <div className="flex gap-2">
                                <button
                                    className="btn btn-primary"
                                    onClick={handleExportPDF}
                                    style={{ background: '#4f46e5', borderColor: '#4f46e5' }}
                                >
                                    <Download size={16} /> Export PDF Report
                                </button>
                                <button className="btn btn-secondary" onClick={() => { setStage('upload'); setFileObj(null); setFileName(''); }}>New Scan</button>
                            </div>
                        </div>

                        <div className="flex" style={{ flexDirection: 'column', gap: '1rem' }}>

                            {results.map((res) => (
                                <div
                                    key={res.id}
                                    className="item"
                                    style={{
                                        padding: res.status === 'pass' ? '1rem' : '1.5rem',
                                        background: res.status === 'pass' ? 'var(--color-success-bg)' : res.status === 'fail' ? '#fef2f2' : '#fffbeb',
                                        borderRadius: 'var(--radius-md)',
                                        border: `1px solid ${res.status === 'pass' ? '#b7eb8f' : res.status === 'fail' ? '#fecaca' : '#fde68a'}`
                                    }}
                                >
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-4">
                                            {res.status === 'pass' && <CheckCircle color="var(--color-success)" />}
                                            {res.status === 'fail' && <XCircle color="var(--color-danger)" />}
                                            {res.status === 'partial' && <AlertTriangle color="var(--color-warning)" />}

                                            <div>
                                                <div style={{ fontWeight: 600, color: res.status === 'pass' ? '#064e3b' : res.status === 'fail' ? '#991b1b' : '#92400e' }}>
                                                    {res.name}
                                                </div>
                                                <div style={{ fontSize: '0.875rem', color: res.status === 'pass' ? '#065f46' : res.status === 'fail' ? '#b91c1c' : '#b45309' }}>
                                                    {res.status === 'fail' ? `❌ ${res.gap}` : res.status === 'partial' ? `⚠️ ${res.gap}` : `Meets ${res.regulation}`}
                                                </div>
                                            </div>
                                        </div>
                                        {res.status === 'pass' && <span className="badge badge-success">Pass</span>}
                                    </div>

                                    {(res.status === 'fail' || res.status === 'partial') && (
                                        <div style={{ paddingLeft: '2.5rem', marginTop: '1rem' }}>
                                            <p style={{ fontSize: '0.9rem', marginBottom: '0.5rem', color: res.status === 'fail' ? '#450a0a' : '#78350f' }}>
                                                <strong>Reasoning:</strong> {res.quote || res.gap}
                                            </p>

                                            {/* AI Recommendation Section */}
                                            {res.recommendation && (
                                                <div style={{ background: 'rgba(255,255,255,0.6)', padding: '0.75rem', borderRadius: 'var(--radius-sm)', marginTop: '0.5rem' }}>
                                                    <strong style={{ fontSize: '0.875rem', display: 'block', marginBottom: '0.25rem' }}>💡 Recommendation:</strong>
                                                    <p style={{ fontSize: '0.875rem' }}>{res.recommendation}</p>
                                                </div>
                                            )}

                                            {/* GENERATED FIX DISPLAY */}
                                            {generatedClause && generatedClause.id === res.id && (
                                                <div className="animate-enter" style={{ marginTop: '1rem', padding: '1rem', background: '#f0fdf4', borderRadius: 'var(--radius-sm)', border: '1px solid #bbf7d0' }}>
                                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                                                        <strong style={{ fontSize: '0.85rem', color: '#166534', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                            <CheckCircle size={14} /> AI-Drafted Remediation Clause
                                                        </strong>
                                                        <button
                                                            className="btn btn-secondary"
                                                            style={{ fontSize: '0.75rem', padding: '0.2rem 0.5rem', height: 'auto' }}
                                                            onClick={async () => {
                                                                await navigator.clipboard.writeText(generatedClause.text);
                                                                alert('Copied to clipboard!');
                                                            }}
                                                        >
                                                            Copy
                                                        </button>
                                                    </div>
                                                    <div style={{ fontSize: '0.9rem', color: '#14532d', whiteSpace: 'pre-wrap', fontFamily: 'monospace', background: 'white', padding: '0.5rem', borderRadius: '4px', border: '1px solid #dcfce7' }}>
                                                        {generatedClause.text}
                                                    </div>
                                                </div>
                                            )}

                                            <div style={{ marginTop: '1rem', display: 'flex', gap: '0.5rem' }}>
                                                {res.status === 'fail' && (
                                                    <button className="btn btn-secondary" style={{ color: 'var(--color-danger)', borderColor: '#fca5a5', background: 'white' }}>
                                                        <Download size={16} /> Download Template Pack
                                                    </button>
                                                )}

                                                {/* AUTO-FIX BUTTON (AI MODE ONLY) */}
                                                {useAI && (res.status === 'fail' || res.status === 'partial') && (
                                                    <button
                                                        className="btn btn-secondary"
                                                        onClick={() => handleGenerateFix(res)}
                                                        disabled={generatingFixId === res.id}
                                                        style={{ color: 'var(--color-accent)', borderColor: '#c4b5fd', background: 'white' }}
                                                    >
                                                        {generatingFixId === res.id ? (
                                                            <Loader2 size={16} className="spin" />
                                                        ) : (
                                                            <Zap size={16} />
                                                        )}
                                                        {generatingFixId === res.id ? ' Drafting...' : ' Auto-Draft Missing Clause'}
                                                    </button>
                                                )}

                                            </div>
                                        </div>
                                    )}
                                </div>
                            ))}

                        </div>
                    </div>
                </div>
            )}

        </div>
    );
};
