import React, { useState } from 'react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import { Mail, Lock, User, Building2, AlertCircle, Loader2, Shield, CheckCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';

export const Signup = () => {
    const navigate = useNavigate();
    const { signUp, isDemo } = useAuth();
    const [formData, setFormData] = useState({
        fullName: '',
        email: '',
        organizationName: '',
        password: '',
        confirmPassword: '',
    });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [searchParams] = useSearchParams();
    const [success, setSuccess] = useState(false);
    const [inviteInfo, setInviteInfo] = useState<{ token: string, email: string, role: string, orgName: string } | null>(null);

    React.useEffect(() => {
        const token = searchParams.get('token');
        const emailParam = searchParams.get('email');

        if (token) {
            const verifyInvite = async () => {
                const { data, error } = await supabase
                    .from('team_invitations')
                    .select('*, organizations(name)')
                    .eq('token', token)
                    .eq('status', 'pending')
                    .single();

                if (data && !error) {
                    setInviteInfo({
                        token,
                        email: data.email,
                        role: data.role,
                        orgName: data.organizations?.name || 'Your Organization'
                    });
                    setFormData(prev => ({ ...prev, email: data.email }));
                } else {
                    console.error('Invalid or expired invitation token');
                    setError('This invitation link is invalid or has expired.');
                }
            };
            verifyInvite();
        } else if (emailParam) {
            setFormData(prev => ({ ...prev, email: emailParam }));
        }
    }, [searchParams]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        // Validation
        if (formData.password !== formData.confirmPassword) {
            setError('Passwords do not match');
            return;
        }

        if (formData.password.length < 8) {
            setError('Password must be at least 8 characters');
            return;
        }

        setLoading(true);

        const { error } = await signUp(
            formData.email,
            formData.password,
            formData.fullName,
            inviteInfo ? inviteInfo.orgName : formData.organizationName,
            undefined, // orgId ignored if inviteToken is present
            inviteInfo?.role,
            inviteInfo?.token
        );

        if (error) {
            setError(error.message);
            setLoading(false);
        } else {
            // Track in Analytics
            import('../lib/posthog').then(({ captureEvent }) => {
                captureEvent('signup_completed', {
                    method: 'email',
                    is_invite: !!inviteInfo
                });
            });
            setSuccess(true);
        }
    };

    const handleDemoAccess = () => {
        navigate('/dashboard');
    };

    if (success) {
        return (
            <div className="auth-container">
                <div className="auth-card">
                    <div className="auth-header">
                        <div className="auth-logo success">
                            <CheckCircle size={32} />
                        </div>
                        <h1>Check Your Email</h1>
                        <p>We've sent a confirmation link to <strong>{formData.email}</strong></p>
                    </div>
                    <div className="auth-success-message">
                        <p>Click the link in your email to activate your account and start your 14-day free trial.</p>
                    </div>
                    <Link to="/login" className="btn btn-primary btn-full btn-lg">
                        Back to Login
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="auth-container">
            <div className="auth-card">
                {/* Logo & Header */}
                <div className="auth-header">
                    <div className="auth-logo">
                        <Shield size={32} />
                    </div>
                    <h1>{inviteInfo ? `Join ${inviteInfo.orgName}` : 'Start Free Trial'}</h1>
                    <p>{inviteInfo ? 'Create your account to access the team workspace' : '14 days free, no credit card required'}</p>
                </div>

                {/* Invite Banner */}
                {inviteInfo && (
                    <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', padding: '0.75rem', borderRadius: '8px', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <CheckCircle size={20} color="#16a34a" />
                        <div>
                            <strong style={{ display: 'block', color: '#166534', fontSize: '0.9rem' }}>Invitation Verified</strong>
                            <span style={{ fontSize: '0.8rem', color: '#15803d' }}>You are joining <strong>{inviteInfo.orgName}</strong> as an {inviteInfo.role}.</span>
                        </div>
                    </div>
                )}

                {/* Demo Mode Banner */}
                {isDemo && (
                    <div className="demo-banner">
                        <CheckCircle size={18} />
                        <div>
                            <strong>Demo Mode Active</strong>
                            <p>Supabase not configured. Click below to explore with demo data.</p>
                        </div>
                    </div>
                )}

                {/* Error Message */}
                {error && (
                    <div className="auth-error">
                        <AlertCircle size={18} />
                        <span>{error}</span>
                    </div>
                )}

                {/* Signup Form */}
                <form onSubmit={handleSubmit} className="auth-form">
                    <div className="form-row-2col">
                        <div className="form-group">
                            <label htmlFor="fullName">Full Name</label>
                            <div className="input-with-icon">
                                <User size={18} className="input-icon" />
                                <input
                                    id="fullName"
                                    name="fullName"
                                    type="text"
                                    className="form-input"
                                    placeholder="Jane Smith"
                                    value={formData.fullName}
                                    onChange={handleChange}
                                    required
                                    disabled={isDemo}
                                />
                            </div>
                        </div>

                        <div className="form-group">
                            <label htmlFor="organizationName">Organisation Name</label>
                            {inviteInfo ? (
                                <div className="input-with-icon" style={{ opacity: 0.7, background: '#f8fafc' }}>
                                    <Building2 size={18} className="input-icon" />
                                    <input
                                        type="text"
                                        className="form-input"
                                        value={inviteInfo.orgName}
                                        disabled
                                        style={{ cursor: 'not-allowed' }}
                                    />
                                </div>
                            ) : (
                                <div className="input-with-icon">
                                    <Building2 size={18} className="input-icon" />
                                    <input
                                        id="organizationName"
                                        name="organizationName"
                                        type="text"
                                        className="form-input"
                                        placeholder="Care Co Ltd"
                                        value={formData.organizationName}
                                        onChange={handleChange}
                                        required
                                        disabled={isDemo}
                                    />
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="form-group">
                        <label htmlFor="email">Work Email</label>
                        <div className="input-with-icon">
                            <Mail size={18} className="input-icon" />
                            <input
                                id="email"
                                name="email"
                                type="email"
                                className="form-input"
                                placeholder="you@yourcompany.co.uk"
                                value={formData.email}
                                onChange={handleChange}
                                required
                                disabled={isDemo}
                            />
                        </div>
                    </div>

                    <div className="form-row-2col">
                        <div className="form-group">
                            <label htmlFor="password">Password</label>
                            <div className="input-with-icon">
                                <Lock size={18} className="input-icon" />
                                <input
                                    id="password"
                                    name="password"
                                    type="password"
                                    className="form-input"
                                    placeholder="Min. 8 characters"
                                    value={formData.password}
                                    onChange={handleChange}
                                    required
                                    disabled={isDemo}
                                />
                            </div>
                        </div>

                        <div className="form-group">
                            <label htmlFor="confirmPassword">Confirm Password</label>
                            <div className="input-with-icon">
                                <Lock size={18} className="input-icon" />
                                <input
                                    id="confirmPassword"
                                    name="confirmPassword"
                                    type="password"
                                    className="form-input"
                                    placeholder="••••••••"
                                    value={formData.confirmPassword}
                                    onChange={handleChange}
                                    required
                                    disabled={isDemo}
                                />
                            </div>
                        </div>
                    </div>

                    <div className="form-group">
                        <label className="checkbox-label">
                            <input type="checkbox" required />
                            <span>I agree to the <Link to="/terms" className="link-text">Terms of Service</Link> and <Link to="/privacy" className="link-text">Privacy Policy</Link></span>
                        </label>
                    </div>

                    {isDemo ? (
                        <button
                            type="button"
                            className="btn btn-primary btn-full btn-lg"
                            onClick={handleDemoAccess}
                        >
                            🚀 Enter Demo Mode
                        </button>
                    ) : (
                        <button
                            type="submit"
                            className="btn btn-primary btn-full btn-lg"
                            disabled={loading}
                        >
                            {loading ? (
                                <>
                                    <Loader2 size={18} className="spin" />
                                    Creating account...
                                </>
                            ) : (
                                'Start Free Trial'
                            )}
                        </button>
                    )}
                </form>

                {/* Features */}
                <div className="trial-features">
                    <div className="trial-feature">
                        <CheckCircle size={16} />
                        <span>AI-powered policy analysis</span>
                    </div>
                    <div className="trial-feature">
                        <CheckCircle size={16} />
                        <span>Sponsor licence tracking</span>
                    </div>
                    <div className="trial-feature">
                        <CheckCircle size={16} />
                        <span>CQC inspection simulator</span>
                    </div>
                </div>

                {/* Divider */}
                <div className="auth-divider">
                    <span>or</span>
                </div>

                {/* Login Link */}
                <div className="auth-footer">
                    <p>Already have an account? <Link to="/login" className="link-text">Sign in</Link></p>
                </div>
            </div>
        </div>
    );
};
