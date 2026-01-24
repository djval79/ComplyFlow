import React, { useState, useEffect } from 'react';
import {
    ArrowLeft,
    Radar,
    AlertTriangle,
    MapPin,
    RefreshCw,
    Settings,
    ChevronRight,
    Shield,
    Building2,
    Clock,
    X,
    CheckCircle2,
    ExternalLink,
    Loader2
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
    getWatchdogSettings,
    updateWatchdogSettings,
    getWatchdogAlerts,
    getLocalCQCReports,
    triggerWatchdogScan,
    dismissWatchdogAlert,
    DEMO_WATCHDOG_ALERTS,
    DEMO_LOCAL_REPORTS
} from '../services/trendWatchdog';
import type {
    WatchdogAlert,
    LocalCQCReport,
    WatchdogSettings
} from '../services/trendWatchdog';

export const TrendWatchdog = () => {
    const navigate = useNavigate();
    const { profile } = useAuth();

    const [settings, setSettings] = useState<WatchdogSettings | null>(null);
    const [alerts, setAlerts] = useState<WatchdogAlert[]>([]);
    const [reports, setReports] = useState<LocalCQCReport[]>([]);
    const [loading, setLoading] = useState(true);
    const [scanning, setScanning] = useState(false);
    const [showSettings, setShowSettings] = useState(false);
    const [postcodeInput, setPostcodeInput] = useState('');
    const [radiusInput, setRadiusInput] = useState(10);

    useEffect(() => {
        loadData();
    }, [profile]);

    const loadData = async () => {
        setLoading(true);
        try {
            if (profile?.organization_id) {
                const [settingsData, alertsData, reportsData] = await Promise.all([
                    getWatchdogSettings(profile.organization_id),
                    getWatchdogAlerts(profile.organization_id),
                    getLocalCQCReports(20)
                ]);

                setSettings(settingsData);
                setPostcodeInput(settingsData?.postcode || '');
                setRadiusInput(settingsData?.watchdog_radius_miles || 10);
                setAlerts(alertsData.length > 0 ? alertsData : DEMO_WATCHDOG_ALERTS);
                setReports(reportsData.length > 0 ? reportsData : DEMO_LOCAL_REPORTS);
            } else {
                // Demo mode
                setAlerts(DEMO_WATCHDOG_ALERTS);
                setReports(DEMO_LOCAL_REPORTS);
            }
        } catch (error) {
            console.error('Error loading data:', error);
            setAlerts(DEMO_WATCHDOG_ALERTS);
            setReports(DEMO_LOCAL_REPORTS);
        } finally {
            setLoading(false);
        }
    };

    const handleScan = async () => {
        if (!postcodeInput || !profile?.organization_id) return;

        setScanning(true);
        try {
            const result = await triggerWatchdogScan(
                profile.organization_id,
                postcodeInput,
                radiusInput
            );

            if (result.success) {
                // Reload alerts after scan
                const newAlerts = await getWatchdogAlerts(profile.organization_id);
                setAlerts(newAlerts.length > 0 ? newAlerts : DEMO_WATCHDOG_ALERTS);
            }
        } catch (error) {
            console.error('Scan error:', error);
        } finally {
            setScanning(false);
        }
    };

    const handleSaveSettings = async () => {
        if (!profile?.organization_id) return;

        const success = await updateWatchdogSettings(profile.organization_id, {
            postcode: postcodeInput,
            watchdog_enabled: true,
            watchdog_radius_miles: radiusInput
        });

        if (success) {
            setShowSettings(false);
            setSettings({
                postcode: postcodeInput,
                watchdog_enabled: true,
                watchdog_radius_miles: radiusInput
            });
        }
    };

    const handleDismissAlert = async (alertId: string) => {
        if (!profile?.id) return;

        const success = await dismissWatchdogAlert(alertId, profile.id);
        if (success) {
            setAlerts(prev => prev.filter(a => a.id !== alertId));
        }
    };

    const getSeverityColor = (severity: string) => {
        switch (severity) {
            case 'critical': return '#dc2626';
            case 'warning': return '#f59e0b';
            default: return '#3b82f6';
        }
    };

    const getRatingColor = (rating: string) => {
        switch (rating) {
            case 'Outstanding': return '#059669';
            case 'Good': return '#10b981';
            case 'Requires improvement': return '#f59e0b';
            case 'Inadequate': return '#dc2626';
            default: return '#64748b';
        }
    };

    // Calculate stats
    const criticalAlerts = alerts.filter(a => a.severity === 'critical').length;
    const warningAlerts = alerts.filter(a => a.severity === 'warning').length;
    const topThemes = [...new Set(alerts.map(a => a.theme).filter(Boolean))].slice(0, 3);

    if (loading) {
        return (
            <div className="container animate-enter" style={{ padding: '2rem 1rem', maxWidth: '1200px' }}>
                <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
                    <Loader2 className="animate-spin" size={32} />
                </div>
            </div>
        );
    }

    return (
        <div className="container animate-enter" style={{ padding: '2rem 1rem', maxWidth: '1200px' }}>
            {/* Header */}
            <div style={{ marginBottom: '2rem' }}>
                <button
                    className="btn btn-secondary"
                    onClick={() => navigate('/dashboard')}
                    style={{ marginBottom: '1rem', padding: '0.5rem 1rem' }}
                >
                    <ArrowLeft size={16} /> Back to Dashboard
                </button>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
                    <div>
                        <h1 style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                            <Radar size={32} color="var(--color-primary)" />
                            Local Trend Watchdog
                        </h1>
                        <p style={{ color: 'var(--color-text-secondary)', marginTop: '0.5rem' }}>
                            Monitor CQC inspection trends in your area. Stay ahead of regional focus areas.
                        </p>
                    </div>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <button
                            className="btn btn-secondary"
                            onClick={() => setShowSettings(true)}
                        >
                            <Settings size={16} /> Settings
                        </button>
                        <button
                            className="btn btn-primary"
                            onClick={handleScan}
                            disabled={scanning || !postcodeInput}
                        >
                            {scanning ? <Loader2 className="animate-spin" size={16} /> : <RefreshCw size={16} />}
                            {scanning ? 'Scanning...' : 'Scan Area'}
                        </button>
                    </div>
                </div>
            </div>

            {/* Location Banner */}
            {settings?.postcode && (
                <div style={{
                    background: 'linear-gradient(135deg, var(--color-primary) 0%, #3b82f6 100%)',
                    borderRadius: 'var(--radius-lg)',
                    padding: '1rem 1.5rem',
                    color: 'white',
                    marginBottom: '1.5rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.75rem'
                }}>
                    <MapPin size={20} />
                    <span>Monitoring care homes within <strong>{settings.watchdog_radius_miles} miles</strong> of <strong>{settings.postcode}</strong></span>
                </div>
            )}

            {/* Stats Grid */}
            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                gap: '1rem',
                marginBottom: '2rem'
            }}>
                <div className="card" style={{ textAlign: 'center', borderTop: '4px solid #dc2626' }}>
                    <div style={{ fontSize: '2.5rem', fontWeight: 'bold', color: '#dc2626' }}>{criticalAlerts}</div>
                    <div style={{ color: 'var(--color-text-secondary)', fontSize: '0.875rem' }}>Critical Alerts</div>
                </div>
                <div className="card" style={{ textAlign: 'center', borderTop: '4px solid #f59e0b' }}>
                    <div style={{ fontSize: '2.5rem', fontWeight: 'bold', color: '#f59e0b' }}>{warningAlerts}</div>
                    <div style={{ color: 'var(--color-text-secondary)', fontSize: '0.875rem' }}>Warnings</div>
                </div>
                <div className="card" style={{ textAlign: 'center', borderTop: '4px solid var(--color-primary)' }}>
                    <div style={{ fontSize: '2.5rem', fontWeight: 'bold', color: 'var(--color-primary)' }}>{reports.length}</div>
                    <div style={{ color: 'var(--color-text-secondary)', fontSize: '0.875rem' }}>Reports Tracked</div>
                </div>
                <div className="card" style={{ textAlign: 'center', borderTop: '4px solid #8b5cf6' }}>
                    <div style={{ fontSize: '2.5rem', fontWeight: 'bold', color: '#8b5cf6' }}>{topThemes.length}</div>
                    <div style={{ color: 'var(--color-text-secondary)', fontSize: '0.875rem' }}>Active Themes</div>
                </div>
            </div>

            {/* Main Content Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                {/* Alerts Panel */}
                <div className="card" style={{ gridColumn: 'span 1' }}>
                    <h2 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.5rem' }}>
                        <AlertTriangle size={20} color="#f59e0b" />
                        Regional Trend Alerts
                    </h2>

                    {alerts.length === 0 ? (
                        <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--color-text-secondary)' }}>
                            <CheckCircle2 size={48} style={{ marginBottom: '1rem', opacity: 0.5 }} />
                            <p>No active alerts. Your area looks clear!</p>
                        </div>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            {alerts.map(alert => (
                                <div
                                    key={alert.id}
                                    style={{
                                        background: 'var(--color-bg-surface)',
                                        borderRadius: 'var(--radius-md)',
                                        padding: '1rem',
                                        borderLeft: `4px solid ${getSeverityColor(alert.severity)}`
                                    }}
                                >
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                            <span style={{
                                                background: getSeverityColor(alert.severity),
                                                color: 'white',
                                                padding: '0.125rem 0.5rem',
                                                borderRadius: 'var(--radius-sm)',
                                                fontSize: '0.7rem',
                                                fontWeight: '600',
                                                textTransform: 'uppercase'
                                            }}>
                                                {alert.severity}
                                            </span>
                                            {alert.regulation && (
                                                <span style={{
                                                    background: '#e0f2fe',
                                                    color: '#0369a1',
                                                    padding: '0.125rem 0.5rem',
                                                    borderRadius: 'var(--radius-sm)',
                                                    fontSize: '0.7rem'
                                                }}>
                                                    {alert.regulation}
                                                </span>
                                            )}
                                        </div>
                                        <button
                                            onClick={() => handleDismissAlert(alert.id)}
                                            style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '0.25rem' }}
                                            title="Dismiss alert"
                                        >
                                            <X size={16} color="var(--color-text-secondary)" />
                                        </button>
                                    </div>
                                    <h4 style={{ margin: '0 0 0.5rem 0', fontSize: '0.95rem' }}>{alert.title}</h4>
                                    <p style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)', margin: '0 0 0.75rem 0' }}>
                                        {alert.description}
                                    </p>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <span style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>
                                            <Building2 size={12} style={{ display: 'inline', marginRight: '0.25rem' }} />
                                            {alert.affected_locations} locations affected
                                        </span>
                                        <button
                                            className="btn btn-primary"
                                            style={{ padding: '0.375rem 0.75rem', fontSize: '0.8rem' }}
                                            onClick={() => navigate('/gap-analyzer')}
                                        >
                                            Run Audit <ChevronRight size={14} />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Nearby Reports Panel */}
                <div className="card" style={{ gridColumn: 'span 1' }}>
                    <h2 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.5rem' }}>
                        <Building2 size={20} color="var(--color-primary)" />
                        Nearby CQC Reports
                    </h2>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                        {reports.map(report => (
                            <div
                                key={report.id}
                                style={{
                                    background: 'var(--color-bg-surface)',
                                    borderRadius: 'var(--radius-md)',
                                    padding: '1rem',
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center'
                                }}
                            >
                                <div>
                                    <div style={{ fontWeight: '600', marginBottom: '0.25rem' }}>{report.location_name}</div>
                                    <div style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                        <span><MapPin size={12} style={{ display: 'inline', marginRight: '0.25rem' }} />{report.location_postcode}</span>
                                        <span><Clock size={12} style={{ display: 'inline', marginRight: '0.25rem' }} />{new Date(report.report_date).toLocaleDateString('en-GB')}</span>
                                    </div>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                    <span style={{
                                        background: getRatingColor(report.overall_rating),
                                        color: 'white',
                                        padding: '0.25rem 0.75rem',
                                        borderRadius: 'var(--radius-full)',
                                        fontSize: '0.75rem',
                                        fontWeight: '600'
                                    }}>
                                        {report.overall_rating}
                                    </span>
                                    <a
                                        href={`https://www.cqc.org.uk/location/${report.cqc_location_id}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        style={{ color: 'var(--color-primary)' }}
                                    >
                                        <ExternalLink size={16} />
                                    </a>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Top Themes Summary */}
            {topThemes.length > 0 && (
                <div className="card" style={{ marginTop: '1.5rem' }}>
                    <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
                        <Shield size={20} color="var(--color-primary)" />
                        Regional Focus Areas
                    </h3>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem' }}>
                        {topThemes.map(theme => (
                            <span
                                key={theme}
                                style={{
                                    background: 'linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)',
                                    color: '#92400e',
                                    padding: '0.5rem 1rem',
                                    borderRadius: 'var(--radius-full)',
                                    fontWeight: '600',
                                    fontSize: '0.875rem'
                                }}
                            >
                                {theme}
                            </span>
                        ))}
                    </div>
                    <p style={{ marginTop: '1rem', fontSize: '0.875rem', color: 'var(--color-text-secondary)' }}>
                        These themes have been identified across multiple nearby inspections. Consider prioritizing audits in these areas.
                    </p>
                </div>
            )}

            {/* Settings Modal */}
            {showSettings && (
                <div style={{
                    position: 'fixed',
                    inset: 0,
                    background: 'rgba(0,0,0,0.5)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 1000
                }}>
                    <div className="card" style={{ width: '100%', maxWidth: '400px', margin: '1rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                            <h2 style={{ margin: 0 }}>Watchdog Settings</h2>
                            <button
                                onClick={() => setShowSettings(false)}
                                style={{ background: 'none', border: 'none', cursor: 'pointer' }}
                            >
                                <X size={20} />
                            </button>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            <div>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
                                    Your Postcode
                                </label>
                                <input
                                    type="text"
                                    className="form-input"
                                    placeholder="e.g., B1 1AA"
                                    value={postcodeInput}
                                    onChange={e => setPostcodeInput(e.target.value.toUpperCase())}
                                    style={{ width: '100%' }}
                                />
                            </div>

                            <div>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
                                    Monitoring Radius: {radiusInput} miles
                                </label>
                                <input
                                    type="range"
                                    min="5"
                                    max="25"
                                    value={radiusInput}
                                    onChange={e => setRadiusInput(parseInt(e.target.value))}
                                    style={{ width: '100%' }}
                                />
                                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>
                                    <span>5 miles</span>
                                    <span>25 miles</span>
                                </div>
                            </div>

                            <button
                                className="btn btn-primary btn-full"
                                onClick={handleSaveSettings}
                                style={{ marginTop: '1rem' }}
                            >
                                Save Settings
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
