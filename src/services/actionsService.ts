/**
 * Actions Service
 * 
 * CRUD operations for compliance actions - tracking issues
 * from mock inspections, gap analyses, and manual entries.
 */

import { supabase } from '../lib/supabase';

export interface ComplianceAction {
    id: string;
    organization_id: string;
    source: 'mock_inspection' | 'gap_analysis' | 'regulatory_update' | 'manual';
    source_id?: string;
    quality_statement_id?: string;
    key_question?: 'safe' | 'effective' | 'caring' | 'responsive' | 'wellLed';
    title: string;
    description?: string;
    recommendation?: string;
    assigned_to?: string;
    assigned_by?: string;
    due_date?: string;
    priority: 'low' | 'medium' | 'high' | 'critical';
    status: 'open' | 'in_progress' | 'resolved' | 'overdue' | 'deferred';
    evidence_urls?: string[];
    resolution_notes?: string;
    resolved_at?: string;
    resolved_by?: string;
    created_at: string;
    updated_at: string;
}

export interface CreateActionInput {
    source: ComplianceAction['source'];
    source_id?: string;
    quality_statement_id?: string;
    key_question?: ComplianceAction['key_question'];
    title: string;
    description?: string;
    recommendation?: string;
    assigned_to?: string;
    due_date?: string;
    priority?: ComplianceAction['priority'];
}

export interface ActionStats {
    total: number;
    open: number;
    in_progress: number;
    overdue: number;
    resolved: number;
    by_key_question: Record<string, number>;
}

/**
 * Get all actions for the current user's organization
 */
export async function getActions(filters?: {
    status?: ComplianceAction['status'];
    priority?: ComplianceAction['priority'];
    key_question?: ComplianceAction['key_question'];
    assigned_to?: string;
}): Promise<ComplianceAction[]> {
    let query = supabase
        .from('compliance_actions')
        .select('*')
        .order('created_at', { ascending: false });

    if (filters?.status) {
        query = query.eq('status', filters.status);
    }
    if (filters?.priority) {
        query = query.eq('priority', filters.priority);
    }
    if (filters?.key_question) {
        query = query.eq('key_question', filters.key_question);
    }
    if (filters?.assigned_to) {
        query = query.eq('assigned_to', filters.assigned_to);
    }

    const { data, error } = await query;

    if (error) {
        console.error('Error fetching actions:', error);
        throw error;
    }

    return data || [];
}

/**
 * Create a new compliance action
 */
export async function createAction(
    organizationId: string,
    input: CreateActionInput
): Promise<ComplianceAction> {
    const { data: profile } = await supabase.auth.getUser();

    const { data, error } = await supabase
        .from('compliance_actions')
        .insert({
            organization_id: organizationId,
            ...input,
            assigned_by: profile.user?.id,
            status: 'open',
            priority: input.priority || 'medium'
        })
        .select()
        .single();

    if (error) {
        console.error('Error creating action:', error);
        throw error;
    }

    return data;
}

/**
 * Create multiple actions at once (e.g., from mock inspection results)
 */
export async function createBulkActions(
    organizationId: string,
    inputs: CreateActionInput[]
): Promise<ComplianceAction[]> {
    const { data: profile } = await supabase.auth.getUser();

    const actionsToInsert = inputs.map(input => ({
        organization_id: organizationId,
        ...input,
        assigned_by: profile.user?.id,
        status: 'open',
        priority: input.priority || 'medium'
    }));

    const { data, error } = await supabase
        .from('compliance_actions')
        .insert(actionsToInsert)
        .select();

    if (error) {
        console.error('Error creating bulk actions:', error);
        throw error;
    }

    return data || [];
}

/**
 * Update an action's status
 */
export async function updateActionStatus(
    actionId: string,
    status: ComplianceAction['status'],
    resolutionNotes?: string
): Promise<ComplianceAction> {
    const { data: profile } = await supabase.auth.getUser();

    const updateData: Record<string, unknown> = { status };

    if (status === 'resolved') {
        updateData.resolved_at = new Date().toISOString();
        updateData.resolved_by = profile.user?.id;
        if (resolutionNotes) {
            updateData.resolution_notes = resolutionNotes;
        }
    }

    const { data, error } = await supabase
        .from('compliance_actions')
        .update(updateData)
        .eq('id', actionId)
        .select()
        .single();

    if (error) {
        console.error('Error updating action status:', error);
        throw error;
    }

    return data;
}

/**
 * Upload evidence file to Supabase Storage and link to action
 */
export async function uploadActionEvidence(
    actionId: string,
    organizationId: string,
    file: File
): Promise<string> {
    const fileExt = file.name.split('.').pop();
    const fileName = `${actionId}/${Math.random().toString(36).substring(2)}.${fileExt}`;
    const filePath = `${organizationId}/${fileName}`;

    // 1. Upload to Supabase Storage
    const { data: uploadData, error: uploadError } = await supabase.storage
        .from('compliance-evidence')
        .upload(filePath, file);

    if (uploadError) {
        console.error('Error uploading file:', uploadError);
        throw uploadError;
    }

    // 2. Get Public URL
    const { data: { publicUrl } } = supabase.storage
        .from('compliance-evidence')
        .getPublicUrl(filePath);

    // 3. Link to action
    await addEvidence(actionId, publicUrl);

    return publicUrl;
}

/**
 * Add evidence to an action
 */
export async function addEvidence(
    actionId: string,
    evidenceUrl: string
): Promise<ComplianceAction> {
    // First get existing evidence
    const { data: existing } = await supabase
        .from('compliance_actions')
        .select('evidence_urls')
        .eq('id', actionId)
        .single();

    const currentEvidence = existing?.evidence_urls || [];

    const { data, error } = await supabase
        .from('compliance_actions')
        .update({
            evidence_urls: [...currentEvidence, evidenceUrl]
        })
        .eq('id', actionId)
        .select()
        .single();

    if (error) {
        console.error('Error adding evidence:', error);
        throw error;
    }

    return data;
}

/**
 * Delete an action
 */
export async function deleteAction(actionId: string): Promise<void> {
    const { error } = await supabase
        .from('compliance_actions')
        .delete()
        .eq('id', actionId);

    if (error) {
        console.error('Error deleting action:', error);
        throw error;
    }
}

/**
 * Get action statistics for dashboard
 */
export async function getActionStats(): Promise<ActionStats> {
    const { data, error } = await supabase
        .from('compliance_actions')
        .select('status, key_question');

    if (error) {
        console.error('Error fetching action stats:', error);
        return {
            total: 0,
            open: 0,
            in_progress: 0,
            overdue: 0,
            resolved: 0,
            by_key_question: {}
        };
    }

    const actions = data || [];
    const stats: ActionStats = {
        total: actions.length,
        open: actions.filter(a => a.status === 'open').length,
        in_progress: actions.filter(a => a.status === 'in_progress').length,
        overdue: actions.filter(a => a.status === 'overdue').length,
        resolved: actions.filter(a => a.status === 'resolved').length,
        by_key_question: {}
    };

    // Count by key question
    actions.forEach(action => {
        if (action.key_question) {
            stats.by_key_question[action.key_question] =
                (stats.by_key_question[action.key_question] || 0) + 1;
        }
    });

    return stats;
}

/**
 * Get actions due soon (next 7 days)
 */
export async function getUpcomingActions(days: number = 7): Promise<ComplianceAction[]> {
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + days);

    const { data, error } = await supabase
        .from('compliance_actions')
        .select('*')
        .in('status', ['open', 'in_progress'])
        .lte('due_date', futureDate.toISOString().split('T')[0])
        .order('due_date', { ascending: true });

    if (error) {
        console.error('Error fetching upcoming actions:', error);
        return [];
    }

    return data || [];
}
