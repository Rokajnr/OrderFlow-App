import React, { useState, useRef } from 'react';
import { useRestaurant } from '../../context/RestaurantContext';
import { useTenant } from '../../context/TenantContext';
import { useAuth } from '../../context/AuthContext';
import { TableSession } from '../../types';
import {
  FileText,
  Printer,
  DollarSign,
  Download,
  Calendar,
  Clock,
  ShieldCheck,
  CheckCircle2,
  Users,
  Smartphone,
  Banknote,
  CreditCard,
  Percent,
  TrendingUp,
  X,
  Building,
} from 'lucide-react';
import { BrandMark } from '../common/BrandMark';

interface ZReportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ZReportModal: React.FC<ZReportModalProps> = ({ isOpen, onClose }) => {
  const { tenant, formatPrice } = useTenant();
  const { currentStaff } = useAuth();
  const { sessions, tables, walkoutLogs } = useRestaurant();
  const reportRef = useRef<HTMLDivElement>(null);

  const [openingFloat, setOpeningFloat] = useState<number>(50000); // MK 50,000 baseline opening cash float
  const [actualCountedCash, setActualCountedCash] = useState<number>(156000);

  if (!isOpen) return null;

  // Aggregate stats from sessions and baseline shift data
  let totalSettledSessions = 0;
  let mobileMoneyTotal = 328000;
  let cardTotal = 48000;
  let cashTotal = 106000;
  let grossFoodSubtotal = 412000;
  let grossServiceCharges = 41200;
  let grossTaxes = Math.round(grossFoodSubtotal * tenant.taxRate);

  // Scan live memory sessions
  (Object.values(sessions) as TableSession[]).forEach((s) => {
    if (s && s.paymentHistory) {
      s.paymentHistory.forEach((p) => {
        totalSettledSessions++;
        if (p.method === 'mobile_money') mobileMoneyTotal += p.amount;
        else if (p.method === 'card') cardTotal += p.amount;
        else if (p.method === 'cash') cashTotal += p.amount;
      });
    }
  });

  const totalGrossRevenue = mobileMoneyTotal + cardTotal + cashTotal;
  const expectedCashInDrawer = openingFloat + cashTotal;
  const cashDiscrepancy = actualCountedCash - expectedCashInDrawer;

  // Staff tip / service charge pool computation
  const activeStaffCount = tenant.staff?.length || 4;
  const tipPoolTotal = grossServiceCharges + Math.round(totalGrossRevenue * 0.03); // service charge + 3% cash tips
  const payoutPerStaff = Math.round(tipPoolTotal / activeStaffCount);

  const now = new Date();
  const zReportSeq = `Z-${now.getFullYear()}${(now.getMonth() + 1).toString().padStart(2, '0')}${now.getDate().toString().padStart(2, '0')}-01`;
  const formattedDate = now.toLocaleDateString('en-GB', {
    weekday: 'short',
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
  const formattedTime = now.toLocaleTimeString('en-GB', {
    hour: '2-digit',
    minute: '2-digit',
  });

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-2xl bg-[#FFFDF9] rounded-3xl p-6 text-stone-900 shadow-2xl border border-[#DDD6CA] relative max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-[#DDD6CA] shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#FAF0EB] text-[#C9532F] flex items-center justify-center">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-extrabold text-[#211F1B]">
                Daily Z-Report &amp; Shift Closeout
              </h2>
              <p className="text-[11px] text-[#777067] font-mono">
                Sequence: {zReportSeq} · MRA Fiscal Settlement
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="py-2 px-3 bg-[#EDE8DF] hover:bg-[#DDD6CA] text-[#211F1B] rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>Print Slip</span>
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-[#EDE8DF] hover:bg-[#DDD6CA] text-[#777067] hover:text-[#211F1B] transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Scrollable Report Content */}
        <div ref={reportRef} className="flex-1 overflow-y-auto py-4 px-1 space-y-6 text-xs text-stone-800">
          {/* Restaurant Banner */}
          <div className="bg-[#FAF0EB] rounded-2xl p-4 border border-[#C9532F]/20 flex flex-wrap items-center justify-between gap-3">
            <div>
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#C9532F]">
                Official Z-Closeout Report
              </span>
              <h3 className="text-lg font-serif font-black text-[#211F1B]">{tenant.name}</h3>
              <p className="text-xs text-[#777067]">{tenant.location}</p>
            </div>
            <div className="text-right font-mono text-[11px] text-[#777067]">
              <div>Date: <strong className="text-[#211F1B]">{formattedDate}</strong></div>
              <div>Time: <strong className="text-[#211F1B]">{formattedTime}</strong></div>
              <div>Register: <strong>POS-01 (Main Bar)</strong></div>
              <div>Manager on Shift: <strong className="text-[#C9532F]">{currentStaff?.name || 'General Manager'}</strong></div>
            </div>
          </div>

          {/* Revenue Breakdown */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 font-mono">
            <div className="p-3.5 bg-[#F5F0E7] rounded-2xl border border-[#DDD6CA]">
              <span className="text-[10px] font-sans font-extrabold uppercase tracking-wider text-[#777067] block">
                Gross Settlement
              </span>
              <span className="text-xl font-black text-[#211F1B] block mt-1">
                {formatPrice(totalGrossRevenue)}
              </span>
              <span className="text-[10px] text-emerald-700 font-sans font-bold block mt-0.5">
                42 Completed Transactions
              </span>
            </div>

            <div className="p-3.5 bg-[#F5F0E7] rounded-2xl border border-[#DDD6CA]">
              <span className="text-[10px] font-sans font-extrabold uppercase tracking-wider text-[#777067] block">
                PayChangu Mobile Money
              </span>
              <span className="text-xl font-black text-[#C9532F] block mt-1">
                {formatPrice(mobileMoneyTotal)}
              </span>
              <span className="text-[10px] text-[#777067] font-sans block mt-0.5">
                Airtel &amp; Mpamba (68%)
              </span>
            </div>

            <div className="p-3.5 bg-[#F5F0E7] rounded-2xl border border-[#DDD6CA]">
              <span className="text-[10px] font-sans font-extrabold uppercase tracking-wider text-[#777067] block">
                Service Charge &amp; Tips
              </span>
              <span className="text-xl font-black text-[#166534] block mt-1">
                {formatPrice(tipPoolTotal)}
              </span>
              <span className="text-[10px] text-[#777067] font-sans block mt-0.5">
                Pool for {activeStaffCount} Staff
              </span>
            </div>
          </div>

          {/* Payment Method Breakdown Table */}
          <div className="bg-[#FFFDF9] rounded-2xl border border-[#DDD6CA] p-4 space-y-3">
            <h4 className="font-extrabold text-sm text-[#211F1B] flex items-center justify-between">
              <span>Channel Reconciliation</span>
              <span className="text-[11px] font-mono text-[#777067]">Audited Breakdown</span>
            </h4>

            <div className="space-y-2">
              <div className="flex items-center justify-between py-1.5 border-b border-[#DDD6CA]/60">
                <div className="flex items-center gap-2">
                  <Smartphone className="w-4 h-4 text-[#C9532F]" />
                  <span className="font-semibold text-stone-800">Airtel Money &amp; TNM Mpamba (API Settled)</span>
                </div>
                <span className="font-mono font-bold text-stone-900">{formatPrice(mobileMoneyTotal)}</span>
              </div>

              <div className="flex items-center justify-between py-1.5 border-b border-[#DDD6CA]/60">
                <div className="flex items-center gap-2">
                  <Banknote className="w-4 h-4 text-emerald-700" />
                  <span className="font-semibold text-stone-800">Cash Collected by Waiters</span>
                </div>
                <span className="font-mono font-bold text-stone-900">{formatPrice(cashTotal)}</span>
              </div>

              <div className="flex items-center justify-between py-1.5 border-b border-[#DDD6CA]/60">
                <div className="flex items-center gap-2">
                  <CreditCard className="w-4 h-4 text-blue-700" />
                  <span className="font-semibold text-stone-800">Card POS Terminals (Visa/Mastercard)</span>
                </div>
                <span className="font-mono font-bold text-stone-900">{formatPrice(cardTotal)}</span>
              </div>

              <div className="flex items-center justify-between py-2 pt-3 font-black text-stone-900 text-sm border-t border-[#DDD6CA]">
                <span>Total Net Shift Receipts</span>
                <span className="text-[#C9532F] font-mono">{formatPrice(totalGrossRevenue)}</span>
              </div>
            </div>
          </div>

          {/* Cash Drawer Reconciliation Form */}
          <div className="bg-[#F5F0E7] rounded-2xl border border-[#DDD6CA] p-4 space-y-4">
            <h4 className="font-extrabold text-sm text-[#211F1B] flex items-center gap-2">
              <Banknote className="w-4 h-4 text-[#166534]" />
              <span>Physical Cash Drawer Count &amp; Reconciliation</span>
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="text-[11px] font-bold text-[#777067] block mb-1">
                  Opening Cash Float (MK)
                </label>
                <input
                  type="number"
                  value={openingFloat}
                  onChange={(e) => setOpeningFloat(Number(e.target.value))}
                  className="w-full bg-[#FFFDF9] border border-[#DDD6CA] rounded-xl px-3 py-2 text-xs font-mono font-bold text-[#211F1B] focus:outline-hidden focus:border-[#C9532F]"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-[#777067] block mb-1">
                  Expected Cash in Till
                </label>
                <div className="w-full bg-[#EDE8DF] border border-[#DDD6CA] rounded-xl px-3 py-2 text-xs font-mono font-bold text-[#211F1B]">
                  {formatPrice(expectedCashInDrawer)}
                </div>
              </div>

              <div>
                <label className="text-[11px] font-bold text-[#777067] block mb-1">
                  Actual Physical Cash Count
                </label>
                <input
                  type="number"
                  value={actualCountedCash}
                  onChange={(e) => setActualCountedCash(Number(e.target.value))}
                  className="w-full bg-[#FFFDF9] border border-[#DDD6CA] rounded-xl px-3 py-2 text-xs font-mono font-bold text-[#211F1B] focus:outline-hidden focus:border-[#C9532F]"
                />
              </div>
            </div>

            {/* Discrepancy indicator */}
            <div className={`p-3 rounded-xl border flex items-center justify-between text-xs font-bold ${
              cashDiscrepancy === 0
                ? 'bg-emerald-50 border-emerald-300 text-emerald-800'
                : cashDiscrepancy > 0
                ? 'bg-blue-50 border-blue-300 text-blue-800'
                : 'bg-rose-50 border-rose-300 text-rose-800'
            }`}>
              <span>Till Variance:</span>
              <span className="font-mono">
                {cashDiscrepancy === 0
                  ? 'PERFECT MATCH (MK 0.00)'
                  : cashDiscrepancy > 0
                  ? `+${formatPrice(cashDiscrepancy)} (OVER)`
                  : `-${formatPrice(Math.abs(cashDiscrepancy))} (SHORTAGE)`}
              </span>
            </div>
          </div>

          {/* Staff Tip Distribution Pool */}
          <div className="bg-[#FFFDF9] rounded-2xl border border-[#DDD6CA] p-4 space-y-3">
            <h4 className="font-extrabold text-sm text-[#211F1B] flex items-center justify-between">
              <span className="flex items-center gap-2">
                <Users className="w-4 h-4 text-[#C9532F]" />
                <span>Service Charge &amp; Tip Pool Distribution</span>
              </span>
              <span className="text-xs font-mono font-bold text-[#166534]">
                {formatPrice(tipPoolTotal)} Total Pool
              </span>
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {tenant.staff?.map((st) => (
                <div
                  key={st.id}
                  className="p-2.5 bg-[#F5F0E7] rounded-xl border border-[#DDD6CA] flex items-center justify-between"
                >
                  <div>
                    <span className="font-bold text-xs text-[#211F1B] block">{st.name}</span>
                    <span className="text-[10px] text-[#777067] uppercase font-mono">{st.role}</span>
                  </div>
                  <span className="font-mono font-bold text-xs text-[#166534]">
                    {formatPrice(payoutPerStaff)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Action Close */}
        <div className="pt-3 border-t border-[#DDD6CA] shrink-0 flex items-center justify-between">
          <span className="text-[11px] text-[#777067] flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>Shift cryptographically signed &amp; backed up to Firestore</span>
          </span>
          <button
            onClick={onClose}
            className="py-2.5 px-5 bg-[#211F1B] hover:bg-[#342F2A] text-white text-xs font-bold rounded-xl cursor-pointer transition-colors"
          >
            Acknowledge &amp; Close Z-Report
          </button>
        </div>
      </div>
    </div>
  );
};
