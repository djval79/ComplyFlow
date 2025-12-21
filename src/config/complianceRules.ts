export interface ComplianceRule {
    id: string;
    name: string;
    regulation: string;
    keywords: string[];
    criticalKeywords: string[];
    failureMsg: string;
}

export const COMPLIANCE_RULES: ComplianceRule[] = [
    {
        id: 'consent',
        name: 'Consent Policy',
        regulation: 'Regulation 9 (Person-centred care)',
        keywords: ['consent', 'capacity', 'permission', 'agreement'],
        criticalKeywords: ['mental capacity act', 'best interest'],
        failureMsg: 'No mention of Mental Capacity Act principles found.'
    },
    {
        id: 'safeguarding',
        name: 'Safeguarding Policy',
        regulation: 'Regulation 13 (Safeguarding)',
        keywords: ['safeguarding', 'abuse', 'protect'],
        criticalKeywords: ['whistleblowing', 'local authority'],
        failureMsg: 'Whistleblowing procedure is not clearly defined or linked.'
    },
    {
        id: 'medicines',
        name: 'Medicines Management',
        regulation: 'Regulation 12 (Safe Care)',
        keywords: ['medicine', 'medication', 'drug'],
        criticalKeywords: ['mar chart', 'administration record', 'disposal'],
        failureMsg: 'No evidence of MAR chart templates or competency assessment logs.'
    },
    {
        id: 'recruitment',
        name: 'Recruitment Policy',
        regulation: 'Regulation 19 (Fit and proper persons)',
        keywords: ['recruitment', 'hiring', 'interview'],
        criticalKeywords: ['dbs', 'criminal record', 'reference'],
        failureMsg: 'DBS check procedures appear missing.'
    },
    {
        id: 'governance',
        name: 'Good Governance',
        regulation: 'Regulation 17 (Good governance)',
        keywords: ['audit', 'governance', 'quality assurance', 'monitor'],
        criticalKeywords: ['action plan', 'improvement', 'risk register'],
        failureMsg: 'Quality assurance framework or risk register mentions are missing.'
    },
    {
        id: 'staffing',
        name: 'Staffing',
        regulation: 'Regulation 18 (Staffing)',
        keywords: ['training', 'induction', 'staff', 'supervision'],
        criticalKeywords: ['competency', 'appraisal', 'mandatory training'],
        failureMsg: 'Processes for staff competency checks or appraisals are not evident.'
    }
];
