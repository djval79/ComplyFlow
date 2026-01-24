import React from 'react';

export const SkeletonMetric = () => (
    <div className="card animate-pulse" style={{ background: 'white' }}>
        <div style={{ height: '14px', width: '60%', background: '#f1f5f9', borderRadius: '4px', marginBottom: '12px' }} />
        <div style={{ height: '28px', width: '40%', background: '#e2e8f0', borderRadius: '6px' }} />
    </div>
);

export const SkeletonCard = () => (
    <div className="card animate-pulse" style={{ background: 'white', padding: '1.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>
            <div style={{ width: '20px', height: '20px', background: '#f1f5f9', borderRadius: '4px' }} />
            <div style={{ height: '18px', width: '120px', background: '#f1f5f9', borderRadius: '4px' }} />
        </div>
        <div className="space-y-4">
            {[1, 2, 3].map(i => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.75rem', background: '#f8fafc', borderRadius: '8px' }}>
                    <div className="space-y-2" style={{ flex: 1 }}>
                        <div style={{ height: '14px', width: '40%', background: '#e2e8f0', borderRadius: '4px' }} />
                        <div style={{ height: '10px', width: '30%', background: '#f1f5f9', borderRadius: '4px' }} />
                    </div>
                    <div style={{ width: '60px', height: '20px', background: '#f1f5f9', borderRadius: '10px' }} />
                </div>
            ))}
        </div>
    </div>
);

export const SkeletonTable = ({ rows = 5 }: { rows?: number }) => (
    <div className="card animate-pulse" style={{ background: 'white' }}>
        <div style={{ height: '20px', width: '200px', background: '#f1f5f9', borderRadius: '4px', marginBottom: '1.5rem' }} />
        <div style={{ border: '1px solid #f1f5f9', borderRadius: '8px', overflow: 'hidden' }}>
            {[...Array(rows)].map((_, i) => (
                <div key={i} style={{ display: 'flex', padding: '1rem', borderBottom: i === rows - 1 ? 'none' : '1px solid #f1f5f9' }}>
                    <div style={{ flex: 2, height: '14px', background: '#e2e8f0', borderRadius: '4px', marginRight: '1rem' }} />
                    <div style={{ flex: 1, height: '14px', background: '#f1f5f9', borderRadius: '4px', marginRight: '1rem' }} />
                    <div style={{ flex: 1, height: '14px', background: '#f1f5f9', borderRadius: '4px' }} />
                </div>
            ))}
        </div>
    </div>
);
