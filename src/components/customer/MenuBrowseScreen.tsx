import React, { useState } from 'react';
import { useRestaurant } from '../../context/RestaurantContext';
import { Category, MenuItem } from '../../types';
import { formatKwacha } from '../../utils/formatters';
import {
  Utensils,
  Coffee,
  IceCream,
  Plus,
  Bell,
  ChevronRight,
  Search,
  Users,
  Sparkles,
  X,
  Clock,
  TrendingUp,
  LogOut,
  Receipt,
} from 'lucide-react';
import { ItemCustomizeModal } from './ItemCustomizeModal';
import { AssistanceModal } from './AssistanceModal';
import { BrandMark } from '../common/BrandMark';
import { ActiveSessionBanner } from '../common/ActiveSessionBanner';

interface MenuBrowseScreenProps {
  onOpenCart: () => void;
  onOpenTracker: () => void;
  onOpenWelcome?: () => void;
}

export function MenuBrowseScreen({ onOpenCart, onOpenTracker, onOpenWelcome }: MenuBrowseScreenProps) {
  const {
    menu,
    activeSession,
    cartTotalCount,
    cartSubtotal,
    addToCart,
    currentGuest,
    setCurrentGuest,
    leaveTableSession,
  } = useRestaurant();

  const [activeCategory, setActiveCategory] = useState<Category>('food');
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [customizingItem, setCustomizingItem] = useState<MenuItem | null>(null);
  const [isAssistanceOpen, setIsAssistanceOpen] = useState(false);
  const [showGuestPicker, setShowGuestPicker] = useState(false);
  const [guestNameInput, setGuestNameInput] = useState('');
  const [isSessionBannerDismissed, setIsSessionBannerDismissed] = useState(false);
  const [showLeaveModal, setShowLeaveModal] = useState(false);

  const popularSearches = ['Chambo', 'Chicken', 'Chips', 'Carlsberg', 'Gin & Tonic', 'Platter'];

  const filteredItems = menu.filter((item) => {
    const matchesCategory = item.category === activeCategory;
    const matchesSearch =
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.description.toLowerCase().includes(searchQuery.toLowerCase());

    if (searchQuery.trim().length > 0) {
      return matchesSearch;
    }
    return matchesCategory;
  });

  const categories: { key: Category; label: string; icon: typeof Utensils }[] = [
    { key: 'food', label: 'Food', icon: Utensils },
    { key: 'drinks', label: 'Drinks', icon: Coffee },
    { key: 'desserts', label: 'Desserts', icon: IceCream },
  ];

  const activeItems = activeSession.items.filter((i) => i.status !== 'VOIDED');
  const orderedItemsCount = activeItems.length;

  const handleConfirmLeave = () => {
    leaveTableSession();
    setShowLeaveModal(false);
    if (onOpenWelcome) {
      onOpenWelcome();
    }
  };

  return (
    <div className="min-h-screen bg-[#F5F0E7] text-[#211F1B] pb-36 font-sans">
      {/* Header Container */}
      <header className="bg-[#FFFDF9] border-b border-[#DDD6CA] px-4 pt-3.5 pb-3 sticky top-0 z-30 shadow-2xs">
        <div className="max-w-md mx-auto">
          {/* Top Row: Brand & Table Context */}
          <div className="flex items-center justify-between">
            <BrandMark showWordmark={true} size="sm" variant="terracotta" />

            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowGuestPicker(true)}
                className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-[#FAF0EB] border border-[#F0D8CC] text-[#C9532F] text-xs font-bold hover:bg-[#F0D8CC] transition-colors cursor-pointer"
                title="Change active guest name"
              >
                <span>{currentGuest}</span>
                <span className="text-[10px] text-[#777067] font-normal">✎</span>
              </button>

              <span className="text-xs font-mono font-extrabold text-[#211F1B] bg-[#EDE8DF] px-2.5 py-1 rounded-full border border-[#DDD6CA]">
                {activeSession.tableName || 'Table 12'}
              </span>

              {/* Leave Table Trigger */}
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

          {/* Restaurant Title in Editorial Serif */}
          <div className="mt-2 flex items-baseline justify-between">
            <h1 className="text-xl font-serif font-bold tracking-tight text-[#211F1B]">
              Lakeview Bar &amp; Grill
            </h1>
            {orderedItemsCount > 0 && isSessionBannerDismissed && (
              <button
                onClick={onOpenTracker}
                className="text-xs font-bold text-[#C9532F] hover:underline flex items-center gap-0.5 cursor-pointer"
              >
                <span>Active Order ({orderedItemsCount})</span>
                <ChevronRight className="w-3 h-3" />
              </button>
            )}
          </div>

          {/* Search bar with instant clear */}
          <div className="mt-2.5 relative">
            <Search className="w-4 h-4 text-[#777067] absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search dishes, drinks, ingredients…"
              value={searchQuery}
              onFocus={() => setIsSearchFocused(true)}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-[#F5F0E7] border border-[#DDD6CA] rounded-xl pl-9 pr-9 py-2 text-xs text-[#211F1B] placeholder:text-[#AAA298] focus:outline-none focus:ring-2 focus:ring-[#C9532F]/20 focus:border-[#211F1B] transition-all font-medium"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 w-5 h-5 rounded-full bg-[#DDD6CA] text-[#211F1B] flex items-center justify-center text-xs font-bold hover:bg-[#AAA298] transition-colors cursor-pointer"
              >
                ×
              </button>
            )}
          </div>

          {/* Search Suggestions */}
          {isSearchFocused && !searchQuery && (
            <div className="mt-2 pt-2 border-t border-[#DDD6CA]/60 flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#777067] shrink-0 flex items-center gap-1">
                <TrendingUp className="w-3 h-3 text-[#C9532F]" />
                Popular:
              </span>
              {popularSearches.map((s) => (
                <button
                  key={s}
                  onClick={() => setSearchQuery(s)}
                  className="px-2 py-0.5 bg-[#EDE8DF] hover:bg-[#DDD6CA] text-[#211F1B] text-[11px] font-medium rounded-md shrink-0 transition-colors cursor-pointer"
                >
                  {s}
                </button>
              ))}
            </div>
          )}

          {/* Category Tabs */}
          {!searchQuery && (
            <nav className="flex items-center gap-2 mt-3 pt-1 border-t border-[#DDD6CA]/40" aria-label="Menu categories">
              {categories.map((cat) => {
                const Icon = cat.icon;
                const isActive = activeCategory === cat.key;
                return (
                  <button
                    key={cat.key}
                    onClick={() => setActiveCategory(cat.key)}
                    className={`flex items-center gap-1.5 py-1.5 px-3.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      isActive
                        ? 'bg-[#211F1B] text-white shadow-2xs'
                        : 'bg-[#EDE8DF] text-[#777067] hover:text-[#211F1B]'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    <span>{cat.label}</span>
                  </button>
                );
              })}
            </nav>
          )}
        </div>
      </header>

      <main className="max-w-md mx-auto px-4 pt-3.5 space-y-3.5">
        {/* DISMISSIBLE ACTIVE SESSION BANNER (Dismissing ONLY hides banner, leaves session intact) */}
        {orderedItemsCount > 0 && !isSessionBannerDismissed && (
          <ActiveSessionBanner
            tableName={activeSession.tableName || 'Table 12'}
            activeItemCount={orderedItemsCount}
            totalAmount={activeSession.totalAmount || activeSession.subtotal}
            onViewOrder={onOpenTracker}
            onDismiss={() => setIsSessionBannerDismissed(true)}
          />
        )}

        {/* Menu Items Grid */}
        <section aria-label="Menu Items" className="space-y-3">
          {filteredItems.map((item) => (
            <article
              key={item.id}
              onClick={() => {
                if (item.available) setCustomizingItem(item);
              }}
              className={`bg-[#FFFDF9] rounded-2xl p-3.5 border transition-all flex gap-3.5 items-start ${
                item.available
                  ? 'border-[#DDD6CA] shadow-2xs hover:border-[#211F1B] cursor-pointer'
                  : 'border-[#DDD6CA] opacity-60 bg-[#FAF8F5] cursor-not-allowed'
              }`}
            >
              <img
                src={item.image}
                alt={item.name}
                className="w-20 h-20 rounded-xl object-cover shrink-0 border border-[#DDD6CA]/60 bg-[#EDE8DF]"
              />

              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-1">
                  <h3 className="font-extrabold text-sm text-[#211F1B] leading-tight truncate">
                    {item.name}
                  </h3>
                  {item.popular && (
                    <span className="text-[9.5px] font-bold text-[#C9532F] bg-[#FAF0EB] px-1.5 py-0.5 rounded shrink-0">
                      Popular
                    </span>
                  )}
                </div>

                <p className="text-xs text-[#777067] line-clamp-2 mt-1 leading-snug">
                  {item.description}
                </p>

                <div className="mt-2 flex items-center justify-between">
                  <span className="font-mono font-black text-xs text-[#C9532F] tabular-nums">
                    {formatKwacha(item.price)}
                  </span>

                  {item.available ? (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setCustomizingItem(item);
                      }}
                      className="w-7 h-7 rounded-lg bg-[#211F1B] hover:bg-[#312E29] text-white flex items-center justify-center shadow-2xs active:scale-95 transition-all cursor-pointer"
                      aria-label={`Add ${item.name}`}
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  ) : (
                    <span className="text-[10px] font-bold uppercase text-[#777067]">
                      Sold Out
                    </span>
                  )}
                </div>
              </div>
            </article>
          ))}
        </section>
      </main>

      {/* Floating Waiter Call Control */}
      <button
        onClick={() => setIsAssistanceOpen(true)}
        className="fixed bottom-22 right-4 sm:right-[max(1rem,calc(50%-13rem))] z-40 w-12 h-12 rounded-full bg-[#211F1B] text-white shadow-xl hover:bg-[#312E29] flex items-center justify-center active:scale-95 transition-all border border-[#DDD6CA]/30 cursor-pointer"
        aria-label="Call Waiter"
      >
        <Bell className="w-5 h-5" />
      </button>

      {/* Sticky Bottom Bar: Cart when items in cart, or Clean Live Order Pill when table has active orders */}
      {cartTotalCount > 0 ? (
        <div className="fixed bottom-3 inset-x-4 max-w-md mx-auto z-40">
          <button
            onClick={onOpenCart}
            className="w-full bg-[#211F1B] hover:bg-[#312E29] text-white rounded-3xl p-3.5 sm:p-4 shadow-2xl flex items-center justify-between border border-[#36312B] active:scale-[0.99] transition-all cursor-pointer"
          >
            <div className="flex items-center gap-2.5">
              <span className="w-6 h-6 rounded-full bg-[#C9532F] text-white text-xs font-black flex items-center justify-center font-mono">
                {cartTotalCount}
              </span>
              <span className="text-xs font-bold text-white">Review Shared Cart</span>
            </div>

            <div className="flex items-center gap-1 text-xs font-bold font-mono">
              <span className="text-[#F0D8CC] tabular-nums">{formatKwacha(cartSubtotal)}</span>
              <ChevronRight className="w-4 h-4 text-[#AAA298]" />
            </div>
          </button>
        </div>
      ) : orderedItemsCount > 0 ? (
        <div className="fixed bottom-3 inset-x-4 max-w-md mx-auto z-40">
          <button
            onClick={onOpenTracker}
            className="w-full bg-[#211F1B] hover:bg-[#312E29] text-white rounded-3xl p-3.5 sm:p-4 shadow-2xl flex items-center justify-between border border-[#36312B] active:scale-[0.99] transition-all cursor-pointer text-left"
          >
            <div className="flex items-center gap-2.5">
              <span className="relative flex h-2 w-2 shrink-0">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500 shadow-[0_0_6px_rgba(16,185,129,0.8)]" />
              </span>
              <div>
                <div className="text-[10.5px] text-[#AAA298] font-medium leading-none">
                  Live Order
                </div>
                <div className="text-[12.5px] sm:text-[13px] font-bold text-white font-mono tracking-tight mt-0.5">
                  {orderedItemsCount} {orderedItemsCount === 1 ? 'item' : 'items'} · {formatKwacha(activeSession.totalAmount || activeSession.subtotal)}
                </div>
              </div>
            </div>

            <div className="text-[#C9532F] hover:text-[#E0643E] text-xs font-bold flex items-center gap-1">
              <span>Track order</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </div>
          </button>
        </div>
      ) : null}

      {/* Item Customization Modal */}
      {customizingItem && (
        <ItemCustomizeModal
          item={customizingItem}
          onClose={() => setCustomizingItem(null)}
          onAddToCart={(item, qty, addOns, notes) => {
            addToCart(item, qty, addOns, notes);
            setCustomizingItem(null);
          }}
        />
      )}

      {/* Assistance Modal */}
      <AssistanceModal
        isOpen={isAssistanceOpen}
        onClose={() => setIsAssistanceOpen(false)}
      />

      {/* Change Guest Name Modal */}
      {showGuestPicker && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="bg-[#FFFDF9] rounded-3xl p-6 max-w-sm w-full shadow-2xl border border-[#DDD6CA] text-[#211F1B] space-y-4">
            <div>
              <h3 className="text-base font-extrabold">Who is ordering?</h3>
              <p className="text-xs text-[#777067] mt-0.5">
                Set your name so dishes are tagged correctly in your group tab.
              </p>
            </div>

            <input
              type="text"
              autoFocus
              defaultValue={currentGuest}
              onChange={(e) => setGuestNameInput(e.target.value)}
              placeholder="e.g. Alice"
              className="w-full bg-[#F5F0E7] border border-[#DDD6CA] rounded-xl px-3.5 py-2.5 text-xs text-[#211F1B] font-bold focus:outline-none focus:ring-2 focus:ring-[#C9532F]/20 focus:border-[#211F1B]"
            />

            <div className="flex gap-2 pt-1">
              <button
                type="button"
                onClick={() => setShowGuestPicker(false)}
                className="flex-1 py-2.5 text-xs font-bold text-[#777067] bg-[#EDE8DF] rounded-xl cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  if (guestNameInput.trim()) {
                    setCurrentGuest(guestNameInput.trim());
                  }
                  setShowGuestPicker(false);
                }}
                className="flex-1 py-2.5 text-xs font-bold text-white bg-[#C9532F] hover:bg-[#B54624] rounded-xl cursor-pointer"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Leave Table Confirmation Modal (Section 7) */}
      {showLeaveModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="bg-[#FFFDF9] rounded-3xl p-6 max-w-sm w-full shadow-2xl border border-[#DDD6CA] text-[#211F1B] space-y-4">
            <div>
              <h3 className="text-base font-extrabold">
                Leave {activeSession.tableName || 'Table 12'}?
              </h3>
              <p className="text-xs text-[#777067] mt-1">
                {orderedItemsCount === 0
                  ? "You haven't placed any orders yet. Leaving will remove you from this table session."
                  : "You are leaving your personal participation in this table group. Other guests' orders remain active."}
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
    </div>
  );
}
