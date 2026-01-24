import { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { ChevronLeft, ChevronRight, RotateCcw } from 'lucide-react';
import { TopBar } from '../layout/TopBar';
import { ProgressBar } from '../common';
import { UserMenu } from '../common/UserMenu';
import { FlashCard } from './FlashCard';
import { useApp } from '../../contexts/AppContext';
import { useStudyMode } from '../../hooks/useStudyMode';
import { useAudio } from '../../hooks/useAudio';

export function StudyMode() {
  const { setMode, vocabulary, dispatch, state, loadUserData } = useApp();
  const { playFlip, playClick } = useAudio();
  const {
    currentCard,
    currentIndex,
    totalCards,
    isFlipped,
    flip,
    nextCard,
    prevCard,
    resetDeck,
  } = useStudyMode(vocabulary);

  // Study tracking
  const startTimeRef = useRef(Date.now());
  const reviewedWordsRef = useRef(new Set<string>());

  // Track reviewed words
  useEffect(() => {
    if (currentCard) {
      reviewedWordsRef.current.add(currentCard.targetWord);
    }
  }, [currentCard]);

  // Update stats based on unique words reviewed
  useEffect(() => {
    const uniqueCount = reviewedWordsRef.current.size;
    if (uniqueCount > 0) {
      dispatch({
        type: 'UPDATE_STATS',
        payload: {
          totalWordsStudied: Math.max(state.stats.totalWordsStudied, uniqueCount),
          lastStudyDate: new Date().toISOString().split('T')[0],
        },
      });
    }
  }, [currentCard]);

  const handleFlip = () => {
    playFlip();
    flip();
  };

  const handleNext = () => {
    if (currentIndex < totalCards - 1) {
      playClick();
      nextCard();
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      playClick();
      prevCard();
    }
  };

  const handleReset = () => {
    playClick();
    resetDeck();
    // Reset tracking for new "session" feel? Or keep accumulating?
    // Keeping accumulating as long as they are in the mode
  };

  const handleBack = async () => {
    playClick();

    // Save study session and refresh stats
    const uniqueWords = reviewedWordsRef.current.size;
    if (uniqueWords > 0) {
      const wordsList = Array.from(reviewedWordsRef.current);
      try {
        const api = (await import('../../services/ApiService')).default;
        await api.saveStudySession({
          wordsReviewed: uniqueWords,
          startTime: new Date(startTimeRef.current).toISOString(),
          endTime: new Date().toISOString(),
          words: wordsList
        });
        // Refresh stats from backend
        await loadUserData();
      } catch (err) {
        console.error('Failed to save study session:', err);
      }
    }

    setMode('dashboard');
  };

  if (!currentCard) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-500">No vocabulary words available.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-study-light/30 to-gray-50">
      <TopBar
        onBack={handleBack}
        title={`Card ${currentIndex + 1}/${totalCards}`}
        rightContent={
          <div className="flex items-center gap-3">
            <button
              onClick={handleReset}
              className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
              aria-label="Shuffle deck"
            >
              <RotateCcw className="w-5 h-5 text-gray-600" />
            </button>
            <UserMenu />
          </div>
        }
      />

      <main className="max-w-lg md:max-w-xl lg:max-w-2xl xl:max-w-3xl mx-auto px-4 py-6 lg:py-10">
        {/* Progress bar */}
        <div className="mb-6">
          <ProgressBar
            current={currentIndex + 1}
            total={totalCards}
            color="bg-study"
          />
        </div>

        {/* Flashcard with navigation */}
        <div className="relative flex items-center gap-2 sm:gap-4 lg:gap-6">
          {/* Previous button */}
          <motion.button
            onClick={handlePrev}
            disabled={currentIndex === 0}
            whileHover={{ scale: currentIndex === 0 ? 1 : 1.1 }}
            whileTap={{ scale: currentIndex === 0 ? 1 : 0.9 }}
            className={`
              p-3 sm:p-4 lg:p-5 rounded-xl lg:rounded-2xl bg-white shadow-card
              transition-colors flex-shrink-0
              ${currentIndex === 0
                ? 'text-gray-300 cursor-not-allowed'
                : 'text-gray-700 hover:bg-gray-50'
              }
            `}
            aria-label="Previous card"
          >
            <ChevronLeft className="w-6 h-6 lg:w-8 lg:h-8" />
          </motion.button>

          {/* Card */}
          <div className="flex-1">
            <FlashCard
              word={currentCard}
              isFlipped={isFlipped}
              onFlip={handleFlip}
            />
          </div>

          {/* Next button */}
          <motion.button
            onClick={handleNext}
            disabled={currentIndex === totalCards - 1}
            whileHover={{ scale: currentIndex === totalCards - 1 ? 1 : 1.1 }}
            whileTap={{ scale: currentIndex === totalCards - 1 ? 1 : 0.9 }}
            className={`
              p-3 sm:p-4 lg:p-5 rounded-xl lg:rounded-2xl bg-white shadow-card
              transition-colors flex-shrink-0
              ${currentIndex === totalCards - 1
                ? 'text-gray-300 cursor-not-allowed'
                : 'text-gray-700 hover:bg-gray-50'
              }
            `}
            aria-label="Next card"
          >
            <ChevronRight className="w-6 h-6 lg:w-8 lg:h-8" />
          </motion.button>
        </div>

        {/* Keyboard hint */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="text-center text-sm text-gray-400 mt-6"
        >
          Use arrow keys to navigate, Space to flip
        </motion.p>
      </main>
    </div>
  );
}
