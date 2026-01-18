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
  const { setMode, vocabulary, dispatch, state } = useApp();
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

  // Update stats when navigating cards
  useEffect(() => {
    if (currentIndex > 0) {
      dispatch({
        type: 'UPDATE_STATS',
        payload: {
          totalWordsStudied: Math.max(state.stats.totalWordsStudied, currentIndex + 1),
          lastStudyDate: new Date().toISOString().split('T')[0],
        },
      });
    }
  }, [currentIndex]);

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

  const handleBack = () => {
    playClick();

    // Save study session
    const uniqueWords = reviewedWordsRef.current.size;
    if (uniqueWords > 0) {
      import('../../services/ApiService').then(({ default: api }) => {
        api.saveStudySession({
          wordsReviewed: uniqueWords,
          startTime: new Date(startTimeRef.current).toISOString(),
          endTime: new Date().toISOString()
        }).catch(err => console.error('Failed to save study session:', err));
      });
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

      <main className="max-w-lg mx-auto px-4 py-6">
        {/* Progress bar */}
        <div className="mb-6">
          <ProgressBar
            current={currentIndex + 1}
            total={totalCards}
            color="bg-study"
          />
        </div>

        {/* Flashcard with navigation */}
        <div className="relative flex items-center gap-2 sm:gap-4">
          {/* Previous button */}
          <motion.button
            onClick={handlePrev}
            disabled={currentIndex === 0}
            whileHover={{ scale: currentIndex === 0 ? 1 : 1.1 }}
            whileTap={{ scale: currentIndex === 0 ? 1 : 0.9 }}
            className={`
              p-3 sm:p-4 rounded-xl bg-white shadow-card
              transition-colors flex-shrink-0
              ${currentIndex === 0
                ? 'text-gray-300 cursor-not-allowed'
                : 'text-gray-700 hover:bg-gray-50'
              }
            `}
            aria-label="Previous card"
          >
            <ChevronLeft className="w-6 h-6" />
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
              p-3 sm:p-4 rounded-xl bg-white shadow-card
              transition-colors flex-shrink-0
              ${currentIndex === totalCards - 1
                ? 'text-gray-300 cursor-not-allowed'
                : 'text-gray-700 hover:bg-gray-50'
              }
            `}
            aria-label="Next card"
          >
            <ChevronRight className="w-6 h-6" />
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
