import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { DOMParser } from "https://deno.land/x/deno_dom@v0.1.38/deno-dom-wasm.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

/**
 * Regulatory Feed Edge Function
 * Fetches and caches regulatory updates from CQC, Home Office, NICE, and DHSC
 * 
 * This function is designed to run on a schedule (daily) or on-demand
 */

const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
}

// RSS Feed URLs
const RSS_FEEDS = {
    cqc: 'https://www.cqc.org.uk/news/releases/rss.xml',
    nice: 'https://www.nice.org.uk/rss/nicepdfs.xml',
}

// Gov.uk API for Home Office and DHSC
const GOV_UK_API = 'https://www.gov.uk/api/search.json'

interface RegulatoryUpdate {
    source: string
    title: string
    summary: string
    url: string
    published_date: string
    category: string
    relevance_score: number
}

// Keywords for relevance scoring
const RELEVANCE_KEYWORDS = [
    { term: 'care home', weight: 20 },
    { term: 'residential care', weight: 20 },
    { term: 'nursing home', weight: 20 },
    { term: 'cqc', weight: 15 },
    { term: 'care quality commission', weight: 15 },
    { term: 'safeguarding', weight: 15 },
    { term: 'inspection', weight: 12 },
    { term: 'regulation', weight: 10 },
    { term: 'compliance', weight: 10 },
    { term: 'staffing', weight: 8 },
    { term: 'medication', weight: 8 },
    { term: 'infection', weight: 8 },
    { term: 'visiting', weight: 8 },
    { term: 'sponsor licence', weight: 15 },
    { term: 'right to work', weight: 15 },
    { term: 'immigration', weight: 10 },
    { term: 'older people', weight: 5 },
    { term: 'adult social care', weight: 12 },
]

function calculateRelevance(title: string, summary: string): number {
    const text = `${title} ${summary}`.toLowerCase()
    let score = 30 // Base score

    for (const keyword of RELEVANCE_KEYWORDS) {
        if (text.includes(keyword.term)) {
            score += keyword.weight
        }
    }

    return Math.min(100, score)
}

async function fetchCQCUpdates(): Promise<RegulatoryUpdate[]> {
    try {
        const response = await fetch(RSS_FEEDS.cqc)
        if (!response.ok) throw new Error('Failed to fetch CQC feed')

        const xml = await response.text()
        const parser = new DOMParser()
        const doc = parser.parseFromString(xml, 'text/xml')

        if (!doc) return []

        const items = doc.querySelectorAll('item')
        const updates: RegulatoryUpdate[] = []

        items.forEach((item: Element) => {
            const title = item.querySelector('title')?.textContent || ''
            const link = item.querySelector('link')?.textContent || ''
            const description = item.querySelector('description')?.textContent || ''
            const pubDate = item.querySelector('pubDate')?.textContent || ''

            updates.push({
                source: 'cqc',
                title,
                summary: description.slice(0, 300),
                url: link,
                published_date: new Date(pubDate).toISOString(),
                category: 'News',
                relevance_score: calculateRelevance(title, description)
            })
        })

        return updates.slice(0, 20) // Limit to 20 most recent
    } catch (error) {
        console.error('Error fetching CQC updates:', error)
        return []
    }
}

async function fetchGovUkUpdates(organization: string): Promise<RegulatoryUpdate[]> {
    try {
        const params = new URLSearchParams({
            filter_organisations: organization,
            count: '20',
            order: '-public_timestamp'
        })

        const response = await fetch(`${GOV_UK_API}?${params}`)
        if (!response.ok) throw new Error(`Failed to fetch ${organization} updates`)

        const data = await response.json()
        const updates: RegulatoryUpdate[] = []

        for (const result of data.results || []) {
            const source = organization.includes('home-office') ? 'home_office' : 'dhsc'

            updates.push({
                source,
                title: result.title || '',
                summary: result.description || '',
                url: `https://www.gov.uk${result.link}`,
                published_date: result.public_timestamp || new Date().toISOString(),
                category: result.format || 'Policy',
                relevance_score: calculateRelevance(result.title || '', result.description || '')
            })
        }

        return updates
    } catch (error) {
        console.error(`Error fetching ${organization} updates:`, error)
        return []
    }
}

serve(async (req: Request) => {
    // Handle CORS
    if (req.method === "OPTIONS") {
        return new Response("ok", { headers: corsHeaders })
    }

    try {
        const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? ""
        const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
        const supabase = createClient(supabaseUrl, supabaseServiceKey)

        // Fetch from all sources
        const [cqcUpdates, homeOfficeUpdates, dhscUpdates] = await Promise.all([
            fetchCQCUpdates(),
            fetchGovUkUpdates('home-office'),
            fetchGovUkUpdates('department-of-health-and-social-care')
        ])

        const allUpdates = [
            ...cqcUpdates,
            ...homeOfficeUpdates,
            ...dhscUpdates
        ]

        // Filter by minimum relevance (only store updates with score >= 50)
        const relevantUpdates = allUpdates.filter(u => u.relevance_score >= 50)

        // Upsert to database (avoid duplicates by URL)
        for (const update of relevantUpdates) {
            const { error } = await supabase
                .from('regulatory_updates')
                .upsert({
                    source: update.source,
                    title: update.title,
                    summary: update.summary,
                    url: update.url,
                    published_date: update.published_date,
                    category: update.category,
                    relevance_score: update.relevance_score,
                    updated_at: new Date().toISOString()
                }, {
                    onConflict: 'url',
                    ignoreDuplicates: false
                })

            if (error) {
                console.error('Error upserting update:', error)
            }
        }

        return new Response(
            JSON.stringify({
                success: true,
                fetched: allUpdates.length,
                stored: relevantUpdates.length,
                sources: {
                    cqc: cqcUpdates.length,
                    home_office: homeOfficeUpdates.length,
                    dhsc: dhscUpdates.length
                }
            }),
            { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        )

    } catch (error) {
        console.error('Error in regulatory-feed function:', error)
        return new Response(
            JSON.stringify({ error: error instanceof Error ? error.message : String(error) }),
            {
                headers: { ...corsHeaders, "Content-Type": "application/json" },
                status: 500
            }
        )
    }
})
