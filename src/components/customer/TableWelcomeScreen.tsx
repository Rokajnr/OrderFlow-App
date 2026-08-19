import React, { useState } from 'react';
import { useRestaurant } from '../../context/RestaurantContext';
import { BrandMark } from '../common/BrandMark';
import { OrderFlowButton } from '../common/OrderFlowButton';
import { Sparkles, ArrowRight, Utensils, User, LogOut, RefreshCw } from 'lucide-react';
import { formatKwacha } from '../../utils/formatters';

interface TableWelcomeScreenProps {
  onContinue: () => void;
}

export function TableWelcomeScreen({ onContinue }: TableWelcomeScreenProps) {
  const {
    activeSession,
    currentGuest,
    setCurrentGuest,
    addGuestToSession,
    leaveTableSession,
    tables,
    activeTableId,
    setActiveTableId,
  } = useRestaurant();

  const [name, setName] = useState<string>('');
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [showToast, setShowToast] = useState(false);
  const [showTableSelect, setShowTableSelect] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSwitchingGuest, setIsSwitchingGuest] = useState(false);

  const activeItems = activeSession.items?.filter((i) => i.status !== 'VOIDED') || [];
  const hasExistingSession = activeItems.length > 0;
  const isKnownReturningGuest = !!currentGuest && currentGuest !== 'Guest' && currentGuest.trim().length > 0;

  const triggerProceed = (guestName?: string) => {
    setIsSubmitting(true);
    const trimmed = guestName !== undefined ? guestName.trim() : name.trim();
    const finalName = trimmed || 'Guest';

    // Immediately register guest and mark table active in Firestore & state
    addGuestToSession(finalName);
    setCurrentGuest(finalName);

    if (trimmed) {
      setToastMessage(`Welcome, ${trimmed}. Opening menu…`);
    } else {
      setToastMessage('Opening menu…');
    }
    setShowToast(true);

    setTimeout(() => {
      setShowToast(false);
      setIsSubmitting(false);
      onContinue();
    }, 400);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      triggerProceed();
    }
  };

  const handleClear = () => {
    setName('');
  };

  const handleLeaveTable = () => {
    leaveTableSession();
    setName('');
    setIsSwitchingGuest(false);
    setToastMessage('Left table session. Ready for a new guest.');
    setShowToast(true);
    setTimeout(() => setShowToast(false), 2000);
  };

  // Formatting helpers to prevent duplicate "Table Table 12"
  const cleanTableName = activeSession.tableName
    ? activeSession.tableName.toLowerCase().startsWith('table')
      ? activeSession.tableName
      : `Table ${activeSession.tableName}`
    : 'Table 12';

  const tableNameBadge = cleanTableName.toUpperCase();

  return (
    <div className="min-h-screen bg-[#F5F0E7] text-[#211F1B] flex flex-col selection:bg-[#C9532F]/20 relative overflow-y-auto font-sans">
      {/* Main Responsive Container with Safe Spacing */}
      <div className="w-full max-w-md mx-auto px-5 sm:px-6 py-4 sm:py-6 flex-1 flex flex-col justify-between gap-4">
        
        {/* Zone 1: Top Bar (Brand & Table Picker) */}
        <header className="flex items-center justify-between shrink-0 pb-1">
          <BrandMark showWordmark={true} size="md" variant="terracotta" />

          <div className="relative">
            <button
              onClick={() => setShowTableSelect(!showTableSelect)}
              className="text-[11.5px] font-bold text-[#625B53] bg-[#FFFDF9] hover:bg-[#EDE8DF] border border-[#DDD6CA] rounded-full px-3 py-1.5 transition-colors flex items-center gap-1 cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-[#C9532F]"
              title="Click to switch table for testing"
            >
              <span>{tableNameBadge}</span>
            </button>

            {/* Quick table picker popup for multi-table test/demo */}
            {showTableSelect && (
              <div className="absolute right-0 mt-1.5 w-52 bg-[#FFFDF9] border border-[#DDD6CA] rounded-2xl shadow-xl p-2 z-40 text-xs">
                <div className="text-[10px] font-bold text-[#777067] uppercase px-2 py-1 border-b border-[#DDD6CA]">
                  Select Demo Table
                </div>
                <div className="max-h-48 overflow-y-auto mt-1 space-y-1">
                  {tables.map((t) => (
                    <button
                      key={t.id}
                      onClick={() => {
                        setActiveTableId(t.id);
                        setShowTableSelect(false);
                      }}
                      className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs font-semibold flex items-center justify-between cursor-pointer ${
                        activeTableId === t.id
                          ? 'bg-[#C9532F] text-white'
                          : 'text-[#211F1B] hover:bg-[#F5F0E7]'
                      }`}
                    >
                      <span>{t.name}</span>
                      <span className="text-[10px] opacity-75">{t.section}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </header>

        {/* Zone 2: Main Editorial Hospitality & Guest Entry */}
        <main className="flex-1 flex flex-col justify-center py-2 sm:py-4 space-y-4">
          {/* Eyebrow / Session Context */}
          <div>
            <div className="flex items-center gap-2 text-[#C9532F] text-[11px] font-extrabold tracking-widest uppercase mb-1.5">
              <span className="w-4 h-[2px] bg-current inline-block" />
              <span>Lakeview Bar &amp; Grill · {cleanTableName}</span>
            </div>

            {/* Heading in Editorial Serif */}
            <h1 className="font-serif font-normal text-[30px] sm:text-[36px] leading-[1.1] tracking-tight text-[#211F1B] max-w-[340px] m-0">
              Welcome to{' '}
              <span className="italic block text-[#4F4941] font-serif">
                Lakeview Bar &amp; Grill.
              </span>
            </h1>

            {/* Subtitle */}
            <p className="text-[12.5px] sm:text-[13px] leading-[1.5] text-[#777067] max-w-[330px] mt-2 font-normal">
              Browse the menu, order at your own pace, and keep your table's tab together.
            </p>
          </div>

          {/* Active Session Card if Table already has orders */}
          {hasExistingSession && (
            <div className="p-3 bg-[#FAF0EB] border border-[#F0D8CC] rounded-xl space-y-1">
              <div className="flex items-center gap-1.5 text-xs font-extrabold text-[#C9532F]">
                <Sparkles className="w-3.5 h-3.5 shrink-0" />
                <span>{cleanTableName} tab active</span>
              </div>
              <p className="text-[11.5px] text-[#777067]">
                {activeItems.length} {activeItems.length === 1 ? 'item' : 'items'} in progress (
                {activeSession.guests.join(', ') || 'Guests'}). Total:{' '}
                <strong className="text-[#211F1B] font-mono tabular-nums">
                  {formatKwacha(activeSession.totalAmount || activeSession.subtotal)}
                </strong>
              </p>
            </div>
          )}

          {/* RETURNING ACTIVE GUEST VIEW */}
          {isKnownReturningGuest && !isSwitchingGuest ? (
            <div className="pt-3 border-t border-[#DDD6CA] space-y-3">
              <div className="p-3.5 bg-[#FFFDF9] border border-[#DDD6CA] rounded-2xl flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-full bg-[#FAF0EB] text-[#C9532F] flex items-center justify-center font-bold text-xs border border-[#F0D8CC]">
                    <User className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-[10px] uppercase font-bold tracking-wider text-[#777067]">
                      Active guest session
                    </div>
                    <div className="text-sm font-extrabold text-[#211F1B]">
                      {currentGuest}
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setName(currentGuest);
                    setIsSwitchingGuest(true);
                  }}
                  className="text-[11px] font-bold text-[#C9532F] hover:underline cursor-pointer flex items-center gap-1"
                >
                  <RefreshCw className="w-3 h-3" />
                  <span>Change name</span>
                </button>
              </div>

              {/* Continue Button */}
              <OrderFlowButton
                variant="primary"
                size="lg"
                fullWidth
                onClick={() => triggerProceed(currentGuest)}
                isLoading={isSubmitting}
                loadingText="Opening menu…"
                rightIcon={<ArrowRight className="w-4 h-4 ml-1" />}
              >
                Continue as {currentGuest}
              </OrderFlowButton>

              {/* Leave Table / Reset Action */}
              <div className="flex items-center justify-center pt-1">
                <button
                  type="button"
                  onClick={handleLeaveTable}
                  className="inline-flex items-center gap-1.5 text-[#777067] hover:text-[#C9532F] text-[11.5px] font-semibold cursor-pointer transition-colors"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Leave table / Start new guest</span>
                </button>
              </div>
            </div>
          ) : (
            /* NEW GUEST / NAME ENTRY SECTION */
            <section className="pt-3 border-t border-[#DDD6CA] space-y-3" aria-labelledby="name-title">
              <div>
                <h2 id="name-title" className="text-[14px] font-extrabold tracking-tight text-[#211F1B] mb-0.5">
                  What should we call you?
                </h2>
                <p className="text-[11.5px] leading-[1.4] text-[#777067]">
                  Optional. Helps everyone at {cleanTableName} see who ordered what.
                </p>
              </div>

              {/* Name Input */}
              <div className="relative">
                <input
                  id="name"
                  type="text"
                  autoComplete="given-name"
                  inputMode="text"
                  maxLength={40}
                  placeholder="e.g. Alice"
                  aria-label="Your first name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  onKeyDown={handleKeyDown}
                  className="w-full h-[46px] border border-[#DDD6CA] bg-[#FFFDF9] rounded-xl pl-3.5 pr-10 text-sm text-[#211F1B] placeholder:text-[#AAA298] outline-none shadow-2xs focus:border-[#211F1B] focus:ring-2 focus:ring-[#C9532F]/20 transition-all font-medium"
                />
                {name.trim().length > 0 && (
                  <button
                    type="button"
                    onClick={handleClear}
                    aria-label="Clear name"
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 w-[22px] h-[22px] rounded-full bg-[#EDE8DF] hover:bg-[#DDD6CA] text-[#696157] flex items-center justify-center text-xs font-bold transition-colors cursor-pointer"
                  >
                    ×
                  </button>
                )}
              </div>

              {/* CTA View Menu Button */}
              <OrderFlowButton
                variant="primary"
                size="lg"
                fullWidth
                onClick={() => triggerProceed(name)}
                isLoading={isSubmitting}
                loadingText="Opening menu…"
                rightIcon={<ArrowRight className="w-4 h-4 ml-1" />}
              >
                {hasExistingSession ? 'Join table & view menu' : 'View the menu'}
              </OrderFlowButton>

              {/* Skip Option / Cancel switch */}
              <div className="flex items-center justify-center gap-3 pt-0.5">
                <button
                  type="button"
                  id="skip"
                  onClick={() => triggerProceed('')}
                  className="bg-transparent border-0 text-[#777067] hover:text-[#211F1B] text-[11.5px] font-bold underline underline-offset-3 cursor-pointer transition-colors"
                >
                  Continue without a name
                </button>

                {isKnownReturningGuest && isSwitchingGuest && (
                  <>
                    <span className="text-[#DDD6CA]">•</span>
                    <button
                      type="button"
                      onClick={() => setIsSwitchingGuest(false)}
                      className="bg-transparent border-0 text-[#C9532F] hover:text-[#B54624] text-[11.5px] font-bold cursor-pointer"
                    >
                      Back to {currentGuest}
                    </button>
                  </>
                )}
              </div>
            </section>
          )}
        </main>

        {/* Zone 3: Footer Collaborative Note (Cleanly separated, never overlapping) */}
        <footer className="pt-3 pb-2 flex items-center gap-2 text-[#777067] text-[11px] leading-snug shrink-0 border-t border-[#DDD6CA]">
          <div className="w-4.5 h-4.5 shrink-0 border border-[#DDD6CA] rounded-full flex items-center justify-center bg-[#FFFDF9]">
            <Utensils className="w-2.5 h-2.5 text-[#777067]" />
          </div>
          <span>Others at {cleanTableName} can scan the same QR and order together.</span>
        </footer>
      </div>

      {/* Interactive Feedback Toast */}
      <div
        role="status"
        className={`fixed left-4 right-4 sm:left-auto sm:right-auto sm:w-[350px] bottom-5 z-50 p-3 rounded-xl bg-[#211F1B] text-white text-xs font-bold shadow-2xl transition-all duration-200 pointer-events-none mx-auto ${
          showToast ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'
        }`}
      >
        {toastMessage}
      </div>
    </div>
  );
}
