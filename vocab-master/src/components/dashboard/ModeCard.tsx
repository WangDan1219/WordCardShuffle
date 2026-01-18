import { motion } from 'framer-motion';
import type { LucideIcon } from 'lucide-react';

interface ModeCardProps {
  title: string;
  description: string;
  icon: LucideIcon;
  color: 'study' | 'quiz' | 'challenge';
  onClick: () => void;
  badge?: string;
}

const colorStyles = {
  study: {
    bg: 'bg-gradient-to-br from-emerald-400 to-emerald-600',
    iconBg: 'bg-emerald-300/30',
    hover: 'hover:from-emerald-500 hover:to-emerald-700',
  },
  quiz: {
    bg: 'bg-gradient-to-br from-amber-400 to-amber-600',
    iconBg: 'bg-amber-300/30',
    hover: 'hover:from-amber-500 hover:to-amber-700',
  },
  challenge: {
    bg: 'bg-gradient-to-br from-red-400 to-red-600',
    iconBg: 'bg-red-300/30',
    hover: 'hover:from-red-500 hover:to-red-700',
  },
};

export function ModeCard({
  title,
  description,
  icon: Icon,
  color,
  onClick,
  badge,
}: ModeCardProps) {
  const styles = colorStyles[color];

  return (
    <motion.button
      onClick={onClick}
      whileHover={{ scale: 1.02, y: -4 }}
      whileTap={{ scale: 0.98 }}
      className={`
        w-full p-6 rounded-2xl text-left text-white
        shadow-mode-card transition-all duration-200
        ${styles.bg} ${styles.hover}
        focus:outline-none focus:ring-4 focus:ring-white/30
      `}
    >
      <div className="flex items-start gap-4">
        {/* Icon */}
        <div className={`p-3 rounded-xl ${styles.iconBg}`}>
          <Icon className="w-8 h-8" />
        </div>

        {/* Content */}
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h3 className="text-xl font-bold">{title}</h3>
            {badge && (
              <span className="px-2 py-0.5 text-xs font-semibold bg-white/20 rounded-full">
                {badge}
              </span>
            )}
          </div>
          <p className="mt-1 text-sm text-white/80">{description}</p>
        </div>
      </div>
    </motion.button>
  );
}
