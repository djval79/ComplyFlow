-- Add AI-powered analysis columns to regulatory_updates
-- Phase 2 of Regulatory Intelligence System

ALTER TABLE public.regulatory_updates
ADD COLUMN IF NOT EXISTS ai_summary TEXT,
ADD COLUMN IF NOT EXISTS ai_action_items JSONB;

COMMENT ON COLUMN public.regulatory_updates.ai_summary IS 'AI-generated summary of the regulatory impact from a care provider perspective';
COMMENT ON COLUMN public.regulatory_updates.ai_action_items IS 'List of practical action items extracted from the update';
