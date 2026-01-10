// CQC 2024 Single Assessment Framework - Quality Statements and Interview Questions

export interface QualityStatement {
    id: string;
    keyQuestion: 'safe' | 'effective' | 'caring' | 'responsive' | 'wellLed';
    title: string;
    weStatement: string;
    evidenceCategories: string[];
}

export interface InspectionQuestion {
    id: string;
    keyQuestion: 'safe' | 'effective' | 'caring' | 'responsive' | 'wellLed';
    targetRole: 'manager' | 'senior_carer' | 'care_worker' | 'domestic' | 'all';
    question: string;
    followUps: string[];
    goodResponseIndicators: string[];
    redFlags: string[];
    relatedRegulations: string[];
    qualityStatementId: string;
}

export interface InspectionScenario {
    id: string;
    title: string;
    description: string;
    difficulty: 'standard' | 'challenging' | 'intensive';
    duration: string;
    focusAreas: string[];
    targetRole: 'manager' | 'senior_carer' | 'care_worker' | 'all';
    keyQuestions: ('safe' | 'effective' | 'caring' | 'responsive' | 'wellLed')[];
}

// CQC 2024 Quality Statements (34 statements organized by Key Question)
export const QUALITY_STATEMENTS: QualityStatement[] = [
    // SAFE
    {
        id: 'S1',
        keyQuestion: 'safe',
        title: 'Learning culture',
        weStatement: 'We have a proactive and positive culture of safety based on openness and honesty, in which concerns about safety are listened to, safety events are investigated and reported thoroughly, and lessons are learned to continually identify and embed good practice.',
        evidenceCategories: ['incident reporting', 'root cause analysis', 'staff feedback', 'safety improvements']
    },
    {
        id: 'S2',
        keyQuestion: 'safe',
        title: 'Safe systems, pathways and transitions',
        weStatement: 'We work with people and our partners to establish and maintain safe systems of care, in which safety is managed or monitored. We ensure continuity of care, including when people move between different services.',
        evidenceCategories: ['care transitions', 'handover procedures', 'multi-agency working', 'discharge planning']
    },
    {
        id: 'S3',
        keyQuestion: 'safe',
        title: 'Safeguarding',
        weStatement: 'We work with people to understand what being safe means to them as well as with our partners on the best way to achieve this. We concentrate on improving people\'s lives while protecting their right to live in safety, free from bullying, harassment, abuse, discrimination, avoidable harm and neglect.',
        evidenceCategories: ['safeguarding policies', 'staff training', 'incident reports', 'partner agency relationships']
    },
    {
        id: 'S4',
        keyQuestion: 'safe',
        title: 'Involving people to manage risks',
        weStatement: 'We work with people to understand and manage risks by thinking holistically so that care is provided in a way that balances risks with positive choice and control.',
        evidenceCategories: ['risk assessments', 'person-centred care plans', 'consent documentation', 'positive risk-taking']
    },
    {
        id: 'S5',
        keyQuestion: 'safe',
        title: 'Safe environments',
        weStatement: 'We detect and control potential risks in the care environment. We make sure equipment, facilities and technology support the delivery of safe care.',
        evidenceCategories: ['environmental audits', 'equipment maintenance', 'infection control', 'fire safety']
    },
    {
        id: 'S6',
        keyQuestion: 'safe',
        title: 'Safe and effective staffing',
        weStatement: 'We make sure there are enough qualified, skilled and experienced staff, who receive effective support, supervision and development. They work together effectively to provide safe care that meets people\'s individual needs.',
        evidenceCategories: ['staffing levels', 'training records', 'supervision records', 'staff deployment']
    },
    {
        id: 'S7',
        keyQuestion: 'safe',
        title: 'Infection prevention and control',
        weStatement: 'We assess and manage the risk of infection. We detect and control the risk of it spreading and share any concerns with appropriate agencies promptly.',
        evidenceCategories: ['IPC audits', 'PPE usage', 'outbreak management', 'staff training']
    },
    {
        id: 'S8',
        keyQuestion: 'safe',
        title: 'Medicines optimisation',
        weStatement: 'We make sure that medicines and treatments are safe and meet people\'s needs, capacities and preferences. We involve them in planning.',
        evidenceCategories: ['MAR charts', 'medication audits', 'storage checks', 'PRN protocols']
    },

    // EFFECTIVE
    {
        id: 'E1',
        keyQuestion: 'effective',
        title: 'Assessing needs',
        weStatement: 'We maximise the effectiveness of people\'s care and treatment by assessing and reviewing their health, care, wellbeing and communication needs with them.',
        evidenceCategories: ['initial assessments', 'ongoing reviews', 'outcome measures', 'specialist referrals']
    },
    {
        id: 'E2',
        keyQuestion: 'effective',
        title: 'Delivering evidence-based care and treatment',
        weStatement: 'We plan and deliver people\'s care and treatment with them, including what is important and matters to them. We do this in line with legislation and current evidence-based good practice and standards.',
        evidenceCategories: ['care plans', 'best practice guidelines', 'clinical protocols', 'research implementation']
    },
    {
        id: 'E3',
        keyQuestion: 'effective',
        title: 'How staff, teams and services work together',
        weStatement: 'We work well with other agencies to make sure people receive effective, joined-up care. All those involved with a person\'s care work collaboratively in their best interests.',
        evidenceCategories: ['MDT meetings', 'referral pathways', 'information sharing', 'joint assessments']
    },
    {
        id: 'E4',
        keyQuestion: 'effective',
        title: 'Supporting people to live healthier lives',
        weStatement: 'We support people to manage their health and wellbeing so they can maximise their independence, choice and control. We support them to live healthier lives and where possible, reduce their future needs for care and support.',
        evidenceCategories: ['health promotion', 'preventive care', 'lifestyle support', 'vaccination uptake']
    },
    {
        id: 'E5',
        keyQuestion: 'effective',
        title: 'Monitoring and improving outcomes',
        weStatement: 'We routinely monitor people\'s care and treatment to continuously improve it. We ensure that outcomes are positive and consistent, and that they meet both clinical expectations and the expectations of people themselves.',
        evidenceCategories: ['outcome tracking', 'quality indicators', 'service user feedback', 'continuous improvement']
    },
    {
        id: 'E6',
        keyQuestion: 'effective',
        title: 'Consent to care and treatment',
        weStatement: 'We tell people about their rights around consent and respect these when we deliver person-centred care and treatment.',
        evidenceCategories: ['consent forms', 'capacity assessments', 'best interest decisions', 'MCA documentation']
    },

    // CARING
    {
        id: 'C1',
        keyQuestion: 'caring',
        title: 'Kindness, compassion and dignity',
        weStatement: 'We always treat people with kindness, empathy and compassion. We make sure people\'s dignity is respected and we provide care and treatment in a caring and considerate way.',
        evidenceCategories: ['observations', 'service user feedback', 'complaints data', 'staff interactions']
    },
    {
        id: 'C2',
        keyQuestion: 'caring',
        title: 'Treating people as individuals',
        weStatement: 'We treat people as individuals and make sure their care, support and treatment meets their needs and preferences. We take account of their strengths, abilities and aspirations, as well as their rights.',
        evidenceCategories: ['personalised care plans', 'life history work', 'cultural preferences', 'individual routines']
    },
    {
        id: 'C3',
        keyQuestion: 'caring',
        title: 'Independence, choice and control',
        weStatement: 'We promote people\'s independence, so they know their rights and have choice and control over their own care, treatment and wellbeing.',
        evidenceCategories: ['choice audits', 'advocacy access', 'independence promotion', 'self-management support']
    },
    {
        id: 'C4',
        keyQuestion: 'caring',
        title: 'Responding to people\'s immediate needs',
        weStatement: 'We listen to and understand people\'s needs, views and wishes. We respond to these in a timely manner and without having to wait for a formal review.',
        evidenceCategories: ['response times', 'immediate adaptations', 'real-time feedback', 'flexible care delivery']
    },
    {
        id: 'C5',
        keyQuestion: 'caring',
        title: 'Workforce wellbeing and enablement',
        weStatement: 'We care about and promote the wellbeing of our staff, and support and enable them to always deliver person-centred care.',
        evidenceCategories: ['staff wellbeing surveys', 'support programs', 'workload management', 'recognition schemes']
    },

    // RESPONSIVE
    {
        id: 'R1',
        keyQuestion: 'responsive',
        title: 'Person-centred care',
        weStatement: 'We make sure people are at the centre of their care and treatment choices and we decide, in partnership with them, how to respond to any relevant changes in their needs.',
        evidenceCategories: ['care planning involvement', 'review participation', 'preference recording', 'flexible responses']
    },
    {
        id: 'R2',
        keyQuestion: 'responsive',
        title: 'Care provision, integration and continuity',
        weStatement: 'We understand the diverse health and care needs of people and our local communities, so care is joined-up, flexible and supports choice and continuity.',
        evidenceCategories: ['community needs assessment', 'service integration', 'continuity of care', 'flexible delivery']
    },
    {
        id: 'R3',
        keyQuestion: 'responsive',
        title: 'Providing information',
        weStatement: 'We provide appropriate, accurate and up-to-date information in formats that we tailor to individual needs.',
        evidenceCategories: ['accessible information', 'communication formats', 'information accuracy', 'timely provision']
    },
    {
        id: 'R4',
        keyQuestion: 'responsive',
        title: 'Listening to and involving people',
        weStatement: 'We make it easy for people to share feedback and ideas, or raise complaints about their care, treatment and support. We involve them in decisions about their care and tell them what\'s changed as a result.',
        evidenceCategories: ['feedback mechanisms', 'complaint handling', 'changes made', 'communication of outcomes']
    },
    {
        id: 'R5',
        keyQuestion: 'responsive',
        title: 'Equity in access',
        weStatement: 'We make sure that everyone can access the care, support and treatment they need when they need it. We prioritise people with the most urgent needs.',
        evidenceCategories: ['access audits', 'waiting times', 'barrier removal', 'priority systems']
    },
    {
        id: 'R6',
        keyQuestion: 'responsive',
        title: 'Equity in experience and outcomes',
        weStatement: 'We actively seek out and listen to information about people who are most likely to experience inequality in experience or outcomes. We tailor the care, support and treatment in response to this.',
        evidenceCategories: ['equality monitoring', 'outcome disparities', 'targeted interventions', 'inclusive practices']
    },
    {
        id: 'R7',
        keyQuestion: 'responsive',
        title: 'Planning for the future',
        weStatement: 'We support people to plan for important life changes, so they can have enough time to make informed decisions about their future, including at the end of their life.',
        evidenceCategories: ['advance care planning', 'end of life care', 'future planning', 'family involvement']
    },

    // WELL-LED
    {
        id: 'W1',
        keyQuestion: 'wellLed',
        title: 'Shared direction and culture',
        weStatement: 'We have a shared vision, strategy and culture. This is based on transparency, equity, equality and human rights, diversity and inclusion, engagement, and understanding challenges and the needs of people and our communities.',
        evidenceCategories: ['vision statements', 'cultural assessments', 'EDI strategies', 'community engagement']
    },
    {
        id: 'W2',
        keyQuestion: 'wellLed',
        title: 'Capable, compassionate and inclusive leaders',
        weStatement: 'We have inclusive leaders at all levels who understand the context in which we deliver care, treatment and support. They embody the culture and values of their workforce and organisation. Leaders have the skills, knowledge, experience and credibility to lead effectively.',
        evidenceCategories: ['leadership development', 'inclusive leadership', 'leader visibility', 'staff engagement']
    },
    {
        id: 'W3',
        keyQuestion: 'wellLed',
        title: 'Freedom to speak up',
        weStatement: 'We foster a positive culture where people feel they can speak up and their voice will be heard.',
        evidenceCategories: ['whistleblowing policy', 'speaking up culture', 'anonymous feedback', 'action on concerns']
    },
    {
        id: 'W4',
        keyQuestion: 'wellLed',
        title: 'Workforce equality, diversity and inclusion',
        weStatement: 'We value diversity in our workforce. We work towards an inclusive and fair culture by improving equality and equity for people who work for us.',
        evidenceCategories: ['workforce demographics', 'EDI training', 'fair recruitment', 'inclusive practices']
    },
    {
        id: 'W5',
        keyQuestion: 'wellLed',
        title: 'Governance, management and sustainability',
        weStatement: 'We have clear responsibilities, roles, systems of accountability and good governance. We use these to manage and deliver good quality, sustainable care, treatment and support. We act on the best information about risk, performance and outcomes, and we share this securely with others when appropriate.',
        evidenceCategories: ['governance structure', 'accountability systems', 'risk management', 'performance data']
    },
    {
        id: 'W6',
        keyQuestion: 'wellLed',
        title: 'Partnerships and communities',
        weStatement: 'We understand our duty to collaborate and work in partnership, so our services work seamlessly for people. We share information and learn with partners and collaborate for improvement.',
        evidenceCategories: ['partnership agreements', 'collaborative working', 'information sharing', 'joint improvement']
    },
    {
        id: 'W7',
        keyQuestion: 'wellLed',
        title: 'Learning, improvement and innovation',
        weStatement: 'We focus on continuous learning, innovation and improvement across our organisation and the local system. We encourage creative ways of delivering equality of experience and outcomes.',
        evidenceCategories: ['learning culture', 'innovation projects', 'quality improvement', 'research participation']
    },
    {
        id: 'W8',
        keyQuestion: 'wellLed',
        title: 'Environmental sustainability',
        weStatement: 'We understand any negative impact that the way we deliver care, treatment and support may have on the environment. We work towards reducing any negative impact and promoting environmental sustainability.',
        evidenceCategories: ['sustainability plans', 'environmental audits', 'carbon reduction', 'green initiatives']
    }
];

// Comprehensive Interview Questions by Role and Key Question
export const INSPECTION_QUESTIONS: InspectionQuestion[] = [
    // SAFE - Manager Questions
    {
        id: 'Q-S-M1',
        keyQuestion: 'safe',
        targetRole: 'manager',
        question: 'What do you understand your main responsibilities to be as a registered manager regarding safeguarding?',
        followUps: [
            'Can you walk me through the last safeguarding concern that was raised?',
            'How did you ensure it was investigated and reported appropriately?',
            'What changes were made as a result?'
        ],
        goodResponseIndicators: [
            'Clear understanding of safeguarding lead responsibilities',
            'Can describe notification procedures to CQC and local authority',
            'Evidence of learning and improvement from incidents',
            'Regular safeguarding training for all staff'
        ],
        redFlags: [
            'Cannot describe the safeguarding reporting process',
            'No recent safeguarding training evidence',
            'Unable to recall how concerns were handled',
            'No mention of multi-agency working'
        ],
        relatedRegulations: ['Regulation 13'],
        qualityStatementId: 'S3'
    },
    {
        id: 'Q-S-M2',
        keyQuestion: 'safe',
        targetRole: 'manager',
        question: 'How do you ensure that staffing levels are safe and meet the needs of the people you support?',
        followUps: [
            'How do you plan rotas to ensure adequate cover?',
            'What happens when staff call in sick?',
            'How do you monitor that staffing matches dependency levels?'
        ],
        goodResponseIndicators: [
            'Uses dependency tools to calculate staffing',
            'Has contingency plans for staff shortages',
            'Regularly reviews staffing against needs',
            'Can evidence safe staffing levels during nights/weekends'
        ],
        redFlags: [
            'No formal dependency assessment process',
            'Reliance on agency without proper vetting',
            'History of complaints about staffing',
            'No contingency planning'
        ],
        relatedRegulations: ['Regulation 18'],
        qualityStatementId: 'S6'
    },
    {
        id: 'Q-S-M3',
        keyQuestion: 'safe',
        targetRole: 'manager',
        question: 'Describe your infection prevention and control procedures. How have these evolved since the pandemic?',
        followUps: [
            'How do you audit IPC compliance?',
            'What training do staff receive?',
            'How do you manage an outbreak situation?'
        ],
        goodResponseIndicators: [
            'Regular IPC audits with documented outcomes',
            'Up-to-date IPC training for all staff',
            'Clear outbreak management protocols',
            'Appropriate PPE availability and usage'
        ],
        redFlags: [
            'No IPC champion or lead',
            'Outdated training records',
            'No outbreak contingency plan',
            'Poor hand hygiene compliance'
        ],
        relatedRegulations: ['Regulation 12'],
        qualityStatementId: 'S7'
    },
    {
        id: 'Q-S-M4',
        keyQuestion: 'safe',
        targetRole: 'manager',
        question: 'How do you ensure medicines are managed safely in this service?',
        followUps: [
            'What checks do you conduct on medication storage?',
            'How are medication errors addressed and learned from?',
            'How do you ensure competency of staff administering medicines?'
        ],
        goodResponseIndicators: [
            'Regular medication audits',
            'Clear error reporting and learning process',
            'Competency assessments for medication administration',
            'Proper controlled drug procedures'
        ],
        redFlags: [
            'No regular medication audits',
            'Gaps in MAR charts with no explanation',
            'Staff not competency assessed',
            'Temperature monitoring not documented'
        ],
        relatedRegulations: ['Regulation 12'],
        qualityStatementId: 'S8'
    },
    {
        id: 'Q-S-M5',
        keyQuestion: 'safe',
        targetRole: 'manager',
        question: 'How do you promote a learning culture when things go wrong?',
        followUps: [
            'Can you give an example of an incident and what was learned?',
            'How are lessons shared with the team?',
            'What changes have been implemented as a result of incidents?'
        ],
        goodResponseIndicators: [
            'No-blame approach to incident reporting',
            'Regular lessons learned sessions',
            'Evidence of changes from incident analysis',
            'Staff feel confident to report concerns'
        ],
        redFlags: [
            'Punitive culture around errors',
            'No analysis of incidents',
            'Same types of incidents recurring',
            'Staff afraid to report issues'
        ],
        relatedRegulations: ['Regulation 17', 'Regulation 20'],
        qualityStatementId: 'S1'
    },

    // SAFE - Care Worker Questions
    {
        id: 'Q-S-C1',
        keyQuestion: 'safe',
        targetRole: 'care_worker',
        question: 'What would you do if you suspected a service user was being abused?',
        followUps: [
            'Who would you report this to?',
            'What if the person asked you not to tell anyone?',
            'Have you had safeguarding training?'
        ],
        goodResponseIndicators: [
            'Would report immediately to manager/safeguarding lead',
            'Understands duty to report overrides wishes in serious cases',
            'Has received recent safeguarding training',
            'Knows not to investigate themselves'
        ],
        redFlags: [
            'Would try to handle it themselves',
            'Unsure who to report to',
            'No recent training',
            'Would keep it confidential if asked'
        ],
        relatedRegulations: ['Regulation 13'],
        qualityStatementId: 'S3'
    },
    {
        id: 'Q-S-C2',
        keyQuestion: 'safe',
        targetRole: 'care_worker',
        question: 'How do you prevent infection and cross-contamination in your work?',
        followUps: [
            'When do you wash your hands or use gel?',
            'What PPE do you use and when?',
            'How do you handle soiled laundry?'
        ],
        goodResponseIndicators: [
            'Describes WHO 5 moments for hand hygiene',
            'Correct PPE selection for different tasks',
            'Proper waste segregation knowledge',
            'Regular IPC training'
        ],
        redFlags: [
            'Inconsistent hand hygiene',
            'Incorrect PPE usage',
            'Poor waste handling',
            'No training evidence'
        ],
        relatedRegulations: ['Regulation 12'],
        qualityStatementId: 'S7'
    },
    {
        id: 'Q-S-C3',
        keyQuestion: 'safe',
        targetRole: 'care_worker',
        question: 'How do you support service users with taking their medicines?',
        followUps: [
            'What do you check before giving medication?',
            'What would you do if you made an error?',
            'What about PRN (as needed) medicines?'
        ],
        goodResponseIndicators: [
            'Follows 6 rights of medication administration',
            'Would report errors immediately',
            'Understands PRN protocols and documentation',
            'Has medication competency assessment'
        ],
        redFlags: [
            'Cannot describe checks required',
            'Would try to cover up errors',
            'Unclear on PRN procedures',
            'No competency assessment'
        ],
        relatedRegulations: ['Regulation 12'],
        qualityStatementId: 'S8'
    },

    // EFFECTIVE - Manager Questions
    {
        id: 'Q-E-M1',
        keyQuestion: 'effective',
        targetRole: 'manager',
        question: 'How do you ensure staff remain competent for their role?',
        followUps: [
            'What training is mandatory and how often is it refreshed?',
            'How do you assess competency, not just attendance?',
            'How do you support staff who are struggling?'
        ],
        goodResponseIndicators: [
            'Clear training matrix with refresh dates',
            'Competency observations and assessments',
            'Supervision and appraisal processes',
            'Support plans for underperforming staff'
        ],
        redFlags: [
            'Only e-learning with no practical assessment',
            'Expired training certifications',
            'No supervision records',
            'No plan for struggling staff'
        ],
        relatedRegulations: ['Regulation 18', 'Regulation 19'],
        qualityStatementId: 'S6'
    },
    {
        id: 'Q-E-M2',
        keyQuestion: 'effective',
        targetRole: 'manager',
        question: 'How do you ensure care is delivered in line with current best practice and guidance?',
        followUps: [
            'How do you stay updated on NICE guidelines?',
            'Can you give an example of implementing new guidance?',
            'How do you ensure staff follow updated procedures?'
        ],
        goodResponseIndicators: [
            'Subscribes to NICE alerts',
            'Regular policy reviews',
            'Evidence of implementing new guidance',
            'Staff briefings on updates'
        ],
        redFlags: [
            'Policies significantly out of date',
            'Unaware of recent guidance changes',
            'No system for disseminating updates',
            'Practice not aligned with current guidelines'
        ],
        relatedRegulations: ['Regulation 12'],
        qualityStatementId: 'E2'
    },
    {
        id: 'Q-E-M3',
        keyQuestion: 'effective',
        targetRole: 'manager',
        question: 'How do you ensure valid consent is obtained for care and treatment?',
        followUps: [
            'What about people who lack mental capacity?',
            'Can you describe a recent Best Interest decision?',
            'How is consent documented?'
        ],
        goodResponseIndicators: [
            'Clear consent policy and process',
            'Mental Capacity Act training',
            'Documented capacity assessments',
            'Best Interest decision records'
        ],
        redFlags: [
            'Blanket consent forms',
            'No capacity assessments',
            'Decisions made without consultation',
            'Poor MCA knowledge'
        ],
        relatedRegulations: ['Regulation 11'],
        qualityStatementId: 'E6'
    },

    // EFFECTIVE - Care Worker Questions
    {
        id: 'Q-E-C1',
        keyQuestion: 'effective',
        targetRole: 'care_worker',
        question: 'What training have you received and how have you used this in practice?',
        followUps: [
            'What mandatory training have you completed?',
            'Can you give an example of using training in a real situation?',
            'What training would you like to receive?'
        ],
        goodResponseIndicators: [
            'Can list recent training completed',
            'Gives practical examples of application',
            'Engaged with learning and development',
            'Aware of training they need'
        ],
        redFlags: [
            'Cannot recall training',
            'No practical application',
            'Expired essential training',
            'Disengaged with learning'
        ],
        relatedRegulations: ['Regulation 18'],
        qualityStatementId: 'S6'
    },
    {
        id: 'Q-E-C2',
        keyQuestion: 'effective',
        targetRole: 'care_worker',
        question: 'How do you ensure you gain consent before providing care?',
        followUps: [
            'What if someone refuses care?',
            'How do you support someone who cannot verbally consent?',
            'What about people with dementia?'
        ],
        goodResponseIndicators: [
            'Always explains and seeks agreement',
            'Respects refusals and reports appropriately',
            'Uses non-verbal cues for those who cannot speak',
            'Understands capacity fluctuates'
        ],
        redFlags: [
            'Assumes consent',
            'Would override refusals',
            'No awareness of capacity issues',
            'Does not document consent'
        ],
        relatedRegulations: ['Regulation 11'],
        qualityStatementId: 'E6'
    },

    // CARING - All Roles
    {
        id: 'Q-C-A1',
        keyQuestion: 'caring',
        targetRole: 'all',
        question: 'How do you ensure service users are treated with kindness, respect, and compassion?',
        followUps: [
            'Can you give a specific example?',
            'How do you protect someones dignity during personal care?',
            'What makes you proud of the care you provide?'
        ],
        goodResponseIndicators: [
            'Genuine warmth and examples of going above and beyond',
            'Clear dignity-preserving practices',
            'Person-centred language',
            'Emotional intelligence evident'
        ],
        redFlags: [
            'Task-focused responses',
            'Impersonal or clinical language',
            'Cannot give specific examples',
            'Dismissive of emotional needs'
        ],
        relatedRegulations: ['Regulation 10'],
        qualityStatementId: 'C1'
    },
    {
        id: 'Q-C-A2',
        keyQuestion: 'caring',
        targetRole: 'all',
        question: 'How do you involve service users in their care plans and decision-making?',
        followUps: [
            'How do you find out what is important to someone?',
            'How do you support someone to express their views?',
            'What if a family member disagrees with the person?'
        ],
        goodResponseIndicators: [
            'Describes person-centred planning approaches',
            'Advocates for the person\'s voice',
            'Involves families appropriately',
            'Uses creative communication methods'
        ],
        redFlags: [
            'Care plans done to people not with them',
            'Family views override person\'s wishes',
            'No efforts to support communication',
            'Staff-convenient routines dominate'
        ],
        relatedRegulations: ['Regulation 9'],
        qualityStatementId: 'C2'
    },
    {
        id: 'Q-C-M1',
        keyQuestion: 'caring',
        targetRole: 'manager',
        question: 'How do you promote staff wellbeing and prevent burnout?',
        followUps: [
            'What support is available for staff under stress?',
            'How do you monitor workloads?',
            'What recognition do staff receive?'
        ],
        goodResponseIndicators: [
            'Staff wellbeing program in place',
            'Employee assistance available',
            'Reasonable workloads maintained',
            'Recognition and appreciation shown'
        ],
        redFlags: [
            'Staff regularly working excessive hours',
            'No wellbeing support',
            'High staff turnover',
            'Staff complaints about stress'
        ],
        relatedRegulations: ['Regulation 18'],
        qualityStatementId: 'C5'
    },

    // RESPONSIVE - Manager Questions
    {
        id: 'Q-R-M1',
        keyQuestion: 'responsive',
        targetRole: 'manager',
        question: 'How does your service achieve formal and informal feedback from service users?',
        followUps: [
            'How is this feedback analysed and acted upon?',
            'Can you give an example of a change made from feedback?',
            'How do you ensure all voices are heard, including those who cannot easily communicate?'
        ],
        goodResponseIndicators: [
            'Multiple feedback mechanisms',
            'Regular analysis and action planning',
            'Evidence of changes from feedback',
            'Accessible formats for all'
        ],
        redFlags: [
            'No formal feedback system',
            'Feedback not acted upon',
            'Only hear from those who can speak up',
            'No evidence of improvements from feedback'
        ],
        relatedRegulations: ['Regulation 16'],
        qualityStatementId: 'R4'
    },
    {
        id: 'Q-R-M2',
        keyQuestion: 'responsive',
        targetRole: 'manager',
        question: 'How do you respond to complaints and what do you learn from them?',
        followUps: [
            'Can you walk me through the last complaint?',
            'How was the complainant informed of the outcome?',
            'What changes were made as a result?'
        ],
        goodResponseIndicators: [
            'Clear complaints process',
            'Timely responses',
            'Evidence of learning from complaints',
            'Complainant satisfaction tracked'
        ],
        redFlags: [
            'Defensive attitude to complaints',
            'Complaints not documented',
            'No changes result from complaints',
            'Poor communication with complainants'
        ],
        relatedRegulations: ['Regulation 16'],
        qualityStatementId: 'R4'
    },
    {
        id: 'Q-R-M3',
        keyQuestion: 'responsive',
        targetRole: 'manager',
        question: 'How do you make reasonable adjustments for people with disabilities?',
        followUps: [
            'What about accessible information?',
            'How do you meet the needs of people with sensory impairments?',
            'What about people with learning disabilities or autism?'
        ],
        goodResponseIndicators: [
            'Accessible Information Standard implemented',
            'Individual adjustments documented',
            'Staff trained in communication methods',
            'Physical environment assessed'
        ],
        redFlags: [
            'No awareness of AIS',
            'One-size-fits-all approach',
            'Poor accessibility',
            'No staff training'
        ],
        relatedRegulations: ['Regulation 9', 'Regulation 10'],
        qualityStatementId: 'R5'
    },

    // RESPONSIVE - Care Worker Questions
    {
        id: 'Q-R-C1',
        keyQuestion: 'responsive',
        targetRole: 'care_worker',
        question: 'How do you ensure service users are satisfied with their care?',
        followUps: [
            'How do you find out if something is wrong?',
            'What would you do if someone was unhappy?',
            'How do you adapt care to preferences?'
        ],
        goodResponseIndicators: [
            'Regularly asks for feedback',
            'Responds to concerns promptly',
            'Adapts care to individual needs',
            'Reports concerns to management'
        ],
        redFlags: [
            'Does not seek feedback',
            'Ignores or dismisses concerns',
            'Rigid in care approach',
            'Does not escalate issues'
        ],
        relatedRegulations: ['Regulation 9'],
        qualityStatementId: 'R1'
    },

    // WELL-LED - Manager Questions
    {
        id: 'Q-W-M1',
        keyQuestion: 'wellLed',
        targetRole: 'manager',
        question: 'How do you lead and support your staff to maintain high standards of care?',
        followUps: [
            'How visible are you to staff and residents?',
            'How do you communicate expectations?',
            'What is your approach when standards slip?'
        ],
        goodResponseIndicators: [
            'Visible and accessible leadership',
            'Clear communication of expectations',
            'Supportive approach to improvement',
            'Role models values'
        ],
        redFlags: [
            'Rarely visible to frontline',
            'Poor communication',
            'Punitive approach to errors',
            'Values not lived'
        ],
        relatedRegulations: ['Regulation 17'],
        qualityStatementId: 'W2'
    },
    {
        id: 'Q-W-M2',
        keyQuestion: 'wellLed',
        targetRole: 'manager',
        question: 'What events must you notify the CQC about and how do you manage this?',
        followUps: [
            'Can you give examples of notifiable events?',
            'How quickly must notifications be submitted?',
            'What is your process for ensuring this happens?'
        ],
        goodResponseIndicators: [
            'Good knowledge of notifiable events',
            'System in place for timely notifications',
            'Log of all notifications made',
            'Understanding of statutory duties'
        ],
        redFlags: [
            'Cannot name notifiable events',
            'No system for tracking',
            'Late or missed notifications',
            'Unaware of timeframes'
        ],
        relatedRegulations: ['Regulation 18 (HSCA 2008)'],
        qualityStatementId: 'W5'
    },
    {
        id: 'Q-W-M3',
        keyQuestion: 'wellLed',
        targetRole: 'manager',
        question: 'How do you ensure staff feel able to speak up about concerns?',
        followUps: [
            'What is your whistleblowing policy?',
            'Have staff ever raised concerns? What happened?',
            'How do you promote an open culture?'
        ],
        goodResponseIndicators: [
            'Clear whistleblowing policy',
            'Staff confident to raise concerns',
            'Examples of concerns being acted on',
            'No victimisation of whistleblowers'
        ],
        redFlags: [
            'No whistleblowing policy',
            'Staff afraid to speak up',
            'Concerns dismissed',
            'Evidence of victimisation'
        ],
        relatedRegulations: ['Regulation 17', 'Regulation 20'],
        qualityStatementId: 'W3'
    },
    {
        id: 'Q-W-M4',
        keyQuestion: 'wellLed',
        targetRole: 'manager',
        question: 'How do you monitor quality and safety in your service?',
        followUps: [
            'What audits do you conduct and how often?',
            'How do you use this information to improve?',
            'Who else is involved in governance?'
        ],
        goodResponseIndicators: [
            'Comprehensive audit schedule',
            'Action plans from audits',
            'Evidence of improvements',
            'Multi-level governance'
        ],
        redFlags: [
            'No regular audits',
            'Audits not acted on',
            'Quality not improving',
            'Manager working in isolation'
        ],
        relatedRegulations: ['Regulation 17'],
        qualityStatementId: 'W5'
    },

    // WELL-LED - Care Worker Questions
    {
        id: 'Q-W-C1',
        keyQuestion: 'wellLed',
        targetRole: 'care_worker',
        question: 'Do you feel supported by the management team?',
        followUps: [
            'How accessible are managers?',
            'Do you receive regular supervision?',
            'Do you feel listened to?'
        ],
        goodResponseIndicators: [
            'Feels supported and valued',
            'Regular supervision occurs',
            'Managers accessible and approachable',
            'Feels voice is heard'
        ],
        redFlags: [
            'Feels unsupported',
            'Rare or no supervision',
            'Managers distant',
            'Concerns ignored'
        ],
        relatedRegulations: ['Regulation 18'],
        qualityStatementId: 'W2'
    },
    {
        id: 'Q-W-C2',
        keyQuestion: 'wellLed',
        targetRole: 'care_worker',
        question: 'Are you aware of the whistleblowing policy and would you feel confident using it?',
        followUps: [
            'What would make you want to whistle-blow?',
            'Who would you report to if concerned about the manager?',
            'Have you ever had to raise a concern?'
        ],
        goodResponseIndicators: [
            'Knows the policy exists and where to find it',
            'Confident they could use it',
            'Knows external reporting options',
            'No fear of reprisal'
        ],
        redFlags: [
            'Unaware of policy',
            'Would not feel safe using it',
            'Does not know external options',
            'Fear of reprisal mentioned'
        ],
        relatedRegulations: ['Regulation 17'],
        qualityStatementId: 'W3'
    }
];

// Pre-defined Inspection Scenarios
export const INSPECTION_SCENARIOS: InspectionScenario[] = [
    {
        id: 'FULL_MANAGER',
        title: 'Registered Manager Interview',
        description: 'A comprehensive interview covering all 5 Key Questions, focusing on leadership, governance, and overall service quality.',
        difficulty: 'intensive',
        duration: '45-60 minutes',
        focusAreas: ['Safeguarding', 'Staffing', 'Governance', 'Quality Improvement', 'Complaints'],
        targetRole: 'manager',
        keyQuestions: ['safe', 'effective', 'caring', 'responsive', 'wellLed']
    },
    {
        id: 'MANAGER_SAFE',
        title: 'Manager: Safe Domain Focus',
        description: 'Deep dive into safety aspects including safeguarding, medicines management, infection control, and staffing.',
        difficulty: 'challenging',
        duration: '20-30 minutes',
        focusAreas: ['Safeguarding', 'Medicines', 'IPC', 'Staffing Levels', 'Risk Management'],
        targetRole: 'manager',
        keyQuestions: ['safe']
    },
    {
        id: 'CARE_WORKER_QUICK',
        title: 'Care Worker Quick Check',
        description: 'A rapid assessment of care worker knowledge on safeguarding, infection control, and dignity.',
        difficulty: 'standard',
        duration: '10-15 minutes',
        focusAreas: ['Safeguarding Awareness', 'IPC Practice', 'Dignity in Care', 'Consent'],
        targetRole: 'care_worker',
        keyQuestions: ['safe', 'caring']
    },
    {
        id: 'CARE_WORKER_FULL',
        title: 'Care Worker Comprehensive',
        description: 'A thorough interview covering care practices, training, person-centred care, and awareness of policies.',
        difficulty: 'challenging',
        duration: '20-25 minutes',
        focusAreas: ['Care Practice', 'Training', 'Person-Centred Care', 'Communication', 'Wellbeing'],
        targetRole: 'care_worker',
        keyQuestions: ['safe', 'effective', 'caring', 'responsive']
    },
    {
        id: 'SENIOR_CARER',
        title: 'Senior Carer/Team Leader',
        description: 'Interview for senior care staff covering delegation, supervision, medication administration, and care planning.',
        difficulty: 'challenging',
        duration: '25-35 minutes',
        focusAreas: ['Leadership', 'Delegation', 'Medications', 'Care Planning', 'Staff Support'],
        targetRole: 'senior_carer',
        keyQuestions: ['safe', 'effective', 'wellLed']
    },
    {
        id: 'SAFEGUARDING_FOCUS',
        title: 'Safeguarding Deep Dive',
        description: 'Intensive focus on safeguarding knowledge, policies, reporting procedures, and case handling for any role.',
        difficulty: 'challenging',
        duration: '15-20 minutes',
        focusAreas: ['Safeguarding Policy', 'Reporting', 'Training', 'Case Handling', 'Multi-Agency'],
        targetRole: 'all',
        keyQuestions: ['safe']
    },
    {
        id: 'WELLLED_GOVERNANCE',
        title: 'Governance & Well-Led',
        description: 'Focus on leadership, governance, quality improvement, and regulatory compliance for managers.',
        difficulty: 'intensive',
        duration: '30-40 minutes',
        focusAreas: ['Governance Structure', 'Quality Improvement', 'CQC Notifications', 'Audits', 'Staff Engagement'],
        targetRole: 'manager',
        keyQuestions: ['wellLed']
    },
    {
        id: 'NEW_STARTER',
        title: 'New Starter Induction Check',
        description: 'Basic inspection readiness for newly onboarded care workers covering essential knowledge areas.',
        difficulty: 'standard',
        duration: '10-15 minutes',
        focusAreas: ['Basic Safeguarding', 'Fire Safety', 'Moving & Handling', 'Infection Control', 'Consent'],
        targetRole: 'care_worker',
        keyQuestions: ['safe', 'effective']
    }
];

// Key Question metadata
export const KEY_QUESTIONS = {
    safe: {
        id: 'safe',
        title: 'Safe',
        color: '#ef4444',
        description: 'Are people protected from abuse and avoidable harm?',
        icon: '🛡️'
    },
    effective: {
        id: 'effective',
        title: 'Effective',
        color: '#3b82f6',
        description: 'Does care achieve good outcomes and promote quality of life?',
        icon: '🎯'
    },
    caring: {
        id: 'caring',
        title: 'Caring',
        color: '#ec4899',
        description: 'Do staff treat people with compassion, kindness, dignity, and respect?',
        icon: '💝'
    },
    responsive: {
        id: 'responsive',
        title: 'Responsive',
        color: '#f59e0b',
        description: 'Are services organised so they meet people\'s needs?',
        icon: '⚡'
    },
    wellLed: {
        id: 'wellLed',
        title: 'Well-Led',
        color: '#8b5cf6',
        description: 'Is the leadership, management, and governance assuring high-quality care?',
        icon: '👔'
    }
};

// Scoring rubric for evaluating responses
export const SCORING_RUBRIC = {
    1: { label: 'Inadequate', description: 'Poor or unsafe practice; significant concerns' },
    2: { label: 'Requires Improvement', description: 'Some concerns; improvements needed' },
    3: { label: 'Good', description: 'Meets expected standards consistently' },
    4: { label: 'Outstanding', description: 'Exceptional practice; exceeds expectations' }
};

// Helper function to get questions for a scenario
export const getQuestionsForScenario = (scenarioId: string): InspectionQuestion[] => {
    const scenario = INSPECTION_SCENARIOS.find(s => s.id === scenarioId);
    if (!scenario) return [];

    return INSPECTION_QUESTIONS.filter(q => {
        const matchesKeyQuestion = scenario.keyQuestions.includes(q.keyQuestion);
        const matchesRole = scenario.targetRole === 'all' || q.targetRole === scenario.targetRole || q.targetRole === 'all';
        return matchesKeyQuestion && matchesRole;
    });
};

// Helper function to get questions by role
export const getQuestionsByRole = (role: string): InspectionQuestion[] => {
    return INSPECTION_QUESTIONS.filter(q => q.targetRole === role || q.targetRole === 'all');
};

// Helper function to get questions by key question
export const getQuestionsByKeyQuestion = (keyQuestion: string): InspectionQuestion[] => {
    return INSPECTION_QUESTIONS.filter(q => q.keyQuestion === keyQuestion);
};
