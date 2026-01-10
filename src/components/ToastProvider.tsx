import React, { createContext, useContext, useState, useCallback } from 'react';
import { CheckCircle, AlertCircle, AlertTriangle, Info, X } from 'lucide-react';

type ToastType = 'success' | 'error' | 'warning' | 'info';

interface Toast {
    id: string;
    type: ToastType;
    title: string;
    message?: string;
    duration?: number;
}

interface ToastContextType {
    showToast: (type: ToastType, title: string, message?: string, duration?: number) => void;
    success: (title: string, message?: string) => void;
    error: (title: string, message?: string) => void;
    warning: (title: string, message?: string) => void;
    info: (title: string, message?: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const useToast = () => {
    const context = useContext(ToastContext);
    if (!context) {
        throw new Error('useToast must be used within a ToastProvider');
    }
    return context;
};

const toastConfig: Record<ToastType, { icon: React.ReactNode; bg: string; border: string; iconColor: string }> = {
    success: {
        icon: <CheckCircle size={20} />,
        bg: '#f0fdf4',
        border: '#bbf7d0',
        iconColor: '#10b981'
    },
    error: {
        icon: <AlertCircle size={20} />,
        bg: '#fef2f2',
        border: '#fecaca',
        iconColor: '#ef4444'
    },
    warning: {
        icon: <AlertTriangle size={20} />,
        bg: '#fffbeb',
        border: '#fde68a',
        iconColor: '#f59e0b'
    },
    info: {
        icon: <Info size={20} />,
        bg: '#f0f9ff',
        border: '#bae6fd',
        iconColor: '#0ea5e9'
    }
};

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [toasts, setToasts] = useState<Toast[]>([]);

    const removeToast = useCallback((id: string) => {
        setToasts(prev => prev.filter(t => t.id !== id));
    }, []);

    const showToast = useCallback((type: ToastType, title: string, message?: string, duration = 4000) => {
        const id = `toast-${Date.now()}-${Math.random()}`;
        setToasts(prev => [...prev, { id, type, title, message, duration }]);

        if (duration > 0) {
            setTimeout(() => removeToast(id), duration);
        }
    }, [removeToast]);

    const success = useCallback((title: string, message?: string) => showToast('success', title, message), [showToast]);
    const error = useCallback((title: string, message?: string) => showToast('error', title, message), [showToast]);
    const warning = useCallback((title: string, message?: string) => showToast('warning', title, message), [showToast]);
    const info = useCallback((title: string, message?: string) => showToast('info', title, message), [showToast]);

    return (
        <ToastContext.Provider value={{ showToast, success, error, warning, info }}>
            {children}

            {/* Toast Container */}
            <div style={{
                position: 'fixed',
                top: '1rem',
                right: '1rem',
                zIndex: 9999,
                display: 'flex',
                flexDirection: 'column',
                gap: '0.75rem',
                pointerEvents: 'none'
            }}>
                {toasts.map(toast => {
                    const config = toastConfig[toast.type];
                    return (
                        <div
                            key={toast.id}
                            style={{
                                background: config.bg,
                                border: `1px solid ${config.border}`,
                                borderRadius: '12px',
                                padding: '1rem',
                                minWidth: '300px',
                                maxWidth: '400px',
                                boxShadow: '0 10px 25px rgba(0,0,0,0.1)',
                                display: 'flex',
                                alignItems: 'flex-start',
                                gap: '0.75rem',
                                animation: 'slideInRight 0.3s ease-out',
                                pointerEvents: 'auto'
                            }}
                        >
                            <div style={{ color: config.iconColor, flexShrink: 0, marginTop: '0.125rem' }}>
                                {config.icon}
                            </div>
                            <div style={{ flex: 1 }}>
                                <div style={{ fontWeight: 600, fontSize: '0.9rem', marginBottom: toast.message ? '0.25rem' : 0 }}>
                                    {toast.title}
                                </div>
                                {toast.message && (
                                    <div style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)' }}>
                                        {toast.message}
                                    </div>
                                )}
                            </div>
                            <button
                                onClick={() => removeToast(toast.id)}
                                style={{
                                    background: 'transparent',
                                    border: 'none',
                                    cursor: 'pointer',
                                    color: 'var(--color-text-tertiary)',
                                    padding: '0.25rem',
                                    flexShrink: 0
                                }}
                            >
                                <X size={16} />
                            </button>
                        </div>
                    );
                })}
            </div>

            <style>{`
                @keyframes slideInRight {
                    from {
                        opacity: 0;
                        transform: translateX(100%);
                    }
                    to {
                        opacity: 1;
                        transform: translateX(0);
                    }
                }
            `}</style>
        </ToastContext.Provider>
    );
};
