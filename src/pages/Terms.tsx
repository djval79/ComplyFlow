import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

export const Terms = () => {
    return (
        <div className="container" style={{ padding: '4rem 1rem', maxWidth: '800px' }}>
            <Link to="/signup" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '2rem', color: 'var(--color-text-secondary)' }}>
                <ArrowLeft size={16} /> Back to Sign Up
            </Link>

            <div className="card">
                <h1 style={{ fontSize: '2rem', marginBottom: '1.5rem' }}>Terms of Service</h1>
                <p style={{ color: 'var(--color-text-secondary)', marginBottom: '2rem' }}>Last updated: January 2026</p>

                <div style={{ lineHeight: '1.6' }}>
                    <h2 style={{ fontSize: '1.25rem', marginTop: '1.5rem', marginBottom: '0.5rem' }}>1. Introduction</h2>
                    <p>Welcome to ComplyFlow. By leveraging our software, you agree to these terms.</p>

                    <h2 style={{ fontSize: '1.25rem', marginTop: '1.5rem', marginBottom: '0.5rem' }}>2. Subscription & Payments</h2>
                    <p>We offer paid subscriptions (Professional, Enterprise). Payments are processed via Stripe. You may cancel at any time, but refunds are not processed for partial months.</p>

                    <h2 style={{ fontSize: '1.25rem', marginTop: '1.5rem', marginBottom: '0.5rem' }}>3. Data & AI Usage</h2>
                    <p>Our service uses Artificial Intelligence to analyze your documents. While we strive for accuracy, AI outputs should be verified by a human professional. We are not a law firm.</p>

                    <h2 style={{ fontSize: '1.25rem', marginTop: '1.5rem', marginBottom: '0.5rem' }}>4. Disclaimer</h2>
                    <p>ComplyFlow is a tool to assist with compliance. The ultimate responsibility for CQC and Home Office compliance lies with your organization.</p>
                </div>
            </div>
        </div>
    );
};
