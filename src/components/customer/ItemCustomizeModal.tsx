import React, { useState } from 'react';
import { MenuItem, MenuItemAddOn } from '../../types';
import { formatKwacha } from '../../utils/formatters';
import { X, Check } from 'lucide-react';
import { QuantityStepper } from '../common/QuantityStepper';
import { OrderFlowButton } from '../common/OrderFlowButton';

interface ItemCustomizeModalProps {
  item: MenuItem | null;
  onClose: () => void;
  onAddToCart: (item: MenuItem, quantity: number, addOns: MenuItemAddOn[], notes: string) => void;
}

export function ItemCustomizeModal({ item, onClose, onAddToCart }: ItemCustomizeModalProps) {
  const [quantity, setQuantity] = useState(1);
  const [selectedAddOns, setSelectedAddOns] = useState<MenuItemAddOn[]>([]);
  const [notes, setNotes] = useState('');
  const [isAdding, setIsAdding] = useState(false);

  if (!item) return null;

  const toggleAddOn = (addOn: MenuItemAddOn) => {
    if (selectedAddOns.some((a) => a.id === addOn.id)) {
      setSelectedAddOns(selectedAddOns.filter((a) => a.id !== addOn.id));
    } else {
      setSelectedAddOns([...selectedAddOns, addOn]);
    }
  };

  const addOnsTotal = selectedAddOns.reduce((sum, a) => sum + a.price, 0);
  const runningTotal = (item.price + addOnsTotal) * quantity;

  const handleAdd = () => {
    setIsAdding(true);
    setTimeout(() => {
      onAddToCart(item, quantity, selectedAddOns, notes);
      setIsAdding(false);
      onClose();
    }, 200);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-xs"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-labelledby="customize-item-title"
        className="w-full max-w-lg max-h-[90vh] overflow-y-auto bg-[#F5F0E7] text-[#211F1B] rounded-t-3xl shadow-2xl border-t border-[#DDD6CA] p-5 animate-in slide-in-from-bottom duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top bar with accessible close */}
        <div className="flex items-center justify-between pb-3 border-b border-[#DDD6CA]">
          <span className="text-xs font-extrabold uppercase tracking-wider text-[#777067]">
            Customize Dish / Drink
          </span>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close dialog"
            className="w-8 h-8 rounded-full bg-[#FFFDF9] border border-[#DDD6CA] flex items-center justify-center text-[#777067] hover:text-[#211F1B] hover:bg-[#EDE8DF] transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Item Header Banner */}
        <div className="flex gap-3.5 items-center bg-[#FFFDF9] p-3.5 rounded-2xl border border-[#DDD6CA] my-3.5 shadow-2xs">
          <img
            src={item.image}
            alt={item.name}
            className="w-18 h-18 rounded-xl object-cover shrink-0 bg-[#EDE8DF] border border-[#DDD6CA]/60"
          />
          <div className="flex-1 min-w-0">
            <h3 id="customize-item-title" className="font-extrabold text-base text-[#211F1B] leading-snug truncate">
              {item.name}
            </h3>
            <p className="text-xs text-[#777067] line-clamp-2 mt-0.5">{item.description}</p>
            <div className="mt-1 font-extrabold text-[#C9532F] text-sm font-mono tabular-nums">
              {formatKwacha(item.price)}
            </div>
          </div>
        </div>

        {/* Quantity Stepper Section */}
        <div className="bg-[#FFFDF9] p-3.5 rounded-2xl border border-[#DDD6CA] mb-3.5 flex items-center justify-between shadow-2xs">
          <div>
            <span className="font-extrabold text-[#211F1B] text-xs block">Portions</span>
            <span className="text-[11px] text-[#777067]">How many servings?</span>
          </div>
          <QuantityStepper value={quantity} onChange={setQuantity} min={1} max={20} />
        </div>

        {/* Add-ons Section */}
        {item.addOns && item.addOns.length > 0 && (
          <div className="bg-[#FFFDF9] p-3.5 rounded-2xl border border-[#DDD6CA] mb-3.5 shadow-2xs">
            <div className="flex items-center justify-between mb-2.5">
              <span className="font-extrabold text-[#211F1B] text-xs">Add-ons &amp; Extras</span>
              <span className="text-[11px] text-[#777067] font-medium">Optional</span>
            </div>
            <div className="space-y-2">
              {item.addOns.map((addon) => {
                const isSelected = selectedAddOns.some((a) => a.id === addon.id);
                return (
                  <button
                    key={addon.id}
                    type="button"
                    onClick={() => toggleAddOn(addon)}
                    className={`w-full flex items-center justify-between p-3 rounded-xl border text-xs transition-all text-left cursor-pointer ${
                      isSelected
                        ? 'bg-[#FAF0EB] border-[#C9532F] text-[#211F1B] font-bold ring-1 ring-[#C9532F]'
                        : 'bg-[#F5F0E7] border-[#DDD6CA] text-[#211F1B] hover:bg-[#EDE8DF]'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <div
                        className={`w-4.5 h-4.5 rounded-md flex items-center justify-center border transition-colors ${
                          isSelected
                            ? 'bg-[#C9532F] border-[#C9532F] text-white'
                            : 'border-[#AAA298] bg-[#FFFDF9]'
                        }`}
                      >
                        {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                      </div>
                      <span>{addon.name}</span>
                    </div>
                    <span className="text-xs font-bold text-[#C9532F] bg-[#FFFDF9] px-2 py-0.5 rounded-md border border-[#DDD6CA]/60 font-mono tabular-nums">
                      +{formatKwacha(addon.price)}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Special Requests / Notes */}
        <div className="bg-[#FFFDF9] p-3.5 rounded-2xl border border-[#DDD6CA] mb-4 shadow-2xs">
          <label htmlFor="special-notes" className="font-extrabold text-[#211F1B] text-xs block mb-1">
            Special instructions
          </label>
          <p className="text-[11px] text-[#777067] mb-2">
            e.g. no onions, extra crispy, sauce on the side
          </p>
          <textarea
            id="special-notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Add note for the kitchen or bartender…"
            rows={2}
            className="w-full text-xs bg-[#F5F0E7] border border-[#DDD6CA] rounded-xl p-2.5 focus:outline-none focus:ring-2 focus:ring-[#C9532F]/20 focus:border-[#211F1B] transition-all resize-none text-[#211F1B] placeholder:text-[#AAA298] font-medium"
          />
        </div>

        {/* Sticky Action Button */}
        <OrderFlowButton
          variant="secondary"
          size="lg"
          fullWidth
          onClick={handleAdd}
          isLoading={isAdding}
          loadingText="Adding to cart…"
          className="h-13 text-sm justify-between px-5"
        >
          <span>Add to table cart</span>
          <span className="font-mono tabular-nums font-black bg-black/20 px-2.5 py-1 rounded-lg text-xs">
            {formatKwacha(runningTotal)}
          </span>
        </OrderFlowButton>
      </div>
    </div>
  );
}
