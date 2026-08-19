import React, { useState } from 'react';
import { useRestaurant } from '../../context/RestaurantContext';
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
} from 'lucide-react';
import { BrandMark } from '../common/BrandMark';

export function KitchenDisplayBoard() {
  const { sessions, updateItemStatus } = useRestaurant();
  const [stationFilter, setStationFilter] = useState<Station | 'all'>('all');

  // Gather all active items across all sessions
  const allOrderItems: {
    tableId: string;
    tableName: string;
    item: OrderItem;
  }[] = [];

  (Object.entries(sessions) as [string, TableSession][]).forEach(([tableId, session]) => {
    if (session && session.items) {
      session.items.forEach((item) => {
        if (item.status !== 'SERVED' && item.status !== 'VOIDED') {
          allOrderItems.push({
            tableId,
            tableName: session.tableName,
            item,
          });
        }
      });
    }
  });

  // Filter by station
  const filteredItems = allOrderItems.filter((entry) => {
    if (stationFilter === 'all') return true;
    return entry.item.station === stationFilter;
  });

  // 3 KDS production columns
  const newItems = filteredItems.filter(
    (e) => e.item.status === 'PLACED' || e.item.status === 'ACCEPTED'
  );
  const preparingItems = filteredItems.filter((e) => e.item.status === 'PREPARING');
  const readyItems = filteredItems.filter((e) => e.item.status === 'READY');

  const handleCardClick = (tableId: string, orderItemId: string, currentStatus: ItemStatus) => {
    if (currentStatus === 'PLACED' || currentStatus === 'ACCEPTED') {
      updateItemStatus(tableId, orderItemId, 'PREPARING');
    } else if (currentStatus === 'PREPARING') {
      updateItemStatus(tableId, orderItemId, 'READY');
    } else if (currentStatus === 'READY') {
      updateItemStatus(tableId, orderItemId, 'SERVED');
    }
  };

  return (
    <div className="min-h-screen bg-[#141210] text-[#F5F2EC] flex flex-col font-sans">
      {/* High-Contrast Top Bar */}
      <header className="bg-[#1E1B18] border-b border-stone-800 px-6 py-3.5 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <BrandMark size="md" variant="terracotta" />
          <div>
            <h1 className="text-base font-extrabold tracking-tight text-white flex items-center gap-2">
              <span>Kitchen &amp; Bar Station KDS</span>
              <span className="text-[10px] bg-emerald-500/20 text-emerald-400 font-mono px-2 py-0.5 rounded-full border border-emerald-500/30">
                LIVE DISPATCH
              </span>
            </h1>
            <p className="text-[11px] text-stone-400 font-mono">Tap ticket to advance cooking phase</p>
          </div>
        </div>

        {/* Station Filter Tabs */}
        <div className="flex items-center gap-2">
          <div className="flex bg-[#26221E] p-1 rounded-xl border border-stone-700">
            <button
              onClick={() => setStationFilter('all')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-extrabold transition-all cursor-pointer ${
                stationFilter === 'all'
                  ? 'bg-[#C9532F] text-white shadow-xs'
                  : 'text-stone-300 hover:text-white'
              }`}
            >
              All ({filteredItems.length})
            </button>
            <button
              onClick={() => setStationFilter('kitchen')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-extrabold flex items-center gap-1.5 transition-all cursor-pointer ${
                stationFilter === 'kitchen'
                  ? 'bg-[#C9532F] text-white shadow-xs'
                  : 'text-stone-300 hover:text-white'
              }`}
            >
              <Flame className="w-3.5 h-3.5" />
              <span>Kitchen</span>
            </button>
            <button
              onClick={() => setStationFilter('bar')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-extrabold flex items-center gap-1.5 transition-all cursor-pointer ${
                stationFilter === 'bar'
                  ? 'bg-[#C9532F] text-white shadow-xs'
                  : 'text-stone-300 hover:text-white'
              }`}
            >
              <Wine className="w-3.5 h-3.5" />
              <span>Bar Station</span>
            </button>
          </div>
        </div>
      </header>

      {/* 3-Column Wall Display Board (Screen 8) */}
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
              newItems.map(({ tableId, tableName, item }) => (
                <div
                  key={item.orderItemId}
                  onClick={() => handleCardClick(tableId, item.orderItemId, item.status)}
                  className="bg-[#26211C] hover:bg-[#2F2923] border-2 border-sky-500/40 hover:border-sky-400 rounded-2xl p-4 transition-all cursor-pointer shadow-md group select-none"
                >
                  <div className="flex items-start justify-between gap-2">
                    <span className="text-xs font-black bg-sky-500 text-black px-2.5 py-1 rounded-lg font-mono">
                      {tableName}
                    </span>
                    <span className="text-xs text-stone-400 flex items-center gap-1 font-mono tabular-nums">
                      <Clock className="w-3.5 h-3.5 text-stone-400" />
                      {formatTimeAgo(item.timestamp)}
                    </span>
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
              preparingItems.map(({ tableId, tableName, item }) => (
                <div
                  key={item.orderItemId}
                  onClick={() => handleCardClick(tableId, item.orderItemId, item.status)}
                  className="bg-[#2A221B] hover:bg-[#342B22] border-2 border-[#C9532F] rounded-2xl p-4 transition-all cursor-pointer shadow-lg group select-none"
                >
                  <div className="flex items-start justify-between gap-2">
                    <span className="text-xs font-black bg-[#C9532F] text-white px-2.5 py-1 rounded-lg font-mono shadow-xs">
                      {tableName}
                    </span>
                    <span className="text-xs text-[#F0D8CC] font-mono font-bold tabular-nums flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" />
                      {formatTimeAgo(item.timestamp)}
                    </span>
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
                    <span className="text-stone-400 text-[11px]">Station: {item.station}</span>
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
              readyItems.map(({ tableId, tableName, item }) => (
                <div
                  key={item.orderItemId}
                  onClick={() => handleCardClick(tableId, item.orderItemId, item.status)}
                  className="bg-[#1B291F] hover:bg-[#213527] border-2 border-emerald-500/80 rounded-2xl p-4 transition-all cursor-pointer shadow-md group select-none"
                >
                  <div className="flex items-start justify-between gap-2">
                    <span className="text-xs font-black bg-emerald-600 text-white px-2.5 py-1 rounded-lg font-mono">
                      {tableName}
                    </span>
                    <span className="text-xs text-emerald-400 font-bold font-mono">
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
    </div>
  );
}
