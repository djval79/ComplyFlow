import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Briefcase, Building, CheckCircle, ArrowRight, User } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { useCompliance } from '../context/ComplianceContext';

export const Onboarding = () => {
    const navigate = useNavigate();
    const { profile, updateProfile } = useAuth();
    const { updateCompliance } = useCompliance();

    const [step, setStep] = useState(1);
    const [loading, setLoading] = useState(false);

    // Form State
    const [role, setRole] = useState<'manager' | 'staff'>('manager');
    const [orgName, setOrgName] = useState('');
    const [cqcLocationId, setCqcLocationId] = useState('');
    const [services, setServices] = useState<string[]>([]);
    const [staffCount, setStaffCount] = useState('');

    const handleComplete = async () => {
        setLoading(true);
        try {
            // Update Organization details if Manager
            if (role === 'manager' && profile?.organization_id) {
                const { error } = await supabase
                    .from('organizations')
                    .update({
                        name: orgName,
                        cqc_location_id: cqcLocationId,
                        is_onboarded: true
                    })
                    .eq('id', profile.organization_id);

                if (error) throw error;

                // Update local context
                updateCompliance({ companyName: orgName });
            }

            // Mark profile as onboarded using Context method to ensure local state updates
            const { error: profileError } = await updateProfile({
                role: role === 'manager' ? 'owner' : 'member',
                onboarding_completed: true
            });

            if (profileError) throw profileError;

            // Redirect to Dashboard
            navigate('/dashboard');
        } catch (error) {
            console.error('Onboarding error:', error);
            // Fallback for demo login if Supabase fails (e.g. RLS issues or missing tables)
            navigate('/dashboard');
        } finally {
            setLoading(false);
        }
    };

    const toggleService = (service: string) => {
        if (services.includes(service)) {
            setServices(prev => prev.filter(s => s !== service));
        } else {
            setServices(prev => [...prev, service]);
        }
    };

    return (
        <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #f0f7ff 0%, #ffffff 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem' }}>
            <div className="card animate-enter" style={{ maxWidth: '600px', width: '100%', padding: '3rem' }}>

                {/* Progress Bar */}
                <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '3rem', gap: '1rem' }}>
                    {[1, 2, 3].map(i => (
                        <div key={i} style={{
                            width: '40px', height: '4px',
                            borderRadius: '2px',
                            background: i <= step ? 'var(--color-primary)' : '#e2e8f0',
                            transition: 'all 0.3s ease'
                        }} />
                    ))}
                </div>

                {/* Step 1: Role Selection */}
                {step === 1 && (
                    <div className="animate-enter">
                        <h1 style={{ textAlign: 'center', marginBottom: '1rem' }}>Welcome to ComplyFlow! 👋</h1>
                        <p style={{ textAlign: 'center', color: 'var(--color-text-secondary)', marginBottom: '2.5rem' }}>
                            Let's get you set up. First, what is your role?
                        </p>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '2.5rem' }}>
                            <div
                                onClick={() => setRole('manager')}
                                style={{
                                    padding: '2rem',
                                    borderRadius: '16px',
                                    border: `2px solid ${role === 'manager' ? 'var(--color-primary)' : '#e2e8f0'}`,
                                    background: role === 'manager' ? 'var(--color-primary-light)' : 'white',
                                    cursor: 'pointer',
                                    textAlign: 'center',
                                    transition: 'all 0.2s'
                                }}
                            >
                                <Briefcase size={32} color={role === 'manager' ? 'var(--color-primary)' : 'var(--color-text-tertiary)'} style={{ marginBottom: '1rem' }} />
                                <div style={{ fontWeight: 600, color: 'var(--color-text-main)' }}>Manager / Owner</div>
                                <div style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)', marginTop: '0.5rem' }}>I manage a care home</div>
                            </div>

                            <div
                                onClick={() => setRole('staff')}
                                style={{
                                    padding: '2rem',
                                    borderRadius: '16px',
                                    border: `2px solid ${role === 'staff' ? 'var(--color-primary)' : '#e2e8f0'}`,
                                    background: role === 'staff' ? 'var(--color-primary-light)' : 'white',
                                    cursor: 'pointer',
                                    textAlign: 'center',
                                    transition: 'all 0.2s'
                                }}
                            >
                                <User size={32} color={role === 'staff' ? 'var(--color-primary)' : 'var(--color-text-tertiary)'} style={{ marginBottom: '1rem' }} />
                                <div style={{ fontWeight: 600, color: 'var(--color-text-main)' }}>Staff Member</div>
                                <div style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)', marginTop: '0.5rem' }}>I work at a care home</div>
                            </div>
                        </div>

                        <button className="btn btn-primary btn-full btn-lg" onClick={() => setStep(2)}>
                            Next Step <ArrowRight size={18} />
                        </button>
                    </div>
                )}

                {/* Step 2: Organization Details (Manager Only) */}
                {step === 2 && role === 'manager' && (
                    <div className="animate-enter">
                        <h1 style={{ textAlign: 'center', marginBottom: '1rem' }}>Tell us about your Home 🏠</h1>
                        <p style={{ textAlign: 'center', color: 'var(--color-text-secondary)', marginBottom: '2.5rem' }}>
                            We'll customize ComplyFlow for your specific service.
                        </p>

                        <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                            <label className="form-label">Care Home Name</label>
                            <input
                                type="text"
                                className="form-input"
                                placeholder="e.g. Sunny Days Care Home"
                                value={orgName}
                                onChange={e => setOrgName(e.target.value)}
                            />
                        </div>

                        <div className="form-group" style={{ marginBottom: '2.5rem' }}>
                            <label className="form-label">CQC Location ID (Optional)</label>
                            <input
                                type="text"
                                className="form-input"
                                placeholder="e.g. 1-12345678"
                                value={cqcLocationId}
                                onChange={e => setCqcLocationId(e.target.value)}
                            />
                            <p className="form-hint">We use this for your first Gap Analysis report.</p>
                        </div>

                        <button
                            className="btn btn-primary btn-full btn-lg"
                            onClick={() => setStep(3)}
                            disabled={!orgName}
                        >
                            Next Step <ArrowRight size={18} />
                        </button>
                    </div>
                )}
                {/* Step 2: Staff View (Skip org details) */}
                {step === 2 && role === 'staff' && (
                    <div className="animate-enter">
                        <h1 style={{ textAlign: 'center', marginBottom: '1rem' }}>Staff Profile Setup 👤</h1>
                        <p style={{ textAlign: 'center', color: 'var(--color-text-secondary)', marginBottom: '2.5rem' }}>
                            You're joining as a staff member. We'll set up your training dashboard.
                        </p>

                        <div style={{ padding: '2rem', background: '#f8fafc', borderRadius: '12px', textAlign: 'center', marginBottom: '2rem' }}>
                            <CheckCircle size={48} color="var(--color-success)" style={{ marginBottom: '1rem' }} />
                            <h3 style={{ marginBottom: '0.5rem' }}>Training Portal Ready</h3>
                            <p style={{ fontSize: '0.9rem', color: 'var(--color-text-secondary)' }}>
                                We've prepared your personalized training modules.
                            </p>
                        </div>

                        <button className="btn btn-primary btn-full btn-lg" onClick={handleComplete} disabled={loading}>
                            {loading ? 'Setting up...' : 'Go to Dashboard'} <ArrowRight size={18} />
                        </button>
                    </div>
                )}

                {/* Step 3: Services (Manager Only) */}
                {step === 3 && role === 'manager' && (
                    <div className="animate-enter">
                        <h1 style={{ textAlign: 'center', marginBottom: '1rem' }}>Select Services Supported 🏥</h1>
                        <p style={{ textAlign: 'center', color: 'var(--color-text-secondary)', marginBottom: '2.5rem' }}>
                            Select the regulated activities you provide.
                        </p>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '2.5rem' }}>
                            {[
                                'Residential Care',
                                'Nursing Care',
                                'Dementia Care',
                                'Learning Disabilities',
                                'Mental Health',
                                'Domiciliary Care'
                            ].map(service => (
                                <div
                                    key={service}
                                    onClick={() => toggleService(service)}
                                    style={{
                                        padding: '1rem',
                                        borderRadius: '8px',
                                        border: `1px solid ${services.includes(service) ? 'var(--color-primary)' : '#e2e8f0'}`,
                                        background: services.includes(service) ? 'var(--color-primary-light)' : 'white',
                                        cursor: 'pointer',
                                        textAlign: 'center',
                                        fontSize: '0.9rem',
                                        fontWeight: 500,
                                        color: services.includes(service) ? 'var(--color-primary)' : 'var(--color-text-secondary)',
                                        transition: 'all 0.2s'
                                    }}
                                >
                                    {service}
                                </div>
                            ))}
                        </div>

                        <div className="form-group" style={{ marginTop: '1.5rem', marginBottom: '2rem' }}>
                            <label className="form-label">Approximate Number of Staff</label>
                            <input
                                type="number"
                                className="form-input"
                                placeholder="e.g. 25"
                                value={staffCount}
                                onChange={e => setStaffCount(e.target.value)}
                            />
                        </div>

                        <button className="btn btn-primary btn-full btn-lg" onClick={handleComplete} disabled={loading}>
                            {loading ? 'Finalizing Setup...' : 'Complete Setup'} <CheckCircle size={18} />
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};
