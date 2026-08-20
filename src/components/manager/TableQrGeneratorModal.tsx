import React, { useState, useRef } from 'react';
import { useTenant } from '../../context/TenantContext';
import { useRestaurant } from '../../context/RestaurantContext';
import {
  QrCode,
  Download,
  Printer,
  Share2,
  ExternalLink,
  Layers,
  Copy,
  Check,
  X,
  Sparkles,
  MapPin,
} from 'lucide-react';
import { BrandMark } from '../common/BrandMark';

interface TableQrGeneratorModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const TableQrGeneratorModal: React.FC<TableQrGeneratorModalProps> = ({
  isOpen,
  onClose,
}) => {
  const { tenant } = useTenant();
  const { tables } = useRestaurant();
  const [selectedTableId, setSelectedTableId] = useState<string>(tables[0]?.id || 't12');
  const [copiedLink, setCopiedLink] = useState(false);
  const printAreaRef = useRef<HTMLDivElement>(null);

  if (!isOpen) return null;

  const currentTable = tables.find((t) => t.id === selectedTableId) || tables[0];
  const baseUrl = typeof window !== 'undefined' ? window.location.origin : 'https://orderflow.mw';
  const tableDeepLink = `${baseUrl}?tenant=${tenant.slug}&table=${currentTable.id}&role=customer&screen=1`;

  // Standard SVG QR Generator Mock Matrix for authentic visuals
  const handleCopyLink = () => {
    navigator.clipboard.writeText(tableDeepLink);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handlePrintSheet = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-2xl bg-[#FFFDF9] rounded-3xl p-6 text-stone-900 shadow-2xl border border-[#DDD6CA] relative max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-[#DDD6CA] shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#FAF0EB] text-[#C9532F] flex items-center justify-center">
              <QrCode className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-extrabold text-[#211F1B]">
                Table QR Code Generator &amp; Sticker Kit
              </h2>
              <p className="text-[11px] text-[#777067]">
                Instant diner self-ordering codes for table stands and coasters
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrintSheet}
              className="py-2 px-3.5 bg-[#EDE8DF] hover:bg-[#DDD6CA] text-[#211F1B] rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>Print Sticker Sheet</span>
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-[#EDE8DF] hover:bg-[#DDD6CA] text-[#777067] hover:text-[#211F1B] transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto py-4 px-1 space-y-6">
          {/* Table Selector Pills */}
          <div className="space-y-2">
            <label className="text-xs font-extrabold uppercase tracking-wider text-[#777067] block">
              Select Table to Preview:
            </label>
            <div className="flex flex-wrap gap-2">
              {tables.map((t) => (
                <button
                  key={t.id}
                  onClick={() => setSelectedTableId(t.id)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    selectedTableId === t.id
                      ? 'bg-[#C9532F] text-white shadow-xs'
                      : 'bg-[#F5F0E7] text-[#211F1B] border border-[#DDD6CA] hover:border-[#AAA298]'
                  }`}
                >
                  {t.name}
                  <span className="text-[10px] ml-1.5 opacity-80">({t.capacity} seats)</span>
                </button>
              ))}
            </div>
          </div>

          {/* QR Stand Preview Card */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 items-center bg-[#F5F0E7] p-6 rounded-3xl border border-[#DDD6CA]">
            {/* The Acrylic Stand Render */}
            <div
              ref={printAreaRef}
              className="bg-[#FFFDF9] rounded-2xl p-6 border-2 border-[#211F1B] shadow-xl text-center flex flex-col items-center justify-between space-y-4 max-w-[260px] mx-auto w-full"
            >
              <div className="space-y-1">
                <BrandMark size="md" variant="terracotta" className="mx-auto" />
                <h3 className="font-serif font-black text-sm text-[#211F1B] tracking-tight">
                  {tenant.name}
                </h3>
                <span className="text-[10px] text-[#777067] block font-sans">{tenant.location}</span>
              </div>

              {/* QR Pattern Frame */}
              <div className="p-3 bg-white rounded-xl border border-stone-300 shadow-inner flex flex-col items-center justify-center">
                <div className="w-36 h-36 bg-[#FAF0EB] border border-[#C9532F]/30 rounded-lg p-2 flex items-center justify-center relative group">
                  {/* SVG Crisp QR Display */}
                  <QrCode className="w-full h-full text-[#211F1B]" />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-8 h-8 rounded-lg bg-[#C9532F] text-white flex items-center justify-center font-bold text-xs shadow-md">
                      OF
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-0.5">
                <div className="text-base font-mono font-black text-[#211F1B] uppercase tracking-wider">
                  {currentTable.name}
                </div>
                <div className="text-[10px] text-[#777067] font-semibold">
                  Scan to View Menu, Order &amp; Pay
                </div>
                <div className="text-[9px] font-mono text-stone-400">
                  Powered by OrderFlow MW
                </div>
              </div>
            </div>

            {/* Deep link info & direct share */}
            <div className="space-y-4 text-xs">
              <div>
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#C9532F] block">
                  Direct Guest Access URL
                </span>
                <h4 className="font-bold text-sm text-[#211F1B] mt-0.5">
                  Deep link for {currentTable.name}
                </h4>
                <p className="text-[#777067] text-[11px] mt-1">
                  Guests scanning this code automatically land in this specific table session without needing app downloads.
                </p>
              </div>

              <div className="p-3 bg-[#FFFDF9] rounded-2xl border border-[#DDD6CA] font-mono text-[11px] text-[#211F1B] break-all select-all">
                {tableDeepLink}
              </div>

              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={handleCopyLink}
                  className="py-2 px-3.5 bg-[#211F1B] hover:bg-[#342F2A] text-white rounded-xl font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedLink ? 'Copied to Clipboard!' : 'Copy Direct Link'}</span>
                </button>

                <a
                  href={tableDeepLink}
                  target="_blank"
                  rel="noreferrer"
                  className="py-2 px-3.5 bg-[#EDE8DF] hover:bg-[#DDD6CA] text-[#211F1B] rounded-xl font-bold text-xs flex items-center gap-1.5 transition-colors"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>Test in New Tab</span>
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="pt-3 border-t border-[#DDD6CA] shrink-0 text-right">
          <button
            onClick={onClose}
            className="py-2.5 px-5 bg-[#211F1B] hover:bg-[#342F2A] text-white text-xs font-bold rounded-xl cursor-pointer transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
