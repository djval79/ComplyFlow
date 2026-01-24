import React, { useState, useEffect } from 'react';
import { X, ArrowRight, ArrowLeft, Check, Sparkles } from 'lucide-react';

interface TourStep {
    id: string;
    title: string;
    description: string;
    targetSelector?: string;
    position?: 'top' | 'bottom' | 'left' | 'right';
}

const TOUR_STEPS: TourStep[] = [
    {
        id: 'welcome',
        title: 'Welcome to ComplyFlow! 🎉',
        description: 'Let us show you around the key features that will help you stay CQC-ready and manage your compliance effortlessly.'
    },
    {
        id: 'gap-analysis',
        title: 'AI Gap Analysis',
        description: 'Upload your policies and our AI will identify missing CQC clauses, giving you actionable insights in minutes.',
        targetSelector: '[href="/cqc/gap-analysis"]',
        position: 'bottom'
    },
    {
        id: 'sponsor',
        title: 'Sponsor Guardian',
        description: 'Track visa expiries, Right-to-Work checks, and protect your Sponsor Licence with automated alerts.',
        targetSelector: '[href="/sponsor"]',
        position: 'bottom'
    },
    {
        id: 'templates',
        title: 'Template Library',
        description: 'Access 150+ pre-vetted compliance documents ready to download and customize for your care home.',
        targetSelector: '[href="/templates"]',
        position: 'bottom'
    },
    {
        id: 'intelligence',
        title: 'Intelligence Hub',
        description: 'Stay ahead with real-time regulatory updates and AI-powered trend analysis from CQC and Home Office.',
        targetSelector: '[href="/intelligence-hub"]',
        position: 'bottom'
    },
    {
        id: 'complete',
        title: 'You\'re All Set! ✅',
        description: 'Explore the dashboard to get started. Check the "Getting Started" widget for recommended next steps.'
    }
];

const STORAGE_KEY = 'complyflow_tour_completed';

export const ProductTour: React.FC = () => {
    const [isActive, setIsActive] = useState(false);
    const [currentStep, setCurrentStep] = useState(0);
    const [targetRect, setTargetRect] = useState<DOMRect | null>(null);

    useEffect(() => {
        // Check if tour has been completed
        const completed = localStorage.getItem(STORAGE_KEY);
        if (!completed) {
            // Delay tour start slightly to let dashboard load
            const timer = setTimeout(() => setIsActive(true), 1500);
            return () => clearTimeout(timer);
        }
    }, []);

    useEffect(() => {
        if (!isActive) return;

        const step = TOUR_STEPS[currentStep];
        if (step.targetSelector) {
            const element = document.querySelector(step.targetSelector);
            if (element) {
                const rect = element.getBoundingClientRect();
                setTargetRect(rect);
                element.scrollIntoView({ behavior: 'smooth', block: 'center' });
            } else {
                setTargetRect(null);
            }
        } else {
            setTargetRect(null);
        }
    }, [currentStep, isActive]);

    const handleNext = () => {
        if (currentStep < TOUR_STEPS.length - 1) {
            setCurrentStep(prev => prev + 1);
        }
    };

    const handlePrev = () => {
        if (currentStep > 0) {
            setCurrentStep(prev => prev - 1);
        }
    };

    const handleComplete = () => {
        localStorage.setItem(STORAGE_KEY, 'true');
        setIsActive(false);
    };

    const handleSkip = () => {
        localStorage.setItem(STORAGE_KEY, 'true');
        setIsActive(false);
    };

    if (!isActive) return null;

    const step = TOUR_STEPS[currentStep];
    const isFirst = currentStep === 0;
    const isLast = currentStep === TOUR_STEPS.length - 1;

    // Calculate tooltip position
    const getTooltipStyle = (): React.CSSProperties => {
        if (!targetRect) {
            // Center modal for welcome/complete steps
            return {
                position: 'fixed',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)'
            };
        }

        const padding = 16;
        const tooltipWidth = 340;

        switch (step.position) {
            case 'bottom':
                return {
                    position: 'fixed',
                    top: targetRect.bottom + padding,
                    left: Math.max(padding, Math.min(targetRect.left + targetRect.width / 2 - tooltipWidth / 2, window.innerWidth - tooltipWidth - padding))
                };
            case 'top':
                return {
                    position: 'fixed',
                    bottom: window.innerHeight - targetRect.top + padding,
                    left: Math.max(padding, targetRect.left + targetRect.width / 2 - tooltipWidth / 2)
                };
            default:
                return {
                    position: 'fixed',
                    top: targetRect.bottom + padding,
                    left: targetRect.left
                };
        }
    };

    return (
        <>
            {/* Overlay */}
            <div
                className="tour-overlay"
                style={{
                    position: 'fixed',
                    inset: 0,
                    background: 'rgba(15, 23, 42, 0.75)',
                    zIndex: 9998,
                    transition: 'opacity 0.3s'
                }}
                onClick={handleSkip}
            />

            {/* Spotlight cutout for target element */}
            {targetRect && (
                <div
                    className="tour-spotlight"
                    style={{
                        position: 'fixed',
                        top: targetRect.top - 8,
                        left: targetRect.left - 8,
                        width: targetRect.width + 16,
                        height: targetRect.height + 16,
                        borderRadius: '12px',
                        boxShadow: '0 0 0 9999px rgba(15, 23, 42, 0.75)',
                        zIndex: 9999,
                        pointerEvents: 'none',
                        transition: 'all 0.3s ease'
                    }}
                />
            )}

            {/* Tooltip */}
            <div
                className="tour-tooltip"
                style={{
                    ...getTooltipStyle(),
                    width: '340px',
                    background: 'white',
                    borderRadius: '16px',
                    boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
                    zIndex: 10000,
                    animation: 'fadeIn 0.3s ease-out'
                }}
            >
                {/* Header */}
                <div style={{
                    padding: '1.25rem 1.25rem 0',
                    display: 'flex',
                    alignItems: 'flex-start',
                    justifyContent: 'space-between'
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <Sparkles size={20} color="#0ea5e9" />
                        <span style={{
                            fontSize: '0.75rem',
                            fontWeight: 600,
                            color: '#0ea5e9',
                            textTransform: 'uppercase',
                            letterSpacing: '0.05em'
                        }}>
                            Step {currentStep + 1} of {TOUR_STEPS.length}
                        </span>
                    </div>
                    <button
                        onClick={handleSkip}
                        style={{
                            background: 'transparent',
                            border: 'none',
                            cursor: 'pointer',
                            color: 'var(--color-text-tertiary)',
                            padding: '0.25rem'
                        }}
                        aria-label="Skip tour"
                    >
                        <X size={18} />
                    </button>
                </div>

                {/* Content */}
                <div style={{ padding: '1rem 1.25rem 1.25rem' }}>
                    <h3 style={{
                        fontSize: '1.125rem',
                        fontWeight: 700,
                        marginBottom: '0.5rem',
                        color: 'var(--color-text-main)'
                    }}>
                        {step.title}
                    </h3>
                    <p style={{
                        fontSize: '0.9rem',
                        color: 'var(--color-text-secondary)',
                        lineHeight: 1.6,
                        marginBottom: '1.25rem'
                    }}>
                        {step.description}
                    </p>

                    {/* Progress dots */}
                    <div style={{
                        display: 'flex',
                        justifyContent: 'center',
                        gap: '0.375rem',
                        marginBottom: '1rem'
                    }}>
                        {TOUR_STEPS.map((_, i) => (
                            <div
                                key={i}
                                style={{
                                    width: i === currentStep ? '24px' : '8px',
                                    height: '8px',
                                    borderRadius: '4px',
                                    background: i === currentStep ? '#0ea5e9' : '#e2e8f0',
                                    transition: 'all 0.3s'
                                }}
                            />
                        ))}
                    </div>

                    {/* Navigation */}
                    <div style={{
                        display: 'flex',
                        gap: '0.75rem',
                        justifyContent: 'space-between'
                    }}>
                        <button
                            onClick={handlePrev}
                            disabled={isFirst}
                            className="btn btn-secondary"
                            style={{
                                flex: 1,
                                opacity: isFirst ? 0.5 : 1,
                                cursor: isFirst ? 'not-allowed' : 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '0.25rem'
                            }}
                        >
                            <ArrowLeft size={16} /> Back
                        </button>
                        {isLast ? (
                            <button
                                onClick={handleComplete}
                                className="btn btn-primary"
                                style={{
                                    flex: 1,
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: '0.25rem'
                                }}
                            >
                                <Check size={16} /> Done
                            </button>
                        ) : (
                            <button
                                onClick={handleNext}
                                className="btn btn-primary"
                                style={{
                                    flex: 1,
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: '0.25rem'
                                }}
                            >
                                Next <ArrowRight size={16} />
                            </button>
                        )}
                    </div>
                </div>
            </div>

            <style>{`
                @keyframes fadeIn {
                    from { opacity: 0; transform: translateY(10px); }
                    to { opacity: 1; transform: translateY(0); }
                }
            `}</style>
        </>
    );
};
