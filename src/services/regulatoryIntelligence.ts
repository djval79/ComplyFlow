// Regulatory Intelligence Service
// Fetches and caches regulatory updates from CQC and Home Office

import { supabase } from '../lib/supabase';

export interface RegulatoryUpdate {
    id: string;
    source: 'cqc' | 'home_office' | 'nice' | 'dhsc';
    title: string;
    summary: string;
    url: string;
    published_date: string;
    category: string;
    relevance_score: number;
    is_read: boolean;
}

// Official RSS/API endpoints for regulatory bodies
const REGULATORY_SOURCES = {
    cqc: {
        name: 'Care Quality Commission',
        rssUrl: 'https://www.cqc.org.uk/news/releases/rss.xml',
        guidanceUrl: 'https://www.cqc.org.uk/guidance-providers/all-services',
    },
    home_office: {
        name: 'Home Office',
        sponsorUrl: 'https://www.gov.uk/government/organisations/uk-visas-and-immigration',
        rtWUrl: 'https://www.gov.uk/prove-right-to-work',
    },
    nice: {
        name: 'NICE Guidelines',
        rssUrl: 'https://www.nice.org.uk/rss/nicepdfs.xml',
    },
    dhsc: {
        name: 'Department of Health & Social Care',
        newsUrl: 'https://www.gov.uk/government/organisations/department-of-health-and-social-care',
    }
};

// Cache duration in hours
const CACHE_DURATION_HOURS = 24;

/**
 * Fetch regulatory updates from CQC RSS feed
 * Note: This requires a CORS proxy in production
 */
export async function fetchCQCUpdates(): Promise<RegulatoryUpdate[]> {
    try {
        // In production, use a Supabase Edge Function to bypass CORS
        const response = await fetch('/api/regulatory-feed?source=cqc');
        if (!response.ok) throw new Error('Failed to fetch CQC updates');
        return await response.json();
    } catch (error) {
        console.error('Error fetching CQC updates:', error);
        return [];
    }
}

/**
 * Get cached regulatory updates from Supabase
 */
export async function getCachedUpdates(organizationId: string): Promise<RegulatoryUpdate[]> {
    const { data, error } = await supabase
        .from('regulatory_updates')
        .select('*')
        .order('published_date', { ascending: false })
        .limit(50);

    if (error) {
        console.error('Error fetching cached updates:', error);
        return [];
    }

    return data || [];
}

/**
 * Mark an update as read
 */
export async function markUpdateAsRead(updateId: string, userId: string): Promise<void> {
    await supabase
        .from('regulatory_update_reads')
        .upsert({
            update_id: updateId,
            user_id: userId,
            read_at: new Date().toISOString()
        });
}

/**
 * Get unread update count for badge display
 */
export async function getUnreadCount(userId: string): Promise<number> {
    const { count, error } = await supabase
        .from('regulatory_updates')
        .select('id', { count: 'exact', head: true })
        .not('id', 'in',
            supabase
                .from('regulatory_update_reads')
                .select('update_id')
                .eq('user_id', userId)
        );

    return count || 0;
}

/**
 * AI-powered relevance scoring for updates
 * Uses Gemini to assess how relevant an update is to care home compliance
 */
export async function scoreUpdateRelevance(
    update: { title: string; summary: string },
    organizationType: string = 'care_home'
): Promise<number> {
    // In production, call Gemini API to score relevance 0-100
    // For now, use keyword matching
    const keywords = [
        'care home', 'residential care', 'nursing', 'CQC', 'inspection',
        'safeguarding', 'regulation', 'compliance', 'staffing', 'medication',
        'infection control', 'visiting', 'sponsor licence', 'right to work'
    ];

    const text = `${update.title} ${update.summary}`.toLowerCase();
    const matchCount = keywords.filter(k => text.includes(k)).length;
    return Math.min(100, (matchCount / keywords.length) * 100 + 20);
}

// ============ STATIC FALLBACK DATA ============
// Used when API calls fail or for demo mode

export const DEMO_REGULATORY_UPDATES: RegulatoryUpdate[] = [
    {
        id: 'update-1',
        source: 'cqc',
        title: 'CQC publishes updated guidance on infection prevention and control',
        summary: 'New guidance emphasizes the importance of regular audits and staff training in maintaining IPC standards.',
        url: 'https://www.cqc.org.uk/guidance-providers/adult-social-care/infection-prevention-control',
        published_date: new Date().toISOString(),
        category: 'Guidance',
        relevance_score: 95,
        is_read: false
    },
    {
        id: 'update-2',
        source: 'home_office',
        title: 'Changes to Right to Work checks from April 2025',
        summary: 'Employers must now verify share codes within 5 working days. Extended grace period removed.',
        url: 'https://www.gov.uk/prove-right-to-work',
        published_date: new Date(Date.now() - 86400000).toISOString(),
        category: 'Immigration',
        relevance_score: 90,
        is_read: false
    },
    {
        id: 'update-3',
        source: 'cqc',
        title: 'Regulation 9A: Visiting Rights now in force',
        summary: 'Care homes must implement unrestricted visiting as a default. CQC will assess compliance during inspections.',
        url: 'https://www.cqc.org.uk/news',
        published_date: new Date(Date.now() - 172800000).toISOString(),
        category: 'Regulations',
        relevance_score: 100,
        is_read: false
    },
    {
        id: 'update-4',
        source: 'nice',
        title: 'NICE updates falls prevention guidance for older adults',
        summary: 'New recommendations include multifactorial risk assessments and strength and balance training.',
        url: 'https://www.nice.org.uk/guidance',
        published_date: new Date(Date.now() - 259200000).toISOString(),
        category: 'Clinical Guidance',
        relevance_score: 85,
        is_read: true
    },
    {
        id: 'update-5',
        source: 'dhsc',
        title: 'Adult Social Care Reform White Paper: Key changes for 2025/26',
        summary: 'Government outlines plans for fair cost of care, workforce training fund, and technology adoption grants.',
        url: 'https://www.gov.uk/government/organisations/department-of-health-and-social-care',
        published_date: new Date(Date.now() - 345600000).toISOString(),
        category: 'Policy',
        relevance_score: 80,
        is_read: true
    }
];
