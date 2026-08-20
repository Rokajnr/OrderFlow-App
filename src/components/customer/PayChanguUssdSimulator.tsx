import React, { useState, useEffect } from 'react';
import { useTenant } from '../../context/TenantContext';
import { formatKwacha } from '../../utils/formatters';
import { Smartphone, Check, X, Clock, ShieldCheck, AlertCircle, RefreshCw, Delete } from 'lucide-react';

interface PayChanguUssdSimulatorProps {
  provider: 'airtel' | 'mpamba';
  phoneNumber: string;
  amount: number;
  onSuccess: () => void;
  onFailure: (reason: string) => void;
  onCancel: () => void;
}

export const PayChanguUssdSimulator: React.FC<PayChanguUssdSimulatorProps> = ({
  provider,
  phoneNumber,
  amount,
  onSuccess,
  onFailure,
  onCancel,
}) => {
  const { tenant } = useTenant();
  const [pin, setPin] = useState<string>('');
  const [secondsRemaining, setSecondsRemaining] = useState<number>(45);
  const [ussdState, setUssdState] = useState<'prompt' | 'authorizing' | 'success' | 'failed'>('prompt');
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  // 45s USSD Session Expiry Countdown
  useEffect(() => {
    if (ussdState !== 'prompt') return;
    const timer = setInterval(() => {
      setSecondsRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          setUssdState('failed');
          setStatusMessage('USSD Session Expired (Timeout)');
          onFailure('Session timed out on subscriber handset');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [ussdState, onFailure]);

  const handleKeyClick = (num: string) => {
    if (pin.length >= 4) return;
    const nextPin = pin + num;
    setPin(nextPin);
    if (nextPin.length === 4) {
      processPinAuthorization(nextPin);
    }
  };

  const handleBackspace = () => {
    setPin((prev) => prev.slice(0, -1));
  };

  const processPinAuthorization = (enteredPin: string) => {
    setUssdState('authorizing');
    setStatusMessage('Contacting PayChangu Payment Gateway…');

    setTimeout(() => {
      if (enteredPin === '0000') {
        setUssdState('failed');
        setStatusMessage('Insufficient subscriber funds in wallet.');
        onFailure('Subscriber has insufficient wallet funds');
      } else {
        setUssdState('success');
        setStatusMessage('Payment verified! Webhook dispatched.');
        setTimeout(() => {
          onSuccess();
        }, 900);
      }
    }, 1200);
  };

  const handleQuickApprove = () => {
    setPin('1234');
    processPinAuthorization('1234');
  };

  const handleQuickFail = (reason: string) => {
    setUssdState('failed');
    setStatusMessage(reason);
    onFailure(reason);
  };

  const isAirtel = provider === 'airtel';

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-sm bg-[#161412] border border-stone-700 rounded-[2.5rem] p-5 text-stone-100 shadow-2xl relative overflow-hidden flex flex-col items-center">
        
        {/* Phone Notch & Speaker bar */}
        <div className="w-24 h-4 bg-stone-900 rounded-full mb-3 flex items-center justify-center gap-1.5 border border-stone-800">
          <div className="w-1.5 h-1.5 rounded-full bg-stone-700" />
          <div className="w-8 h-1 rounded-full bg-stone-800" />
        </div>

        {/* Carrier Header */}
        <div className="w-full flex items-center justify-between px-2 pb-3 border-b border-stone-800 text-[11px] text-stone-400">
          <div className="flex items-center gap-1.5">
            <div className={`w-2 h-2 rounded-full ${isAirtel ? 'bg-red-500' : 'bg-emerald-500'}`} />
            <span className="font-bold text-white tracking-wide">
              {isAirtel ? 'AIRTEL MONEY MW' : 'TNM MPAMBA'}
            </span>
          </div>
          <div className="flex items-center gap-1 font-mono">
            <Clock className="w-3 h-3 text-stone-400" />
            <span className={secondsRemaining < 10 ? 'text-rose-400 font-bold' : ''}>
              {secondsRemaining}s
            </span>
          </div>
        </div>

        {/* USSD Dialog Frame */}
        <div className="w-full my-4 bg-stone-900/90 border border-stone-750 rounded-2xl p-4 shadow-inner">
          <div className="flex items-center justify-between pb-2 border-b border-stone-800 text-[10px] text-stone-400 uppercase tracking-wider font-mono">
            <span>USSD Push prompt</span>
            <span>*211#</span>
          </div>

          <div className="py-3 text-center space-y-1.5">
            <div className="text-xs text-stone-300">
              Authorize payment to <strong className="text-white">{tenant.name}</strong>
            </div>
            <div className="text-2xl font-black font-mono text-[#E07A5F] tracking-tight">
              {formatKwacha(amount)}
            </div>
            <div className="text-[10px] text-stone-400 font-mono">
              Phone: {phoneNumber} · Fee: MK 0.00
            </div>
          </div>

          {/* PIN Boxes */}
          <div className="flex justify-center items-center gap-2.5 my-2">
            {[0, 1, 2, 3].map((idx) => (
              <div
                key={idx}
                className={`w-3.5 h-3.5 rounded-full border transition-all ${
                  pin.length > idx
                    ? isAirtel ? 'bg-red-500 border-red-500' : 'bg-emerald-500 border-emerald-500'
                    : 'bg-stone-800 border-stone-700'
                }`}
              />
            ))}
          </div>

          {/* Status feedback */}
          {statusMessage && (
            <div className="mt-2 text-center text-xs font-semibold">
              {ussdState === 'authorizing' && (
                <span className="text-sky-400 flex items-center justify-center gap-1.5">
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>{statusMessage}</span>
                </span>
              )}
              {ussdState === 'success' && (
                <span className="text-emerald-400 flex items-center justify-center gap-1">
                  <Check className="w-3.5 h-3.5" />
                  <span>{statusMessage}</span>
                </span>
              )}
              {ussdState === 'failed' && (
                <span className="text-rose-400 flex items-center justify-center gap-1">
                  <AlertCircle className="w-3.5 h-3.5" />
                  <span>{statusMessage}</span>
                </span>
              )}
            </div>
          )}
        </div>

        {/* Handset Keypad */}
        <div className="grid grid-cols-3 gap-2 w-full max-w-[240px]">
          {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((num) => (
            <button
              key={num}
              onClick={() => handleKeyClick(num)}
              disabled={ussdState !== 'prompt'}
              className="h-10 rounded-xl bg-stone-900 hover:bg-stone-800 active:bg-[#C9532F] border border-stone-800 text-base font-bold text-white transition-all flex items-center justify-center cursor-pointer shadow-xs disabled:opacity-40"
            >
              {num}
            </button>
          ))}
          <button
            onClick={() => setPin('')}
            disabled={ussdState !== 'prompt'}
            className="h-10 rounded-xl bg-stone-900/60 hover:bg-stone-800 text-[11px] font-bold text-stone-400 transition-all flex items-center justify-center disabled:opacity-40"
          >
            Clear
          </button>
          <button
            onClick={() => handleKeyClick('0')}
            disabled={ussdState !== 'prompt'}
            className="h-10 rounded-xl bg-stone-900 hover:bg-stone-800 active:bg-[#C9532F] border border-stone-800 text-base font-bold text-white transition-all flex items-center justify-center cursor-pointer shadow-xs disabled:opacity-40"
          >
            0
          </button>
          <button
            onClick={handleBackspace}
            disabled={ussdState !== 'prompt'}
            className="h-10 rounded-xl bg-stone-900/60 hover:bg-stone-800 text-stone-400 transition-all flex items-center justify-center disabled:opacity-40"
          >
            <Delete className="w-4 h-4" />
          </button>
        </div>

        {/* Sandbox Quick Actions */}
        <div className="w-full mt-4 pt-3 border-t border-stone-800 space-y-1.5">
          <div className="text-[10px] font-bold text-stone-500 text-center uppercase tracking-wider">
            PayChangu Sandbox Controls
          </div>
          <div className="grid grid-cols-2 gap-1.5">
            <button
              type="button"
              onClick={handleQuickApprove}
              className="py-1.5 px-2 bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/30 rounded-xl text-[11px] font-bold transition-all flex items-center justify-center gap-1"
            >
              <Check className="w-3 h-3" />
              <span>Auto-Approve</span>
            </button>
            <button
              type="button"
              onClick={() => handleQuickFail('Subscriber Declined Prompt')}
              className="py-1.5 px-2 bg-rose-600/20 hover:bg-rose-600/30 text-rose-300 border border-rose-500/30 rounded-xl text-[11px] font-bold transition-all flex items-center justify-center gap-1"
            >
              <X className="w-3 h-3" />
              <span>Simulate Decline</span>
            </button>
          </div>
          <button
            type="button"
            onClick={onCancel}
            className="w-full text-center text-xs font-semibold text-stone-400 hover:text-white py-1"
          >
            Cancel and choose other payment method
          </button>
        </div>
      </div>
    </div>
  );
};
