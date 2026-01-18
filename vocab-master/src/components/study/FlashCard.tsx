import { motion } from 'framer-motion';
import type { VocabularyWord } from '../../types';
import { getRandomElement } from '../../utils';

interface FlashCardProps {
  word: VocabularyWord;
  isFlipped: boolean;
  onFlip: () => void;
}

export function FlashCard({ word, isFlipped, onFlip }: FlashCardProps) {
  // Get a random example sentence
  const exampleSentence = word.exampleSentence.length > 0
    ? getRandomElement(word.exampleSentence)
    : null;

  return (
    <div
      className="perspective-1000 w-full cursor-pointer"
      onClick={onFlip}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onFlip();
        }
      }}
      tabIndex={0}
      role="button"
      aria-label={isFlipped ? 'Show word' : 'Show definition'}
    >
      <motion.div
        className="relative w-full preserve-3d"
        animate={{ rotateY: isFlipped ? 180 : 0 }}
        transition={{ duration: 0.6, ease: 'easeInOut' }}
        style={{ transformStyle: 'preserve-3d' }}
      >
        {/* Front of card - Word */}
        <div
          className={`
            w-full min-h-[300px] sm:min-h-[350px]
            bg-white rounded-2xl shadow-card
            flex flex-col items-center justify-center
            p-6 backface-hidden
            ${isFlipped ? 'invisible' : ''}
          `}
          style={{ backfaceVisibility: 'hidden' }}
        >
          <h2 className="text-4xl sm:text-5xl font-bold text-gray-900 text-center">
            {word.targetWord}
          </h2>
          <p className="mt-6 text-sm text-gray-400">
            Click card to flip
          </p>
        </div>

        {/* Back of card - Definition */}
        <div
          className={`
            absolute top-0 left-0
            w-full min-h-[300px] sm:min-h-[350px]
            bg-white rounded-2xl shadow-card
            p-6 backface-hidden rotate-y-180
            flex flex-col
            ${!isFlipped ? 'invisible' : ''}
          `}
          style={{
            backfaceVisibility: 'hidden',
            transform: 'rotateY(180deg)',
          }}
        >
          {/* Definitions */}
          <div className="flex-1">
            <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">
              Definition
            </h3>
            <ul className="space-y-2">
              {word.definition.map((def, index) => (
                <li
                  key={index}
                  className="text-gray-700 text-sm sm:text-base flex items-start gap-2"
                >
                  <span className="text-primary-500 mt-1">•</span>
                  <span>{def}</span>
                </li>
              ))}
            </ul>

            {/* Synonyms */}
            {word.synonyms.length > 0 && (
              <div className="mt-4">
                <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">
                  Synonyms
                </h3>
                <div className="flex flex-wrap gap-2">
                  {word.synonyms.map((synonym, index) => (
                    <span
                      key={index}
                      className="px-3 py-1 bg-primary-100 text-primary-700 rounded-full text-sm font-medium"
                    >
                      {synonym}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Example sentence */}
            {exampleSentence && (
              <div className="mt-4">
                <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">
                  Example
                </h3>
                <p className="text-gray-600 text-sm italic">
                  "{exampleSentence}"
                </p>
              </div>
            )}
          </div>

          <p className="mt-4 text-xs text-gray-400 text-center">
            Click card to flip back
          </p>
        </div>
      </motion.div>
    </div>
  );
}
