-- Regulatory Intelligence Tables
-- Stores regulatory updates from CQC, Home Office, NICE, and DHSC

-- ============================================
-- TABLE: regulatory_updates
-- Stores fetched regulatory updates
-- ============================================
CREATE TABLE IF NOT EXISTS public.regulatory_updates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    source TEXT NOT NULL CHECK (source IN ('cqc', 'home_office', 'nice', 'dhsc')),
    title TEXT NOT NULL,
    summary TEXT,
    url TEXT,
    published_date TIMESTAMPTZ NOT NULL,
    category TEXT,
    relevance_score INTEGER DEFAULT 50,
    raw_content JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for efficient filtering
CREATE INDEX IF NOT EXISTS idx_regulatory_updates_source ON public.regulatory_updates(source);
CREATE INDEX IF NOT EXISTS idx_regulatory_updates_published ON public.regulatory_updates(published_date DESC);

-- ============================================
-- TABLE: regulatory_update_reads
-- Tracks which updates each user has read
-- ============================================
CREATE TABLE IF NOT EXISTS public.regulatory_update_reads (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    update_id UUID REFERENCES public.regulatory_updates(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    read_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(update_id, user_id)
);

-- ============================================
-- TABLE: regulatory_subscriptions
-- Allows organizations to customize alert preferences
-- ============================================
CREATE TABLE IF NOT EXISTS public.regulatory_subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
    source TEXT NOT NULL,
    categories TEXT[] DEFAULT '{}',
    email_alerts BOOLEAN DEFAULT TRUE,
    dashboard_alerts BOOLEAN DEFAULT TRUE,
    minimum_relevance INTEGER DEFAULT 70,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(organization_id, source)
);

-- ============================================
-- Enable RLS
-- ============================================
ALTER TABLE public.regulatory_updates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.regulatory_update_reads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.regulatory_subscriptions ENABLE ROW LEVEL SECURITY;

-- Regulatory updates are public (read by all authenticated users)
CREATE POLICY "Authenticated users can read regulatory updates"
    ON public.regulatory_updates
    FOR SELECT
    TO authenticated
    USING (true);

-- Users can only see their own read status
CREATE POLICY "Users can manage their own read status"
    ON public.regulatory_update_reads
    FOR ALL
    TO authenticated
    USING (user_id = auth.uid());

-- Organization members can manage subscriptions
CREATE POLICY "Organization members can manage subscriptions"
    ON public.regulatory_subscriptions
    FOR ALL
    TO authenticated
    USING (
        organization_id IN (
            SELECT organization_id FROM public.profiles WHERE id = auth.uid()
        )
    );

-- ============================================
-- Seed some initial regulatory updates
-- ============================================
INSERT INTO public.regulatory_updates (source, title, summary, url, published_date, category, relevance_score)
VALUES 
    ('cqc', 'CQC Single Assessment Framework: Key Changes for 2024', 
     'The new framework introduces 34 quality statements replacing KLOEs. Providers must evidence continuous improvement across all areas.',
     'https://www.cqc.org.uk/guidance-providers/all-services/new-single-assessment-framework',
     NOW() - INTERVAL '7 days', 'Framework', 100),
    
    ('cqc', 'Regulation 9A: Visiting Rights in Care Homes', 
     'From January 2025, care homes must support unrestricted visiting as default. Restrictions must be proportionate and individually risk-assessed.',
     'https://www.cqc.org.uk/guidance-providers/residential-adult-social-care/visiting-rights',
     NOW() - INTERVAL '3 days', 'Regulations', 100),
    
    ('home_office', 'Sponsor Licence: New Right to Work Check Requirements', 
     'Share code verification must be completed within 5 working days. Failure to comply may result in civil penalties up to £45,000 per worker.',
     'https://www.gov.uk/government/publications/right-to-work-checks-employers-guide',
     NOW() - INTERVAL '14 days', 'Immigration', 95),
    
    ('nice', 'Updated Guidance: Falls Prevention in Older Adults (NG147)', 
     'New recommendations include multifactorial risk assessment, strength and balance training, and medication review for all at-risk residents.',
     'https://www.nice.org.uk/guidance/ng147',
     NOW() - INTERVAL '21 days', 'Clinical Guidance', 85),
    
    ('dhsc', 'Adult Social Care Workforce: £500m Training Fund Announced', 
     'New funding available for skills development, digital training, and care certificate completion. Applications open Q2 2025.',
     'https://www.gov.uk/government/news/adult-social-care-workforce-fund',
     NOW() - INTERVAL '10 days', 'Policy', 80),
    
    ('cqc', 'Infection Prevention and Control: Updated Audit Requirements', 
     'Providers must now conduct monthly IPC audits with documented action plans. CQC will assess evidence during inspections.',
     'https://www.cqc.org.uk/guidance-providers/all-services/infection-prevention-control',
     NOW() - INTERVAL '5 days', 'Guidance', 90)
ON CONFLICT DO NOTHING;

-- Grant permissions
GRANT SELECT ON public.regulatory_updates TO authenticated;
GRANT ALL ON public.regulatory_update_reads TO authenticated;
GRANT ALL ON public.regulatory_subscriptions TO authenticated;
