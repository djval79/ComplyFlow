// Competency Service
// Service layer for Staff Competency Heatmaps

import { supabase } from '../lib/supabase';

export interface TrainingModule {
    id: string;
    name: string;
    category: 'mandatory' | 'clinical' | 'specialist' | 'other';
    description: string;
    validity_months: number;
}

export interface TrainingRequirement {
    id: string;
    organization_id: string;
    job_title: string;
    module_id: string;
    is_mandatory: boolean;
    module?: TrainingModule;
}

export interface StaffCompetency {
    user_id: string;
    user_name: string;
    job_title: string;
    status: Record<string, CompetencyStatus>; // keys are module_ids
    expiries: Record<string, string>; // keys are module_ids, values are ISO dates
}

export type CompetencyStatus = 'valid' | 'expiring' | 'expired' | 'missing' | 'not_required';

export interface TrainingCompletion {
    id: string;
    user_id: string;
    module_id: string;
    module_name: string;
    score: number;
    passed: boolean;
    completed_at: string;
    expires_at: string | null;
    certificate_url: string | null;
}

/**
 * Fetch all training modules
 */
export async function getTrainingModules(): Promise<TrainingModule[]> {
    const { data, error } = await supabase
        .from('training_modules')
        .select('*')
        .order('name');

    if (error) {
        console.error('Error fetching training modules:', error);
        return DEMO_MODULES; // Fallback to demo data
    }

    return data as TrainingModule[];
}

/**
 * Fetch competency matrix for an organization
 */
export async function getCompetencyMatrix(organizationId: string): Promise<{ modules: TrainingModule[], staff: StaffCompetency[] }> {
    try {
        // 1. Get modules
        const modules = await getTrainingModules();

        // 2. Get staff profiles
        const { data: profiles, error: profileError } = await supabase
            .from('profiles')
            .select('id, full_name, job_title')
            .eq('organization_id', organizationId);

        if (profileError) throw profileError;

        // 3. Get all completions
        const { data: completions, error: completionError } = await supabase
            .from('training_completions')
            .select('*')
            .eq('organization_id', organizationId);

        if (completionError) throw completionError;

        // 4. Build the matrix
        const staffCompetencies: StaffCompetency[] = profiles.map(profile => {
            const status: Record<string, CompetencyStatus> = {};
            const expiries: Record<string, string> = {};

            modules.forEach(module => {
                // Find latest completion for this user and module
                const userCompletions = completions.filter(c => c.user_id === profile.id && c.module_id === module.id);
                // Sort by verified/latest
                const latest = userCompletions.sort((a, b) => new Date(b.completed_at).getTime() - new Date(a.completed_at).getTime())[0];

                if (!latest || !latest.passed) {
                    status[module.id] = 'missing';
                } else {
                    const expiryDate = latest.expires_at ? new Date(latest.expires_at) : null;

                    if (expiryDate) {
                        expiries[module.id] = expiryDate.toISOString();
                        const daysUntilExpiry = Math.ceil((expiryDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24));

                        if (daysUntilExpiry < 0) {
                            status[module.id] = 'expired';
                        } else if (daysUntilExpiry < 30) {
                            status[module.id] = 'expiring';
                        } else {
                            status[module.id] = 'valid';
                        }
                    } else {
                        // If no expiry date (e.g. one-off training), assume valid if passed
                        status[module.id] = 'valid';
                    }
                }
            });

            return {
                user_id: profile.id,
                user_name: profile.full_name || 'Unknown User',
                job_title: profile.job_title || 'Staff',
                status,
                expiries
            };
        });

        return { modules, staff: staffCompetencies };

    } catch (error) {
        console.error('Error building competency matrix:', error);
        return { modules: DEMO_MODULES, staff: DEMO_STAFF_COMPETENCIES };
    }
}

/**
 * Record a training completion manually (e.g. uploaded certificate)
 */
export async function recordManualCompletion(
    organizationId: string,
    userId: string,
    moduleId: string,
    moduleName: string,
    completedAt: Date,
    validityMonths: number,
    certificateUrl?: string
): Promise<boolean> {

    const expiresAt = new Date(completedAt);
    expiresAt.setMonth(expiresAt.getMonth() + validityMonths);

    const { error } = await supabase
        .from('training_completions')
        .insert({
            organization_id: organizationId,
            user_id: userId,
            module_id: moduleId,
            module_name: moduleName,
            score: 100,
            passed: true,
            completed_at: completedAt.toISOString(),
            expires_at: expiresAt.toISOString(),
            certificate_url: certificateUrl
        });

    if (error) {
        console.error('Error recording completion:', error);
        return false;
    }
    return true;
}

// ============ DEMO DATA ============

export const DEMO_MODULES: TrainingModule[] = [
    { id: 'mod-1', name: 'Fire Safety', category: 'mandatory', description: 'Annual fire safety.', validity_months: 12 },
    { id: 'mod-2', name: 'Safeguarding', category: 'mandatory', description: 'Adult protection.', validity_months: 36 },
    { id: 'mod-3', name: 'Manual Handling', category: 'mandatory', description: 'Safe moving.', validity_months: 12 },
    { id: 'mod-4', name: 'Infection Control', category: 'mandatory', description: 'Hygiene standards.', validity_months: 12 },
    { id: 'mod-5', name: 'Medication', category: 'clinical', description: 'Safe admin.', validity_months: 12 },
    { id: 'mod-6', name: 'First Aid', category: 'mandatory', description: 'Basic life support.', validity_months: 36 },
    { id: 'mod-7', name: 'Dementia Care', category: 'specialist', description: 'Supporting data.', validity_months: 36 },
    { id: 'mod-8', name: 'GDPR', category: 'mandatory', description: 'Data protection.', validity_months: 24 }
];

export const DEMO_STAFF_COMPETENCIES: StaffCompetency[] = [
    {
        user_id: 'user-1',
        user_name: 'Sarah Jenkins',
        job_title: 'Care Manager',
        status: {
            'mod-1': 'valid', 'mod-2': 'valid', 'mod-3': 'valid', 'mod-4': 'valid',
            'mod-5': 'valid', 'mod-6': 'expiring', 'mod-7': 'valid', 'mod-8': 'valid'
        },
        expiries: {
            'mod-1': '2026-12-01', 'mod-6': '2026-02-15' // Expiring soon
        }
    },
    {
        user_id: 'user-2',
        user_name: 'David Okonjo',
        job_title: 'Senior Carer',
        status: {
            'mod-1': 'valid', 'mod-2': 'valid', 'mod-3': 'expired', 'mod-4': 'valid',
            'mod-5': 'valid', 'mod-6': 'valid', 'mod-7': 'valid', 'mod-8': 'missing'
        },
        expiries: {
            'mod-3': '2025-11-20' // Expired
        }
    },
    {
        user_id: 'user-3',
        user_name: 'Maria Gonzalez',
        job_title: 'Care Assistant',
        status: {
            'mod-1': 'missing', 'mod-2': 'valid', 'mod-3': 'valid', 'mod-4': 'valid',
            'mod-5': 'missing', 'mod-6': 'valid', 'mod-7': 'missing', 'mod-8': 'valid'
        },
        expiries: {}
    },
    {
        user_id: 'user-4',
        user_name: 'James Smith',
        job_title: 'Care Assistant',
        status: {
            'mod-1': 'valid', 'mod-2': 'valid', 'mod-3': 'valid', 'mod-4': 'valid',
            'mod-5': 'not_required', 'mod-6': 'valid', 'mod-7': 'valid', 'mod-8': 'valid'
        },
        expiries: {}
    }
];
