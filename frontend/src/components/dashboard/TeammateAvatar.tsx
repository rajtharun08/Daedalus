import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { GitBranch, Clock, MapPin } from 'lucide-react';
import { User } from '../../types';

interface Props {
  user: User;
  size?: 'sm' | 'md' | 'lg';
}

export const TeammateAvatar: React.FC<Props> = ({ user, size = 'sm' }) => {
  const [isHovered, setIsHovered] = useState(false);

  const sizeClasses = {
    sm: 'w-7 h-7',
    md: 'w-9 h-9',
    lg: 'w-11 h-11',
  };

  return (
    <div
      className="relative inline-block"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div
        className={`${sizeClasses[size]} rounded-full border border-cyan-400/40 overflow-hidden bg-space-800 cursor-pointer shadow-[0_0_10px_rgba(0,240,255,0.2)]`}
      >
        <img
          src={user.avatar_url || `https://api.dicebear.com/7.x/bottts/svg?seed=${user.github_username}`}
          alt={user.full_name}
          className="w-full h-full object-cover"
        />
      </div>

      {/* Real-Time Teammate Tooltip */}
      <AnimatePresence>
        {isHovered && (
          <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 5, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-56 p-3 rounded-xl glass-panel bg-space-950/95 border border-cyan-500/30 shadow-[0_0_25px_rgba(0,0,0,0.8)] z-50 pointer-events-none"
          >
            <div className="flex items-center gap-2.5 pb-2 border-b border-white/10">
              <div className="w-8 h-8 rounded-full border border-cyan-400/50 overflow-hidden bg-space-800 shrink-0">
                <img src={user.avatar_url} alt={user.full_name} className="w-full h-full object-cover" />
              </div>
              <div className="min-w-0">
                <div className="text-xs font-bold text-white truncate font-sans">{user.full_name}</div>
                <div className="text-[10px] font-mono text-cyan-400 truncate">@{user.github_username}</div>
              </div>
            </div>

            <div className="mt-2 space-y-1.5 text-[11px] font-mono text-slate-300">
              <div className="flex items-center gap-1.5">
                <Clock className="w-3 h-3 text-neon-violet shrink-0" />
                <span className="truncate">{user.timezone || 'UTC+00:00'}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <GitBranch className="w-3 h-3 text-neon-cyan shrink-0" />
                <span className="truncate text-cyan-300 font-semibold">{user.active_branch || 'main'}</span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
