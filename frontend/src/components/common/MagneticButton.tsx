import React from 'react';
import { motion } from 'framer-motion';

interface MagneticButtonProps {
  children: React.ReactNode;
  className?: string;
  variant?: 'primary' | 'secondary' | 'glow';
  strength?: number;
  type?: 'button' | 'submit' | 'reset';
  disabled?: boolean;
  onClick?: (e: React.MouseEvent<HTMLButtonElement>) => void;
}

export const MagneticButton: React.FC<MagneticButtonProps> = ({
  children,
  className = '',
  variant = 'primary',
  type = 'button',
  disabled = false,
  onClick,
}) => {
  const getVariantStyles = () => {
    switch (variant) {
      case 'glow':
      case 'primary':
        return 'bg-white text-zinc-950 font-semibold hover:bg-zinc-200 border border-white/20 shadow-sm';
      case 'secondary':
      default:
        return 'bg-zinc-900/90 text-zinc-300 hover:text-white border border-white/10 hover:border-white/25 hover:bg-zinc-800/90 shadow-sm';
    }
  };

  return (
    <motion.button
      type={type}
      whileHover={disabled ? undefined : { scale: 1.01 }}
      whileTap={disabled ? undefined : { scale: 0.98 }}
      transition={{ duration: 0.12 }}
      onClick={onClick}
      disabled={disabled}
      className={`px-5 py-2.5 rounded-xl font-medium tracking-wide flex items-center justify-center gap-2 cursor-pointer transition-colors duration-150 disabled:opacity-40 disabled:cursor-not-allowed ${getVariantStyles()} ${className}`}
    >
      {children}
    </motion.button>
  );
};

