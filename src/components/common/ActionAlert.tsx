import React, { ReactNode } from 'react';
import { AlertTriangle, WifiOff, CheckCircle2, Info, RefreshCw } from 'lucide-react';
import { OrderFlowButton } from './OrderFlowButton';

export type AlertType = 'info' | 'warning' | 'error' | 'offline' | 'success';

interface ActionAlertProps {
  type?: AlertType;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  isLoadingAction?: boolean;
  className?: string;
}

export function ActionAlert({
  type = 'info',
  title,
  description,
  actionLabel,
  onAction,
  isLoadingAction = false,
  className = '',
}: ActionAlertProps) {
  const getStyle = () => {
    switch (type) {
      case 'offline':
      case 'warning':
        return {
          bg: 'bg-[#FEF9C3]',
          border: 'border-[#FDE047]',
          text: 'text-[#854D0E]',
          icon: <WifiOff className="w-5 h-5 text-[#CA8A04] shrink-0" />,
        };
      case 'error':
        return {
          bg: 'bg-[#FEF2F2]',
          border: 'border-[#FECACA]',
          text: 'text-[#991B1B]',
          icon: <AlertTriangle className="w-5 h-5 text-[#DC2626] shrink-0" />,
        };
      case 'success':
        return {
          bg: 'bg-[#EBF7EE]',
          border: 'border-[#BBF7D0]',
          text: 'text-[#166534]',
          icon: <CheckCircle2 className="w-5 h-5 text-[#16A34A] shrink-0" />,
        };
      case 'info':
      default:
        return {
          bg: 'bg-[#FAF0EB]',
          border: 'border-[#F0D8CC]',
          text: 'text-[#C2410C]',
          icon: <Info className="w-5 h-5 text-[#C9532F] shrink-0" />,
        };
    }
  };

  const style = getStyle();

  return (
    <div
      role="alert"
      className={`rounded-2xl p-4 border ${style.bg} ${style.border} ${style.text} flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 ${className}`}
    >
      <div className="flex items-start gap-3 min-w-0">
        {style.icon}
        <div>
          <h4 className="font-extrabold text-xs tracking-tight">{title}</h4>
          <p className="text-[11.5px] mt-0.5 opacity-90 leading-relaxed">{description}</p>
        </div>
      </div>

      {actionLabel && onAction && (
        <OrderFlowButton
          variant="outline"
          size="sm"
          onClick={onAction}
          isLoading={isLoadingAction}
          className="shrink-0 w-full sm:w-auto"
        >
          {actionLabel}
        </OrderFlowButton>
      )}
    </div>
  );
}
