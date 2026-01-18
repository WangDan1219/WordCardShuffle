import { motion } from 'framer-motion';
import { Check, X } from 'lucide-react';

type OptionState = 'default' | 'selected' | 'correct' | 'incorrect';

interface OptionButtonProps {
  label: string;
  state: OptionState;
  disabled: boolean;
  onClick: () => void;
  index: number;
}

const stateStyles: Record<OptionState, string> = {
  default: 'bg-white border-gray-200 hover:border-primary-300 hover:bg-primary-50',
  selected: 'bg-primary-50 border-primary-500',
  correct: 'bg-green-50 border-green-500',
  incorrect: 'bg-red-50 border-red-500',
};

const optionLabels = ['A', 'B', 'C', 'D'];

export function OptionButton({
  label,
  state,
  disabled,
  onClick,
  index,
}: OptionButtonProps) {
  const isAnswered = state === 'correct' || state === 'incorrect';

  return (
    <motion.button
      onClick={onClick}
      disabled={disabled}
      whileHover={disabled ? {} : { scale: 1.02 }}
      whileTap={disabled ? {} : { scale: 0.98 }}
      animate={state === 'incorrect' ? { x: [0, -10, 10, -10, 10, 0] } : {}}
      transition={state === 'incorrect' ? { duration: 0.5 } : {}}
      className={`
        w-full p-4 rounded-xl border-2 text-left
        transition-colors duration-200
        disabled:cursor-not-allowed
        ${stateStyles[state]}
        ${disabled && state === 'default' ? 'opacity-50' : ''}
      `}
    >
      <div className="flex items-center gap-3">
        {/* Option letter */}
        <span
          className={`
            w-8 h-8 rounded-lg flex items-center justify-center
            font-bold text-sm
            ${state === 'correct' ? 'bg-green-500 text-white' : ''}
            ${state === 'incorrect' ? 'bg-red-500 text-white' : ''}
            ${state === 'default' || state === 'selected' ? 'bg-gray-100 text-gray-600' : ''}
          `}
        >
          {isAnswered ? (
            state === 'correct' ? (
              <Check className="w-4 h-4" />
            ) : (
              <X className="w-4 h-4" />
            )
          ) : (
            optionLabels[index]
          )}
        </span>

        {/* Option text */}
        <span
          className={`
            flex-1 font-medium
            ${state === 'correct' ? 'text-green-700' : ''}
            ${state === 'incorrect' ? 'text-red-700' : ''}
            ${state === 'default' || state === 'selected' ? 'text-gray-800' : ''}
          `}
        >
          {label}
        </span>
      </div>
    </motion.button>
  );
}
