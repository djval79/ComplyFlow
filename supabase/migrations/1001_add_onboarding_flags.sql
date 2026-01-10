-- =====================================================
-- FIX MISSING COLUMNS
-- Adds onboarding tracking columns to tables
-- =====================================================

DO $$ 
BEGIN
    -- Add onboarding_completed to profiles
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'onboarding_completed') THEN
        ALTER TABLE public.profiles ADD COLUMN onboarding_completed BOOLEAN DEFAULT false;
    END IF;

    -- Add is_onboarded to organizations
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'organizations' AND column_name = 'is_onboarded') THEN
        ALTER TABLE public.organizations ADD COLUMN is_onboarded BOOLEAN DEFAULT false;
    END IF;
END $$;
