import React from 'react';

interface BrandMarkProps {
  size?: 'sm' | 'md' | 'lg';
  variant?: 'terracotta' | 'dark' | 'light';
  showWordmark?: boolean;
  className?: string;
}

/**
 * OrderFlow Distinctive Brand Mark
 * Represents a folded order ticket with a connected table session flow.
 * Crisp and legible at 20-28px.
 */
export function BrandMark({
  size = 'md',
  variant = 'terracotta',
  showWordmark = false,
  className = '',
}: BrandMarkProps) {
  const sizeClasses = {
    sm: 'w-6 h-6',
    md: 'w-7 h-7',
    lg: 'w-9 h-9',
  };

  const bgClasses = {
    terracotta: 'bg-[#C9532F] text-white shadow-xs',
    dark: 'bg-[#211F1B] text-[#FFFDF9] shadow-xs',
    light: 'bg-[#FFFDF9] text-[#C9532F] border border-[#DDD6CA] shadow-xs',
  };

  return (
    <div className={`inline-flex items-center gap-2.5 ${className}`}>
      <div
        className={`${sizeClasses[size]} ${bgClasses[variant]} rounded-[9px] flex items-center justify-center shrink-0 transition-transform`}
        aria-hidden="true"
      >
        {/* Crisp vector icon: Folded order ticket with directional service flow */}
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="w-[60%] h-[60%]"
        >
          {/* Ticket body */}
          <path d="M6 3h12a1 1 0 0 1 1 1v16l-3-1.5-3 1.5-3-1.5-3 1.5-3-1.5V4a1 1 0 0 1 1-1z" />
          {/* Internal flow / checkmark lines representing orders */}
          <path d="M9 8h6" />
          <path d="M9 12h4" />
        </svg>
      </div>

      {showWordmark && (
        <span className="font-extrabold text-sm tracking-tight text-current select-none">
          OrderFlow
        </span>
      )}
    </div>
  );
}
