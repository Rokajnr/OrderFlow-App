import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useTenant } from '../../context/TenantContext';
import { TenantStaffMember, StaffRole } from '../../types';
import { Lock, Delete, X, ShieldAlert, UserCheck, Shield } from 'lucide-react';

interface StaffPinLockModalProps {
  onSuccess?: () => void;
  onCancel?: () => void;
  requiredRole?: StaffRole;
}

export const StaffPinLockModal: React.FC<StaffPinLockModalProps> = ({
  onSuccess,
  onCancel,
  requiredRole,
}) => {
  const { tenant } = useTenant();
  const { staffList, loginWithPin, closePinModal, pinModalCallback, currentStaff } = useAuth();
  
  const [selectedStaff, setSelectedStaff] = useState<TenantStaffMember | null>(() => {
    if (currentStaff) return currentStaff;
    if (requiredRole) {
      const match = staffList.find((s) => s.role === requiredRole && s.active);
      return match || null;
    }
    return null;
  });

  const [pin, setPin] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);

  const filteredStaff = requiredRole
    ? staffList.filter((s) => s.role === requiredRole || s.role === 'manager' || s.role === 'owner')
    : staffList;

  const handleKeyPress = (num: string) => {
    if (pin.length >= 4) return;
    setErrorMessage(null);
    const newPin = pin + num;
    setPin(newPin);

    if (newPin.length === 4) {
      submitPin(newPin);
    }
  };

  const handleDelete = () => {
    setErrorMessage(null);
    setPin((prev) => prev.slice(0, -1));
  };

  const submitPin = (pinToTest: string) => {
    setIsVerifying(true);
    setTimeout(() => {
      const result = loginWithPin(pinToTest, selectedStaff || undefined);
      setIsVerifying(false);
      if (result.success) {
        if (pinModalCallback) pinModalCallback(true);
        if (onSuccess) onSuccess();
        closePinModal();
      } else {
        setErrorMessage('Incorrect PIN. Please try again.');
        setPin('');
        if (pinModalCallback) pinModalCallback(false);
      }
    }, 200);
  };

  const handleClose = () => {
    if (onCancel) onCancel();
    if (pinModalCallback) pinModalCallback(false);
    closePinModal();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="w-full max-w-sm bg-[#1E1B18] border border-[#3A332C] rounded-3xl p-6 text-stone-100 shadow-2xl relative animate-in fade-in zoom-in-95 duration-200">
        
        {/* Close Button */}
        <button
          onClick={handleClose}
          className="absolute top-4 right-4 text-stone-400 hover:text-white p-1 rounded-full bg-stone-800/60 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="text-center mb-5">
          <div className="w-12 h-12 rounded-2xl bg-[#C9532F]/20 border border-[#C9532F]/40 flex items-center justify-center mx-auto mb-3 text-[#E07A5F]">
            <Lock className="w-6 h-6" />
          </div>
          <h3 className="font-serif text-xl font-bold tracking-tight text-stone-100">
            Staff PIN Verification
          </h3>
          <p className="text-xs text-stone-400 mt-1">
            {tenant.name} · Enter your 4-digit shift passcode
          </p>
        </div>

        {/* Staff Member Selector */}
        <div className="mb-4">
          <label className="text-[10px] font-bold text-stone-400 uppercase tracking-wider block mb-1.5 text-center">
            Select Staff Member
          </label>
          <div className="grid grid-cols-2 gap-1.5 max-h-32 overflow-y-auto p-1 bg-stone-900/60 rounded-xl border border-stone-800">
            {filteredStaff.map((staff) => (
              <button
                key={staff.id}
                onClick={() => {
                  setSelectedStaff(staff);
                  setPin('');
                  setErrorMessage(null);
                }}
                className={`px-2.5 py-1.5 rounded-lg text-left text-xs font-semibold flex items-center gap-1.5 transition-all ${
                  selectedStaff?.id === staff.id
                    ? 'bg-[#C9532F] text-white shadow-md'
                    : 'text-stone-300 hover:bg-stone-800/80'
                }`}
              >
                <div className="w-2 h-2 rounded-full bg-emerald-400 shrink-0" />
                <div className="truncate">
                  <div className="truncate font-bold leading-tight">{staff.name}</div>
                  <div className="text-[9px] opacity-75 capitalize">{staff.role}</div>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* PIN Indicators */}
        <div className="flex justify-center items-center gap-3 my-4">
          {[0, 1, 2, 3].map((idx) => (
            <div
              key={idx}
              className={`w-3.5 h-3.5 rounded-full border transition-all duration-150 ${
                pin.length > idx
                  ? 'bg-[#C9532F] border-[#C9532F] scale-110'
                  : 'bg-stone-900 border-stone-700'
              }`}
            />
          ))}
        </div>

        {/* Error message */}
        {errorMessage && (
          <div className="flex items-center justify-center gap-1.5 text-rose-400 text-xs font-semibold mb-3">
            <ShieldAlert className="w-3.5 h-3.5 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Numeric Keypad */}
        <div className="grid grid-cols-3 gap-2 max-w-[240px] mx-auto">
          {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((num) => (
            <button
              key={num}
              onClick={() => handleKeyPress(num)}
              disabled={isVerifying}
              className="h-12 rounded-xl bg-stone-900/90 hover:bg-stone-800 active:bg-[#C9532F] border border-stone-800 text-lg font-bold text-stone-100 transition-all flex items-center justify-center cursor-pointer shadow-sm disabled:opacity-50"
            >
              {num}
            </button>
          ))}
          <button
            onClick={() => {
              setPin('');
              setErrorMessage(null);
            }}
            className="h-12 rounded-xl bg-stone-900/40 hover:bg-stone-800/80 border border-stone-800/60 text-xs font-bold text-stone-400 transition-all flex items-center justify-center"
          >
            Clear
          </button>
          <button
            onClick={() => handleKeyPress('0')}
            disabled={isVerifying}
            className="h-12 rounded-xl bg-stone-900/90 hover:bg-stone-800 active:bg-[#C9532F] border border-stone-800 text-lg font-bold text-stone-100 transition-all flex items-center justify-center cursor-pointer shadow-sm disabled:opacity-50"
          >
            0
          </button>
          <button
            onClick={handleDelete}
            className="h-12 rounded-xl bg-stone-900/40 hover:bg-stone-800/80 border border-stone-800/60 text-stone-400 hover:text-stone-200 transition-all flex items-center justify-center"
          >
            <Delete className="w-5 h-5" />
          </button>
        </div>

        {/* Demo Hint Banner */}
        <div className="mt-5 p-2 bg-stone-900/80 border border-stone-800 rounded-xl text-[10.5px] text-stone-400 text-center">
          <span className="font-bold text-stone-300">Demo PINs: </span>
          <span>Francis: 1111 · Grace: 2222 · Chef: 3333 · Manager: 9999</span>
        </div>
      </div>
    </div>
  );
};
