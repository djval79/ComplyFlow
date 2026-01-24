import React, { useState, useEffect } from 'react';
import { TrendingUp, TrendingDown, Shield, Users, FileCheck, AlertTriangle, ArrowRight, Sparkles, Clock, Target, Award, Zap } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';

interface MetricCardProps {
    title: string;
    value: string | number;
    change?: number;
    icon: React.ReactNode;
    color: string;
    onClick?: () => void;
}

const MetricCard: React.FC<MetricCardProps> = ({ title, value, change, icon, color, onClick }) => (
    <div
        onClick={onClick}
        style={{
            background: 'white',
            borderRadius: '12px',
            padding: '1.25rem',
            border: '1px solid var(--color-border)',
            cursor: onClick ? 'pointer' : 'default',
            transition: 'all 0.2s ease',
            position: 'relative',
            overflow: 'hidden'
        }}
        onMouseEnter={(e) => {
            if (onClick) {
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = 'var(--shadow-md)';
            }
        }}
        onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = 'none';
        }}
    >
        <div style={{ position: 'absolute', top: 0, right: 0, width: '60px', height: '60px', background: `${color}10`, borderRadius: '0 0 0 60px' }} />
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
            <div style={{
                width: '40px', height: '40px', borderRadius: '10px',
                background: `${color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: color
            }}>
                {icon}
            </div>
            {change !== undefined && (
                <div style={{
                    display: 'flex', alignItems: 'center', gap: '0.25rem',
                    fontSize: '0.75rem', fontWeight: 600,
                    color: change >= 0 ? '#10b981' : '#ef4444',
                    background: change >= 0 ? '#ecfdf5' : '#fef2f2',
                    padding: '0.2rem 0.5rem', borderRadius: '4px'
                }}>
                    {change >= 0 ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                    {Math.abs(change)}%
                </div>
            )}
        </div>
        <div style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--color-text-main)', letterSpacing: '-0.02em' }}>
            {value}
        </div>
        <div style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)', marginTop: '0.25rem' }}>{title}</div>
        {onClick && (
            <div style={{ marginTop: '0.75rem', fontSize: '0.75rem', color: color, fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                View Details <ArrowRight size={12} />
            </div>
        )}
    </div>
);

export const ExecutiveSummary: React.FC = () => {
    const navigate = useNavigate();
    const { profile, isDemo } = useAuth();
    const [metrics, setMetrics] = useState({
        complianceScore: 0,
        activeAlerts: 0,
        policiesReviewed: 0,
        trainedStaff: 0,
        daysToNextAudit: '--',
        gapAnalysisCredits: 0
    });
    const [loading, setLoading] = useState(!isDemo);

    useEffect(() => {
        if (isDemo) {
            // Demo data
            setMetrics({
                complianceScore: 78,
                activeAlerts: 3,
                policiesReviewed: 12,
                trainedStaff: 85,
                daysToNextAudit: '45',
                gapAnalysisCredits: 3
            });
            return;
        }

        const fetchMetrics = async () => {
            if (!profile?.organization_id) return;

            try {
                // Fetch latest compliance score
                const { data: scoreData } = await supabase
                    .from('compliance_analyses')
                    .select('overall_score')
                    .eq('organization_id', profile.organization_id)
                    .order('created_at', { ascending: false })
                    .limit(1)
                    .maybeSingle();

                // Fetch active alerts count
                const { count: alertCount } = await supabase
                    .from('compliance_alerts')
                    .select('*', { count: 'exact', head: true })
                    .eq('organization_id', profile.organization_id)
                    .eq('is_resolved', false);

                // Fetch credits
                const { data: creditData } = await supabase
                    .from('organization_credits')
                    .select('gap_analysis_credits')
                    .eq('organization_id', profile.organization_id)
                    .maybeSingle();

                setMetrics({
                    complianceScore: scoreData?.overall_score || 0,
                    activeAlerts: alertCount || 0,
                    policiesReviewed: 12, // Placeholder
                    trainedStaff: 85, // Placeholder
                    daysToNextAudit: '45', // Placeholder
                    gapAnalysisCredits: creditData?.gap_analysis_credits || 0
                });
            } catch (err) {
                console.error('Failed to fetch executive metrics:', err);
            } finally {
                setLoading(false);
            }
        };

        fetchMetrics();
    }, [profile?.organization_id, isDemo]);

    const getScoreColor = (score: number) => {
        if (score >= 80) return '#10b981';
        if (score >= 60) return '#f59e0b';
        return '#ef4444';
    };

    return (
        <div style={{ marginBottom: '2rem' }}>
            {/* Executive Header */}
            <div style={{
                background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
                borderRadius: '16px',
                padding: '2rem',
                marginBottom: '1.5rem',
                position: 'relative',
                overflow: 'hidden'
            }}>
                {/* Decorative elements */}
                <div style={{
                    position: 'absolute', top: '-50px', right: '-50px',
                    width: '200px', height: '200px',
                    background: 'radial-gradient(circle, rgba(14, 165, 233, 0.2) 0%, transparent 70%)',
                    borderRadius: '50%'
                }} />
                <div style={{
                    position: 'absolute', bottom: '-30px', left: '20%',
                    width: '100px', height: '100px',
                    background: 'radial-gradient(circle, rgba(139, 92, 246, 0.15) 0%, transparent 70%)',
                    borderRadius: '50%'
                }} />

                <div style={{ position: 'relative', zIndex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                        <Sparkles size={18} color="#fbbf24" />
                        <span style={{ color: '#fbbf24', fontWeight: 600, fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                            Executive Summary
                        </span>
                    </div>
                    <h2 style={{ color: 'white', fontSize: '1.5rem', fontWeight: 700, marginBottom: '0.5rem' }}>
                        Compliance Command Centre
                    </h2>
                    <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.9rem', maxWidth: '500px' }}>
                        Real-time overview of your regulatory health across all CQC domains. AI-powered insights updated continuously.
                    </p>
                </div>
            </div>

            {/* Metrics Grid */}
            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                gap: '1rem'
            }}>
                <MetricCard
                    title="CQC Readiness Score"
                    value={`${metrics.complianceScore}%`}
                    change={5}
                    icon={<Shield size={20} />}
                    color={getScoreColor(metrics.complianceScore)}
                    onClick={() => navigate('/cqc/gap-analysis')}
                />
                <MetricCard
                    title="Active Compliance Alerts"
                    value={metrics.activeAlerts}
                    icon={<AlertTriangle size={20} />}
                    color={metrics.activeAlerts > 0 ? '#ef4444' : '#10b981'}
                    onClick={() => navigate('/governance')}
                />
                <MetricCard
                    title="Policies Reviewed"
                    value={`${metrics.policiesReviewed}/24`}
                    change={8}
                    icon={<FileCheck size={20} />}
                    color="#8b5cf6"
                    onClick={() => navigate('/templates')}
                />
                <MetricCard
                    title="Staff Training Rate"
                    value={`${metrics.trainedStaff}%`}
                    change={12}
                    icon={<Users size={20} />}
                    color="#0ea5e9"
                    onClick={() => navigate('/training/evisa')}
                />
                <MetricCard
                    title="Days to Next Audit"
                    value={metrics.daysToNextAudit}
                    icon={<Clock size={20} />}
                    color="#f59e0b"
                />
                {(profile?.subscription_tier === 'free' || metrics.gapAnalysisCredits > 0) && (
                    <MetricCard
                        title="Analysis Credits"
                        value={metrics.gapAnalysisCredits}
                        icon={<Zap size={20} />}
                        color="#8b5cf6"
                        onClick={() => navigate('/pricing')}
                    />
                )}
            </div>

            {/* Quick Action Banner */}
            <div style={{
                marginTop: '1.5rem',
                padding: '1rem 1.25rem',
                background: 'linear-gradient(90deg, #ecfdf5 0%, #d1fae5 100%)',
                borderRadius: '10px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                border: '1px solid #a7f3d0'
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <div style={{
                        width: '36px', height: '36px', borderRadius: '8px',
                        background: '#10b981', display: 'flex', alignItems: 'center', justifyContent: 'center'
                    }}>
                        <Target size={18} color="white" />
                    </div>
                    <div>
                        <div style={{ fontWeight: 600, color: '#047857', fontSize: '0.9rem' }}>
                            Recommended Action
                        </div>
                        <div style={{ fontSize: '0.8rem', color: '#065f46' }}>
                            Complete your first AI Gap Analysis to establish baseline compliance score
                        </div>
                    </div>
                </div>
                <button
                    onClick={() => navigate('/cqc/gap-analysis')}
                    className="btn btn-primary"
                    style={{ background: '#047857', whiteSpace: 'nowrap' }}
                >
                    Start Now <ArrowRight size={16} />
                </button>
            </div>
        </div>
    );
};
