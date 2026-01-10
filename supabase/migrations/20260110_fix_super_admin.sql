
-- Fix User Profile and Grant Enterprise Access
DO $$
DECLARE
    target_user_id UUID := '91241a65-729b-4934-afe4-c1cb0ffaa654';
    target_email TEXT := 'mrsonirie@gmail.com';
    org_id UUID;
BEGIN
    -- 1. Try to find existing organization linkage
    SELECT organization_id INTO org_id FROM public.profiles WHERE id = target_user_id;

    -- 2. If linked, update that org. If not, create new 'Enterprise' org.
    IF org_id IS NOT NULL THEN
        UPDATE public.organizations
        SET subscription_tier = 'enterprise',
            name = COALESCE(name, 'ComplyFlow Enterprise HQ')
        WHERE id = org_id;
    ELSE
        INSERT INTO public.organizations (name, subscription_tier, is_onboarded)
        VALUES ('ComplyFlow Enterprise HQ', 'enterprise', true)
        RETURNING id INTO org_id;
    END IF;

    -- 3. Prepare Profile Upsert
    -- We use ON CONFLICT to update if exists, INSERT if not.
    INSERT INTO public.profiles (id, email, full_name, role, organization_id, onboarding_completed)
    VALUES (target_user_id, target_email, 'Super Admin User', 'owner', org_id, true)
    ON CONFLICT (id) DO UPDATE
    SET 
        organization_id = org_id,
        role = 'owner',
        onboarding_completed = true,
        email = target_email;

END $$;
