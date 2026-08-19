import React from 'react';
import { Minus, Plus } from 'lucide-react';

interface QuantityStepperProps {
  value: number;
  onChange: (newValue: number) => void;
  min?: number;
  max?: number;
  size?: 'sm' | 'md';
  disabled?: boolean;
  className?: string;
}

export function QuantityStepper({
  value,
  onChange,
  min = 1,
  max = 99,
  size = 'md',
  disabled = false,
  className = '',
}: QuantityStepperProps) {
  const isSm = size === 'sm';

  const handleDecrement = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (value > min) {
      onChange(value - 1);
    }
  };

  const handleIncrement = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (value < max) {
      onChange(value + 1);
    }
  };

  return (
    <div
      className={`inline-flex items-center bg-[#F5F0E7] border border-[#DDD6CA] rounded-xl p-1 select-none ${className}`}
    >
      <button
        type="button"
        onClick={handleDecrement}
        disabled={disabled || value <= min}
        aria-label="Decrease quantity"
        className={`${
          isSm ? 'w-7 h-7 min-w-[28px]' : 'w-8 h-8 min-w-[32px]'
        } rounded-lg bg-[#FFFDF9] text-[#211F1B] flex items-center justify-center shadow-xs hover:bg-[#EDE8DF] active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-[#C9532F]`}
      >
        <Minus className={isSm ? 'w-3 h-3' : 'w-3.5 h-3.5'} />
      </button>

      <span
        className={`${
          isSm ? 'w-7 text-xs' : 'w-8 text-sm'
        } text-center font-bold font-mono tabular-nums text-[#211F1B]`}
      >
        {value}
      </span>

      <button
        type="button"
        onClick={handleIncrement}
        disabled={disabled || value >= max}
        aria-label="Increase quantity"
        className={`${
          isSm ? 'w-7 h-7 min-w-[28px]' : 'w-8 h-8 min-w-[32px]'
        } rounded-lg bg-[#FFFDF9] text-[#211F1B] flex items-center justify-center shadow-xs hover:bg-[#EDE8DF] active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-[#C9532F]`}
      >
        <Plus className={isSm ? 'w-3 h-3' : 'w-3.5 h-3.5'} />
      </button>
    </div>
  );
}
