
export interface SubscriptionTier {
    id: string;
    name: string;
    price: string;
    period: string;
    description: string;
    features: string[];
    resources: string[]; // "Resources they are meant to have"
    cta: string;
    recommended?: boolean;
}

export const SUBSCRIPTION_TIERS: SubscriptionTier[] = [
    {
        id: 'tier_free',
        name: 'Essential',
        price: '£0',
        period: 'forever',
        description: 'For single care homes starting their compliance journey.',
        features: [
            'Basic CQC Self-Assessment',
            'Regulation 9A Checklist',
            'Manual Policy Uploads',
            'Community Support'
        ],
        resources: [
            'Basic Templates (PDF)',
            'Weekly Compliance News'
        ],
        cta: 'Current Plan'
    },
    {
        id: 'tier_pro',
        name: 'Professional',
        price: '£49',
        period: 'per month',
        description: 'AI-powered compliance for growing care providers.',
        recommended: true,
        features: [
            'AI Gap Analyzer (Unlimited)',
            'Auto-Draft Policy Fixes (New)',
            'Governance Dashboard (Live CQC Data)',
            'Sponsor Licence System',
            'Up to 5 Users'
        ],
        resources: [
            'Full Policy Library (Editable Word)',
            'Mock Inspection Scenarios',
            '24/7 AI Regulatory Assistant',
            'Priority Email Support'
        ],
        cta: 'Upgrade to Pro'
    },
    {
        id: 'tier_enterprise',
        name: 'Corporate',
        price: 'Custom',
        period: 'annual billing',
        description: 'For care groups requiring API integration and multi-site oversight.',
        features: [
            'Multi-Site Dashboard',
            'Source Layer API Access',
            'Custom AI Model Fine-Tuning',
            'Single Sign-On (SSO)',
            'Unlimited Users'
        ],
        resources: [
            'Dedicated Account Manager',
            'Quarterly Compliance Strategy Review',
            'Legal Support Hotline Access'
        ],
        cta: 'Contact Sales'
    }
];
