import React from 'react';
import { Users, UserPlus } from 'lucide-react';

interface ParticipantListProps {
  tableName: string;
  guests: string[];
  currentGuest: string;
  onAddOrChangeGuest?: () => void;
  className?: string;
}

export function ParticipantList({
  tableName,
  guests,
  currentGuest,
  onAddOrChangeGuest,
  className = '',
}: ParticipantListProps) {
  return (
    <div
      className={`bg-[#FFFDF9] border border-[#DDD6CA] rounded-2xl p-3.5 flex items-center justify-between gap-3 ${className}`}
    >
      <div className="flex items-center gap-3 min-w-0">
        <div className="w-8 h-8 rounded-xl bg-[#FAF0EB] text-[#C9532F] flex items-center justify-center shrink-0 border border-[#F0D8CC]">
          <Users className="w-4 h-4" />
        </div>
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <h4 className="font-extrabold text-xs text-[#211F1B] tracking-tight truncate">
              {tableName} · {guests.length} {guests.length === 1 ? 'person' : 'people'}
            </h4>
          </div>
          <p className="text-[11px] text-[#777067] truncate mt-0.5">
            {guests.map((g) => (g === currentGuest ? `You (${g})` : g)).join(', ')}
          </p>
        </div>
      </div>

      {onAddOrChangeGuest && (
        <button
          type="button"
          onClick={onAddOrChangeGuest}
          className="shrink-0 px-2.5 py-1 text-[11px] font-bold text-[#C9532F] bg-[#FAF0EB] hover:bg-[#F0D8CC] rounded-lg transition-colors cursor-pointer"
        >
          Change
        </button>
      )}
    </div>
  );
}
