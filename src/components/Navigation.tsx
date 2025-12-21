import { useState, useRef, useEffect } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { ShieldCheck, User, LogOut, Settings, ChevronDown, Sparkles, MapPin } from 'lucide-react';

import { useCompliance } from '../context/ComplianceContext';
import { useAuth } from '../context/AuthContext';

export const Navigation = () => {
    const { cqcStatus, sponsorStatus, locations, currentLocationId, switchLocation, getCurrentLocation } = useCompliance();
    const { profile, signOut, isDemo } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();

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
        <nav style={{
            borderBottom: '1px solid var(--color-border)',
            backgroundColor: 'rgba(255, 255, 255, 0.9)',
            backdropFilter: 'blur(8px)',
            position: 'sticky',
            top: 0,
            zIndex: 100
        }}>
            <div className="container" style={{ display: 'flex', alignItems: 'center', height: 'var(--header-height)', justifyContent: 'space-between' }}>

                {/* Left: Logo & Links */}
                <div className="flex items-center" style={{ gap: '2rem' }}>
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

                    {/* Navigation Links */}
                    <div className="flex items-center gap-2">
                        <NavLink to="/dashboard" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>Dashboard</NavLink>

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
                                            to="/cqc/simulator"
                                            className="nav-link"
                                            style={{ display: 'block', marginBottom: '0.25rem' }}
                                            onClick={() => setCqcDropdownOpen(false)}
                                        >
                                            Inspection Simulator
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
                        <NavLink to="/templates" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>Templates</NavLink>
                        <NavLink to="/pricing" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>Pricing</NavLink>
                    </div>
                </div>

                {/* Right: Status Badges & Profile */}
                <div className="flex items-center gap-4">

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
        @media (min-width: 768px) {
          .user-info {
            display: block !important;
          }
        }
      `}</style>
        </nav >
    );
};
