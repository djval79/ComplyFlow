export interface HelpArticle {
    id: string;
    title: string;
    category: 'Quick Start' | 'Compliance' | 'Training' | 'Visa Tracking' | 'Billing';
    summary: string;
    content: string;
}

const HELP_ARTICLES: HelpArticle[] = [
    {
        id: 'getting-started-gap-analysis',
        title: 'Getting Started with Gap Analysis',
        category: 'Quick Start',
        summary: 'Learn how to run your first CQC gap analysis and interpret the results.',
        content: `
            <h3>Overview</h3>
            <p>The AI Gap Analyzer is designed to identify missing evidence or policy weaknesses before an official CQC inspection. It compares your uploaded documents against the latest Quality Statements.</p>
            
            <h3>How to run an analysis:</h3>
            <ol>
                <li>Navigate to the <strong>Gap Analysis</strong> tab in your dashboard.</li>
                <li>Upload your policy documents (PDF, Word, or Text).</li>
                <li>Wait 30-60 seconds for the AI to process.</li>
                <li>Review the <strong>Actionable Insights</strong> generated.</li>
            </ol>
            
            <h3>Understanding Results</h3>
            <p>Each gap is categorized by severity (Critical, High, Medium, Low). Focus on <strong>Critical</strong> gaps first as these represent direct breaches of CQC regulations.</p>
        `
    },
    {
        id: 'understanding-cqc-score',
        title: 'Understanding Your CQC Score',
        category: 'Compliance',
        summary: 'How our AI calculates your readiness score and what it means for your inspection.',
        content: `
            <h3>The Readiness Score</h3>
            <p>Your CQC Readiness Score (0-100%) is a composite metric based on:</p>
            <ul>
                <li><strong>Policy Coverage:</strong> How many CQC Quality Statements are backed by evidence.</li>
                <li><strong>Recency:</strong> When your documents were last reviewed.</li>
                <li><strong>Staff Compliance:</strong> Training and DBS completion rates.</li>
                <li><strong>Audit History:</strong> Resolution rate of previous internal audit findings.</li>
            </ul>
            
            <h3>What the scores mean:</h3>
            <ul>
                <li><strong>90%+:</strong> Outstanding readiness. Maintain your documentation.</li>
                <li><strong>75-89%:</strong> Good. Minor gaps identified.</li>
                <li><strong>60-74%:</strong> Requires Improvement. Significant documentation missing.</li>
                <li><strong>Below 60%:</strong> Inadequate. High risk of enforcement action.</li>
            </ul>
        `
    },
    {
        id: 'mock-inspections',
        title: 'Preparing for Mock Inspections',
        category: 'Training',
        summary: 'Use AI-driven mock inspections to train your staff for the real thing.',
        content: `
            <h3>Why Mock Inspections?</h3>
            <p>Mock inspections reduce staff anxiety and reveal operational weaknesses that static documents might miss.</p>
            
            <h3>Best Practices:</h3>
            <ul>
                <li><strong>Role Play:</strong> Assign staff to answer questions as they would during a real inspection.</li>
                <li><strong>Use the AI Proctor:</strong> Let the AI generate "hard" questions based on your specific service type (e.g., Domiciliary Care).</li>
                <li><strong>Review Findings:</strong> Use the "Improvement Plan" generated after the mock session to assign tasks to team members.</li>
            </ul>
        `
    },
    {
        id: 'managing-sponsored-workers',
        title: 'Managing Sponsored Workers',
        category: 'Visa Tracking',
        summary: 'Ensure your Sponsor License is protected with automated visa tracking.',
        content: `
            <h3>Compliant Record Keeping</h3>
            <p>The Home Office requires strict record-keeping for all sponsored staff. ComplyFlow automates this via SponsorGuardian.</p>
            
            <h3>Key Features:</h3>
            <ul>
                <li><strong>CoS Tracking:</strong> Store Certificate of Sponsorship details and assignment dates.</li>
                <li><strong>Automated Alerts:</strong> Receive notifications 90, 60, and 30 days before a visa expires.</li>
                <li><strong>RTW Evidence:</strong> Store copies of passports and BRPs in the Evidence Vault for instant retrieval during a Home Office audit.</li>
            </ul>
        `
    },
    {
        id: 'upgrading-plan',
        title: 'Upgrading Your Plan',
        category: 'Billing',
        summary: 'How to switch between Free, Professional, and Corporate tiers.',
        content: `
            <h3>How to Upgrade</h3>
            <p>You can upgrade your plan at any time to unlock advanced AI features and team management.</p>
            
            <ol>
                <li>Go to <strong>Settings</strong> > <strong>Billing</strong>.</li>
                <li>Select your desired tier (Professional is recommended for single care homes).</li>
                <li>Complete the secure Stripe checkout.</li>
            </ol>
            
            <h3>Managing Subscriptions</h3>
            <p>All plans are month-to-month. You can cancel at any time, and your access will remain active until the end of your current billing period.</p>
        `
    }
];

export const knowledgeBaseService = {
    getArticles: (query?: string): HelpArticle[] => {
        if (!query) return HELP_ARTICLES;
        const lowerQuery = query.toLowerCase();
        return HELP_ARTICLES.filter(article =>
            article.title.toLowerCase().includes(lowerQuery) ||
            article.summary.toLowerCase().includes(lowerQuery) ||
            article.content.toLowerCase().includes(lowerQuery)
        );
    },

    getArticleById: (id: string): HelpArticle | undefined => {
        return HELP_ARTICLES.find(article => article.id === id);
    }
};
