import { GoogleGenerativeAI } from "@google/generative-ai";
import { supabase } from "../lib/supabase";

// Safe initialization - requires user to provide key or env var
export const getEnvApiKey = (): string => {
    return import.meta.env.VITE_GEMINI_API_KEY || '';
}

export const shouldUseEdgeFunction = () => {
    return import.meta.env.VITE_USE_EDGE_FUNCTION === 'true';
}

export const initializeAI = (apiKey?: string) => {
    // If using Edge Function, we don't strictly *need* the key here, 
    // but the existing code structure expects a genAI instance for client-side fallback.
    const key = (apiKey || getEnvApiKey()).trim();
    if (!key && !shouldUseEdgeFunction()) {
        throw new Error("No API Key provided. Please set VITE_GEMINI_API_KEY or use Edge Function mode.");
    }
    // Return dummy if mostly using backend, or actual if available
    return key ? new GoogleGenerativeAI(key) : null;
};

// Helper to delay execution
export const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Models to try in order of preference
export const MODELS_TO_TRY = [
    "gemini-2.0-flash",
    "gemini-2.0-flash-exp",
    "gemini-1.5-flash-8b",
    "gemini-exp-1206"
];

// Retry logic helper
export const runWithRetry = async <T>(
    operation: (modelName: string) => Promise<T>,
    context: string
): Promise<T> => {
    // Try each model in order
    let lastError;

    for (const modelName of MODELS_TO_TRY) {
        try {
            // console.log(`${context} trying model: ${modelName}`);
            return await operation(modelName);
        } catch (error: unknown) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            console.warn(`${context} model ${modelName} failed:`, errorMessage);
            lastError = error;

            // Simple retry/fallback logic is implicit by loop
            continue;
        }
    }

    throw lastError || new Error(`All models failed for ${context}`);
};


export interface ChatMessage {
    role: 'user' | 'model';
    parts: string;
}

// Helper to call Edge Function
export const callEdgeFunctionAI = async (
    functionName: string,
    payload: any
): Promise<any> => {
    const { data, error } = await supabase.functions.invoke(functionName, {
        body: payload
    });

    if (error) throw error;
    return data;
};

// Alias for backward compatibility (formerly used in GapAnalyzer etc)
export const aiProxyCall = callEdgeFunctionAI;
