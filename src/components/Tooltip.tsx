import React, { useState, useRef, useEffect } from 'react';
import { HelpCircle } from 'lucide-react';

interface TooltipProps {
    content: string;
    children: React.ReactNode;
    position?: 'top' | 'bottom' | 'left' | 'right';
    showIcon?: boolean;
    maxWidth?: number;
}

export const Tooltip: React.FC<TooltipProps> = ({
    content,
    children,
    position = 'top',
    showIcon = false,
    maxWidth = 250
}) => {
    const [isVisible, setIsVisible] = useState(false);
    const [coords, setCoords] = useState({ top: 0, left: 0 });
    const triggerRef = useRef<HTMLDivElement>(null);
    const tooltipRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!isVisible || !triggerRef.current || !tooltipRef.current) return;

        const triggerRect = triggerRef.current.getBoundingClientRect();
        const tooltipRect = tooltipRef.current.getBoundingClientRect();
        const padding = 8;

        let top = 0;
        let left = 0;

        switch (position) {
            case 'top':
                top = triggerRect.top - tooltipRect.height - padding;
                left = triggerRect.left + triggerRect.width / 2 - tooltipRect.width / 2;
                break;
            case 'bottom':
                top = triggerRect.bottom + padding;
                left = triggerRect.left + triggerRect.width / 2 - tooltipRect.width / 2;
                break;
            case 'left':
                top = triggerRect.top + triggerRect.height / 2 - tooltipRect.height / 2;
                left = triggerRect.left - tooltipRect.width - padding;
                break;
            case 'right':
                top = triggerRect.top + triggerRect.height / 2 - tooltipRect.height / 2;
                left = triggerRect.right + padding;
                break;
        }

        // Clamp to viewport
        left = Math.max(8, Math.min(left, window.innerWidth - tooltipRect.width - 8));
        top = Math.max(8, Math.min(top, window.innerHeight - tooltipRect.height - 8));

        setCoords({ top, left });
    }, [isVisible, position]);

    return (
        <div
            ref={triggerRef}
            onMouseEnter={() => setIsVisible(true)}
            onMouseLeave={() => setIsVisible(false)}
            onFocus={() => setIsVisible(true)}
            onBlur={() => setIsVisible(false)}
            style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}
        >
            {children}
            {showIcon && (
                <HelpCircle
                    size={14}
                    color="var(--color-text-tertiary)"
                    style={{ cursor: 'help', flexShrink: 0 }}
                />
            )}

            {isVisible && (
                <div
                    ref={tooltipRef}
                    role="tooltip"
                    style={{
                        position: 'fixed',
                        top: coords.top,
                        left: coords.left,
                        maxWidth: maxWidth,
                        padding: '0.5rem 0.75rem',
                        background: 'var(--color-primary)',
                        color: 'white',
                        fontSize: '0.8125rem',
                        fontWeight: 500,
                        lineHeight: 1.4,
                        borderRadius: '8px',
                        boxShadow: 'var(--shadow-lg)',
                        zIndex: 10001,
                        pointerEvents: 'none',
                        animation: 'tooltipFadeIn 0.15s ease-out'
                    }}
                >
                    {content}
                    {/* Arrow */}
                    <div
                        style={{
                            position: 'absolute',
                            width: '8px',
                            height: '8px',
                            background: 'var(--color-primary)',
                            transform: 'rotate(45deg)',
                            ...(position === 'top' && {
                                bottom: '-4px',
                                left: '50%',
                                marginLeft: '-4px'
                            }),
                            ...(position === 'bottom' && {
                                top: '-4px',
                                left: '50%',
                                marginLeft: '-4px'
                            }),
                            ...(position === 'left' && {
                                right: '-4px',
                                top: '50%',
                                marginTop: '-4px'
                            }),
                            ...(position === 'right' && {
                                left: '-4px',
                                top: '50%',
                                marginTop: '-4px'
                            })
                        }}
                    />
                </div>
            )}

            <style>{`
                @keyframes tooltipFadeIn {
                    from { opacity: 0; transform: scale(0.95); }
                    to { opacity: 1; transform: scale(1); }
                }
            `}</style>
        </div>
    );
};

// HelpTooltip - Convenience wrapper with info icon
export const HelpTooltip: React.FC<{
    content: string;
    position?: 'top' | 'bottom' | 'left' | 'right';
}> = ({ content, position = 'top' }) => {
    return (
        <Tooltip content={content} position={position}>
            <HelpCircle
                size={16}
                color="var(--color-text-tertiary)"
                style={{ cursor: 'help' }}
            />
        </Tooltip>
    );
};
