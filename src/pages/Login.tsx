import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Mail, Lock, AlertCircle, Loader2, Shield, CheckCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const Login = () => {
    const navigate = useNavigate();
    const { signIn, isDemo } = useAuth();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        const { error } = await signIn(email, password);

        if (error) {
            setError(error.message || 'Failed to sign in. Please check your credentials.');
            setLoading(false);
        } else {
            navigate('/dashboard');
        }
    };

    const handleDemoAccess = async () => {
        setLoading(true);
        await signIn('demo@complyflow.uk', 'password');
        navigate('/dashboard');
    };

    return (
        <div className="auth-container">
            <div className="auth-card">
                {/* Logo & Header */}
                <div className="auth-header">
                    <div className="auth-logo">
                        <Shield size={32} />
                    </div>
                    <h1>Welcome Back</h1>
                    <p>Sign in to ComplyFlow to manage your compliance</p>
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

                {/* Login Form */}
                <form onSubmit={handleSubmit} className="auth-form">
                    <div className="form-group">
                        <label htmlFor="email">Email Address</label>
                        <div className="input-with-icon">
                            <Mail size={18} className="input-icon" />
                            <input
                                id="email"
                                type="email"
                                className="form-input"
                                placeholder="you@yourcompany.co.uk"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                                disabled={isDemo}
                            />
                        </div>
                    </div>

                    <div className="form-group">
                        <label htmlFor="password">Password</label>
                        <div className="input-with-icon">
                            <Lock size={18} className="input-icon" />
                            <input
                                id="password"
                                type="password"
                                className="form-input"
                                placeholder="••••••••"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                disabled={isDemo}
                            />
                        </div>
                    </div>

                    <div className="form-row">
                        <label className="checkbox-label">
                            <input type="checkbox" />
                            <span>Remember me</span>
                        </label>
                        <Link to="/forgot-password" className="link-text">Forgot password?</Link>
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
                                    Signing in...
                                </>
                            ) : (
                                'Sign In'
                            )}
                        </button>
                    )}
                </form>

                {/* Divider */}
                <div className="auth-divider">
                    <span>or</span>
                </div>

                {/* Signup Link */}
                <div className="auth-footer">
                    <p>Don't have an account? <Link to="/signup" className="link-text">Start free trial</Link></p>
                </div>
            </div>

            {/* Trust Badges */}
            <div className="auth-trust">
                <div className="trust-item">
                    <CheckCircle size={16} />
                    <span>CQC Regulation Experts</span>
                </div>
                <div className="trust-item">
                    <Shield size={16} />
                    <span>Bank-Level Encryption</span>
                </div>
                <div className="trust-item">
                    <CheckCircle size={16} />
                    <span>GDPR Compliant</span>
                </div>
            </div>
        </div>
    );
};
