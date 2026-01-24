/**
 * Sentry Error Tracking Configuration
 * Phase 4: Performance & Security
 */

import * as Sentry from '@sentry/react';

const SENTRY_DSN = import.meta.env.VITE_SENTRY_DSN;

export function initSentry() {
    // Only initialize if DSN is configured (production)
    if (!SENTRY_DSN) {
        console.log('[Sentry] No DSN configured, skipping initialization');
        return;
    }

    Sentry.init({
        dsn: SENTRY_DSN,
        environment: import.meta.env.MODE, // 'development' or 'production'

        // Performance monitoring
        tracesSampleRate: 0.1, // 10% of transactions

        // Release tracking - set via build process
        release: `complyflow@${import.meta.env.VITE_APP_VERSION || '1.0.0'}`,

        // Session replay for debugging (optional, uses more quota)
        replaysSessionSampleRate: 0,
        replaysOnErrorSampleRate: 0.1,

        // Filter out noisy errors
        ignoreErrors: [
            'ResizeObserver loop limit exceeded',
            'ResizeObserver loop completed with undelivered notifications',
            'Non-Error promise rejection captured',
            'Network request failed',
            'Load failed',
        ],

        // Before sending an error, you can modify it
        beforeSend(event, hint) {
            // Don't send errors in development
            if (import.meta.env.DEV) {
                console.log('[Sentry] Would send event:', event);
                return null;
            }
            return event;
        },
    });

    console.log('[Sentry] Initialized successfully');
}

// Export Sentry for use in error boundaries
export { Sentry };
