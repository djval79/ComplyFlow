import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Play, Pause, Zap, Shield, BarChart3 } from 'lucide-react';

const SLIDES = [
    {
        title: "Executive Dashboard",
        description: "Get a 360° view of your organization's compliance health in real-time.",
        image: "/Users/apple/.gemini/antigravity/brain/de4c82c3-d22d-46ff-980c-560d339a7d48/complyflow_dashboard_mockup_1769267846295.png",
        icon: <BarChart3 className="text-blue-500" />
    },
    {
        title: "AI Gap Analysis",
        description: "Our proprietary AI scans your policies and identifies missing regulatory requirements in seconds.",
        image: "/Users/apple/.gemini/antigravity/brain/de4c82c3-d22d-46ff-980c-560d339a7d48/complyflow_analyzer_mockup_1769267861466.png",
        icon: <Zap className="text-amber-500" />
    },
    {
        title: "Local Intelligence Feed",
        description: "Stay ahead of inspection trends by monitoring anonymized CQC data from your local area.",
        image: "/Users/apple/.gemini/antigravity/brain/de4c82c3-d22d-46ff-980c-560d339a7d48/complyflow_trends_mockup_1769267878593.png",
        icon: <Shield className="text-emerald-500" />
    }
];

export const ProductWalkthrough: React.FC = () => {
    const [currentSlide, setCurrentSlide] = useState(0);
    const [isAutoPlaying, setIsAutoPlaying] = useState(true);

    useEffect(() => {
        if (!isAutoPlaying) return;
        const timer = setInterval(() => {
            setCurrentSlide((prev) => (prev + 1) % SLIDES.length);
        }, 5000);
        return () => clearInterval(timer);
    }, [isAutoPlaying]);

    const nextSlide = () => {
        setIsAutoPlaying(false);
        setCurrentSlide((prev) => (prev + 1) % SLIDES.length);
    };

    const prevSlide = () => {
        setIsAutoPlaying(false);
        setCurrentSlide((prev) => (prev === 0 ? SLIDES.length - 1 : prev - 1));
    };

    return (
        <div className="product-walkthrough" style={{
            position: 'relative',
            background: 'var(--color-bg-secondary)',
            borderRadius: '24px',
            overflow: 'hidden',
            boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)',
            border: '1px solid rgba(255,255,255,0.1)'
        }}>
            {/* Main Stage */}
            <div style={{
                aspectRatio: '16/9',
                position: 'relative',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: '#0f172a'
            }}>
                <img
                    src={SLIDES[currentSlide].image}
                    alt={SLIDES[currentSlide].title}
                    style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover',
                        transition: 'opacity 0.5s ease-in-out'
                    }}
                />

                {/* Overlays/Controls */}
                <div style={{
                    position: 'absolute',
                    bottom: 0,
                    left: 0,
                    right: 0,
                    padding: '2rem',
                    background: 'linear-gradient(to top, rgba(0,0,0,0.9), transparent)',
                    color: 'white'
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '0.5rem' }}>
                        {SLIDES[currentSlide].icon}
                        <h3 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 700 }}>{SLIDES[currentSlide].title}</h3>
                    </div>
                    <p style={{ margin: 0, fontSize: '1.1rem', opacity: 0.9, maxWidth: '600px' }}>
                        {SLIDES[currentSlide].description}
                    </p>
                </div>

                <button
                    onClick={prevSlide}
                    style={{
                        position: 'absolute',
                        left: '1rem',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        background: 'rgba(255,255,255,0.1)',
                        border: 'none',
                        borderRadius: '50%',
                        width: '48px',
                        height: '48px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer',
                        color: 'white',
                        backdropFilter: 'blur(4px)'
                    }}
                >
                    <ChevronLeft size={24} />
                </button>

                <button
                    onClick={nextSlide}
                    style={{
                        position: 'absolute',
                        right: '1rem',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        background: 'rgba(255,255,255,0.1)',
                        border: 'none',
                        borderRadius: '50%',
                        width: '48px',
                        height: '48px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer',
                        color: 'white',
                        backdropFilter: 'blur(4px)'
                    }}
                >
                    <ChevronRight size={24} />
                </button>
            </div>

            {/* Pagination/Duration Bar */}
            <div style={{
                display: 'flex',
                gap: '4px',
                height: '4px',
                background: 'rgba(255,255,255,0.1)'
            }}>
                {SLIDES.map((_, idx) => (
                    <div key={idx} style={{
                        flex: 1,
                        background: idx === currentSlide ? 'var(--color-primary)' : 'transparent',
                        transition: 'background 0.3s'
                    }} />
                ))}
            </div>

            {/* Slide Navigation */}
            <div style={{
                padding: '1rem 2rem',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
            }}>
                <div style={{ display: 'flex', gap: '1rem' }}>
                    {SLIDES.map((slide, idx) => (
                        <button
                            key={idx}
                            onClick={() => {
                                setIsAutoPlaying(false);
                                setCurrentSlide(idx);
                            }}
                            style={{
                                padding: '0.5rem 1rem',
                                borderRadius: '8px',
                                border: 'none',
                                background: idx === currentSlide ? 'rgba(59, 130, 246, 0.1)' : 'transparent',
                                color: idx === currentSlide ? 'var(--color-primary)' : 'var(--color-text-secondary)',
                                fontWeight: 600,
                                cursor: 'pointer',
                                fontSize: '0.9rem'
                            }}
                        >
                            {slide.title}
                        </button>
                    ))}
                </div>

                <button
                    onClick={() => setIsAutoPlaying(!isAutoPlaying)}
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        background: 'none',
                        border: 'none',
                        color: 'var(--color-text-secondary)',
                        cursor: 'pointer',
                        fontSize: '0.9rem'
                    }}
                >
                    {isAutoPlaying ? <Pause size={16} /> : <Play size={16} />}
                    {isAutoPlaying ? "Auto-play On" : "Auto-play Off"}
                </button>
            </div>
        </div>
    );
};
