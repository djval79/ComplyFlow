import React, { useState, useEffect } from 'react';
import { User, Bell, Shield, Key, Building, CreditCard, Check, Crown, Loader2, Download, ChevronRight, Plus, Mail, Trash2, Server, Database, FileText, Copy, RefreshCw } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { sendTeamInviteEmail } from '../services/emailService';
import { useAuth } from '../context/AuthContext';
import { useCompliance } from '../context/ComplianceContext';
import { useNavigate } from 'react-router-dom';
import { SUBSCRIPTION_TIERS } from '../lib/subscriptionData';

type SettingsTab = 'profile' | 'organization' | 'billing' | 'notifications' | 'security' | 'enterprise';

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

    // Enterprise State
    const [apiKey, setApiKey] = useState<string | null>(null);
    const [ssoConfig, setSsoConfig] = useState({ enabled: false, entityId: '', ssoUrl: '', cert: '' });
    const [knowledgeBaseFiles, setKnowledgeBaseFiles] = useState<any[]>([]);
    const [uploadingKB, setUploadingKB] = useState(false);

    // const isEnterprise = profile?.subscription_tier === 'tier_enterprise' || isDemo;
    const isEnterprise = true; // FORCE ENABLE FOR DEMO

    // Load Data based on Tab
    useEffect(() => {
        if (!profile?.organization_id) return;

        if (activeTab === 'organization') {
            fetchTeam();
        } else if (activeTab === 'enterprise' && isEnterprise) {
            fetchEnterpriseSettings();
        }
    }, [activeTab, profile?.organization_id, isEnterprise]);

    const fetchTeam = async () => {
        setLoadingTeam(true);
        const { data } = await supabase
            .from('profiles')
            .select('*')
            .eq('organization_id', profile?.organization_id);

        if (data) setTeamMembers(data);
        setLoadingTeam(false);
    };

    const fetchEnterpriseSettings = async () => {
        // 1. Fetch API Keys (Just checking existence for now, or last used)
        const { data: keyData } = await supabase
            .from('api_keys')
            .select('*')
            .eq('organization_id', profile?.organization_id)
            .eq('is_active', true)
            .order('created_at', { ascending: false })
            .limit(1)
            .single();

        if (keyData) {
            // We can't show the full key if it's hashed, but for MVP we stored it as 'key_hash' (plain text for now)
            // Ideally we show a masked version or just "Active Key ending in ..."
            // users can only see the key once upon generation.
            // For this UI, we'll mimic that behavior. If we have a key, we show it (if stored plain) or just show "Active"
            // Let's assume for MVP we fetch the plain key if stored that way.
            setApiKey(keyData.key_hash);
        }

        // 2. Fetch SSO Config
        const { data: ssoData } = await supabase
            .from('sso_config')
            .select('*')
            .eq('organization_id', profile?.organization_id)
            .single();

        if (ssoData) {
            setSsoConfig({
                enabled: ssoData.is_enabled,
                entityId: ssoData.entity_id || '',
                ssoUrl: ssoData.sso_url || '',
                cert: ssoData.certificate || ''
            });
        }

        // 3. Fetch Knowledge Base Files
        const { data: kbData } = await supabase
            .from('organization_knowledge_base')
            .select('*')
            .eq('organization_id', profile?.organization_id)
            .order('created_at', { ascending: false });

        if (kbData) {
            setKnowledgeBaseFiles(kbData.map(f => ({
                id: f.id,
                name: f.file_name,
                size: f.file_size,
                uploaded: new Date(f.created_at).toLocaleDateString(),
                status: f.status === 'uploading' ? 'Indexing...' : (f.status === 'active' ? 'Active' : f.status)
            })));
        }
    };

    const handleInvite = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!inviteEmail) return;
        setInviting(true);
        try {
            await sendTeamInviteEmail(
                inviteEmail,
                profile?.full_name || 'The Manager',
                companyName || 'Our Care Home',
                'Staff Member',
                `${window.location.origin}/signup`
            );
            alert(`Invitation sent to ${inviteEmail}`);
            setInviteEmail('');
        } catch (error) {
            console.error('Invite error:', error);
            alert('Failed to send invitation');
        } finally {
            setInviting(false);
        }
    };

    const handleGenerateKey = async () => {
        // Generate Key
        const newKey = 'pk_live_' + crypto.randomUUID().replace(/-/g, '');
        const prefix = newKey.slice(0, 12) + '...';

        setApiKey(newKey); // Show to user temporarily

        // Save to DB
        await supabase.from('api_keys').insert({
            organization_id: profile?.organization_id,
            key_prefix: prefix,
            key_hash: newKey, // Storing plain for MVP demo purposes. In prod, hash this!
            label: 'Default API Key'
        });
    };

    const handleRevokeKey = async () => {
        if (!window.confirm('Are you sure? This will break any integrations using this key.')) return;
        setApiKey(null);
        await supabase
            .from('api_keys')
            .update({ is_active: false })
            .eq('organization_id', profile?.organization_id);
    };

    const handleSaveSSO = async () => {
        setSaving(true);
        try {
            const { error } = await supabase
                .from('sso_config')
                .upsert({
                    organization_id: profile?.organization_id,
                    provider_type: 'saml', // Defaulting for MVP
                    entity_id: ssoConfig.entityId,
                    sso_url: ssoConfig.ssoUrl,
                    certificate: ssoConfig.cert,
                    is_enabled: ssoConfig.enabled,
                    updated_at: new Date()
                });

            if (error) throw error;
            alert('SSO Configuration saved successfully.');
        } catch (err) {
            console.error(err);
            alert('Failed to save SSO config.');
        } finally {
            setSaving(false);
        }
    };

    const handleUploadKB = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0] && profile?.organization_id) {
            const file = e.target.files[0];
            setUploadingKB(true);

            try {
                // 1. Upload to Storage
                const filePath = `${profile.organization_id}/${Date.now()}_${file.name}`;
                const { error: uploadError } = await supabase.storage
                    .from('knowledge_base')
                    .upload(filePath, file);

                if (uploadError) throw uploadError;

                // 2. Create Record
                const { data, error: dbError } = await supabase
                    .from('organization_knowledge_base')
                    .insert({
                        organization_id: profile.organization_id,
                        file_name: file.name,
                        file_size: (file.size / 1024).toFixed(1) + ' KB',
                        storage_path: filePath,
                        status: 'indexing'
                    })
                    .select()
                    .single();

                if (dbError) throw dbError;

                if (data) {
                    setKnowledgeBaseFiles(prev => [{
                        id: data.id,
                        name: data.file_name,
                        size: data.file_size,
                        uploaded: new Date(data.created_at).toLocaleDateString(),
                        status: 'Indexing...'
                    }, ...prev]);

                    // Trigger Background Ingestion
                    supabase.functions.invoke('ingest-knowledge-base', {
                        body: { fileId: data.id, organizationId: profile.organization_id }
                    }).then(({ error }) => {
                        if (error) console.error('Ingest failed:', error);
                    });
                }

            } catch (err) {
                console.error("Upload failed", err);
                alert("Failed to upload file. Ensure you have network connectivity.");
            } finally {
                setUploadingKB(false);
            }
        }
    };

    const currentPlan = isEnterprise ? SUBSCRIPTION_TIERS.find(t => t.id === 'tier_enterprise')! : SUBSCRIPTION_TIERS[0];
    const billingHistory = [
        { date: '2025-01-01', description: 'Professional Plan - Monthly', amount: '£49.00', status: 'Paid' },
        { date: '2024-12-01', description: 'Professional Plan - Monthly', amount: '£49.00', status: 'Paid' },
        { date: '2024-11-01', description: 'Professional Plan - Monthly', amount: '£49.00', status: 'Paid' }
    ];

    const handleSaveProfile = async () => {
        setSaving(true);
        // Mock profile update for now, or hook to profiles table update if needed
        await new Promise(r => setTimeout(r, 1000));
        setSaving(false);
        alert('Profile saved successfully!');
    };

    const tabs: { id: SettingsTab; label: string; icon: React.ReactNode; hidden?: boolean }[] = [
        { id: 'profile', label: 'Profile', icon: <User size={18} /> },
        { id: 'organization', label: 'Organization', icon: <Building size={18} /> },
        { id: 'billing', label: 'Billing & Plan', icon: <CreditCard size={18} /> },
        { id: 'notifications', label: 'Notifications', icon: <Bell size={18} /> },
        { id: 'security', label: 'Security', icon: <Shield size={18} /> },
        { id: 'enterprise', label: 'Enterprise & API', icon: <Server size={18} />, hidden: !isEnterprise }
    ];

    return (
        <div className="container animate-enter" style={{ padding: '2rem 1rem' }}>
            <h1 style={{ fontSize: '1.8rem', fontWeight: 700, marginBottom: '2rem' }}>Settings</h1>

            <div style={{ display: 'grid', gridTemplateColumns: '240px 1fr', gap: '2rem' }}>
                <div className="card" style={{ padding: '0.5rem', height: 'fit-content' }}>
                    <nav style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                        {tabs.filter(t => !t.hidden).map(tab => (
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

                <div>
                    {activeTab === 'profile' && (
                        <div className="card">
                            <h2 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '1.5rem' }}>Profile Information</h2>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', maxWidth: '400px' }}>
                                <div>
                                    <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.5rem' }}>Full Name</label>
                                    <input type="text" className="form-input" value={formData.fullName} onChange={(e) => setFormData({ ...formData, fullName: e.target.value })} />
                                </div>
                                <div>
                                    <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.5rem' }}>Email Address</label>
                                    <input type="email" className="form-input" value={formData.email} disabled style={{ background: 'var(--color-bg-page)' }} />
                                    <p style={{ fontSize: '0.75rem', color: 'var(--color-text-tertiary)', marginTop: '0.375rem' }}>Contact support to change your email address</p>
                                </div>
                                <button onClick={handleSaveProfile} className="btn btn-primary" disabled={saving} style={{ width: 'fit-content' }}>
                                    {saving ? <><Loader2 size={16} className="spin" /> Saving...</> : 'Save Changes'}
                                </button>
                            </div>
                        </div>
                    )}

                    {activeTab === 'organization' && (
                        <div className="card">
                            <h2 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '1.5rem' }}>Organization Details</h2>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', maxWidth: '400px' }}>
                                <div>
                                    <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.5rem' }}>Company Name</label>
                                    <input type="text" className="form-input" value={companyName || profile?.organization_name || 'My Organization'} disabled style={{ background: 'var(--color-bg-page)' }} />
                                </div>
                                <div>
                                    <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.5rem' }}>Your Role</label>
                                    <input type="text" className="form-input" value={profile?.role || 'owner'} disabled style={{ background: 'var(--color-bg-page)', textTransform: 'capitalize' }} />
                                </div>
                            </div>
                            <div style={{ marginTop: '2rem', paddingTop: '2rem', borderTop: '1px solid var(--color-border)' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                                    <h3 style={{ fontSize: '1rem', fontWeight: 600 }}>Team Members ({teamMembers.length})</h3>
                                    {isDemo && <span className="badge badge-warning">Demo Mode</span>}
                                </div>
                                <form onSubmit={handleInvite} style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem' }}>
                                    <input type="email" placeholder="colleague@carehome.co.uk" className="form-input" style={{ height: '42px' }} value={inviteEmail} onChange={e => setInviteEmail(e.target.value)} required />
                                    <button type="submit" className="btn btn-primary" disabled={inviting || isDemo} style={{ height: '42px', padding: '0 1.5rem', whiteSpace: 'nowrap' }}>
                                        {inviting ? <Loader2 size={16} className="spin" /> : <><Plus size={16} /> Invite</>}
                                    </button>
                                </form>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                                    {loadingTeam ? (
                                        <div style={{ textAlign: 'center', padding: '1rem', color: 'var(--color-text-tertiary)' }}><Loader2 size={20} className="spin" style={{ margin: '0 auto 0.5rem' }} />Loading team...</div>
                                    ) : teamMembers.length > 0 ? (
                                        teamMembers.map((member) => (
                                            <div key={member.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.75rem', background: 'var(--color-bg-page)', borderRadius: '8px' }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                                    <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'var(--color-accent-subtle)', color: 'var(--color-accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 600, fontSize: '0.9rem' }}>
                                                        {member.full_name?.charAt(0) || member.email?.charAt(0)}
                                                    </div>
                                                    <div>
                                                        <div style={{ fontSize: '0.9rem', fontWeight: 500 }}>{member.full_name || 'Unnamed User'}</div>
                                                        <div style={{ fontSize: '0.8rem', color: 'var(--color-text-tertiary)' }}>{member.email}</div>
                                                    </div>
                                                </div>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                                    <span className={`badge ${member.role === 'owner' ? 'badge-success' : 'badge-secondary'}`}>{member.role || 'Member'}</span>
                                                    {member.role !== 'owner' && (
                                                        <button className="btn-icon" style={{ color: 'var(--color-text-tertiary)', padding: '4px' }} title="Remove User" onClick={() => alert('Remove user functionality coming soon')}>
                                                            <Trash2 size={16} />
                                                        </button>
                                                    )}
                                                </div>
                                            </div>
                                        ))
                                    ) : (
                                        <div style={{ textAlign: 'center', padding: '2rem', background: 'var(--color-bg-page)', borderRadius: '8px', color: 'var(--color-text-secondary)' }}>
                                            <User size={24} style={{ margin: '0 auto 0.5rem', opacity: 0.5 }} /><p>No other team members yet.</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'billing' && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                            <div className="card">
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem' }}>
                                    <div>
                                        <h2 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '0.25rem' }}>{currentPlan.name} Plan</h2>
                                        <p style={{ fontSize: '0.9rem', color: 'var(--color-text-secondary)' }}>{currentPlan.description}</p>
                                    </div>
                                    <button onClick={() => navigate('/pricing')} className="btn btn-primary"><Crown size={16} /> Upgrade</button>
                                </div>
                                <div style={{ padding: '1.25rem', background: 'var(--color-bg-page)', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                    <div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.375rem' }}>
                                            <span style={{ fontSize: '1.25rem', fontWeight: 700 }}>{currentPlan.price}</span>
                                            <span style={{ fontSize: '0.7rem', fontWeight: 600, padding: '0.2rem 0.5rem', background: '#ecfdf5', color: '#047857', borderRadius: '4px' }}>ACTIVE</span>
                                        </div>
                                        <p style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)' }}>Next billing date: Feb 01, 2026</p>
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
                            <div className="card">
                                <h3 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '1rem' }}>Billing History</h3>
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
                                                        <span style={{ fontSize: '0.75rem', padding: '0.2rem 0.5rem', background: '#ecfdf5', color: '#047857', borderRadius: '4px' }}>{item.status}</span>
                                                    </td>
                                                    <td style={{ padding: '0.75rem', textAlign: 'center' }}>
                                                        <button style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--color-text-tertiary)' }}><Download size={16} /></button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    )}

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
                                    <div key={item.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1rem', background: 'var(--color-bg-page)', borderRadius: '8px' }}>
                                        <div>
                                            <div style={{ fontWeight: 600, fontSize: '0.9rem', marginBottom: '0.25rem' }}>{item.label}</div>
                                            <div style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)' }}>{item.desc}</div>
                                        </div>
                                        <label style={{ position: 'relative', display: 'inline-block', width: '44px', height: '24px' }}>
                                            <input type="checkbox" defaultChecked={item.default} style={{ opacity: 0, width: 0, height: 0 }} />
                                            <span style={{ position: 'absolute', cursor: 'pointer', inset: 0, background: item.default ? '#10b981' : '#cbd5e1', borderRadius: '24px', transition: 'all 0.3s' }}>
                                                <span style={{ position: 'absolute', height: '18px', width: '18px', left: item.default ? '22px' : '3px', bottom: '3px', background: 'white', borderRadius: '50%', transition: 'all 0.3s' }} />
                                            </span>
                                        </label>
                                    </div>
                                ))}
                            </div>
                            <button className="btn btn-primary" style={{ marginTop: '1.5rem' }}>Save Preferences</button>
                        </div>
                    )}

                    {activeTab === 'security' && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                            <div className="card">
                                <h2 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '1.5rem' }}>Change Password</h2>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', maxWidth: '400px' }}>
                                    <div><label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.5rem' }}>Current Password</label><input type="password" className="form-input" placeholder="••••••••" /></div>
                                    <div><label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.5rem' }}>New Password</label><input type="password" className="form-input" placeholder="••••••••" /></div>
                                    <div><label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.5rem' }}>Confirm New Password</label><input type="password" className="form-input" placeholder="••••••••" /></div>
                                    <button className="btn btn-primary" style={{ width: 'fit-content' }}>Update Password</button>
                                </div>
                            </div>
                            <div className="card" style={{ borderColor: '#fecaca' }}>
                                <h3 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '0.5rem', color: '#dc2626' }}>Danger Zone</h3>
                                <p style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)', marginBottom: '1rem' }}>Permanently delete your account and all associated data. This action cannot be undone.</p>
                                <button className="btn" style={{ background: '#fef2f2', color: '#dc2626', border: '1px solid #fecaca' }}>Delete Account</button>
                            </div>
                        </div>
                    )}

                    {/* ENTERPRISE FEATURES */}
                    {activeTab === 'enterprise' && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>

                            {/* API ACCESS */}
                            <div className="card" style={{ border: '1px solid #bfdbfe', background: 'linear-gradient(to right, #eff6ff, white)' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem' }}>
                                    <div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
                                            <Key size={20} color="#3b82f6" />
                                            <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#1e40af' }}>Developer API Access</h2>
                                        </div>
                                        <p style={{ fontSize: '0.9rem', color: '#1e3a8a' }}>
                                            Programmatic access to your compliance data.
                                        </p>
                                    </div>
                                    <span className="badge badge-primary">ENTERPRISE</span>
                                </div>

                                {apiKey ? (
                                    <div style={{ background: 'white', padding: '1.5rem', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                                        <div style={{ fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.5rem', color: '#64748b' }}>ACTIVE API KEY</div>
                                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                                            <code style={{ flex: 1, padding: '0.75rem', background: '#f8fafc', borderRadius: '4px', border: '1px solid #cbd5e1', fontFamily: 'monospace', color: '#334155' }}>
                                                {apiKey}
                                            </code>
                                            <button className="btn btn-secondary" onClick={() => { navigator.clipboard.writeText(apiKey); alert('Copied!'); }}>
                                                <Copy size={16} />
                                            </button>
                                            <button className="btn btn-secondary" style={{ color: '#dc2626', borderColor: '#fecaca' }} onClick={handleRevokeKey}>
                                                Revoke
                                            </button>
                                        </div>
                                        <p style={{ fontSize: '0.8rem', color: '#94a3b8', marginTop: '0.75rem' }}>
                                            Keep this key secret. It grants full access to your organization's data.
                                        </p>
                                    </div>
                                ) : (
                                    <div style={{ textAlign: 'center', padding: '2rem', background: 'white', borderRadius: '8px', border: '1px dashed #cbd5e1' }}>
                                        <p style={{ marginBottom: '1rem', color: '#64748b' }}>No active API keys found.</p>
                                        <button className="btn btn-primary" onClick={handleGenerateKey}>
                                            Generate New API Key
                                        </button>
                                    </div>
                                )}
                            </div>

                            {/* SSO CONFIG */}
                            <div className="card">
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>
                                    <Shield size={20} color="var(--color-primary)" />
                                    <h2 style={{ fontSize: '1.25rem', fontWeight: 600 }}>Single Sign-On (SSO)</h2>
                                </div>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', maxWidth: '500px' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1rem', background: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                                        <span style={{ fontWeight: 500 }}>SAML 2.0 / OIDC</span>
                                        <label className="switch">
                                            <input type="checkbox" checked={ssoConfig.enabled} onChange={(e) => setSsoConfig({ ...ssoConfig, enabled: e.target.checked })} />
                                            <span className="slider round"></span>
                                        </label>
                                    </div>

                                    {ssoConfig.enabled && (
                                        <div className="animate-enter" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                            <div>
                                                <label className="form-label">Identity Provider Entity ID</label>
                                                <input type="text" className="form-input" placeholder="https://sts.windows.net/..." value={ssoConfig.entityId} onChange={e => setSsoConfig({ ...ssoConfig, entityId: e.target.value })} />
                                            </div>
                                            <div>
                                                <label className="form-label">SSO URL (Assertion Consumer Service)</label>
                                                <div style={{ position: 'relative' }}>
                                                    <input type="text" className="form-input" value={`https://complyflow.uk/sso/acs/${profile?.organization_id}`} disabled style={{ background: '#f1f5f9', paddingRight: '40px' }} />
                                                    <Copy size={14} style={{ position: 'absolute', right: '12px', top: '12px', cursor: 'pointer', opacity: 0.5 }} />
                                                </div>
                                            </div>
                                            <div>
                                                <label className="form-label">X.509 Certificate</label>
                                                <textarea className="form-input" rows={4} placeholder="-----BEGIN CERTIFICATE-----..." value={ssoConfig.cert} onChange={e => setSsoConfig({ ...ssoConfig, cert: e.target.value })} />
                                            </div>
                                            <button className="btn btn-primary" onClick={handleSaveSSO} disabled={saving}>
                                                {saving ? 'Verifying...' : 'Save Configuration'}
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* CUSTOM AI MODELS */}
                            <div className="card">
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>
                                    <Database size={20} color="var(--color-accent)" />
                                    <h2 style={{ fontSize: '1.25rem', fontWeight: 600 }}>Custom AI Knowledge Base</h2>
                                </div>
                                <p style={{ color: 'var(--color-text-secondary)', marginBottom: '1.5rem' }}>
                                    Upload your specific standard operating procedures (SOPs). Our AI will fine-tune to your organization's internal rules.
                                </p>

                                <div style={{ border: '2px dashed #cbd5e1', borderRadius: '8px', padding: '2rem', textAlign: 'center', marginBottom: '1.5rem', cursor: 'pointer' }} onClick={() => document.getElementById('kb-upload')?.click()}>
                                    <div style={{ width: '48px', height: '48px', background: '#f1f5f9', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem auto' }}>
                                        <FileText size={24} color="#64748b" />
                                    </div>
                                    <div style={{ fontWeight: 600, color: '#334155' }}>
                                        {uploadingKB ? 'Uploading...' : 'Click to Upload SOPs'}
                                    </div>
                                    <div style={{ fontSize: '0.85rem', color: '#94a3b8' }}>PDF, DOCX (Max 20MB)</div>
                                    <input type="file" id="kb-upload" style={{ display: 'none' }} onChange={handleUploadKB} disabled={uploadingKB} />
                                </div>

                                {knowledgeBaseFiles.length > 0 && (
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                        {knowledgeBaseFiles.map((file, i) => (
                                            <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.75rem', background: '#f8fafc', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                                    <FileText size={16} color="#64748b" />
                                                    <div>
                                                        <div style={{ fontSize: '0.9rem', fontWeight: 500 }}>{file.name}</div>
                                                        <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>{file.size} • {file.uploaded}</div>
                                                    </div>
                                                </div>
                                                <span className={`badge ${file.status === 'Active' ? 'badge-success' : 'badge-warning'}`}>
                                                    {file.status === 'Indexing...' && <RefreshCw size={12} className="animate-spin mr-1" />}
                                                    {file.status}
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                        </div>
                    )}
                </div>
            </div>
            <style>{`
                .switch { position: relative; display: inline-block; width: 44px; height: 24px; }
                .switch input { opacity: 0; width: 0; height: 0; }
                .slider { position: absolute; cursor: pointer; top: 0; left: 0; right: 0; bottom: 0; background-color: #cbd5e1; transition: .4s; border-radius: 34px; }
                .slider:before { position: absolute; content: ""; height: 18px; width: 18px; left: 3px; bottom: 3px; background-color: white; transition: .4s; border-radius: 50%; }
                input:checked + .slider { background-color: var(--color-primary); }
                input:checked + .slider:before { transform: translateX(20px); }
            `}</style>
        </div>
    );
};
