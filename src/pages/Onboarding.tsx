import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Check } from 'lucide-react';

import { useCompliance } from '../context/ComplianceContext';

export const Onboarding = () => {
    const navigate = useNavigate();
    const { completeOnboarding } = useCompliance();
    const [formData, setFormData] = useState({
        serviceType: 'domiciliary',
        cqcStatus: 'active',
        sponsorStatus: 'yes',
        staffCount: '',
        serviceUsers: '',
        managerQual: 'level5'
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        completeOnboarding({
            serviceType: formData.serviceType,
            cqcStatus: formData.cqcStatus as any,
            sponsorStatus: formData.sponsorStatus as any,
            staffCount: parseInt(formData.staffCount) || 0,
            serviceUsers: parseInt(formData.serviceUsers) || 0
        });
        navigate('/dashboard');
    };

    return (
        <div className="container" style={{ padding: '4rem 1rem', maxWidth: '600px' }}>
            <div className="card animate-enter">
                <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
                    <h1 style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>🏢 Let’s get you set up!</h1>
                    <p style={{ color: 'var(--color-text-secondary)' }}>Tell us about your service to personalize your compliance tools.</p>
                </div>

                <form onSubmit={handleSubmit}>

                    {/* Service Type */}
                    <div className="form-group">
                        <label className="form-label">Service Type</label>
                        <div className="radio-group">
                            {[
                                { id: 'domiciliary', label: 'Domiciliary Care' },
                                { id: 'supported', label: 'Supported Living' },
                                { id: 'carehome', label: 'Care Home (Residential/Nursing)' }
                            ].map(opt => (
                                <div
                                    key={opt.id}
                                    className={`radio-option ${formData.serviceType === opt.id ? 'selected' : ''}`}
                                    onClick={() => setFormData({ ...formData, serviceType: opt.id })}
                                >
                                    <div className="radio-circle"></div>
                                    <span>{opt.label}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* CQC Status */}
                    <div className="form-group">
                        <label className="form-label">CQC Registered?</label>
                        <div className="flex gap-2">
                            {[
                                { id: 'active', label: 'Yes – Active' },
                                { id: 'applying', label: 'Applying' },
                                { id: 'notyet', label: 'Not yet' }
                            ].map(opt => (
                                <button
                                    type="button"
                                    key={opt.id}
                                    className={`btn ${formData.cqcStatus === opt.id ? 'btn-primary' : 'btn-secondary'}`}
                                    style={{ flex: 1 }}
                                    onClick={() => setFormData({ ...formData, cqcStatus: opt.id })}
                                >
                                    {formData.cqcStatus === opt.id && <Check size={14} />} {opt.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Sponsor Status */}
                    <div className="form-group">
                        <label className="form-label">Home Office Sponsor?</label>
                        <div className="flex gap-2">
                            {[{ id: 'yes', label: 'Yes' }, { id: 'no', label: 'No' }].map(opt => (
                                <button
                                    type="button"
                                    key={opt.id}
                                    className={`btn ${formData.sponsorStatus === opt.id ? 'btn-primary' : 'btn-secondary'}`}
                                    style={{ flex: 1 }}
                                    onClick={() => setFormData({ ...formData, sponsorStatus: opt.id })}
                                >
                                    {opt.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Counts */}
                    <div className="flex gap-4">
                        <div className="form-group" style={{ flex: 1 }}>
                            <label className="form-label">Staff Count</label>
                            <input
                                type="number"
                                className="form-input"
                                placeholder="e.g. 12"
                                value={formData.staffCount}
                                onChange={e => setFormData({ ...formData, staffCount: e.target.value })}
                            />
                        </div>
                        <div className="form-group" style={{ flex: 1 }}>
                            <label className="form-label">Service Users</label>
                            <input
                                type="number"
                                className="form-input"
                                placeholder="e.g. 25"
                                value={formData.serviceUsers}
                                onChange={e => setFormData({ ...formData, serviceUsers: e.target.value })}
                            />
                        </div>
                    </div>

                    {/* Manager Qual */}
                    <div className="form-group">
                        <label className="form-label">Registered Manager Qualification</label>
                        <select
                            className="form-select"
                            value={formData.managerQual}
                            onChange={e => setFormData({ ...formData, managerQual: e.target.value })}
                        >
                            <option value="level5">Level 5 Diploma</option>
                            <option value="other">Other</option>
                            <option value="progress">In Progress</option>
                        </select>
                    </div>

                    <div className="mt-4">
                        <button type="submit" className="btn btn-primary btn-full" style={{ padding: '0.75rem' }}>
                            Save & Go to Dashboard <ArrowRight size={16} />
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};
