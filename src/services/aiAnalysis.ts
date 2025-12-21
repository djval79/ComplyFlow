import { GoogleGenerativeAI } from "@google/generative-ai";
import { COMPLIANCE_RULES } from "../config/complianceRules";

// Safe initialization - requires user to provide key or env var
export const getEnvApiKey = (): string => {
    return import.meta.env.VITE_GEMINI_API_KEY || '';
}

const initializeAI = (apiKey?: string) => {
    const key = (apiKey || getEnvApiKey()).trim();
    if (!key) throw new Error("No API Key provided. Please set VITE_GEMINI_API_KEY or provide it manually.");
    return new GoogleGenerativeAI(key);
};

export interface AIAnalysisResult {
    ruleId: string;
    status: 'pass' | 'fail' | 'partial';
    reasoning: string;
    recommendation: string;
    quote?: string;
}

// Helper to delay execution
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Models to try in order of preference (only currently available models)
const MODELS_TO_TRY = [
    "gemini-2.0-flash",
    "gemini-2.0-flash-exp",
    "gemini-1.5-flash-8b",      // Smaller model with different quota
    "gemini-exp-1206"           // Experimental model
];

// Longer retry delays for rate limiting (5s, 10s, 20s)
const RETRY_DELAYS = [5000, 10000, 20000];

export const analyzeWithAI = async (
    text: string,
    apiKey?: string
): Promise<AIAnalysisResult[]> => {
    const genAI = initializeAI(apiKey);

    // Helper to run generation with a specific model and retry logic
    const runGenWithRetry = async (modelName: string, maxRetries = 3) => {
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

        let lastError;
        for (let attempt = 0; attempt < maxRetries; attempt++) {
            try {
                // Add a small delay before first attempt to avoid burst limiting
                if (attempt === 0) await delay(1000);

                const result = await model.generateContent(prompt);
                const response = await result.response;
                return response.text();
            } catch (error: unknown) {
                lastError = error;
                const errorMessage = error instanceof Error ? error.message : String(error);

                // Check if it's a rate limit error (429)
                if (errorMessage.includes('429') || errorMessage.includes('Too Many Requests') || errorMessage.includes('quota')) {
                    const waitTime = RETRY_DELAYS[attempt] || 20000;
                    console.warn(`Rate limited on ${modelName}. Waiting ${waitTime / 1000}s before retry... (attempt ${attempt + 1}/${maxRetries})`);
                    await delay(waitTime);
                } else {
                    // For other errors, don't retry
                    throw error;
                }
            }
        }
        throw lastError;
    };

    try {
        let textResponse;
        let lastError;

        // Try each model in order
        for (const modelName of MODELS_TO_TRY) {
            try {
                console.log(`Trying model: ${modelName}`);
                textResponse = await runGenWithRetry(modelName);
                break; // Success, exit loop
            } catch (error: unknown) {
                const errorMessage = error instanceof Error ? error.message : String(error);
                console.warn(`Model ${modelName} failed:`, errorMessage);
                lastError = error;

                // If it's a 404, try next model immediately
                // If it's a 429 after retries, also try next model
                continue;
            }
        }

        if (!textResponse) {
            throw lastError || new Error("All models failed");
        }

        const jsonString = textResponse.replace(/```json/g, '').replace(/```/g, '').trim();
        return JSON.parse(jsonString) as AIAnalysisResult[];

    } catch (error) {
        console.error("AI Analysis Failed:", error);
        throw new Error("Reasoning Engine failed. Please check your API Key and Quota.");
    }
};

export interface ChatMessage {
    role: 'user' | 'model';
    parts: string;
}

export const runInspectionChat = async (
    history: ChatMessage[],
    currentInput: string,
    apiKey?: string
): Promise<string> => {
    const genAI = initializeAI(apiKey);

    const runChatWithRetry = async (modelName: string, maxRetries = 3) => {
        const model = genAI.getGenerativeModel({ model: modelName });
        const chat = model.startChat({
            history: [
                {
                    role: "user",
                    parts: [{ text: "SYSTEM INSTRUCTION: You are a strict but fair CQC Inspector conducting a 'Key Line of Enquiry' (KLOE) interview. You are inspecting a UK Care Provider. Ask one targeted question at a time about Safe, Effective, Caring, Responsive, or Well-led. Don't be easily satisfied; probe for evidence. If the user gives a good answer, acknowledge it and move to the next topic. Keep your responses concise (under 50 words). Start by asking about Staffing Levels." }]
                },
                {
                    role: "model",
                    parts: [{ text: "Understood. I will act as the CQC Inspector." }]
                },
                ...history.map(h => ({
                    role: h.role,
                    parts: [{ text: h.parts }]
                }))
            ],
            generationConfig: {
                maxOutputTokens: 150,
            },
        });

        let lastError;
        for (let attempt = 0; attempt < maxRetries; attempt++) {
            try {
                const result = await chat.sendMessage(currentInput);
                const response = await result.response;
                return response.text();
            } catch (error: unknown) {
                lastError = error;
                const errorMessage = error instanceof Error ? error.message : String(error);

                if (errorMessage.includes('429') || errorMessage.includes('Too Many Requests') || errorMessage.includes('quota')) {
                    const waitTime = Math.pow(2, attempt + 1) * 1000;
                    console.warn(`Rate limited on ${modelName}. Retrying in ${waitTime / 1000}s... (attempt ${attempt + 1}/${maxRetries})`);
                    await delay(waitTime);
                } else {
                    throw error;
                }
            }
        }
        throw lastError;
    };

    try {
        let lastError;

        for (const modelName of MODELS_TO_TRY) {
            try {
                console.log(`Chat trying model: ${modelName}`);
                return await runChatWithRetry(modelName);
            } catch (error: unknown) {
                const errorMessage = error instanceof Error ? error.message : String(error);
                console.warn(`Chat model ${modelName} failed:`, errorMessage);
                lastError = error;
                continue;
            }
        }

        throw lastError || new Error("All chat models failed");
    } catch (error) {
        console.error("AI Chat Failed:", error);
        throw new Error("Inspector connection lost.");
    }
};

export const generatePolicyClause = async (
    gap: string,
    regulation: string,
    apiKey?: string
): Promise<string> => {
    const genAI = initializeAI(apiKey);

    const runGenWithRetry = async (modelName: string, maxRetries = 3) => {
        const model = genAI.getGenerativeModel({ model: modelName });
        const prompt = `
            You are a CQC Policy Writer.
            A care provider has been found to have a compliance gap.
            
            REGULATION: ${regulation}
            IDENTIFIED GAP: ${gap}

            TASK:
            Draft a single, robust policy clause (paragraph) that explicitly addresses this gap. 
            The language must be formal, compliant with UK Health & Social Care Act standards, and auditable.
            Do not provide a full policy, just the specific 'Missing Clause' to be inserted.
            Start with specific header if applicable.
        `;

        let lastError;
        for (let attempt = 0; attempt < maxRetries; attempt++) {
            try {
                if (attempt === 0) await delay(1000); // Debounce
                const result = await model.generateContent(prompt);
                const response = await result.response;
                return response.text();
            } catch (error: unknown) {
                lastError = error;
                const errorMessage = error instanceof Error ? error.message : String(error);
                if (errorMessage.includes('429') || errorMessage.includes('quota')) {
                    const waitTime = RETRY_DELAYS[attempt] || 5000;
                    await delay(waitTime);
                } else {
                    throw error;
                }
            }
        }
        throw lastError;
    };

    // Simple fallback logic similar to other functions
    for (const modelName of MODELS_TO_TRY) {
        try {
            return await runGenWithRetry(modelName);
        } catch (error) {
            console.warn(`Model ${modelName} failed for policy generation.`);
            continue;
        }
    }

    throw new Error("Unable to generate policy clause at this time.");
};
