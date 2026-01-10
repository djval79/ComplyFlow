import React, { useState } from 'react';
import { MessageCircle, X, Send, HelpCircle, FileText, Phone, Mail, ChevronRight, Loader2 } from 'lucide-react';

interface SupportWidgetProps {
    position?: 'bottom-right' | 'bottom-left';
}

export const SupportWidget: React.FC<SupportWidgetProps> = ({ position = 'bottom-right' }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [activeTab, setActiveTab] = useState<'help' | 'contact'>('help');
    const [message, setMessage] = useState('');
    const [sending, setSending] = useState(false);
    const [sent, setSent] = useState(false);

    const helpArticles = [
        { title: 'Getting Started with Gap Analysis', category: 'Quick Start' },
        { title: 'Understanding Your CQC Score', category: 'Compliance' },
        { title: 'Preparing for Mock Inspections', category: 'Training' },
        { title: 'Managing Sponsored Workers', category: 'Visa Tracking' },
        { title: 'Upgrading Your Plan', category: 'Billing' }
    ];

    const handleSendMessage = async () => {
        if (!message.trim()) return;
        setSending(true);
        // Simulate sending
        await new Promise(r => setTimeout(r, 1500));
        setSending(false);
        setSent(true);
        setMessage('');
        setTimeout(() => setSent(false), 3000);
    };

    const positionStyles = position === 'bottom-right'
        ? { right: '1.5rem', bottom: '1.5rem' }
        : { left: '1.5rem', bottom: '1.5rem' };

    return (
        <>
            {/* Floating Button */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                style={{
                    position: 'fixed',
                    ...positionStyles,
                    width: '56px',
                    height: '56px',
                    borderRadius: '50%',
                    background: 'linear-gradient(135deg, #0f172a 0%, #334155 100%)',
                    color: 'white',
                    border: 'none',
                    cursor: 'pointer',
                    boxShadow: '0 4px 20px rgba(0,0,0,0.25)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 1000,
                    transition: 'all 0.3s ease'
                }}
            >
                {isOpen ? <X size={24} /> : <MessageCircle size={24} />}
            </button>

            {/* Widget Panel */}
            {isOpen && (
                <div
                    style={{
                        position: 'fixed',
                        ...positionStyles,
                        bottom: '5.5rem',
                        width: '360px',
                        maxHeight: '500px',
                        background: 'white',
                        borderRadius: '16px',
                        boxShadow: '0 10px 40px rgba(0,0,0,0.2)',
                        overflow: 'hidden',
                        zIndex: 999,
                        animation: 'slideUp 0.3s ease-out'
                    }}
                >
                    {/* Header */}
                    <div style={{
                        background: 'linear-gradient(135deg, #0f172a 0%, #334155 100%)',
                        padding: '1.25rem',
                        color: 'white'
                    }}>
                        <h3 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '0.25rem' }}>
                            How can we help?
                        </h3>
                        <p style={{ fontSize: '0.8rem', opacity: 0.8 }}>
                            Get answers or contact our support team
                        </p>
                    </div>

                    {/* Tabs */}
                    <div style={{ display: 'flex', borderBottom: '1px solid var(--color-border)' }}>
                        <button
                            onClick={() => setActiveTab('help')}
                            style={{
                                flex: 1,
                                padding: '0.75rem',
                                border: 'none',
                                background: 'transparent',
                                cursor: 'pointer',
                                fontSize: '0.85rem',
                                fontWeight: 600,
                                color: activeTab === 'help' ? 'var(--color-primary)' : 'var(--color-text-secondary)',
                                borderBottom: activeTab === 'help' ? '2px solid var(--color-primary)' : '2px solid transparent'
                            }}
                        >
                            <HelpCircle size={16} style={{ marginRight: '0.375rem', verticalAlign: '-3px' }} />
                            Help Articles
                        </button>
                        <button
                            onClick={() => setActiveTab('contact')}
                            style={{
                                flex: 1,
                                padding: '0.75rem',
                                border: 'none',
                                background: 'transparent',
                                cursor: 'pointer',
                                fontSize: '0.85rem',
                                fontWeight: 600,
                                color: activeTab === 'contact' ? 'var(--color-primary)' : 'var(--color-text-secondary)',
                                borderBottom: activeTab === 'contact' ? '2px solid var(--color-primary)' : '2px solid transparent'
                            }}
                        >
                            <Mail size={16} style={{ marginRight: '0.375rem', verticalAlign: '-3px' }} />
                            Contact Us
                        </button>
                    </div>

                    {/* Content */}
                    <div style={{ padding: '1rem', maxHeight: '320px', overflowY: 'auto' }}>
                        {activeTab === 'help' && (
                            <div>
                                {helpArticles.map((article, i) => (
                                    <div
                                        key={i}
                                        style={{
                                            padding: '0.75rem',
                                            borderRadius: '8px',
                                            cursor: 'pointer',
                                            marginBottom: '0.5rem',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'space-between',
                                            transition: 'background 0.2s'
                                        }}
                                        onMouseEnter={(e) => e.currentTarget.style.background = 'var(--color-bg-page)'}
                                        onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                                    >
                                        <div>
                                            <div style={{ fontSize: '0.9rem', fontWeight: 500, marginBottom: '0.125rem' }}>
                                                {article.title}
                                            </div>
                                            <div style={{ fontSize: '0.75rem', color: 'var(--color-text-tertiary)' }}>
                                                {article.category}
                                            </div>
                                        </div>
                                        <ChevronRight size={16} color="var(--color-text-tertiary)" />
                                    </div>
                                ))}

                                <div style={{
                                    marginTop: '1rem',
                                    padding: '1rem',
                                    background: '#f0f9ff',
                                    borderRadius: '8px',
                                    border: '1px solid #bae6fd'
                                }}>
                                    <div style={{ fontSize: '0.85rem', fontWeight: 600, color: '#0369a1', marginBottom: '0.375rem' }}>
                                        📚 Knowledge Base
                                    </div>
                                    <p style={{ fontSize: '0.8rem', color: '#0284c7', marginBottom: '0.5rem' }}>
                                        Browse our full documentation and CQC compliance guides.
                                    </p>
                                    <a href="#" style={{ fontSize: '0.8rem', color: '#0ea5e9', fontWeight: 600 }}>
                                        View All Articles →
                                    </a>
                                </div>
                            </div>
                        )}

                        {activeTab === 'contact' && (
                            <div>
                                {sent ? (
                                    <div style={{
                                        padding: '2rem',
                                        textAlign: 'center',
                                        background: '#f0fdf4',
                                        borderRadius: '8px',
                                        border: '1px solid #bbf7d0'
                                    }}>
                                        <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>✅</div>
                                        <div style={{ fontWeight: 600, color: '#047857' }}>Message Sent!</div>
                                        <p style={{ fontSize: '0.85rem', color: '#065f46' }}>
                                            We'll get back to you within 24 hours.
                                        </p>
                                    </div>
                                ) : (
                                    <>
                                        <textarea
                                            value={message}
                                            onChange={(e) => setMessage(e.target.value)}
                                            placeholder="Describe your question or issue..."
                                            style={{
                                                width: '100%',
                                                minHeight: '100px',
                                                padding: '0.75rem',
                                                border: '1px solid var(--color-border)',
                                                borderRadius: '8px',
                                                resize: 'none',
                                                fontSize: '0.9rem',
                                                fontFamily: 'inherit'
                                            }}
                                        />
                                        <button
                                            onClick={handleSendMessage}
                                            disabled={!message.trim() || sending}
                                            className="btn btn-primary"
                                            style={{ width: '100%', marginTop: '0.75rem' }}
                                        >
                                            {sending ? (
                                                <><Loader2 size={16} className="spin" /> Sending...</>
                                            ) : (
                                                <><Send size={16} /> Send Message</>
                                            )}
                                        </button>

                                        <div style={{ marginTop: '1.5rem' }}>
                                            <div style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--color-text-secondary)', marginBottom: '0.75rem' }}>
                                                Other ways to reach us:
                                            </div>
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                                <a href="mailto:support@complyflow.uk" style={{
                                                    display: 'flex', alignItems: 'center', gap: '0.5rem',
                                                    padding: '0.5rem 0.75rem', background: 'var(--color-bg-page)',
                                                    borderRadius: '6px', fontSize: '0.85rem', color: 'var(--color-text-main)'
                                                }}>
                                                    <Mail size={16} color="var(--color-text-tertiary)" />
                                                    support@complyflow.uk
                                                </a>
                                                <a href="tel:+441onal234567890" style={{
                                                    display: 'flex', alignItems: 'center', gap: '0.5rem',
                                                    padding: '0.5rem 0.75rem', background: 'var(--color-bg-page)',
                                                    borderRadius: '6px', fontSize: '0.85rem', color: 'var(--color-text-main)'
                                                }}>
                                                    <Phone size={16} color="var(--color-text-tertiary)" />
                                                    0800 123 4567 (Mon-Fri 9-5)
                                                </a>
                                            </div>
                                        </div>
                                    </>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            )}

            <style>{`
                @keyframes slideUp {
                    from {
                        opacity: 0;
                        transform: translateY(20px);
                    }
                    to {
                        opacity: 1;
                        transform: translateY(0);
                    }
                }
            `}</style>
        </>
    );
};
