// Browser & Device Push Notification Management for OrderFlow

export interface DeviceNotificationPayload {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  tag?: string;
  data?: any;
  vibrate?: number[];
  requireInteraction?: boolean;
}

type NotificationListener = (notice: DeviceNotificationPayload & { id: string; timestamp: number }) => void;
const listeners: Set<NotificationListener> = new Set();

export function subscribeToInAppNotifications(listener: NotificationListener) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function isNotificationSupported(): boolean {
  return typeof window !== 'undefined' && 'Notification' in window;
}

export function getNotificationPermission(): NotificationPermission | 'unsupported' {
  if (!isNotificationSupported()) return 'unsupported';
  return Notification.permission;
}

export async function requestNotificationPermission(): Promise<NotificationPermission | 'unsupported'> {
  if (!isNotificationSupported()) return 'unsupported';
  try {
    const permission = await Notification.requestPermission();
    return permission;
  } catch (error) {
    console.warn('[Notifications] Error requesting permission:', error);
    return Notification.permission;
  }
}

/**
 * Sends a native device push notification + in-app overlay alert
 */
export async function sendDeviceNotification(payload: DeviceNotificationPayload) {
  const noticeId = `notif-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
  const fullNotice = {
    ...payload,
    id: noticeId,
    timestamp: Date.now(),
    icon: payload.icon || '/icon-192.svg',
    badge: payload.badge || '/favicon.svg',
  };

  // 1. Broadcast to in-app toast listeners for instant visual confirmation (deferred to avoid setState during another component's render)
  setTimeout(() => {
    listeners.forEach((listener) => {
      try {
        listener(fullNotice);
      } catch (e) {
        console.error(e);
      }
    });
  }, 0);

  // 2. Play subtle haptic feedback if supported on mobile
  if (typeof navigator !== 'undefined' && navigator.vibrate) {
    try {
      navigator.vibrate(payload.vibrate || [100, 50, 100]);
    } catch (_) {}
  }

  // 3. Attempt native Device Notification
  if (!isNotificationSupported()) {
    return false;
  }

  if (Notification.permission === 'granted') {
    try {
      // Try via ServiceWorker registration first (required for PWAs & Android)
      if ('serviceWorker' in navigator) {
        const registration = await navigator.serviceWorker.ready;
        if (registration && 'showNotification' in registration) {
          await (registration as any).showNotification(payload.title, {
            body: payload.body,
            icon: fullNotice.icon,
            badge: fullNotice.badge,
            tag: payload.tag || 'orderflow-alert',
            data: payload.data || {},
            vibrate: payload.vibrate || [200, 100, 200],
            requireInteraction: payload.requireInteraction ?? false,
          });
          return true;
        }
      }

      // Fallback to standard Window Notification
      new Notification(payload.title, {
        body: payload.body,
        icon: fullNotice.icon,
        badge: fullNotice.badge,
        tag: payload.tag || 'orderflow-alert',
      } as NotificationOptions);
      return true;
    } catch (error) {
      console.warn('[Notifications] Native notification trigger note:', error);
      return false;
    }
  }

  return false;
}
