import React, { useState, useEffect } from 'react';
import {
  isNotificationSupported,
  getNotificationPermission,
  requestNotificationPermission,
  sendDeviceNotification,
} from '../../utils/notifications';
import {
  Bell,
  CheckCircle2,
  AlertTriangle,
  Send,
  Smartphone,
  ChefHat,
  CreditCard,
  X,
  Volume2,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export const NotificationTesterModal: React.FC<Props> = ({ isOpen, onClose }) => {
  const [permission, setPermission] = useState<NotificationPermission | 'unsupported'>('default');
  const [testSent, setTestSent] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setPermission(getNotificationPermission());
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleRequestPermission = async () => {
    const perm = await requestNotificationPermission();
    setPermission(perm);
  };

  const fireTest = async (type: 'waiter' | 'kitchen' | 'customer' | 'bill') => {
    let title = '';
    let body = '';

    switch (type) {
      case 'waiter':
        title = '🛎️ Waiter Call — Table 12';
        body = 'Guest Alice requested "Cold Drinking Water & Extra Glasses".';
        break;
      case 'kitchen':
        title = '🍳 Kitchen Alert — Table 12 Ready!';
        body = 'Lake Malawi Buttered Chambo & Chips is READY for pickup at pass.';
        break;
      case 'customer':
        title = '👨‍🍳 Your Order is Cooking!';
        body = 'Lakeview kitchen has started preparing your order #104.';
        break;
      case 'bill':
        title = '💳 Bill Settlement Request — Table 12';
        body = 'Guest requested Airtel Money prompt for MK 42,500.';
        break;
    }

    setTestSent(type);
    await sendDeviceNotification({
      title,
      body,
      tag: `test-${type}`,
      requireInteraction: false,
    });

    setTimeout(() => setTestSent(null), 3000);
  };

  return (
    <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/75 backdrop-blur-xs p-4 animate-in fade-in duration-150">
      <div className="bg-[#1E1B18] border border-stone-700 text-stone-100 rounded-3xl max-w-md w-full shadow-2xl overflow-hidden animate-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="p-5 border-b border-stone-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#E05326]/20 text-[#F48259] border border-[#E05326]/30 flex items-center justify-center">
              <Bell className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-sm text-white">Device Push Notifications</h3>
              <p className="text-[11px] text-stone-400">Live test for mobile and desktop</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-stone-800 hover:bg-stone-700 text-stone-400 hover:text-white flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 space-y-4 text-xs">
          {/* Permission Status Box */}
          <div className="bg-[#2A2520] p-3.5 rounded-2xl border border-stone-700/80 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <ShieldCheck className="w-5 h-5 text-[#F48259]" />
              <div>
                <div className="font-bold text-white text-[11px]">System Notification Status</div>
                <div className="text-[11px] text-stone-400 capitalize">
                  Browser Permission: <span className="font-bold text-stone-200">{permission}</span>
                </div>
              </div>
            </div>

            {permission !== 'granted' && (
              <button
                onClick={handleRequestPermission}
                className="py-1.5 px-3 bg-[#E05326] hover:bg-[#C84318] text-white font-bold rounded-xl text-xs transition-colors shrink-0 shadow-xs"
              >
                Enable
              </button>
            )}
            {permission === 'granted' && (
              <span className="text-[11px] font-bold text-emerald-400 flex items-center gap-1 bg-emerald-950/60 px-2.5 py-1 rounded-xl border border-emerald-800/50">
                <CheckCircle2 className="w-3.5 h-3.5" /> Enabled
              </span>
            )}
          </div>

          <p className="text-stone-300 text-[11px] leading-relaxed">
            OrderFlow pushes alerts to device lock-screens, status bars, and smart watches for instant waiter and kitchen coordination. Tap any trigger below to test immediately:
          </p>

          {/* Test Buttons Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            <button
              onClick={() => fireTest('waiter')}
              className="p-3 bg-[#26211C] hover:bg-[#322C25] border border-stone-700 hover:border-amber-500/50 rounded-2xl text-left transition-all group relative overflow-hidden"
            >
              <div className="flex items-center justify-between mb-1.5">
                <span className="p-1.5 rounded-lg bg-amber-500/20 text-amber-400">
                  <Bell className="w-3.5 h-3.5" />
                </span>
                <Send className="w-3 h-3 text-stone-500 group-hover:text-amber-400 transition-colors" />
              </div>
              <div className="font-bold text-white text-[11px]">1. Waiter Call Alert</div>
              <div className="text-[10px] text-stone-400 truncate">Table 12 assistance call</div>
            </button>

            <button
              onClick={() => fireTest('kitchen')}
              className="p-3 bg-[#26211C] hover:bg-[#322C25] border border-stone-700 hover:border-emerald-500/50 rounded-2xl text-left transition-all group relative overflow-hidden"
            >
              <div className="flex items-center justify-between mb-1.5">
                <span className="p-1.5 rounded-lg bg-emerald-500/20 text-emerald-400">
                  <ChefHat className="w-3.5 h-3.5" />
                </span>
                <Send className="w-3 h-3 text-stone-500 group-hover:text-emerald-400 transition-colors" />
              </div>
              <div className="font-bold text-white text-[11px]">2. Food Ready Alert</div>
              <div className="text-[10px] text-stone-400 truncate">Chambo & Chips ready</div>
            </button>

            <button
              onClick={() => fireTest('customer')}
              className="p-3 bg-[#26211C] hover:bg-[#322C25] border border-stone-700 hover:border-blue-500/50 rounded-2xl text-left transition-all group relative overflow-hidden"
            >
              <div className="flex items-center justify-between mb-1.5">
                <span className="p-1.5 rounded-lg bg-blue-500/20 text-blue-400">
                  <Smartphone className="w-3.5 h-3.5" />
                </span>
                <Send className="w-3 h-3 text-stone-500 group-hover:text-blue-400 transition-colors" />
              </div>
              <div className="font-bold text-white text-[11px]">3. Customer Cooking</div>
              <div className="text-[10px] text-stone-400 truncate">Order status updated</div>
            </button>

            <button
              onClick={() => fireTest('bill')}
              className="p-3 bg-[#26211C] hover:bg-[#322C25] border border-stone-700 hover:border-purple-500/50 rounded-2xl text-left transition-all group relative overflow-hidden"
            >
              <div className="flex items-center justify-between mb-1.5">
                <span className="p-1.5 rounded-lg bg-purple-500/20 text-purple-400">
                  <CreditCard className="w-3.5 h-3.5" />
                </span>
                <Send className="w-3 h-3 text-stone-500 group-hover:text-purple-400 transition-colors" />
              </div>
              <div className="font-bold text-white text-[11px]">4. Bill Requested</div>
              <div className="text-[10px] text-stone-400 truncate">Airtel Money MK 42.5k</div>
            </button>
          </div>

          {/* Device Capability Notice */}
          <div className="bg-[#141210] p-3 rounded-2xl border border-stone-800 text-[11px] text-stone-400 space-y-1">
            <div className="font-semibold text-stone-300 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-[#F48259]" />
              <span>How Push Notifications work in production:</span>
            </div>
            <p>
              • <strong>Android & Desktop:</strong> Native OS banner + vibration via Web Push.
            </p>
            <p>
              • <strong>iOS (iPhone/iPad):</strong> Supported when added to Home Screen via PWA (iOS 16.4+).
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-[#181512] border-t border-stone-800 flex items-center justify-end">
          <button
            onClick={onClose}
            className="py-2 px-4 bg-stone-800 hover:bg-stone-700 text-stone-200 font-bold rounded-xl text-xs transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
