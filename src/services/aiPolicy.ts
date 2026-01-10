import { initializeAI, runWithRetry, delay, shouldUseEdgeFunction, callEdgeFunctionAI } from './aiCore';
import { COMPLIANCE_RULES } from "../config/complianceRules";
import { CQC_KNOWLEDGE_BASE } from '../data/cqcKnowledgeBase';

export interface AIAnalysisResult {
    ruleId: string;
    status: 'pass' | 'fail' | 'partial';
    reasoning: string;
    recommendation: string;
    quote?: string;
}

export const analyzeWithAI = async (
    text: string,
    apiKey?: string
): Promise<AIAnalysisResult[]> => {
    // 1. Edge Function Path
    if (shouldUseEdgeFunction()) {
        const payload = {
            message: `ANALYZE_POLICY:${JSON.stringify(COMPLIANCE_RULES.map(r => ({ id: r.id, name: r.name, regulation: r.regulation, keywords: r.keywords })))}`,
            modelName: 'gemini-1.5-pro', // Use smarter model for analysis
            systemInstruction: `You are an expert CQC Compliance Officer. Analyze the user's policy text against the provided rules. Return ONLY JSON.`,
            history: [{ role: 'user', parts: [{ text: text.slice(0, 30000) }] }] // Send policy as user message parts
        };

        const response = await callEdgeFunctionAI('cqc-ai-proxy', {
            ...payload,
            message: "Analyze the policy text provided in history against the CQC rules. Return JSON array."
        });

        // The Edge Function returns { text: string }. We need to parse that JSON.
        const jsonString = response.text.replace(/```json/g, '').replace(/```/g, '').trim();
        return JSON.parse(jsonString) as AIAnalysisResult[];
    }

    // 2. Client-Side Path
    const genAI = initializeAI(apiKey);
    if (!genAI && !apiKey) throw new Error("AI not initialized. Check API Key.");
    if (!genAI) throw new Error("AI Client failed to initialize.");

    const task = async (modelName: string) => {
        const model = genAI.getGenerativeModel({ model: modelName });
        const prompt = `
            You are an expert CQC Compliance Officer AI (Reasoning Layer).
            
            TASK:
            Analyze the following Policy Document text against specific CQC Regulations.
            For each regulation below, determine if the policy MEETS (pass), PARTIALLY MEETS (partial), or FAILS (fail) the requirements.

            REGULATIONS TO CHECK:
            ${JSON.stringify(COMPLIANCE_RULES.map(r => ({
            id: r.id,
            name: r.name,
            regulation: r.regulation,
            required_concepts: r.keywords.join(', '),
            critical_details: r.criticalKeywords.join(', ')
        })))}

            INPUT TEXT:
            """${text.slice(0, 30000)}""" 
            (Text truncated for token limits if necessary)

            OUTPUT FORMAT:
            Return ONLY a valid JSON array matching this structure:
            [
                {
                    "ruleId": "string (matching the ID from regulations)",
                    "status": "pass" | "fail" | "partial",
                    "reasoning": "Brief explanation of why",
                    "recommendation": "Actionable advice to fix gaps",
                    "quote": "relevant text snippet or 'Not Found'"
                }
            ]
        `;

        const generate = async (retryCount = 0): Promise<string> => {
            try {
                if (retryCount === 0) await delay(500); // Small debounce
                const result = await model.generateContent(prompt);
                const response = await result.response;
                return response.text();
            } catch (error: any) {
                if (retryCount < 3 && (error.message.includes('429') || error.message.includes('quota'))) {
                    await delay(5000 + (retryCount * 5000));
                    return generate(retryCount + 1);
                }
                throw error;
            }
        };

        return await generate();
    };

    try {
        const textResponse = await runWithRetry(task, "Policy Analysis");
        const jsonString = textResponse.replace(/```json/g, '').replace(/```/g, '').trim();
        return JSON.parse(jsonString) as AIAnalysisResult[];
    } catch (error) {
        console.error("AI Analysis Failed:", error);
        throw new Error("Reasoning Engine failed. Please check your API Key and Quota.");
    }
};

export const generatePolicyClause = async (
    gap: string,
    regulation: string,
    apiKey?: string
): Promise<string> => {
    // 1. Edge Function Path
    if (shouldUseEdgeFunction()) {
        const response = await callEdgeFunctionAI('cqc-ai-proxy', {
            message: `generate_clause:${regulation}:${gap}`,
            modelName: 'gemini-2.0-flash',
            systemInstruction: `You are a CQC Policy Writer. Draft a missing policy clause.
            CONTEXT: ${CQC_KNOWLEDGE_BASE}
            REGULATION: ${regulation}
            GAP: ${gap}
            Task: Write a single robust paragraph.`
        });
        return response.text;
    }

    // 2. Client-Side Path
    const genAI = initializeAI(apiKey);
    if (!genAI) throw new Error("AI not initialized.");

    const task = async (modelName: string) => {
        const model = genAI.getGenerativeModel({ model: modelName });
        const prompt = `
            You are a CQC Policy Writer.
            A care provider has been found to have a compliance gap.
            
            OFFICIAL REGULATIONS REFERENCE:
            ${CQC_KNOWLEDGE_BASE}

            REGULATION: ${regulation}
            IDENTIFIED GAP: ${gap}

            TASK:
            Draft a single, robust policy clause (paragraph) that explicitly addresses this gap. 
            The language must be formal, compliant with UK Health & Social Care Act standards, and auditable.
            Use the provided regulations text to ensure accuracy.
            Do not provide a full policy, just the specific 'Missing Clause' to be inserted.
            Start with specific header if applicable.
        `;

        const generate = async (retryCount = 0): Promise<string> => {
            try {
                if (retryCount === 0) await delay(500);
                const result = await model.generateContent(prompt);
                const response = await result.response;
                return response.text();
            } catch (error: any) {
                if (retryCount < 3 && (error.message.includes('429') || error.message.includes('quota'))) {
                    await delay(5000);
                    return generate(retryCount + 1);
                }
                throw error;
            }
        };

        return await generate();
    };

    try {
        return await runWithRetry(task, "Policy Generation");
    } catch (error) {
        console.warn("Policy generation failed.");
        throw error;
    }
};
