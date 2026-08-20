import React, { useState } from 'react';
import { useTenant } from '../../context/TenantContext';
import { PaymentFeeBearer } from '../../types';
import {
  CreditCard,
  Key,
  ShieldCheck,
  Percent,
  Check,
  X,
  Smartphone,
  Info,
  Save,
  Lock,
  Globe,
  Radio,
} from 'lucide-react';
import { BrandMark } from '../common/BrandMark';

interface MerchantSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const MerchantSettingsModal: React.FC<MerchantSettingsModalProps> = ({
  isOpen,
  onClose,
}) => {
  const { tenant, updatePayChanguConfig } = useTenant();

  const [publicKey, setPublicKey] = useState(tenant.paychangu?.publicKey || 'pub_live_9841289192410');
  const [secretKey, setSecretKey] = useState(tenant.paychangu?.secretKey || 'sec_live_****************');
  const [feeBearer, setFeeBearer] = useState<PaymentFeeBearer>(
    tenant.paychangu?.feeBearer || 'RESTAURANT'
  );
  const [airtelEnabled, setAirtelEnabled] = useState(tenant.paychangu?.airtelEnabled ?? true);
  const [mpambaEnabled, setMpambaEnabled] = useState(tenant.paychangu?.mpambaEnabled ?? true);
  const [cardsEnabled, setCardsEnabled] = useState(tenant.paychangu?.cardsEnabled ?? true);
  const [savedSuccess, setSavedSuccess] = useState(false);

  if (!isOpen) return null;

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (updatePayChanguConfig) {
      updatePayChanguConfig({
        publicKey,
        secretKey,
        feeBearer,
        airtelEnabled,
        mpambaEnabled,
        cardsEnabled,
      });
    }
    setSavedSuccess(true);
    setTimeout(() => {
      setSavedSuccess(false);
      onClose();
    }, 1200);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-xl bg-[#FFFDF9] rounded-3xl p-6 text-stone-900 shadow-2xl border border-[#DDD6CA] relative max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-[#DDD6CA] shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#FAF0EB] text-[#C9532F] flex items-center justify-center">
              <CreditCard className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-extrabold text-[#211F1B]">
                PayChangu Payment Gateway Settings
              </h2>
              <p className="text-[11px] text-[#777067]">
                Merchant credentials &amp; mobile money gateway fee distribution
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-[#EDE8DF] hover:bg-[#DDD6CA] text-[#777067] hover:text-[#211F1B] transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {savedSuccess ? (
          <div className="py-12 text-center space-y-3">
            <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
              <Check className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-extrabold text-[#211F1B]">Gateway Settings Updated</h3>
            <p className="text-xs text-[#777067]">
              Live merchant keys and fee rules configured for {tenant.name}.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSave} className="flex-1 overflow-y-auto py-4 px-1 space-y-5 text-xs">
            {/* Direct Settlement Notice */}
            <div className="p-3.5 bg-[#FAF0EB] rounded-2xl border border-[#C9532F]/20 flex items-start gap-2.5">
              <ShieldCheck className="w-4 h-4 text-[#C9532F] shrink-0 mt-0.5" />
              <div className="text-[11px] text-[#777067] leading-relaxed">
                <strong className="text-[#211F1B]">Direct Settlement Guarantee:</strong> All customer payments (Airtel Money, TNM Mpamba, VISA) settle directly into {tenant.name}&apos;s PayChangu merchant account with 0% OrderFlow markup.
              </div>
            </div>

            {/* API Keys */}
            <div className="space-y-3">
              <h3 className="font-extrabold text-xs uppercase tracking-wider text-[#777067]">
                Merchant API Keys
              </h3>
              <div>
                <label className="text-[11px] font-bold text-[#211F1B] block mb-1">
                  PayChangu Public Key (Live / Sandbox)
                </label>
                <div className="flex items-center bg-[#F5F0E7] border border-[#DDD6CA] rounded-xl px-3 py-2 text-xs font-mono text-[#211F1B]">
                  <Key className="w-3.5 h-3.5 text-[#777067] mr-2 shrink-0" />
                  <input
                    type="text"
                    value={publicKey}
                    onChange={(e) => setPublicKey(e.target.value)}
                    className="w-full bg-transparent border-none focus:outline-hidden font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="text-[11px] font-bold text-[#211F1B] block mb-1">
                  Webhook Secret Signature Key
                </label>
                <div className="flex items-center bg-[#F5F0E7] border border-[#DDD6CA] rounded-xl px-3 py-2 text-xs font-mono text-[#211F1B]">
                  <Lock className="w-3.5 h-3.5 text-[#777067] mr-2 shrink-0" />
                  <input
                    type="password"
                    value={secretKey}
                    onChange={(e) => setSecretKey(e.target.value)}
                    className="w-full bg-transparent border-none focus:outline-hidden font-mono"
                  />
                </div>
              </div>
            </div>

            {/* Fee Distribution Model */}
            <div className="space-y-3">
              <h3 className="font-extrabold text-xs uppercase tracking-wider text-[#777067]">
                Gateway Processing Fee Allocation (~3%)
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                <label
                  onClick={() => setFeeBearer('RESTAURANT')}
                  className={`p-3 rounded-2xl border cursor-pointer transition-all flex flex-col justify-between ${
                    feeBearer === 'RESTAURANT'
                      ? 'bg-[#FAF0EB] border-[#C9532F] shadow-xs'
                      : 'bg-[#F5F0E7] border-[#DDD6CA] hover:border-[#AAA298]'
                  }`}
                >
                  <div>
                    <span className="font-extrabold text-xs text-[#211F1B] block">
                      Restaurant Absorbs
                    </span>
                    <p className="text-[10px] text-[#777067] mt-1 leading-tight">
                      Diner pays exact food bill total. Venue absorbs gateway fee.
                    </p>
                  </div>
                  <span className={`text-[10px] font-bold mt-2 font-mono ${feeBearer === 'RESTAURANT' ? 'text-[#C9532F]' : 'text-stone-400'}`}>
                    Recommended (Best UX)
                  </span>
                </label>

                <label
                  onClick={() => setFeeBearer('CUSTOMER')}
                  className={`p-3 rounded-2xl border cursor-pointer transition-all flex flex-col justify-between ${
                    feeBearer === 'CUSTOMER'
                      ? 'bg-[#FAF0EB] border-[#C9532F] shadow-xs'
                      : 'bg-[#F5F0E7] border-[#DDD6CA] hover:border-[#AAA298]'
                  }`}
                >
                  <div>
                    <span className="font-extrabold text-xs text-[#211F1B] block">
                      Customer Pays Fee
                    </span>
                    <p className="text-[10px] text-[#777067] mt-1 leading-tight">
                      Surcharge is added directly to diner&apos;s checkout total.
                    </p>
                  </div>
                  <span className={`text-[10px] font-bold mt-2 font-mono ${feeBearer === 'CUSTOMER' ? 'text-[#C9532F]' : 'text-stone-400'}`}>
                    + ~3% Surcharge
                  </span>
                </label>

                <label
                  onClick={() => setFeeBearer('SPLIT')}
                  className={`p-3 rounded-2xl border cursor-pointer transition-all flex flex-col justify-between ${
                    feeBearer === 'SPLIT'
                      ? 'bg-[#FAF0EB] border-[#C9532F] shadow-xs'
                      : 'bg-[#F5F0E7] border-[#DDD6CA] hover:border-[#AAA298]'
                  }`}
                >
                  <div>
                    <span className="font-extrabold text-xs text-[#211F1B] block">
                      50 / 50 Split
                    </span>
                    <p className="text-[10px] text-[#777067] mt-1 leading-tight">
                      Fee is split equally between guest and restaurant.
                    </p>
                  </div>
                  <span className={`text-[10px] font-bold mt-2 font-mono ${feeBearer === 'SPLIT' ? 'text-[#C9532F]' : 'text-stone-400'}`}>
                    1.5% each
                  </span>
                </label>
              </div>
            </div>

            {/* Payment Channels Enabled */}
            <div className="space-y-3">
              <h3 className="font-extrabold text-xs uppercase tracking-wider text-[#777067]">
                Active Payment Channels
              </h3>
              <div className="space-y-2">
                <label className="flex items-center justify-between p-3 bg-[#F5F0E7] rounded-xl border border-[#DDD6CA] cursor-pointer">
                  <div className="flex items-center gap-2.5">
                    <div className="w-3 h-3 rounded-full bg-red-500" />
                    <div>
                      <span className="font-bold text-xs text-[#211F1B] block">Airtel Money Malawi</span>
                      <span className="text-[10px] text-[#777067]">USSD Push STK (*211#)</span>
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={airtelEnabled}
                    onChange={(e) => setAirtelEnabled(e.target.checked)}
                    className="w-4 h-4 rounded text-[#C9532F] focus:ring-[#C9532F]"
                  />
                </label>

                <label className="flex items-center justify-between p-3 bg-[#F5F0E7] rounded-xl border border-[#DDD6CA] cursor-pointer">
                  <div className="flex items-center gap-2.5">
                    <div className="w-3 h-3 rounded-full bg-emerald-500" />
                    <div>
                      <span className="font-bold text-xs text-[#211F1B] block">TNM Mpamba</span>
                      <span className="text-[10px] text-[#777067]">USSD Push Prompt</span>
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={mpambaEnabled}
                    onChange={(e) => setMpambaEnabled(e.target.checked)}
                    className="w-4 h-4 rounded text-[#C9532F] focus:ring-[#C9532F]"
                  />
                </label>

                <label className="flex items-center justify-between p-3 bg-[#F5F0E7] rounded-xl border border-[#DDD6CA] cursor-pointer">
                  <div className="flex items-center gap-2.5">
                    <div className="w-3 h-3 rounded-full bg-blue-500" />
                    <div>
                      <span className="font-bold text-xs text-[#211F1B] block">Visa / Mastercard POS</span>
                      <span className="text-[10px] text-[#777067]">Direct terminal and 3D-Secure web checkout</span>
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={cardsEnabled}
                    onChange={(e) => setCardsEnabled(e.target.checked)}
                    className="w-4 h-4 rounded text-[#C9532F] focus:ring-[#C9532F]"
                  />
                </label>
              </div>
            </div>

            {/* Actions */}
            <div className="pt-3 border-t border-[#DDD6CA] flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={onClose}
                className="py-2.5 px-4 rounded-xl text-xs font-bold text-[#777067] hover:text-[#211F1B]"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="py-2.5 px-5 bg-[#C9532F] hover:bg-[#B54624] text-white rounded-xl text-xs font-bold shadow-md cursor-pointer transition-colors flex items-center gap-1.5"
              >
                <Save className="w-3.5 h-3.5" />
                <span>Save Gateway Configuration</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
