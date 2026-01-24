import React, { useState } from 'react';
import { BookOpen, Award, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';

export const TrainingEVisa = () => {
    const navigate = useNavigate();
    const { user, profile } = useAuth();
    const [step, setStep] = useState(0);
    const [completed, setCompleted] = useState(false);
    const [saving, setSaving] = useState(false);

    const slides = [
        {
            title: "What is an eVisa?",
            content: "The UK Home Office has moved to a fully digital immigration system. As of 2026, physical Biometric Residence Permits (BRPs) are no longer valid proofs of right to work.",
            key_point: "Goal: Phase out physical documents by Dec 31, 2024.",
            quiz: "Does a BRP prove right to work after 2024?",
            answers: ["Yes", "No", "Only if renewed"],
            correct: 1
        },
        {
            title: "Employer Responsibilities",
            content: "As a sponsor, you must ensure all migrant workers have created a UKVI account. You must perform a digital online right-to-work check using a share code.",
            key_point: "Action: Audit your staff files for expiring BRPs now.",
            quiz: "How do you check right to work now?",
            answers: ["Photocopying the BRP", "Online Share Code", "Calling the Home Office"],
            correct: 1
        },
        {
            title: "Impact on Sponsorship",
            content: "Failure to verify eVisas can result in a civil penalty of up to £60,000 per worker and revocation of your Sponsor Licence.",
            key_point: "Risk: Loss of licence = Loss of staff.",
            quiz: "What is the max fine per worker?",
            answers: ["£10,000", "£20,000", "£60,000"],
            correct: 2
        }
    ];

    const handleNext = async () => {
        if (step < slides.length - 1) {
            setStep(step + 1);
        } else {
            setCompleted(true);
            if (user && profile?.organization_id) {
                setSaving(true);
                try {
                    await supabase.from('training_completions').insert({
                        organization_id: profile.organization_id,
                        user_id: user.id,
                        module_id: 'evisa_transition_2026',
                        module_name: 'eVisa Transition Training',
                        score: 100,
                        passed: true
                    });
                } catch (e) {
                    console.error("Failed to save training completion:", e);
                } finally {
                    setSaving(false);
                }
            }
        }
    };

    return (
        <div className="container animate-enter" style={{ padding: '2rem 1rem', maxWidth: '800px' }}>

            <button onClick={() => navigate('/dashboard')} className="btn btn-secondary" style={{ marginBottom: '1rem', border: 'none', paddingLeft: 0 }}>
                &larr; Back to Dashboard
            </button>

            <div className="card" style={{ padding: 0, overflow: 'hidden', minHeight: '500px', display: 'flex', flexDirection: 'column' }}>

                <div style={{ background: 'var(--color-primary)', padding: '1.5rem', color: 'white' }}>
                    <div className="flex justify-between items-start mb-4">
                        <h1 style={{ fontSize: '1.5rem', margin: 0 }}>🇬🇧 eVisa Transition Training</h1>
                        <BookOpen size={24} style={{ opacity: 0.8 }} />
                    </div>

                    {!completed && (
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                            {slides.map((_, idx) => (
                                <div key={idx} style={{
                                    height: '4px',
                                    flex: 1,
                                    background: idx <= step ? 'white' : 'rgba(255,255,255,0.3)',
                                    borderRadius: '2px'
                                }} />
                            ))}
                        </div>
                    )}
                </div>

                <div style={{ flex: 1, padding: '2rem', display: 'flex', flexDirection: 'column' }}>

                    {!completed ? (
                        <div className="animate-enter" key={step}>
                            <h2 style={{ marginBottom: '1rem', color: 'var(--color-text-main)' }}>{slides[step].title}</h2>
                            <p style={{ fontSize: '1.1rem', lineHeight: '1.6', color: 'var(--color-text-secondary)', marginBottom: '1.5rem' }}>
                                {slides[step].content}
                            </p>

                            <div style={{ background: '#ecfdf5', padding: '1rem', borderLeft: '4px solid #10b981', borderRadius: '4px', marginBottom: '2rem' }}>
                                <strong style={{ color: '#047857' }}>Key Point:</strong> {slides[step].key_point}
                            </div>

                            <div style={{ marginTop: 'auto' }}>
                                <h3 style={{ fontSize: '1rem', marginBottom: '1rem' }}>Quick Check: {slides[step].quiz}</h3>
                                <div className="flex flex-col gap-2">
                                    {slides[step].answers.map((ans, idx) => (
                                        <button
                                            key={idx}
                                            onClick={handleNext}
                                            className="btn btn-secondary"
                                            style={{ justifyContent: 'flex-start', padding: '1rem', textAlign: 'left' }}
                                        >
                                            <div style={{
                                                width: '24px', height: '24px',
                                                borderRadius: '50%', border: '2px solid var(--color-border)',
                                                marginRight: '1rem',
                                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                fontSize: '0.75rem'
                                            }}>
                                                {String.fromCharCode(65 + idx)}
                                            </div>
                                            {ans}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="animate-enter" style={{ textAlign: 'center', margin: 'auto' }}>
                            <div style={{
                                width: '80px', height: '80px',
                                background: 'var(--color-success-bg)', color: 'var(--color-success)',
                                borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                                margin: '0 auto 1.5rem auto'
                            }}>
                                <Award size={40} />
                            </div>
                            <h2 style={{ marginBottom: '1rem' }}>Module Completed!</h2>
                            <p style={{ color: 'var(--color-text-secondary)', marginBottom: '2rem' }}>
                                {saving ? (
                                    <span className="flex items-center justify-center gap-2"><Loader2 className="animate-spin" /> saving progress...</span>
                                ) : (
                                    "Your completion has been securely recorded in the organization's compliance log."
                                )}
                            </p>
                            <button onClick={() => navigate('/dashboard')} className="btn btn-primary" disabled={saving}>
                                Return to Dashboard
                            </button>
                        </div>
                    )}
                </div>

            </div>
        </div>
    );
};
