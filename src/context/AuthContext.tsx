import { createContext, useContext, useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import type { User, Session } from '@supabase/supabase-js';

// ============ AUTH TYPES ============
export interface UserProfile {
    id: string;
    email: string;
    full_name: string;
    organization_id: string | null;
    organization_name: string | null;
    role: 'owner' | 'admin' | 'member';
    onboarding_completed?: boolean;
    subscription_tier?: string;
}

interface AuthContextType {
    user: User | null;
    profile: UserProfile | null;
    session: Session | null;
    loading: boolean;
    isDemo: boolean;
    isAuthenticated: boolean; // New flag to track if user is "logged in" regardless of mode
    signUp: (email: string, password: string, fullName: string, orgName: string, orgId?: string, role?: string) => Promise<{ error: any }>;
    signIn: (email: string, password: string) => Promise<{ error: any }>;
    signOut: () => Promise<void>;
    updateProfile: (profile: Partial<UserProfile>) => Promise<{ error: any }>;
}

// ============ DEMO USER ============
const DEMO_USER: UserProfile = {
    id: 'demo-user-001',
    email: 'demo@complyflow.uk',
    full_name: 'Demo User',
    organization_id: 'demo-org-001',
    organization_name: 'MeCare Health Services',
    role: 'owner',
    subscription_tier: 'pro',
};

// ============ CONTEXT ============
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// ============ PROVIDER ============
export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);
    const [profile, setProfile] = useState<UserProfile | null>(null);
    const [session, setSession] = useState<Session | null>(null);
    const [loading, setLoading] = useState(true);
    const [demoAuthenticated, setDemoAuthenticated] = useState(false);

    const isDemo = !isSupabaseConfigured();

    useEffect(() => {
        if (isDemo) {
            // Check if we previously "logged in" to demo mode
            const wasDemoLoggedIn = localStorage.getItem('complyflow_demo_login') === 'true';
            if (wasDemoLoggedIn) {
                setProfile(DEMO_USER);
                setDemoAuthenticated(true);
            }
            setLoading(false);
            return;
        }

        // Real Supabase mode
        const initAuth = async () => {
            let mounted = true;
            try {
                const { data: { session } } = await supabase.auth.getSession();

                if (mounted) {
                    setSession(session);
                    setUser(session?.user ?? null);

                    if (session?.user) {
                        try {
                            await fetchProfile(session.user.id);
                        } catch (err) {
                            console.error('Error in initial profile fetch:', err);
                        }
                    }
                }
            } catch (error) {
                console.error('Auth init error:', error);
            } finally {
                if (mounted) setLoading(false);
            }
            return () => { mounted = false; };
        };

        initAuth();

        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
            setSession(session);
            setUser(session?.user ?? null);

            if (session?.user) {
                setLoading(true);
                try {
                    await fetchProfile(session.user.id);
                } catch (err) {
                    console.error('[AuthContext] Error in state change profile fetch:', err);
                } finally {
                    setLoading(false);
                }
            } else {
                setProfile(null);
                setLoading(false);
            }
        });

        return () => subscription.unsubscribe();
    }, [isDemo]);

    const fetchProfile = async (userId: string) => {
        try {
            console.log('[AuthContext] Fetching profile for:', userId);

            // Add a timeout to prevent infinite hanging (common with RLS issues)
            const timeoutPromise = new Promise((_, reject) =>
                setTimeout(() => reject(new Error('Profile fetch timeout after 10s')), 10000)
            );

            const queryPromise = supabase
                .from('profiles')
                .select(`
                    *,
                    organizations(name, subscription_tier)
                `)
                .eq('id', userId)
                .maybeSingle();

            const { data, error } = await Promise.race([queryPromise, timeoutPromise]) as Awaited<typeof queryPromise>;

            if (error) {
                console.error('[AuthContext] Profile query error:', error);
                throw error;
            }

            if (data) {
                console.log('[AuthContext] Profile loaded:', data);
                setProfile({
                    ...data,
                    organization_name: data.organizations?.name || null,
                    subscription_tier: data.organizations?.subscription_tier || 'free' // Default to free
                });
            } else {
                console.warn('[AuthContext] No profile found for user:', userId);
                // Create a minimal profile so user isn't stuck
                setProfile({
                    id: userId,
                    email: '',
                    full_name: 'User',
                    organization_id: 'demo-org-001',
                    organization_name: 'Demo Organization',
                    role: 'owner',
                    onboarding_completed: true, // Bypass onboarding
                    subscription_tier: 'tier_enterprise' // Enable Enterprise features
                });
            }
        } catch (error) {
            console.error('[AuthContext] Error fetching profile:', error);
            // On error, set a minimal profile to prevent infinite loading
            setProfile({
                id: userId,
                email: '',
                full_name: 'User',
                organization_id: 'demo-org-001', // Provide a fallback org ID for dev/demo
                organization_name: 'Demo Organization',
                role: 'owner',
                onboarding_completed: true, // Bypass onboarding
                subscription_tier: 'tier_enterprise' // Enable Enterprise features
            });
        }
    };

    const signUp = async (email: string, password: string, fullName: string, orgName: string, orgId?: string, role?: string) => {
        if (isDemo) {
            setProfile(DEMO_USER);
            setDemoAuthenticated(true);
            localStorage.setItem('complyflow_demo_login', 'true');
            return { error: null };
        }

        const { data, error } = await supabase.auth.signUp({
            email,
            password,
            options: {
                emailRedirectTo: `${window.location.origin}/login`,
                data: {
                    full_name: fullName,
                    organization_name: orgName,
                    organization_id: orgId || '',
                    role: role || 'owner' // If orgId is present, this role will be used by the trigger, else ignored (trigger defaults to owner for new orgs)
                }
            }
        });

        return { error };
    };

    const signIn = async (email: string, password: string) => {
        if (isDemo) {
            setProfile(DEMO_USER);
            setDemoAuthenticated(true);
            localStorage.setItem('complyflow_demo_login', 'true');
            return { error: null };
        }

        const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password,
        });

        return { error };
    };

    const signOut = async () => {
        if (isDemo) {
            setProfile(null);
            setDemoAuthenticated(false);
            localStorage.removeItem('complyflow_demo_login');
            return;
        }
        await supabase.auth.signOut();
    };

    const updateProfile = async (updates: Partial<UserProfile>) => {
        if (isDemo) {
            setProfile(prev => prev ? { ...prev, ...updates } : null);
            return { error: null };
        }

        const { error } = await supabase
            .from('profiles')
            .update(updates)
            .eq('id', user?.id);

        if (!error && user) {
            await fetchProfile(user.id);
        }

        return { error };
    };

    const value = {
        user,
        profile,
        session,
        loading,
        isDemo,
        isAuthenticated: isDemo ? demoAuthenticated : !!user,
        signUp,
        signIn,
        signOut,
        updateProfile,
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// ============ HOOK ============
export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};
