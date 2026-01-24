import { useState, useRef, useEffect } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import {
    LayoutDashboard,
    FileText,
    Users,
    Briefcase,
    Settings,
    LogOut,
    Menu,
    X,
    ChevronDown,
    Shield,
    BookOpen,
    GraduationCap,
    Clock,
    User,
    Calendar,
    Building2,
    CheckCircle,
    AlertTriangle,
    Radar,
    Zap,
    ShieldCheck,
    Sparkles,
    MapPin
} from 'lucide-react';

import { useCompliance } from '../context/ComplianceContext';
import { useAuth } from '../context/AuthContext';
import { TrialBanner } from './TrialBanner';

export const Navigation = () => {
    const { cqcStatus, sponsorStatus, locations, currentLocationId, switchLocation, getCurrentLocation } = useCompliance();
    const { profile, signOut, isDemo } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();

    // Mobile Menu State
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    // User Dropdown State
    const [dropdownOpen, setDropdownOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    // Location Dropdown State
    const [locDropdownOpen, setLocDropdownOpen] = useState(false);
    const locDropdownRef = useRef<HTMLDivElement>(null);

    // CQC Suite Dropdown State
    const [cqcDropdownOpen, setCqcDropdownOpen] = useState(false);
    const cqcDropdownRef = useRef<HTMLDivElement>(null);

    // Close dropdowns when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setDropdownOpen(false);
            }
            if (locDropdownRef.current && !locDropdownRef.current.contains(event.target as Node)) {
                setLocDropdownOpen(false);
            }
            if (cqcDropdownRef.current && !cqcDropdownRef.current.contains(event.target as Node)) {
                setCqcDropdownOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const getCqcBadge = () => {
        if (cqcStatus === 'active') return <span className="badge badge-success">CQC: Active</span>;
        if (cqcStatus === 'applying') return <span className="badge badge-warning">CQC: Applying</span>;
        return <span className="badge badge-danger">CQC: Unregistered</span>;
    };

    const getSponsorBadge = () => {
        if (sponsorStatus === 'yes') return <span className="badge badge-success">Sponsor: A-Rated</span>;
        return <span className="badge" style={{ background: '#f1f5f9', color: '#64748b' }}>Sponsor: N/A</span>;
    };

    const handleSignOut = async () => {
        await signOut();
        navigate('/login');
    };

    const getInitials = (name: string) => {
        return name
            .split(' ')
            .map(n => n[0])
            .join('')
            .toUpperCase()
            .slice(0, 2);
    };

    const currentLocation = getCurrentLocation();

    return (
        <>
            <TrialBanner />
            <nav style={{
                borderBottom: '1px solid var(--color-border)',
                backgroundColor: 'rgba(255, 255, 255, 0.9)',
                backdropFilter: 'blur(8px)',
                position: 'sticky',
                top: 0,
                zIndex: 100
            }}>
                <div className="container" style={{ display: 'flex', alignItems: 'center', height: 'var(--header-height)', justifyContent: 'space-between' }}>

                    {/* Left: Logo & Mobile Menu Toggle */}
                    <div className="flex items-center" style={{ gap: '1rem' }}>
                        {/* Mobile Menu Toggle */}
                        <button
                            className="mobile-menu-toggle"
                            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                            style={{
                                display: 'none', // Hidden by default, shown via CSS on mobile
                                padding: '0.5rem',
                                background: 'transparent',
                                border: 'none',
                                borderRadius: 'var(--radius-md)',
                                cursor: 'pointer',
                                color: 'var(--color-text-main)'
                            }}
                            aria-label="Toggle menu"
                        >
                            {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
                        </button>

                        <div className="flex items-center gap-2">
                            <div style={{
                                width: 32, height: 32,
                                background: 'var(--color-primary)',
                                borderRadius: '6px',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                color: 'white',
                                boxShadow: 'var(--shadow-md)'
                            }}>
                                <ShieldCheck size={18} />
                            </div>
                            <span style={{ fontWeight: 700, fontSize: '1.1rem', letterSpacing: '-0.02em', color: 'var(--color-primary)' }}>ComplyFlow</span>
                        </div>
                    </div>

                    {/* Desktop Navigation Links - Hidden on mobile */}
                    <div className="nav-links-desktop" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <NavLink to="/dashboard" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>Dashboard</NavLink>
                        <NavLink to="/intelligence-hub" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>Intelligence</NavLink>

                        <NavLink to="/governance" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>Governance</NavLink>

                        {/* CQC Suite Dropdown */}
                        <div ref={cqcDropdownRef} style={{ position: 'relative' }}>
                            <button
                                onClick={() => setCqcDropdownOpen(!cqcDropdownOpen)}
                                className={`nav-link ${location.pathname.startsWith('/cqc') ? 'active' : ''}`}
                                style={{
                                    display: 'flex', alignItems: 'center', gap: '0.25rem',
                                    border: 'none', background: 'transparent', cursor: 'pointer',
                                    fontSize: '0.875rem', fontWeight: 500,
                                    color: location.pathname.startsWith('/cqc') ? 'white' : 'var(--color-text-secondary)'
                                }}
                            >
                                CQC Suite
                                <ChevronDown size={14} />
                            </button>

                            {cqcDropdownOpen && (
                                <div style={{
                                    position: 'absolute', top: '120%', left: 0,
                                    background: 'white', border: '1px solid var(--color-border)',
                                    borderRadius: 'var(--radius-md)', boxShadow: 'var(--shadow-lg)',
                                    minWidth: '220px', zIndex: 200, overflow: 'hidden'
                                }}>
                                    <div style={{ padding: '0.5rem' }}>
                                        <NavLink
                                            to="/cqc/gap-analysis"
                                            className="nav-link"
                                            style={{ display: 'block', marginBottom: '0.25rem' }}
                                            onClick={() => setCqcDropdownOpen(false)}
                                        >
                                            Gap Analysis
                                        </NavLink>
                                        <NavLink
                                            to="/cqc/export"
                                            className="nav-link"
                                            style={{ display: 'block', marginBottom: '0.25rem' }}
                                            onClick={() => setCqcDropdownOpen(false)}
                                        >
                                            🚀 Evidence Export (PIR)
                                        </NavLink>
                                        <NavLink
                                            to="/cqc/evidence-vault"
                                            className="nav-link"
                                            style={{ display: 'block', marginBottom: '0.25rem' }}
                                            onClick={() => setCqcDropdownOpen(false)}
                                        >
                                            🛡️ AI Evidence Vault
                                        </NavLink>
                                        <NavLink
                                            to="/cqc/advisor"
                                            className="nav-link"
                                            style={{ display: 'block', marginBottom: '0.25rem' }}
                                            onClick={() => setCqcDropdownOpen(false)}
                                        >
                                            AI Advisor
                                        </NavLink>
                                        <NavLink
                                            to="/cqc/mock-inspection"
                                            className="nav-link"
                                            style={{ display: 'block', marginBottom: '0.25rem' }}
                                            onClick={() => setCqcDropdownOpen(false)}
                                        >
                                            🎯 Mock Inspection Centre
                                        </NavLink>
                                        <NavLink
                                            to="/cqc/interview-training"
                                            className="nav-link"
                                            style={{ display: 'block', marginBottom: '0.25rem' }}
                                            onClick={() => setCqcDropdownOpen(false)}
                                        >
                                            📚 Interview Training
                                        </NavLink>
                                        <NavLink
                                            to="/cqc/simulator"
                                            className="nav-link"
                                            style={{ display: 'block', marginBottom: '0.25rem' }}
                                            onClick={() => setCqcDropdownOpen(false)}
                                        >
                                            Quick Chat Simulator
                                        </NavLink>
                                        <NavLink
                                            to="/cqc/visiting-rights"
                                            className="nav-link"
                                            style={{ display: 'block' }}
                                            onClick={() => setCqcDropdownOpen(false)}
                                        >
                                            Visiting Rights (Reg 9A)
                                        </NavLink>
                                    </div>
                                </div>
                            )}
                        </div>

                        {sponsorStatus === 'yes' && (
                            <NavLink to="/sponsor" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>Sponsor Guardian</NavLink>
                        )}
                        <NavLink to="/actions" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>Actions</NavLink>
                        <NavLink to="/rota" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`} style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                            <Calendar size={14} /> Rota
                        </NavLink>
                        <NavLink to="/training/heatmap" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`} style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                            <Zap size={14} /> Matrix
                        </NavLink>
                        <NavLink to="/trend-watchdog" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`} style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                            <Radar size={14} /> Watchdog
                        </NavLink>
                        <NavLink to="/templates" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>Templates</NavLink>
                        <NavLink to="/pricing" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>Pricing</NavLink>
                    </div>

                    {/* Right: Status Badges & Profile */}
                    <div className="flex items-center gap-4 nav-right-badges">

                        {/* LOCATION SWITCHER (New Corporate Feature) */}
                        {locations && locations.length > 0 && (
                            <div ref={locDropdownRef} style={{ position: 'relative' }}>
                                <button
                                    onClick={() => setLocDropdownOpen(!locDropdownOpen)}
                                    style={{
                                        display: 'flex', alignItems: 'center', gap: '0.5rem',
                                        padding: '0.25rem 0.75rem',
                                        background: 'var(--color-bg-page)',
                                        border: '1px solid var(--color-border)',
                                        borderRadius: '9999px',
                                        fontSize: '0.8rem',
                                        color: 'var(--color-text-secondary)',
                                        cursor: 'pointer'
                                    }}
                                >
                                    <MapPin size={14} />
                                    <span style={{ fontWeight: 600 }}>{currentLocation?.name || 'Select Location'}</span>
                                    <ChevronDown size={12} />
                                </button>

                                {/* Location Dropdown Menu */}
                                {locDropdownOpen && (
                                    <div style={{
                                        position: 'absolute', top: '120%', right: 0,
                                        background: 'white', border: '1px solid var(--color-border)',
                                        borderRadius: 'var(--radius-md)', boxShadow: 'var(--shadow-lg)',
                                        minWidth: '200px', zIndex: 200, overflow: 'hidden'
                                    }}>
                                        <div style={{ padding: '0.5rem', borderBottom: '1px solid var(--color-border)', fontSize: '0.7rem', fontWeight: 700, color: 'var(--color-text-tertiary)', textTransform: 'uppercase' }}>
                                            Switch Location
                                        </div>
                                        {locations.map(loc => (
                                            <button
                                                key={loc.id}
                                                onClick={() => { switchLocation(loc.id); setLocDropdownOpen(false); }}
                                                style={{
                                                    width: '100%', textAlign: 'left', padding: '0.6rem 0.75rem',
                                                    background: currentLocationId === loc.id ? 'var(--color-bg-surface)' : 'transparent',
                                                    border: 'none', cursor: 'pointer', fontSize: '0.85rem',
                                                    color: currentLocationId === loc.id ? 'var(--color-primary)' : 'var(--color-text-main)',
                                                    fontWeight: currentLocationId === loc.id ? 600 : 400
                                                }}
                                            >
                                                {loc.name}
                                                <span style={{ display: 'block', fontSize: '0.7rem', color: 'var(--color-text-tertiary)' }}>{loc.type}</span>
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}


                        {/* Demo Mode Indicator */}
                        {isDemo && (
                            <div className="flex items-center gap-1" style={{
                                background: 'linear-gradient(135deg, #f0fdf4, #dcfce7)',
                                padding: '0.25rem 0.75rem',
                                borderRadius: '9999px',
                                fontSize: '0.75rem',
                                fontWeight: 600,
                                color: '#16a34a',
                                border: '1px solid #bbf7d0'
                            }}>
                                <Sparkles size={12} />
                                Demo Mode
                            </div>
                        )}

                        <div className="flex items-center gap-2">
                            {getCqcBadge()}
                            {getSponsorBadge()}
                        </div>

                        <div style={{ width: 1, height: 24, background: 'var(--color-border)' }}></div>

                        {/* User Dropdown */}
                        <div ref={dropdownRef} style={{ position: 'relative' }}>
                            <button
                                onClick={() => setDropdownOpen(!dropdownOpen)}
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '0.5rem',
                                    padding: '0.25rem 0.5rem 0.25rem 0.25rem',
                                    background: 'transparent',
                                    border: '1px solid transparent',
                                    borderRadius: 'var(--radius-md)',
                                    cursor: 'pointer',
                                    transition: 'all 0.2s'
                                }}
                                onMouseEnter={(e) => {
                                    e.currentTarget.style.background = 'var(--color-bg-page)';
                                    e.currentTarget.style.borderColor = 'var(--color-border)';
                                }}
                                onMouseLeave={(e) => {
                                    e.currentTarget.style.background = 'transparent';
                                    e.currentTarget.style.borderColor = 'transparent';
                                }}
                            >
                                <div style={{
                                    width: 32,
                                    height: 32,
                                    borderRadius: '50%',
                                    background: 'linear-gradient(135deg, var(--color-primary), var(--color-primary-light))',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    color: 'white',
                                    fontSize: '0.75rem',
                                    fontWeight: 600
                                }}>
                                    {profile?.full_name ? getInitials(profile.full_name) : <User size={16} />}
                                </div>
                                <div style={{ textAlign: 'left', display: 'none' }} className="user-info">
                                    <div style={{ fontSize: '0.875rem', fontWeight: 500, color: 'var(--color-text-main)' }}>
                                        {profile?.full_name || 'User'}
                                    </div>
                                    <div style={{ fontSize: '0.75rem', color: 'var(--color-text-tertiary)' }}>
                                        {profile?.organization_name || 'Organization'}
                                    </div>
                                </div>
                                <ChevronDown size={14} style={{ color: 'var(--color-text-tertiary)' }} />
                            </button>

                            {/* Dropdown Menu */}
                            {dropdownOpen && (
                                <div style={{
                                    position: 'absolute',
                                    top: '100%',
                                    right: 0,
                                    marginTop: '0.5rem',
                                    background: 'white',
                                    border: '1px solid var(--color-border)',
                                    borderRadius: 'var(--radius-lg)',
                                    boxShadow: 'var(--shadow-lg)',
                                    minWidth: '220px',
                                    overflow: 'hidden',
                                    zIndex: 200
                                }}>
                                    {/* User Info */}
                                    <div style={{
                                        padding: '1rem',
                                        borderBottom: '1px solid var(--color-border)',
                                        background: 'var(--color-bg-page)'
                                    }}>
                                        <div style={{ fontWeight: 600, color: 'var(--color-text-main)' }}>
                                            {profile?.full_name || 'Demo User'}
                                        </div>
                                        <div style={{ fontSize: '0.825rem', color: 'var(--color-text-secondary)', marginTop: '0.125rem' }}>
                                            {profile?.email || 'demo@complyflow.uk'}
                                        </div>
                                        <div style={{
                                            fontSize: '0.75rem',
                                            color: 'var(--color-accent)',
                                            marginTop: '0.25rem',
                                            fontWeight: 500
                                        }}>
                                            {profile?.organization_name || 'Demo Organization'}
                                        </div>
                                    </div>

                                    {/* Menu Items */}
                                    <div style={{ padding: '0.5rem' }}>
                                        <button
                                            onClick={() => {
                                                setDropdownOpen(false);
                                                navigate('/settings');
                                            }}
                                            style={{
                                                width: '100%',
                                                padding: '0.5rem 0.75rem',
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '0.5rem',
                                                background: 'transparent',
                                                border: 'none',
                                                borderRadius: 'var(--radius-md)',
                                                cursor: 'pointer',
                                                fontSize: '0.875rem',
                                                color: 'var(--color-text-main)',
                                                textAlign: 'left'
                                            }}
                                            onMouseEnter={(e) => e.currentTarget.style.background = 'var(--color-bg-page)'}
                                            onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                                        >
                                            <Settings size={16} />
                                            Settings
                                        </button>

                                        <button
                                            onClick={() => {
                                                setDropdownOpen(false);
                                                handleSignOut();
                                            }}
                                            style={{
                                                width: '100%',
                                                padding: '0.5rem 0.75rem',
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '0.5rem',
                                                background: 'transparent',
                                                border: 'none',
                                                borderRadius: 'var(--radius-md)',
                                                cursor: 'pointer',
                                                fontSize: '0.875rem',
                                                color: 'var(--color-danger)',
                                                textAlign: 'left'
                                            }}
                                            onMouseEnter={(e) => e.currentTarget.style.background = 'var(--color-danger-bg)'}
                                            onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                                        >
                                            <LogOut size={16} />
                                            Sign Out
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Mobile Menu Drawer */}
                {mobileMenuOpen && (
                    <>
                        {/* Backdrop */}
                        <div
                            className="mobile-menu-backdrop"
                            onClick={() => setMobileMenuOpen(false)}
                            style={{
                                position: 'fixed',
                                inset: 0,
                                background: 'rgba(0,0,0,0.5)',
                                zIndex: 150
                            }}
                        />
                        {/* Drawer */}
                        <div style={{
                            position: 'fixed',
                            top: 0,
                            left: 0,
                            bottom: 0,
                            width: '280px',
                            maxWidth: '80vw',
                            background: 'white',
                            zIndex: 200,
                            boxShadow: 'var(--shadow-2xl)',
                            overflowY: 'auto',
                            animation: 'slideInLeft 0.3s ease-out'
                        }}>
                            <div style={{ padding: '1rem', borderBottom: '1px solid var(--color-border)' }}>
                                <div className="flex items-center gap-2">
                                    <div style={{
                                        width: 32, height: 32,
                                        background: 'var(--color-primary)',
                                        borderRadius: '6px',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        color: 'white'
                                    }}>
                                        <ShieldCheck size={18} />
                                    </div>
                                    <span style={{ fontWeight: 700, color: 'var(--color-primary)' }}>ComplyFlow</span>
                                </div>
                            </div>
                            <div style={{ padding: '0.5rem' }}>
                                <NavLink to="/dashboard" className="mobile-nav-link" onClick={() => setMobileMenuOpen(false)}>
                                    <LayoutDashboard size={18} /> Dashboard
                                </NavLink>
                                <NavLink to="/intelligence-hub" className="mobile-nav-link" onClick={() => setMobileMenuOpen(false)}>
                                    <Radar size={18} /> Intelligence
                                </NavLink>
                                <NavLink to="/governance" className="mobile-nav-link" onClick={() => setMobileMenuOpen(false)}>
                                    <Shield size={18} /> Governance
                                </NavLink>
                                <NavLink to="/cqc/gap-analysis" className="mobile-nav-link" onClick={() => setMobileMenuOpen(false)}>
                                    <FileText size={18} /> Gap Analysis
                                </NavLink>
                                <NavLink to="/sponsor" className="mobile-nav-link" onClick={() => setMobileMenuOpen(false)}>
                                    <Users size={18} /> Sponsor Guardian
                                </NavLink>
                                <NavLink to="/actions" className="mobile-nav-link" onClick={() => setMobileMenuOpen(false)}>
                                    <CheckCircle size={18} /> Actions
                                </NavLink>
                                <NavLink to="/rota" className="mobile-nav-link" onClick={() => setMobileMenuOpen(false)}>
                                    <Calendar size={18} /> Rota
                                </NavLink>
                                <NavLink to="/templates" className="mobile-nav-link" onClick={() => setMobileMenuOpen(false)}>
                                    <BookOpen size={18} /> Templates
                                </NavLink>
                                <NavLink to="/pricing" className="mobile-nav-link" onClick={() => setMobileMenuOpen(false)}>
                                    <Briefcase size={18} /> Pricing
                                </NavLink>
                                <NavLink to="/settings" className="mobile-nav-link" onClick={() => setMobileMenuOpen(false)}>
                                    <Settings size={18} /> Settings
                                </NavLink>
                            </div>
                            <div style={{ padding: '1rem', borderTop: '1px solid var(--color-border)', marginTop: 'auto' }}>
                                <button
                                    onClick={() => { handleSignOut(); setMobileMenuOpen(false); }}
                                    style={{
                                        width: '100%',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '0.5rem',
                                        padding: '0.75rem',
                                        background: 'var(--color-danger-bg)',
                                        border: 'none',
                                        borderRadius: 'var(--radius-md)',
                                        color: 'var(--color-danger)',
                                        cursor: 'pointer',
                                        fontWeight: 500
                                    }}
                                >
                                    <LogOut size={18} /> Sign Out
                                </button>
                            </div>
                        </div>
                    </>
                )}

                <style>{`
        .nav-link {
            padding: 0.5rem 0.75rem;
            font-size: 0.875rem;
            font-weight: 500;
            color: var(--color-text-secondary);
            border-radius: var(--radius-md);
            transition: all 0.2s;
            text-decoration: none;
        }
        .nav-link:hover {
            background: var(--color-bg-page);
            color: var(--color-text-main);
        }
        .nav-link.active {
            background: var(--color-primary);
            color: white;
        }
        @media(min-width: 768px) {
            .user-info {
                display: block!important;
            }
        }
        /* Mobile Navigation Styles */
        @media(max-width: 768px) {
            .mobile-menu-toggle {
                display: flex !important;
            }
            .nav-links-desktop {
                display: none !important;
            }
            .nav-right-badges {
                display: none !important;
            }
        }
        /* Mobile Nav Link Styles */
        .mobile-nav-link {
            display: flex;
            align-items: center;
            gap: 0.75rem;
            padding: 0.875rem 1rem;
            color: var(--color-text-main);
            text-decoration: none;
            border-radius: var(--radius-md);
            font-weight: 500;
            transition: all 0.2s;
        }
        .mobile-nav-link:hover {
            background: var(--color-bg-page);
        }
        .mobile-nav-link.active {
            background: var(--color-primary);
            color: white;
        }
            `}</style>
            </nav>
        </>
    );
};
