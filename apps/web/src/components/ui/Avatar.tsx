'use client';

import React, { useState, useEffect } from 'react';
import { generateLocalAvatarSvg } from '../../lib/avatar';

interface AvatarProps {
  src?: string | null;
  name?: string | null;
  seed?: string | null;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

const sizeClasses = {
  xs: 'w-6 h-6 text-[10px]',
  sm: 'w-8 h-8 text-xs',
  md: 'w-10 h-10 text-sm',
  lg: 'w-14 h-14 text-base',
  xl: 'w-20 h-20 text-xl',
};

const dimensionMap = {
  xs: 24,
  sm: 32,
  md: 40,
  lg: 56,
  xl: 80,
};

export const Avatar: React.FC<AvatarProps> = ({
  src,
  name,
  seed,
  size = 'md',
  className = '',
}) => {
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    setHasError(false);
  }, [src]);

  let extractedSeed = seed;
  if (!extractedSeed && src && src.includes('seed=')) {
    try {
      const parsed = new URL(src);
      extractedSeed = parsed.searchParams.get('seed');
    } catch {
      // not a standard URL, ignore
    }
  }

  const fallbackUri = generateLocalAvatarSvg(extractedSeed || name || 'learner');
  const dim = dimensionMap[size];

  // If no external src or error occurred, directly render deterministic local SVG data URI
  const finalSrc = (!src || hasError) ? fallbackUri : src;

  return (
    <div
      className={`rounded-full overflow-hidden shrink-0 bg-slate-100 border border-slate-200/80 flex items-center justify-center font-bold select-none ${sizeClasses[size]} ${className}`}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={finalSrc}
        alt={name || seed || 'User Avatar'}
        width={dim}
        height={dim}
        className="w-full h-full object-cover"
        loading="lazy"
        onError={() => setHasError(true)}
      />
    </div>
  );
};
