import React, { useState, useEffect } from 'react';
import { Send, Plus, Lock, CheckCircle, Brain, Zap, Loader2, ArrowRight, Target, GraduationCap } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { runInspectionChat, shouldUseEdgeFunction } from '../services/aiAnalysis';
import type { ChatMessage } from '../services/aiAnalysis';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import { Link } from 'react-router-dom';

export const InspectionSimulator = () => {
    // Chat state
    const { profile } = useAuth();
    const [messages, setMessages] = useState<{ id: number; sender: 'user' | 'inspector'; text: string }[]>([
        { id: 1, sender: 'inspector', text: "Hello. I'm AI Inspector James. I'll be conducting a short mock interview on CQC Regulation 18 (Staffing). Are you ready to begin?" }
    ]);
    const [input, setInput] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const [saving, setSaving] = useState(false);

    // AI Config
    const [apiKey, setApiKey] = useState('');
    const [isKeySet, setIsKeySet] = useState(false);
    const isEdgeMode = shouldUseEdgeFunction();

    // AI History Tracking (for the API)
    const [history, setHistory] = useState<ChatMessage[]>([]);

    useEffect(() => {
        if (isEdgeMode) {
            setIsKeySet(true);
        } else {
            const envKey = import.meta.env.VITE_GEMINI_API_KEY;
            if (envKey && !envKey.includes('INSERT')) {
                setApiKey(envKey);
                setIsKeySet(true);
            }
        }
    }, [isEdgeMode]);

    const handleSaveSession = async (finalMessages: any[]) => {
        if (!profile?.organization_id) return;
        setSaving(true);
        try {
            await supabase.from('compliance_analyses').insert({
                organization_id: profile.organization_id,
                analysis_type: 'manual', // Representing a mock audit
                overall_score: 85, // Mock score for the simulator
                summary: `Mock CQC Inspection Simulator Session. Focus: Regulation 18. Interaction count: ${finalMessages.length}`,
                results: finalMessages
            });
        } catch (err) {
            console.error('Failed to save inspection session:', err);
        } finally {
            setSaving(false);
        }
    };

    const handleSend = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!input.trim()) return;

        const userMsg = input;
        const newMessages: { id: number; sender: 'user' | 'inspector'; text: string }[] = [...messages, { id: Date.now(), sender: 'user' as const, text: userMsg }];
        setMessages(newMessages);
        setInput('');
        setIsTyping(true);

        try {
            const responseText = await runInspectionChat(history, userMsg, isEdgeMode ? undefined : apiKey);

            const updatedMessages: { id: number; sender: 'user' | 'inspector'; text: string }[] = [...newMessages, {
                id: Date.now() + 1,
                sender: 'inspector' as const,
                text: responseText
            }];

            setMessages(updatedMessages);
            setHistory(prev => [
                ...prev,
                { role: 'user', parts: userMsg },
                { role: 'model', parts: responseText }
            ]);

            // Auto-save every 4 interactions (simulating "session progress")
            if (updatedMessages.length % 4 === 0) {
                await handleSaveSession(updatedMessages);
            }
        } catch (error) {
            console.error(error);
            setMessages(prev => [...prev, {
                id: Date.now() + 1,
                sender: 'inspector',
                text: "Connection error. The inspection is paused."
            }]);
        } finally {
            setIsTyping(false);
        }
    };

    return (
        <div className="container animate-enter" style={{ padding: '2rem 1rem', maxWidth: '800px' }}>

            <div style={{ marginBottom: '2rem', textAlign: 'center' }}>
                <h1 style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.75rem' }}>
                    🕵️‍♂️ Quick Chat Simulator
                </h1>
                <p style={{ color: 'var(--color-text-secondary)', marginTop: '0.5rem' }}>
                    Practice for your real interview. The AI Inspector will test your knowledge.
                </p>
            </div>

            {/* Promo Banner for Full Mock Inspection */}
            <div className="card" style={{
                marginBottom: '1.5rem',
                padding: '1.25rem',
                background: 'linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%)',
                border: '1px solid #7dd3fc'
            }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
                    <div>
                        <h3 style={{ margin: '0 0 0.25rem', fontSize: '1rem', color: '#0369a1' }}>
                            🎯 Looking for a comprehensive inspection experience?
                        </h3>
                        <p style={{ margin: 0, fontSize: '0.85rem', color: '#0c4a6e' }}>
                            Try our full Mock Inspection Centre with scenario selection, detailed scoring, and performance reports.
                        </p>
                    </div>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <Link to="/cqc/mock-inspection" className="btn btn-primary" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}>
                            <Target size={16} />
                            Mock Inspection
                            <ArrowRight size={14} />
                        </Link>
                        <Link to="/cqc/interview-training" className="btn btn-secondary" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}>
                            <GraduationCap size={16} />
                            Training
                        </Link>
                    </div>
                </div>
            </div>

            {/* API Key Gate / Edge Badge */}
            <div className="card" style={{ marginBottom: '1rem', padding: '1rem', background: '#f8fafc', border: '1px solid var(--color-border)' }}>
                {isEdgeMode ? (
                    <div style={{ background: '#f0fdf4', padding: '0.75rem', borderRadius: 'var(--radius-md)', border: '1px solid #bbf7d0', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <div style={{ width: 20, height: 20, background: '#22c55e', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <CheckCircle size={14} color="white" />
                        </div>
                        <div style={{ flex: 1 }}>
                            <div style={{ fontSize: '0.9rem', fontWeight: 600, color: '#166534' }}>Secure Enterprise Mode Active</div>
                            <div style={{ fontSize: '0.75rem', color: '#15803d' }}>Private Edge-Based Inspection Instance</div>
                        </div>
                        <Brain size={24} color="#22c55e" style={{ opacity: 0.5 }} />
                    </div>
                ) : !isKeySet ? (
                    <div className="flex flex-col gap-3">
                        <div className="flex items-center gap-2">
                            <Lock size={16} color="var(--color-text-secondary)" />
                            <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>Provide Key to Start Simulation</span>
                        </div>
                        <div className="flex gap-2">
                            <input
                                type="password"
                                className="form-input"
                                placeholder="Enter Google Gemini API Key"
                                value={apiKey}
                                onChange={(e) => setApiKey(e.target.value)}
                                style={{ padding: '0.5rem' }}
                            />
                            <button
                                className="btn btn-primary"
                                onClick={() => setIsKeySet(true)}
                                disabled={!apiKey}
                            >
                                Activate
                            </button>
                        </div>
                    </div>
                ) : (
                    <div style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <Zap size={14} color="var(--color-warning)" /> Client-Side AI Engine Connected
                        <button className="btn btn-secondary" onClick={() => setIsKeySet(false)} style={{ fontSize: '0.7rem', padding: '0.2rem 0.5rem', height: 'auto', marginLeft: 'auto' }}>Change Key</button>
                    </div>
                )}
            </div>

            <div className="card" style={{ height: '600px', display: 'flex', flexDirection: 'column', padding: 0, overflow: 'hidden' }}>

                {/* Chat Area */}
                <div style={{ flex: 1, padding: '1.5rem', overflowY: 'auto', background: 'var(--color-bg-page)' }}>
                    {messages.map(msg => (
                        <div key={msg.id} style={{
                            display: 'flex',
                            justifyContent: msg.sender === 'user' ? 'flex-end' : 'flex-start',
                            marginBottom: '1rem'
                        }}>
                            <div style={{
                                maxWidth: '80%',
                                padding: '1rem',
                                borderRadius: '1rem',
                                borderBottomLeftRadius: msg.sender === 'inspector' ? '0' : '1rem',
                                borderBottomRightRadius: msg.sender === 'user' ? '0' : '1rem',
                                background: msg.sender === 'user' ? 'var(--color-primary)' : 'white',
                                color: msg.sender === 'user' ? 'white' : 'var(--color-text-main)',
                                boxShadow: msg.sender === 'inspector' ? 'var(--shadow-sm)' : 'none',
                                border: msg.sender === 'inspector' ? '1px solid var(--color-border)' : 'none'
                            }}>
                                {msg.sender === 'inspector' && (
                                    <div style={{ fontSize: '0.75rem', fontWeight: 700, marginBottom: '0.25rem', color: 'var(--color-accent)' }}>CQC INSPECTOR (AI)</div>
                                )}
                                <div className="prose prose-sm" style={{ color: 'inherit' }}>
                                    <ReactMarkdown>{msg.text}</ReactMarkdown>
                                </div>
                            </div>
                        </div>
                    ))}

                    {isTyping && (
                        <div className="flex items-center gap-2" style={{ padding: '0.5rem 1rem', fontSize: '0.875rem', color: 'var(--color-text-tertiary)' }}>
                            <Loader2 size={14} className="animate-spin" /> Inspector James is evaluating...
                        </div>
                    )}
                </div>

                {/* Input Area */}
                <div style={{ padding: '1rem', background: 'white', borderTop: '1px solid var(--color-border)' }}>
                    <form onSubmit={handleSend} className="flex gap-2">
                        <input
                            type="text"
                            className="form-input"
                            placeholder={isKeySet ? "Respond to the inspector..." : "Enable AI to start simulation..."}
                            value={input}
                            onChange={e => setInput(e.target.value)}
                            disabled={isTyping || !isKeySet}
                        />
                        <button type="submit" className="btn btn-primary" disabled={!input || isTyping || !isKeySet}>
                            <Send size={18} />
                        </button>
                    </form>
                    <div style={{ textAlign: 'center', marginTop: '0.5rem', fontSize: '0.75rem', color: 'var(--color-text-tertiary)' }}>
                        This is a simulation. Official inspections may vary in depth and complexity.
                    </div>
                </div>
            </div>

        </div>
    );
};
