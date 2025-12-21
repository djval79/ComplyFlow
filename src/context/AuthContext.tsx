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
}

interface AuthContextType {
    user: User | null;
    profile: UserProfile | null;
    session: Session | null;
    loading: boolean;
    isDemo: boolean;
    isAuthenticated: boolean; // New flag to track if user is "logged in" regardless of mode
    signUp: (email: string, password: string, fullName: string, orgName: string) => Promise<{ error: any }>;
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
                // Create a timeout promise
                const timeoutPromise = new Promise((_, reject) =>
                    setTimeout(() => reject(new Error('Auth timeout')), 5000)
                );

                // Race between auth and timeout
                const sessionPromise = supabase.auth.getSession();

                const { data: { session } } = await Promise.race([
                    sessionPromise,
                    timeoutPromise
                ]) as any;

                if (mounted) {
                    setSession(session);
                    setUser(session?.user ?? null);

                    if (session?.user) {
                        // Don't let profile fetch block the UI indefinitely either
                        fetchProfile(session.user.id).catch(console.error);
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
                await fetchProfile(session.user.id);
            } else {
                setProfile(null);
            }
        });

        return () => subscription.unsubscribe();
    }, [isDemo]);

    const fetchProfile = async (userId: string) => {
        try {
            const { data, error } = await supabase
                .from('profiles')
                .select(`
                    *,
                    organizations(name)
                `)
                .eq('id', userId)
                .single();

            if (error) throw error;

            if (data) {
                setProfile({
                    ...data,
                    organization_name: data.organizations?.name || null
                });
            }
        } catch (error) {
            console.error('Error fetching profile:', error);
        }
    };

    const signUp = async (email: string, password: string, fullName: string, orgName: string) => {
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
                data: {
                    full_name: fullName,
                    organization_name: orgName,
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
