import posthog from 'posthog-js';

export type ABTestVariant = 'control' | 'test-a' | 'test-b';

interface ABTestConfig {
    flagName: string;
    variants: ABTestVariant[];
}

export const AB_TESTS = {
    LANDING_PAGE_HERO: {
        flagName: 'landing-page-hero',
        variants: ['control', 'test-a'] as ABTestVariant[],
    } as ABTestConfig,
};

export const abTestService = {
    /**
     * Get the variant for a specific feature flag.
     * Returns 'control' if the flag is not active or PostHog is not loaded.
     */
    getVariant: (config: ABTestConfig): ABTestVariant => {
        if (!posthog.__loaded) {
            return 'control';
        }

        const variant = posthog.getFeatureFlag(config.flagName);

        if (!variant || !config.variants.includes(variant as ABTestVariant)) {
            return 'control';
        }

        return variant as ABTestVariant;
    },

    /**
     * Track a conversion event with variant context.
     */
    trackConversion: (eventName: string, config: ABTestConfig, properties?: Record<string, any>) => {
        const variant = abTestService.getVariant(config);
        posthog.capture(eventName, {
            ...properties,
            ab_test_flag: config.flagName,
            ab_test_variant: variant,
        });
    },

    /**
     * Track a view event for a specific variant.
     * Use this when you want to specifically track that a user saw a variant.
     */
    trackView: (config: ABTestConfig) => {
        const variant = abTestService.getVariant(config);
        posthog.capture(`${config.flagName}_viewed`, {
            variant,
        });
    }
};
