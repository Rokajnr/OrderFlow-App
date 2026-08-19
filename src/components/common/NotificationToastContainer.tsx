import React, { useState, useEffect } from 'react';
import { subscribeToInAppNotifications, DeviceNotificationPayload } from '../../utils/notifications';
import { Bell, X, CheckCircle2, Utensils, Smartphone, CreditCard, ChevronRight } from 'lucide-react';

interface ToastItem extends DeviceNotificationPayload {
  id: string;
  timestamp: number;
}

export const NotificationToastContainer: React.FC<{ onOpenRole?: (role: 'customer' | 'waiter' | 'kitchen' | 'manager') => void }> = ({
  onOpenRole,
}) => {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  useEffect(() => {
    const unsubscribe = subscribeToInAppNotifications((notice) => {
      setToasts((prev) => [notice, ...prev.slice(0, 3)]); // Keep max 4 recent toasts

      // Auto dismiss after 6 seconds
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== notice.id));
      }, 6000);
    });

    return unsubscribe;
  }, []);

  const dismissToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  if (toasts.length === 0) return null;

  return (
    <div className="fixed top-4 right-4 sm:right-6 z-[9999] max-w-sm w-[calc(100vw-2rem)] flex flex-col gap-2.5 pointer-events-none">
      {toasts.map((toast) => {
        const isReady = toast.title.includes('Ready');
        const isAssist = toast.title.includes('Assistance') || toast.title.includes('🛎️');
        const isBill = toast.title.includes('Bill') || toast.title.includes('💳');
        const isOrder = toast.title.includes('Order') || toast.title.includes('📥');

        return (
          <div
            key={toast.id}
            className="pointer-events-auto bg-[#1E1B18]/95 backdrop-blur-md text-stone-100 border border-stone-700/80 rounded-2xl p-3.5 shadow-2xl animate-in slide-in-from-top-4 duration-200 flex items-start gap-3 relative overflow-hidden"
          >
            {/* Left Accent Color Strip */}
            <div
              className={`absolute left-0 top-0 bottom-0 w-1.5 ${
                isReady
                  ? 'bg-emerald-500'
                  : isAssist
                  ? 'bg-amber-500'
                  : isBill
                  ? 'bg-sky-500'
                  : 'bg-[#E05326]'
              }`}
            />

            {/* Icon */}
            <div
              className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                isReady
                  ? 'bg-emerald-500/20 text-emerald-400'
                  : isAssist
                  ? 'bg-amber-500/20 text-amber-400'
                  : isBill
                  ? 'bg-sky-500/20 text-sky-400'
                  : 'bg-[#E05326]/20 text-[#F48259]'
              }`}
            >
              {isReady ? (
                <Utensils className="w-4 h-4" />
              ) : isAssist ? (
                <Bell className="w-4 h-4" />
              ) : isBill ? (
                <CreditCard className="w-4 h-4" />
              ) : (
                <Smartphone className="w-4 h-4" />
              )}
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0 pr-4">
              <div className="flex items-center gap-1.5 mb-0.5">
                <span className="text-[10px] font-bold uppercase tracking-wider text-stone-400">
                  Device Push Notification
                </span>
                <span className="text-[9px] text-stone-500">• Just now</span>
              </div>
              <h4 className="text-xs font-bold text-white truncate">{toast.title}</h4>
              <p className="text-[11px] text-stone-300 line-clamp-2 mt-0.5 leading-snug">
                {toast.body}
              </p>
            </div>

            {/* Close */}
            <button
              onClick={() => dismissToast(toast.id)}
              className="absolute top-2.5 right-2.5 text-stone-400 hover:text-stone-200 p-1 rounded-lg hover:bg-stone-800 transition-colors"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        );
      })}
    </div>
  );
};
