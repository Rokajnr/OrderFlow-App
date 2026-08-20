import React, { useState, useEffect } from 'react';
import { useRestaurant } from '../../context/RestaurantContext';
import { useTenant } from '../../context/TenantContext';
import { formatKwacha } from '../../utils/formatters';
import {
  ArrowLeft,
  Smartphone,
  CreditCard,
  Banknote,
  CheckCircle2,
  Receipt,
  Star,
  Sparkles,
  ChevronRight,
  ShieldCheck,
  AlertTriangle,
  LogOut,
  RefreshCw,
  Divide,
  Users,
} from 'lucide-react';
import { BrandMark } from '../common/BrandMark';
import { OrderFlowButton } from '../common/OrderFlowButton';
import { BillSplitCalculator } from './BillSplitCalculator';
import { PayChanguUssdSimulator } from './PayChanguUssdSimulator';
import { FiscalReceiptModal } from './FiscalReceiptModal';

interface BillAndPaymentScreenProps {
  onBackToTracker: () => void;
  onBackToMenu: () => void;
  onLeaveTable?: () => void;
}

export function BillAndPaymentScreen({
  onBackToTracker,
  onBackToMenu,
  onLeaveTable,
}: BillAndPaymentScreenProps) {
  const { tenant, formatPrice } = useTenant();
  const {
    activeSession,
    currentGuest,
    requestBill,
    startMobileMoneyPayment,
    confirmPayment,
    confirmSplitPayment,
    cancelPaymentPrompt,
    submitFeedback,
    leaveTableSession,
  } = useRestaurant();

  // Split view toggle
  const [isSplittingBill, setIsSplittingBill] = useState(false);
  const [splitPortionDescription, setSplitPortionDescription] = useState<string | null>(null);
  const [splitTargetItemIds, setSplitTargetItemIds] = useState<string[] | undefined>(undefined);
  const [customPayAmount, setCustomPayAmount] = useState<number | null>(null);

  // Find active items for this bill cycle (unpaid active items, or all active items if in settled view)
  const unpaidItems = activeSession.items.filter((i) => i.status !== 'VOIDED' && !i.paid);
  const activeItems = unpaidItems.length > 0
    ? unpaidItems
    : activeSession.items.filter((i) => i.status !== 'VOIDED');

  const subtotal = unpaidItems.length > 0
    ? unpaidItems.reduce((sum, i) => sum + i.totalPrice, 0)
    : activeSession.subtotal || activeItems.reduce((sum, i) => sum + i.totalPrice, 0);

  const serviceCharge = unpaidItems.length > 0
    ? Math.round(subtotal * 0.1)
    : activeSession.serviceCharge || Math.round(subtotal * 0.1);

  const totalAmount = unpaidItems.length > 0
    ? subtotal + serviceCharge
    : activeSession.totalAmount || (subtotal + serviceCharge);

  const [step, setStep] = useState<'summary' | 'processing' | 'failed' | 'success'>(() => {
    if (activeSession.isPaid && unpaidItems.length === 0) {
      return 'success';
    }
    if (activeSession.paymentState === 'PROCESSING') return 'processing';
    return 'summary';
  });

  const [selectedProvider, setSelectedProvider] = useState<'airtel' | 'mpamba'>('airtel');
  const [phoneNumber, setPhoneNumber] = useState('0991 234 567');
  const [showReceiptModal, setShowReceiptModal] = useState(false);
  const [feedbackRating, setFeedbackRating] = useState(5);
  const [feedbackSent, setFeedbackSent] = useState(false);
  const [paidByWaiterNotified, setPaidByWaiterNotified] = useState(false);
  const [isProcessingAction, setIsProcessingAction] = useState(false);

  // Sync state if session updates externally
  useEffect(() => {
    if (activeSession.paymentState === 'PROCESSING') {
      setStep('processing');
    } else if (activeSession.isPaid && unpaidItems.length === 0) {
      setStep('success');
    } else if (unpaidItems.length > 0 && activeSession.paymentState === 'UNPAID') {
      setStep('summary');
    }
  }, [activeSession.paymentState, activeSession.isPaid, unpaidItems.length]);

  const effectivePayAmount = customPayAmount !== null ? customPayAmount : totalAmount;

  const handleStartMobileMoney = () => {
    setIsProcessingAction(true);
    setTimeout(() => {
      startMobileMoneyPayment(selectedProvider, phoneNumber);
      setIsProcessingAction(false);
      setStep('processing');
    }, 250);
  };

  const handlePayInPersonCash = () => {
    requestBill('cash');
    setPaidByWaiterNotified(true);
  };

  const handlePayInPersonPOS = () => {
    requestBill('card');
    setPaidByWaiterNotified(true);
  };

  const handleSimulatePinSuccess = () => {
    if (customPayAmount !== null) {
      confirmSplitPayment(
        activeSession.tableId,
        'by_item',
        customPayAmount,
        'mobile_money',
        currentGuest || 'Guest',
        splitTargetItemIds
      );
    } else {
      confirmPayment(activeSession.tableId, 'mobile_money', totalAmount, currentGuest);
    }
    setStep('success');
  };

  const handleSimulateFailure = () => {
    setStep('failed');
  };

  const handleFallbackCash = () => {
    cancelPaymentPrompt();
    requestBill('cash');
    setStep('summary');
    setPaidByWaiterNotified(true);
  };

  const handleFeedbackSubmit = () => {
    submitFeedback(feedbackRating, feedbackRating, feedbackRating);
    setFeedbackSent(true);
  };

  const handleLeaveTable = () => {
    leaveTableSession();
    if (onLeaveTable) {
      onLeaveTable();
    } else {
      onBackToMenu();
    }
  };

  return (
    <div className="min-h-screen bg-[#F5F0E7] text-[#211F1B] pb-28 font-sans">
      {/* Top Header */}
      <header className="bg-[#FFFDF9] border-b border-[#DDD6CA] px-4 py-3.5 sticky top-0 z-30 shadow-2xs">
        <div className="max-w-md mx-auto flex items-center justify-between">
          {step === 'summary' ? (
            <button
              onClick={onBackToTracker}
              className="flex items-center gap-1.5 text-xs font-extrabold text-[#777067] hover:text-[#211F1B] transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to order</span>
            </button>
          ) : (
            <BrandMark showWordmark={true} size="sm" variant="terracotta" />
          )}

          <div className="flex items-center gap-2">
            <span className="text-xs font-mono font-extrabold text-[#211F1B] bg-[#EDE8DF] px-2.5 py-1 rounded-full border border-[#DDD6CA]">
              {activeSession.tableName || 'Table 12'}
            </span>
          </div>
        </div>
      </header>

      <main className="max-w-md mx-auto px-4 pt-4">
        {/* ========================================================================= */}
        {/* STATE 1: BILL SUMMARY & PAYMENT METHOD CHOOSER */}
        {/* ========================================================================= */}
        {step === 'summary' && (
          <div className="space-y-4 animate-in fade-in duration-200">
            {/* Itemized Bill Card with ticket-style divider & clean layout matching Screenshot 1 */}
            <div className="bg-[#FFFDF9] rounded-3xl p-6 border border-[#DDD6CA] shadow-2xs relative overflow-hidden">
              {/* Header */}
              <div className="flex items-start justify-between">
                <div>
                  <h2 className="text-2xl font-serif font-bold text-[#211F1B] leading-tight">Bill Summary</h2>
                  <p className="text-xs text-[#777067] mt-0.5 font-medium">
                    Lakeview Bar &amp; Grill · {activeSession.tableName || 'Table 12'}
                  </p>
                </div>
                <div className="text-right">
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#777067] block">
                    SESSION
                  </span>
                  <span className="text-base font-mono font-bold text-[#211F1B]">#5821</span>
                </div>
              </div>

              <div className="my-3.5 border-b border-[#DDD6CA]/60" />

              {/* Items List */}
              <div className="space-y-3.5 py-1">
                {activeItems.map((item) => (
                  <div key={item.orderItemId} className="space-y-0.5">
                    <div className="flex justify-between items-baseline">
                      <div className="text-sm font-bold text-[#211F1B]">
                        <span>{item.name}</span>
                        <span className="text-xs text-[#777067] font-mono ml-1 font-normal">
                          ×{item.quantity}
                        </span>
                      </div>
                      <span className="font-bold text-sm text-[#211F1B] font-mono tabular-nums">
                        {formatKwacha(item.totalPrice)}
                      </span>
                    </div>
                    {item.orderedBy && (
                      <span className="text-xs text-[#C9532F] font-medium block">
                        ({item.orderedBy})
                      </span>
                    )}
                  </div>
                ))}
              </div>

              {/* Ticket Notch Cutout Divider */}
              <div className="relative my-4 -mx-6">
                <div className="border-b border-dashed border-[#DDD6CA]" />
                <div className="absolute -top-2 -left-2.5 w-5 h-5 rounded-full bg-[#F5F0E7]" />
                <div className="absolute -top-2 -right-2.5 w-5 h-5 rounded-full bg-[#F5F0E7]" />
              </div>

              {/* Subtotals & Service Charge */}
              <div className="space-y-1.5 text-xs text-[#777067]">
                <div className="flex justify-between items-center">
                  <span>Subtotal</span>
                  <span className="font-mono font-bold text-[#211F1B] tabular-nums">{formatKwacha(subtotal)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span>Service charge (10%)</span>
                  <span className="font-mono font-bold text-[#211F1B] tabular-nums">{formatKwacha(serviceCharge)}</span>
                </div>
              </div>

              <div className="my-3 border-b border-[#DDD6CA]/60" />

              {/* Total Due */}
              <div className="flex justify-between items-baseline">
                <span className="text-base font-bold text-[#211F1B]">Total Due</span>
                <span className="text-2xl font-black text-[#C9532F] font-mono tabular-nums">
                  {formatKwacha(totalAmount)}
                </span>
              </div>

              {/* Split Bill CTA */}
              <div className="pt-3 border-t border-[#DDD6CA]/60 mt-3">
                <button
                  type="button"
                  onClick={() => setIsSplittingBill(true)}
                  className="w-full py-2.5 px-3 bg-[#EDE8DF] hover:bg-[#DDD6CA] text-[#211F1B] rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-colors cursor-pointer"
                >
                  <Divide className="w-4 h-4 text-[#C9532F]" />
                  <span>Split this bill (Even, by Guest, or by Item)</span>
                </button>
              </div>
            </div>

            {/* Split Calculator View if activated */}
            {isSplittingBill && (
              <BillSplitCalculator
                onBackToFullBill={() => {
                  setIsSplittingBill(false);
                  setSplitPortionDescription(null);
                  setSplitTargetItemIds(undefined);
                  setCustomPayAmount(null);
                }}
                onInitiatePayment={(amount, description, itemIds) => {
                  setCustomPayAmount(amount);
                  setSplitPortionDescription(description);
                  setSplitTargetItemIds(itemIds);
                  setIsSplittingBill(false);
                }}
              />
            )}

            {/* Custom Split Portion Banner */}
            {customPayAmount !== null && (
              <div className="p-3.5 bg-[#FAF0EB] border border-[#C9532F]/40 rounded-2xl flex items-center justify-between gap-2 text-xs">
                <div>
                  <span className="font-extrabold text-[#211F1B] block">
                    Paying Split Portion: {splitPortionDescription}
                  </span>
                  <span className="text-sm font-black font-mono text-[#C9532F]">
                    {formatKwacha(customPayAmount)}
                  </span>
                </div>
                <button
                  onClick={() => {
                    setCustomPayAmount(null);
                    setSplitPortionDescription(null);
                    setSplitTargetItemIds(undefined);
                  }}
                  className="text-[11px] font-bold text-[#777067] hover:text-[#211F1B] underline"
                >
                  Reset to Full
                </button>
              </div>
            )}

            {/* Choose Payment Method Title */}
            <div className="text-[11px] font-extrabold uppercase tracking-wider text-[#777067] pt-1 px-1">
              CHOOSE PAYMENT METHOD
            </div>

            {/* Waiter Notified Notification Banner if in-person requested */}
            {paidByWaiterNotified && (
              <div className="p-3.5 bg-[#FEF9C3] border border-[#FDE047] rounded-2xl flex items-center gap-2.5 text-xs text-[#854D0E] animate-in fade-in">
                <Sparkles className="w-4 h-4 text-amber-600 shrink-0" />
                <div>
                  <span className="font-bold block">Waiter Francis Notified</span>
                  <span>Bringing the bill &amp; card machine/cash receipt to {activeSession.tableName || 'Table 12'}.</span>
                </div>
              </div>
            )}

            {/* Mobile Money Card matching Screenshot 1 */}
            <div className="bg-[#FFFDF9] rounded-3xl p-5 border border-[#DDD6CA] shadow-2xs space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-[#FAF0EB] text-[#C9532F] flex items-center justify-center shrink-0 border border-[#C9532F]/10">
                  <Smartphone className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-extrabold text-sm text-[#211F1B]">Mobile Money</span>
                    <span className="text-[10px] font-black uppercase tracking-wider text-[#16A34A] bg-[#E6F7ED] px-2 py-0.5 rounded-full border border-[#BBF7D0]">
                      INSTANT
                    </span>
                  </div>
                  <span className="text-xs text-[#777067] block">Airtel Money or TNM Mpamba</span>
                </div>
              </div>

              {/* Provider Selection */}
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setSelectedProvider('airtel')}
                  className={`py-3 px-3.5 rounded-2xl border text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                    selectedProvider === 'airtel'
                      ? 'border-2 border-[#DC2626] bg-[#FEF2F2] text-[#DC2626]'
                      : 'border border-[#DDD6CA] bg-[#F5F0E7] text-[#211F1B] hover:border-[#AAA298]'
                  }`}
                >
                  <span className="w-2.5 h-2.5 rounded-full bg-[#DC2626] shrink-0" />
                  <span>Airtel Money</span>
                </button>

                <button
                  type="button"
                  onClick={() => setSelectedProvider('mpamba')}
                  className={`py-3 px-3.5 rounded-2xl border text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                    selectedProvider === 'mpamba'
                      ? 'border-2 border-[#16A34A] bg-[#EBF7EE] text-[#16A34A]'
                      : 'border border-[#DDD6CA] bg-[#F5F0E7] text-[#211F1B] hover:border-[#AAA298]'
                  }`}
                >
                  <span className="w-2.5 h-2.5 rounded-full bg-[#16A34A] shrink-0" />
                  <span>TNM Mpamba</span>
                </button>
              </div>

              {/* Phone Input */}
              <div>
                <label className="text-xs font-bold text-[#777067] block mb-1.5">
                  {selectedProvider === 'mpamba' ? 'TNM' : 'Airtel'} Phone Number
                </label>
                <input
                  type="tel"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  className="w-full bg-[#F5F0E7] border border-[#DDD6CA] rounded-2xl px-4 py-3 text-sm text-[#211F1B] font-mono font-bold tracking-wide focus:outline-none focus:ring-2 focus:ring-[#C9532F]/20 focus:border-[#211F1B]"
                />
              </div>

              {/* Action Button */}
              <button
                type="button"
                onClick={handleStartMobileMoney}
                disabled={isProcessingAction}
                className="w-full py-3.5 px-4 bg-[#C9532F] hover:bg-[#B54624] active:scale-[0.99] text-white font-bold text-xs rounded-2xl flex items-center justify-center gap-1.5 shadow-md transition-all cursor-pointer disabled:opacity-70"
              >
                <span>
                  Pay {formatKwacha(effectivePayAmount)} via {selectedProvider === 'mpamba' ? 'Mpamba' : 'Airtel Money'}
                </span>
                <ChevronRight className="w-4 h-4 shrink-0" />
              </button>
            </div>

            {/* Option B: Pay Waiter with Cash or POS Card Terminal */}
            <div className="bg-[#FFFDF9] rounded-3xl p-4 border border-[#DDD6CA] shadow-2xs space-y-2.5">
              <span className="text-[11px] font-extrabold uppercase text-[#777067] tracking-wider block">
                In-Person Staff Payment
              </span>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={handlePayInPersonCash}
                  className="p-3 bg-[#F5F0E7] hover:bg-[#EDE8DF] border border-[#DDD6CA] rounded-2xl flex items-center gap-2 text-left cursor-pointer transition-all"
                >
                  <Banknote className="w-4 h-4 text-[#166534] shrink-0" />
                  <div>
                    <span className="text-xs font-bold text-[#211F1B] block">Cash to Waiter</span>
                    <span className="text-[10.5px] text-[#777067]">Pay at table</span>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={handlePayInPersonPOS}
                  className="p-3 bg-[#F5F0E7] hover:bg-[#EDE8DF] border border-[#DDD6CA] rounded-2xl flex items-center gap-2 text-left cursor-pointer transition-all"
                >
                  <CreditCard className="w-4 h-4 text-[#1E40AF] shrink-0" />
                  <div>
                    <span className="text-xs font-bold text-[#211F1B] block">POS Machine</span>
                    <span className="text-[10.5px] text-[#777067]">Card tap / insert</span>
                  </div>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* STATE 2: PROCESSING (USSD PUSH SENT — WITH HANDSET SIMULATOR OPTION) */}
        {/* ========================================================================= */}
        {step === 'processing' && (
          <div className="space-y-4 animate-in fade-in duration-200">
            <div className="bg-[#FFFDF9] rounded-3xl p-6 border border-[#DDD6CA] shadow-md text-center space-y-5">
              {/* Radiating pulsating glowing phone animation */}
              <div className="relative w-24 h-24 mx-auto flex items-center justify-center my-2">
                <div className="absolute inset-0 rounded-full bg-[#C9532F]/15 animate-ping opacity-75" />
                <div className="absolute inset-2 rounded-full bg-[#FAF0EB] ring-4 ring-[#C9532F]/25 animate-pulse" />
                <div className="relative w-16 h-16 rounded-full bg-[#FAF0EB] text-[#C9532F] flex items-center justify-center shadow-md shadow-[#C9532F]/20">
                  <Smartphone className="w-8 h-8 animate-bounce" />
                </div>
              </div>

              <div>
                <h2 className="text-xl font-extrabold text-[#211F1B] tracking-tight">
                  Check your phone — action required
                </h2>
                <p className="text-xs text-[#777067] mt-1.5 leading-relaxed max-w-xs mx-auto">
                  Please enter your <strong className="text-[#211F1B]">{selectedProvider === 'airtel' ? 'Airtel Money' : 'TNM Mpamba'}</strong> PIN on{' '}
                  <span className="font-mono font-bold text-[#211F1B]">{phoneNumber}</span> to approve{' '}
                  <strong className="text-[#C9532F] font-mono tabular-nums">{formatKwacha(effectivePayAmount)}</strong>.
                </p>
              </div>

              <div className="p-3 bg-[#F5F0E7] rounded-2xl border border-[#DDD6CA] text-xs font-mono text-[#777067] flex items-center justify-center gap-2">
                <RefreshCw className="w-3.5 h-3.5 animate-spin text-[#C9532F]" />
                <span>Awaiting PayChangu webhook confirmation…</span>
              </div>

              {/* Interactive Phone Simulator Component */}
              <PayChanguUssdSimulator
                provider={selectedProvider}
                phoneNumber={phoneNumber}
                amount={effectivePayAmount}
                onSuccess={handleSimulatePinSuccess}
                onFailure={(reason) => {
                  handleSimulateFailure();
                }}
                onCancel={handleFallbackCash}
              />
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* STATE 3: FAILED PAYMENT */}
        {/* ========================================================================= */}
        {step === 'failed' && (
          <div className="space-y-4 animate-in fade-in duration-200">
            <div className="bg-[#FFFDF9] rounded-3xl p-6 border border-[#FECACA] shadow-md text-center space-y-4">
              <div className="w-16 h-16 rounded-full bg-[#FEF2F2] text-[#DC2626] flex items-center justify-center mx-auto">
                <AlertTriangle className="w-8 h-8" />
              </div>

              <div>
                <h2 className="text-lg font-extrabold text-[#991B1B]">
                  Payment Unsuccessful
                </h2>
                <p className="text-xs text-[#777067] mt-1">
                  The mobile money provider returned a timeout or insufficient balance error.
                </p>
              </div>

              <div className="flex gap-2">
                <OrderFlowButton
                  variant="outline"
                  size="md"
                  fullWidth
                  onClick={() => setStep('summary')}
                >
                  Retry Provider
                </OrderFlowButton>
                <OrderFlowButton
                  variant="secondary"
                  size="md"
                  fullWidth
                  onClick={handleFallbackCash}
                >
                  Pay with Cash / POS
                </OrderFlowButton>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* STATE 4: SUCCESSFUL PAYMENT */}
        {/* ========================================================================= */}
        {step === 'success' && (
          <div className="space-y-4 text-center animate-in zoom-in-95 duration-200">
            <div className="bg-[#FFFDF9] rounded-3xl p-6 border border-[#BBF7D0] shadow-sm space-y-4">
              <div className="w-16 h-16 rounded-full bg-[#EBF7EE] text-[#166534] flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-10 h-10" />
              </div>

              <div>
                <span className="text-xs font-bold text-[#166534] uppercase tracking-wider block">
                  Payment Confirmed ✓
                </span>
                <h2 className="text-2xl font-black text-[#211F1B] font-mono tabular-nums mt-1">
                  {formatKwacha(totalAmount)}
                </h2>
                <p className="text-xs text-[#777067] mt-1">
                  Settled for {activeSession.tableName || 'Table 12'} · Ref: #PC-98421
                </p>
              </div>

              {/* Action Buttons: View Receipt & Leave Table */}
              <div className="pt-3 border-t border-[#DDD6CA] space-y-2">
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => setShowReceiptModal(true)}
                    className="py-2.5 px-3 bg-[#F5F0E7] hover:bg-[#EDE8DF] text-[#211F1B] text-xs font-bold rounded-xl border border-[#DDD6CA] flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Receipt className="w-4 h-4" />
                    <span>View Receipt</span>
                  </button>

                  <button
                    onClick={handleLeaveTable}
                    className="py-2.5 px-3 bg-[#211F1B] hover:bg-[#312E29] text-white text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Leave Table</span>
                  </button>
                </div>

                <p className="text-[11px] text-[#777067] pt-1">
                  Waiter Francis has been notified that your table is settled.
                </p>
              </div>

              {/* Customer Feedback Rating */}
              {!feedbackSent ? (
                <div className="p-4 bg-[#F5F0E7] rounded-2xl border border-[#DDD6CA] space-y-2">
                  <span className="text-xs font-extrabold text-[#211F1B] block">
                    How was your experience today?
                  </span>
                  <div className="flex justify-center gap-2">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        onClick={() => setFeedbackRating(star)}
                        className={`p-1 transition-transform cursor-pointer ${
                          feedbackRating >= star
                            ? 'text-amber-500 scale-110'
                            : 'text-[#DDD6CA] hover:text-[#AAA298]'
                        }`}
                      >
                        <Star className="w-6 h-6 fill-current" />
                      </button>
                    ))}
                  </div>
                  <button
                    type="button"
                    onClick={handleFeedbackSubmit}
                    className="w-full py-2 bg-[#C9532F] hover:bg-[#B54624] text-white text-xs font-bold rounded-xl cursor-pointer"
                  >
                    Submit Feedback
                  </button>
                </div>
              ) : (
                <div className="p-3 bg-[#EBF7EE] rounded-2xl border border-[#BBF7D0] text-xs font-bold text-[#166534]">
                  Thank you for your feedback!
                </div>
              )}
            </div>

            <div>
              <button
                onClick={onBackToMenu}
                className="text-xs font-bold text-[#777067] hover:text-[#211F1B] transition-colors cursor-pointer"
              >
                Back to Lakeview menu (Order another round)
              </button>
            </div>
          </div>
        )}

        {/* Fiscal & MRA Tax Digital Receipt Modal */}
        <FiscalReceiptModal
          session={activeSession}
          isOpen={showReceiptModal}
          onClose={() => setShowReceiptModal(false)}
          guestName={currentGuest}
          paymentMethod={
            activeSession.paymentMethod === 'mobile_money'
              ? `${activeSession.mobileMoneyProvider === 'airtel' ? 'Airtel Money' : 'TNM Mpamba'} (PayChangu)`
              : activeSession.paymentMethod === 'card'
              ? 'POS Card Terminal'
              : 'Cash to Waiter'
          }
        />
      </main>
    </div>
  );
}
