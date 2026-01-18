import { useState, useEffect, useCallback, useRef } from 'react';
import { AnimatePresence } from 'framer-motion';
import { TopBar } from '../layout/TopBar';
import { Timer, ProgressBar, Button } from '../common';
import { QuizSetup } from './QuizSetup';
import { QuestionCard } from './QuestionCard';
import { QuizResults } from './QuizResults';
import { useApp } from '../../contexts/AppContext';
import { useQuiz } from '../../hooks/useQuiz';
import { useTimer } from '../../hooks/useTimer';
import { useAudio } from '../../hooks/useAudio';
import type { QuizConfig } from '../../types';

export function QuizMode() {
  const { setMode, vocabulary, dispatch, state: appState } = useApp();
  const { playSuccess, playError, playClick, playWarning } = useAudio();

  const [config, setConfig] = useState<QuizConfig>({
    totalQuestions: 10,
    timePerQuestion: 30,
    autoAdvance: false,
  });

  const {
    state,
    currentQuestion,
    startQuiz,
    submitAnswer,
    nextQuestion,
    resetQuiz,
    isLastQuestion,
  } = useQuiz(vocabulary, config);

  const answerTimeRef = useRef(Date.now());
  const autoAdvanceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Timer for current question (only used when time limit is set)
  const timer = useTimer({
    initialTime: config.timePerQuestion ?? 30,  // Default for hook, but won't be used if no limit
    onComplete: () => {
      if (config.timePerQuestion !== null && state.status === 'active' && currentQuestion) {
        // Time's up - mark as incorrect
        submitAnswer('', config.timePerQuestion * 1000);
        playError();
      }
    },
    autoStart: false,
  });

  // Start timer when question becomes active (only if time limit is set)
  useEffect(() => {
    if (state.status === 'active') {
      answerTimeRef.current = Date.now();
      if (config.timePerQuestion !== null) {
        timer.restart(config.timePerQuestion);
      }
    } else {
      timer.pause();
    }
  }, [state.status, state.currentIndex, config.timePerQuestion]);

  // Handle answer submission
  const handleAnswer = useCallback((answer: string) => {
    if (state.status !== 'active') return;

    timer.pause();
    const timeSpent = Date.now() - answerTimeRef.current;
    const isCorrect = submitAnswer(answer, timeSpent);

    if (isCorrect) {
      playSuccess();
    } else {
      playError();
    }

    // Auto-advance if enabled
    if (config.autoAdvance) {
      autoAdvanceTimerRef.current = setTimeout(() => {
        handleNext();
      }, 2000);
    }
  }, [state.status, submitAnswer, config.autoAdvance, playSuccess, playError, timer]);

  // Handle next question
  const handleNext = useCallback(() => {
    if (autoAdvanceTimerRef.current) {
      clearTimeout(autoAdvanceTimerRef.current);
      autoAdvanceTimerRef.current = null;
    }
    playClick();
    nextQuestion();
  }, [nextQuestion, playClick]);

  // Handle quiz start
  const handleStart = (newConfig: QuizConfig) => {
    setConfig(newConfig);
    playClick();
    // Pass config directly to avoid stale closure issue
    startQuiz(newConfig);
  };

  // Handle restart
  const handleRestart = () => {
    playClick();
    resetQuiz();
  };

  // Handle back to home
  const handleHome = () => {
    playClick();
    // Update stats
    if (state.status === 'complete') {
      dispatch({
        type: 'UPDATE_STATS',
        payload: {
          quizzesTaken: appState.stats.quizzesTaken + 1,
        },
      });
    }
    setMode('dashboard');
  };

  // Cleanup auto-advance timer
  useEffect(() => {
    return () => {
      if (autoAdvanceTimerRef.current) {
        clearTimeout(autoAdvanceTimerRef.current);
      }
    };
  }, []);

  // Get selected answer for current question
  const currentAnswer = state.answers.find(
    a => a.questionId === currentQuestion?.id
  );

  return (
    <div className="min-h-screen bg-gradient-to-b from-quiz-light/30 to-gray-50">
      {/* Top bar - only show during quiz */}
      {state.status !== 'setup' && state.status !== 'complete' && (
        <TopBar
          onBack={handleHome}
          title={`Question ${state.currentIndex + 1}/${state.totalQuestions}`}
          rightContent={
            config.timePerQuestion !== null ? (
              <Timer
                timeRemaining={timer.timeRemaining}
                totalTime={config.timePerQuestion}
                variant="both"
                onWarning={playWarning}
              />
            ) : (
              <span className="text-sm text-gray-500 font-medium">No time limit</span>
            )
          }
        />
      )}

      <main className="max-w-lg mx-auto px-4 py-6">
        {/* Setup screen */}
        {state.status === 'setup' && (
          <QuizSetup
            onStart={handleStart}
            maxQuestions={vocabulary.length}
          />
        )}

        {/* Active quiz */}
        {(state.status === 'active' || state.status === 'review') && currentQuestion && (
          <>
            {/* Progress bar */}
            <div className="mb-6">
              <ProgressBar
                current={state.currentIndex + 1}
                total={state.totalQuestions}
                color="bg-quiz"
              />
            </div>

            {/* Question */}
            <AnimatePresence mode="wait">
              <QuestionCard
                key={currentQuestion.id}
                question={currentQuestion}
                onAnswer={handleAnswer}
                showResult={state.status === 'review'}
                selectedAnswer={currentAnswer?.selectedAnswer || null}
                disabled={state.status === 'review'}
              />
            </AnimatePresence>

            {/* Next button */}
            {state.status === 'review' && (
              <div className="mt-6">
                <Button
                  variant="quiz"
                  fullWidth
                  onClick={handleNext}
                >
                  {isLastQuestion ? 'See Results' : 'Next Question'}
                </Button>
              </div>
            )}
          </>
        )}

        {/* Results screen */}
        {state.status === 'complete' && (
          <QuizResults
            state={state}
            onRestart={handleRestart}
            onHome={handleHome}
          />
        )}
      </main>
    </div>
  );
}
