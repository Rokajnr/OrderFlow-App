import React, { useState, useEffect } from 'react';
import { useRestaurant } from '../../context/RestaurantContext';
import { formatKwacha, computeOrderHeadlineStatus } from '../../utils/formatters';
import {
  Bell,
  BellRing,
  Plus,
  Receipt,
  CheckCircle2,
  Clock,
  LogOut,
  X,
} from 'lucide-react';
import { AssistanceModal } from './AssistanceModal';
import { StatusBadge } from '../common/StatusBadge';
import { PwaInstallBanner } from '../common/PwaInstallBanner';
import {
  getNotificationPermission,
  requestNotificationPermission,
  sendDeviceNotification,
} from '../../utils/notifications';

interface LiveOrderTrackerScreenProps {
  onBackToMenu: () => void;
  onRequestBill: () => void;
  onLeaveTable?: () => void;
}

export function LiveOrderTrackerScreen({
  onBackToMenu,
  onRequestBill,
  onLeaveTable,
}: LiveOrderTrackerScreenProps) {
  const {
    activeSession,
    currentGuest,
    voidOrderItem,
    leaveTableSession,
  } = useRestaurant();

  const [isAssistanceOpen, setIsAssistanceOpen] = useState(false);
  const [cancellingItemId, setCancellingItemId] = useState<string | null>(null);
  const [showLeaveModal, setShowLeaveModal] = useState(false);
  const [notifPermission, setNotifPermission] = useState<string>(getNotificationPermission());
  const [isNotifPromptDismissed, setIsNotifPromptDismissed] = useState(false);
  const [isEnablingNotifs, setIsEnablingNotifs] = useState(false);

  useEffect(() => {
    setNotifPermission(getNotificationPermission());
    const dismissed = localStorage.getItem('orderflow_notif_prompt_dismissed');
    if (dismissed) {
      setIsNotifPromptDismissed(true);
    }
  }, []);

  const handleEnableNotifications = async () => {
    setIsEnablingNotifs(true);
    const result = await requestNotificationPermission();
    setNotifPermission(result);
    setIsEnablingNotifs(false);

    if (result === 'granted') {
      sendDeviceNotification({
        title: '🔔 Live Order Alerts Activated',
        body: `We will notify you the moment your dishes are ready for Table ${activeSession.tableName || '12'}.`,
      });
    }
  };

  const handleDismissNotifPrompt = () => {
    setIsNotifPromptDismissed(true);
    localStorage.setItem('orderflow_notif_prompt_dismissed', 'true');
  };

  const activeItems = activeSession.items.filter((i) => i.status !== 'VOIDED');
  const headlineStatus = computeOrderHeadlineStatus(activeSession.items);

  const readyCount = activeItems.filter((i) => i.status === 'READY').length;
  const preparingCount = activeItems.filter((i) => i.status === 'PREPARING').length;
  const servedCount = activeItems.filter((i) => i.status === 'SERVED').length;

  const isAllServed = activeItems.length > 0 && servedCount === activeItems.length;
  const outstandingAmount = activeSession.totalAmount ?? 0;
  const isPaid = activeSession.isPaid && outstandingAmount === 0;

  const handleCancelPlacedItem = (orderItemId: string) => {
    voidOrderItem(activeSession.tableId, orderItemId, 'Customer cancelled before kitchen acceptance', false);
    setCancellingItemId(null);
  };

  const handleConfirmLeave = () => {
    leaveTableSession();
    setShowLeaveModal(false);
    if (onLeaveTable) {
      onLeaveTable();
    } else {
      onBackToMenu();
    }
  };

  return (
    <div className="min-h-screen bg-[#F5F0E7] text-[#211F1B] pb-36 font-sans">
      {/* Header Container */}
      <header className="bg-[#FFFDF9] border-b border-[#DDD6CA] px-4 pt-3.5 pb-3 sticky top-0 z-30 shadow-2xs">
        <div className="max-w-md mx-auto flex items-center justify-between">
          <div>
            <span className="text-[11px] font-extrabold text-[#C9532F] uppercase tracking-wider block">
              Live Order Tracker
            </span>
            <h1 className="text-base font-serif font-bold tracking-tight text-[#211F1B]">
              Lakeview Bar &amp; Grill
            </h1>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-mono font-black text-[#211F1B] bg-[#EDE8DF] px-2.5 py-1 rounded-full border border-[#DDD6CA]">
              {activeSession.tableName || 'Table 12'}
            </span>
            <button
              onClick={() => setShowLeaveModal(true)}
              className="text-[#777067] hover:text-[#DC2626] p-1 rounded-lg transition-colors cursor-pointer"
              title="Leave Table"
              aria-label="Leave Table"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-md mx-auto px-4 pt-4 space-y-4">
        {/* ZONE 1: ORDER STATUS SUMMARY */}
        <section aria-label="Order Status Summary" className="bg-[#211F1B] text-white rounded-3xl p-5 shadow-sm border border-[#312E29]">
          <div className="flex items-center justify-between text-[11px] font-bold text-[#AAA298] uppercase tracking-wider mb-2">
            <span>Order Status</span>
            <span className="font-mono text-[#F0D8CC] tabular-nums">
              {headlineStatus.percentage}% Progress
            </span>
          </div>

          <h2 className="text-lg font-extrabold text-white tracking-tight flex items-center gap-2">
            {isAllServed ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
            ) : (
              <Clock className="w-5 h-5 text-[#C9532F] shrink-0" />
            )}
            <span>{headlineStatus.headline}</span>
          </h2>

          {/* Progress bar */}
          <div className="w-full h-2 bg-[#312E29] rounded-full overflow-hidden my-3">
            <div
              className={`h-full rounded-full transition-all duration-500 ease-out ${
                isAllServed ? 'bg-emerald-400' : 'bg-[#C9532F]'
              }`}
              style={{ width: `${Math.max(8, headlineStatus.percentage)}%` }}
            />
          </div>

          {/* Status summary */}
          <div className="flex items-center justify-between text-xs text-[#AAA298] pt-1">
            <span>
              {servedCount} served · {readyCount} ready · {preparingCount} preparing
            </span>
            <span className="text-[11px] text-[#F0D8CC]">
              {activeSession.guests?.length > 1 ? `${activeSession.guests.length} guests` : `Guest: ${currentGuest}`}
            </span>
          </div>
          <p className="text-[11px] text-[#AAA298] mt-2 italic">
            We'll update you as your kitchen orders progress.
          </p>
        </section>

        {/* CONTEXTUAL NOTIFICATION PERMISSION CARD */}
        {notifPermission !== 'granted' && !isNotifPromptDismissed && activeItems.length > 0 && (
          <section className="bg-[#FFFDF9] border border-[#DDD6CA] rounded-2xl p-3.5 shadow-sm animate-in fade-in duration-300">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-700 border border-amber-200 flex items-center justify-center shrink-0">
                  <BellRing className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-xs font-extrabold text-[#211F1B]">
                    Enable Live Order Alerts?
                  </h4>
                  <p className="text-[11.5px] text-[#777067] mt-0.5 leading-snug">
                    Get an instant notification the second your food or drinks are ready for {activeSession.tableName || 'Table 12'}.
                  </p>
                </div>
              </div>

              <button
                onClick={handleDismissNotifPrompt}
                className="text-[#AAA298] hover:text-[#211F1B] p-1 rounded-lg hover:bg-[#EDE8DF] transition-colors cursor-pointer"
                title="Maybe later"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex items-center gap-2 mt-3 pt-2.5 border-t border-[#DDD6CA]/60">
              <button
                onClick={handleEnableNotifications}
                disabled={isEnablingNotifs}
                className="flex-1 py-2 px-3 bg-[#211F1B] hover:bg-[#312E29] text-white text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
              >
                <Bell className="w-3.5 h-3.5" />
                <span>{isEnablingNotifs ? 'Enabling…' : 'Turn On Alerts'}</span>
              </button>
              <button
                onClick={handleDismissNotifPrompt}
                className="py-2 px-3 bg-[#EDE8DF] hover:bg-[#DDD6CA] text-[#696157] text-xs font-semibold rounded-xl transition-colors cursor-pointer"
              >
                Maybe later
              </button>
            </div>
          </section>
        )}

        {/* ACTIVE NOTIFICATIONS CONFIRMATION BADGE */}
        {notifPermission === 'granted' && (
          <div className="flex items-center justify-between bg-[#EBF7EE] border border-[#BBF7D0] px-3.5 py-2 rounded-xl text-xs text-[#166534]">
            <div className="flex items-center gap-2 font-semibold">
              <CheckCircle2 className="w-4 h-4 text-[#16A34A] shrink-0" />
              <span>Live kitchen alerts enabled for this device</span>
            </div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#15803D]">Active</span>
          </div>
        )}

        {/* ZONE 2: YOUR ORDER ITEMS */}
        <section aria-label="Order Items List" className="space-y-2.5">
          <div className="flex items-center justify-between px-1">
            <h3 className="text-[11px] font-extrabold uppercase tracking-wider text-[#777067]">
              Your Order · {activeItems.length} {activeItems.length === 1 ? 'Item' : 'Items'}
            </h3>
            <span className="text-xs font-mono font-bold text-[#211F1B] tabular-nums">
              {outstandingAmount > 0 ? formatKwacha(outstandingAmount) : 'Paid ✓'}
            </span>
          </div>

          <div className="space-y-2">
            {activeItems.map((item) => (
              <div
                key={item.orderItemId}
                className="bg-[#FFFDF9] border border-[#DDD6CA] rounded-2xl p-3.5 shadow-2xs space-y-2"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm text-[#211F1B] truncate">
                        {item.quantity}x {item.name}
                      </span>
                    </div>

                    {item.orderedBy && (
                      <p className="text-[11px] text-[#777067] mt-0.5">
                        Ordered by: <strong className="text-[#211F1B]">{item.orderedBy}</strong>
                      </p>
                    )}

                    {item.selectedAddOns && item.selectedAddOns.length > 0 && (
                      <p className="text-[11px] text-[#777067]">
                        + {item.selectedAddOns.map((a) => a.name).join(', ')}
                      </p>
                    )}

                    {item.notes && (
                      <p className="text-[11px] italic text-[#C9532F]">"{item.notes}"</p>
                    )}
                  </div>

                  <div className="text-right shrink-0">
                    <div className="font-mono text-xs font-bold text-[#211F1B] tabular-nums">
                      {formatKwacha(item.totalPrice)}
                    </div>
                    <div className="mt-1">
                      <StatusBadge status={item.status} size="sm" />
                    </div>
                  </div>
                </div>

                {/* Cancel option before kitchen accepted */}
                {item.status === 'PLACED' && (
                  <div className="pt-2 border-t border-[#DDD6CA]/60 flex items-center justify-between text-xs">
                    <span className="text-[11px] text-[#777067]">Waiting for kitchen confirmation</span>
                    {cancellingItemId === item.orderItemId ? (
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => handleCancelPlacedItem(item.orderItemId)}
                          className="text-[11px] font-bold text-red-600 hover:underline cursor-pointer"
                        >
                          Confirm cancel
                        </button>
                        <button
                          onClick={() => setCancellingItemId(null)}
                          className="text-[11px] text-[#777067] hover:underline cursor-pointer"
                        >
                          Keep
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => setCancellingItemId(item.orderItemId)}
                        className="text-[11px] font-medium text-stone-500 hover:text-red-600 transition-colors cursor-pointer"
                      >
                        Cancel item
                      </button>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>

        {/* Waiter Staff Call Card (Matching Screenshot) */}
        <div className="bg-[#FFFDF9] border border-[#DDD6CA] rounded-2xl p-3.5 shadow-2xs flex items-center justify-between gap-3">
          <div>
            <h4 className="text-xs font-bold text-[#211F1B]">Need more drinks or cutlery?</h4>
            <p className="text-[11px] text-[#777067] mt-0.5">
              Your waiter Francis is assigned to {activeSession.tableName || 'Table 12'}
            </p>
          </div>
          <button
            onClick={() => setIsAssistanceOpen(true)}
            className="py-1.5 px-3 bg-[#EDE8DF] hover:bg-[#DDD6CA] text-[#211F1B] text-xs font-bold rounded-xl transition-colors cursor-pointer whitespace-nowrap shrink-0"
          >
            Call Waiter
          </button>
        </div>

        {/* CONTEXTUAL PWA INSTALL BANNER */}
        <PwaInstallBanner tableName={activeSession.tableName || 'Table 12'} />
      </main>

      {/* Floating Call Waiter Circular Bell Button (Matching Screenshot) */}
      <button
        onClick={() => setIsAssistanceOpen(true)}
        className="fixed bottom-24 right-4 sm:right-[max(1rem,calc(50%-13rem))] z-40 w-12 h-12 rounded-full bg-[#211F1B] text-white shadow-xl hover:bg-[#312E29] flex items-center justify-center active:scale-95 transition-all border border-[#DDD6CA]/30 cursor-pointer"
        aria-label="Call Waiter"
      >
        <Bell className="w-5 h-5" />
      </button>

      {/* Floating Bottom Action Pill Bar with Order Total (Matching Screenshot) */}
      <div className="fixed bottom-3 inset-x-4 max-w-md mx-auto z-40">
        <div className="bg-[#211F1B] text-white rounded-3xl p-3.5 sm:p-4 shadow-2xl flex items-center justify-between border border-[#36312B]">
          <div>
            <div className="text-[10px] text-[#AAA298] font-bold uppercase tracking-wider">
              Order total
            </div>
            <div className="font-mono text-base sm:text-lg font-black text-white tabular-nums">
              {formatKwacha(outstandingAmount)}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onBackToMenu}
              className="py-2 px-3 bg-[#312E29] hover:bg-[#3E3A34] text-[#F0D8CC] hover:text-white text-xs font-bold rounded-xl flex items-center gap-1 transition-colors cursor-pointer whitespace-nowrap shrink-0"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add more</span>
            </button>

            {outstandingAmount > 0 ? (
              <button
                onClick={onRequestBill}
                className="py-2 px-3.5 bg-[#C9532F] hover:bg-[#B54624] text-white text-xs font-bold rounded-xl flex items-center gap-1.5 shadow-md transition-colors cursor-pointer whitespace-nowrap shrink-0"
              >
                <Receipt className="w-3.5 h-3.5" />
                <span>Bill &amp; Pay</span>
              </button>
            ) : (
              <button
                onClick={() => setShowLeaveModal(true)}
                className="py-2 px-3.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 shadow-md transition-colors cursor-pointer whitespace-nowrap shrink-0"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Leave Table</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Leave Table Confirmation Modal */}
      {showLeaveModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="bg-[#FFFDF9] rounded-3xl p-6 max-w-sm w-full shadow-2xl border border-[#DDD6CA] text-[#211F1B] space-y-4">
            <div>
              <h3 className="text-base font-extrabold">
                Leave {activeSession.tableName || 'Table 12'}?
              </h3>
              <p className="text-xs text-[#777067] mt-1">
                {activeItems.length === 0
                  ? "You haven't placed any orders yet. You can leave this table session anytime."
                  : isPaid
                  ? "Your table bill is paid. Exiting will leave your table session."
                  : "You are currently seated at this table."}
              </p>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowLeaveModal(false)}
                className="flex-1 py-2.5 text-xs font-bold text-[#777067] bg-[#EDE8DF] rounded-xl cursor-pointer"
              >
                Stay
              </button>
              <button
                type="button"
                onClick={handleConfirmLeave}
                className="flex-1 py-2.5 text-xs font-bold text-white bg-[#DC2626] hover:bg-[#B91C1C] rounded-xl cursor-pointer"
              >
                Leave Table
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Assistance Modal */}
      <AssistanceModal
        isOpen={isAssistanceOpen}
        onClose={() => setIsAssistanceOpen(false)}
      />
    </div>
  );
}
