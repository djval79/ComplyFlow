import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

export const Privacy = () => {
    return (
        <div className="container" style={{ padding: '4rem 1rem', maxWidth: '800px' }}>
            <Link to="/signup" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '2rem', color: 'var(--color-text-secondary)' }}>
                <ArrowLeft size={16} /> Back to Sign Up
            </Link>

            <div className="card">
                <h1 style={{ fontSize: '2rem', marginBottom: '1.5rem' }}>Privacy Policy</h1>
                <p style={{ color: 'var(--color-text-secondary)', marginBottom: '2rem' }}>Last updated: January 2026</p>

                <div style={{ lineHeight: '1.6' }}>
                    <h2 style={{ fontSize: '1.25rem', marginTop: '1.5rem', marginBottom: '0.5rem' }}>1. Data Collection</h2>
                    <p>We collect account information (email, name) and the documents you upload for analysis.</p>

                    <h2 style={{ fontSize: '1.25rem', marginTop: '1.5rem', marginBottom: '0.5rem' }}>2. Document Security</h2>
                    <p>Documents uploaded to ComplyFlow are stored securely. When using AI features, specific text segments may be processed by our AI partners (Google Vertex AI) but are not used to train their public models.</p>

                    <h2 style={{ fontSize: '1.25rem', marginTop: '1.5rem', marginBottom: '0.5rem' }}>3. Data Deletion</h2>
                    <p>You may request full deletion of your organization's data by contacting support@complyflow.uk.</p>
                </div>
            </div>
        </div>
    );
};
