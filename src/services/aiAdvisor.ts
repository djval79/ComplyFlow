import { initializeAI, runWithRetry, delay, shouldUseEdgeFunction, callEdgeFunctionAI } from './aiCore';
import type { ChatMessage } from './aiCore';
import { CQC_KNOWLEDGE_BASE } from '../data/cqcKnowledgeBase';

export const runAdvisorChat = async (
    history: ChatMessage[],
    currentInput: string,
    apiKey?: string
): Promise<string> => {
    // 1. Edge Function Path
    if (shouldUseEdgeFunction()) {
        const response = await callEdgeFunctionAI('cqc-ai-proxy', {
            history,
            message: currentInput,
            modelName: 'gemini-2.0-flash', // Default for Edge
            systemInstruction: `You are an expert CQC Consultant and Advisor. 
            CONTEXT: ${CQC_KNOWLEDGE_BASE}
            GUIDELINES: Format with Markdown. Be concise but detailed.`
        });
        return response.text;
    }

    // 2. Client-Side Path (Fallback)
    const genAI = initializeAI(apiKey);
    if (!genAI) throw new Error("AI not initialized");

    const task = async (modelName: string) => {
        const model = genAI.getGenerativeModel({ model: modelName });
        const chat = model.startChat({
            history: [
                {
                    role: "user",
                    parts: [{
                        text: `SYSTEM INSTRUCTION: You are an expert CQC Consultant and Advisor for UK Health & Social Care providers. Your goal is to help Care Managers and Agency owners understand regulations, improve their service, and prepare for inspections. 

CONTEXT - OFFICIAL CQC REGULATIONS:
${CQC_KNOWLEDGE_BASE}

GUIDELINES:
1. You are helpful, knowledgeable, and professional.
2. Cite specific CQC regulations (e.g., Reg 12: Safe Care and Treatment) when relevant, using the context provided above.
3. Provide practical, actionable advice.
4. Format your responses using Markdown: use bold for key terms, lists for steps, and headers where appropriate.
5. If you don't know the answer, say so, but offer to help find out.` }]
                },
                {
                    role: "model",
                    parts: [{ text: "Understood. I have read the CQC Regulations and am ready to act as an expert Consultant." }]
                },
                ...history.map(h => ({
                    role: h.role,
                    parts: [{ text: h.parts }]
                }))
            ],
            generationConfig: {
                maxOutputTokens: 2000,
            },
        });

        const sendMessage = async (retryCount = 0): Promise<string> => {
            try {
                const result = await chat.sendMessage(currentInput);
                const response = await result.response;
                return response.text();
            } catch (error: any) {
                if (retryCount < 3 && (error.message.includes('429') || error.message.includes('quota'))) {
                    await delay(2000 * Math.pow(2, retryCount));
                    return sendMessage(retryCount + 1);
                }
                throw error;
            }
        };

        return await sendMessage();
    };

    try {
        return await runWithRetry(task, "Advisor Chat");
    } catch (error) {
        console.error("AI Advisor Chat Failed:", error);
        throw new Error("Advisor service is currently unavailable. Please check your connection or API key.");
    }
};

export const runAdvisorChatStream = async (
    history: ChatMessage[],
    currentInput: string,
    onChunk: (text: string) => void,
    apiKey?: string
): Promise<string> => {
    const genAI = initializeAI(apiKey);
    if (!genAI) throw new Error("AI not initialized");
    let fullText = "";

    const task = async (modelName: string) => {
        const model = genAI.getGenerativeModel({ model: modelName });
        const chat = model.startChat({
            history: [
                {
                    role: "user",
                    parts: [{
                        text: `SYSTEM INSTRUCTION: You are an expert CQC Consultant and Advisor for UK Health & Social Care providers.

CONTEXT - OFFICIAL CQC REGULATIONS:
${CQC_KNOWLEDGE_BASE}

GUIDELINES:
1. You are helpful, knowledgeable, and professional.
2. Cite specific CQC regulations (e.g., Reg 12) from the context provided.
3. Provide practical, actionable advice.
4. Format your responses using Markdown.
5. Keep your advice focused on the UK Care Quality Commission standards.` }]
                },
                {
                    role: "model",
                    parts: [{ text: "Understood. I have read the regulations and am ready to assist." }]
                },
                ...history.map(h => ({
                    role: h.role,
                    parts: [{ text: h.parts }]
                }))
            ],
            generationConfig: {
                maxOutputTokens: 2000,
            },
        });

        const sendMessageStream = async (retryCount = 0): Promise<string> => {
            try {
                const result = await chat.sendMessageStream(currentInput);

                fullText = "";
                for await (const chunk of result.stream) {
                    const chunkText = chunk.text();
                    fullText += chunkText;
                    onChunk(fullText);
                }

                return fullText;
            } catch (error: any) {
                if (retryCount < 3 && (error.message.includes('429') || error.message.includes('quota'))) {
                    await delay(2000 * Math.pow(2, retryCount));
                    return sendMessageStream(retryCount + 1);
                }
                throw error;
            }
        };

        return await sendMessageStream();
    };

    try {
        return await runWithRetry(task, "Advisor Chat Stream");
    } catch (error) {
        console.error("AI Advisor Chat Stream Failed:", error);
        throw new Error("Advisor service is currently unavailable. Please check your connection or API key.");
    }
};

export const runInspectionChat = async (
    history: ChatMessage[],
    currentInput: string,
    apiKey?: string
): Promise<string> => {
    // 1. Edge Function Path
    if (shouldUseEdgeFunction()) {
        const response = await callEdgeFunctionAI('cqc-ai-proxy', {
            history,
            message: currentInput,
            modelName: 'gemini-2.0-flash',
            systemInstruction: "You are a strict but fair CQC Inspector conducting a 'Key Line of Enquiry' (KLOE) interview. You are inspecting a UK Care Provider. Ask one targeted question at a time about Safe, Effective, Caring, Responsive, or Well-led. Don't be easily satisfied; probe for evidence. If the user gives a good answer, acknowledge it and move to the next topic. Keep your responses concise (under 50 words). Start by asking about Staffing Levels."
        });
        return response.text;
    }

    // 2. Client-Side Path (Fallback)
    const genAI = initializeAI(apiKey);
    if (!genAI) throw new Error("AI not initialized");

    const task = async (modelName: string) => {
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

        const sendMessage = async (retryCount = 0): Promise<string> => {
            try {
                const result = await chat.sendMessage(currentInput);
                const response = await result.response;
                return response.text();
            } catch (error: any) {
                if (retryCount < 3 && (error.message.includes('429') || error.message.includes('quota'))) {
                    await delay(2000 * Math.pow(2, retryCount));
                    return sendMessage(retryCount + 1);
                }
                throw error;
            }
        };

        return await sendMessage();
    };

    try {
        return await runWithRetry(task, "Inspection Chat");
    } catch (error) {
        console.error("AI Inspection Chat Failed:", error);
        throw new Error("Inspector connection lost.");
    }
};
