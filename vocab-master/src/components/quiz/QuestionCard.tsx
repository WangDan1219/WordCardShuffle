import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { OptionButton } from './OptionButton';
import type { QuizQuestion } from '../../types';

interface QuestionCardProps {
  question: QuizQuestion;
  onAnswer: (answer: string) => void;
  showResult: boolean;
  selectedAnswer: string | null;
  disabled: boolean;
}

export function QuestionCard({
  question,
  onAnswer,
  showResult,
  selectedAnswer,
  disabled,
}: QuestionCardProps) {
  const [localSelected, setLocalSelected] = useState<string | null>(null);

  // Reset local selection when question changes
  useEffect(() => {
    setLocalSelected(null);
  }, [question.id]);

  // Sync with external selected answer
  useEffect(() => {
    setLocalSelected(selectedAnswer);
  }, [selectedAnswer]);

  const handleOptionClick = (option: string) => {
    if (disabled || showResult) return;
    setLocalSelected(option);
    onAnswer(option);
  };

  const getOptionState = (option: string) => {
    if (!showResult) {
      return localSelected === option ? 'selected' : 'default';
    }

    if (option === question.correctAnswer) {
      return 'correct';
    }

    if (localSelected === option && option !== question.correctAnswer) {
      return 'incorrect';
    }

    return 'default';
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="w-full"
    >
      {/* Prompt */}
      <div className="bg-white rounded-2xl shadow-card p-6 mb-6">
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">
          {question.promptType === 'synonym' ? 'Synonym' : 'Definition'}
        </p>
        <p className="text-lg sm:text-xl text-gray-800 font-medium">
          {question.prompt}
        </p>
      </div>

      {/* Options */}
      <div className="space-y-3">
        {question.options.map((option, index) => (
          <OptionButton
            key={`${question.id}-${option}`}
            label={option}
            state={getOptionState(option)}
            disabled={disabled || showResult}
            onClick={() => handleOptionClick(option)}
            index={index}
          />
        ))}
      </div>
    </motion.div>
  );
}
