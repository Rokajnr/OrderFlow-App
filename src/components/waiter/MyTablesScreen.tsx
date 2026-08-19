import React, { useState } from 'react';
import { useRestaurant } from '../../context/RestaurantContext';
import { TableStatus, TableSession } from '../../types';
import { formatKwacha, formatTimeAgo } from '../../utils/formatters';
import {
  Users,
  Bell,
  CheckCircle2,
  AlertTriangle,
  ChevronRight,
  Clock,
  Flame,
  Search,
  Receipt,
  Check,
} from 'lucide-react';
import { BrandMark } from '../common/BrandMark';
import { StatusBadge } from '../common/StatusBadge';

interface MyTablesScreenProps {
  onSelectTable: (tableId: string) => void;
}

export function MyTablesScreen({ onSelectTable }: MyTablesScreenProps) {
  const { tables, sessions, activeTableId, setActiveTableId } = useRestaurant();
  const [filterSection, setFilterSection] = useState<'All' | 'Lake Patio' | 'Dining Room' | 'Bar Area'>('All');
  const [statusFilter, setStatusFilter] = useState<'all' | 'needs_attention' | 'occupied' | 'available'>('all');

  // Operational priority: Assistance > Ready dishes > Payment waiting > Payment confirmed/Ready to clear > Idle > Occupied > Available
  const getTablePriority = (tableId: string) => {
    const session = sessions[tableId];
    if (!session) return 99;
    if (session.assistanceRequests?.some((r) => r.status === 'pending')) return 1;
    if (session.items?.some((i) => i.status === 'READY')) return 2;
    if (session.paymentState === 'PAYMENT_REQUESTED' || session.status === 'waiting_payment') return 3;
    if (session.paymentState === 'READY_TO_CLOSE' || session.isPaid) return 4;
    if (session.status === 'unattended') return 5;
    if (session.status === 'occupied') return 6;
    return 7;
  };

  const filteredTables = [...tables]
    .filter((table) => {
      const session = sessions[table.id];
      const status = session ? session.status : 'available';
      const matchesSection = filterSection === 'All' || table.section === filterSection;

      if (!matchesSection) return false;
      if (statusFilter === 'all') return true;
      if (statusFilter === 'needs_attention') {
        const hasAssistance = session && session.assistanceRequests?.some((r) => r.status === 'pending');
        const hasReadyItems = session && session.items?.some((i) => i.status === 'READY');
        const isReadyToClose = session && (session.paymentState === 'READY_TO_CLOSE' || session.isPaid);
        return status === 'waiting_payment' || status === 'unattended' || hasAssistance || hasReadyItems || isReadyToClose;
      }
      if (statusFilter === 'occupied') return status === 'occupied' || status === 'waiting_payment';
      if (statusFilter === 'available') return status === 'available';
      return true;
    })
    .sort((a, b) => getTablePriority(a.id) - getTablePriority(b.id));

  // High-priority counts
  const sessionList = Object.values(sessions) as TableSession[];
  const alertCount = sessionList.filter((s) =>
    s?.assistanceRequests?.some((r) => r.status === 'pending')
  ).length;
  const readyCount = sessionList.filter((s) =>
    s?.items?.some((i) => i.status === 'READY')
  ).length;

  return (
    <div className="min-h-screen bg-[#F5F0E7] text-[#211F1B] pb-28 font-sans">
      {/* Top Staff Navigation with Unified Alert Group */}
      <header className="bg-[#211F1B] text-white px-4 py-3 sticky top-0 z-30 shadow-md">
        <div className="max-w-5xl mx-auto flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <BrandMark size="sm" variant="terracotta" />
            <div className="min-w-0 truncate">
              <h1 className="text-sm font-extrabold tracking-tight truncate">
                Francis (Waiter) · Floor View
              </h1>
              <p className="text-[10.5px] text-[#AAA298] truncate">Lake Patio &amp; Dining Area</p>
            </div>
          </div>

          {/* Section 13 & 14: Unified Segmented Alert Group */}
          <div className="inline-flex items-center rounded-xl bg-[#312E29] p-1 border border-[#3E3A34] text-xs font-bold shrink-0 min-h-[36px]">
            <span
              className={`h-7 px-2.5 rounded-lg flex items-center gap-1.5 whitespace-nowrap text-xs font-extrabold transition-all ${
                alertCount > 0
                  ? 'bg-[#DC2626] text-white animate-pulse shadow-xs'
                  : 'text-[#777067]'
              }`}
            >
              <Bell className="w-3.5 h-3.5 shrink-0" />
              <span>{alertCount} Assistance</span>
            </span>

            <div className="w-px h-4 bg-[#4A453E] mx-1 shrink-0" />

            <span
              className={`h-7 px-2.5 rounded-lg flex items-center gap-1.5 whitespace-nowrap text-xs font-extrabold transition-all ${
                readyCount > 0
                  ? 'bg-[#16A34A] text-white shadow-xs'
                  : 'text-[#777067]'
              }`}
            >
              <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
              <span>{readyCount} Ready</span>
            </span>
          </div>
        </div>
      </header>

      {/* Main Floor Workspace */}
      <main className="max-w-5xl mx-auto px-4 pt-4 space-y-3.5">
        {/* Filter Toolbar */}
        <div className="bg-[#FFFDF9] rounded-2xl p-3 border border-[#DDD6CA] shadow-2xs flex flex-wrap items-center justify-between gap-2.5">
          {/* Quick status tabs */}
          <div className="flex items-center gap-1 bg-[#F5F0E7] p-1 rounded-xl overflow-x-auto no-scrollbar">
            {(
              [
                { id: 'all', label: 'All Tables' },
                { id: 'needs_attention', label: 'Needs Action' },
                { id: 'occupied', label: 'Occupied' },
                { id: 'available', label: 'Available' },
              ] as const
            ).map((f) => (
              <button
                key={f.id}
                onClick={() => setStatusFilter(f.id)}
                className={`px-3 py-1.5 text-xs font-bold rounded-lg whitespace-nowrap transition-all cursor-pointer ${
                  statusFilter === f.id
                    ? 'bg-[#211F1B] text-white shadow-2xs'
                    : 'text-[#777067] hover:text-[#211F1B]'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>

          {/* Section Selector */}
          <div className="flex items-center gap-1 overflow-x-auto no-scrollbar">
            {(['All', 'Lake Patio', 'Dining Room', 'Bar Area'] as const).map((sec) => (
              <button
                key={sec}
                onClick={() => setFilterSection(sec)}
                className={`px-2.5 py-1 text-[11px] font-bold rounded-lg whitespace-nowrap transition-all cursor-pointer ${
                  filterSection === sec
                    ? 'bg-[#C9532F] text-white shadow-2xs'
                    : 'text-[#777067] hover:text-[#211F1B] bg-[#EDE8DF]'
                }`}
              >
                {sec}
              </button>
            ))}
          </div>
        </div>

        {/* Tables Card Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {filteredTables.map((table) => {
            const session = sessions[table.id] || {
              status: 'available' as TableStatus,
              items: [],
              assistanceRequests: [],
              guests: [],
              paymentState: 'UNPAID',
              totalAmount: 0,
              lastActiveTime: Date.now(),
              isPaid: false,
            };

            const pendingAssistance = session.assistanceRequests?.filter((r) => r.status === 'pending') || [];
            const readyItems = session.items?.filter((i) => i.status === 'READY') || [];
            const activeItems = session.items?.filter((i) => i.status !== 'VOIDED') || [];
            const isUnattended = session.status === 'unattended';
            const isWaitingPayment = session.paymentState === 'PAYMENT_REQUESTED' || session.status === 'waiting_payment';
            const isReadyToClose = session.paymentState === 'READY_TO_CLOSE' || session.isPaid;
            const lastPayment = session.paymentHistory && session.paymentHistory.length > 0
              ? session.paymentHistory[session.paymentHistory.length - 1]
              : null;
            const paidDisplayAmount = lastPayment?.amount || session.paidAmount || (activeItems.length > 0 ? 27500 : 0);

            return (
              <article
                key={table.id}
                onClick={() => {
                  setActiveTableId(table.id);
                  onSelectTable(table.id);
                }}
                className="bg-[#FFFDF9] rounded-2xl p-4 border border-[#DDD6CA] transition-all cursor-pointer hover:border-[#211F1B] hover:shadow-sm flex flex-col justify-between"
              >
                <div>
                  {/* Top Row: Table Title & Status Badge */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <h3 className="font-extrabold text-base text-[#211F1B] tracking-tight">{table.name}</h3>
                      <span className="text-[11px] text-[#777067] font-mono">({table.section})</span>
                    </div>

                    <StatusBadge status={session.status} size="sm" />
                  </div>

                  {/* Meta: Guests / Seats */}
                  <div className="flex items-center justify-between text-xs text-[#777067] mt-1.5 font-mono">
                    <span className="flex items-center gap-1">
                      <Users className="w-3.5 h-3.5 text-[#AAA298]" />
                      {session.guests?.length > 0 ? session.guests.join(', ') : `${table.capacity} seats`}
                    </span>
                    {session.status !== 'available' && (
                      <span className="tabular-nums">
                        Active {formatTimeAgo(session.lastActiveTime || session.createdAt)}
                      </span>
                    )}
                  </div>

                  {/* Section 15 & 16: Standardized Clean Internal Alert Strips */}
                  <div className="mt-3 space-y-1.5">
                    {/* Red: Action required assistance */}
                    {pendingAssistance.length > 0 && (
                      <div className="p-2.5 bg-[#FEF2F2] border border-[#FECACA] rounded-xl flex items-center justify-between text-xs text-[#991B1B]">
                        <span className="font-extrabold flex items-center gap-1.5">
                          <Bell className="w-3.5 h-3.5 text-[#DC2626] shrink-0 animate-bounce" />
                          <span>{pendingAssistance[0].label}</span>
                        </span>
                        <span className="text-[10px] font-mono font-bold tabular-nums">
                          {formatTimeAgo(pendingAssistance[0].time)}
                        </span>
                      </div>
                    )}

                    {/* Green: Food ready on pass */}
                    {readyItems.length > 0 && (
                      <div className="p-2.5 bg-[#EBF7EE] border border-[#BBF7D0] rounded-xl flex items-center justify-between text-xs text-[#166534]">
                        <span className="font-extrabold flex items-center gap-1.5">
                          <CheckCircle2 className="w-3.5 h-3.5 text-[#16A34A] shrink-0" />
                          <span>{readyItems.length} {readyItems.length === 1 ? 'dish' : 'dishes'} ready to serve</span>
                        </span>
                        <span className="text-[10.5px] font-bold text-[#166534] bg-white px-2 py-0.5 rounded-md border border-[#BBF7D0]">
                          Serve →
                        </span>
                      </div>
                    )}

                    {/* Yellow/Amber: Bill payment requested by customer */}
                    {isWaitingPayment && (
                      <div className="p-2.5 bg-[#FEF9C3] border border-[#FDE047] rounded-xl flex items-center justify-between text-xs text-[#854D0E]">
                        <span className="font-extrabold flex items-center gap-1.5">
                          <Receipt className="w-3.5 h-3.5 text-[#CA8A04] shrink-0" />
                          <span>Bill Requested ({session.paymentMethod || 'Cash/POS'})</span>
                        </span>
                        <span className="text-[10.5px] font-bold text-[#854D0E] bg-white px-2 py-0.5 rounded-md border border-[#FDE047]">
                          Collect →
                        </span>
                      </div>
                    )}

                    {/* Green: Payment received, table ready to clear */}
                    {isReadyToClose && (
                      <div className="p-2.5 bg-[#EBF7EE] border border-[#BBF7D0] rounded-xl flex items-center justify-between text-xs text-[#166534]">
                        <span className="font-extrabold flex items-center gap-1.5">
                          <Check className="w-3.5 h-3.5 text-[#16A34A] shrink-0" />
                          <span>Paid ({formatKwacha(paidDisplayAmount)})</span>
                        </span>
                        <span className="text-[10.5px] font-bold text-[#166534] bg-white px-2 py-0.5 rounded-md border border-[#BBF7D0]">
                          Close Table →
                        </span>
                      </div>
                    )}

                    {/* Purple: Idle table check */}
                    {isUnattended && (
                      <div className="p-2.5 bg-[#FAF5FF] border border-[#E9D5FF] rounded-xl flex items-center gap-1.5 text-xs text-[#6B21A8] font-medium">
                        <AlertTriangle className="w-3.5 h-3.5 text-[#9333EA] shrink-0" />
                        <span>Idle &gt; 30m · Check table satisfaction</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Bottom Row: Running Total & Item Counter */}
                <div className="mt-4 pt-3 border-t border-[#DDD6CA]/60 flex items-center justify-between text-xs">
                  {session.status !== 'available' ? (
                    <>
                      <span className="text-[#777067] font-mono">
                        {activeItems.length} {activeItems.length === 1 ? 'item' : 'items'}
                      </span>
                      <div className="flex items-center gap-1.5">
                        <span className="font-extrabold text-[#211F1B] font-mono tabular-nums text-sm">
                          {formatKwacha(session.totalAmount || 0)}
                        </span>
                        <ChevronRight className="w-4 h-4 text-[#AAA298]" />
                      </div>
                    </>
                  ) : (
                    <span className="text-[#AAA298] italic text-[11px]">Table empty · Ready for guests</span>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      </main>
    </div>
  );
}
