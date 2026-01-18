import { useState, useEffect, useCallback, useRef } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Flame, Trophy } from 'lucide-react';
import { TopBar } from '../layout/TopBar';
import { Timer, ProgressBar, Button } from '../common';
import { UserMenu } from '../common/UserMenu';
import { QuestionCard } from '../quiz/QuestionCard';
import { TypeQuestion } from './TypeQuestion';
import { ChallengeResults } from './ChallengeResults';
import { StreakMilestone } from './StreakMilestone';
import { useApp } from '../../contexts/AppContext';
import { useTimer } from '../../hooks/useTimer';
import { useAudio } from '../../hooks/useAudio';
import type { DailyChallengeState, AnswerRecord } from '../../types';
import { generateDailyChallengeQuestions } from '../../services/QuizGenerator';
import { StorageService } from '../../services/StorageService';
import { calculatePoints, isAnswerCorrect, getTodayString } from '../../utils';

const CHALLENGE_QUESTIONS = 20;
const TIME_PER_QUESTION = 25;

export function DailyChallenge() {
  const { setMode, vocabulary, dispatch, state: appState } = useApp();
  const { playSuccess, playError, playClick, playWarning, playComplete } = useAudio();

  const [state, setState] = useState<DailyChallengeState>({
    questions: [],
    currentIndex: 0,
    score: 0,
    timePerQuestion: TIME_PER_QUESTION,
    totalQuestions: CHALLENGE_QUESTIONS,
    answers: [],
    status: 'intro',
    pointsEarned: 0,
    streak: 0,
    todayCompleted: StorageService.hasTodayChallenge(),
  });

  const answerTimeRef = useRef(Date.now());
  const [milestoneStreak, setMilestoneStreak] = useState<number | null>(null);

  const STREAK_MILESTONES = [5, 10, 15, 20];

  // Timer
  const timer = useTimer({
    initialTime: TIME_PER_QUESTION,
    onComplete: () => {
      if (state.status === 'active') {
        handleTimeUp();
      }
    },
    autoStart: false,
  });

  // Current question
  const currentQuestion = state.questions[state.currentIndex] || null;

  // Current answer record
  const currentAnswer = state.answers.find(
    a => a.questionId === currentQuestion?.id
  );

  // Initialize challenge
  const startChallenge = useCallback(() => {
    const questions = generateDailyChallengeQuestions(vocabulary, CHALLENGE_QUESTIONS);
    setState(prev => ({
      ...prev,
      questions,
      currentIndex: 0,
      score: 0,
      answers: [],
      status: 'active',
      pointsEarned: 0,
      streak: 0,
    }));
    playClick();
  }, [vocabulary, playClick]);

  // Start timer when question becomes active
  useEffect(() => {
    if (state.status === 'active') {
      timer.restart(TIME_PER_QUESTION);
      answerTimeRef.current = Date.now();
    } else {
      timer.pause();
    }
  }, [state.status, state.currentIndex]);

  // Handle time up
  const handleTimeUp = useCallback(() => {
    if (!currentQuestion) return;

    const record: AnswerRecord = {
      questionId: currentQuestion.id,
      selectedAnswer: null,
      isCorrect: false,
      timeSpent: TIME_PER_QUESTION * 1000,
    };

    setState(prev => ({
      ...prev,
      answers: [...prev.answers, record],
      streak: 0,
      status: 'review',
    }));

    playError();
  }, [currentQuestion, playError]);

  // Handle answer submission
  const handleAnswer = useCallback((answer: string) => {
    if (state.status !== 'active' || !currentQuestion) return;

    timer.pause();
    const timeSpent = Date.now() - answerTimeRef.current;
    const timeRemaining = timer.timeRemaining;

    const isCorrect = isAnswerCorrect(answer, currentQuestion.correctAnswer);
    const newStreak = isCorrect ? state.streak + 1 : 0;

    const points = calculatePoints({
      isCorrect,
      timeRemaining,
      totalTime: TIME_PER_QUESTION,
      streak: state.streak,
    });

    const record: AnswerRecord = {
      questionId: currentQuestion.id,
      selectedAnswer: answer,
      isCorrect,
      timeSpent,
    };

    setState(prev => ({
      ...prev,
      answers: [...prev.answers, record],
      score: isCorrect ? prev.score + 1 : prev.score,
      pointsEarned: prev.pointsEarned + points,
      streak: newStreak,
      status: 'review',
    }));

    if (isCorrect) {
      playSuccess();
      // Check for streak milestone
      if (STREAK_MILESTONES.includes(newStreak)) {
        setMilestoneStreak(newStreak);
      }
    } else {
      playError();
    }
  }, [state.status, state.streak, currentQuestion, timer, playSuccess, playError, STREAK_MILESTONES]);

  // Handle next question
  const handleNext = useCallback(() => {
    playClick();
    setState(prev => {
      if (prev.currentIndex >= prev.totalQuestions - 1) {
        // Challenge complete
        playComplete();

        // Save completion date
        StorageService.setDailyChallengeDate(getTodayString());

        // Update stats
        dispatch({
          type: 'UPDATE_STATS',
          payload: {
            challengesCompleted: appState.stats.challengesCompleted + 1,
            bestChallengeScore: Math.max(
              appState.stats.bestChallengeScore,
              prev.pointsEarned
            ),
          },
        });

        // Save to backend
        import('../../services/ApiService').then(({ default: api }) => {
          const totalTimeSpent = prev.answers.reduce((acc, curr) => acc + curr.timeSpent, 0);

          api.saveQuizResult({
            quizType: 'challenge',
            totalQuestions: prev.totalQuestions,
            correctAnswers: prev.score,
            score: prev.pointsEarned,
            timePerQuestion: prev.timePerQuestion,
            totalTimeSpent,
            pointsEarned: prev.pointsEarned,
            answers: prev.answers.map(a => {
              const q = prev.questions.find(q => q.id === a.questionId)!;
              return {
                questionIndex: prev.questions.indexOf(q),
                word: q.word.targetWord,
                promptType: 'mixed',
                questionFormat: q.format || 'multiple-choice',
                correctAnswer: q.correctAnswer,
                selectedAnswer: a.selectedAnswer,
                isCorrect: a.isCorrect,
                timeSpent: a.timeSpent
              };
            })
          }).catch(err => console.error('Failed to save challenge results:', err));
        });

        return { ...prev, status: 'complete', todayCompleted: true };
      }
      return {
        ...prev,
        currentIndex: prev.currentIndex + 1,
        status: 'active',
      };
    });
  }, [playClick, playComplete, dispatch, appState.stats]);

  // Handle back to home
  const handleHome = () => {
    playClick();
    setMode('dashboard');
  };

  // Intro screen
  if (state.status === 'intro') {
    return (
      <div className="min-h-screen bg-gradient-to-b from-challenge-light/30 to-gray-50">
        <TopBar onBack={handleHome} title="Daily Challenge" />

        <main className="max-w-md mx-auto px-4 py-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-2xl shadow-mode-card p-8 text-center"
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: 'spring' }}
              className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-red-400 to-red-600 mb-6"
            >
              <Trophy className="w-10 h-10 text-white" />
            </motion.div>

            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Daily Challenge
            </h2>
            <p className="text-gray-500 mb-6">
              Test your vocabulary skills with 20 timed questions!
            </p>

            <div className="grid grid-cols-2 gap-4 mb-8">
              <div className="p-4 bg-gray-50 rounded-xl">
                <p className="text-2xl font-bold text-gray-900">20</p>
                <p className="text-xs text-gray-500">Questions</p>
              </div>
              <div className="p-4 bg-gray-50 rounded-xl">
                <p className="text-2xl font-bold text-gray-900">25s</p>
                <p className="text-xs text-gray-500">Per Question</p>
              </div>
            </div>

            {state.todayCompleted ? (
              <div className="p-4 bg-green-50 rounded-xl border border-green-200 mb-4">
                <p className="text-green-700 font-medium">
                  You've completed today's challenge!
                </p>
                <p className="text-sm text-green-600 mt-1">
                  Come back tomorrow for a new challenge.
                </p>
              </div>
            ) : (
              <Button variant="challenge" size="xl" fullWidth onClick={startChallenge}>
                <span className="flex items-center justify-center gap-2">
                  <Flame className="w-5 h-5" />
                  Start Challenge
                </span>
              </Button>
            )}

            {state.todayCompleted && (
              <Button variant="ghost" fullWidth onClick={handleHome} className="mt-3">
                Back to Home
              </Button>
            )}
          </motion.div>
        </main>
      </div>
    );
  }

  // Results screen
  if (state.status === 'complete') {
    return (
      <div className="min-h-screen bg-gradient-to-b from-challenge-light/30 to-gray-50 py-8">
        <main className="max-w-lg mx-auto px-4">
          <ChallengeResults state={state} onHome={handleHome} />
        </main>
      </div>
    );
  }

  // Active challenge
  return (
    <div className="min-h-screen bg-gradient-to-b from-challenge-light/30 to-gray-50">
      {/* Streak milestone celebration */}
      <StreakMilestone
        streak={milestoneStreak ?? 0}
        isVisible={milestoneStreak !== null}
        onDismiss={() => setMilestoneStreak(null)}
      />

      <TopBar
        onBack={handleHome}
        title={`Question ${state.currentIndex + 1}/${state.totalQuestions}`}
        rightContent={
          <div className="flex items-center gap-3">
            {/* Streak indicator */}
            {state.streak > 0 && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="flex items-center gap-1 px-2 py-1 bg-orange-100 rounded-full"
              >
                <Flame className="w-4 h-4 text-orange-500" />
                <span className="text-sm font-bold text-orange-600">{state.streak}</span>
              </motion.div>
            )}

            {/* Timer */}
            <Timer
              timeRemaining={timer.timeRemaining}
              totalTime={TIME_PER_QUESTION}
              variant="both"
              onWarning={playWarning}
            />

            <UserMenu />
          </div>
        }
      />

      <main className="max-w-lg mx-auto px-4 py-6">
        {/* Progress bar */}
        <div className="mb-6">
          <ProgressBar
            current={state.currentIndex + 1}
            total={state.totalQuestions}
            color="bg-challenge"
          />
        </div>

        {/* Points display */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center mb-4"
        >
          <span className="text-sm text-gray-500">Points: </span>
          <span className="font-bold text-challenge">{state.pointsEarned}</span>
        </motion.div>

        {/* Question */}
        <AnimatePresence mode="wait">
          {currentQuestion && (
            currentQuestion.format === 'type' ? (
              <TypeQuestion
                key={currentQuestion.id}
                question={currentQuestion}
                onAnswer={handleAnswer}
                showResult={state.status === 'review'}
                userAnswer={currentAnswer?.selectedAnswer || null}
                disabled={state.status === 'review'}
              />
            ) : (
              <QuestionCard
                key={currentQuestion.id}
                question={currentQuestion}
                onAnswer={handleAnswer}
                showResult={state.status === 'review'}
                selectedAnswer={currentAnswer?.selectedAnswer || null}
                disabled={state.status === 'review'}
              />
            )
          )}
        </AnimatePresence>

        {/* Next button */}
        {state.status === 'review' && (
          <div className="mt-6">
            <Button variant="challenge" fullWidth onClick={handleNext}>
              {state.currentIndex >= state.totalQuestions - 1 ? 'See Results' : 'Next Question'}
            </Button>
          </div>
        )}
      </main>
    </div>
  );
}
