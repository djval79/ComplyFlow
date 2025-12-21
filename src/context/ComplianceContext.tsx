import React, { createContext, useContext, useState, useEffect } from 'react';

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
}

interface ComplianceContextType extends ComplianceState {
    updateCompliance: (data: Partial<ComplianceState>) => void;
    completeOnboarding: (data: Partial<ComplianceState>) => void;
    switchLocation: (id: string) => void;
    getCurrentLocation: () => Location | undefined;
}

const defaultState: ComplianceState = {
    companyName: 'Demo Organization',
    serviceType: 'domiciliary',
    staffCount: 0,
    serviceUsers: 0,
    cqcStatus: 'applying',
    sponsorStatus: 'pending',
    onboardingComplete: false,
    locations: [
        { id: 'loc_hq', name: 'Liverpool HQ', type: 'Head Office' },
        { id: 'loc_north', name: 'Manchester Branch', type: 'Branch' },
        { id: 'loc_south', name: 'London Office', type: 'Branch' }
    ],
    currentLocationId: 'loc_hq',
};

const ComplianceContext = createContext<ComplianceContextType | undefined>(undefined);

export const ComplianceProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [state, setState] = useState<ComplianceState>(() => {
        const saved = localStorage.getItem('complyflow_state');
        if (saved) {
            const parsed = JSON.parse(saved);
            // Migration: Ensure new fields exist if loading old state
            if (!parsed.locations) {
                return { ...parsed, locations: defaultState.locations, currentLocationId: defaultState.currentLocationId };
            }
            return parsed;
        }
        return defaultState;
    });

    useEffect(() => {
        localStorage.setItem('complyflow_state', JSON.stringify(state));
    }, [state]);

    const updateCompliance = (data: Partial<ComplianceState>) => {
        setState(prev => ({ ...prev, ...data }));
    };

    const completeOnboarding = (data: Partial<ComplianceState>) => {
        setState(prev => ({ ...prev, ...data, onboardingComplete: true }));
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
