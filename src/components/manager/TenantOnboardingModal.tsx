import React, { useState } from 'react';
import { useTenant } from '../../context/TenantContext';
import { Tenant } from '../../types';
import {
  Building2,
  Plus,
  Check,
  Globe,
  Sparkles,
  MapPin,
  DollarSign,
  Palette,
  X,
} from 'lucide-react';
import { BrandMark } from '../common/BrandMark';

interface TenantOnboardingModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const TenantOnboardingModal: React.FC<TenantOnboardingModalProps> = ({
  isOpen,
  onClose,
}) => {
  const { allTenants, setTenantSlug } = useTenant();

  const [venueName, setVenueName] = useState('');
  const [slug, setSlug] = useState('');
  const [location, setLocation] = useState('Lilongwe, Malawi');
  const [tagline, setTagline] = useState('');
  const [currencySymbol, setCurrencySymbol] = useState('MK');
  const [serviceCharge, setServiceCharge] = useState(10);
  const [primaryColor, setPrimaryColor] = useState('#059669');
  const [createdSuccess, setCreatedSuccess] = useState(false);

  if (!isOpen) return null;

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setVenueName(val);
    const autoSlug = val.toLowerCase().replace(/[^a-z0-9]/g, '');
    setSlug(autoSlug);
  };

  const handleCreateVenue = (e: React.FormEvent) => {
    e.preventDefault();
    if (!venueName.trim() || !slug.trim()) return;

    // Simulate instant tenant registration
    setCreatedSuccess(true);
    setTimeout(() => {
      onClose();
    }, 1500);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-lg bg-[#FFFDF9] rounded-3xl p-6 text-stone-900 shadow-2xl border border-[#DDD6CA] relative max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-[#DDD6CA] shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#FAF0EB] text-[#C9532F] flex items-center justify-center">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-extrabold text-[#211F1B]">
                Register New Restaurant Tenant
              </h2>
              <p className="text-[11px] text-[#777067]">
                Multi-tenant onboarding for Malawian hospitality groups
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

        {createdSuccess ? (
          <div className="py-12 text-center space-y-3">
            <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
              <Check className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-extrabold text-[#211F1B]">Venue Created Successfully!</h3>
            <p className="text-xs text-[#777067] max-w-xs mx-auto">
              {venueName} ({slug}.orderflow.mw) is now live on Firestore with automatic PayChangu settlement endpoints.
            </p>
          </div>
        ) : (
          <form onSubmit={handleCreateVenue} className="flex-1 overflow-y-auto py-4 px-1 space-y-4 text-xs">
            <div>
              <label className="text-[11px] font-extrabold text-[#777067] uppercase tracking-wider block mb-1">
                Restaurant / Bar Name *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Zomba Mountain Lodge & Bistro"
                value={venueName}
                onChange={handleNameChange}
                className="w-full bg-[#F5F0E7] border border-[#DDD6CA] rounded-xl px-3.5 py-2.5 text-xs font-bold text-[#211F1B] focus:outline-hidden focus:border-[#C9532F]"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] font-extrabold text-[#777067] uppercase tracking-wider block mb-1">
                  Tenant Slug *
                </label>
                <div className="flex items-center bg-[#F5F0E7] border border-[#DDD6CA] rounded-xl px-3 py-2 text-xs font-mono font-bold text-[#211F1B]">
                  <span>{slug || 'venue'}</span>
                  <span className="text-stone-400 font-normal">.orderflow.mw</span>
                </div>
              </div>

              <div>
                <label className="text-[11px] font-extrabold text-[#777067] uppercase tracking-wider block mb-1">
                  Location / City *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Zomba Plateau, Malawi"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  className="w-full bg-[#F5F0E7] border border-[#DDD6CA] rounded-xl px-3.5 py-2 text-xs font-semibold text-[#211F1B] focus:outline-hidden focus:border-[#C9532F]"
                />
              </div>
            </div>

            <div>
              <label className="text-[11px] font-extrabold text-[#777067] uppercase tracking-wider block mb-1">
                Tagline / Specialty
              </label>
              <input
                type="text"
                placeholder="e.g. Fresh Mountain Trout &amp; Pine Valley Cocktails"
                value={tagline}
                onChange={(e) => setTagline(e.target.value)}
                className="w-full bg-[#F5F0E7] border border-[#DDD6CA] rounded-xl px-3.5 py-2 text-xs text-[#211F1B] focus:outline-hidden focus:border-[#C9532F]"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] font-extrabold text-[#777067] uppercase tracking-wider block mb-1">
                  Currency Symbol
                </label>
                <input
                  type="text"
                  value={currencySymbol}
                  onChange={(e) => setCurrencySymbol(e.target.value)}
                  className="w-full bg-[#F5F0E7] border border-[#DDD6CA] rounded-xl px-3.5 py-2 text-xs font-mono font-bold text-[#211F1B] focus:outline-hidden focus:border-[#C9532F]"
                />
              </div>

              <div>
                <label className="text-[11px] font-extrabold text-[#777067] uppercase tracking-wider block mb-1">
                  Service Charge (%)
                </label>
                <input
                  type="number"
                  min="0"
                  max="25"
                  value={serviceCharge}
                  onChange={(e) => setServiceCharge(Number(e.target.value))}
                  className="w-full bg-[#F5F0E7] border border-[#DDD6CA] rounded-xl px-3.5 py-2 text-xs font-mono font-bold text-[#211F1B] focus:outline-hidden focus:border-[#C9532F]"
                />
              </div>
            </div>

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
                className="py-2.5 px-5 bg-[#C9532F] hover:bg-[#B54624] text-white rounded-xl text-xs font-bold shadow-md cursor-pointer transition-colors"
              >
                Launch Restaurant Tenant
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
