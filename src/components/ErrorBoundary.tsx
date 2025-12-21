import React, { Component } from 'react';
import type { ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface Props {
    children?: ReactNode;
}

interface State {
    hasError: boolean;
    error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
    public state: State = {
        hasError: false
    };

    public static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error };
    }

    public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        console.error("Uncaught error:", error, errorInfo);
    }

    public render() {
        if (this.state.hasError) {
            return (
                <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    height: '100vh',
                    background: '#f8fafc',
                    color: '#1e293b',
                    textAlign: 'center',
                    padding: '2rem'
                }}>
                    <AlertTriangle size={48} color="#ef4444" style={{ marginBottom: '1rem' }} />
                    <h1 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '0.5rem' }}>Something went wrong</h1>
                    <p style={{ maxWidth: '400px', marginBottom: '2rem', color: '#64748b' }}>
                        {this.state.error?.message || "An unexpected error occurred in the application."}
                    </p>
                    <button
                        className="btn btn-primary"
                        onClick={() => window.location.reload()}
                        style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                    >
                        <RefreshCw size={16} /> Reload Application
                    </button>
                </div>
            );
        }

        return this.props.children;
    }
}
