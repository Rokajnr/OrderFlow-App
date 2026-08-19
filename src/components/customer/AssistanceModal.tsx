import React from 'react';
import { useRestaurant } from '../../context/RestaurantContext';
import { Bell, Droplets, Utensils, Receipt, HelpCircle, X, Check } from 'lucide-react';

interface AssistanceModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AssistanceModal({ isOpen, onClose }: AssistanceModalProps) {
  const { requestAssistance, activeSession } = useRestaurant();
  const [submitted, setSubmitted] = React.useState<string | null>(null);

  if (!isOpen) return null;

  const handleRequest = (type: 'waiter' | 'water' | 'bill' | 'cutlery' | 'general', label: string) => {
    requestAssistance(type, label);
    setSubmitted(label);
    setTimeout(() => {
      setSubmitted(null);
      onClose();
    }, 1200);
  };

  const pendingRequests = activeSession.assistanceRequests.filter((r) => r.status === 'pending');

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-xs p-0 sm:p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md bg-[#FFFDF9] rounded-t-3xl sm:rounded-3xl p-6 shadow-2xl border border-[#DDD6CA] animate-in slide-in-from-bottom-6 duration-200 text-[#211F1B]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between pb-3.5 border-b border-[#DDD6CA]">
          <div>
            <h3 className="text-lg font-serif font-bold text-[#211F1B]">How can we assist you?</h3>
            <p className="text-xs text-[#777067]">
              Waiter Francis will be notified for {activeSession.tableName || 'Table 12'}
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-[#F5F0E7] flex items-center justify-center text-[#777067] hover:bg-[#EDE8DF] transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {submitted ? (
          <div className="py-8 text-center">
            <div className="w-12 h-12 rounded-full bg-[#EBF7EE] text-[#166534] flex items-center justify-center mx-auto mb-3">
              <Check className="w-6 h-6 stroke-[3]" />
            </div>
            <h4 className="text-base font-extrabold text-[#211F1B]">Request Dispatched!</h4>
            <p className="text-xs text-[#777067] mt-1">{submitted}</p>
          </div>
        ) : (
          <div className="py-4 space-y-2.5">
            {pendingRequests.length > 0 && (
              <div className="mb-3 p-3 bg-[#FEF9C3] rounded-xl border border-[#FDE047] flex items-center justify-between text-xs text-[#854D0E]">
                <span className="font-extrabold flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping" />
                  Waiter on the way for: {pendingRequests[0].label}
                </span>
                <span className="text-[11px] font-bold">Active</span>
              </div>
            )}

            <button
              onClick={() => handleRequest('waiter', 'Call Waiter')}
              className="w-full flex items-center gap-3.5 p-3.5 rounded-2xl bg-[#F5F0E7] border border-[#DDD6CA] hover:border-[#C9532F] hover:bg-[#FAF0EB] text-left transition-all group cursor-pointer"
            >
              <div className="w-10 h-10 rounded-xl bg-[#FAF0EB] text-[#C9532F] flex items-center justify-center group-hover:scale-105 transition-transform border border-[#F0D8CC]">
                <Bell className="w-5 h-5" />
              </div>
              <div className="flex-1">
                <div className="font-extrabold text-[#211F1B] text-xs">Call Waiter</div>
                <div className="text-[11px] text-[#777067]">General assistance, recommendations, questions</div>
              </div>
            </button>

            <button
              onClick={() => handleRequest('water', 'Request Table Water')}
              className="w-full flex items-center gap-3.5 p-3.5 rounded-2xl bg-[#F5F0E7] border border-[#DDD6CA] hover:border-sky-500 hover:bg-sky-50 text-left transition-all group cursor-pointer"
            >
              <div className="w-10 h-10 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center group-hover:scale-105 transition-transform border border-sky-100">
                <Droplets className="w-5 h-5" />
              </div>
              <div className="flex-1">
                <div className="font-extrabold text-[#211F1B] text-xs">Request Table Water</div>
                <div className="text-[11px] text-[#777067]">Fresh chilled glasses of drinking water</div>
              </div>
            </button>

            <button
              onClick={() => handleRequest('cutlery', 'Extra Cutlery & Napkins')}
              className="w-full flex items-center gap-3.5 p-3.5 rounded-2xl bg-[#F5F0E7] border border-[#DDD6CA] hover:border-amber-500 hover:bg-amber-50 text-left transition-all group cursor-pointer"
            >
              <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center group-hover:scale-105 transition-transform border border-amber-100">
                <Utensils className="w-5 h-5" />
              </div>
              <div className="flex-1">
                <div className="font-extrabold text-[#211F1B] text-xs">Extra Cutlery &amp; Napkins</div>
                <div className="text-[11px] text-[#777067]">Forks, knives, wet wipes, extra paper napkins</div>
              </div>
            </button>

            <button
              onClick={() => handleRequest('bill', 'Request Bill (In-Person)')}
              className="w-full flex items-center gap-3.5 p-3.5 rounded-2xl bg-[#F5F0E7] border border-[#DDD6CA] hover:border-emerald-500 hover:bg-emerald-50 text-left transition-all group cursor-pointer"
            >
              <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center group-hover:scale-105 transition-transform border border-emerald-100">
                <Receipt className="w-5 h-5" />
              </div>
              <div className="flex-1">
                <div className="font-extrabold text-[#211F1B] text-xs">Request Printed Bill (Cash / POS)</div>
                <div className="text-[11px] text-[#777067]">Waiter will bring bill to table for settlement</div>
              </div>
            </button>
          </div>
        )}

        <div className="mt-1 text-center">
          <p className="text-[10.5px] text-[#777067]">Lakeview Bar &amp; Grill · Fast Table Response Desk</p>
        </div>
      </div>
    </div>
  );
}
