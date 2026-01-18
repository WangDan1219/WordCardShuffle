import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { User, LogOut, ChevronDown, Cloud } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useApp } from '../../contexts/AppContext';

export function UserMenu() {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const { state: authState, logout } = useAuth();
  const { state: appState } = useApp();

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = async () => {
    setIsOpen(false);
    await logout();
  };

  if (!authState.user) return null;

  const displayName = authState.user.displayName || authState.user.username;

  return (
    <div className="relative z-50" ref={menuRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 bg-slate-800/80 backdrop-blur-sm border border-slate-700 rounded-lg hover:bg-slate-700/80 transition-colors"
      >
        <div className="w-8 h-8 bg-indigo-600 rounded-full flex items-center justify-center">
          <User size={16} className="text-white" />
        </div>
        <span className="text-white text-sm font-medium max-w-[120px] truncate hidden sm:block">
          {displayName}
        </span>
        {appState.isSyncing ? (
          <Cloud size={16} className="text-indigo-400 animate-pulse" />
        ) : (
          <ChevronDown
            size={16}
            className={`text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`}
          />
        )}
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 mt-2 w-56 bg-slate-800 border border-slate-700 rounded-lg shadow-xl overflow-hidden"
          >
            {/* User info */}
            <div className="px-4 py-3 border-b border-slate-700">
              <p className="text-white font-medium truncate">{displayName}</p>
              <p className="text-gray-400 text-sm truncate">@{authState.user.username}</p>
            </div>

            {/* Sync status */}
            <div className="px-4 py-2 border-b border-slate-700 flex items-center gap-2">
              {appState.isSyncing ? (
                <>
                  <Cloud size={16} className="text-indigo-400 animate-pulse" />
                  <span className="text-sm text-indigo-400">Syncing...</span>
                </>
              ) : (
                <>
                  <Cloud size={16} className="text-green-400" />
                  <span className="text-sm text-green-400">Synced</span>
                </>
              )}
            </div>

            {/* Menu items */}
            <div className="py-1">
              <button
                onClick={handleLogout}
                className="w-full px-4 py-2 text-left text-red-400 hover:bg-slate-700/50 flex items-center gap-2 transition-colors"
                disabled={appState.isSyncing}
              >
                <LogOut size={16} />
                Sign out
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default UserMenu;
