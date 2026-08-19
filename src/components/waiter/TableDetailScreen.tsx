import React, { useState } from 'react';
import { useRestaurant } from '../../context/RestaurantContext';
import { ItemStatus } from '../../types';
import { formatKwacha, formatTimeAgo } from '../../utils/formatters';
import {
  ArrowLeft,
  Bell,
  CheckCircle2,
  Utensils,
  Ban,
  Receipt,
  Users,
  CreditCard,
  Banknote,
  Plus,
  AlertTriangle,
  X,
  Check,
} from 'lucide-react';
import { StatusBadge } from '../common/StatusBadge';
import { OrderFlowButton } from '../common/OrderFlowButton';

interface TableDetailScreenProps {
  tableId: string;
  onBack: () => void;
}

export function TableDetailScreen({ tableId, onBack }: TableDetailScreenProps) {
  const {
    sessions,
    tables,
    updateItemStatus,
    advanceItemStatus,
    voidOrderItem,
    resolveAssistance,
    clearTable,
    confirmPayment,
  } = useRestaurant();

  const session = sessions[tableId];
  const table = tables.find((t) => t.id === tableId);
  const [showCloseModal, setShowCloseModal] = useState(false);
  const [showWalkoutOptions, setShowWalkoutOptions] = useState(false);
  const [closeReason, setCloseReason] = useState<
    'paid_cash' | 'paid_mobile_money' | 'unpaid_walkout' | 'other'
  >('paid_cash');
  const [closeNote, setCloseNote] = useState('');
  const [voidingItemId, setVoidingItemId] = useState<string | null>(null);
  const [voidReason, setVoidReason] = useState('Customer changed mind');
  const [isWaste, setIsWaste] = useState(false);

  if (!session || !table) {
    return (
      <div className="p-8 text-center bg-[#F5F0E7] min-h-screen text-[#211F1B]">
        <p className="text-sm font-bold">Table not found.</p>
        <button onClick={onBack} className="mt-4 px-4 py-2 bg-[#211F1B] text-white rounded-xl text-xs font-bold cursor-pointer">
          Back to Floor
        </button>
      </div>
    );
  }

  const activeItems = session.items?.filter((i) => i.status !== 'VOIDED') || [];
  const unpaidItems = activeItems.filter((i) => !i.paid);
  const pendingAssistance = session.assistanceRequests?.filter((r) => r.status === 'pending') || [];
  const isPaid = session.isPaid || session.paymentState === 'READY_TO_CLOSE';
  const isBillRequested = session.paymentState === 'PAYMENT_REQUESTED' || session.status === 'waiting_payment';

  // Calculate outstanding bill total or latest payment record amount
  const unpaidSubtotal = unpaidItems.length > 0
    ? unpaidItems.reduce((sum, i) => sum + i.totalPrice, 0)
    : activeItems.reduce((sum, i) => sum + i.totalPrice, 0);
  const unpaidTotal = unpaidSubtotal + Math.round(unpaidSubtotal * 0.1);
  const currentBillAmount = session.totalAmount > 0 ? session.totalAmount : (unpaidTotal > 0 ? unpaidTotal : 27500);

  const lastPaymentRecord = session.paymentHistory && session.paymentHistory.length > 0
    ? session.paymentHistory[session.paymentHistory.length - 1]
    : null;
  const settledAmount = lastPaymentRecord?.amount || session.paidAmount || (unpaidTotal > 0 ? unpaidTotal : 27500);

  const handleConfirmCashPayment = () => {
    confirmPayment(tableId, 'cash', currentBillAmount, session.guests?.[0] || 'Guest');
  };

  const handleConfirmPOSPayment = () => {
    confirmPayment(tableId, 'card', currentBillAmount, session.guests?.[0] || 'Guest');
  };

  const handleCloseTableSubmit = () => {
    const finalReason = isPaid
      ? session.paymentMethod === 'mobile_money'
        ? 'paid_mobile_money'
        : 'paid_cash'
      : closeReason;

    clearTable(tableId, finalReason, closeNote);
    setShowCloseModal(false);
    onBack();
  };

  const handleVoidSubmit = () => {
    if (voidingItemId) {
      voidOrderItem(tableId, voidingItemId, voidReason, isWaste);
      setVoidingItemId(null);
    }
  };

  return (
    <div className="min-h-screen bg-[#F5F0E7] text-[#211F1B] pb-36 font-sans">
      {/* Detail Header */}
      <header className="bg-[#211F1B] text-white px-4 py-3.5 sticky top-0 z-30 shadow-md">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <button
            onClick={onBack}
            className="flex items-center gap-1.5 text-xs font-extrabold text-[#AAA298] hover:text-white transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Floor View</span>
          </button>

          <div className="text-center">
            <h2 className="font-extrabold text-sm tracking-tight">{table.name}</h2>
            <span className="text-[11px] text-[#AAA298] font-mono">
              {table.section} · Waiter: {table.assignedWaiter}
            </span>
          </div>

          <StatusBadge status={session.status} size="sm" />
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 pt-4 space-y-3.5">
        {/* Urgent Assistance Request Banner (If pending) */}
        {pendingAssistance.length > 0 && (
          <div className="bg-[#DC2626] text-white rounded-2xl p-4 shadow-md flex items-center justify-between gap-3 animate-pulse">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center shrink-0">
                <Bell className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-extrabold text-sm">
                  Assistance: {pendingAssistance[0].label}
                </h4>
                <p className="text-xs text-red-100 font-mono">
                  Requested by {pendingAssistance[0].requestedBy} ({formatTimeAgo(pendingAssistance[0].time)})
                </p>
              </div>
            </div>
            <button
              onClick={() => resolveAssistance(tableId, pendingAssistance[0].id)}
              className="py-2 px-3.5 bg-white text-[#DC2626] hover:bg-red-50 text-xs font-extrabold rounded-xl shadow-xs transition-colors shrink-0 cursor-pointer"
            >
              Resolve ✓
            </button>
          </div>
        )}

        {/* Section 18: Payment State Banner & Quick Confirmations */}
        {isBillRequested && !isPaid && (
          <div className="bg-[#FEF9C3] border border-[#FDE047] rounded-2xl p-4 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs text-[#854D0E]">
                <Receipt className="w-4 h-4 text-amber-700 shrink-0" />
                <div>
                  <span className="font-bold block">Bill Settlement Requested</span>
                  <span>Total: {formatKwacha(session.totalAmount)} ({session.paymentMethod || 'Cash / POS'})</span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 pt-1 border-t border-[#FDE047]">
              <button
                type="button"
                onClick={handleConfirmCashPayment}
                className="py-2 px-3 bg-[#166534] hover:bg-[#15803D] text-white text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
              >
                <Banknote className="w-4 h-4" />
                <span>Confirm Cash (MK {session.totalAmount.toLocaleString()})</span>
              </button>

              <button
                type="button"
                onClick={handleConfirmPOSPayment}
                className="py-2 px-3 bg-[#1E40AF] hover:bg-[#1D4ED8] text-white text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
              >
                <CreditCard className="w-4 h-4" />
                <span>Confirm POS Paid</span>
              </button>
            </div>
          </div>
        )}

        {/* Paid Banner */}
        {isPaid && (
          <div className="bg-[#EBF7EE] border border-[#BBF7D0] rounded-2xl p-3.5 flex items-center justify-between text-xs text-[#166534]">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-[#16A34A] shrink-0" />
              <div>
                <span className="font-extrabold block">Payment Confirmed ✓</span>
                <span>{formatKwacha(settledAmount)} received via {session.paymentMethod === 'card' ? 'POS Card' : session.paymentMethod === 'cash' ? 'Cash' : 'Mobile Money'}.</span>
              </div>
            </div>

            <button
              onClick={() => setShowCloseModal(true)}
              className="py-1.5 px-3 bg-[#166534] hover:bg-[#15803D] text-white font-bold rounded-lg cursor-pointer"
            >
              Close Table →
            </button>
          </div>
        )}

        {/* Guest info & session summary bar */}
        <div className="bg-[#FFFDF9] rounded-2xl p-4 border border-[#DDD6CA] shadow-2xs flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-[#777067]" />
            <span className="text-xs font-extrabold text-[#211F1B]">
              Guests ({session.guests?.length || 1}):
            </span>
            <span className="text-xs text-[#777067]">
              {session.guests?.length > 0 ? session.guests.join(', ') : 'Guest'}
            </span>
          </div>

          <div className="flex items-center gap-4 text-xs font-mono">
            <div>
              <span className="text-[#777067] mr-1.5">Subtotal:</span>
              <span className="font-bold tabular-nums">{formatKwacha(session.subtotal)}</span>
            </div>
            <div>
              <span className="text-[#777067] mr-1.5">Total:</span>
              <span className="font-black text-[#C9532F] text-sm tabular-nums">
                {formatKwacha(session.totalAmount)}
              </span>
            </div>
          </div>
        </div>

        {/* Live Order Items Card List */}
        <div className="space-y-3">
          <div className="flex items-center justify-between px-1">
            <h3 className="text-[11px] font-extrabold uppercase tracking-wider text-[#777067]">
              Table Items ({activeItems.length})
            </h3>
            <span className="text-xs text-[#777067]">Tap action button to advance</span>
          </div>

          {activeItems.length === 0 ? (
            <div className="bg-[#FFFDF9] rounded-2xl p-6 border border-[#DDD6CA] text-center text-xs text-[#777067]">
              No active items on this table tab.
            </div>
          ) : (
            activeItems.map((item) => (
              <div
                key={item.orderItemId}
                className="bg-[#FFFDF9] rounded-2xl p-4 border border-[#DDD6CA] shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3"
              >
                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-xl bg-[#EDE8DF] text-[#211F1B] flex items-center justify-center shrink-0 mt-0.5">
                    <Utensils className="w-4 h-4 text-[#777067]" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className="font-extrabold text-sm text-[#211F1B]">{item.name}</h4>
                      <span className="text-xs font-mono font-bold text-[#777067]">×{item.quantity}</span>
                      <StatusBadge status={item.status} size="sm" />
                    </div>

                    <div className="flex items-center gap-3 text-xs text-[#777067] mt-1 font-mono">
                      <span>{item.orderedBy}</span>
                      <span>·</span>
                      <span className="font-bold text-[#211F1B]">{formatKwacha(item.totalPrice)}</span>
                      <span>·</span>
                      <span>{item.station}</span>
                    </div>

                    {item.notes && (
                      <p className="text-[11px] text-[#C2410C] bg-[#FAF0EB] px-2 py-0.5 rounded-md mt-1.5 inline-block font-medium">
                        Note: {item.notes}
                      </p>
                    )}
                  </div>
                </div>

                {/* Status Action Buttons with explicit labels */}
                <div className="flex items-center gap-2 self-end sm:self-center">
                  {item.status === 'PLACED' && (
                    <button
                      onClick={() => advanceItemStatus(tableId, item.orderItemId)}
                      className="px-3 py-1.5 bg-[#211F1B] hover:bg-[#312E29] text-white text-xs font-bold rounded-xl transition-all cursor-pointer"
                    >
                      Accept Order
                    </button>
                  )}

                  {(item.status === 'ACCEPTED' || item.status === 'PREPARING') && (
                    <button
                      onClick={() => advanceItemStatus(tableId, item.orderItemId)}
                      className="px-3 py-1.5 bg-[#16A34A] hover:bg-[#15803D] text-white text-xs font-bold rounded-xl transition-all cursor-pointer"
                    >
                      Mark Ready
                    </button>
                  )}

                  {item.status === 'READY' && (
                    <button
                      onClick={() => advanceItemStatus(tableId, item.orderItemId)}
                      className="px-3 py-1.5 bg-[#16A34A] hover:bg-[#15803D] text-white text-xs font-bold rounded-xl transition-all cursor-pointer"
                    >
                      Mark Served ✓
                    </button>
                  )}

                  {item.status === 'SERVED' && (
                    <span className="text-xs font-bold text-[#166534] bg-[#EBF7EE] px-2.5 py-1 rounded-lg border border-[#BBF7D0]">
                      Served
                    </span>
                  )}

                  {item.status !== 'SERVED' && (
                    <button
                      onClick={() => setVoidingItemId(item.orderItemId)}
                      className="p-1.5 text-[#AAA298] hover:text-[#DC2626] rounded-lg transition-colors cursor-pointer"
                      title="Void item"
                    >
                      <Ban className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </main>

      {/* Sticky Bottom Actions Bar */}
      <div className="fixed bottom-3 inset-x-4 max-w-4xl mx-auto z-40">
        <div className="bg-[#211F1B] text-white rounded-2xl p-3.5 shadow-xl flex items-center justify-between border border-[#36312B]">
          <div className="text-left">
            <span className="text-[11px] text-[#AAA298] block">Balance</span>
            <span className="text-base font-extrabold text-white font-mono tabular-nums">
              {formatKwacha(session.totalAmount)}
            </span>
          </div>

          <div className="flex items-center gap-2">
            {!isPaid && (
              session.paymentMethod === 'card' ? (
                <button
                  onClick={handleConfirmPOSPayment}
                  className="py-2.5 px-3 bg-[#1E40AF] hover:bg-[#1D4ED8] text-white text-xs font-bold rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs whitespace-nowrap"
                >
                  <CreditCard className="w-3.5 h-3.5 text-blue-200" />
                  <span>Process POS Card</span>
                </button>
              ) : session.paymentMethod === 'mobile_money' ? (
                <button
                  onClick={() => confirmPayment(tableId, 'mobile_money', session.totalAmount, session.guests?.[0] || 'Guest')}
                  className="py-2.5 px-3 bg-[#166534] hover:bg-[#15803D] text-white text-xs font-bold rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs whitespace-nowrap"
                >
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-200" />
                  <span>Confirm Paid</span>
                </button>
              ) : (
                <button
                  onClick={handleConfirmCashPayment}
                  className="py-2.5 px-3 bg-[#312E29] hover:bg-[#3E3A34] text-white text-xs font-bold rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap"
                >
                  <Banknote className="w-3.5 h-3.5 text-[#16A34A]" />
                  <span>Collect Cash</span>
                </button>
              )
            )}

            {/* Section 19: Safe Close Table Action */}
            <button
              onClick={() => setShowCloseModal(true)}
              className="py-2.5 px-4 bg-[#C9532F] hover:bg-[#B54624] text-white text-xs font-extrabold rounded-xl transition-colors cursor-pointer shadow-sm whitespace-nowrap"
            >
              Close Table
            </button>
          </div>
        </div>
      </div>

      {/* Section 19: Dignified & Safe Close Table Confirmation Modal */}
      {showCloseModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="bg-[#FFFDF9] rounded-3xl p-6 max-w-sm w-full shadow-2xl border border-[#DDD6CA] text-[#211F1B] space-y-4">
            <div>
              <h3 className="text-base font-extrabold">Close {table.name}?</h3>
              <p className="text-xs text-[#777067] mt-1">
                {isPaid
                  ? `Payment of ${formatKwacha(settledAmount)} has been confirmed. Closing the table will end the current session and make the table available again.`
                  : `Closing will end the session for ${table.name} (${formatKwacha(currentBillAmount)}). Please select settlement status:`}
              </p>
            </div>

            {!isPaid && (
              <div className="space-y-2">
                {[
                  { id: 'paid_cash', label: 'Paid in Cash / POS Card' },
                  { id: 'paid_mobile_money', label: 'Paid via Mobile Money' },
                  { id: 'unpaid_walkout', label: 'Unpaid Walkout (Log Incident)' },
                  { id: 'other', label: 'Manager Comp / Other' },
                ].map((opt) => (
                  <label
                    key={opt.id}
                    className={`flex items-center gap-2.5 p-2.5 rounded-xl border text-xs cursor-pointer font-medium ${
                      closeReason === opt.id
                        ? 'bg-[#FAF0EB] border-[#C9532F] text-[#211F1B] font-bold'
                        : 'border-[#DDD6CA] bg-[#F5F0E7] text-[#777067]'
                    }`}
                  >
                    <input
                      type="radio"
                      name="close_reason"
                      checked={closeReason === opt.id}
                      onChange={() => setCloseReason(opt.id as any)}
                      className="accent-[#C9532F]"
                    />
                    <span>{opt.label}</span>
                  </label>
                ))}
              </div>
            )}

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowCloseModal(false)}
                className="flex-1 py-2.5 text-xs font-bold text-[#777067] bg-[#EDE8DF] hover:bg-[#DDD6CA] rounded-xl cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleCloseTableSubmit}
                className="flex-1 py-2.5 text-xs font-bold text-white bg-[#C9532F] hover:bg-[#B54624] rounded-xl cursor-pointer"
              >
                Close Table
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Void Item Modal */}
      {voidingItemId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="bg-[#FFFDF9] rounded-3xl p-6 max-w-sm w-full shadow-2xl border border-[#DDD6CA] text-[#211F1B] space-y-3">
            <h3 className="text-base font-extrabold">Void Order Item</h3>
            <p className="text-xs text-[#777067]">
              Record reason for kitchen &amp; manager discrepancy audit.
            </p>

            <input
              type="text"
              value={voidReason}
              onChange={(e) => setVoidReason(e.target.value)}
              placeholder="e.g. Guest changed mind, wrong dish"
              className="w-full text-xs border border-[#DDD6CA] bg-[#F5F0E7] rounded-xl p-2.5 text-[#211F1B] font-medium"
            />

            <label className="flex items-center gap-2 text-xs text-[#777067]">
              <input
                type="checkbox"
                checked={isWaste}
                onChange={(e) => setIsWaste(e.target.checked)}
                className="accent-[#C9532F]"
              />
              <span>Food was already cooked (Account for kitchen waste)</span>
            </label>

            <div className="flex gap-2 pt-2">
              <button
                onClick={() => setVoidingItemId(null)}
                className="flex-1 py-2.5 text-xs font-bold text-[#777067] bg-[#EDE8DF] rounded-xl cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleVoidSubmit}
                className="flex-1 py-2.5 text-xs font-bold text-white bg-[#DC2626] hover:bg-[#B91C1C] rounded-xl cursor-pointer"
              >
                Void Item
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
