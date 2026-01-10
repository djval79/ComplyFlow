-- =====================================================
-- FIX INVITE LOGIC TRIGGER
-- Allows users to join existing organizations via metadata
-- =====================================================

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
        -- If it doesn't exist, we fallback to creating a new one (safety net)
        IF EXISTS (SELECT 1 FROM public.organizations WHERE id = invite_org_id::UUID) THEN
            new_org_id := invite_org_id::UUID;
        ELSE
             INSERT INTO public.organizations (name)
             VALUES (COALESCE(NEW.raw_user_meta_data->>'organization_name', 'My Organization'))
             RETURNING id INTO new_org_id;
        END IF;
    ELSE
        -- Standard Flow: Create a new organization
        INSERT INTO public.organizations (name)
        VALUES (COALESCE(NEW.raw_user_meta_data->>'organization_name', 'My Organization'))
        RETURNING id INTO new_org_id;
    END IF;

    -- Create the user's profile
    INSERT INTO public.profiles (id, email, full_name, organization_id, role)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'full_name', 'User'),
        new_org_id,
        -- If invited, use passed role (default member), else owner
        CASE 
            WHEN invite_org_id IS NOT NULL THEN COALESCE(provided_role, 'member')
            ELSE 'owner' 
        END
    );

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
