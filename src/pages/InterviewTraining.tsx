import React, { useState, useEffect } from 'react';
import {
    GraduationCap, Play, ChevronRight, CheckCircle, XCircle,
    Lightbulb, Target, Clock, Star, Award, TrendingUp,
    Shield, Heart, Zap, Users, Brain, RefreshCw, BookOpen
} from 'lucide-react';
import {
    INSPECTION_QUESTIONS, KEY_QUESTIONS,
    type InspectionQuestion
} from '../data/cqcInspectionData';
import { useAuth } from '../context/AuthContext';

interface TrainingCard {
    id: string;
    question: InspectionQuestion;
    userAnswer: string;
    isRevealed: boolean;
    selfScore: number | null;
}

const keyQuestionIcons: Record<string, React.ReactNode> = {
    safe: <Shield size={18} />,
    effective: <Target size={18} />,
    caring: <Heart size={18} />,
    responsive: <Zap size={18} />,
    wellLed: <Users size={18} />
};

export const InterviewTraining: React.FC = () => {
    const { profile } = useAuth();

    // State
    const [selectedRole, setSelectedRole] = useState<string>('all');
    const [selectedKeyQuestion, setSelectedKeyQuestion] = useState<string>('all');
    const [trainingCards, setTrainingCards] = useState<TrainingCard[]>([]);
    const [currentCardIndex, setCurrentCardIndex] = useState(0);
    const [viewMode, setViewMode] = useState<'browse' | 'flashcard' | 'quiz'>('browse');
    const [showAnswer, setShowAnswer] = useState(false);
    const [quizScore, setQuizScore] = useState(0);
    const [quizTotal, setQuizTotal] = useState(0);

    // Filter questions based on selections
    const getFilteredQuestions = () => {
        return INSPECTION_QUESTIONS.filter(q => {
            const roleMatch = selectedRole === 'all' || q.targetRole === selectedRole || q.targetRole === 'all';
            const kqMatch = selectedKeyQuestion === 'all' || q.keyQuestion === selectedKeyQuestion;
            return roleMatch && kqMatch;
        });
    };

    // Initialize training cards
    useEffect(() => {
        const questions = getFilteredQuestions();
        setTrainingCards(questions.map(q => ({
            id: q.id,
            question: q,
            userAnswer: '',
            isRevealed: false,
            selfScore: null
        })));
        setCurrentCardIndex(0);
        setShowAnswer(false);
    }, [selectedRole, selectedKeyQuestion]);

    const currentCard = trainingCards[currentCardIndex];

    const handleRevealAnswer = () => {
        setShowAnswer(true);
        setTrainingCards(prev => prev.map((card, idx) =>
            idx === currentCardIndex ? { ...card, isRevealed: true } : card
        ));
    };

    const handleSelfScore = (score: number) => {
        setTrainingCards(prev => prev.map((card, idx) =>
            idx === currentCardIndex ? { ...card, selfScore: score } : card
        ));

        if (viewMode === 'quiz') {
            if (score >= 3) {
                setQuizScore(prev => prev + 1);
            }
            setQuizTotal(prev => prev + 1);
        }

        // Move to next card after a brief delay
        setTimeout(() => {
            if (currentCardIndex < trainingCards.length - 1) {
                setCurrentCardIndex(prev => prev + 1);
                setShowAnswer(false);
            }
        }, 500);
    };

    const handleNextCard = () => {
        if (currentCardIndex < trainingCards.length - 1) {
            setCurrentCardIndex(prev => prev + 1);
            setShowAnswer(false);
        }
    };

    const handlePrevCard = () => {
        if (currentCardIndex > 0) {
            setCurrentCardIndex(prev => prev - 1);
            setShowAnswer(false);
        }
    };

    const shuffleCards = () => {
        const shuffled = [...trainingCards].sort(() => Math.random() - 0.5);
        setTrainingCards(shuffled);
        setCurrentCardIndex(0);
        setShowAnswer(false);
        setQuizScore(0);
        setQuizTotal(0);
    };

    const resetProgress = () => {
        setTrainingCards(prev => prev.map(card => ({
            ...card,
            isRevealed: false,
            selfScore: null,
            userAnswer: ''
        })));
        setCurrentCardIndex(0);
        setShowAnswer(false);
        setQuizScore(0);
        setQuizTotal(0);
    };

    // Render question browser
    const renderBrowseMode = () => (
        <div className="animate-enter">
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '1rem' }}>
                {trainingCards.map((card, idx) => (
                    <div
                        key={card.id}
                        className="card"
                        style={{
                            padding: '1.25rem',
                            cursor: 'pointer',
                            border: '1px solid var(--color-border)',
                            transition: 'all 0.2s ease'
                        }}
                        onClick={() => {
                            setCurrentCardIndex(idx);
                            setViewMode('flashcard');
                        }}
                    >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                            <div style={{
                                width: 32,
                                height: 32,
                                borderRadius: '50%',
                                background: KEY_QUESTIONS[card.question.keyQuestion].color + '20',
                                color: KEY_QUESTIONS[card.question.keyQuestion].color,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center'
                            }}>
                                {keyQuestionIcons[card.question.keyQuestion]}
                            </div>

                            <span style={{
                                fontSize: '0.7rem',
                                padding: '0.2rem 0.5rem',
                                borderRadius: '4px',
                                background: card.question.targetRole === 'manager' ? '#8b5cf620' :
                                    card.question.targetRole === 'care_worker' ? '#3b82f620' :
                                        card.question.targetRole === 'senior_carer' ? '#f59e0b20' : '#6b728020',
                                color: card.question.targetRole === 'manager' ? '#8b5cf6' :
                                    card.question.targetRole === 'care_worker' ? '#3b82f6' :
                                        card.question.targetRole === 'senior_carer' ? '#f59e0b' : '#6b7280',
                                fontWeight: 500
                            }}>
                                {card.question.targetRole.replace('_', ' ').toUpperCase()}
                            </span>
                        </div>

                        <h4 style={{ fontSize: '0.95rem', margin: '0 0 0.5rem', lineHeight: 1.4 }}>
                            {card.question.question}
                        </h4>

                        <div style={{ fontSize: '0.75rem', color: 'var(--color-text-tertiary)' }}>
                            {card.question.relatedRegulations.join(', ')}
                        </div>

                        {card.selfScore !== null && (
                            <div style={{
                                marginTop: '0.75rem',
                                paddingTop: '0.75rem',
                                borderTop: '1px solid var(--color-border)',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.5rem'
                            }}>
                                {card.selfScore >= 3 ? (
                                    <CheckCircle size={14} color="#22c55e" />
                                ) : (
                                    <RefreshCw size={14} color="#f59e0b" />
                                )}
                                <span style={{ fontSize: '0.8rem', color: card.selfScore >= 3 ? '#22c55e' : '#f59e0b' }}>
                                    {card.selfScore >= 3 ? 'Confident' : 'Needs Practice'}
                                </span>
                            </div>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );

    // Render flashcard mode
    const renderFlashcardMode = () => {
        if (!currentCard) return null;

        return (
            <div className="animate-enter" style={{ maxWidth: '700px', margin: '0 auto' }}>
                {/* Progress */}
                <div style={{ marginBottom: '1.5rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', fontSize: '0.85rem' }}>
                        <span>Question {currentCardIndex + 1} of {trainingCards.length}</span>
                        <span style={{ color: 'var(--color-text-secondary)' }}>
                            {trainingCards.filter(c => c.selfScore !== null).length} practiced
                        </span>
                    </div>
                    <div style={{ height: 4, background: 'var(--color-border)', borderRadius: 2, overflow: 'hidden' }}>
                        <div style={{
                            height: '100%',
                            width: `${((currentCardIndex + 1) / trainingCards.length) * 100}%`,
                            background: 'var(--color-primary)',
                            transition: 'width 0.3s ease'
                        }} />
                    </div>
                </div>

                {/* Card */}
                <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
                    {/* Question Side */}
                    <div style={{ padding: '2rem', background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)' }}>
                        <div style={{
                            display: 'flex',
                            gap: '0.5rem',
                            marginBottom: '1rem',
                            flexWrap: 'wrap'
                        }}>
                            <span style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '0.25rem',
                                padding: '0.25rem 0.75rem',
                                borderRadius: '20px',
                                background: KEY_QUESTIONS[currentCard.question.keyQuestion].color,
                                color: 'white',
                                fontSize: '0.75rem',
                                fontWeight: 500
                            }}>
                                {KEY_QUESTIONS[currentCard.question.keyQuestion].icon}
                                {KEY_QUESTIONS[currentCard.question.keyQuestion].title}
                            </span>
                            <span style={{
                                padding: '0.25rem 0.75rem',
                                borderRadius: '20px',
                                background: '#e2e8f0',
                                fontSize: '0.75rem',
                                fontWeight: 500
                            }}>
                                {currentCard.question.targetRole.replace('_', ' ')}
                            </span>
                        </div>

                        <h2 style={{ fontSize: '1.25rem', lineHeight: 1.5, margin: 0, fontWeight: 500 }}>
                            {currentCard.question.question}
                        </h2>

                        {currentCard.question.followUps.length > 0 && (
                            <div style={{ marginTop: '1rem', padding: '0.75rem', background: 'white', borderRadius: '8px' }}>
                                <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-text-secondary)', marginBottom: '0.5rem' }}>
                                    Potential Follow-up Questions:
                                </div>
                                <ul style={{ margin: 0, paddingLeft: '1.25rem', fontSize: '0.85rem', color: 'var(--color-text-secondary)' }}>
                                    {currentCard.question.followUps.slice(0, 2).map((f, i) => (
                                        <li key={i} style={{ marginBottom: '0.25rem' }}>{f}</li>
                                    ))}
                                </ul>
                            </div>
                        )}
                    </div>

                    {/* Answer Section */}
                    {!showAnswer ? (
                        <div style={{ padding: '1.5rem', textAlign: 'center' }}>
                            <p style={{ color: 'var(--color-text-secondary)', marginBottom: '1rem' }}>
                                Take a moment to think about your answer, then reveal the guidance.
                            </p>
                            <button className="btn btn-primary" onClick={handleRevealAnswer} style={{ minWidth: 200 }}>
                                <Lightbulb size={18} style={{ marginRight: '0.5rem' }} />
                                Show Answer Guidance
                            </button>
                        </div>
                    ) : (
                        <div style={{ padding: '1.5rem' }}>
                            {/* Good Response Indicators */}
                            <div style={{ marginBottom: '1.5rem' }}>
                                <h4 style={{
                                    fontSize: '0.85rem',
                                    fontWeight: 600,
                                    color: '#16a34a',
                                    margin: '0 0 0.75rem',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '0.5rem'
                                }}>
                                    <CheckCircle size={16} />
                                    What a Good Answer Includes:
                                </h4>
                                <ul style={{ margin: 0, paddingLeft: '1.5rem' }}>
                                    {currentCard.question.goodResponseIndicators.map((g, i) => (
                                        <li key={i} style={{
                                            marginBottom: '0.5rem',
                                            fontSize: '0.9rem',
                                            color: 'var(--color-text-main)'
                                        }}>
                                            {g}
                                        </li>
                                    ))}
                                </ul>
                            </div>

                            {/* Red Flags */}
                            <div style={{ marginBottom: '1.5rem' }}>
                                <h4 style={{
                                    fontSize: '0.85rem',
                                    fontWeight: 600,
                                    color: '#dc2626',
                                    margin: '0 0 0.75rem',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '0.5rem'
                                }}>
                                    <XCircle size={16} />
                                    Red Flags to Avoid:
                                </h4>
                                <ul style={{ margin: 0, paddingLeft: '1.5rem' }}>
                                    {currentCard.question.redFlags.map((r, i) => (
                                        <li key={i} style={{
                                            marginBottom: '0.5rem',
                                            fontSize: '0.9rem',
                                            color: '#b91c1c'
                                        }}>
                                            {r}
                                        </li>
                                    ))}
                                </ul>
                            </div>

                            {/* Regulations */}
                            <div style={{
                                padding: '0.75rem',
                                background: '#f8fafc',
                                borderRadius: '8px',
                                marginBottom: '1.5rem'
                            }}>
                                <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-text-secondary)' }}>
                                    Related Regulations: {currentCard.question.relatedRegulations.join(', ')}
                                </div>
                            </div>

                            {/* Self Assessment */}
                            <div>
                                <h4 style={{ fontSize: '0.85rem', fontWeight: 600, margin: '0 0 0.75rem' }}>
                                    How well could you answer this?
                                </h4>
                                <div style={{ display: 'flex', gap: '0.5rem' }}>
                                    {[
                                        { score: 1, label: 'Struggled', color: '#ef4444' },
                                        { score: 2, label: 'Partial', color: '#f59e0b' },
                                        { score: 3, label: 'Good', color: '#22c55e' },
                                        { score: 4, label: 'Excellent', color: '#3b82f6' }
                                    ].map(option => (
                                        <button
                                            key={option.score}
                                            className="btn"
                                            onClick={() => handleSelfScore(option.score)}
                                            style={{
                                                flex: 1,
                                                background: currentCard.selfScore === option.score ? option.color : 'white',
                                                color: currentCard.selfScore === option.score ? 'white' : option.color,
                                                border: `1px solid ${option.color}`,
                                                padding: '0.75rem 0.5rem'
                                            }}
                                        >
                                            {option.label}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Navigation */}
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '1.5rem' }}>
                    <button
                        className="btn btn-secondary"
                        onClick={handlePrevCard}
                        disabled={currentCardIndex === 0}
                    >
                        ← Previous
                    </button>

                    <button
                        className="btn btn-secondary"
                        onClick={() => setViewMode('browse')}
                    >
                        <BookOpen size={16} style={{ marginRight: '0.5rem' }} />
                        Back to All
                    </button>

                    <button
                        className="btn btn-primary"
                        onClick={handleNextCard}
                        disabled={currentCardIndex === trainingCards.length - 1}
                    >
                        Next →
                    </button>
                </div>
            </div>
        );
    };

    // Render quiz results
    const renderQuizResults = () => (
        <div className="animate-enter" style={{ maxWidth: '600px', margin: '0 auto', textAlign: 'center' }}>
            <div style={{
                width: 100,
                height: 100,
                margin: '0 auto 1.5rem',
                borderRadius: '50%',
                background: quizScore / quizTotal >= 0.7 ? '#dcfce7' : quizScore / quizTotal >= 0.5 ? '#fef3c7' : '#fee2e2',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
            }}>
                <Award size={50} color={quizScore / quizTotal >= 0.7 ? '#22c55e' : quizScore / quizTotal >= 0.5 ? '#f59e0b' : '#ef4444'} />
            </div>

            <h2 style={{ marginBottom: '0.5rem' }}>Training Session Complete!</h2>
            <p style={{ color: 'var(--color-text-secondary)', marginBottom: '2rem' }}>
                You scored {quizScore} out of {quizTotal} questions
            </p>

            <div style={{
                padding: '1.5rem',
                background: quizScore / quizTotal >= 0.7 ? '#f0fdf4' : quizScore / quizTotal >= 0.5 ? '#fffbeb' : '#fef2f2',
                borderRadius: '12px',
                marginBottom: '2rem'
            }}>
                <div style={{
                    fontSize: '3rem',
                    fontWeight: 700,
                    color: quizScore / quizTotal >= 0.7 ? '#22c55e' : quizScore / quizTotal >= 0.5 ? '#f59e0b' : '#ef4444'
                }}>
                    {Math.round((quizScore / quizTotal) * 100)}%
                </div>
                <div style={{
                    fontWeight: 600,
                    color: quizScore / quizTotal >= 0.7 ? '#166534' : quizScore / quizTotal >= 0.5 ? '#92400e' : '#991b1b'
                }}>
                    {quizScore / quizTotal >= 0.7 ? 'Great job! You\'re well prepared.' :
                        quizScore / quizTotal >= 0.5 ? 'Good progress! Keep practicing.' :
                            'Keep learning - you\'ll get there!'}
                </div>
            </div>

            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
                <button className="btn btn-secondary" onClick={resetProgress}>
                    <RefreshCw size={16} style={{ marginRight: '0.5rem' }} />
                    Practice Again
                </button>
                <button className="btn btn-primary" onClick={() => setViewMode('browse')}>
                    Review Questions
                </button>
            </div>
        </div>
    );

    // Check if quiz is complete
    const isQuizComplete = viewMode === 'quiz' && quizTotal > 0 && currentCardIndex === trainingCards.length - 1 && currentCard?.selfScore !== null;

    return (
        <div className="container animate-enter" style={{ padding: '2rem 1rem', maxWidth: viewMode === 'browse' ? '1200px' : '800px' }}>
            {/* Header */}
            <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
                <h1 style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.75rem', fontSize: '2rem' }}>
                    <GraduationCap size={32} />
                    CQC Interview Training
                </h1>
                <p style={{ color: 'var(--color-text-secondary)', marginTop: '0.5rem', maxWidth: '600px', margin: '0.5rem auto 0' }}>
                    Practice answering CQC inspection questions. Learn what makes a good answer and avoid common pitfalls.
                </p>
            </div>

            {/* Filters & Controls */}
            <div className="card" style={{ padding: '1rem', marginBottom: '1.5rem' }}>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                        {/* Role Filter */}
                        <div>
                            <label style={{ fontSize: '0.75rem', fontWeight: 600, display: 'block', marginBottom: '0.25rem' }}>
                                Role
                            </label>
                            <select
                                className="form-input"
                                value={selectedRole}
                                onChange={e => setSelectedRole(e.target.value)}
                                style={{ minWidth: 150 }}
                            >
                                <option value="all">All Roles</option>
                                <option value="manager">Registered Manager</option>
                                <option value="senior_carer">Senior Carer</option>
                                <option value="care_worker">Care Worker</option>
                            </select>
                        </div>

                        {/* Key Question Filter */}
                        <div>
                            <label style={{ fontSize: '0.75rem', fontWeight: 600, display: 'block', marginBottom: '0.25rem' }}>
                                Key Question
                            </label>
                            <select
                                className="form-input"
                                value={selectedKeyQuestion}
                                onChange={e => setSelectedKeyQuestion(e.target.value)}
                                style={{ minWidth: 150 }}
                            >
                                <option value="all">All Questions</option>
                                <option value="safe">🛡️ Safe</option>
                                <option value="effective">🎯 Effective</option>
                                <option value="caring">💝 Caring</option>
                                <option value="responsive">⚡ Responsive</option>
                                <option value="wellLed">👔 Well-Led</option>
                            </select>
                        </div>
                    </div>

                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <button
                            className={`btn ${viewMode === 'browse' ? 'btn-primary' : 'btn-secondary'}`}
                            onClick={() => setViewMode('browse')}
                        >
                            <BookOpen size={16} />
                        </button>
                        <button
                            className={`btn ${viewMode === 'flashcard' ? 'btn-primary' : 'btn-secondary'}`}
                            onClick={() => { setViewMode('flashcard'); setCurrentCardIndex(0); }}
                        >
                            Flashcards
                        </button>
                        <button
                            className={`btn ${viewMode === 'quiz' ? 'btn-primary' : 'btn-secondary'}`}
                            onClick={() => { setViewMode('quiz'); shuffleCards(); }}
                        >
                            Quiz Me
                        </button>
                        <button
                            className="btn btn-secondary"
                            onClick={shuffleCards}
                            title="Shuffle"
                        >
                            <RefreshCw size={16} />
                        </button>
                    </div>
                </div>

                <div style={{ marginTop: '0.75rem', fontSize: '0.85rem', color: 'var(--color-text-secondary)' }}>
                    {trainingCards.length} questions available
                    {trainingCards.filter(c => c.selfScore !== null).length > 0 && (
                        <span> • {trainingCards.filter(c => c.selfScore !== null).length} practiced</span>
                    )}
                </div>
            </div>

            {/* Quiz Progress Banner */}
            {viewMode === 'quiz' && quizTotal > 0 && !isQuizComplete && (
                <div style={{
                    background: 'linear-gradient(90deg, var(--color-primary) 0%, #8b5cf6 100%)',
                    color: 'white',
                    padding: '0.75rem 1rem',
                    borderRadius: '8px',
                    marginBottom: '1.5rem',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                }}>
                    <span>Quiz Mode: Answer each question honestly to track your readiness</span>
                    <span style={{ fontWeight: 600 }}>
                        Score: {quizScore}/{quizTotal}
                    </span>
                </div>
            )}

            {/* Main Content */}
            {viewMode === 'browse' && renderBrowseMode()}
            {(viewMode === 'flashcard' || (viewMode === 'quiz' && !isQuizComplete)) && renderFlashcardMode()}
            {isQuizComplete && renderQuizResults()}

            {/* Empty State */}
            {trainingCards.length === 0 && (
                <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--color-text-secondary)' }}>
                    <Brain size={48} style={{ opacity: 0.5, marginBottom: '1rem' }} />
                    <h3>No questions match your filters</h3>
                    <p>Try adjusting the role or key question filter</p>
                </div>
            )}
        </div>
    );
};

export default InterviewTraining;
