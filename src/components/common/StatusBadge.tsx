import React from 'react';
import { ItemStatus, TableStatus } from '../../types';
import { Check, Clock, AlertCircle, ChefHat, CheckCircle2, Flame } from 'lucide-react';

interface StatusBadgeProps {
  status: ItemStatus | TableStatus | string;
  size?: 'sm' | 'md';
  className?: string;
}

export function StatusBadge({ status, size = 'md', className = '' }: StatusBadgeProps) {
  const isSm = size === 'sm';

  const getStyle = () => {
    switch (status) {
      // Item Statuses
      case 'PLACED':
        return {
          bg: 'bg-[#F5F0E7]',
          text: 'text-[#211F1B]',
          border: 'border-[#DDD6CA]',
          dot: 'bg-[#AAA298]',
          icon: <Clock className="w-3 h-3 text-[#777067]" />,
          label: 'Placed',
        };
      case 'ACCEPTED':
        return {
          bg: 'bg-[#EFF6FF]',
          text: 'text-[#1E40AF]',
          border: 'border-[#BFDBFE]',
          dot: 'bg-[#3B82F6]',
          icon: <ChefHat className="w-3 h-3 text-[#2563EB]" />,
          label: 'Accepted',
        };
      case 'PREPARING':
        return {
          bg: 'bg-[#FAF0EB]',
          text: 'text-[#C2410C]',
          border: 'border-[#F4D3C5]',
          dot: 'bg-[#EA580C]',
          icon: <Flame className="w-3 h-3 text-[#EA580C]" />,
          label: 'Preparing',
        };
      case 'READY':
        return {
          bg: 'bg-[#EBF7EE]',
          text: 'text-[#166534]',
          border: 'border-[#BBF7D0]',
          dot: 'bg-[#16A34A]',
          icon: <CheckCircle2 className="w-3 h-3 text-[#16A34A]" />,
          label: 'Ready',
        };
      case 'SERVED':
        return {
          bg: 'bg-[#F5F0E7]',
          text: 'text-[#777067]',
          border: 'border-[#DDD6CA]',
          dot: 'bg-[#AAA298]',
          icon: <Check className="w-3 h-3 text-[#777067]" />,
          label: 'Served',
        };
      case 'VOIDED':
        return {
          bg: 'bg-[#FEF2F2]',
          text: 'text-[#991B1B]',
          border: 'border-[#FECACA]',
          dot: 'bg-[#DC2626]',
          icon: <AlertCircle className="w-3 h-3 text-[#DC2626]" />,
          label: 'Voided',
        };

      // Table Statuses
      case 'available':
        return {
          bg: 'bg-[#EBF7EE]',
          text: 'text-[#166534]',
          border: 'border-[#BBF7D0]',
          dot: 'bg-[#16A34A]',
          label: 'Available',
        };
      case 'occupied':
        return {
          bg: 'bg-[#FAF0EB]',
          text: 'text-[#C2410C]',
          border: 'border-[#F4D3C5]',
          dot: 'bg-[#EA580C]',
          label: 'Occupied',
        };
      case 'waiting_payment':
        return {
          bg: 'bg-[#FEF9C3]',
          text: 'text-[#854D0E]',
          border: 'border-[#FDE047]',
          dot: 'bg-[#CA8A04]',
          label: 'Waiting Bill',
        };
      case 'unattended':
        return {
          bg: 'bg-[#FAF5FF]',
          text: 'text-[#6B21A8]',
          border: 'border-[#E9D5FF]',
          dot: 'bg-[#9333EA]',
          label: 'Check Table',
        };

      default:
        return {
          bg: 'bg-[#F5F0E7]',
          text: 'text-[#211F1B]',
          border: 'border-[#DDD6CA]',
          dot: 'bg-[#AAA298]',
          label: String(status),
        };
    }
  };

  const style = getStyle();

  return (
    <span
      className={`inline-flex items-center gap-1.5 font-bold uppercase tracking-wider rounded-full border ${
        style.bg
      } ${style.text} ${style.border} ${
        isSm ? 'px-2 py-0.5 text-[10px]' : 'px-2.5 py-1 text-[11px]'
      } ${className}`}
    >
      {style.icon || <span className={`w-1.5 h-1.5 rounded-full ${style.dot} shrink-0`} />}
      <span className="truncate">{style.label}</span>
    </span>
  );
}
