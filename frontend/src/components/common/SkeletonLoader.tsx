import React from 'react';

interface SkeletonProps {
  className?: string;
  variant?: 'text' | 'card' | 'circle';
}

export const SkeletonLoader: React.FC<SkeletonProps> = ({
  className = '',
  variant = 'text',
}) => {
  const getVariant = () => {
    switch (variant) {
      case 'circle':
        return 'rounded-full';
      case 'card':
        return 'rounded-2xl h-36';
      case 'text':
      default:
        return 'rounded-md h-4';
    }
  };

  return (
    <div
      className={`animate-pulse bg-gradient-to-r from-white/5 via-white/10 to-white/5 bg-[length:200%_100%] ${getVariant()} ${className}`}
      style={{
        animationDuration: '1.5s',
      }}
    />
  );
};
