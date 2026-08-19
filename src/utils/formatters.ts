import { ItemStatus } from '../types';

export function formatKwacha(amount: number): string {
  return `MK ${amount.toLocaleString('en-US')}`;
}

export function formatTimeAgo(timestamp: number): string {
  const elapsedSeconds = Math.floor((Date.now() - timestamp) / 1000);
  if (elapsedSeconds < 60) return 'just now';
  const mins = Math.floor(elapsedSeconds / 60);
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  return `${hours}h ${mins % 60}m ago`;
}

// Compute the least-progressed item status for the Customer live tracker
export function computeOrderHeadlineStatus(items: { status: ItemStatus }[]): {
  headline: string;
  subtext: string;
  percentage: number;
  badgeClass: string;
} {
  const activeItems = items.filter((i) => i.status !== 'VOIDED');
  if (activeItems.length === 0) {
    return {
      headline: 'No active items',
      subtext: 'Your order will appear here once placed',
      percentage: 0,
      badgeClass: 'bg-stone-200 text-stone-700',
    };
  }

  const statuses = activeItems.map((i) => i.status);

  // If any item is PLACED
  if (statuses.includes('PLACED')) {
    const countPlaced = statuses.filter((s) => s === 'PLACED').length;
    return {
      headline: 'Order received',
      subtext: `Waiting for the kitchen to accept (${countPlaced} item${countPlaced > 1 ? 's' : ''})`,
      percentage: 20,
      badgeClass: 'bg-stone-100 text-stone-800 border border-stone-300',
    };
  }

  // If any item is ACCEPTED
  if (statuses.includes('ACCEPTED')) {
    return {
      headline: 'Order accepted',
      subtext: 'The kitchen queue has received your ticket',
      percentage: 40,
      badgeClass: 'bg-amber-100 text-amber-900 border border-amber-300',
    };
  }

  // If any item is PREPARING
  if (statuses.includes('PREPARING')) {
    const preparingCount = statuses.filter((s) => s === 'PREPARING').length;
    const readyOrServed = statuses.filter((s) => s === 'READY' || s === 'SERVED').length;
    return {
      headline: 'Preparing your order',
      subtext:
        readyOrServed > 0
          ? `${preparingCount} item is still cooking — everything else is ready or served`
          : 'Chef and bartender are preparing your order fresh',
      percentage: 75,
      badgeClass: 'bg-[#F97316]/15 text-[#C2410C] border border-[#F97316]/30',
    };
  }

  // If any item is READY (waiting for delivery)
  if (statuses.includes('READY')) {
    return {
      headline: 'Food is ready!',
      subtext: 'Your waiter is delivering your order to Table 12',
      percentage: 90,
      badgeClass: 'bg-emerald-100 text-emerald-800 border border-emerald-300',
    };
  }

  // If all active items are SERVED
  return {
    headline: 'Order served',
    subtext: 'Enjoy your meal! Let us know if you need anything else.',
    percentage: 100,
    badgeClass: 'bg-emerald-500 text-white',
  };
}

export function getStatusBadgeStyle(status: ItemStatus) {
  switch (status) {
    case 'PLACED':
      return {
        bg: 'bg-stone-100',
        text: 'text-stone-700',
        border: 'border-stone-200',
        label: 'Placed',
        dot: 'bg-stone-400',
      };
    case 'ACCEPTED':
      return {
        bg: 'bg-sky-50',
        text: 'text-sky-800',
        border: 'border-sky-200',
        label: 'Accepted',
        dot: 'bg-sky-500',
      };
    case 'PREPARING':
      return {
        bg: 'bg-[#FBF0EA]',
        text: 'text-[#C2410C]',
        border: 'border-[#F4D3C5]',
        label: 'Preparing',
        dot: 'bg-[#EA580C]',
      };
    case 'READY':
      return {
        bg: 'bg-[#EBF7EE]',
        text: 'text-[#166534]',
        border: 'border-[#BBF7D0]',
        label: 'Ready',
        dot: 'bg-[#16A34A]',
      };
    case 'SERVED':
      return {
        bg: 'bg-stone-100',
        text: 'text-stone-600',
        border: 'border-stone-200',
        label: 'Served',
        dot: 'bg-stone-400',
      };
    case 'VOIDED':
      return {
        bg: 'bg-red-50',
        text: 'text-red-700',
        border: 'border-red-200',
        label: 'Voided',
        dot: 'bg-red-500',
      };
    default:
      return {
        bg: 'bg-stone-100',
        text: 'text-stone-700',
        border: 'border-stone-200',
        label: status,
        dot: 'bg-stone-400',
      };
  }
}
