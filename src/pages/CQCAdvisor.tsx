import React, { useState, useEffect, useRef } from 'react';
import { Send, Sparkles, MessageSquare, Bot, AlertCircle, FileText } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { runAdvisorChatStream } from '../services/aiAnalysis';
import type { ChatMessage } from '../services/aiAnalysis';
import { generateComplianceReport } from '../services/pdfService';

export const CQCAdvisor = () => {
    // Chat state
    const [messages, setMessages] = useState<{ id: number; sender: 'user' | 'advisor'; text: string; isStreaming?: boolean }[]>([
        {
            id: 1,
            sender: 'advisor',
            text: "Hello! I'm your dedicated CQC Advisor. I can help you understand regulations, prepare for inspections, or draft policy clauses. How can I assist you today?"
        }
    ]);
    const [input, setInput] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

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

    // Auto-scroll to bottom of chat
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

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
                // Prepare placeholder for streaming response directly
                const responseId = Date.now() + 1;
                setMessages(prev => [...prev, {
                    id: responseId,
                    sender: 'advisor',
                    text: '', // Start empty
                    isStreaming: true
                }]);

                // 2. Call Streaming AI
                const finalResponse = await runAdvisorChatStream(
                    history,
                    userMsg,
                    (chunkText) => {
                        // Update the last message with the new full text
                        setMessages(prev => prev.map(msg =>
                            msg.id === responseId ? { ...msg, text: chunkText } : msg
                        ));
                    },
                    apiKey
                );

                // 3. Update History & Finalize UI
                setHistory(prev => [
                    ...prev,
                    { role: 'user', parts: userMsg },
                    { role: 'model', parts: finalResponse }
                ]);

                setMessages(prev => prev.map(msg =>
                    msg.id === responseId ? { ...msg, isStreaming: false } : msg
                ));

            } else {
                // Fallback Mock
                setTimeout(() => {
                    setMessages(prev => [...prev, {
                        id: Date.now() + 1,
                        sender: 'advisor',
                        text: "I need a valid API Key to provide accurate CQC advice. Please configure your settings or add the key above."
                    }]);
                    setIsTyping(false);
                }, 1000);
            }
        } catch (error) {
            console.error(error);
            setMessages(prev => [...prev, {
                id: Date.now() + 1,
                sender: 'advisor',
                text: "I'm having trouble connecting to the knowledge base right now. Please try again in a moment."
            }]);
        } finally {
            setIsTyping(false);
        }
    };

    return (
        <div className="container animate-enter" style={{ padding: '2rem 1rem', maxWidth: '1000px', height: 'calc(100vh - 80px)', display: 'flex', flexDirection: 'column' }}>

            <div style={{ marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                    <h1 style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
                        <div style={{ padding: '0.5rem', background: 'var(--color-primary-light)', borderRadius: '8px', color: 'var(--color-primary)' }}>
                            <Bot size={28} />
                        </div>
                        CQC Virtual Advisor
                    </h1>
                    <p style={{ color: 'var(--color-text-secondary)' }}>
                        Expert guidance on CQC regulations, Key Lines of Enquiry (KLOEs), and compliance best practices.
                    </p>
                </div>

                {!isKeySet && (
                    <div style={{ padding: '0.5rem 1rem', background: '#fff1f2', border: '1px solid #fecdd3', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem', color: '#be123c' }}>
                        <AlertCircle size={16} />
                        API Key Missing
                    </div>
                )}

                <button
                    className="btn btn-secondary"
                    style={{ marginLeft: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                    onClick={() => {
                        const reportSections = messages
                            .filter(m => m.text) // Filter out empty streaming messages
                            .map(m => ({
                                title: m.sender === 'user' ? 'Your Question' : 'Advisor Response',
                                content: m.text
                            }));

                        generateComplianceReport({
                            title: 'CQC Consultation Record',
                            subtitle: `Generated on ${new Date().toLocaleDateString()}`,
                            organization: 'ComplyFlow User',
                            date: new Date().toLocaleDateString(),
                            sections: reportSections
                        });
                    }}
                    disabled={messages.length <= 1}
                >
                    <FileText size={16} /> Export Chat
                </button>
            </div>

            <div className="card" style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: 0, overflow: 'hidden', boxShadow: 'var(--shadow-lg)', border: '1px solid var(--color-border)' }}>

                {/* Chat Area */}
                <div style={{ flex: 1, padding: '2rem', overflowY: 'auto', background: '#f8fafc' }}>
                    {messages.map(msg => (
                        <div key={msg.id} style={{
                            display: 'flex',
                            justifyContent: msg.sender === 'user' ? 'flex-end' : 'flex-start',
                            marginBottom: '1.5rem',
                            gap: '1rem'
                        }}>
                            {msg.sender === 'advisor' && (
                                <div style={{
                                    width: 32, height: 32,
                                    borderRadius: '50%',
                                    background: 'white',
                                    border: '1px solid var(--color-border)',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    flexShrink: 0
                                }}>
                                    <Sparkles size={16} color="var(--color-primary)" />
                                </div>
                            )}

                            <div style={{
                                maxWidth: '75%',
                                padding: '1.25rem',
                                borderRadius: '1.25rem',
                                borderTopLeftRadius: msg.sender === 'advisor' ? '0.25rem' : '1.25rem',
                                borderTopRightRadius: msg.sender === 'user' ? '0.25rem' : '1.25rem',
                                background: msg.sender === 'user' ? 'var(--color-primary)' : 'white',
                                color: msg.sender === 'user' ? 'white' : 'var(--color-text-main)',
                                boxShadow: msg.sender === 'advisor' ? '0 2px 4px rgba(0,0,0,0.05)' : '0 2px 4px rgba(var(--color-primary-rgb), 0.2)',
                                border: msg.sender === 'advisor' ? '1px solid var(--color-border)' : 'none',
                                lineHeight: '1.6'
                            }}>
                                {msg.sender === 'advisor' ? (
                                    <div className="markdown-body" style={{ fontSize: '0.95rem' }}>
                                        <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                            {msg.text}
                                        </ReactMarkdown>
                                    </div>
                                ) : (
                                    <div style={{ whiteSpace: 'pre-wrap' }}>{msg.text}</div>
                                )}
                            </div>
                        </div>
                    ))}

                    {isTyping && (
                        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                            <div style={{ width: 32, height: 32, flexShrink: 0 }} />
                            <div style={{ padding: '0.5rem 1rem', background: 'rgba(0,0,0,0.05)', borderRadius: '1rem', fontSize: '0.875rem', color: 'var(--color-text-secondary)' }}>
                                Advisor is researching...
                            </div>
                        </div>
                    )}
                    <div ref={messagesEndRef} />
                </div>

                {/* Input Area */}
                <div style={{ padding: '1.5rem', background: 'white', borderTop: '1px solid var(--color-border)' }}>
                    <form onSubmit={handleSend} style={{ position: 'relative' }}>
                        <div style={{
                            display: 'flex',
                            gap: '0.75rem',
                            padding: '0.5rem',
                            background: 'white',
                            border: '1px solid var(--color-border)',
                            borderRadius: '12px',
                            boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
                            transition: 'border-color 0.2s',
                            alignItems: 'flex-end'
                        }}
                            onFocus={(e) => e.currentTarget.style.borderColor = 'var(--color-primary)'}
                            onBlur={(e) => e.currentTarget.style.borderColor = 'var(--color-border)'}
                            title="Chat Input"
                        >
                            <div style={{ padding: '0.75rem', color: 'var(--color-text-tertiary)' }}>
                                <MessageSquare size={20} />
                            </div>

                            <textarea
                                className="form-input"
                                placeholder={isKeySet ? "Ask any question about CQC regulations, drafting policies, or staff training..." : "Please configure API Key to start"}
                                value={input}
                                onChange={e => {
                                    setInput(e.target.value);
                                    // Auto-grow height (simple version)
                                    e.target.style.height = 'auto';
                                    e.target.style.height = Math.min(e.target.scrollHeight, 150) + 'px';
                                }}
                                onKeyDown={e => {
                                    if (e.key === 'Enter' && !e.shiftKey) {
                                        e.preventDefault();
                                        handleSend(e);
                                    }
                                }}
                                disabled={isTyping}
                                style={{
                                    flex: 1,
                                    border: 'none',
                                    background: 'transparent',
                                    padding: '0.75rem 0',
                                    resize: 'none',
                                    height: 'auto',
                                    minHeight: '24px',
                                    maxHeight: '150px',
                                    outline: 'none',
                                    fontSize: '1rem'
                                }}
                                rows={1}
                            />

                            <button
                                type="submit"
                                className="btn btn-primary"
                                disabled={!input.trim() || isTyping}
                                style={{
                                    borderRadius: '8px',
                                    padding: '0.75rem',
                                    marginBottom: '0.25rem'
                                }}
                            >
                                <Send size={18} />
                            </button>
                        </div>
                        <div style={{ marginTop: '0.75rem', display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--color-text-tertiary)' }}>
                            <span>Press Enter to send, Shift + Enter for new line</span>
                            <span>CareFlow AI Assistant v1.0</span>
                        </div>
                    </form>
                </div>
            </div>
            <style>{`
                .markdown-body ul { list-style-type: disc; padding-left: 1.5rem; margin-bottom: 0.5rem; }
                .markdown-body ol { list-style-type: decimal; padding-left: 1.5rem; margin-bottom: 0.5rem; }
                .markdown-body h1, .markdown-body h2, .markdown-body h3 { font-weight: 700; margin-top: 1rem; margin-bottom: 0.5rem; }
                .markdown-body p { margin-bottom: 0.5rem; }
                .markdown-body strong { font-weight: 700; color: var(--color-primary-dark); }
                .markdown-body a { color: var(--color-primary); text-decoration: underline; }
                .markdown-body blockquote { border-left: 4px solid var(--color-border); padding-left: 1rem; color: var(--color-text-secondary); font-style: italic; }
            `}</style>
        </div>
    );
};
