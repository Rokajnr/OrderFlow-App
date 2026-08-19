import React from 'react';
import { formatKwacha } from '../../utils/formatters';

export type TicketRole = 'customer' | 'waiter' | 'kitchen' | 'manager';

interface LiveTableTicketProps {
  role?: TicketRole;
  tableName: string;
  orderNumber?: string | number;
  roundNumber?: number;
  itemCount?: number;
  guestName?: string;
  guestCount?: number;
  elapsedTime?: string;
  statusLabel?: string;
  statusType?: 'placed' | 'accepted' | 'preparing' | 'ready' | 'served' | 'open' | 'waiting_payment';
  amount?: number;
  onClick?: () => void;
  className?: string;
}

export function LiveTableTicket({
  role = 'customer',
  tableName,
  orderNumber = '1042',
  roundNumber = 1,
  itemCount,
  guestName,
  guestCount,
  elapsedTime,
  statusLabel,
  statusType = 'preparing',
  amount,
  onClick,
  className = '',
}: LiveTableTicketProps) {
  const getStatusClasses = () => {
    switch (statusType) {
      case 'ready':
      case 'served':
        return 'bg-[#EBF7EE] text-[#166534] border-[#BBF7D0]';
      case 'preparing':
        return 'bg-[#FAF0EB] text-[#C2410C] border-[#F4D3C5]';
      case 'waiting_payment':
        return 'bg-[#FEF9C3] text-[#854D0E] border-[#FDE047]';
      case 'open':
        return 'bg-[#EFF6FF] text-[#1E40AF] border-[#BFDBFE]';
      case 'placed':
      case 'accepted':
      default:
        return 'bg-[#F5F0E7] text-[#211F1B] border-[#DDD6CA]';
    }
  };

  const Component = onClick ? 'button' : 'div';

  // Role: Kitchen Display Ticket
  if (role === 'kitchen') {
    return (
      <div className={`bg-[#26211C] border border-stone-800 rounded-xl p-3 text-left ${className}`}>
        <div className="flex items-center justify-between font-mono text-xs">
          <span className="font-bold text-white tracking-wider">#{orderNumber} · {tableName}</span>
          {elapsedTime && <span className="text-[#AAA298] tabular-nums">{elapsedTime} elapsed</span>}
        </div>
        {statusLabel && (
          <div className="mt-1.5 inline-block text-[11px] font-bold uppercase tracking-wider text-[#C9532F]">
            {statusLabel}
          </div>
        )}
      </div>
    );
  }

  // Role: Waiter Ticket
  if (role === 'waiter') {
    return (
      <Component
        onClick={onClick}
        className={`w-full bg-[#FFFDF9] border border-[#DDD6CA] rounded-xl p-3.5 text-left transition-all hover:border-[#211F1B] ${
          onClick ? 'cursor-pointer active:scale-[0.99]' : ''
        } ${className}`}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="font-extrabold text-sm text-[#211F1B] tracking-tight">{tableName}</span>
            {guestCount && (
              <span className="text-[11px] text-[#777067]">({guestCount} guests)</span>
            )}
          </div>
          {statusLabel && (
            <span className={`text-[10.5px] font-bold uppercase px-2 py-0.5 rounded-md border ${getStatusClasses()}`}>
              {statusLabel}
            </span>
          )}
        </div>
        <div className="flex items-center justify-between text-xs text-[#777067] mt-1.5">
          <span className="font-mono">Order #{orderNumber} · {itemCount || 0} items</span>
          {amount !== undefined && (
            <span className="font-bold text-[#211F1B] tabular-nums">{formatKwacha(amount)}</span>
          )}
        </div>
      </Component>
    );
  }

  // Role: Manager Compact Floor Ticket
  if (role === 'manager') {
    return (
      <Component
        onClick={onClick}
        className={`bg-[#FFFDF9] border border-[#DDD6CA] rounded-xl p-3 text-left transition-all hover:border-[#211F1B] ${
          onClick ? 'cursor-pointer' : ''
        } ${className}`}
      >
        <div className="flex items-center justify-between">
          <span className="font-bold text-xs text-[#211F1B] uppercase tracking-wide">{tableName}</span>
          <span className={`text-[10px] font-bold uppercase px-1.5 py-0.5 rounded border ${getStatusClasses()}`}>
            {statusLabel || 'OPEN'}
          </span>
        </div>
        {amount !== undefined && (
          <div className="text-sm font-extrabold text-[#211F1B] font-mono tabular-nums mt-1">
            {formatKwacha(amount)}
          </div>
        )}
      </Component>
    );
  }

  // Role: Customer Table Ticket Header
  return (
    <div className={`bg-[#FFFDF9] border border-[#DDD6CA] rounded-2xl p-3.5 text-left shadow-xs ${className}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="font-extrabold text-sm text-[#211F1B] tracking-tight">{tableName}</span>
          <span className="text-[11px] text-[#777067]">· Round {roundNumber}</span>
          {guestName && (
            <span className="text-[11px] font-medium text-[#C9532F] bg-[#FAF0EB] px-2 py-0.5 rounded-full">
              {guestName}
            </span>
          )}
        </div>
        {statusLabel && (
          <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full border ${getStatusClasses()}`}>
            {statusLabel}
          </span>
        )}
      </div>
      {amount !== undefined && (
        <div className="flex items-center justify-between mt-2 pt-2 border-t border-[#DDD6CA]/60 text-xs">
          <span className="text-[#777067]">Table running balance</span>
          <span className="font-bold text-[#211F1B] font-mono tabular-nums">{formatKwacha(amount)}</span>
        </div>
      )}
    </div>
  );
}
