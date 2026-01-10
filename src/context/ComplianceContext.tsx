import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from './AuthContext';

export interface Location {
    id: string;
    name: string;
    type: 'Head Office' | 'Branch' | 'Care Home';
}

interface ComplianceState {
    companyName: string;
    serviceType: string;
    staffCount: number;
    serviceUsers: number;
    cqcStatus: 'active' | 'applying' | 'notyet';
    sponsorStatus: 'yes' | 'no' | 'pending';
    onboardingComplete: boolean;
    // Multi-site support
    locations: Location[];
    currentLocationId: string;
    loading: boolean;
}

interface ComplianceContextType extends ComplianceState {
    updateCompliance: (data: Partial<ComplianceState>) => Promise<void>;
    completeOnboarding: (data: Partial<ComplianceState>) => Promise<void>;
    switchLocation: (id: string) => void;
    getCurrentLocation: () => Location | undefined;
}

const defaultState: ComplianceState = {
    companyName: '',
    serviceType: 'domiciliary',
    staffCount: 0,
    serviceUsers: 0,
    cqcStatus: 'applying',
    sponsorStatus: 'pending',
    onboardingComplete: false,
    locations: [],
    currentLocationId: '',
    loading: true
};

const ComplianceContext = createContext<ComplianceContextType | undefined>(undefined);

export const ComplianceProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { user, profile, isDemo } = useAuth();
    const [state, setState] = useState<ComplianceState>(defaultState);

    // Initial Fetch
    useEffect(() => {
        if (isDemo) {
            // Demo Mode: Mock Data
            setState({
                ...defaultState,
                companyName: 'Demo Organization',
                locations: [
                    { id: '1', name: 'Liverpool HQ', type: 'Head Office' },
                    { id: '2', name: 'Manchester Branch', type: 'Branch' }
                ],
                currentLocationId: '1',
                onboardingComplete: true,
                loading: false
            });
            return;
        }

        if (!user || !profile?.organization_id) {
            setState(prev => ({ ...prev, loading: false }));
            return;
        }

        const fetchData = async () => {
            try {
                // 1. Fetch Metrics
                const { data: metrics } = await supabase
                    .from('compliance_metrics')
                    .select('*')
                    .eq('organization_id', profile.organization_id)
                    .single();

                // 2. Fetch Locations
                const { data: locations } = await supabase
                    .from('locations')
                    .select('*')
                    .eq('organization_id', profile.organization_id);

                // 3. Update State
                if (metrics) {
                    setState(prev => ({
                        ...prev,
                        companyName: profile.organization_name || '',
                        staffCount: metrics.staff_count,
                        serviceUsers: metrics.service_users_count,
                        serviceType: metrics.service_type || 'domiciliary',
                        cqcStatus: metrics.cqc_status as any,
                        sponsorStatus: metrics.sponsor_status as any,
                        onboardingComplete: metrics.onboarding_complete,
                        locations: locations || [],
                        currentLocationId: locations?.[0]?.id || '',
                        loading: false
                    }));
                } else {
                    // Fallback if no metrics found (should be created by trigger, but just in case)
                    setState(prev => ({ ...prev, loading: false }));
                }

            } catch (error) {
                console.error("Error fetching compliance data:", error);
                setState(prev => ({ ...prev, loading: false }));
            }
        };

        fetchData();
    }, [user, profile, isDemo]);

    const updateCompliance = async (data: Partial<ComplianceState>) => {
        // Optimistic Update
        setState(prev => ({ ...prev, ...data }));

        if (isDemo) return;

        if (profile?.organization_id) {
            try {
                // Map frontend state to DB columns
                const updates: any = {};
                if (data.staffCount !== undefined) updates.staff_count = data.staffCount;
                if (data.serviceUsers !== undefined) updates.service_users_count = data.serviceUsers;
                if (data.cqcStatus !== undefined) updates.cqc_status = data.cqcStatus;
                if (data.sponsorStatus !== undefined) updates.sponsor_status = data.sponsorStatus;
                if (data.serviceType !== undefined) updates.service_type = data.serviceType;
                if (data.onboardingComplete !== undefined) updates.onboarding_complete = data.onboardingComplete;

                if (Object.keys(updates).length > 0) {
                    await supabase
                        .from('compliance_metrics')
                        .update(updates)
                        .eq('organization_id', profile.organization_id);
                }
            } catch (error) {
                console.error("Error saving compliance data:", error);
            }
        }
    };

    const completeOnboarding = async (data: Partial<ComplianceState>) => {
        await updateCompliance({ ...data, onboardingComplete: true });
    };

    const switchLocation = (id: string) => {
        setState(prev => ({ ...prev, currentLocationId: id }));
    };

    const getCurrentLocation = () => {
        return state.locations.find(l => l.id === state.currentLocationId);
    };

    return (
        <ComplianceContext.Provider value={{ ...state, updateCompliance, completeOnboarding, switchLocation, getCurrentLocation }}>
            {children}
        </ComplianceContext.Provider>
    );
};

export const useCompliance = () => {
    const context = useContext(ComplianceContext);
    if (context === undefined) {
        throw new Error('useCompliance must be used within a ComplianceProvider');
    }
    return context;
};
