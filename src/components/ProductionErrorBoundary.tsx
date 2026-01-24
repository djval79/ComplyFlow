import React, { Component, type ErrorInfo, type ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';
import { Sentry } from '../lib/sentry';

interface Props {
    children?: ReactNode;
}

interface State {
    hasError: boolean;
    error?: Error;
}

export class ProductionErrorBoundary extends Component<Props, State> {
    public state: State = {
        hasError: false
    };

    public static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error };
    }

    public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        console.error('Uncaught error:', error, errorInfo);

        // Report to Sentry in production
        Sentry.captureException(error, {
            extra: {
                componentStack: errorInfo.componentStack
            }
        });
    }

    public render() {
        if (this.state.hasError) {
            return (
                <div style={{
                    height: '100vh',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: 'var(--color-bg-page)',
                    padding: '2rem'
                }}>
                    <div className="card shadow-lg" style={{ maxWidth: '500px', textAlign: 'center', padding: '3rem' }}>
                        <div style={{
                            width: '64px', height: '64px', background: '#fef2f2',
                            borderRadius: '50%', display: 'flex', alignItems: 'center',
                            justifyContent: 'center', margin: '0 auto 1.5rem'
                        }}>
                            <AlertTriangle size={32} color="#dc2626" />
                        </div>
                        <h1 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '1rem' }}>Something went wrong</h1>
                        <p style={{ color: 'var(--color-text-secondary)', marginBottom: '2rem' }}>
                            We've encountered an unexpected error. Please try refreshing the page or return to the dashboard.
                        </p>
                        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
                            <button
                                onClick={() => window.location.reload()}
                                className="btn btn-primary"
                                style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                            >
                                <RefreshCw size={16} /> Refresh Page
                            </button>
                            <button
                                onClick={() => window.location.href = '/dashboard'}
                                className="btn btn-secondary"
                                style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                            >
                                <Home size={16} /> Home
                            </button>
                        </div>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}
