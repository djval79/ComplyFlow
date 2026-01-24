import React, { useState, useEffect } from 'react';
import { Radar, AlertTriangle, ChevronRight, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getActiveAlertCount, getWatchdogAlerts, DEMO_WATCHDOG_ALERTS } from '../services/trendWatchdog';
import type { WatchdogAlert } from '../services/trendWatchdog';

interface WatchdogWidgetProps {
    compact?: boolean;
}

export const WatchdogWidget: React.FC<WatchdogWidgetProps> = ({ compact = false }) => {
    const navigate = useNavigate();
    const { profile } = useAuth();
    const [alertCount, setAlertCount] = useState(0);
    const [topAlert, setTopAlert] = useState<WatchdogAlert | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadData();
    }, [profile]);

    const loadData = async () => {
        try {
            if (profile?.organization_id) {
                const [count, alerts] = await Promise.all([
                    getActiveAlertCount(profile.organization_id),
                    getWatchdogAlerts(profile.organization_id)
                ]);
                setAlertCount(count || DEMO_WATCHDOG_ALERTS.length);
                setTopAlert(alerts[0] || DEMO_WATCHDOG_ALERTS[0]);
            } else {
                // Demo mode
                setAlertCount(DEMO_WATCHDOG_ALERTS.length);
                setTopAlert(DEMO_WATCHDOG_ALERTS[0]);
            }
        } catch (error) {
            console.error('Error loading watchdog data:', error);
            setAlertCount(DEMO_WATCHDOG_ALERTS.length);
            setTopAlert(DEMO_WATCHDOG_ALERTS[0]);
        } finally {
            setLoading(false);
        }
    };

    const getSeverityColor = (severity: string) => {
        switch (severity) {
            case 'critical': return '#dc2626';
            case 'warning': return '#f59e0b';
            default: return '#3b82f6';
        }
    };

    if (loading) {
        return (
            <div className="card" style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                minHeight: compact ? '100px' : '180px'
            }}>
                <Loader2 className="animate-spin" size={24} color="var(--color-primary)" />
            </div>
        );
    }

    if (compact) {
        return (
            <div
                className="card"
                onClick={() => navigate('/trend-watchdog')}
                style={{
                    cursor: 'pointer',
                    background: alertCount > 0
                        ? 'linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)'
                        : 'var(--color-bg-card)',
                    border: alertCount > 0 ? '1px solid #f59e0b' : undefined,
                    transition: 'transform 0.2s ease'
                }}
            >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <div style={{
                            background: alertCount > 0 ? '#f59e0b' : 'var(--color-primary)',
                            borderRadius: '50%',
                            padding: '0.5rem',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                        }}>
                            <Radar size={20} color="white" />
                        </div>
                        <div>
                            <div style={{ fontWeight: '600', fontSize: '0.9rem' }}>Trend Watchdog</div>
                            <div style={{ fontSize: '0.8rem', color: alertCount > 0 ? '#92400e' : 'var(--color-text-secondary)' }}>
                                {alertCount > 0 ? `${alertCount} regional alert${alertCount > 1 ? 's' : ''}` : 'No alerts'}
                            </div>
                        </div>
                    </div>
                    <ChevronRight size={20} color={alertCount > 0 ? '#92400e' : 'var(--color-text-secondary)'} />
                </div>
            </div>
        );
    }

    return (
        <div className="card" style={{ height: '100%' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', margin: 0 }}>
                    <Radar size={20} color="var(--color-primary)" />
                    Trend Watchdog
                </h3>
                {alertCount > 0 && (
                    <span style={{
                        background: '#dc2626',
                        color: 'white',
                        borderRadius: 'var(--radius-full)',
                        padding: '0.125rem 0.5rem',
                        fontSize: '0.75rem',
                        fontWeight: '600'
                    }}>
                        {alertCount}
                    </span>
                )}
            </div>

            {topAlert ? (
                <div style={{
                    background: 'var(--color-bg-surface)',
                    borderRadius: 'var(--radius-md)',
                    padding: '1rem',
                    marginBottom: '1rem',
                    borderLeft: `4px solid ${getSeverityColor(topAlert.severity)}`
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                        <AlertTriangle size={14} color={getSeverityColor(topAlert.severity)} />
                        <span style={{
                            fontSize: '0.7rem',
                            fontWeight: '600',
                            textTransform: 'uppercase',
                            color: getSeverityColor(topAlert.severity)
                        }}>
                            {topAlert.severity}
                        </span>
                    </div>
                    <p style={{ fontSize: '0.875rem', margin: 0, fontWeight: '500' }}>
                        {topAlert.title}
                    </p>
                    {topAlert.theme && (
                        <span style={{
                            display: 'inline-block',
                            marginTop: '0.5rem',
                            background: '#e0f2fe',
                            color: '#0369a1',
                            padding: '0.125rem 0.5rem',
                            borderRadius: 'var(--radius-sm)',
                            fontSize: '0.7rem'
                        }}>
                            {topAlert.theme}
                        </span>
                    )}
                </div>
            ) : (
                <div style={{
                    textAlign: 'center',
                    padding: '1.5rem',
                    color: 'var(--color-text-secondary)',
                    background: 'var(--color-bg-surface)',
                    borderRadius: 'var(--radius-md)'
                }}>
                    <p style={{ margin: 0 }}>No regional alerts detected</p>
                </div>
            )}

            <button
                className="btn btn-secondary btn-full"
                onClick={() => navigate('/trend-watchdog')}
                style={{ marginTop: 'auto' }}
            >
                View All Trends <ChevronRight size={16} />
            </button>
        </div>
    );
};
