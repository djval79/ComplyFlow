import React from 'react';
import { User, Bell, Shield, Key, Building } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useCompliance } from '../context/ComplianceContext';

export const Settings = () => {
    const { profile, updateProfile } = useAuth();
    const { companyName } = useCompliance();

    return (
        <div className="container animate-enter" style={{ padding: '2rem 1rem' }}>
            <h1 style={{ fontSize: '1.8rem', fontWeight: 700, marginBottom: '2rem' }}>Settings</h1>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

                {/* Sidebar */}
                <div className="card h-fit">
                    <nav className="space-y-1">
                        <button className="flex items-center gap-3 px-3 py-2 text-sm font-medium bg-primary/10 text-primary rounded-md w-full">
                            <User size={18} /> Profile
                        </button>
                        <button className="flex items-center gap-3 px-3 py-2 text-sm font-medium text-secondary hover:bg-surface rounded-md w-full text-left">
                            <Building size={18} /> Organization
                        </button>
                        <button className="flex items-center gap-3 px-3 py-2 text-sm font-medium text-secondary hover:bg-surface rounded-md w-full text-left">
                            <Bell size={18} /> Notifications
                        </button>
                        <button className="flex items-center gap-3 px-3 py-2 text-sm font-medium text-secondary hover:bg-surface rounded-md w-full text-left">
                            <Shield size={18} /> Security
                        </button>
                    </nav>
                </div>

                {/* Content */}
                <div className="md:col-span-2 space-y-6">

                    {/* Profile Section */}
                    <div className="card">
                        <h2 className="text-lg font-semibold mb-4">Profile Information</h2>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-secondary mb-1">Full Name</label>
                                <input
                                    type="text"
                                    className="form-input w-full"
                                    defaultValue={profile?.full_name || ''}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-secondary mb-1">Email Address</label>
                                <input
                                    type="email"
                                    className="form-input w-full bg-surface"
                                    defaultValue={profile?.email || ''}
                                    disabled
                                />
                            </div>
                            <button className="btn btn-primary" onClick={() => alert('Profile updated!')}>
                                Save Changes
                            </button>
                        </div>
                    </div>

                    {/* Organization Section */}
                    <div className="card">
                        <h2 className="text-lg font-semibold mb-4">Organization Details</h2>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-secondary mb-1">Company Name</label>
                                <input
                                    type="text"
                                    className="form-input w-full"
                                    defaultValue={companyName}
                                    disabled
                                />
                            </div>
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
};
