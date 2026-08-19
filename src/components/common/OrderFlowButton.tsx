import React, { ReactNode, MouseEventHandler } from 'react';

export type ButtonVariant = 'primary' | 'secondary' | 'tertiary' | 'destructive' | 'outline';
export type ButtonSize = 'sm' | 'md' | 'lg';

export interface OrderFlowButtonProps {
  variant?: ButtonVariant;
  size?: ButtonSize;
  isLoading?: boolean;
  loadingText?: string;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
  fullWidth?: boolean;
  disabled?: boolean;
  className?: string;
  onClick?: MouseEventHandler<HTMLButtonElement>;
  type?: 'button' | 'submit' | 'reset';
  title?: string;
  children: ReactNode;
}

export function OrderFlowButton({
  variant = 'primary',
  size = 'md',
  isLoading = false,
  loadingText,
  leftIcon,
  rightIcon,
  fullWidth = false,
  disabled = false,
  className = '',
  onClick,
  type = 'button',
  title,
  children,
}: OrderFlowButtonProps) {
  const baseClasses =
    'inline-flex items-center justify-center font-bold tracking-tight rounded-xl transition-all duration-150 cursor-pointer select-none focus:outline-none focus-visible:ring-2 focus-visible:ring-[#C9532F] focus-visible:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.985]';

  const sizeClasses = {
    sm: 'h-9 px-3.5 text-xs gap-1.5 min-h-[36px]',
    md: 'h-11 px-4 text-xs gap-2 min-h-[44px]',
    lg: 'h-13 px-6 text-sm gap-2.5 min-h-[48px]',
  };

  const variantClasses = {
    primary:
      'bg-[#211F1B] hover:bg-[#312E29] text-white shadow-xs hover:shadow-sm active:bg-[#181715]',
    secondary:
      'bg-[#C9532F] hover:bg-[#B54624] text-white shadow-xs hover:shadow-sm active:bg-[#A33D1F]',
    tertiary:
      'bg-transparent text-[#777067] hover:text-[#211F1B] hover:bg-[#EDE8DF]',
    outline:
      'bg-[#FFFDF9] border border-[#DDD6CA] text-[#211F1B] hover:bg-[#F5F0E7] hover:border-[#AAA298]',
    destructive:
      'bg-[#DC2626] hover:bg-[#B91C1C] text-white shadow-xs active:bg-[#991B1B]',
  };

  return (
    <button
      type={type}
      title={title}
      onClick={onClick}
      disabled={disabled || isLoading}
      className={`
        ${baseClasses}
        ${sizeClasses[size]}
        ${variantClasses[variant]}
        ${fullWidth ? 'w-full' : ''}
        ${className}
      `}
    >
      {isLoading ? (
        <>
          <svg
            className="animate-spin -ml-0.5 w-4 h-4 text-current"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
          <span className="whitespace-nowrap shrink-0">{loadingText || 'Please wait…'}</span>
        </>
      ) : (
        <>
          {leftIcon && <span className="shrink-0">{leftIcon}</span>}
          <span className="whitespace-nowrap truncate">{children}</span>
          {rightIcon && <span className="shrink-0">{rightIcon}</span>}
        </>
      )}
    </button>
  );
}
