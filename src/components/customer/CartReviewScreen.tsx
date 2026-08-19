import React, { useState } from 'react';
import { useRestaurant } from '../../context/RestaurantContext';
import { formatKwacha } from '../../utils/formatters';
import { ArrowLeft, Trash2, Users, CheckCircle2, ShieldCheck, Wifi } from 'lucide-react';
import { QuantityStepper } from '../common/QuantityStepper';
import { OrderFlowButton } from '../common/OrderFlowButton';

interface CartReviewScreenProps {
  onBackToMenu: () => void;
  onOrderPlaced: () => void;
}

export function CartReviewScreen({ onBackToMenu, onOrderPlaced }: CartReviewScreenProps) {
  const {
    cart,
    removeFromCart,
    updateCartQuantity,
    cartSubtotal,
    placeOrder,
    activeSession,
    currentGuest,
  } = useRestaurant();

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const serviceCharge = Math.round(cartSubtotal * 0.1);
  const orderTotal = cartSubtotal + serviceCharge;

  const handlePlaceOrder = () => {
    if (isSubmitting || cart.length === 0) return;
    setIsSubmitting(true);
    setSubmitError(null);

    // Simulate reliable order dispatch to kitchen & bar
    setTimeout(() => {
      try {
        placeOrder();
        setIsSubmitting(false);
        onOrderPlaced();
      } catch (err) {
        setIsSubmitting(false);
        setSubmitError('Connection interrupted. Please tap Retry to resend your order.');
      }
    }, 750);
  };

  const otherGuests = activeSession.guests.filter((g) => g !== currentGuest);

  return (
    <div className="min-h-screen bg-[#F5F0E7] text-[#211F1B] pb-32">
      {/* Top Header */}
      <header className="bg-[#FFFDF9] border-b border-[#DDD6CA] px-4 py-3.5 sticky top-0 z-30 shadow-xs">
        <div className="max-w-md mx-auto flex items-center justify-between">
          <button
            onClick={onBackToMenu}
            className="flex items-center gap-1.5 text-xs font-extrabold text-[#777067] hover:text-[#211F1B] transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to menu</span>
          </button>
          <div className="text-center">
            <span className="text-xs font-black text-[#211F1B] bg-[#EDE8DF] px-3 py-1 rounded-full border border-[#DDD6CA] font-mono">
              {activeSession.tableName || 'Table 12'}
            </span>
          </div>
          <span className="text-xs font-semibold text-[#777067] font-mono tabular-nums">
            {cart.length} {cart.length === 1 ? 'item' : 'items'}
          </span>
        </div>
      </header>

      <main className="max-w-md mx-auto px-4 pt-3.5 space-y-3.5">
        {/* Shared Session Context Banner */}
        <div className="bg-[#FFFDF9] border border-[#DDD6CA] rounded-2xl p-3.5 flex items-start gap-3 shadow-2xs">
          <div className="w-8 h-8 rounded-xl bg-[#FAF0EB] text-[#C9532F] flex items-center justify-center shrink-0 mt-0.5 border border-[#F0D8CC]">
            <Users className="w-4 h-4" />
          </div>
          <div className="flex-1">
            <h3 className="text-xs font-extrabold text-[#211F1B]">Shared Table Session</h3>
            <p className="text-[11.5px] text-[#777067] mt-0.5 leading-relaxed">
              {otherGuests.length > 0
                ? `${currentGuest} and ${otherGuests.join(', ')} are ordering together at ${activeSession.tableName}. Items will be queued together for the table.`
                : `Ordering as ${currentGuest} at ${activeSession.tableName}. Anyone scanning your table QR joins this session.`}
            </p>
          </div>
        </div>

        {/* Error / Offline Alert if needed */}
        {submitError && (
          <div className="p-3.5 bg-[#FEF2F2] border border-[#FECACA] rounded-2xl text-xs text-[#991B1B] flex items-center justify-between">
            <span>{submitError}</span>
            <button
              onClick={handlePlaceOrder}
              className="px-3 py-1 bg-[#DC2626] text-white font-bold rounded-lg text-xs hover:bg-[#B91C1C]"
            >
              Retry
            </button>
          </div>
        )}

        {/* Empty Cart State */}
        {cart.length === 0 ? (
          <div className="text-center py-16 bg-[#FFFDF9] rounded-3xl border border-[#DDD6CA] p-6 shadow-2xs">
            <div className="w-12 h-12 rounded-full bg-[#EDE8DF] flex items-center justify-center mx-auto mb-3 text-[#777067]">
              <Trash2 className="w-5 h-5" />
            </div>
            <h3 className="text-base font-extrabold text-[#211F1B]">Your order is empty</h3>
            <p className="text-xs text-[#777067] mt-1 max-w-xs mx-auto">
              Select dishes, drinks, or desserts from the Lakeview menu to place your round.
            </p>
            <div className="mt-5">
              <OrderFlowButton variant="primary" size="md" onClick={onBackToMenu}>
                Browse Menu
              </OrderFlowButton>
            </div>
          </div>
        ) : (
          <>
            {/* Cart Items List */}
            <section aria-label="Items in this order" className="space-y-2.5">
              <div className="flex items-center justify-between px-1">
                <span className="text-[11px] font-extrabold uppercase tracking-wider text-[#777067]">
                  Items to Send to Kitchen ({cart.length})
                </span>
                <button
                  type="button"
                  onClick={onBackToMenu}
                  className="text-xs font-extrabold text-[#C9532F] hover:underline cursor-pointer"
                >
                  + Add more
                </button>
              </div>

              {cart.map((item) => (
                <div
                  key={item.cartId}
                  className="bg-[#FFFDF9] rounded-2xl p-3.5 border border-[#DDD6CA] shadow-2xs flex flex-col gap-2.5"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-start gap-3 min-w-0">
                      <img
                        src={item.menuItem.image}
                        alt={item.menuItem.name}
                        className="w-14 h-14 rounded-xl object-cover shrink-0 border border-[#DDD6CA]/60 bg-[#EDE8DF]"
                      />
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <h4 className="font-extrabold text-sm text-[#211F1B] truncate">
                            {item.menuItem.name}
                          </h4>
                          <span className="text-[10px] font-extrabold bg-[#FAF0EB] text-[#C9532F] px-2 py-0.5 rounded-full border border-[#F0D8CC]">
                            {item.orderedBy}
                          </span>
                        </div>

                        {item.selectedAddOns.length > 0 && (
                          <p className="text-[11px] text-[#777067] mt-0.5">
                            + {item.selectedAddOns.map((a) => a.name).join(', ')}
                          </p>
                        )}

                        {item.notes && (
                          <p className="text-[11px] text-[#C2410C] bg-[#FAF0EB] px-2 py-0.5 rounded-md mt-1 inline-block font-medium">
                            Note: {item.notes}
                          </p>
                        )}
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => removeFromCart(item.cartId)}
                      className="text-[#AAA298] hover:text-[#DC2626] p-1.5 transition-colors cursor-pointer"
                      aria-label={`Remove ${item.menuItem.name}`}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Quantity and Price Row */}
                  <div className="flex items-center justify-between pt-2 border-t border-[#DDD6CA]/40">
                    <QuantityStepper
                      size="sm"
                      value={item.quantity}
                      onChange={(newQty) => updateCartQuantity(item.cartId, newQty)}
                      min={1}
                      max={20}
                    />

                    <span className="font-extrabold text-sm text-[#211F1B] font-mono tabular-nums">
                      {formatKwacha(item.totalPrice)}
                    </span>
                  </div>
                </div>
              ))}
            </section>

            {/* Bill Summary Breakdown Card */}
            <div className="bg-[#FFFDF9] rounded-2xl p-4 border border-[#DDD6CA] shadow-2xs space-y-2">
              <span className="text-[11px] font-extrabold uppercase tracking-wider text-[#777067] block">
                Order Breakdown
              </span>

              <div className="flex justify-between text-xs text-[#777067]">
                <span>Round Subtotal</span>
                <span className="font-mono tabular-nums">{formatKwacha(cartSubtotal)}</span>
              </div>

              <div className="flex justify-between text-xs text-[#777067]">
                <span>Service charge (10%)</span>
                <span className="font-mono tabular-nums">{formatKwacha(serviceCharge)}</span>
              </div>

              <div className="border-t border-dashed border-[#DDD6CA] pt-2.5 flex justify-between items-baseline">
                <span className="font-extrabold text-sm text-[#211F1B]">Round Total</span>
                <span className="font-black text-base text-[#C9532F] font-mono tabular-nums">
                  {formatKwacha(orderTotal)}
                </span>
              </div>
            </div>

            {/* Kitchen dispatch notice */}
            <p className="text-[11px] text-[#777067] text-center px-2">
              Items are sent directly to the Lakeview kitchen and bar. You pay at the end of your visit.
            </p>
          </>
        )}
      </main>

      {/* Sticky Place Order CTA with Double-Submit Prevention */}
      {cart.length > 0 && (
        <div className="fixed bottom-0 inset-x-0 bg-[#FFFDF9] border-t border-[#DDD6CA] p-4 z-40 shadow-lg">
          <div className="max-w-md mx-auto">
            <OrderFlowButton
              variant="secondary"
              size="lg"
              fullWidth
              onClick={handlePlaceOrder}
              isLoading={isSubmitting}
              loadingText="Placing order to kitchen…"
              leftIcon={<CheckCircle2 className="w-5 h-5" />}
              className="h-14 justify-between px-5 text-sm font-extrabold shadow-md"
            >
              <span>Place order now</span>
              <span className="font-mono tabular-nums font-black bg-black/20 px-3 py-1 rounded-xl text-xs">
                {formatKwacha(orderTotal)}
              </span>
            </OrderFlowButton>
          </div>
        </div>
      )}
    </div>
  );
}
