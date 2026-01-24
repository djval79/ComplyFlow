// Rota Service
// Manages shifts, assignments, and compliance checks for the Smart Rota feature

import { supabase } from '../lib/supabase';
import { getCompetencyMatrix, type StaffCompetency } from './competencyService';

export interface Shift {
    id: string;
    organization_id: string;
    title: string | null;
    start_time: string;
    end_time: string;
    role_required: string;
    client_name?: string;
    location_id: string | null;
    notes: string | null;
    is_published: boolean;
    assignments?: ShiftAssignment[];
}

export interface RotaTemplate {
    id: string;
    organization_id: string;
    name: string;
    description: string | null;
    schedule_data: TemplateShift[];
    created_at: string;
}

export interface TemplateShift {
    dayOffset: number; // 0-6 relative to start of week
    startTime: string; // HH:mm
    endTime: string;   // HH:mm
    roleRequired: string;
    clientName?: string;
    notes?: string;
}

export interface ShiftAssignment {
    id: string;
    shift_id: string;
    user_id: string;
    status: 'assigned' | 'confirmed' | 'declined' | 'completed' | 'no_show';
    assigned_by: string;
    assigned_at: string;
    user?: {
        full_name: string;
        job_title: string;
        avatar_url?: string;
    };
}

export interface RotaComplianceCheck {
    compliant: boolean;
    issues: string[]; // List of reasons e.g. "Expired Fire Safety", "Visa Expired"
}

/**
 * Fetch shifts for a specific date range (e.g. week view)
 */
export async function getShifts(organizationId: string, startDate: Date, endDate: Date): Promise<Shift[]> {
    const { data, error } = await supabase
        .from('shifts')
        .select(`
            *,
            assignments:shift_assignments(
                *,
                user:profiles(full_name, job_title, avatar_url)
            )
        `)
        .eq('organization_id', organizationId)
        .gte('start_time', startDate.toISOString())
        .lte('end_time', endDate.toISOString())
        .order('start_time');

    if (error) {
        console.error('Error fetching shifts:', error);
        return [];
    }

    return data as Shift[];
}

/**
 * Create a new shift
 */
export async function createShift(shift: Partial<Shift>): Promise<Shift | null> {
    const { data, error } = await supabase
        .from('shifts')
        .insert(shift)
        .select()
        .single();

    if (error) {
        console.error('Error creating shift:', error);
        return null;
    }

    return data as Shift;
}

/**
 * Check if a staff member is compliant for assignment
 * Uses the Competency Service to verify training status
 */
export async function checkStaffCompliance(organizationId: string, userId: string): Promise<RotaComplianceCheck> {
    // 1. Get the matrix for the org (cached/optimized in real app, strictly fetching here)
    const { staff } = await getCompetencyMatrix(organizationId);

    const staffMember = staff.find(s => s.user_id === userId);
    if (!staffMember) {
        return { compliant: false, issues: ['Staff member not found in competency matrix'] };
    }

    const issues: string[] = [];

    // 2. Check training status
    // Rule: Blocking if 'expired' or 'missing' for mandatory modules
    for (const [moduleId, status] of Object.entries(staffMember.status)) {
        if (status === 'expired') {
            issues.push(`Expired training (Module ID: ${moduleId})`);
        }
        // Strict mode: Block if missing mandatory (optional for now, can be configured)
        // if (status === 'missing') {
        //     issues.push(`Missing training (Module ID: ${moduleId})`);
        // }
    }

    // 3. Future expansions: Check Visa status from sponsored_workers table
    // (To be implemented when linking worker IDs directly)

    return {
        compliant: issues.length === 0,
        issues
    };
}

/**
 * Assign staff to a shift with compliance guard
 */
export async function assignStaffToShift(
    shiftId: string,
    userId: string,
    assignedBy: string,
    organizationId: string,
    overrideCompliance: boolean = false
): Promise<{ success: boolean; error?: string; complianceIssues?: string[] }> {

    // 1. Run compliance check first
    const compliance = await checkStaffCompliance(organizationId, userId);

    if (!compliance.compliant && !overrideCompliance) {
        return {
            success: false,
            error: 'Compliance check failed',
            complianceIssues: compliance.issues
        };
    }

    // 2. Perform assignment
    const { error } = await supabase
        .from('shift_assignments')
        .insert({
            shift_id: shiftId,
            user_id: userId,
            assigned_by: assignedBy,
            status: 'assigned'
        });

    if (error) {
        if (error.code === '23505') { // Unique violation
            return { success: false, error: 'User already assigned to this shift' };
        }
        console.error('Error assigning staff:', error);
        return { success: false, error: error.message };
    }

    return { success: true };
}

/**
 * Delete a shift
 */
export async function deleteShift(shiftId: string): Promise<boolean> {
    const { error } = await supabase
        .from('shifts')
        .delete()
        .eq('id', shiftId);

    if (error) {
        console.error('Error deleting shift:', error);
        return false;
    }
    return true;
}

/**
 * Remove assignment
 */
export async function removeAssignment(assignmentId: string): Promise<boolean> {
    const { error } = await supabase
        .from('shift_assignments')
        .delete()
        .eq('id', assignmentId);

    if (error) {
        console.error('Error removing assignment:', error);
        return false;
    }
    return true;
}

// ================= ROTA TEMPLATES =================

export async function getRotaTemplates(organizationId: string): Promise<RotaTemplate[]> {
    const { data, error } = await supabase
        .from('rota_templates')
        .select('*')
        .eq('organization_id', organizationId)
        .order('created_at', { ascending: false });

    if (error) {
        console.error('Error fetching templates:', error);
        return [];
    }
    return data as RotaTemplate[];
}

export async function createRotaTemplate(
    organizationId: string,
    name: string,
    description: string,
    shifts: Shift[],
    weekStart: Date
): Promise<RotaTemplate | null> {

    // Convert shifts to relative template format
    const schedule_data: TemplateShift[] = shifts.map(shift => {
        const shiftStart = new Date(shift.start_time);
        const shiftEnd = new Date(shift.end_time);

        // Calculate day offset (0-6)
        const diffTime = Math.abs(shiftStart.getTime() - weekStart.getTime());
        const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

        return {
            dayOffset: diffDays,
            startTime: shiftStart.toISOString().split('T')[1].substring(0, 5), // HH:mm
            endTime: shiftEnd.toISOString().split('T')[1].substring(0, 5),     // HH:mm
            roleRequired: shift.role_required,
            clientName: shift.client_name,
            notes: shift.notes || undefined
        };
    });

    const { data, error } = await supabase
        .from('rota_templates')
        .insert([{
            organization_id: organizationId,
            name,
            description,
            schedule_data
        }])
        .select()
        .single();

    if (error) {
        console.error('Error creating template:', error);
        throw error;
    }
    return data as RotaTemplate;
}

export async function applyRotaTemplate(
    organizationId: string,
    templateId: string,
    targetWeekStart: Date
): Promise<void> {
    // 1. Get the template
    const { data: template, error: fetchError } = await supabase
        .from('rota_templates')
        .select('*')
        .eq('id', templateId)
        .single();

    if (fetchError || !template) throw fetchError || new Error('Template not found');

    const scheduleData = template.schedule_data as TemplateShift[];
    const shiftsToCreate: any[] = [];

    // 2. Generate shifts for the target week
    for (const item of scheduleData) {
        const shiftDate = new Date(targetWeekStart);
        shiftDate.setDate(shiftDate.getDate() + item.dayOffset);

        const dateStr = shiftDate.toISOString().split('T')[0];

        // Construct ISO strings
        const startIso = `${dateStr}T${item.startTime}:00`;
        let endIso = `${dateStr}T${item.endTime}:00`;

        // Handle overnight
        if (item.endTime < item.startTime) {
            const endDate = new Date(shiftDate);
            endDate.setDate(endDate.getDate() + 1);
            const endDateStr = endDate.toISOString().split('T')[0];
            endIso = `${endDateStr}T${item.endTime}:00`;
        }

        shiftsToCreate.push({
            organization_id: organizationId,
            start_time: new Date(startIso).toISOString(),
            end_time: new Date(endIso).toISOString(),
            role_required: item.roleRequired,
            client_name: item.clientName,
            notes: item.notes,
            is_published: false
        });
    }

    if (shiftsToCreate.length === 0) return;

    // 3. Batch insert
    const { error: insertError } = await supabase
        .from('shifts')
        .insert(shiftsToCreate);

    if (insertError) throw insertError;
}
