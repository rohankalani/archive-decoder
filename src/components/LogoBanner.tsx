import React from 'react';
import { cn } from '@/lib/utils';

interface LogoBannerProps {
  variant?: 'full' | 'compact' | 'mobile';
  className?: string;
}

export function LogoBanner({ variant = 'full', className }: LogoBannerProps) {
  const sizeClasses = {
    full: 'h-16 md:h-20',
    compact: 'h-8 md:h-10',
    mobile: 'h-12'
  };

  const gapClasses = {
    full: 'gap-4 md:gap-6',
    compact: 'gap-2 md:gap-3',
    mobile: 'gap-3'
  };

  return (
    <div className={cn(
      'flex items-center justify-center',
      gapClasses[variant],
      className
    )}>
      <img
        src="/logos/abu-dhabi-university.svg"
        alt="Abu Dhabi University"
        className={cn(
          'object-contain transition-transform hover:scale-105',
          sizeClasses[variant]
        )}
        loading="lazy"
        onError={(e) => {
          // Fallback to PNG if SVG fails
          const target = e.target as HTMLImageElement;
          if (target.src.endsWith('.svg')) {
            target.src = target.src.replace('.svg', '.png');
          }
        }}
      />
      <img
        src="/logos/arc-light-services.svg"
        alt="Arc Light Services"
        className={cn(
          'object-contain transition-transform hover:scale-105',
          sizeClasses[variant]
        )}
        loading="lazy"
        onError={(e) => {
          const target = e.target as HTMLImageElement;
          if (target.src.endsWith('.svg')) {
            target.src = target.src.replace('.svg', '.png');
          }
        }}
      />
      <img
        src="/logos/rosaqi.svg"
        alt="ROSAQI"
        className={cn(
          'object-contain transition-transform hover:scale-105',
          sizeClasses[variant]
        )}
        loading="lazy"
        onError={(e) => {
          const target = e.target as HTMLImageElement;
          if (target.src.endsWith('.svg')) {
            target.src = target.src.replace('.svg', '.png');
          }
        }}
      />
    </div>
  );
}
