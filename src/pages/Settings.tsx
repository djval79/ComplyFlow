import React, { useState } from 'react';
import { User, Bell, Shield, Key, Building, CreditCard, Check, Crown, Loader2, Download, ChevronRight, Plus, Mail, Trash2 } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { sendTeamInviteEmail } from '../services/emailService';
import { useAuth } from '../context/AuthContext';
import { useCompliance } from '../context/ComplianceContext';
import { useNavigate } from 'react-router-dom';
import { SUBSCRIPTION_TIERS } from '../lib/subscriptionData';

type SettingsTab = 'profile' | 'organization' | 'billing' | 'notifications' | 'security';

export const Settings = () => {
    const { profile, updateProfile, isDemo } = useAuth();
    const { companyName } = useCompliance();
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState<SettingsTab>('profile');
    const [saving, setSaving] = useState(false);
    const [formData, setFormData] = useState({
        fullName: profile?.full_name || '',
        email: profile?.email || ''
    });

    const [teamMembers, setTeamMembers] = useState<any[]>([]);
    const [loadingTeam, setLoadingTeam] = useState(false);
    const [inviteEmail, setInviteEmail] = useState('');
    const [inviting, setInviting] = useState(false);

    // Load team members when Organization tab is active
    React.useEffect(() => {
        if (activeTab === 'organization' && profile?.organization_id) {
            fetchTeam();
        }
    }, [activeTab, profile?.organization_id]);

    const fetchTeam = async () => {
        setLoadingTeam(true);
        const { data } = await supabase
            .from('profiles')
            .select('*')
            .eq('organization_id', profile?.organization_id);

        if (data) setTeamMembers(data);
        setLoadingTeam(false);
    };

    const handleInvite = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!inviteEmail) return;
        setInviting(true);
        try {
            // 1. Send Invite Email
            await sendTeamInviteEmail(
                inviteEmail,
                profile?.full_name || 'The Manager',
                companyName || 'Our Care Home',
                'Staff Member',
                `${window.location.origin}/signup`
            );

            // 2. Ideally, create a pending_invites record here

            alert(`Invitation sent to ${inviteEmail}`);
            setInviteEmail('');
        } catch (error) {
            console.error('Invite error:', error);
            alert('Failed to send invitation');
        } finally {
            setInviting(false);
        }
    };

    // Mock current subscription (in real app, fetch from Supabase)
    const currentPlan = SUBSCRIPTION_TIERS[0]; // Free tier
    const billingHistory = [
        { date: '2025-01-01', description: 'Professional Plan - Monthly', amount: '£49.00', status: 'Paid' },
        { date: '2024-12-01', description: 'Professional Plan - Monthly', amount: '£49.00', status: 'Paid' },
        { date: '2024-11-01', description: 'Professional Plan - Monthly', amount: '£49.00', status: 'Paid' }
    ];

    const handleSaveProfile = async () => {
        setSaving(true);
        await new Promise(r => setTimeout(r, 1000)); // Simulate save
        setSaving(false);
        alert('Profile saved successfully!');
    };

    const tabs: { id: SettingsTab; label: string; icon: React.ReactNode }[] = [
        { id: 'profile', label: 'Profile', icon: <User size={18} /> },
        { id: 'organization', label: 'Organization', icon: <Building size={18} /> },
        { id: 'billing', label: 'Billing & Plan', icon: <CreditCard size={18} /> },
        { id: 'notifications', label: 'Notifications', icon: <Bell size={18} /> },
        { id: 'security', label: 'Security', icon: <Shield size={18} /> }
    ];

    return (
        <div className="container animate-enter" style={{ padding: '2rem 1rem' }}>
            <h1 style={{ fontSize: '1.8rem', fontWeight: 700, marginBottom: '2rem' }}>Settings</h1>

            <div style={{ display: 'grid', gridTemplateColumns: '240px 1fr', gap: '2rem' }}>

                {/* Sidebar */}
                <div className="card" style={{ padding: '0.5rem', height: 'fit-content' }}>
                    <nav style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                        {tabs.map(tab => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '0.75rem',
                                    padding: '0.75rem 1rem',
                                    background: activeTab === tab.id ? 'var(--color-accent-subtle)' : 'transparent',
                                    color: activeTab === tab.id ? 'var(--color-primary)' : 'var(--color-text-secondary)',
                                    border: 'none',
                                    borderRadius: '8px',
                                    cursor: 'pointer',
                                    fontSize: '0.9rem',
                                    fontWeight: activeTab === tab.id ? 600 : 500,
                                    textAlign: 'left',
                                    width: '100%',
                                    transition: 'all 0.2s'
                                }}
                            >
                                {tab.icon}
                                {tab.label}
                            </button>
                        ))}
                    </nav>
                </div>

                {/* Content */}
                <div>
                    {/* Profile Tab */}
                    {activeTab === 'profile' && (
                        <div className="card">
                            <h2 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '1.5rem' }}>Profile Information</h2>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', maxWidth: '400px' }}>
                                <div>
                                    <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.5rem' }}>
                                        Full Name
                                    </label>
                                    <input
                                        type="text"
                                        className="form-input"
                                        value={formData.fullName}
                                        onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.5rem' }}>
                                        Email Address
                                    </label>
                                    <input
                                        type="email"
                                        className="form-input"
                                        value={formData.email}
                                        disabled
                                        style={{ background: 'var(--color-bg-page)' }}
                                    />
                                    <p style={{ fontSize: '0.75rem', color: 'var(--color-text-tertiary)', marginTop: '0.375rem' }}>
                                        Contact support to change your email address
                                    </p>
                                </div>
                                <button
                                    onClick={handleSaveProfile}
                                    className="btn btn-primary"
                                    disabled={saving}
                                    style={{ width: 'fit-content' }}
                                >
                                    {saving ? <><Loader2 size={16} className="spin" /> Saving...</> : 'Save Changes'}
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Organization Tab */}
                    {activeTab === 'organization' && (
                        <div className="card">
                            <h2 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '1.5rem' }}>Organization Details</h2>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', maxWidth: '400px' }}>
                                <div>
                                    <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.5rem' }}>
                                        Company Name
                                    </label>
                                    <input
                                        type="text"
                                        className="form-input"
                                        value={companyName || profile?.organization_name || 'My Organization'}
                                        disabled
                                        style={{ background: 'var(--color-bg-page)' }}
                                    />
                                </div>
                                <div>
                                    <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.5rem' }}>
                                        Your Role
                                    </label>
                                    <input
                                        type="text"
                                        className="form-input"
                                        value={profile?.role || 'owner'}
                                        disabled
                                        style={{ background: 'var(--color-bg-page)', textTransform: 'capitalize' }}
                                    />
                                </div>
                            </div>

                            <div style={{ marginTop: '2rem', paddingTop: '2rem', borderTop: '1px solid var(--color-border)' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                                    <h3 style={{ fontSize: '1rem', fontWeight: 600 }}>Team Members ({teamMembers.length})</h3>
                                    {isDemo && <span className="badge badge-warning">Demo Mode</span>}
                                </div>

                                {/* Invite Form */}
                                <form onSubmit={handleInvite} style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem' }}>
                                    <input
                                        type="email"
                                        placeholder="colleague@carehome.co.uk"
                                        className="form-input"
                                        style={{ height: '42px' }}
                                        value={inviteEmail}
                                        onChange={e => setInviteEmail(e.target.value)}
                                        required
                                    />
                                    <button
                                        type="submit"
                                        className="btn btn-primary"
                                        disabled={inviting || isDemo}
                                        style={{ height: '42px', padding: '0 1.5rem', whiteSpace: 'nowrap' }}
                                    >
                                        {inviting ? <Loader2 size={16} className="spin" /> : <><Plus size={16} /> Invite</>}
                                    </button>
                                </form>

                                {/* Team List */}
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                                    {loadingTeam ? (
                                        <div style={{ textAlign: 'center', padding: '1rem', color: 'var(--color-text-tertiary)' }}>
                                            <Loader2 size={20} className="spin" style={{ margin: '0 auto 0.5rem' }} />
                                            Loading team...
                                        </div>
                                    ) : teamMembers.length > 0 ? (
                                        teamMembers.map((member) => (
                                            <div key={member.id} style={{
                                                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                                padding: '0.75rem', background: 'var(--color-bg-page)', borderRadius: '8px'
                                            }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                                    <div style={{
                                                        width: '32px', height: '32px', borderRadius: '50%',
                                                        background: 'var(--color-accent-subtle)', color: 'var(--color-accent)',
                                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                        fontWeight: 600, fontSize: '0.9rem'
                                                    }}>
                                                        {member.full_name?.charAt(0) || member.email?.charAt(0)}
                                                    </div>
                                                    <div>
                                                        <div style={{ fontSize: '0.9rem', fontWeight: 500 }}>{member.full_name || 'Unnamed User'}</div>
                                                        <div style={{ fontSize: '0.8rem', color: 'var(--color-text-tertiary)' }}>{member.email}</div>
                                                    </div>
                                                </div>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                                    <span className={`badge ${member.role === 'owner' ? 'badge-success' : 'badge-secondary'}`}>
                                                        {member.role || 'Member'}
                                                    </span>
                                                    {member.role !== 'owner' && (
                                                        <button
                                                            className="btn-icon"
                                                            style={{ color: 'var(--color-text-tertiary)', padding: '4px' }}
                                                            title="Remove User"
                                                            onClick={() => alert('Remove user functionality coming soon')}
                                                        >
                                                            <Trash2 size={16} />
                                                        </button>
                                                    )}
                                                </div>
                                            </div>
                                        ))
                                    ) : (
                                        <div style={{ textAlign: 'center', padding: '2rem', background: 'var(--color-bg-page)', borderRadius: '8px', color: 'var(--color-text-secondary)' }}>
                                            <User size={24} style={{ margin: '0 auto 0.5rem', opacity: 0.5 }} />
                                            <p>No other team members yet.</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Billing Tab */}
                    {activeTab === 'billing' && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                            {/* Current Plan */}
                            <div className="card">
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem' }}>
                                    <div>
                                        <h2 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '0.25rem' }}>Current Plan</h2>
                                        <p style={{ fontSize: '0.9rem', color: 'var(--color-text-secondary)' }}>
                                            Manage your subscription and billing
                                        </p>
                                    </div>
                                    <button onClick={() => navigate('/pricing')} className="btn btn-primary">
                                        <Crown size={16} /> Upgrade
                                    </button>
                                </div>

                                <div style={{
                                    padding: '1.25rem',
                                    background: 'var(--color-bg-page)',
                                    borderRadius: '12px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'space-between'
                                }}>
                                    <div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.375rem' }}>
                                            <span style={{ fontSize: '1.25rem', fontWeight: 700 }}>{currentPlan.name}</span>
                                            <span style={{
                                                fontSize: '0.7rem',
                                                fontWeight: 600,
                                                padding: '0.2rem 0.5rem',
                                                background: '#ecfdf5',
                                                color: '#047857',
                                                borderRadius: '4px'
                                            }}>
                                                ACTIVE
                                            </span>
                                        </div>
                                        <p style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)' }}>
                                            {currentPlan.description}
                                        </p>
                                    </div>
                                    <div style={{ textAlign: 'right' }}>
                                        <div style={{ fontSize: '1.5rem', fontWeight: 800 }}>{currentPlan.price}</div>
                                        <div style={{ fontSize: '0.8rem', color: 'var(--color-text-tertiary)' }}>/{currentPlan.period}</div>
                                    </div>
                                </div>

                                <div style={{ marginTop: '1.25rem' }}>
                                    <div style={{ fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.75rem' }}>Plan Features:</div>
                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.5rem' }}>
                                        {currentPlan.features.map((feature, i) => (
                                            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem' }}>
                                                <Check size={14} color="#10b981" />
                                                {feature}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            {/* Billing History */}
                            <div className="card">
                                <h3 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '1rem' }}>Billing History</h3>
                                {isDemo ? (
                                    <p style={{ fontSize: '0.9rem', color: 'var(--color-text-secondary)' }}>
                                        No billing history in demo mode.
                                    </p>
                                ) : (
                                    <div style={{ borderRadius: '8px', border: '1px solid var(--color-border)', overflow: 'hidden' }}>
                                        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
                                            <thead>
                                                <tr style={{ background: 'var(--color-bg-page)' }}>
                                                    <th style={{ padding: '0.75rem', textAlign: 'left', fontWeight: 600 }}>Date</th>
                                                    <th style={{ padding: '0.75rem', textAlign: 'left', fontWeight: 600 }}>Description</th>
                                                    <th style={{ padding: '0.75rem', textAlign: 'right', fontWeight: 600 }}>Amount</th>
                                                    <th style={{ padding: '0.75rem', textAlign: 'center', fontWeight: 600 }}>Status</th>
                                                    <th style={{ padding: '0.75rem', textAlign: 'center', fontWeight: 600 }}></th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {billingHistory.map((item, i) => (
                                                    <tr key={i} style={{ borderTop: '1px solid var(--color-border)' }}>
                                                        <td style={{ padding: '0.75rem' }}>{item.date}</td>
                                                        <td style={{ padding: '0.75rem' }}>{item.description}</td>
                                                        <td style={{ padding: '0.75rem', textAlign: 'right', fontWeight: 600 }}>{item.amount}</td>
                                                        <td style={{ padding: '0.75rem', textAlign: 'center' }}>
                                                            <span style={{
                                                                fontSize: '0.75rem',
                                                                padding: '0.2rem 0.5rem',
                                                                background: '#ecfdf5',
                                                                color: '#047857',
                                                                borderRadius: '4px'
                                                            }}>
                                                                {item.status}
                                                            </span>
                                                        </td>
                                                        <td style={{ padding: '0.75rem', textAlign: 'center' }}>
                                                            <button style={{
                                                                background: 'transparent',
                                                                border: 'none',
                                                                cursor: 'pointer',
                                                                color: 'var(--color-text-tertiary)'
                                                            }}>
                                                                <Download size={16} />
                                                            </button>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Notifications Tab */}
                    {activeTab === 'notifications' && (
                        <div className="card">
                            <h2 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '1.5rem' }}>Notification Preferences</h2>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                {[
                                    { id: 'alerts', label: 'Compliance Alerts', desc: 'Get notified when critical compliance issues are detected', default: true },
                                    { id: 'visa', label: 'Visa Expiry Reminders', desc: 'Receive reminders before sponsored worker visas expire', default: true },
                                    { id: 'weekly', label: 'Weekly Digest', desc: 'Weekly summary of your compliance status', default: true },
                                    { id: 'news', label: 'Regulatory Updates', desc: 'News about CQC changes and regulatory updates', default: false },
                                    { id: 'marketing', label: 'Product Updates', desc: 'Learn about new features and improvements', default: false }
                                ].map(item => (
                                    <div key={item.id} style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'space-between',
                                        padding: '1rem',
                                        background: 'var(--color-bg-page)',
                                        borderRadius: '8px'
                                    }}>
                                        <div>
                                            <div style={{ fontWeight: 600, fontSize: '0.9rem', marginBottom: '0.25rem' }}>{item.label}</div>
                                            <div style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)' }}>{item.desc}</div>
                                        </div>
                                        <label style={{ position: 'relative', display: 'inline-block', width: '44px', height: '24px' }}>
                                            <input type="checkbox" defaultChecked={item.default} style={{ opacity: 0, width: 0, height: 0 }} />
                                            <span style={{
                                                position: 'absolute',
                                                cursor: 'pointer',
                                                inset: 0,
                                                background: item.default ? '#10b981' : '#cbd5e1',
                                                borderRadius: '24px',
                                                transition: 'all 0.3s'
                                            }}>
                                                <span style={{
                                                    position: 'absolute',
                                                    height: '18px',
                                                    width: '18px',
                                                    left: item.default ? '22px' : '3px',
                                                    bottom: '3px',
                                                    background: 'white',
                                                    borderRadius: '50%',
                                                    transition: 'all 0.3s'
                                                }} />
                                            </span>
                                        </label>
                                    </div>
                                ))}
                            </div>
                            <button className="btn btn-primary" style={{ marginTop: '1.5rem' }}>Save Preferences</button>
                        </div>
                    )}

                    {/* Security Tab */}
                    {activeTab === 'security' && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                            <div className="card">
                                <h2 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '1.5rem' }}>Change Password</h2>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', maxWidth: '400px' }}>
                                    <div>
                                        <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.5rem' }}>
                                            Current Password
                                        </label>
                                        <input type="password" className="form-input" placeholder="••••••••" />
                                    </div>
                                    <div>
                                        <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.5rem' }}>
                                            New Password
                                        </label>
                                        <input type="password" className="form-input" placeholder="••••••••" />
                                    </div>
                                    <div>
                                        <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.5rem' }}>
                                            Confirm New Password
                                        </label>
                                        <input type="password" className="form-input" placeholder="••••••••" />
                                    </div>
                                    <button className="btn btn-primary" style={{ width: 'fit-content' }}>Update Password</button>
                                </div>
                            </div>

                            <div className="card">
                                <h3 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '1rem' }}>Two-Factor Authentication</h3>
                                <p style={{ fontSize: '0.9rem', color: 'var(--color-text-secondary)', marginBottom: '1rem' }}>
                                    Add an extra layer of security to your account with 2FA.
                                </p>
                                <button className="btn btn-secondary">
                                    <Shield size={16} /> Enable 2FA
                                </button>
                            </div>

                            <div className="card" style={{ borderColor: '#fecaca' }}>
                                <h3 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '0.5rem', color: '#dc2626' }}>Danger Zone</h3>
                                <p style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)', marginBottom: '1rem' }}>
                                    Permanently delete your account and all associated data. This action cannot be undone.
                                </p>
                                <button className="btn" style={{ background: '#fef2f2', color: '#dc2626', border: '1px solid #fecaca' }}>
                                    Delete Account
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
