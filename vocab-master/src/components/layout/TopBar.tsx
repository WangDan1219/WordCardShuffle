import type { ReactNode } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, X } from 'lucide-react';

interface TopBarProps {
  onBack: () => void;
  title?: string;
  rightContent?: ReactNode;
  variant?: 'back' | 'close';
}

export function TopBar({
  onBack,
  title,
  rightContent,
  variant = 'back',
}: TopBarProps) {
  const Icon = variant === 'close' ? X : ArrowLeft;

  return (
    <motion.header
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-gray-100"
    >
      <div className="flex items-center justify-between h-14 px-4">
        {/* Left: Back/Close button */}
        <button
          onClick={onBack}
          className="p-2 -ml-2 rounded-lg hover:bg-gray-100 transition-colors"
          aria-label={variant === 'close' ? 'Close' : 'Go back'}
        >
          <Icon className="w-6 h-6 text-gray-700" />
        </button>

        {/* Center: Title */}
        {title && (
          <h1 className="absolute left-1/2 -translate-x-1/2 text-lg font-semibold text-gray-900">
            {title}
          </h1>
        )}

        {/* Right: Optional content (timer, settings, etc.) */}
        <div className="flex items-center gap-2">
          {rightContent}
        </div>
      </div>
    </motion.header>
  );
}
