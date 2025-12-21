import React, { useState, useEffect } from 'react';
import { Send, Plus, Lock } from 'lucide-react';
import { runInspectionChat } from '../services/aiAnalysis';
import type { ChatMessage } from '../services/aiAnalysis';

export const InspectionSimulator = () => {
    // Chat state
    const [messages, setMessages] = useState<{ id: number; sender: 'user' | 'inspector'; text: string }[]>([
        { id: 1, sender: 'inspector', text: 'Hello. I’m AI Inspector James. I’ll be conducting a short mock interview on CQC Regulation 18 (Staffing). Are you ready to begin?' }
    ]);
    const [input, setInput] = useState('');
    const [isTyping, setIsTyping] = useState(false);

    // AI Config
    const [apiKey, setApiKey] = useState('');
    const [isKeySet, setIsKeySet] = useState(false);

    // AI History Tracking (for the API)
    const [history, setHistory] = useState<ChatMessage[]>([]);

    useEffect(() => {
        const envKey = import.meta.env.VITE_GEMINI_API_KEY;
        if (envKey) {
            setApiKey(envKey);
            setIsKeySet(true);
        }
    }, []);

    const handleSend = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!input.trim()) return;

        // 1. Add User Message to UI
        const userMsg = input;
        setMessages(prev => [...prev, { id: Date.now(), sender: 'user', text: userMsg }]);
        setInput('');
        setIsTyping(true);

        try {
            if (isKeySet && apiKey) {
                // 2. Call Real AI
                const responseText = await runInspectionChat(history, userMsg, apiKey);

                // 3. Update History & UI
                setHistory(prev => [
                    ...prev,
                    { role: 'user', parts: userMsg },
                    { role: 'model', parts: responseText }
                ]);

                setMessages(prev => [...prev, {
                    id: Date.now() + 1,
                    sender: 'inspector',
                    text: responseText
                }]);
            } else {
                // Fallback Mock Response (if skipped key)
                setTimeout(() => {
                    setMessages(prev => [...prev, {
                        id: Date.now() + 1,
                        sender: 'inspector',
                        text: "I can't analyze your answer deeply without an API Key. Please provide one to enable the full simulation."
                    }]);
                }, 1000);
            }
        } catch (error) {
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
                    🕵️‍♂️ Mock CQC Inspection
                </h1>
                <p style={{ color: 'var(--color-text-secondary)' }}>
                    Practice for your real interview. The AI Inspector will test your knowledge.
                </p>
            </div>

            {/* API Key Gate */}
            {!isKeySet && (
                <div className="card" style={{ marginBottom: '1rem', padding: '1rem', background: '#f8fafc', border: '1px dashed var(--color-border)' }}>
                    <div className="flex items-center gap-2 mb-2">
                        <Lock size={16} color="var(--color-text-secondary)" />
                        <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>Enable Intelligent Inspector</span>
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
                            className="btn btn-secondary"
                            onClick={() => setIsKeySet(true)}
                            disabled={!apiKey}
                        >
                            Start
                        </button>
                    </div>
                </div>
            )}

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
                                {msg.text}
                            </div>
                        </div>
                    ))}

                    {isTyping && (
                        <div style={{ padding: '0.5rem 1rem', fontSize: '0.875rem', color: 'var(--color-text-tertiary)', fontStyle: 'italic' }}>
                            Inspector is writing...
                        </div>
                    )}
                </div>

                {/* Input Area */}
                <div style={{ padding: '1rem', background: 'white', borderTop: '1px solid var(--color-border)' }}>
                    <form onSubmit={handleSend} className="flex gap-2">
                        <button type="button" className="btn btn-secondary" style={{ padding: '0.5rem' }}>
                            <Plus size={20} />
                        </button>
                        <input
                            type="text"
                            className="form-input"
                            placeholder={isKeySet ? "Type your answer..." : "Enter API Key above to start..."}
                            value={input}
                            onChange={e => setInput(e.target.value)}
                            disabled={isTyping}
                        />
                        <button type="submit" className="btn btn-primary" disabled={!input || isTyping}>
                            <Send size={18} />
                        </button>
                    </form>
                    <div style={{ textAlign: 'center', marginTop: '0.5rem', fontSize: '0.75rem', color: 'var(--color-text-tertiary)' }}>
                        AI can make mistakes. Check against official CQC guidance.
                    </div>
                </div>
            </div>

        </div>
    );
};
