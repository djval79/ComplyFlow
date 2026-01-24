import { supabase } from '../lib/supabase';
import { callEdgeFunctionAI, shouldUseEdgeFunction, runWithRetry, initializeAI } from './aiCore';
import { CQC_KNOWLEDGE_BASE } from '../data/cqcKnowledgeBase';

const MOCK_TEMPLATES: PolicyTemplate[] = [
    {
        id: 'mock-safeguarding',
        name: 'Safeguarding Adults Policy',
        description: 'Comprehensive policy for protecting adults at risk from abuse and neglect, aligned with CQC Regulation 13.',
        category: 'policy',
        regulation_ids: ['Reg 13'],
        quality_statement_ids: ['S3'],
        key_questions: ['safe'],
        service_types: ['residential', 'domiciliary', 'supported'],
        content: '# Safeguarding Adults Policy\n\n## 1. Policy Statement\n\n[Organisation Name] is committed to safeguarding all adults using our services. We have a zero-tolerance approach to abuse and neglect of any kind.',
        content_format: 'markdown',
        version: '1.0',
        is_premium: false,
        is_published: true,
        downloads: 147,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
    },
    {
        id: 'mock-medication',
        name: 'Medication Management Policy',
        description: 'Policy for safe handling, administration, and recording of medicines in accordance with Regulation 12.',
        category: 'policy',
        regulation_ids: ['Reg 12'],
        quality_statement_ids: ['S8'],
        key_questions: ['safe'],
        service_types: ['residential', 'domiciliary'],
        content: '# Medication Management Policy\n\n## 1. Policy Statement\n\n[Organisation Name] is committed to ensuring all medicines are managed safely.',
        content_format: 'markdown',
        version: '1.0',
        is_premium: false,
        is_published: true,
        downloads: 89,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
    },
    {
        id: 'mock-whistleblowing',
        name: 'Whistleblowing Policy',
        description: 'Encouraging staff to report concerns about safety or quality of care without fear of reprisal.',
        category: 'policy',
        regulation_ids: ['Reg 17'],
        quality_statement_ids: ['W1'],
        key_questions: ['wellLed'],
        service_types: ['residential', 'domiciliary', 'supported'],
        content: '# Whistleblowing Policy\n\n## 1. Introduction\n\n[Organisation Name] is committed to the highest standards of openness, probity, and accountability.',
        content_format: 'markdown',
        version: '1.0',
        is_premium: false,
        is_published: true,
        downloads: 156,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
    },
    {
        id: 'mock-complaints',
        name: 'Complaints & Compliments Policy',
        description: 'Procedure for managing feedback and formal complaints in line with Regulation 16.',
        category: 'policy',
        regulation_ids: ['Reg 16'],
        quality_statement_ids: ['R2'],
        key_questions: ['responsive'],
        service_types: ['residential', 'domiciliary', 'supported'],
        content: '# Complaints Policy\n\n## 1. Our Commitment\n\nWe value feedback and aim to resolve complaints quickly and fairly.',
        content_format: 'markdown',
        version: '1.0',
        is_premium: false,
        is_published: true,
        downloads: 201,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
    },
    {
        id: 'mock-gdpr',
        name: 'Data Protection (GDPR) Policy',
        description: 'Ensuring the safe handling of personal data for residents and staff.',
        category: 'policy',
        regulation_ids: ['Reg 17'],
        quality_statement_ids: ['W2'],
        key_questions: ['wellLed'],
        service_types: ['residential', 'domiciliary', 'supported'],
        content: '# Data Protection Policy\n\n## 1. Scope\n\nAll personal data processed by [Organisation Name] is subject to this policy.',
        content_format: 'markdown',
        version: '1.0',
        is_premium: false,
        is_published: true,
        downloads: 312,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
    },
    {
        id: 'mock-consent',
        name: 'Consent Form Template',
        description: 'Template for obtaining and recording consent for care and treatment.',
        category: 'form',
        regulation_ids: ['Reg 11'],
        quality_statement_ids: ['E6'],
        key_questions: ['effective'],
        service_types: ['residential', 'domiciliary', 'supported'],
        content: '# Consent to Care and Treatment\n\n## Service User Details\n\n| Field | Information |\n|-------|-------------|',
        content_format: 'markdown',
        version: '1.0',
        is_premium: false,
        is_published: true,
        downloads: 234,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
    },
    {
        id: 'mock-incident',
        name: 'Incident & Accident Report',
        description: 'Standard form for recording and analyzing adverse events.',
        category: 'form',
        regulation_ids: ['Reg 12'],
        quality_statement_ids: ['S2'],
        key_questions: ['safe'],
        service_types: ['residential', 'domiciliary', 'supported'],
        content: '# Incident Report Form\n\n**Date of Incident:** __________\n**Time:** __________\n**Location:** __________',
        content_format: 'markdown',
        version: '1.0',
        is_premium: false,
        is_published: true,
        downloads: 412,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
    },
    {
        id: 'mock-fire-audit',
        name: 'Weekly Fire Safety Audit',
        description: 'Internal audit of fire exits, alarms, and emergency lighting.',
        category: 'audit',
        regulation_ids: ['Reg 15'],
        quality_statement_ids: ['S5'],
        key_questions: ['safe'],
        service_types: ['residential'],
        content: '# Fire Safety Audit\n\n- [ ] Fire doors clear?\n- [ ] Alarms tested?\n- [ ] Extinguishers in place?',
        content_format: 'markdown',
        version: '1.0',
        is_premium: false,
        is_published: true,
        downloads: 128,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
    },
    {
        id: 'mock-checklist',
        name: 'Pre-Inspection Checklist',
        description: 'Comprehensive checklist to prepare for a CQC inspection visit.',
        category: 'checklist',
        regulation_ids: ['Reg 17'],
        quality_statement_ids: ['W5'],
        key_questions: ['wellLed'],
        service_types: ['residential', 'domiciliary', 'supported'],
        content: '# CQC Pre-Inspection Checklist\n\nUse this checklist to ensure you are ready for an announced or unannounced CQC inspection.',
        content_format: 'markdown',
        version: '1.0',
        is_premium: false,
        is_published: true,
        downloads: 562,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
    },
    {
        id: 'mock-daily-log',
        name: 'Daily Activities Log',
        description: 'Recording daily interactions and support provided to residents.',
        category: 'checklist',
        regulation_ids: ['Reg 10'],
        quality_statement_ids: ['C1'],
        key_questions: ['caring'],
        service_types: ['residential', 'supported'],
        content: '# Daily Activity Log\n\n**Resident:** __________\n**Date:** __________',
        content_format: 'markdown',
        version: '1.0',
        is_premium: false,
        is_published: true,
        downloads: 876,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
    },
    {
        id: 'mock-procedure-evac',
        name: 'Emergency Evacuation Procedure',
        description: 'Step-by-step guide for safe evacuation of the premises.',
        category: 'procedure',
        regulation_ids: ['Reg 12'],
        quality_statement_ids: ['S5'],
        key_questions: ['safe'],
        service_types: ['residential'],
        content: '# Emergency Evacuation Procedure\n\n1. Alert the Manager\n2. Call 999\n3. Evacuate via fire exits',
        content_format: 'markdown',
        version: '1.0',
        is_premium: false,
        is_published: true,
        downloads: 145,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
    },
    {
        id: 'mock-recruitment',
        name: 'Staff Recruitment Policy',
        description: 'Safe recruitment practices including DBS checks and reference verification (Schedule 3).',
        category: 'policy',
        regulation_ids: ['Reg 18'],
        quality_statement_ids: ['W4', 'S1'],
        key_questions: ['safe', 'wellLed'],
        service_types: ['residential', 'domiciliary', 'supported'],
        content: '# Recruitment & Selection Policy\n\n## 1. Objective\n\nTo ensure all staff recruited have the right skills and values to provide safe care.',
        content_format: 'markdown',
        version: '1.0',
        is_premium: false,
        is_published: true,
        downloads: 189,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
    },
    {
        id: 'mock-training',
        name: 'Staff Training & Development Policy',
        description: 'Ensuring all staff complete Care Certificate and mandatory training refreshers.',
        category: 'policy',
        regulation_ids: ['Reg 18'],
        quality_statement_ids: ['E2'],
        key_questions: ['effective'],
        service_types: ['residential', 'domiciliary', 'supported'],
        content: '# Training Policy\n\n## 1. Mandatory Training\n\nAll staff must complete training in Safeguarding, Medication, and First Aid.',
        content_format: 'markdown',
        version: '1.0',
        is_premium: false,
        is_published: true,
        downloads: 245,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
    },
    {
        id: 'mock-visiting',
        name: 'Visiting & Staying Out Policy (Reg 9A)',
        description: 'Protecting the rights of residents to receive visitors and maintain relationships.',
        category: 'policy',
        regulation_ids: ['Reg 9A'],
        quality_statement_ids: ['C2'],
        key_questions: ['caring'],
        service_types: ['residential'],
        content: '# Visiting Policy\n\n## 1. Respecting Rights\n\nWe facilitate visiting for all residents unless a specific risk assessment prevents it.',
        content_format: 'markdown',
        version: '1.0',
        is_premium: false,
        is_published: true,
        downloads: 112,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
    },
    {
        id: 'mock-candour',
        name: 'Duty of Candour Policy',
        description: 'Procedure for being open and honest when things go wrong, as per Regulation 20.',
        category: 'policy',
        regulation_ids: ['Reg 20'],
        quality_statement_ids: ['W3'],
        key_questions: ['wellLed'],
        service_types: ['residential', 'domiciliary', 'supported'],
        content: '# Duty of Candour Policy\n\n## 1. Statutory Duty\n\nWe have a legal duty to inform service users when a "notifiable safety incident" occurs.',
        content_format: 'markdown',
        version: '1.0',
        is_premium: false,
        is_published: true,
        downloads: 98,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
    },
    {
        id: 'mock-risk-assessment',
        name: 'General Risk Assessment Template',
        description: 'Template for identifying, assessing, and mitigating risks within the care environment.',
        category: 'form',
        regulation_ids: ['Reg 12', 'Reg 15'],
        quality_statement_ids: ['S2'],
        key_questions: ['safe'],
        service_types: ['residential', 'domiciliary', 'supported'],
        content: '# General Risk Assessment\n\n**Activity/Area:** __________\n**Assessor:** __________\n**Date:** __________',
        content_format: 'markdown',
        version: '1.0',
        is_premium: false,
        is_published: true,
        downloads: 456,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
    },
    {
        id: 'mock-coshh',
        name: 'COSHH Assessment Form',
        description: 'Control of Substances Hazardous to Health (COSHH) assessment for cleaning and medical supplies.',
        category: 'form',
        regulation_ids: ['Reg 12', 'Reg 15'],
        quality_statement_ids: ['S2', 'S5'],
        key_questions: ['safe'],
        service_types: ['residential', 'domiciliary'],
        content: '# COSHH Assessment\n\n**Substance Name:** __________\n**Manufacturer:** __________\n**Hazard Level:** Low / Medium / High',
        content_format: 'markdown',
        version: '1.0',
        is_premium: false,
        is_published: true,
        downloads: 167,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
    },
    {
        id: 'mock-manual-handling',
        name: 'Manual Handling Policy',
        description: 'Guidelines for safe moving and handling of residents and heavy objects.',
        category: 'policy',
        regulation_ids: ['Reg 12', 'Reg 18'],
        quality_statement_ids: ['S2', 'E2'],
        key_questions: ['safe', 'effective'],
        service_types: ['residential', 'domiciliary', 'supported'],
        content: '# Manual Handling Policy\n\n## 1. Policy Statement\n\n[Organisation Name] aims to eliminate or reduce the risk of injury from manual handling activities.',
        content_format: 'markdown',
        version: '1.0',
        is_premium: false,
        is_published: true,
        downloads: 289,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
    },
    {
        id: 'mock-supervision',
        name: 'Staff Supervision Record',
        description: 'Template for formal 1-to-1 supervision sessions between managers and care staff.',
        category: 'form',
        regulation_ids: ['Reg 18'],
        quality_statement_ids: ['W4'],
        key_questions: ['wellLed'],
        service_types: ['residential', 'domiciliary', 'supported'],
        content: '# Staff Supervision Record\n\n**Staff Member:** __________\n**Supervisor:** __________\n**Date:** __________',
        content_format: 'markdown',
        version: '1.0',
        is_premium: false,
        is_published: true,
        downloads: 334,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
    },
    {
        id: 'mock-bcp',
        name: 'Business Continuity Plan',
        description: 'Strategic plan for maintaining operations during emergencies (power failure, pandemic, etc.).',
        category: 'policy',
        regulation_ids: ['Reg 17', 'Reg 12'],
        quality_statement_ids: ['W2', 'S2'],
        key_questions: ['wellLed', 'safe'],
        service_types: ['residential', 'domiciliary', 'supported'],
        content: '# Business Continuity Plan\n\n## 1. Objective\n\nTo ensure the continued provision of care in the event of major disruption.',
        content_format: 'markdown',
        version: '1.0',
        is_premium: false,
        is_published: true,
        downloads: 145,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
    },
    {
        id: 'mock-qa',
        name: 'Quality Assurance & Monitoring Policy',
        description: 'How the organization monitors performance and improves service quality.',
        category: 'policy',
        regulation_ids: ['Reg 17'],
        quality_statement_ids: ['W5'],
        key_questions: ['wellLed'],
        service_types: ['residential', 'domiciliary', 'supported'],
        content: '# Quality Assurance Policy\n\n## 1. Overview\n\nWe use a robust system of audits, feedback, and analysis to drive improvement.',
        content_format: 'markdown',
        version: '1.0',
        is_premium: false,
        is_published: true,
        downloads: 178,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
    },
    {
        id: 'mock-nutrition',
        name: 'Nutrition & Hydration Policy',
        description: 'Ensuring residents receive adequate food and drink as per Regulation 14.',
        category: 'policy',
        regulation_ids: ['Reg 14'],
        quality_statement_ids: ['E3'],
        key_questions: ['effective'],
        service_types: ['residential', 'domiciliary'],
        content: '# Nutrition and Hydration Policy\n\n## 1. Our Commitment\n\nWe ensure every resident has access to plenty of nutritious food and fresh water.',
        content_format: 'markdown',
        version: '1.0',
        is_premium: false,
        is_published: true,
        downloads: 123,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
    },
    {
        id: 'mock-eol',
        name: 'End of Life Care Policy',
        description: 'Compassionate care for residents in the final stages of life.',
        category: 'policy',
        regulation_ids: ['Reg 9'],
        quality_statement_ids: ['R3'],
        key_questions: ['responsive', 'caring'],
        service_types: ['residential', 'domiciliary'],
        content: '# End of Life Care Policy\n\n## 1. Philosophy\n\nWe believe in providing dignified, palliative care that respects the wishes of the individual.',
        content_format: 'markdown',
        version: '1.0',
        is_premium: false,
        is_published: true,
        downloads: 87,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
    },
    {
        id: 'mock-mca-dols',
        name: 'MCA & DoLS Policy',
        description: 'Implementing the Mental Capacity Act and Deprivation of Liberty Safeguards.',
        category: 'policy',
        regulation_ids: ['Reg 11', 'Reg 13'],
        quality_statement_ids: ['E6', 'S3'],
        key_questions: ['effective', 'safe'],
        service_types: ['residential', 'domiciliary', 'supported'],
        content: '# MCA and DoLS Policy\n\n## 1. Legal Framework\n\nThis policy ensures compliance with the Mental Capacity Act 2005.',
        content_format: 'markdown',
        version: '1.0',
        is_premium: false,
        is_published: true,
        downloads: 256,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
    },
    {
        id: 'mock-agency-checklist',
        name: 'Agency Staff Induction Checklist',
        description: 'Rapid induction for temporary or agency staff to ensure safety and quality.',
        category: 'checklist',
        regulation_ids: ['Reg 18', 'Reg 12'],
        quality_statement_ids: ['S1', 'W4'],
        key_questions: ['safe', 'wellLed'],
        service_types: ['residential', 'domiciliary'],
        content: '# Agency Staff Induction\n\n- [ ] Fire safety briefing\n- [ ] Resident locations and needs\n- [ ] Access codes and keys',
        content_format: 'markdown',
        version: '1.0',
        is_premium: false,
        is_published: true,
        downloads: 142,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
    },
    {
        id: 'mock-mar-chart',
        name: 'MAR Chart (Medication Administration Record)',
        description: 'Template for recording daily medication administration, essential for Regulation 12 compliance.',
        category: 'form',
        regulation_ids: ['Reg 12'],
        quality_statement_ids: ['S8'],
        key_questions: ['safe'],
        service_types: ['residential', 'domiciliary'],
        content: '# Medication Administration Record (MAR)\n\n**Resident Name:** __________\n**Month/Year:** __________\n\n| Medication | Dose | Time | 1 | 2 | 3 | 4 | 5 | 6 | 7 |...|\n|------------|------|------|-|-|-|-|-|-|-|-|---|\n|            |      |      | | | | | | | | |   |',
        content_format: 'markdown',
        version: '1.0',
        is_premium: true,
        is_published: true,
        downloads: 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
    },
    {
        id: 'mock-rtw-checklist',
        name: 'Right-to-Work Checklist',
        description: 'Required checklist for verifying worker documents in compliance with Home Office regulations.',
        category: 'checklist',
        regulation_ids: ['Reg 19'],
        quality_statement_ids: ['S1'],
        key_questions: ['safe'],
        service_types: ['residential', 'domiciliary', 'supported'],
        content: '# Right-to-Work Document Checklist\n\n- [ ] Passport (Original seen)\n- [ ] Share Code verified (for non-UK/Irish)\n- [ ] BRP Copied (Front & Back)\n- [ ] Date of Check: __________',
        content_format: 'markdown',
        version: '1.0',
        is_premium: true,
        is_published: true,
        downloads: 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
    }
];

export interface PolicyTemplate {
    id: string;
    name: string;
    description: string | null;
    category: 'policy' | 'form' | 'audit' | 'checklist' | 'procedure';
    regulation_ids: string[] | null;
    quality_statement_ids: string[] | null;
    key_questions: string[] | null;
    service_types: string[] | null;
    content: string;
    content_format: 'markdown' | 'html' | 'plain';
    version: string;
    is_premium: boolean;
    is_published: boolean;
    downloads: number;
    created_at: string;
    updated_at: string;
}

export interface UserTemplate {
    id: string;
    organization_id: string;
    base_template_id: string | null;
    name: string;
    category: string;
    content: string;
    customization_prompt: string | null;
    version: string;
    created_at: string;
    updated_at: string;
}

/**
 * Fetch all published templates
 */
export async function getTemplates(): Promise<PolicyTemplate[]> {
    try {
        const { data, error } = await supabase
            .from('policy_templates')
            .select('*')
            .eq('is_published', true)
            .order('category', { ascending: true })
            .order('name', { ascending: true });

        if (error || !data || data.length === 0) {
            console.warn('No templates in DB or fetch error, using MOCK_TEMPLATES');
            return MOCK_TEMPLATES;
        }

        return data;
    } catch (err) {
        return MOCK_TEMPLATES;
    }
}

/**
 * Log a template download for analytics
 */
export async function logTemplateDownload(
    templateId: string,
    organizationId: string,
    userId: string | undefined
): Promise<void> {
    const { error } = await supabase
        .from('template_downloads')
        .insert({
            template_id: templateId,
            organization_id: organizationId,
            user_id: userId
        });

    if (error) {
        console.error('Error logging template download:', error);
        // Don't throw, just log to avoid breaking user experience
    }
}

/**
 * Fetch templates by category
 */
export async function getTemplatesByCategory(category: string): Promise<PolicyTemplate[]> {
    try {
        const { data, error } = await supabase
            .from('policy_templates')
            .select('*')
            .eq('is_published', true)
            .eq('category', category)
            .order('name', { ascending: true });

        if (error || !data || data.length === 0) {
            return MOCK_TEMPLATES.filter(t => t.category === category);
        }

        return data;
    } catch (err) {
        return MOCK_TEMPLATES.filter(t => t.category === category);
    }
}

/**
 * Customize a template using AI
 */
export async function customizeTemplate(
    templateName: string,
    currentContent: string,
    prompt: string,
    orgContext: { companyName: string; serviceType: string }
): Promise<string> {
    const systemInstruction = `You are a CQC Compliance Expert and Policy Writer. 
    Your task is to customize a specific policy/form template for a care provider.
    
    CQC KNOWLEDGE BASE:
    ${CQC_KNOWLEDGE_BASE}
    
    ORGANIZATION CONTEXT:
    - Company Name: ${orgContext.companyName}
    - Service Type: ${orgContext.serviceType}
    
    INSTRUCTIONS:
    1. Maintain formal, auditable compliance language.
    2. Incorporate the user's specific customization requests.
    3. Ensure [Organisation Name] or similar placeholders are replaced with ${orgContext.companyName}.
    4. Keep the markdown format.
    5. Be thorough but concise.`;

    const userMessage = `Please customize the following template based on my requirements.
    
    TEMPLATE NAME: ${templateName}
    
    CURRENT CONTENT:
    ${currentContent}
    
    MY CUSTOMIZATION REQUEST:
    ${prompt}`;

    if (shouldUseEdgeFunction()) {
        const response = await callEdgeFunctionAI('cqc-ai-proxy', {
            message: userMessage,
            modelName: 'gemini-2.0-flash',
            systemInstruction
        });
        return response.text;
    } else {
        // Use client-side fallback if needed (simplified)
        const genAI = initializeAI();
        if (!genAI) throw new Error("AI not initialized");

        return await runWithRetry(async (modelName) => {
            const model = genAI.getGenerativeModel({ model: modelName });
            const result = await model.generateContent({
                contents: [
                    { role: 'user', parts: [{ text: systemInstruction + "\n\n" + userMessage }] }
                ]
            });
            return result.response.text();
        }, "Template Customization");
    }
}

/**
 * Save a customized user template
 */
export async function saveUserTemplate(template: Partial<UserTemplate>): Promise<UserTemplate> {
    const { data, error } = await supabase
        .from('user_templates')
        .insert(template)
        .select()
        .single();

    if (error) {
        console.error('Error saving user template:', error);
        throw error;
    }

    return data;
}

/**
 * Fetch all customized templates for an organization
 */
export async function getUserTemplates(organizationId: string): Promise<UserTemplate[]> {
    try {
        const { data, error } = await supabase
            .from('user_templates')
            .select('*')
            .eq('organization_id', organizationId)
            .order('created_at', { ascending: false });

        if (error) {
            if (error.code === 'PGRST205') {
                console.warn('user_templates table missing from schema cache, returning empty array');
                return [];
            }
            console.error('Error fetching user templates:', error);
            return [];
        }

        return data || [];
    } catch (err) {
        console.error('Unexpected error in getUserTemplates:', err);
        return [];
    }
}
