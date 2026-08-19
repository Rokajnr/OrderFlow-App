import React from 'react';
import { formatKwacha } from '../../utils/formatters';
import { Sparkles, Utensils, Receipt, X } from 'lucide-react';

interface ActiveSessionBannerProps {
  tableName: string;
  activeItemCount: number;
  totalAmount: number;
  onOrderMore?: () => void;
  onViewOrder: () => void;
  onViewBill?: () => void;
  onDismiss?: () => void;
  className?: string;
}

export function ActiveSessionBanner({
  tableName,
  activeItemCount,
  totalAmount,
  onViewOrder,
  onViewBill,
  onDismiss,
  className = '',
}: ActiveSessionBannerProps) {
  if (activeItemCount === 0) return null;

  return (
    <div
      className={`bg-[#FAF0EB] border border-[#F0D8CC] rounded-2xl p-3 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5 relative transition-all ${className}`}
    >
      <div className="flex items-center gap-2.5 pr-6 sm:pr-0">
        <div className="w-8 h-8 rounded-xl bg-[#C9532F] text-white flex items-center justify-center shrink-0">
          <Sparkles className="w-4 h-4" />
        </div>
        <div>
          <h4 className="font-extrabold text-xs text-[#211F1B] tracking-tight">
            Active Table Session · {tableName}
          </h4>
          <p className="text-[11px] text-[#777067]">
            {activeItemCount} {activeItemCount === 1 ? 'item' : 'items'} in progress · Balance:{' '}
            <span className="font-bold text-[#211F1B] tabular-nums font-mono">
              {formatKwacha(totalAmount)}
            </span>
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2 w-full sm:w-auto">
        <button
          type="button"
          onClick={onViewOrder}
          className="flex-1 sm:flex-none px-3 py-1.5 bg-[#FFFDF9] hover:bg-[#F5F0E7] border border-[#DDD6CA] text-[#211F1B] text-xs font-bold rounded-xl transition-all shadow-2xs cursor-pointer"
        >
          View Tracker
        </button>
        {onViewBill && (
          <button
            type="button"
            onClick={onViewBill}
            className="flex-1 sm:flex-none px-3 py-1.5 bg-[#C9532F] hover:bg-[#B54624] text-white text-xs font-bold rounded-xl transition-all shadow-2xs cursor-pointer"
          >
            Pay Bill
          </button>
        )}
      </div>

      {/* Dismiss control (hides banner view, does NOT affect session/orders) */}
      {onDismiss && (
        <button
          type="button"
          onClick={onDismiss}
          className="absolute top-2.5 right-2.5 text-[#AAA298] hover:text-[#211F1B] p-1 rounded-lg transition-colors cursor-pointer"
          title="Dismiss banner"
          aria-label="Dismiss banner"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      )}
    </div>
  );
}
