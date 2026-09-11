import React from 'react';
import { motion } from 'framer-motion';

interface GlassCardProps {
  children: React.ReactNode;
  className?: string;
  hoverEffect?: boolean;
  glowColor?: 'cyan' | 'purple' | 'green' | 'none';
  onClick?: () => void;
  onMouseEnter?: () => void;
  onMouseLeave?: () => void;
}

export const GlassCard: React.FC<GlassCardProps> = ({
  children,
  className = '',
  hoverEffect = true,
  glowColor = 'none',
  onClick,
  onMouseEnter,
  onMouseLeave,
}) => {
  const getGlowStyles = () => {
    switch (glowColor) {
      case 'cyan':
        return 'border-cyan-500/30 shadow-[0_0_20px_rgba(0,240,255,0.15)]';
      case 'purple':
        return 'border-purple-500/30 shadow-[0_0_20px_rgba(168,85,247,0.15)]';
      case 'green':
        return 'border-green-500/30 shadow-[0_0_20px_rgba(0,255,136,0.15)]';
      default:
        return 'border-white/10';
    }
  };

  return (
    <motion.div
      onClick={onClick}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      className={`glass-panel rounded-2xl p-5 ${hoverEffect ? 'glass-panel-hover' : ''} ${getGlowStyles()} ${className}`}
    >
      {children}
    </motion.div>
  );
};
