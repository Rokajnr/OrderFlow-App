import React, { useState, useEffect } from 'react';
import { useRestaurant } from '../../context/RestaurantContext';
import { useTenant } from '../../context/TenantContext';
import { ItemStatus, Station, TableSession, OrderItem } from '../../types';
import { formatTimeAgo } from '../../utils/formatters';
import {
  ChefHat,
  Flame,
  CheckCircle2,
  Clock,
  Wine,
  Check,
  AlertOctagon,
  ArrowRight,
  Volume2,
  VolumeX,
  Layers,
  LayoutGrid,
  Zap,
  Timer,
  AlertTriangle,
  RotateCcw,
} from 'lucide-react';
import { BrandMark } from '../common/BrandMark';

type KdsViewMode = 'items' | 'expediter';

export function KitchenDisplayBoard() {
  const { tenant } = useTenant();
  const { sessions, updateItemStatus } = useRestaurant();
  const [stationFilter, setStationFilter] = useState<Station | 'all'>('all');
  const [viewMode, setViewMode] = useState<KdsViewMode>('items');
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const [now, setNow] = useState<number>(Date.now());

  // Tick every 10 seconds for precise ticket urgency aging
  useEffect(() => {
    const timer = setInterval(() => {
      setNow(Date.now());
    }, 10000);
    return () => clearInterval(timer);
  }, []);

  // Gather all active items across all sessions
  const allOrderItems: {
    tableId: string;
    tableName: string;
    item: OrderItem;
    ageMinutes: number;
  }[] = [];

  // Group by table for Expediter Ticket mode
  const tableTickets: {
    tableId: string;
    tableName: string;
    items: OrderItem[];
    oldestTimestamp: number;
    ageMinutes: number;
    hasAllergies: boolean;
  }[] = [];

  (Object.entries(sessions) as [string, TableSession][]).forEach(([tableId, session]) => {
    if (session && session.items) {
      const activeTableItems: OrderItem[] = [];
      let oldest = Date.now();
      let hasAllergies = false;

      session.items.forEach((item) => {
        if (item.status !== 'SERVED' && item.status !== 'VOIDED') {
          const ageMin = Math.max(0, Math.floor((now - (item.timestamp || Date.now())) / 60000));
          if (item.timestamp < oldest) oldest = item.timestamp;
          if (item.notes && item.notes.trim().length > 0) hasAllergies = true;

          allOrderItems.push({
            tableId,
            tableName: session.tableName,
            item,
            ageMinutes: ageMin,
          });

          if (stationFilter === 'all' || item.station === stationFilter) {
            activeTableItems.push(item);
          }
        }
      });

      if (activeTableItems.length > 0) {
        const tableAgeMin = Math.max(0, Math.floor((now - oldest) / 60000));
        tableTickets.push({
          tableId,
          tableName: session.tableName,
          items: activeTableItems,
          oldestTimestamp: oldest,
          ageMinutes: tableAgeMin,
          hasAllergies,
        });
      }
    }
  });

  // Sort tickets by oldest first (FIFO - First In First Out)
  tableTickets.sort((a, b) => a.oldestTimestamp - b.oldestTimestamp);

  // Filter individual items by station
  const filteredItems = allOrderItems.filter((entry) => {
    if (stationFilter === 'all') return true;
    return entry.item.station === stationFilter;
  });

  // Production columns
  const newItems = filteredItems.filter(
    (e) => e.item.status === 'PLACED' || e.item.status === 'ACCEPTED'
  );
  const preparingItems = filteredItems.filter((e) => e.item.status === 'PREPARING');
  const readyItems = filteredItems.filter((e) => e.item.status === 'READY');

  // Overdue count (> 12 mins)
  const overdueCount = filteredItems.filter((e) => e.ageMinutes >= 12).length;

  const handleCardClick = (tableId: string, orderItemId: string, currentStatus: ItemStatus) => {
    if (currentStatus === 'PLACED' || currentStatus === 'ACCEPTED') {
      updateItemStatus(tableId, orderItemId, 'PREPARING');
    } else if (currentStatus === 'PREPARING') {
      updateItemStatus(tableId, orderItemId, 'READY');
    } else if (currentStatus === 'READY') {
      updateItemStatus(tableId, orderItemId, 'SERVED');
    }
  };

  // Expediter table batch actions
  const handleBatchAdvanceTable = (tableId: string, targetStatus: ItemStatus) => {
    const session = sessions[tableId];
    if (!session) return;
    session.items.forEach((item) => {
      if (item.status !== 'SERVED' && item.status !== 'VOIDED') {
        if (targetStatus === 'PREPARING' && (item.status === 'PLACED' || item.status === 'ACCEPTED')) {
          updateItemStatus(tableId, item.orderItemId, 'PREPARING');
        } else if (targetStatus === 'READY' && item.status === 'PREPARING') {
          updateItemStatus(tableId, item.orderItemId, 'READY');
        } else if (targetStatus === 'SERVED' && item.status === 'READY') {
          updateItemStatus(tableId, item.orderItemId, 'SERVED');
        }
      }
    });
  };

  const getUrgencyBadge = (ageMin: number) => {
    if (ageMin >= 12) {
      return (
        <span className="text-[10px] font-black font-mono bg-rose-500/25 text-rose-300 px-2 py-0.5 rounded-md border border-rose-500/40 animate-pulse flex items-center gap-1">
          <Flame className="w-3 h-3 text-rose-400" />
          <span>{ageMin}m OVERDUE</span>
        </span>
      );
    }
    if (ageMin >= 5) {
      return (
        <span className="text-[10px] font-black font-mono bg-amber-500/20 text-amber-300 px-2 py-0.5 rounded-md border border-amber-500/30 flex items-center gap-1">
          <Clock className="w-3 h-3 text-amber-400" />
          <span>{ageMin}m PREP</span>
        </span>
      );
    }
    return (
      <span className="text-[10px] font-bold font-mono bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded-md border border-emerald-500/30 flex items-center gap-1">
        <Timer className="w-3 h-3 text-emerald-400" />
        <span>{ageMin}m FRESH</span>
      </span>
    );
  };

  return (
    <div className="min-h-screen bg-[#141210] text-[#F5F2EC] flex flex-col font-sans">
      {/* High-Contrast Top Bar */}
      <header className="bg-[#1E1B18] border-b border-stone-800 px-4 lg:px-6 py-3 flex flex-wrap items-center justify-between gap-3 sticky top-0 z-20">
        <div className="flex items-center gap-3">
          <BrandMark size="md" variant="terracotta" />
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base font-black tracking-tight text-white flex items-center gap-2">
                <span>{tenant.name} · Kitchen &amp; Bar KDS</span>
              </h1>
              <span className="text-[10px] bg-emerald-500/20 text-emerald-400 font-mono px-2 py-0.5 rounded-full border border-emerald-500/30 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                <span>LIVE DISPATCH</span>
              </span>
            </div>
            <p className="text-[11px] text-stone-400 font-mono">
              FIFO Order Dispatch · Tap cards to bump cooking stages
            </p>
          </div>
        </div>

        {/* Action Controls: View Mode, Audio, Station Filter */}
        <div className="flex flex-wrap items-center gap-2">
          
          {/* Mode Switcher: Single Items vs Expediter Table Tickets */}
          <div className="flex bg-[#26221E] p-1 rounded-xl border border-stone-700">
            <button
              onClick={() => setViewMode('items')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                viewMode === 'items'
                  ? 'bg-[#C9532F] text-white shadow-xs'
                  : 'text-stone-300 hover:text-white'
              }`}
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span>Station View</span>
            </button>
            <button
              onClick={() => setViewMode('expediter')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                viewMode === 'expediter'
                  ? 'bg-[#C9532F] text-white shadow-xs'
                  : 'text-stone-300 hover:text-white'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Expediter Tickets ({tableTickets.length})</span>
            </button>
          </div>

          {/* Station Filter Tabs */}
          <div className="flex bg-[#26221E] p-1 rounded-xl border border-stone-700">
            <button
              onClick={() => setStationFilter('all')}
              className={`px-3 py-1.5 rounded-lg text-xs font-extrabold transition-all cursor-pointer ${
                stationFilter === 'all'
                  ? 'bg-stone-700 text-white'
                  : 'text-stone-400 hover:text-white'
              }`}
            >
              All ({filteredItems.length})
            </button>
            <button
              onClick={() => setStationFilter('kitchen')}
              className={`px-3 py-1.5 rounded-lg text-xs font-extrabold flex items-center gap-1 transition-all cursor-pointer ${
                stationFilter === 'kitchen'
                  ? 'bg-stone-700 text-white'
                  : 'text-stone-400 hover:text-white'
              }`}
            >
              <Flame className="w-3 h-3 text-[#E07A5F]" />
              <span>Hot Kitchen</span>
            </button>
            <button
              onClick={() => setStationFilter('bar')}
              className={`px-3 py-1.5 rounded-lg text-xs font-extrabold flex items-center gap-1 transition-all cursor-pointer ${
                stationFilter === 'bar'
                  ? 'bg-stone-700 text-white'
                  : 'text-stone-400 hover:text-white'
              }`}
            >
              <Wine className="w-3 h-3 text-sky-400" />
              <span>Bar &amp; Dispense</span>
            </button>
          </div>

          {/* Audio Chime Mute/Unmute */}
          <button
            onClick={() => setSoundEnabled(!soundEnabled)}
            className={`p-2 rounded-xl border transition-colors cursor-pointer ${
              soundEnabled
                ? 'bg-stone-800 border-stone-700 text-emerald-400 hover:bg-stone-700'
                : 'bg-stone-900 border-stone-800 text-stone-500 hover:text-stone-300'
            }`}
            title={soundEnabled ? 'Kitchen Bell Enabled' : 'Kitchen Bell Muted'}
          >
            {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
          </button>
        </div>
      </header>

      {/* Overdue Alert Banner if orders are > 12 mins */}
      {overdueCount > 0 && (
        <div className="bg-rose-950/80 border-b border-rose-700/60 px-6 py-2 flex items-center justify-between text-xs text-rose-200">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-rose-400 animate-bounce" />
            <span className="font-bold">
              {overdueCount} item{overdueCount > 1 ? 's are' : ' is'} waiting over 12 minutes!
            </span>
          </div>
          <span className="text-[11px] font-mono text-rose-300">Expedite station immediately</span>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODE A: 3-COLUMN STATION WALL DISPLAY BOARD */}
      {/* ========================================================================= */}
      {viewMode === 'items' && (
        <main className="flex-1 p-4 lg:p-6 grid grid-cols-1 md:grid-cols-3 gap-4 lg:gap-6 overflow-x-auto">
          
          {/* COLUMN 1: NEW (PLACED / ACCEPTED) */}
          <section className="bg-[#1C1916] rounded-3xl p-4 border border-stone-800 flex flex-col">
            <div className="flex items-center justify-between pb-3 mb-3 border-b border-stone-800">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-sky-400" />
                <h2 className="text-sm font-black uppercase tracking-wider text-white">
                  1 — New Orders
                </h2>
              </div>
              <span className="text-xs font-bold font-mono bg-sky-400/20 text-sky-300 px-2.5 py-0.5 rounded-full border border-sky-400/30">
                {newItems.length}
              </span>
            </div>

            <div className="flex-1 space-y-3 overflow-y-auto max-h-[calc(100vh-210px)] pr-1">
              {newItems.length === 0 ? (
                <div className="h-48 flex flex-col items-center justify-center text-stone-600">
                  <Check className="w-8 h-8 mb-2 opacity-30" />
                  <span className="text-xs font-semibold">Queue clear</span>
                </div>
              ) : (
                newItems.map(({ tableId, tableName, item, ageMinutes }) => (
                  <div
                    key={item.orderItemId}
                    onClick={() => handleCardClick(tableId, item.orderItemId, item.status)}
                    className="bg-[#26211C] hover:bg-[#2F2923] border-2 border-sky-500/40 hover:border-sky-400 rounded-2xl p-4 transition-all cursor-pointer shadow-md group select-none relative overflow-hidden"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <span className="text-xs font-black bg-sky-500 text-black px-2.5 py-1 rounded-lg font-mono">
                        {tableName}
                      </span>
                      {getUrgencyBadge(ageMinutes)}
                    </div>

                    <div className="mt-3">
                      <div className="flex items-baseline gap-2">
                        <span className="text-2xl font-black text-white font-mono">{item.quantity}×</span>
                        <h3 className="text-base font-bold text-stone-100 leading-tight">
                          {item.name}
                        </h3>
                      </div>

                      {item.selectedAddOns && item.selectedAddOns.length > 0 && (
                        <div className="mt-1 text-xs text-stone-300 font-medium">
                          + {item.selectedAddOns.map((a) => a.name).join(', ')}
                        </div>
                      )}

                      {item.notes && (
                        <div className="mt-2 p-2 bg-red-950/70 border border-red-700/60 rounded-xl text-xs font-bold text-red-200 flex items-center gap-1.5">
                          <AlertOctagon className="w-4 h-4 text-red-400 shrink-0" />
                          <span>{item.notes}</span>
                        </div>
                      )}
                    </div>

                    <div className="mt-4 pt-3 border-t border-stone-700/50 flex items-center justify-between text-xs text-stone-400">
                      <span className="text-[11px]">Guest: {item.orderedBy}</span>
                      <div className="flex items-center gap-1 text-sky-400 font-bold group-hover:translate-x-1 transition-transform">
                        <span>Start Prep</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </section>

          {/* COLUMN 2: PREPARING */}
          <section className="bg-[#1C1916] rounded-3xl p-4 border border-stone-800 flex flex-col">
            <div className="flex items-center justify-between pb-3 mb-3 border-b border-stone-800">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-[#C9532F] animate-pulse" />
                <h2 className="text-sm font-black uppercase tracking-wider text-white">
                  2 — Cooking / Preparing
                </h2>
              </div>
              <span className="text-xs font-bold font-mono bg-[#C9532F]/20 text-[#F0D8CC] px-2.5 py-0.5 rounded-full border border-[#C9532F]/30">
                {preparingItems.length}
              </span>
            </div>

            <div className="flex-1 space-y-3 overflow-y-auto max-h-[calc(100vh-210px)] pr-1">
              {preparingItems.length === 0 ? (
                <div className="h-48 flex flex-col items-center justify-center text-stone-600">
                  <Flame className="w-8 h-8 mb-2 opacity-30" />
                  <span className="text-xs font-semibold">No items cooking</span>
                </div>
              ) : (
                preparingItems.map(({ tableId, tableName, item, ageMinutes }) => (
                  <div
                    key={item.orderItemId}
                    onClick={() => handleCardClick(tableId, item.orderItemId, item.status)}
                    className="bg-[#2A221B] hover:bg-[#342B22] border-2 border-[#C9532F] rounded-2xl p-4 transition-all cursor-pointer shadow-lg group select-none relative overflow-hidden"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <span className="text-xs font-black bg-[#C9532F] text-white px-2.5 py-1 rounded-lg font-mono shadow-xs">
                        {tableName}
                      </span>
                      {getUrgencyBadge(ageMinutes)}
                    </div>

                    <div className="mt-3">
                      <div className="flex items-baseline gap-2">
                        <span className="text-2xl font-black text-white font-mono">{item.quantity}×</span>
                        <h3 className="text-base font-bold text-white leading-tight">{item.name}</h3>
                      </div>

                      {item.selectedAddOns && item.selectedAddOns.length > 0 && (
                        <div className="mt-1 text-xs text-stone-300 font-medium">
                          + {item.selectedAddOns.map((a) => a.name).join(', ')}
                        </div>
                      )}

                      {item.notes && (
                        <div className="mt-2 p-2 bg-red-950/80 border border-red-600/70 rounded-xl text-xs font-bold text-red-200 flex items-center gap-1.5">
                          <AlertOctagon className="w-4 h-4 text-red-400 shrink-0" />
                          <span>{item.notes}</span>
                        </div>
                      )}
                    </div>

                    <div className="mt-4 pt-3 border-t border-stone-700/60 flex items-center justify-between text-xs">
                      <span className="text-stone-400 text-[11px] capitalize">Station: {item.station}</span>
                      <div className="flex items-center gap-1 text-emerald-400 font-bold group-hover:scale-105 transition-transform">
                        <span>Ready to Pass ✓</span>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </section>

          {/* COLUMN 3: READY (PICKUP / SERVE) */}
          <section className="bg-[#1C1916] rounded-3xl p-4 border border-stone-800 flex flex-col">
            <div className="flex items-center justify-between pb-3 mb-3 border-b border-stone-800">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                <h2 className="text-sm font-black uppercase tracking-wider text-white">
                  3 — Ready For Server
                </h2>
              </div>
              <span className="text-xs font-bold font-mono bg-emerald-500/20 text-emerald-300 px-2.5 py-0.5 rounded-full border border-emerald-500/30">
                {readyItems.length}
              </span>
            </div>

            <div className="flex-1 space-y-3 overflow-y-auto max-h-[calc(100vh-210px)] pr-1">
              {readyItems.length === 0 ? (
                <div className="h-48 flex flex-col items-center justify-center text-stone-600">
                  <CheckCircle2 className="w-8 h-8 mb-2 opacity-30" />
                  <span className="text-xs font-semibold">Pass is clear</span>
                </div>
              ) : (
                readyItems.map(({ tableId, tableName, item, ageMinutes }) => (
                  <div
                    key={item.orderItemId}
                    onClick={() => handleCardClick(tableId, item.orderItemId, item.status)}
                    className="bg-[#1B291F] hover:bg-[#213527] border-2 border-emerald-500/80 rounded-2xl p-4 transition-all cursor-pointer shadow-md group select-none"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <span className="text-xs font-black bg-emerald-600 text-white px-2.5 py-1 rounded-lg font-mono">
                        {tableName}
                      </span>
                      <span className="text-[10px] bg-emerald-500/20 text-emerald-300 font-mono font-bold px-2 py-0.5 rounded-md">
                        READY AT PASS
                      </span>
                    </div>

                    <div className="mt-3">
                      <div className="flex items-baseline gap-2">
                        <span className="text-2xl font-black text-white font-mono">{item.quantity}×</span>
                        <h3 className="text-base font-bold text-white leading-tight">{item.name}</h3>
                      </div>
                    </div>

                    <div className="mt-4 pt-3 border-t border-emerald-800/40 flex items-center justify-between text-xs text-stone-300">
                      <span className="text-[11px]">Server notified</span>
                      <div className="flex items-center gap-1 text-emerald-400 font-bold">
                        <span>Delivered → Clear</span>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </section>
        </main>
      )}

      {/* ========================================================================= */}
      {/* MODE B: EXPEDITER TABLE ORDER TICKETS (BATCH VIEW) */}
      {/* ========================================================================= */}
      {viewMode === 'expediter' && (
        <main className="flex-1 p-4 lg:p-6 overflow-y-auto">
          <div className="max-w-6xl mx-auto space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-black text-white">
                  Expediter Order Tickets (FIFO Queue)
                </h2>
                <p className="text-xs text-stone-400">
                  Manage entire table courses and bump tickets directly to floor servers
                </p>
              </div>
              <span className="text-xs font-mono font-bold text-stone-400">
                {tableTickets.length} Active Tables in Production
              </span>
            </div>

            {tableTickets.length === 0 ? (
              <div className="p-12 bg-[#1C1916] rounded-3xl border border-stone-800 text-center space-y-2">
                <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto opacity-80" />
                <h3 className="text-base font-bold text-white">All Kitchen Tickets Cleared</h3>
                <p className="text-xs text-stone-400">No active dishes currently waiting in production.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {tableTickets.map((ticket) => {
                  const unreadyCount = ticket.items.filter((i) => i.status !== 'READY').length;
                  const isAllReady = unreadyCount === 0;

                  return (
                    <div
                      key={ticket.tableId}
                      className="bg-[#1E1B18] border border-stone-700 rounded-3xl p-5 shadow-xl flex flex-col justify-between space-y-4 relative"
                    >
                      <div>
                        {/* Ticket Header */}
                        <div className="flex items-start justify-between pb-3 border-b border-stone-800">
                          <div>
                            <span className="text-base font-black text-white font-mono">
                              {ticket.tableName}
                            </span>
                            <div className="text-[11px] text-stone-400 font-mono">
                              Ordered {formatTimeAgo(ticket.oldestTimestamp)}
                            </div>
                          </div>
                          {getUrgencyBadge(ticket.ageMinutes)}
                        </div>

                        {/* Allergy warning if present */}
                        {ticket.hasAllergies && (
                          <div className="mt-2.5 p-2 bg-red-950/70 border border-red-700/60 rounded-xl text-[11px] font-bold text-red-200 flex items-center gap-1.5">
                            <AlertOctagon className="w-3.5 h-3.5 text-red-400 shrink-0" />
                            <span>Special Diet / Kitchen Notes Present</span>
                          </div>
                        )}

                        {/* Item lines */}
                        <div className="mt-3 space-y-2">
                          {ticket.items.map((item) => (
                            <div
                              key={item.orderItemId}
                              onClick={() => handleCardClick(ticket.tableId, item.orderItemId, item.status)}
                              className={`p-2 rounded-xl border flex items-center justify-between gap-2 cursor-pointer transition-all ${
                                item.status === 'READY'
                                  ? 'bg-emerald-950/30 border-emerald-600/60 text-emerald-200'
                                  : item.status === 'PREPARING'
                                  ? 'bg-[#C9532F]/15 border-[#C9532F]/50 text-stone-100'
                                  : 'bg-stone-900/60 border-stone-800 text-stone-300'
                              }`}
                            >
                              <div className="flex items-center gap-2">
                                <span className="font-mono font-bold text-sm">{item.quantity}×</span>
                                <div>
                                  <span className="font-semibold text-xs leading-tight block">
                                    {item.name}
                                  </span>
                                  {item.notes && (
                                    <span className="text-[10px] text-rose-300 font-bold block">
                                      ⚠ {item.notes}
                                    </span>
                                  )}
                                </div>
                              </div>
                              <span className="text-[10px] font-mono font-bold uppercase px-1.5 py-0.5 rounded bg-stone-800">
                                {item.status}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Expediter Batch Actions */}
                      <div className="pt-3 border-t border-stone-800 grid grid-cols-2 gap-2">
                        <button
                          type="button"
                          onClick={() => handleBatchAdvanceTable(ticket.tableId, 'READY')}
                          className="py-2 px-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1 transition-colors cursor-pointer"
                        >
                          <Check className="w-3.5 h-3.5" />
                          <span>Pass All Ready</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleBatchAdvanceTable(ticket.tableId, 'SERVED')}
                          className="py-2 px-3 bg-stone-800 hover:bg-stone-700 text-stone-200 rounded-xl text-xs font-bold flex items-center justify-center gap-1 transition-colors cursor-pointer"
                        >
                          <Zap className="w-3.5 h-3.5 text-amber-400" />
                          <span>Clear to Floor</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </main>
      )}
    </div>
  );
}
