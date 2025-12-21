import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Mail, Lock, User, Building2, AlertCircle, Loader2, Shield, CheckCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

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
    const [success, setSuccess] = useState(false);

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
            formData.organizationName
        );

        if (error) {
            setError(error.message);
            setLoading(false);
        } else {
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
                    <h1>Start Free Trial</h1>
                    <p>14 days free, no credit card required</p>
                </div>

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
