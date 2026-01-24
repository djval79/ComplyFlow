import posthog from 'posthog-js';

const POSTHOG_KEY = import.meta.env.VITE_POSTHOG_KEY;
const POSTHOG_HOST = import.meta.env.VITE_POSTHOG_HOST || 'https://eu.i.posthog.com';

export const initPostHog = () => {
    if (POSTHOG_KEY) {
        posthog.init(POSTHOG_KEY, {
            api_host: POSTHOG_HOST,
            person_profiles: 'identified_only', // Better privacy/cost control
            capture_pageview: false, // We will manually handle pageviews for React Router
        });
    } else {
        console.warn('PostHog key not found in environment variables.');
    }
};

export const captureEvent = (eventName: string, properties?: Record<string, any>) => {
    if (posthog.__loaded) {
        posthog.capture(eventName, properties);
    }
};
