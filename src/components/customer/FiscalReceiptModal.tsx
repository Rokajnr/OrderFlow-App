import React, { useRef } from 'react';
import { useTenant } from '../../context/TenantContext';
import { TableSession, OrderItem } from '../../types';
import { formatKwacha } from '../../utils/formatters';
import { BrandMark } from '../common/BrandMark';
import { Printer, Share2, CheckCircle2, ShieldCheck, X, QrCode } from 'lucide-react';

interface FiscalReceiptModalProps {
  session: TableSession;
  isOpen: boolean;
  onClose: () => void;
  guestName?: string;
  paymentMethod?: string;
}

export const FiscalReceiptModal: React.FC<FiscalReceiptModalProps> = ({
  session,
  isOpen,
  onClose,
  guestName = 'Guest',
  paymentMethod = 'PayChangu Mobile Money',
}) => {
  const { tenant, formatPrice } = useTenant();
  const receiptRef = useRef<HTMLDivElement>(null);

  if (!isOpen) return null;

  const items = session.items.filter((i) => i.status !== 'VOIDED');
  const subtotal = session.subtotal || items.reduce((s, i) => s + i.totalPrice, 0);
  const serviceCharge = session.serviceCharge || Math.round(subtotal * tenant.serviceChargeRate);
  const totalAmount = subtotal + serviceCharge;

  // Malawi 16.5% VAT fiscal breakdown included in food subtotal
  const vatRate = 0.165;
  const taxableAmount = Math.round(subtotal / (1 + vatRate));
  const vatAmount = subtotal - taxableAmount;

  const receiptNumber = `MW-${tenant.slug.toUpperCase()}-${Math.floor(100000 + Math.random() * 900000)}`;
  const timestamp = new Date().toLocaleString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-sm bg-[#FFFDF9] rounded-3xl p-5 text-stone-900 shadow-2xl border border-stone-300 relative max-h-[90vh] flex flex-col">
        
        {/* Modal Actions Header */}
        <div className="flex items-center justify-between pb-3 border-b border-stone-200 shrink-0">
          <span className="text-[11px] font-extrabold uppercase tracking-wider text-stone-500">
            Fiscal Settlement Slip
          </span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePrint}
              className="p-1.5 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 transition-colors"
              title="Print Receipt"
            >
              <Printer className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Printable Thermal Receipt Body */}
        <div ref={receiptRef} className="flex-1 overflow-y-auto py-3 px-1 space-y-3 font-mono text-xs text-stone-800">
          
          {/* Restaurant Header */}
          <div className="text-center space-y-1 pb-3 border-b border-dashed border-stone-300">
            <BrandMark size="md" variant="terracotta" className="mx-auto mb-1" />
            <h2 className="font-serif font-black text-base text-stone-900 tracking-tight">
              {tenant.name}
            </h2>
            <p className="text-[10px] text-stone-600 font-sans">{tenant.location}</p>
            <p className="text-[10px] text-stone-500 font-sans">
              TPIN (MRA): 300482910 · Tel: +265 888 123 456
            </p>
          </div>

          {/* Session Details */}
          <div className="text-[11px] space-y-0.5 text-stone-600">
            <div className="flex justify-between">
              <span>Receipt No:</span>
              <span className="font-bold text-stone-900">{receiptNumber}</span>
            </div>
            <div className="flex justify-between">
              <span>Date &amp; Time:</span>
              <span>{timestamp}</span>
            </div>
            <div className="flex justify-between">
              <span>Table / Section:</span>
              <span className="font-bold text-stone-900">{session.tableName}</span>
            </div>
            <div className="flex justify-between">
              <span>Guest / Server:</span>
              <span>{guestName} · Francis T.</span>
            </div>
            <div className="flex justify-between">
              <span>Payment Type:</span>
              <span className="font-bold text-stone-900 capitalize">{paymentMethod}</span>
            </div>
          </div>

          {/* Itemized Lines */}
          <div className="border-t border-dashed border-stone-300 pt-2 space-y-1.5">
            <div className="flex justify-between text-[10px] font-bold uppercase text-stone-400">
              <span>Item Description</span>
              <span>Total (MK)</span>
            </div>
            {items.map((item) => (
              <div key={item.orderItemId} className="flex justify-between text-[11px] text-stone-900 leading-tight">
                <span className="pr-2">
                  {item.quantity}× {item.name}
                </span>
                <span className="font-bold tabular-nums shrink-0">{formatPrice(item.totalPrice)}</span>
              </div>
            ))}
          </div>

          {/* Subtotals & Fiscal Taxes Breakdown */}
          <div className="border-t border-dashed border-stone-300 pt-2 space-y-1 text-[11px]">
            <div className="flex justify-between text-stone-600">
              <span>Food &amp; Beverage Net:</span>
              <span className="tabular-nums">{formatPrice(taxableAmount)}</span>
            </div>
            <div className="flex justify-between text-stone-600">
              <span>MRA VAT (16.5% incl):</span>
              <span className="tabular-nums">{formatPrice(vatAmount)}</span>
            </div>
            <div className="flex justify-between text-stone-600">
              <span>Service Charge ({tenant.serviceChargePercentage}%):</span>
              <span className="tabular-nums">{formatPrice(serviceCharge)}</span>
            </div>
            <div className="flex justify-between font-black text-stone-900 text-sm pt-1 border-t border-stone-400">
              <span>TOTAL PAID (MWK):</span>
              <span className="text-[#C9532F] tabular-nums">{formatPrice(totalAmount)}</span>
            </div>
          </div>

          {/* Verification QR & Stamp */}
          <div className="border-t border-dashed border-stone-300 pt-3 text-center space-y-2">
            <div className="flex items-center justify-center gap-1 text-[11px] text-emerald-800 font-bold bg-emerald-50 py-1 rounded-lg border border-emerald-200">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              <span>PAYCHANGU FISCAL VERIFIED</span>
            </div>

            {/* QR Mockup Stamp */}
            <div className="w-16 h-16 mx-auto bg-stone-100 p-1.5 border border-stone-300 rounded-xl flex items-center justify-center shadow-2xs">
              <QrCode className="w-12 h-12 text-stone-800" />
            </div>

            <p className="text-[10px] text-stone-500 font-sans">
              Thank you for dining at {tenant.name}! Keep this receipt for your records.
            </p>
          </div>
        </div>

        {/* Footer Close CTA */}
        <div className="pt-3 border-t border-stone-200 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="w-full py-2.5 bg-stone-900 hover:bg-stone-800 text-white text-xs font-bold rounded-xl cursor-pointer transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
