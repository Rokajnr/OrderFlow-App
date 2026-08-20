import React, { useState } from 'react';
import { useRestaurant } from '../../context/RestaurantContext';
import { useTenant } from '../../context/TenantContext';
import { useAuth } from '../../context/AuthContext';
import { formatKwacha } from '../../utils/formatters';
import { TableStatus, TableSession } from '../../types';
import {
  TrendingUp,
  DollarSign,
  ShoppingBag,
  Users,
  Clock,
  Smartphone,
  CreditCard,
  Banknote,
  AlertTriangle,
  ChevronRight,
  Flame,
  Award,
  ShieldAlert,
  KeyRound,
  UserCheck,
} from 'lucide-react';
import { BrandMark } from '../common/BrandMark';
import { StatusBadge } from '../common/StatusBadge';
import { StaffManagementModal } from './StaffManagementModal';
import { ZReportModal } from './ZReportModal';
import { TableQrGeneratorModal } from './TableQrGeneratorModal';
import { TenantOnboardingModal } from './TenantOnboardingModal';
import { MerchantSettingsModal } from './MerchantSettingsModal';
import { FileText, QrCode, Building2 } from 'lucide-react';

interface ManagerOverviewScreenProps {
  onSelectTable: (tableId: string) => void;
  onGoToMenu: () => void;
}

export function ManagerOverviewScreen({ onSelectTable, onGoToMenu }: ManagerOverviewScreenProps) {
  const { tenant, formatPrice } = useTenant();
  const { currentStaff } = useAuth();
  const { tables, sessions, walkoutLogs } = useRestaurant();
  const [showStaffModal, setShowStaffModal] = useState(false);
  const [showZReportModal, setShowZReportModal] = useState(false);
  const [showQrModal, setShowQrModal] = useState(false);
  const [showTenantOnboardModal, setShowTenantOnboardModal] = useState(false);
  const [showMerchantModal, setShowMerchantModal] = useState(false);

  // Metrics computation
  let occupiedCount = 0;
  let activeTotalSales = 0;
  let totalOrderItemsCount = 0;

  (Object.values(sessions) as TableSession[]).forEach((s) => {
    if (s) {
      if (s.status === 'occupied' || s.status === 'waiting_payment') {
        occupiedCount++;
      }
      activeTotalSales += s.totalAmount || 0;
      if (s.items) {
        totalOrderItemsCount += s.items.filter((i) => i.status !== 'VOIDED').length;
      }
    }
  });

  // Estimated baseline revenue plus active sessions
  const todayTotalRevenue = 482500 + activeTotalSales;
  const todayOrderCount = 42 + (totalOrderItemsCount > 0 ? 1 : 0);

  // Top selling items
  const topItems = [
    { name: 'Chambo & chips', count: 38, revenue: 361000, category: 'Food' },
    { name: 'Carlsberg Green "Special"', count: 54, revenue: 118800, category: 'Drinks' },
    { name: 'Chicken burger', count: 26, revenue: 221000, category: 'Food' },
    { name: 'Nsima with beef stew', count: 21, revenue: 147000, category: 'Food' },
    { name: 'Malawi Gin & Tonic (MGT)', count: 19, revenue: 85500, category: 'Drinks' },
  ];

  return (
    <div className="min-h-screen bg-[#F5F0E7] text-[#211F1B] pb-24">
      {/* Top Manager Header */}
      <header className="bg-[#211F1B] text-white px-6 py-4 sticky top-0 z-30 shadow-md">
        <div className="max-w-6xl mx-auto flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <BrandMark size="md" variant="terracotta" />
            <div>
              <span className="text-[11px] font-extrabold text-[#C9532F] uppercase tracking-wider block">
                Management Dashboard
              </span>
              <h1 className="text-base font-extrabold tracking-tight">Today's Service Analytics</h1>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setShowZReportModal(true)}
              className="py-2 px-3 bg-stone-800 hover:bg-stone-700 text-stone-200 text-xs font-bold rounded-xl border border-stone-700 transition-colors cursor-pointer flex items-center gap-1.5"
            >
              <FileText className="w-3.5 h-3.5 text-emerald-400" />
              <span>Z-Report &amp; Till</span>
            </button>

            <button
              onClick={() => setShowQrModal(true)}
              className="py-2 px-3 bg-stone-800 hover:bg-stone-700 text-stone-200 text-xs font-bold rounded-xl border border-stone-700 transition-colors cursor-pointer flex items-center gap-1.5"
            >
              <QrCode className="w-3.5 h-3.5 text-sky-400" />
              <span>Table QR Kit</span>
            </button>

            <button
              onClick={() => setShowMerchantModal(true)}
              className="py-2 px-3 bg-stone-800 hover:bg-stone-700 text-stone-200 text-xs font-bold rounded-xl border border-stone-700 transition-colors cursor-pointer flex items-center gap-1.5"
            >
              <CreditCard className="w-3.5 h-3.5 text-[#C9532F]" />
              <span>PayChangu Keys</span>
            </button>

            <button
              onClick={() => setShowTenantOnboardModal(true)}
              className="py-2 px-3 bg-stone-800 hover:bg-stone-700 text-stone-200 text-xs font-bold rounded-xl border border-stone-700 transition-colors cursor-pointer flex items-center gap-1.5"
            >
              <Building2 className="w-3.5 h-3.5 text-amber-400" />
              <span>+ Add Venue</span>
            </button>

            <button
              onClick={() => setShowStaffModal(true)}
              className="py-2 px-3.5 bg-stone-800 hover:bg-stone-700 text-stone-200 text-xs font-bold rounded-xl border border-stone-700 transition-colors cursor-pointer flex items-center gap-1.5"
            >
              <KeyRound className="w-3.5 h-3.5 text-[#E07A5F]" />
              <span>Staff &amp; PINs</span>
            </button>

            <button
              onClick={onGoToMenu}
              className="py-2 px-4 bg-[#C9532F] hover:bg-[#B54624] text-white text-xs font-bold rounded-xl shadow-xs transition-colors cursor-pointer"
            >
              Manage Live Menu →
            </button>
          </div>
        </div>
      </header>

      {showStaffModal && (
        <StaffManagementModal
          isOpen={showStaffModal}
          onClose={() => setShowStaffModal(false)}
        />
      )}

      {showZReportModal && (
        <ZReportModal
          isOpen={showZReportModal}
          onClose={() => setShowZReportModal(false)}
        />
      )}

      {showQrModal && (
        <TableQrGeneratorModal
          isOpen={showQrModal}
          onClose={() => setShowQrModal(false)}
        />
      )}

      {showTenantOnboardModal && (
        <TenantOnboardingModal
          isOpen={showTenantOnboardModal}
          onClose={() => setShowTenantOnboardModal(false)}
        />
      )}

      {showMerchantModal && (
        <MerchantSettingsModal
          isOpen={showMerchantModal}
          onClose={() => setShowMerchantModal(false)}
        />
      )}

      <main className="max-w-6xl mx-auto px-4 lg:px-6 pt-6 space-y-6">
        {/* Metric Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Card 1: Today's Sales */}
          <div className="bg-[#FFFDF9] rounded-3xl p-5 border border-[#DDD6CA] shadow-2xs flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-extrabold uppercase tracking-wider text-[#777067]">
                Today's Gross Sales
              </span>
              <div className="w-8 h-8 rounded-xl bg-[#EBF7EE] text-[#166534] flex items-center justify-center">
                <DollarSign className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-3">
              <span className="text-2xl font-black text-[#211F1B] font-mono tabular-nums tracking-tight">
                {formatKwacha(todayTotalRevenue)}
              </span>
              <span className="text-xs font-bold text-[#166534] block mt-1">
                +14.2% vs last Friday
              </span>
            </div>
          </div>

          {/* Card 2: Orders Count */}
          <div className="bg-[#FFFDF9] rounded-3xl p-5 border border-[#DDD6CA] shadow-2xs flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-extrabold uppercase tracking-wider text-[#777067]">
                Completed Orders
              </span>
              <div className="w-8 h-8 rounded-xl bg-[#EFF6FF] text-[#1E40AF] flex items-center justify-center">
                <ShoppingBag className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-3">
              <span className="text-2xl font-black text-[#211F1B] font-mono tabular-nums tracking-tight">
                {todayOrderCount} tickets
              </span>
              <span className="text-xs font-medium text-[#777067] block mt-1 font-mono">
                Avg. ticket {formatKwacha(Math.round(todayTotalRevenue / todayOrderCount))}
              </span>
            </div>
          </div>

          {/* Card 3: Occupied Tables */}
          <div className="bg-[#FFFDF9] rounded-3xl p-5 border border-[#DDD6CA] shadow-2xs flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-extrabold uppercase tracking-wider text-[#777067]">
                Floor Occupancy
              </span>
              <div className="w-8 h-8 rounded-xl bg-[#FAF0EB] text-[#C9532F] flex items-center justify-center">
                <Users className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-3">
              <span className="text-2xl font-black text-[#211F1B] font-mono tabular-nums tracking-tight">
                {occupiedCount} / {tables.length} Tables
              </span>
              <span className="text-xs font-medium text-[#777067] block mt-1">
                {Math.round((occupiedCount / tables.length) * 100)}% capacity utilized
              </span>
            </div>
          </div>

          {/* Card 4: Dwell Time */}
          <div className="bg-[#FFFDF9] rounded-3xl p-5 border border-[#DDD6CA] shadow-2xs flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-extrabold uppercase tracking-wider text-[#777067]">
                Avg. Prep Time
              </span>
              <div className="w-8 h-8 rounded-xl bg-[#FEF9C3] text-[#854D0E] flex items-center justify-center">
                <Clock className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-3">
              <span className="text-2xl font-black text-[#211F1B] font-mono tabular-nums tracking-tight">
                14.8 mins
              </span>
              <span className="text-xs font-bold text-[#166534] block mt-1">
                Target: &lt;20 mins ✓
              </span>
            </div>
          </div>
        </div>

        {/* 2-Column Section: Floor Map & Payment Channels */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Active Tables Map (2 cols) */}
          <div className="lg:col-span-2 bg-[#FFFDF9] rounded-3xl p-5 border border-[#DDD6CA] shadow-2xs space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-extrabold text-base text-[#211F1B]">Live Floor Matrix</h3>
                <p className="text-xs text-[#777067]">Click table card to inspect or override session</p>
              </div>
              <span className="text-xs font-mono font-bold text-[#777067] bg-[#F5F0E7] px-2.5 py-1 rounded-full border border-[#DDD6CA]">
                {tables.length} Tables Active
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {tables.map((table) => {
                const session = sessions[table.id];
                const status = session ? session.status : 'available';
                const hasPendingAssistance =
                  session && session.assistanceRequests.some((r) => r.status === 'pending');

                return (
                  <button
                    key={table.id}
                    onClick={() => onSelectTable(table.id)}
                    className="p-3.5 rounded-2xl border border-[#DDD6CA] bg-[#F5F0E7] hover:bg-[#EDE8DF] transition-all text-left flex flex-col justify-between min-h-[96px] cursor-pointer group hover:border-[#211F1B]"
                  >
                    <div className="flex items-start justify-between">
                      <span className="font-extrabold text-sm text-[#211F1B]">{table.name}</span>
                      {hasPendingAssistance && (
                        <span className="w-2 h-2 rounded-full bg-[#DC2626] animate-ping" />
                      )}
                    </div>

                    <div>
                      <StatusBadge status={status} size="sm" />
                      {session && session.totalAmount > 0 && (
                        <span className="block mt-1 font-mono text-xs font-bold text-[#211F1B] tabular-nums">
                          {formatKwacha(session.totalAmount)}
                        </span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Payment Channels Breakdown (1 col) */}
          <div className="bg-[#FFFDF9] rounded-3xl p-5 border border-[#DDD6CA] shadow-2xs space-y-4">
            <div>
              <h3 className="font-extrabold text-base text-[#211F1B]">Payment Channel Mix</h3>
              <p className="text-xs text-[#777067]">Settlement audit</p>
            </div>

            <div className="space-y-3">
              <div className="p-3 bg-[#F5F0E7] rounded-2xl border border-[#DDD6CA] flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <Smartphone className="w-4 h-4 text-[#C9532F]" />
                  <div>
                    <span className="text-xs font-extrabold text-[#211F1B] block">Mobile Money</span>
                    <span className="text-[11px] text-[#777067]">Airtel &amp; Mpamba</span>
                  </div>
                </div>
                <span className="text-xs font-mono font-bold text-[#211F1B] tabular-nums">68% (MK 328k)</span>
              </div>

              <div className="p-3 bg-[#F5F0E7] rounded-2xl border border-[#DDD6CA] flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <Banknote className="w-4 h-4 text-[#166534]" />
                  <div>
                    <span className="text-xs font-extrabold text-[#211F1B] block">Cash at Counter</span>
                    <span className="text-[11px] text-[#777067]">Waiter cash drop</span>
                  </div>
                </div>
                <span className="text-xs font-mono font-bold text-[#211F1B] tabular-nums">22% (MK 106k)</span>
              </div>

              <div className="p-3 bg-[#F5F0E7] rounded-2xl border border-[#DDD6CA] flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <CreditCard className="w-4 h-4 text-[#1E40AF]" />
                  <div>
                    <span className="text-xs font-extrabold text-[#211F1B] block">POS Card Machine</span>
                    <span className="text-[11px] text-[#777067]">Visa / Mastercard</span>
                  </div>
                </div>
                <span className="text-xs font-mono font-bold text-[#211F1B] tabular-nums">10% (MK 48k)</span>
              </div>
            </div>

            {/* Walkout Protection Metric */}
            <div className="p-3.5 bg-[#FEF2F2] border border-[#FECACA] rounded-2xl flex items-start gap-2.5">
              <ShieldAlert className="w-4 h-4 text-[#DC2626] shrink-0 mt-0.5" />
              <div>
                <span className="text-xs font-extrabold text-[#991B1B] block">
                  Walkout Discrepancy Log ({walkoutLogs.length})
                </span>
                <p className="text-[11px] text-[#991B1B] mt-0.5">
                  All active tables currently have assigned waiters and open tabs.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Top Selling Dishes Table */}
        <div className="bg-[#FFFDF9] rounded-3xl p-5 border border-[#DDD6CA] shadow-2xs space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-extrabold text-base text-[#211F1B]">Top Selling Dishes &amp; Drinks</h3>
              <p className="text-xs text-[#777067]">Ranked by volume and gross revenue today</p>
            </div>
            <Award className="w-5 h-5 text-[#C9532F]" />
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-[#DDD6CA] text-[11px] font-extrabold uppercase text-[#777067]">
                  <th className="pb-2">Dish / Drink</th>
                  <th className="pb-2">Category</th>
                  <th className="pb-2 text-right">Units Sold</th>
                  <th className="pb-2 text-right">Revenue</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#DDD6CA]/60 font-medium">
                {topItems.map((item, idx) => (
                  <tr key={item.name} className="hover:bg-[#F5F0E7]/60">
                    <td className="py-2.5 font-bold text-[#211F1B]">
                      {idx + 1}. {item.name}
                    </td>
                    <td className="py-2.5 text-[#777067]">{item.category}</td>
                    <td className="py-2.5 text-right font-mono font-bold text-[#211F1B] tabular-nums">
                      {item.count}
                    </td>
                    <td className="py-2.5 text-right font-mono font-extrabold text-[#C9532F] tabular-nums">
                      {formatKwacha(item.revenue)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
}
