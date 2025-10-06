import React from 'react';
import { cn } from '@/lib/utils';

interface LogoBannerProps {
  variant?: 'full' | 'compact' | 'mobile';
  className?: string;
}

export function LogoBanner({ variant = 'full', className }: LogoBannerProps) {
  // Abu Dhabi University is most important, Arc Light second, ROSAIQ third
  const aduSizeClasses = {
    full: 'h-20 md:h-24',
    compact: 'h-10 md:h-12',
    mobile: 'h-14'
  };

  const arcLightSizeClasses = {
    full: 'h-14 md:h-16',
    compact: 'h-7 md:h-9',
    mobile: 'h-10'
  };

  const rosaiqSizeClasses = {
    full: 'h-12 md:h-14',
    compact: 'h-6 md:h-8',
    mobile: 'h-9'
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
        src="/logos/abu-dhabi-university.png"
        alt="Abu Dhabi University"
        className={cn(
          'object-contain transition-transform hover:scale-105',
          aduSizeClasses[variant]
        )}
        loading="lazy"
      />
      <img
        src="/logos/arc-light-services.png"
        alt="Arc Light Services"
        className={cn(
          'object-contain transition-transform hover:scale-105',
          arcLightSizeClasses[variant]
        )}
        loading="lazy"
      />
      <img
        src="/logos/rosaiq.png"
        alt="ROSAIQ"
        className={cn(
          'object-contain transition-transform hover:scale-105',
          rosaiqSizeClasses[variant]
        )}
        loading="lazy"
      />
    </div>
  );
}
