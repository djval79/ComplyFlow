-- =====================================================
-- TRIAL SETUP ON NEW ACCOUNTS
-- Sets 14-day trial on signup with Professional features
-- =====================================================

-- Update the handle_new_user function to set trial on new organizations
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
    new_org_id UUID;
    invite_org_id TEXT;
    provided_role TEXT;
BEGIN
    -- Check if organization_id is passed in metadata (Invite Flow)
    invite_org_id := NULLIF(NEW.raw_user_meta_data->>'organization_id', '');
    provided_role := NULLIF(NEW.raw_user_meta_data->>'role', '');

    IF invite_org_id IS NOT NULL THEN
        -- Verify the organization actually exists to prevent errors
        IF EXISTS (SELECT 1 FROM public.organizations WHERE id = invite_org_id::UUID) THEN
            new_org_id := invite_org_id::UUID;
        ELSE
             -- Fallback: create new org with trial
             INSERT INTO public.organizations (name, subscription_tier, trial_ends_at, trial_used)
             VALUES (
                COALESCE(NEW.raw_user_meta_data->>'organization_name', 'My Organization'),
                'pro',
                NOW() + INTERVAL '14 days',
                true
             )
             RETURNING id INTO new_org_id;
        END IF;
    ELSE
        -- Standard Flow: Create new organization with 14-day trial
        INSERT INTO public.organizations (name, subscription_tier, trial_ends_at, trial_used)
        VALUES (
            COALESCE(NEW.raw_user_meta_data->>'organization_name', 'My Organization'),
            'pro',  -- Professional tier during trial
            NOW() + INTERVAL '14 days',
            true    -- Prevent trial re-use
        )
        RETURNING id INTO new_org_id;
    END IF;

    -- Create the user's profile
    INSERT INTO public.profiles (id, email, full_name, organization_id, role)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'full_name', 'User'),
        new_org_id,
        CASE 
            WHEN invite_org_id IS NOT NULL THEN COALESCE(provided_role, 'member')
            ELSE 'owner' 
        END
    );

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- TRIAL EXPIRY FUNCTION
-- Called by pg_cron or Supabase Edge Function to downgrade expired trials
-- =====================================================

CREATE OR REPLACE FUNCTION public.expire_trials()
RETURNS INTEGER AS $$
DECLARE
    expired_count INTEGER;
BEGIN
    UPDATE public.organizations
    SET 
        subscription_tier = 'free',
        trial_ends_at = NULL  -- Clear to prevent re-triggering
    WHERE 
        trial_ends_at IS NOT NULL 
        AND trial_ends_at < NOW()
        AND subscription_tier != 'free';
    
    GET DIAGNOSTICS expired_count = ROW_COUNT;
    
    -- Log the expiry for audit
    IF expired_count > 0 THEN
        RAISE NOTICE 'Expired % trial(s)', expired_count;
    END IF;
    
    RETURN expired_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to service role (for Edge Functions / cron)
GRANT EXECUTE ON FUNCTION public.expire_trials() TO service_role;
