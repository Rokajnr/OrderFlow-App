import React, { useState, useMemo } from 'react';
import { useRestaurant } from '../../context/RestaurantContext';
import { useTenant } from '../../context/TenantContext';
import { OrderItem } from '../../types';
import {
  Users,
  PieChart,
  User,
  CheckSquare,
  Square,
  Divide,
  ArrowRight,
  ShieldCheck,
  Smartphone,
  CreditCard,
  Banknote,
  CheckCircle2,
  Receipt,
  X,
} from 'lucide-react';

interface BillSplitCalculatorProps {
  onBackToFullBill: () => void;
  onInitiatePayment: (amount: number, splitDescription: string, itemIds?: string[]) => void;
}

type SplitMode = 'even' | 'by_guest' | 'by_item';

export const BillSplitCalculator: React.FC<BillSplitCalculatorProps> = ({
  onBackToFullBill,
  onInitiatePayment,
}) => {
  const { tenant, formatPrice } = useTenant();
  const { activeSession, currentGuest } = useRestaurant();

  const unpaidItems = useMemo(
    () => activeSession.items.filter((i) => i.status !== 'VOIDED' && !i.paid),
    [activeSession.items]
  );

  const fullSubtotal = useMemo(
    () => unpaidItems.reduce((sum, i) => sum + i.totalPrice, 0),
    [unpaidItems]
  );

  const fullServiceCharge = useMemo(
    () => Math.round(fullSubtotal * tenant.serviceChargeRate),
    [fullSubtotal, tenant.serviceChargeRate]
  );

  const fullTotal = fullSubtotal + fullServiceCharge;

  const [mode, setMode] = useState<SplitMode>('even');
  
  // 1. Even split state
  const guestsCount = Math.max(2, activeSession.guests?.length || 2);
  const [splitWays, setSplitWays] = useState<number>(guestsCount);

  // 2. By guest state
  const availableGuests = useMemo(() => {
    const list = activeSession.guests && activeSession.guests.length > 0
      ? [...activeSession.guests]
      : ['Alice', 'Bob'];
    
    // Add any guests who ordered items
    unpaidItems.forEach((item) => {
      if (item.orderedBy && !list.includes(item.orderedBy)) {
        list.push(item.orderedBy);
      }
    });
    return list;
  }, [activeSession.guests, unpaidItems]);

  const [selectedGuest, setSelectedGuest] = useState<string>(
    currentGuest || availableGuests[0] || 'Alice'
  );

  // 3. By item custom selection state
  const [selectedItemIds, setSelectedItemIds] = useState<string[]>([]);

  // Computed values
  const evenSplitAmount = Math.round(fullTotal / splitWays);

  // Guest specific calculation
  const guestItems = useMemo(
    () => unpaidItems.filter((i) => i.orderedBy?.toLowerCase() === selectedGuest.toLowerCase()),
    [unpaidItems, selectedGuest]
  );

  const guestSubtotal = useMemo(
    () => guestItems.reduce((sum, i) => sum + i.totalPrice, 0),
    [guestItems]
  );
  const guestServiceCharge = Math.round(guestSubtotal * tenant.serviceChargeRate);
  const guestTotal = guestSubtotal + guestServiceCharge;

  // Custom items calculation
  const customItems = useMemo(
    () => unpaidItems.filter((i) => selectedItemIds.includes(i.orderItemId)),
    [unpaidItems, selectedItemIds]
  );
  const customSubtotal = useMemo(
    () => customItems.reduce((sum, i) => sum + i.totalPrice, 0),
    [customItems]
  );
  const customServiceCharge = Math.round(customSubtotal * tenant.serviceChargeRate);
  const customTotal = customSubtotal + customServiceCharge;

  const toggleItemSelection = (id: string) => {
    setSelectedItemIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const selectAllItems = () => {
    setSelectedItemIds(unpaidItems.map((i) => i.orderItemId));
  };

  const handleProceedPayment = () => {
    if (mode === 'even') {
      onInitiatePayment(evenSplitAmount, `Even Split (1 of ${splitWays} shares)`);
    } else if (mode === 'by_guest') {
      onInitiatePayment(
        guestTotal > 0 ? guestTotal : evenSplitAmount,
        `Guest Portion: ${selectedGuest}`,
        guestItems.map((i) => i.orderItemId)
      );
    } else if (mode === 'by_item') {
      if (selectedItemIds.length === 0) return;
      onInitiatePayment(
        customTotal,
        `Selected ${selectedItemIds.length} Items`,
        selectedItemIds
      );
    }
  };

  return (
    <div className="space-y-4 animate-in fade-in duration-200">
      {/* Header with back button */}
      <div className="flex items-center justify-between">
        <button
          onClick={onBackToFullBill}
          className="text-xs font-bold text-[#777067] hover:text-[#211F1B] flex items-center gap-1 cursor-pointer"
        >
          <X className="w-4 h-4" />
          <span>Pay Entire Bill Instead</span>
        </button>
        <span className="text-[10px] font-extrabold uppercase tracking-wider bg-[#EDE8DF] text-[#777067] px-2.5 py-1 rounded-full border border-[#DDD6CA]">
          Full Outstanding: {formatPrice(fullTotal)}
        </span>
      </div>

      {/* Split Mode Selector Tabs */}
      <div className="grid grid-cols-3 gap-1.5 p-1 bg-[#EDE8DF] rounded-2xl border border-[#DDD6CA]">
        <button
          onClick={() => setMode('even')}
          className={`py-2 px-2 rounded-xl text-xs font-bold flex flex-col sm:flex-row items-center justify-center gap-1 transition-all cursor-pointer ${
            mode === 'even'
              ? 'bg-[#FFFDF9] text-[#211F1B] shadow-xs'
              : 'text-[#777067] hover:text-[#211F1B]'
          }`}
        >
          <Divide className="w-3.5 h-3.5 text-[#C9532F]" />
          <span>Split Evenly</span>
        </button>

        <button
          onClick={() => setMode('by_guest')}
          className={`py-2 px-2 rounded-xl text-xs font-bold flex flex-col sm:flex-row items-center justify-center gap-1 transition-all cursor-pointer ${
            mode === 'by_guest'
              ? 'bg-[#FFFDF9] text-[#211F1B] shadow-xs'
              : 'text-[#777067] hover:text-[#211F1B]'
          }`}
        >
          <User className="w-3.5 h-3.5 text-[#C9532F]" />
          <span>By Guest</span>
        </button>

        <button
          onClick={() => setMode('by_item')}
          className={`py-2 px-2 rounded-xl text-xs font-bold flex flex-col sm:flex-row items-center justify-center gap-1 transition-all cursor-pointer ${
            mode === 'by_item'
              ? 'bg-[#FFFDF9] text-[#211F1B] shadow-xs'
              : 'text-[#777067] hover:text-[#211F1B]'
          }`}
        >
          <PieChart className="w-3.5 h-3.5 text-[#C9532F]" />
          <span>Pick Items</span>
        </button>
      </div>

      {/* MODE 1: SPLIT EVENLY */}
      {mode === 'even' && (
        <div className="bg-[#FFFDF9] rounded-3xl p-5 border border-[#DDD6CA] shadow-2xs space-y-4">
          <div>
            <span className="text-[11px] font-extrabold uppercase tracking-wider text-[#777067] block">
              Equal Division
            </span>
            <h3 className="text-base font-bold text-[#211F1B] mt-0.5">
              Split total across guests
            </h3>
          </div>

          {/* Stepper for number of ways */}
          <div className="flex items-center justify-between p-3.5 bg-[#F5F0E7] rounded-2xl border border-[#DDD6CA]">
            <span className="text-xs font-bold text-[#211F1B]">Number of people:</span>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setSplitWays((prev) => Math.max(2, prev - 1))}
                className="w-8 h-8 rounded-xl bg-[#FFFDF9] border border-[#DDD6CA] font-bold text-sm text-[#211F1B] flex items-center justify-center hover:bg-[#EDE8DF] cursor-pointer"
              >
                -
              </button>
              <span className="font-mono font-black text-lg text-[#211F1B] w-6 text-center">
                {splitWays}
              </span>
              <button
                onClick={() => setSplitWays((prev) => Math.min(12, prev + 1))}
                className="w-8 h-8 rounded-xl bg-[#FFFDF9] border border-[#DDD6CA] font-bold text-sm text-[#211F1B] flex items-center justify-center hover:bg-[#EDE8DF] cursor-pointer"
              >
                +
              </button>
            </div>
          </div>

          {/* Share computation highlight */}
          <div className="p-4 bg-[#FAF0EB] rounded-2xl border border-[#C9532F]/20 text-center">
            <span className="text-xs font-semibold text-[#777067] block">Your individual share (1 of {splitWays})</span>
            <div className="text-2xl font-black font-mono text-[#C9532F] tabular-nums mt-1">
              {formatPrice(evenSplitAmount)}
            </div>
            <span className="text-[11px] text-[#777067] block mt-0.5">
              Includes {tenant.serviceChargePercentage}% service charge ({formatPrice(Math.round(evenSplitAmount * (tenant.serviceChargeRate / (1 + tenant.serviceChargeRate))) )})
            </span>
          </div>
        </div>
      )}

      {/* MODE 2: BY GUEST */}
      {mode === 'by_guest' && (
        <div className="bg-[#FFFDF9] rounded-3xl p-5 border border-[#DDD6CA] shadow-2xs space-y-4">
          <div>
            <span className="text-[11px] font-extrabold uppercase tracking-wider text-[#777067] block">
              Pay By Guest
            </span>
            <h3 className="text-base font-bold text-[#211F1B] mt-0.5">
              Select guest to settle their orders
            </h3>
          </div>

          {/* Guest chips */}
          <div className="flex flex-wrap gap-2">
            {availableGuests.map((guest) => {
              const count = unpaidItems.filter((i) => i.orderedBy?.toLowerCase() === guest.toLowerCase()).length;
              return (
                <button
                  key={guest}
                  onClick={() => setSelectedGuest(guest)}
                  className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                    selectedGuest.toLowerCase() === guest.toLowerCase()
                      ? 'bg-[#C9532F] text-white shadow-xs'
                      : 'bg-[#F5F0E7] text-[#211F1B] border border-[#DDD6CA] hover:border-[#AAA298]'
                  }`}
                >
                  <User className="w-3 h-3" />
                  <span>{guest}</span>
                  <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                    selectedGuest.toLowerCase() === guest.toLowerCase()
                      ? 'bg-white/20 text-white'
                      : 'bg-stone-200 text-[#777067]'
                  }`}>
                    {count} items
                  </span>
                </button>
              );
            })}
          </div>

          {/* Guest items list */}
          <div className="space-y-2 pt-2 border-t border-[#DDD6CA]/60">
            {guestItems.length === 0 ? (
              <div className="p-4 bg-[#F5F0E7] rounded-2xl text-center text-xs text-[#777067]">
                No specific items logged under &quot;{selectedGuest}&quot;. You can use equal split or pick items manually.
              </div>
            ) : (
              guestItems.map((item) => (
                <div
                  key={item.orderItemId}
                  className="flex items-center justify-between text-xs py-1"
                >
                  <span className="font-medium text-[#211F1B]">
                    {item.name} <span className="text-[#777067]">×{item.quantity}</span>
                  </span>
                  <span className="font-mono font-bold text-[#211F1B]">
                    {formatPrice(item.totalPrice)}
                  </span>
                </div>
              ))
            )}
          </div>

          {/* Guest Total Box */}
          {guestItems.length > 0 && (
            <div className="p-4 bg-[#FAF0EB] rounded-2xl border border-[#C9532F]/20 text-center">
              <span className="text-xs font-semibold text-[#777067] block">
                Total for {selectedGuest}
              </span>
              <div className="text-2xl font-black font-mono text-[#C9532F] tabular-nums mt-1">
                {formatPrice(guestTotal)}
              </div>
              <span className="text-[11px] text-[#777067] block mt-0.5">
                Subtotal: {formatPrice(guestSubtotal)} + {tenant.serviceChargePercentage}% Service Charge: {formatPrice(guestServiceCharge)}
              </span>
            </div>
          )}
        </div>
      )}

      {/* MODE 3: BY ITEM SELECTION */}
      {mode === 'by_item' && (
        <div className="bg-[#FFFDF9] rounded-3xl p-5 border border-[#DDD6CA] shadow-2xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-[11px] font-extrabold uppercase tracking-wider text-[#777067] block">
                Select Your Items
              </span>
              <h3 className="text-base font-bold text-[#211F1B] mt-0.5">
                Pay only for what you consumed
              </h3>
            </div>
            <button
              onClick={selectAllItems}
              className="text-xs font-bold text-[#C9532F] hover:underline"
            >
              Select All
            </button>
          </div>

          {/* Checkable items list */}
          <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
            {unpaidItems.map((item) => {
              const isSelected = selectedItemIds.includes(item.orderItemId);
              return (
                <div
                  key={item.orderItemId}
                  onClick={() => toggleItemSelection(item.orderItemId)}
                  className={`p-3 rounded-2xl border flex items-center justify-between gap-3 cursor-pointer transition-all ${
                    isSelected
                      ? 'bg-[#FAF0EB] border-[#C9532F] shadow-2xs'
                      : 'bg-[#F5F0E7] border-[#DDD6CA] hover:border-[#AAA298]'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    {isSelected ? (
                      <CheckSquare className="w-5 h-5 text-[#C9532F] shrink-0" />
                    ) : (
                      <Square className="w-5 h-5 text-[#AAA298] shrink-0" />
                    )}
                    <div>
                      <div className="text-xs font-bold text-[#211F1B]">
                        {item.name} <span className="font-normal text-[#777067]">×{item.quantity}</span>
                      </div>
                      {item.orderedBy && (
                        <span className="text-[10px] text-[#777067]">Ordered by {item.orderedBy}</span>
                      )}
                    </div>
                  </div>
                  <span className="font-mono font-bold text-xs text-[#211F1B]">
                    {formatPrice(item.totalPrice)}
                  </span>
                </div>
              );
            })}
          </div>

          {/* Custom Selection Total */}
          <div className="p-4 bg-[#FAF0EB] rounded-2xl border border-[#C9532F]/20 text-center">
            <span className="text-xs font-semibold text-[#777067] block">
              Total for {selectedItemIds.length} selected item(s)
            </span>
            <div className="text-2xl font-black font-mono text-[#C9532F] tabular-nums mt-1">
              {formatPrice(customTotal)}
            </div>
            <span className="text-[11px] text-[#777067] block mt-0.5">
              Includes {tenant.serviceChargePercentage}% Service Charge ({formatPrice(customServiceCharge)})
            </span>
          </div>
        </div>
      )}

      {/* Proceed to Payment CTA */}
      <button
        onClick={handleProceedPayment}
        disabled={mode === 'by_item' && selectedItemIds.length === 0}
        className="w-full py-4 px-5 bg-[#C9532F] hover:bg-[#B34524] text-white font-bold text-sm rounded-2xl flex items-center justify-center gap-2 shadow-md transition-all cursor-pointer disabled:opacity-50"
      >
        <span>
          Pay {formatPrice(
            mode === 'even'
              ? evenSplitAmount
              : mode === 'by_guest'
              ? (guestTotal > 0 ? guestTotal : evenSplitAmount)
              : customTotal
          )} Portion
        </span>
        <ArrowRight className="w-4 h-4" />
      </button>
    </div>
  );
};
