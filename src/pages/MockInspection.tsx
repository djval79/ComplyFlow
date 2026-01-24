import { useState, useEffect, useRef } from 'react';
import { ProductionErrorBoundary } from '../components/ProductionErrorBoundary';
import {
    Send, Play, RotateCcw, CheckCircle, Brain, Loader2,
    Target, Clock, Users, Shield, Heart, Zap, Award,
    ChevronRight, AlertTriangle, Lightbulb, Star, TrendingUp,
    Download, FileText, MessageSquare, Mic, MicOff, CheckSquare, ListChecks
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { useNavigate } from 'react-router-dom';
import {
    INSPECTION_SCENARIOS, INSPECTION_QUESTIONS, KEY_QUESTIONS, SCORING_RUBRIC,
    getQuestionsForScenario, type InspectionScenario, type InspectionQuestion
} from '../data/cqcInspectionData';
import { CQC_KNOWLEDGE_BASE } from '../data/cqcKnowledgeBase';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import { shouldUseEdgeFunction, callEdgeFunctionAI, initializeAI, runWithRetry, delay } from '../services/aiCore';
import type { ChatMessage } from '../services/aiCore';
import { createBulkActions, type CreateActionInput } from '../services/actionsService';
import { toast } from 'react-hot-toast';

// Types
interface EvaluatedResponse {
    questionId: string;
    question: string;
    userResponse: string;
    aiEvaluation: string;
    score: number;
    strengths: string[];
    improvements: string[];
}

interface InspectionSession {
    scenario: InspectionScenario;
    startTime: Date;
    endTime?: Date;
    responses: EvaluatedResponse[];
    overallScore?: number;
    overallFeedback?: string;
    status: 'setup' | 'in_progress' | 'evaluating' | 'complete';
}

// AI System Instructions
const getInspectorSystemPrompt = (scenario: InspectionScenario, currentQuestion: InspectionQuestion) => `
You are an experienced CQC Inspector named Inspector Sarah Mitchell. You are conducting a ${scenario.title} inspection.

YOUR ROLE:
- You are ${scenario.difficulty === 'intensive' ? 'thorough and probing' : scenario.difficulty === 'challenging' ? 'detailed but fair' : 'supportive but professional'}
- You ask ONE question at a time and wait for responses
- You probe for evidence when answers are vague
- You acknowledge good answers before moving on
- You keep responses under 80 words
- You are professional but not cold

CURRENT CONTEXT:
- Scenario: ${scenario.title}
- Target Role: ${scenario.targetRole}
- Focus Areas: ${scenario.focusAreas.join(', ')}
- Key Questions Being Assessed: ${scenario.keyQuestions.map(k => KEY_QUESTIONS[k].title).join(', ')}

CURRENT QUESTION TO ASK:
Main Question: "${currentQuestion.question}"
Related Regulations: ${currentQuestion.relatedRegulations.join(', ')}
Quality Statement: ${currentQuestion.qualityStatementId}

FOLLOW-UP QUESTIONS (if needed): 
${currentQuestion.followUps.map((f, i) => `${i + 1}. ${f}`).join('\n')}

GOOD RESPONSE INDICATORS:
${currentQuestion.goodResponseIndicators.map(g => `- ${g}`).join('\n')}

RED FLAGS TO WATCH FOR:
${currentQuestion.redFlags.map(r => `- ${r}`).join('\n')}

GUIDELINES:
1. Ask the main question naturally, as a real inspector would
2. If the answer is vague or incomplete, use a follow-up to probe deeper
3. If the answer shows good practice, briefly acknowledge it
4. If you spot a red flag, probe further but don't accuse
5. After sufficient exploration of this topic, indicate you're ready to move on

CQC REGULATIONS CONTEXT:
${CQC_KNOWLEDGE_BASE}
`;

const getEvaluatorSystemPrompt = () => `
You are an expert CQC compliance evaluator. Your role is to assess interview responses against CQC standards.

You will receive:
1. The question that was asked
2. The expected good response indicators
3. Red flags to watch for
4. The candidate's actual response

Provide:
1. A score from 1-4 using CQC's scoring system:
   - 1 = Inadequate (poor/unsafe practice, significant concerns)
   - 2 = Requires Improvement (some concerns, improvements needed)
   - 3 = Good (meets expected standards consistently)
   - 4 = Outstanding (exceptional practice, exceeds expectations)

2. A brief evaluation (2-3 sentences) explaining the score

3. 2-3 specific strengths demonstrated (if any)

4. 2-3 specific improvements needed (if any)

Format your response as JSON:
{
  "score": <number 1-4>,
  "evaluation": "<brief evaluation>",
  "strengths": ["<strength 1>", "<strength 2>"],
  "improvements": ["<improvement 1>", "<improvement 2>"]
}

Be fair but rigorous. A score of 3 (Good) is the baseline for compliance.
`;

const MockInspectionContent: React.FC = () => {
    const { profile } = useAuth();

    // Session State
    const [session, setSession] = useState<InspectionSession | null>(null);
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [questions, setQuestions] = useState<InspectionQuestion[]>([]);

    // Chat State
    const [messages, setMessages] = useState<{ id: number; sender: 'user' | 'inspector'; text: string }[]>([]);
    const [input, setInput] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const [history, setHistory] = useState<ChatMessage[]>([]);

    // UI State
    const [selectedScenario, setSelectedScenario] = useState<InspectionScenario | null>(null);
    const [showResults, setShowResults] = useState(false);
    const [saving, setSaving] = useState(false);
    const [creatingActions, setCreatingActions] = useState(false);
    const [actionsCreated, setActionsCreated] = useState(false);
    const navigate = useNavigate();

    // AI Config
    const [apiKey, setApiKey] = useState('');
    const [isKeySet, setIsKeySet] = useState(false);
    const isEdgeMode = shouldUseEdgeFunction();

    const chatEndRef = useRef<HTMLDivElement>(null);

    // Initialize API
    useEffect(() => {
        if (isEdgeMode) {
            setIsKeySet(true);
        } else {
            const envKey = import.meta.env.VITE_GEMINI_API_KEY;
            if (envKey && !envKey.includes('INSERT')) {
                setApiKey(envKey);
                setIsKeySet(true);
            }
        }
    }, [isEdgeMode]);

    // Auto-scroll chat
    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    // Start a new inspection session
    const startInspection = async () => {
        if (!selectedScenario) return;

        const scenarioQuestions = getQuestionsForScenario(selectedScenario.id);
        // Shuffle and limit questions based on difficulty
        const maxQuestions = selectedScenario.difficulty === 'intensive' ? 10 :
            selectedScenario.difficulty === 'challenging' ? 6 : 4;
        const shuffled = scenarioQuestions.sort(() => 0.5 - Math.random()).slice(0, maxQuestions);

        setQuestions(shuffled);
        setCurrentQuestionIndex(0);
        setMessages([]);
        setHistory([]);

        setSession({
            scenario: selectedScenario,
            startTime: new Date(),
            responses: [],
            status: 'in_progress'
        });

        // Start with first question
        await askQuestion(shuffled[0], selectedScenario);
    };

    // Ask the current question via AI
    const askQuestion = async (question: InspectionQuestion, scenario: InspectionScenario) => {
        setIsTyping(true);

        try {
            const systemPrompt = getInspectorSystemPrompt(scenario, question);
            const startMessage = currentQuestionIndex === 0
                ? "Good morning. I'm Inspector Sarah Mitchell from the Care Quality Commission. I'll be conducting a mock inspection today focusing on " + scenario.focusAreas.slice(0, 3).join(', ') + ". Shall we begin?"
                : "Let's move on to the next area.";

            let response: string;

            if (isEdgeMode) {
                const result = await callEdgeFunctionAI('cqc-ai-proxy', {
                    history: [...history, { role: 'user', parts: 'Please ask the next inspection question.' }],
                    message: startMessage,
                    modelName: 'gemini-2.0-flash',
                    systemInstruction: systemPrompt
                });
                response = result.text;
            } else {
                const genAI = initializeAI(apiKey);
                if (!genAI) throw new Error("AI not initialized");

                response = await runWithRetry(async (modelName) => {
                    const model = genAI.getGenerativeModel({ model: modelName });
                    const result = await model.generateContent({
                        contents: [{ role: 'user', parts: [{ text: systemPrompt + "\n\nNow, please greet the candidate and ask the main question naturally." }] }]
                    });
                    return result.response.text();
                }, "Inspector Question");
            }

            setMessages(prev => [...prev, {
                id: Date.now(),
                sender: 'inspector',
                text: response
            }]);
            setHistory(prev => [...prev, { role: 'model', parts: response }]);

        } catch (error) {
            console.error("Failed to ask question:", error);
            setMessages(prev => [...prev, {
                id: Date.now(),
                sender: 'inspector',
                text: questions[currentQuestionIndex]?.question || "I apologize, there was a technical issue. Let me try again."
            }]);
        } finally {
            setIsTyping(false);
        }
    };

    // Handle user response
    const handleSend = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!input.trim() || !session) return;

        const userMsg = input;
        setMessages(prev => [...prev, { id: Date.now(), sender: 'user', text: userMsg }]);
        setInput('');
        setIsTyping(true);

        try {
            const currentQuestion = questions[currentQuestionIndex];
            const systemPrompt = getInspectorSystemPrompt(session.scenario, currentQuestion);

            let response: string;

            if (isEdgeMode) {
                const result = await callEdgeFunctionAI('cqc-ai-proxy', {
                    history: [...history, { role: 'user', parts: userMsg }],
                    message: userMsg,
                    modelName: 'gemini-2.0-flash',
                    systemInstruction: systemPrompt
                });
                response = result.text;
            } else {
                const genAI = initializeAI(apiKey);
                if (!genAI) throw new Error("AI not initialized");

                response = await runWithRetry(async (modelName) => {
                    const model = genAI.getGenerativeModel({ model: modelName });
                    const chat = model.startChat({
                        history: [
                            { role: 'user', parts: [{ text: systemPrompt }] },
                            { role: 'model', parts: [{ text: 'Understood. I will act as Inspector Sarah Mitchell.' }] },
                            ...history.map(h => ({ role: h.role, parts: [{ text: h.parts }] }))
                        ],
                        generationConfig: { maxOutputTokens: 200 }
                    });
                    const result = await chat.sendMessage(userMsg);
                    return result.response.text();
                }, "Inspector Response");
            }

            setMessages(prev => [...prev, { id: Date.now() + 1, sender: 'inspector', text: response }]);
            setHistory(prev => [
                ...prev,
                { role: 'user', parts: userMsg },
                { role: 'model', parts: response }
            ]);

            // Check if inspector indicates moving on (simple heuristic)
            const movingOnIndicators = ['next area', 'move on', 'another topic', 'next question', 'let\'s discuss', 'shall we move', 'moving on'];
            const shouldAdvance = movingOnIndicators.some(indicator =>
                response.toLowerCase().includes(indicator)
            );

            if (shouldAdvance || history.length > 6) {
                // Evaluate this question's responses and move to next
                await evaluateAndAdvance(currentQuestion, userMsg);
            }

        } catch (error) {
            console.error("Error:", error);
            setMessages(prev => [...prev, {
                id: Date.now() + 1,
                sender: 'inspector',
                text: "Connection temporarily interrupted. Please continue with your response."
            }]);
        } finally {
            setIsTyping(false);
        }
    };

    // Evaluate response and move to next question
    const evaluateAndAdvance = async (question: InspectionQuestion, lastResponse: string) => {
        // Gather all user responses for this question
        const questionResponses = messages
            .filter(m => m.sender === 'user')
            .map(m => m.text)
            .join(' ');

        try {
            // Evaluate using AI
            const evaluationPrompt = `
${getEvaluatorSystemPrompt()}

QUESTION: ${question.question}

GOOD RESPONSE INDICATORS:
${question.goodResponseIndicators.map(g => `- ${g}`).join('\n')}

RED FLAGS:
${question.redFlags.map(r => `- ${r}`).join('\n')}

CANDIDATE'S RESPONSE:
${questionResponses}

Please evaluate and respond with JSON only.
`;

            let evaluationResult: EvaluatedResponse;

            if (isEdgeMode) {
                const result = await callEdgeFunctionAI('cqc-ai-proxy', {
                    history: [],
                    message: evaluationPrompt,
                    modelName: 'gemini-2.0-flash',
                    systemInstruction: 'You are an evaluation JSON generator. Respond ONLY with valid JSON.'
                });

                try {
                    const parsed = JSON.parse(result.text.replace(/```json\n?|\n?```/g, ''));
                    evaluationResult = {
                        questionId: question.id,
                        question: question.question,
                        userResponse: questionResponses,
                        aiEvaluation: parsed.evaluation,
                        score: parsed.score,
                        strengths: parsed.strengths || [],
                        improvements: parsed.improvements || []
                    };
                } catch {
                    evaluationResult = {
                        questionId: question.id,
                        question: question.question,
                        userResponse: questionResponses,
                        aiEvaluation: result.text,
                        score: 3,
                        strengths: [],
                        improvements: []
                    };
                }
            } else {
                const genAI = initializeAI(apiKey);
                const model = genAI!.getGenerativeModel({ model: 'gemini-2.0-flash' });
                const result = await model.generateContent(evaluationPrompt);
                const text = result.response.text();

                try {
                    const parsed = JSON.parse(text.replace(/```json\n?|\n?```/g, ''));
                    evaluationResult = {
                        questionId: question.id,
                        question: question.question,
                        userResponse: questionResponses,
                        aiEvaluation: parsed.evaluation,
                        score: parsed.score,
                        strengths: parsed.strengths || [],
                        improvements: parsed.improvements || []
                    };
                } catch {
                    evaluationResult = {
                        questionId: question.id,
                        question: question.question,
                        userResponse: questionResponses,
                        aiEvaluation: text,
                        score: 3,
                        strengths: [],
                        improvements: []
                    };
                }
            }

            setSession(prev => prev ? {
                ...prev,
                responses: [...prev.responses, evaluationResult]
            } : null);

        } catch (error) {
            console.error("Evaluation error:", error);
        }

        // Move to next question or finish
        if (currentQuestionIndex < questions.length - 1) {
            setCurrentQuestionIndex(prev => prev + 1);
            setHistory([]);
            // Clear messages for new question context but show transition
            setMessages(prev => [...prev, {
                id: Date.now(),
                sender: 'inspector',
                text: "---\n*Moving to next topic...*\n---"
            }]);
            await delay(1000);
            await askQuestion(questions[currentQuestionIndex + 1], session!.scenario);
        } else {
            // Complete the inspection
            await completeInspection();
        }
    };

    // Complete the inspection and generate final report
    const completeInspection = async () => {
        if (!session) return;

        setSession(prev => prev ? { ...prev, status: 'evaluating' } : null);

        // Calculate overall score
        const scores = session.responses.map(r => r.score);
        const avgScore = scores.length > 0
            ? scores.reduce((a, b) => a + b, 0) / scores.length
            : 3;

        // Generate overall feedback
        const overallFeedback = `
## Mock Inspection Complete

**Scenario:** ${session.scenario.title}
**Duration:** ${Math.round((Date.now() - session.startTime.getTime()) / 60000)} minutes
**Questions Covered:** ${session.responses.length}

### Overall Rating: ${getRatingLabel(avgScore)} (${avgScore.toFixed(1)}/4)

${session.responses.map(r => `
#### ${r.question.substring(0, 60)}...
- **Score:** ${getRatingLabel(r.score)}
${r.strengths.length > 0 ? `- **Strengths:** ${r.strengths.join(', ')}` : ''}
${r.improvements.length > 0 ? `- **Areas for Improvement:** ${r.improvements.join(', ')}` : ''}
`).join('\n')}
    `;

        setSession(prev => prev ? {
            ...prev,
            endTime: new Date(),
            overallScore: avgScore,
            overallFeedback,
            status: 'complete'
        } : null);

        setShowResults(true);

        // Save to database
        await saveSession(avgScore, overallFeedback);
    };

    // Save session to database
    const saveSession = async (score: number, feedback: string) => {
        if (!profile?.organization_id || !session) return;
        setSaving(true);

        try {
            await supabase.from('compliance_analyses').insert({
                organization_id: profile.organization_id,
                analysis_type: 'mock_inspection',
                overall_score: Math.round(score * 25), // Convert to percentage
                summary: `CQC Mock Inspection: ${session.scenario.title}. Score: ${getRatingLabel(score)}`,
                results: {
                    scenario: session.scenario,
                    responses: session.responses,
                    feedback
                }
            });
        } catch (err) {
            console.error('Failed to save inspection session:', err);
        } finally {
            setSaving(false);
        }
    };

    const getRatingLabel = (score: number): string => {
        if (score >= 3.5) return 'Outstanding';
        if (score >= 2.5) return 'Good';
        if (score >= 1.5) return 'Requires Improvement';
        return 'Inadequate';
    };

    const getRatingColor = (score: number): string => {
        if (score >= 3.5) return '#22c55e';
        if (score >= 2.5) return '#3b82f6';
        if (score >= 1.5) return '#f59e0b';
        return '#ef4444';
    };

    // Reset everything
    const resetInspection = () => {
        setSession(null);
        setSelectedScenario(null);
        setMessages([]);
        setHistory([]);
        setQuestions([]);
        setCurrentQuestionIndex(0);
        setShowResults(false);
        setActionsCreated(false);
    };

    // Render scenario selection
    const renderScenarioSelection = () => (
        <div className="animate-enter">
            <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
                <h1 style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.75rem', fontSize: '2rem' }}>
                    🎯 CQC Mock Inspection Centre
                </h1>
                <p style={{ color: 'var(--color-text-secondary)', marginTop: '0.5rem', maxWidth: '600px', margin: '0.5rem auto 0' }}>
                    Practice realistic CQC inspections with AI-powered interviews. Select a scenario below to begin your mock inspection.
                </p>
            </div>

            {/* API Key Setup */}
            {!isKeySet && (
                <div className="card" style={{ marginBottom: '1.5rem', padding: '1rem', background: '#fffbeb', border: '1px solid #fbbf24' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
                        <AlertTriangle size={18} color="#f59e0b" />
                        <span style={{ fontWeight: 600 }}>AI Configuration Required</span>
                    </div>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <input
                            type="password"
                            className="form-input"
                            placeholder="Enter Google Gemini API Key"
                            value={apiKey}
                            onChange={(e) => setApiKey(e.target.value)}
                            style={{ flex: 1 }}
                        />
                        <button className="btn btn-primary" onClick={() => setIsKeySet(true)} disabled={!apiKey}>
                            Activate
                        </button>
                    </div>
                </div>
            )}

            {isEdgeMode && (
                <div style={{
                    background: '#f0fdf4',
                    padding: '0.75rem 1rem',
                    borderRadius: '8px',
                    border: '1px solid #bbf7d0',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    marginBottom: '1.5rem'
                }}>
                    <CheckCircle size={18} color="#22c55e" />
                    <span style={{ color: '#166534', fontWeight: 500 }}>Enterprise AI Mode Active</span>
                </div>
            )}

            {/* Scenario Grid */}
            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
                gap: '1rem'
            }}>
                {INSPECTION_SCENARIOS.map(scenario => (
                    <div
                        key={scenario.id}
                        onClick={() => setSelectedScenario(scenario)}
                        className="card"
                        style={{
                            cursor: 'pointer',
                            padding: '1.25rem',
                            border: selectedScenario?.id === scenario.id ? '2px solid var(--color-primary)' : '1px solid var(--color-border)',
                            background: selectedScenario?.id === scenario.id ? 'var(--color-primary-bg)' : undefined,
                            transition: 'all 0.2s ease'
                        }}
                    >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                            <h3 style={{ fontSize: '1rem', fontWeight: 600, margin: 0 }}>{scenario.title}</h3>
                            <span style={{
                                fontSize: '0.7rem',
                                padding: '0.2rem 0.5rem',
                                borderRadius: '4px',
                                background: scenario.difficulty === 'intensive' ? '#fef2f2' : scenario.difficulty === 'challenging' ? '#fffbeb' : '#f0fdf4',
                                color: scenario.difficulty === 'intensive' ? '#dc2626' : scenario.difficulty === 'challenging' ? '#d97706' : '#16a34a',
                                fontWeight: 600
                            }}>
                                {scenario.difficulty.toUpperCase()}
                            </span>
                        </div>

                        <p style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)', marginBottom: '0.75rem' }}>
                            {scenario.description}
                        </p>

                        <div style={{ display: 'flex', gap: '1rem', fontSize: '0.75rem', color: 'var(--color-text-tertiary)' }}>
                            <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                                <Clock size={12} /> {scenario.duration}
                            </span>
                            <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                                <Users size={12} /> {scenario.targetRole === 'all' ? 'All Roles' : scenario.targetRole.replace('_', ' ')}
                            </span>
                        </div>

                        <div style={{ display: 'flex', gap: '0.25rem', marginTop: '0.75rem', flexWrap: 'wrap' }}>
                            {scenario.keyQuestions.map(kq => (
                                <span
                                    key={kq}
                                    style={{
                                        fontSize: '0.65rem',
                                        padding: '0.15rem 0.4rem',
                                        borderRadius: '3px',
                                        background: KEY_QUESTIONS[kq].color + '20',
                                        color: KEY_QUESTIONS[kq].color,
                                        fontWeight: 500
                                    }}
                                >
                                    {KEY_QUESTIONS[kq].title}
                                </span>
                            ))}
                        </div>

                        {selectedScenario?.id === scenario.id && (
                            <div style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid var(--color-border)' }}>
                                <p style={{ fontSize: '0.8rem', fontWeight: 500, marginBottom: '0.5rem' }}>Focus Areas:</p>
                                <div style={{ display: 'flex', gap: '0.25rem', flexWrap: 'wrap' }}>
                                    {scenario.focusAreas.map(area => (
                                        <span key={area} style={{
                                            fontSize: '0.7rem',
                                            padding: '0.2rem 0.4rem',
                                            background: 'var(--color-bg-page)',
                                            borderRadius: '4px'
                                        }}>
                                            {area}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                ))}
            </div>

            {/* Start Button */}
            {selectedScenario && (isKeySet || isEdgeMode) && (
                <div style={{ textAlign: 'center', marginTop: '2rem' }}>
                    <button
                        className="btn btn-primary"
                        onClick={startInspection}
                        style={{
                            padding: '1rem 2rem',
                            fontSize: '1.1rem',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.5rem'
                        }}
                    >
                        <Play size={20} />
                        Begin Mock Inspection
                    </button>
                </div>
            )}
        </div>
    );

    // Render the inspection chat interface
    const renderInspectionChat = () => (
        <div className="animate-enter" style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 120px)' }}>
            {/* Header */}
            <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '1rem',
                padding: '0.75rem 1rem',
                background: 'white',
                borderRadius: '8px',
                border: '1px solid var(--color-border)'
            }}>
                <div>
                    <h2 style={{ margin: 0, fontSize: '1.1rem' }}>{session?.scenario.title}</h2>
                    <div style={{ display: 'flex', gap: '1rem', fontSize: '0.75rem', color: 'var(--color-text-tertiary)', marginTop: '0.25rem' }}>
                        <span>Question {currentQuestionIndex + 1} of {questions.length}</span>
                        <span>•</span>
                        <span>{session?.scenario.focusAreas.slice(0, 2).join(', ')}</span>
                    </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    {/* Progress indicators */}
                    <div style={{ display: 'flex', gap: '0.25rem' }}>
                        {questions.map((_, i) => (
                            <div
                                key={i}
                                style={{
                                    width: 8,
                                    height: 8,
                                    borderRadius: '50%',
                                    background: i < currentQuestionIndex
                                        ? '#22c55e'
                                        : i === currentQuestionIndex
                                            ? 'var(--color-primary)'
                                            : 'var(--color-border)'
                                }}
                            />
                        ))}
                    </div>

                    <button
                        className="btn btn-secondary"
                        onClick={resetInspection}
                        style={{ fontSize: '0.8rem', padding: '0.4rem 0.75rem' }}
                    >
                        <RotateCcw size={14} style={{ marginRight: '0.25rem' }} />
                        End
                    </button>
                </div>
            </div>

            {/* Current Question Context */}
            {questions[currentQuestionIndex] && (
                <div style={{
                    padding: '0.75rem 1rem',
                    background: KEY_QUESTIONS[questions[currentQuestionIndex].keyQuestion].color + '10',
                    borderLeft: `3px solid ${KEY_QUESTIONS[questions[currentQuestionIndex].keyQuestion].color}`,
                    borderRadius: '0 8px 8px 0',
                    marginBottom: '1rem',
                    fontSize: '0.8rem'
                }}>
                    <span style={{ fontWeight: 600 }}>
                        {KEY_QUESTIONS[questions[currentQuestionIndex].keyQuestion].icon} Focus: {KEY_QUESTIONS[questions[currentQuestionIndex].keyQuestion].title}
                    </span>
                    <span style={{ color: 'var(--color-text-secondary)', marginLeft: '0.5rem' }}>
                        ({questions[currentQuestionIndex].relatedRegulations.join(', ')})
                    </span>
                </div>
            )}

            {/* Chat Area */}
            <div
                className="card"
                style={{
                    flex: 1,
                    display: 'flex',
                    flexDirection: 'column',
                    padding: 0,
                    overflow: 'hidden'
                }}
            >
                <div style={{
                    flex: 1,
                    padding: '1.5rem',
                    overflowY: 'auto',
                    background: 'var(--color-bg-page)'
                }}>
                    {messages.map(msg => (
                        <div
                            key={msg.id}
                            style={{
                                display: 'flex',
                                justifyContent: msg.sender === 'user' ? 'flex-end' : 'flex-start',
                                marginBottom: '1rem'
                            }}
                        >
                            <div style={{
                                maxWidth: '80%',
                                padding: '1rem',
                                borderRadius: '1rem',
                                borderBottomLeftRadius: msg.sender === 'inspector' ? '0' : '1rem',
                                borderBottomRightRadius: msg.sender === 'user' ? '0' : '1rem',
                                background: msg.sender === 'user' ? 'var(--color-primary)' : 'white',
                                color: msg.sender === 'user' ? 'white' : 'var(--color-text-main)',
                                boxShadow: msg.sender === 'inspector' ? 'var(--shadow-sm)' : 'none',
                                border: msg.sender === 'inspector' ? '1px solid var(--color-border)' : 'none'
                            }}>
                                {msg.sender === 'inspector' && (
                                    <div style={{
                                        fontSize: '0.75rem',
                                        fontWeight: 700,
                                        marginBottom: '0.25rem',
                                        color: '#8b5cf6'
                                    }}>
                                        👩‍💼 INSPECTOR SARAH MITCHELL
                                    </div>
                                )}
                                <div className="prose prose-sm" style={{ color: 'inherit' }}>
                                    <ReactMarkdown>{msg.text}</ReactMarkdown>
                                </div>
                            </div>
                        </div>
                    ))}

                    {isTyping && (
                        <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem',
                            padding: '0.5rem 1rem',
                            fontSize: '0.875rem',
                            color: 'var(--color-text-tertiary)'
                        }}>
                            <Loader2 size={14} className="animate-spin" />
                            Inspector is considering your response...
                        </div>
                    )}

                    <div ref={chatEndRef} />
                </div>

                {/* Input Area */}
                <div style={{
                    padding: '1rem',
                    background: 'white',
                    borderTop: '1px solid var(--color-border)'
                }}>
                    <form onSubmit={handleSend} style={{ display: 'flex', gap: '0.5rem' }}>
                        <input
                            type="text"
                            className="form-input"
                            placeholder="Respond to the inspector..."
                            value={input}
                            onChange={e => setInput(e.target.value)}
                            disabled={isTyping}
                            style={{ flex: 1 }}
                        />
                        <button
                            type="submit"
                            className="btn btn-primary"
                            disabled={!input.trim() || isTyping}
                        >
                            <Send size={18} />
                        </button>
                    </form>
                    <div style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        marginTop: '0.5rem',
                        fontSize: '0.7rem',
                        color: 'var(--color-text-tertiary)'
                    }}>
                        <span>💡 Tip: Provide specific examples and evidence in your answers</span>
                        <span>{session?.responses.length || 0} questions evaluated</span>
                    </div>
                </div>
            </div>
        </div>
    );

    // Create actions from inspection findings
    const handleCreateActions = async () => {
        if (!profile?.organization_id || !session) return;
        setCreatingActions(true);

        try {
            const findingsToConvert = session.responses.filter(r => r.score < 3);

            if (findingsToConvert.length === 0) {
                toast.success('No critical failings found. Great job!');
                setCreatingActions(false);
                return;
            }

            const actionInputs: CreateActionInput[] = findingsToConvert.map(finding => {
                const questionData = INSPECTION_QUESTIONS.find(q => q.id === finding.questionId);
                return {
                    source: 'mock_inspection',
                    source_id: finding.questionId as any,
                    quality_statement_id: questionData?.qualityStatementId,
                    key_question: questionData?.keyQuestion,
                    title: `Improvement: ${finding.question.substring(0, 50)}...`,
                    description: `Inspector Finding: ${finding.aiEvaluation}\n\nRequired Improvements: ${finding.improvements.join(', ')}`,
                    recommendation: `Follow CQC guidance for ${questionData?.qualityStatementId || 'this area'}. Focus on: ${finding.improvements[0] || 'compliance'}`,
                    priority: finding.score === 1 ? 'high' : 'medium'
                };
            });

            await createBulkActions(profile.organization_id, actionInputs);
            toast.success(`Successfully created ${actionInputs.length} compliance actions.`);
            setActionsCreated(true);
        } catch (err) {
            console.error('Failed to create actions:', err);
            toast.error('Failed to create actions. Please try again.');
        } finally {
            setCreatingActions(false);
        }
    };

    // Render results
    const renderResults = () => {
        const scores = session?.responses.map(r => r.score) || [];
        const avgScore = session?.overallScore || (scores.length > 0 ? scores.reduce((a, b) => a + b, 0) / scores.length : 3);

        return (
            <div className="animate-enter">
                <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
                    <div style={{
                        width: 80,
                        height: 80,
                        margin: '0 auto 1rem',
                        borderRadius: '50%',
                        background: getRatingColor(avgScore) + '20',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                    }}>
                        <Award size={40} color={getRatingColor(avgScore)} />
                    </div>
                    <h1 style={{ margin: '0 0 0.5rem' }}>Mock Inspection Complete</h1>
                    <p style={{ color: 'var(--color-text-secondary)' }}>
                        Here's your detailed performance analysis
                    </p>
                </div>

                {/* Score Summary */}
                <div className="card" style={{ padding: '1.5rem', marginBottom: '1.5rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
                        <div>
                            <h2 style={{ margin: '0 0 0.25rem' }}>{session?.scenario.title}</h2>
                            <p style={{ margin: 0, color: 'var(--color-text-secondary)', fontSize: '0.9rem' }}>
                                Completed in {Math.round(((session?.endTime?.getTime() || Date.now()) - (session?.startTime.getTime() || Date.now())) / 60000)} minutes
                            </p>
                        </div>

                        <div style={{
                            textAlign: 'center',
                            padding: '1rem 2rem',
                            background: getRatingColor(avgScore) + '10',
                            borderRadius: '8px'
                        }}>
                            <div style={{
                                fontSize: '2.5rem',
                                fontWeight: 700,
                                color: getRatingColor(avgScore)
                            }}>
                                {avgScore.toFixed(1)}
                            </div>
                            <div style={{
                                fontSize: '0.9rem',
                                fontWeight: 600,
                                color: getRatingColor(avgScore)
                            }}>
                                {getRatingLabel(avgScore)}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Individual Question Results */}
                <h3 style={{ marginBottom: '1rem' }}>Question-by-Question Analysis</h3>

                {session?.responses.map((response, idx) => (
                    <div
                        key={response.questionId}
                        className="card"
                        style={{ padding: '1.25rem', marginBottom: '1rem' }}
                    >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                            <div style={{ flex: 1 }}>
                                <span style={{
                                    fontSize: '0.7rem',
                                    color: 'white',
                                    background: getRatingColor(response.score),
                                    padding: '0.2rem 0.5rem',
                                    borderRadius: '4px',
                                    marginBottom: '0.5rem',
                                    display: 'inline-block'
                                }}>
                                    {getRatingLabel(response.score)}
                                </span>
                                <h4 style={{ margin: '0.5rem 0 0.25rem' }}>Q{idx + 1}: {response.question}</h4>
                            </div>
                            <div style={{
                                fontSize: '1.5rem',
                                fontWeight: 700,
                                color: getRatingColor(response.score),
                                marginLeft: '1rem'
                            }}>
                                {response.score}/4
                            </div>
                        </div>

                        <p style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)', marginBottom: '0.75rem' }}>
                            {response.aiEvaluation}
                        </p>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                            {response.strengths.length > 0 && (
                                <div style={{ background: '#f0fdf4', padding: '0.75rem', borderRadius: '6px' }}>
                                    <div style={{ fontSize: '0.75rem', fontWeight: 600, color: '#166534', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                                        <CheckCircle size={12} /> Strengths
                                    </div>
                                    <ul style={{ margin: 0, paddingLeft: '1rem', fontSize: '0.8rem', color: '#15803d' }}>
                                        {response.strengths.map((s, i) => <li key={i}>{s}</li>)}
                                    </ul>
                                </div>
                            )}

                            {response.improvements.length > 0 && (
                                <div style={{ background: '#fffbeb', padding: '0.75rem', borderRadius: '6px' }}>
                                    <div style={{ fontSize: '0.75rem', fontWeight: 600, color: '#92400e', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                                        <Lightbulb size={12} /> Areas to Improve
                                    </div>
                                    <ul style={{ margin: 0, paddingLeft: '1rem', fontSize: '0.8rem', color: '#b45309' }}>
                                        {response.improvements.map((i, idx) => <li key={idx}>{i}</li>)}
                                    </ul>
                                </div>
                            )}
                        </div>
                    </div>
                ))}

                {/* Actions */}
                <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', marginTop: '2rem', flexWrap: 'wrap' }}>
                    <button className="btn btn-secondary" onClick={resetInspection}>
                        <RotateCcw size={16} style={{ marginRight: '0.5rem' }} />
                        Start New Inspection
                    </button>

                    {!actionsCreated ? (
                        <button
                            className="btn btn-primary"
                            onClick={handleCreateActions}
                            disabled={creatingActions || (session?.responses.filter(r => r.score < 3).length || 0) === 0}
                            style={{ background: 'var(--color-accent)', borderColor: 'var(--color-accent)' }}
                        >
                            {creatingActions ? <Loader2 size={16} className="animate-spin" /> : <CheckSquare size={16} />}
                            <span style={{ marginLeft: '0.5rem' }}>
                                {creatingActions ? 'Generating Actions...' : 'Create Actions from Findings'}
                            </span>
                        </button>
                    ) : (
                        <button
                            className="btn btn-secondary"
                            onClick={() => navigate('/actions')}
                            style={{ color: 'var(--color-accent)', borderColor: 'var(--color-accent)' }}
                        >
                            <ListChecks size={16} />
                            <span style={{ marginLeft: '0.5rem' }}>View Tracked Actions</span>
                        </button>
                    )}

                    <button className="btn btn-primary" disabled={saving}>
                        {saving ? <Loader2 size={16} className="animate-spin" /> : <Download size={16} />}
                        <span style={{ marginLeft: '0.5rem' }}>
                            {saving ? 'Saving...' : 'Download Report'}
                        </span>
                    </button>
                </div>
            </div>
        );
    };

    return (
        <div className="container" style={{ padding: '2rem 1rem', maxWidth: '1000px' }}>
            {!session && renderScenarioSelection()}
            {session && session.status === 'in_progress' && renderInspectionChat()}
            {(session?.status === 'evaluating' || showResults) && renderResults()}
        </div>
    );
};

export const MockInspection = () => (
    <ProductionErrorBoundary>
        <MockInspectionContent />
    </ProductionErrorBoundary>
);

export default MockInspection;
