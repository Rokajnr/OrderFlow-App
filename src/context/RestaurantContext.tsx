import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import {
  MenuItem,
  RestaurantTable,
  TableSession,
  OrderItem,
  ItemStatus,
  TableStatus,
  PaymentState,
  AssistanceRequest,
  WalkoutLog,
  CustomerFeedback,
  MenuItemAddOn,
} from '../types';
import { INITIAL_MENU, INITIAL_TABLES, INITIAL_TABLE_SESSIONS, INITIAL_WALKOUTS } from '../data/initialData';
import { CAPITAL_GRILL_MENU, CAPITAL_GRILL_TABLES } from '../data/tenantData';
import { useTenant } from './TenantContext';
import { sendDeviceNotification } from '../utils/notifications';
import { db, testFirestoreConnection } from '../lib/firebase';
import { collection, doc, onSnapshot, setDoc } from 'firebase/firestore';
import { handleFirestoreError, OperationType } from '../lib/firebaseErrors';

export interface CartItem {
  cartId: string;
  menuItem: MenuItem;
  quantity: number;
  selectedAddOns: MenuItemAddOn[];
  notes: string;
  orderedBy: string;
  totalPrice: number;
}

interface RestaurantContextType {
  // Menu
  menu: MenuItem[];
  toggleItemAvailability: (itemId: string) => void;
  updateMenuItem: (item: MenuItem) => void;
  addNewMenuItem: (item: Omit<MenuItem, 'id'>) => void;

  // Tables & Sessions
  tables: RestaurantTable[];
  activeTableId: string;
  setActiveTableId: (id: string) => void;
  activeSession: TableSession;
  sessions: Record<string, TableSession>;
  currentGuest: string;
  setCurrentGuest: (name: string) => void;
  addGuestToSession: (name?: string) => void;
  leaveTableSession: (tableId?: string, guestName?: string) => void;
  closeTableSession: (tableId: string) => void;

  // Cart
  cart: CartItem[];
  addToCart: (item: MenuItem, quantity: number, addOns: MenuItemAddOn[], notes: string) => void;
  removeFromCart: (cartId: string) => void;
  updateCartQuantity: (cartId: string, quantity: number) => void;
  clearCart: () => void;
  cartSubtotal: number;
  cartTotalCount: number;

  // Orders
  placeOrder: () => void;
  updateItemStatus: (tableId: string, orderItemId: string, status: ItemStatus) => void;
  voidOrderItem: (tableId: string, orderItemId: string, reason: string, isWaste?: boolean) => void;
  advanceItemStatus: (tableId: string, orderItemId: string) => void;

  // Assistance Requests
  requestAssistance: (type: 'waiter' | 'water' | 'bill' | 'cutlery' | 'general', label: string) => void;
  resolveAssistance: (tableId: string, requestId: string) => void;

  // Payments
  requestBill: (method?: 'mobile_money' | 'cash' | 'card', provider?: 'airtel' | 'mpamba') => void;
  startMobileMoneyPayment: (provider: 'airtel' | 'mpamba', phone: string) => void;
  confirmPayment: (tableId: string, method: 'mobile_money' | 'cash' | 'card', amount?: number, guestName?: string, itemIds?: string[]) => void;
  confirmSplitPayment: (
    tableId: string,
    splitType: 'full' | 'even' | 'by_guest' | 'by_item',
    amountPaid: number,
    method: 'mobile_money' | 'cash' | 'card',
    guestName: string,
    itemIds?: string[]
  ) => void;
  cancelPaymentPrompt: () => void;

  // Table Management
  clearTable: (tableId: string, reasonCode: 'paid_cash' | 'paid_mobile_money' | 'unpaid_walkout' | 'other', note?: string) => void;
  setTableStatus: (tableId: string, status: TableStatus) => void;

  // Logs & Feedback
  walkoutLogs: WalkoutLog[];
  feedbackList: CustomerFeedback[];
  submitFeedback: (rating: number, foodRating: number, serviceRating: number, comment?: string) => void;

  // Demo helpers
  resetDemoData: () => void;
  simulateNextStep: () => void;
}

const RestaurantContext = createContext<RestaurantContextType | undefined>(undefined);

export function RestaurantProvider({ children }: { children: ReactNode }) {
  const { tenant } = useTenant();

  // Helper to determine initial menu based on tenant
  const getInitialMenuForTenant = useCallback((slug: string): MenuItem[] => {
    if (slug === 'capitalgrill') return CAPITAL_GRILL_MENU;
    return INITIAL_MENU;
  }, []);

  // Helper to determine initial tables based on tenant
  const getInitialTablesForTenant = useCallback((slug: string): RestaurantTable[] => {
    if (slug === 'capitalgrill') return CAPITAL_GRILL_TABLES;
    return INITIAL_TABLES;
  }, []);

  const [menu, setMenu] = useState<MenuItem[]>(() => {
    const saved = localStorage.getItem(`orderflow_menu_${tenant.slug}`);
    return saved ? JSON.parse(saved) : getInitialMenuForTenant(tenant.slug);
  });

  const [tables, setTables] = useState<RestaurantTable[]>(() => {
    const saved = localStorage.getItem(`orderflow_tables_${tenant.slug}`);
    return saved ? JSON.parse(saved) : getInitialTablesForTenant(tenant.slug);
  });

  const [sessions, setSessions] = useState<Record<string, TableSession>>(() => {
    const saved = localStorage.getItem(`orderflow_sessions_${tenant.slug}`);
    if (saved) return JSON.parse(saved);
    return tenant.slug === 'lakeview' ? INITIAL_TABLE_SESSIONS : {};
  });

  const [activeTableId, setActiveTableId] = useState<string>(() => {
    const saved = localStorage.getItem(`orderflow_active_table_id_${tenant.slug}`);
    return saved || (tenant.slug === 'capitalgrill' ? 'cgt-1' : 't12');
  });

  const [currentGuest, setCurrentGuest] = useState<string>(() => {
    const saved = localStorage.getItem(`orderflow_current_guest_${tenant.slug}`);
    return saved !== null ? saved : '';
  });

  const [cart, setCart] = useState<CartItem[]>(() => {
    const saved = localStorage.getItem(`orderflow_cart_${tenant.slug}`);
    return saved ? JSON.parse(saved) : [];
  });

  const [walkoutLogs, setWalkoutLogs] = useState<WalkoutLog[]>(() => {
    const saved = localStorage.getItem(`orderflow_walkouts_${tenant.slug}`);
    return saved ? JSON.parse(saved) : (tenant.slug === 'lakeview' ? INITIAL_WALKOUTS : []);
  });

  const [feedbackList, setFeedbackList] = useState<CustomerFeedback[]>([]);

  // When active tenant changes, reload tenant-specific states
  useEffect(() => {
    const savedMenu = localStorage.getItem(`orderflow_menu_${tenant.slug}`);
    setMenu(savedMenu ? JSON.parse(savedMenu) : getInitialMenuForTenant(tenant.slug));

    const savedTables = localStorage.getItem(`orderflow_tables_${tenant.slug}`);
    setTables(savedTables ? JSON.parse(savedTables) : getInitialTablesForTenant(tenant.slug));

    const savedSessions = localStorage.getItem(`orderflow_sessions_${tenant.slug}`);
    setSessions(savedSessions ? JSON.parse(savedSessions) : (tenant.slug === 'lakeview' ? INITIAL_TABLE_SESSIONS : {}));

    const savedActiveTable = localStorage.getItem(`orderflow_active_table_id_${tenant.slug}`);
    setActiveTableId(savedActiveTable || (tenant.slug === 'capitalgrill' ? 'cgt-1' : 't12'));

    const savedCart = localStorage.getItem(`orderflow_cart_${tenant.slug}`);
    setCart(savedCart ? JSON.parse(savedCart) : []);
  }, [tenant.slug, getInitialMenuForTenant, getInitialTablesForTenant]);

  // Firestore path scoped by tenant: /tenants/{tenantId}/table_sessions
  const tenantSessionsCollectionPath = `tenants/${tenant.id}/table_sessions`;

  // Cross-device Firebase Firestore Real-Time Listener Scoped by Tenant
  useEffect(() => {
    if (!db) {
      console.warn('Firestore instance not available.');
      return;
    }

    testFirestoreConnection();

    let unsubscribe = () => {};
    try {
      unsubscribe = onSnapshot(
        collection(db, tenantSessionsCollectionPath),
        (snapshot) => {
          if (!snapshot.empty) {
            const remoteSessions: Record<string, TableSession> = {};
            snapshot.forEach((docSnap) => {
              remoteSessions[docSnap.id] = docSnap.data() as TableSession;
            });
            setSessions((prev) => ({
              ...(tenant.slug === 'lakeview' ? INITIAL_TABLE_SESSIONS : {}),
              ...prev,
              ...remoteSessions,
            }));
          } else if (tenant.slug === 'lakeview') {
            // Initialize Firestore with default tables on first launch for default tenant
            Object.entries(INITIAL_TABLE_SESSIONS).forEach(([tId, sess]) => {
              if (db) {
                setDoc(doc(db, tenantSessionsCollectionPath, tId), sess).catch((err) =>
                  handleFirestoreError(err, OperationType.WRITE, `${tenantSessionsCollectionPath}/${tId}`)
                );
              }
            });
          }
        },
        (error) => {
          handleFirestoreError(error, OperationType.LIST, tenantSessionsCollectionPath);
        }
      );
    } catch (error) {
      console.warn(`Could not attach Firestore listener for tenant ${tenant.id}, running locally:`, error);
    }

    return () => {
      try {
        unsubscribe();
      } catch {
        // ignore unsubscribe failure
      }
    };
  }, [tenant.id, tenant.slug, tenantSessionsCollectionPath]);

  // Helper to persist a table session to Firebase Firestore
  const syncSessionToFirestore = async (tableId: string, updatedSession: TableSession) => {
    if (!db) return;
    try {
      await setDoc(doc(db, tenantSessionsCollectionPath, tableId), updatedSession);
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `${tenantSessionsCollectionPath}/${tableId}`);
    }
  };

  // Helper to update state and broadcast to all devices via Firestore
  const updateSessionAndSync = (
    tableId: string,
    updater: (prevSession: TableSession) => TableSession
  ) => {
    setSessions((prev) => {
      const current = prev[tableId] || {
        sessionId: `sess-${tableId}`,
        tableId,
        tableName: tables.find((t) => t.id === tableId)?.name || 'Table',
        status: 'available',
        guests: [currentGuest || 'Guest'],
        currentGuest: currentGuest || 'Guest',
        items: [],
        assistanceRequests: [],
        paymentState: 'UNPAID',
        createdAt: Date.now(),
        lastActiveTime: Date.now(),
        subtotal: 0,
        serviceCharge: 0,
        totalAmount: 0,
        isPaid: false,
      };

      const updated = updater(current);
      syncSessionToFirestore(tableId, updated);

      return {
        ...prev,
        [tableId]: updated,
      };
    });
  };

  // Local fallback storage per tenant
  useEffect(() => {
    localStorage.setItem(`orderflow_menu_${tenant.slug}`, JSON.stringify(menu));
  }, [menu, tenant.slug]);

  useEffect(() => {
    localStorage.setItem(`orderflow_tables_${tenant.slug}`, JSON.stringify(tables));
  }, [tables, tenant.slug]);

  useEffect(() => {
    localStorage.setItem(`orderflow_sessions_${tenant.slug}`, JSON.stringify(sessions));
  }, [sessions, tenant.slug]);

  useEffect(() => {
    localStorage.setItem(`orderflow_walkouts_${tenant.slug}`, JSON.stringify(walkoutLogs));
  }, [walkoutLogs, tenant.slug]);

  useEffect(() => {
    if (currentGuest && currentGuest !== 'Guest') {
      localStorage.setItem(`orderflow_current_guest_${tenant.slug}`, currentGuest);
    } else {
      localStorage.removeItem(`orderflow_current_guest_${tenant.slug}`);
    }
  }, [currentGuest, tenant.slug]);

  useEffect(() => {
    if (activeTableId) {
      localStorage.setItem(`orderflow_active_table_id_${tenant.slug}`, activeTableId);
    }
  }, [activeTableId, tenant.slug]);

  useEffect(() => {
    localStorage.setItem(`orderflow_cart_${tenant.slug}`, JSON.stringify(cart));
  }, [cart, tenant.slug]);

  // Active session fallback
  const activeSession: TableSession = sessions[activeTableId] || {
    sessionId: `sess-${activeTableId}`,
    tableId: activeTableId,
    tableName: tables.find((t) => t.id === activeTableId)?.name || 'Table',
    status: 'available',
    guests: currentGuest && currentGuest !== 'Guest' ? [currentGuest] : [],
    currentGuest: currentGuest || 'Guest',
    items: [],
    assistanceRequests: [],
    paymentState: 'UNPAID',
    createdAt: Date.now(),
    lastActiveTime: Date.now(),
    subtotal: 0,
    serviceCharge: 0,
    totalAmount: 0,
    isPaid: false,
  };

  // Cart Calculations
  const cartSubtotal = cart.reduce((sum, item) => sum + item.totalPrice, 0);
  const cartTotalCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  const addToCart = (menuItem: MenuItem, quantity: number, addOns: MenuItemAddOn[], notes: string) => {
    const addOnTotal = addOns.reduce((sum, a) => sum + a.price, 0);
    const itemTotal = (menuItem.price + addOnTotal) * quantity;
    const cartId = `cart-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;

    setCart((prev) => [
      ...prev,
      {
        cartId,
        menuItem,
        quantity,
        selectedAddOns: addOns,
        notes,
        orderedBy: currentGuest || 'Guest',
        totalPrice: itemTotal,
      },
    ]);
  };

  const removeFromCart = (cartId: string) => {
    setCart((prev) => prev.filter((i) => i.cartId !== cartId));
  };

  const updateCartQuantity = (cartId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(cartId);
      return;
    }
    setCart((prev) =>
      prev.map((item) => {
        if (item.cartId === cartId) {
          const addOnTotal = item.selectedAddOns.reduce((sum, a) => sum + a.price, 0);
          return {
            ...item,
            quantity,
            totalPrice: (item.menuItem.price + addOnTotal) * quantity,
          };
        }
        return item;
      })
    );
  };

  const clearCart = () => setCart([]);

  const addGuestToSession = (name?: string) => {
    const guestName = (name && name.trim()) || 'Guest';
    updateSessionAndSync(activeTableId, (current) => {
      const existingGuests = current.guests || [];
      const guests = existingGuests.includes(guestName) ? existingGuests : [...existingGuests, guestName];
      return {
        ...current,
        status: 'occupied',
        guests,
        currentGuest: guestName,
        lastActiveTime: Date.now(),
      };
    });
    setCurrentGuest(guestName);
  };

  // Lifecycle: Leave Table vs Close Table
  const leaveTableSession = (tableId = activeTableId, guestName = currentGuest) => {
    setCart([]);
    localStorage.removeItem(`orderflow_cart_${tenant.slug}`);
    updateSessionAndSync(tableId, (current) => {
      const remainingGuests = (current.guests || []).filter((g) => g !== guestName && g !== '');
      const hasUnpaidActiveOrders = current.items.some((i) => i.status !== 'VOIDED' && !i.paid);

      if (remainingGuests.length === 0 && !hasUnpaidActiveOrders) {
        return {
          ...current,
          status: 'available',
          guests: [],
          currentGuest: 'Guest',
          items: [],
          assistanceRequests: [],
          paymentState: 'UNPAID',
          paymentHistory: [],
          isPaid: false,
          subtotal: 0,
          serviceCharge: 0,
          totalAmount: 0,
          lastActiveTime: Date.now(),
        };
      }

      return {
        ...current,
        guests: remainingGuests,
        currentGuest: remainingGuests[0] || 'Guest',
        lastActiveTime: Date.now(),
      };
    });
    setCurrentGuest('');
    localStorage.removeItem(`orderflow_current_guest_${tenant.slug}`);
  };

  const closeTableSession = (tableId: string) => {
    clearCart();
    localStorage.removeItem(`orderflow_cart_${tenant.slug}`);
    const tableName = tables.find((t) => t.id === tableId)?.name || 'Table';

    sendDeviceNotification({
      title: `🧹 Table Cleared & Ready — ${tableName}`,
      body: `${tableName} session has finished and is now reset for new guests.`,
      tag: `cleared-${tableId}`,
    });

    updateSessionAndSync(tableId, () => ({
      sessionId: `sess-${Date.now()}`,
      tableId,
      tableName,
      status: 'available',
      guests: [],
      currentGuest: 'Guest',
      items: [],
      assistanceRequests: [],
      paymentState: 'UNPAID',
      paymentHistory: [],
      createdAt: Date.now(),
      lastActiveTime: Date.now(),
      subtotal: 0,
      serviceCharge: 0,
      totalAmount: 0,
      isPaid: false,
    }));
    if (tableId === activeTableId) {
      setCurrentGuest('');
      localStorage.removeItem(`orderflow_current_guest_${tenant.slug}`);
    }
  };

  // Order Placement
  const placeOrder = () => {
    if (cart.length === 0) return;

    const newOrderItems: OrderItem[] = cart.map((cartItem, idx) => ({
      orderItemId: `oi-${Date.now()}-${idx}`,
      itemId: cartItem.menuItem.id,
      name: cartItem.menuItem.name,
      category: cartItem.menuItem.category,
      station: cartItem.menuItem.station,
      unitPrice: cartItem.menuItem.price,
      quantity: cartItem.quantity,
      selectedAddOns: cartItem.selectedAddOns,
      totalPrice: cartItem.totalPrice,
      notes: cartItem.notes,
      orderedBy: cartItem.orderedBy || currentGuest || 'Guest',
      status: 'PLACED',
      timestamp: Date.now(),
      paid: false,
    }));

    const tableName = tables.find((t) => t.id === activeTableId)?.name || 'Table';

    sendDeviceNotification({
      title: `📥 New Order Placed — ${tableName}`,
      body: `${newOrderItems.length} item(s) sent to Kitchen KDS by ${currentGuest || 'Guest'}. Total: ${tenant.currencySymbol} ${cartSubtotal.toLocaleString()}`,
      tag: `order-${activeTableId}`,
    });

    updateSessionAndSync(activeTableId, (current) => {
      const updatedItems = [...current.items, ...newOrderItems];
      const unpaidActiveItems = updatedItems.filter((i) => i.status !== 'VOIDED' && !i.paid);
      const subtotal = unpaidActiveItems.reduce((sum, i) => sum + i.totalPrice, 0);
      const serviceCharge = Math.round(subtotal * tenant.serviceChargeRate);
      const totalAmount = subtotal + serviceCharge;

      return {
        ...current,
        status: 'occupied',
        items: updatedItems,
        subtotal,
        serviceCharge,
        totalAmount,
        isPaid: false,
        paymentState: 'UNPAID',
        lastActiveTime: Date.now(),
      };
    });

    clearCart();
  };

  // State Advancement
  const updateItemStatus = (tableId: string, orderItemId: string, status: ItemStatus) => {
    const session = sessions[tableId];
    if (session) {
      const item = session.items.find((i) => i.orderItemId === orderItemId);
      if (item && status === 'READY') {
        sendDeviceNotification({
          title: `🍳 Food Ready for Pickup! — ${session.tableName}`,
          body: `"${item.name}" (Qty: ${item.quantity}) is ready at ${item.station === 'bar' ? 'Bar' : 'Kitchen'} station.`,
          tag: `ready-${orderItemId}`,
        });
      }
    }

    updateSessionAndSync(tableId, (currentSession) => {
      const updatedItems = currentSession.items.map((item) =>
        item.orderItemId === orderItemId ? { ...item, status } : item
      );

      const unpaidActiveItems = updatedItems.filter((i) => i.status !== 'VOIDED' && !i.paid);
      const subtotal = unpaidActiveItems.reduce((sum, i) => sum + i.totalPrice, 0);
      const serviceCharge = Math.round(subtotal * tenant.serviceChargeRate);
      const totalAmount = subtotal + serviceCharge;

      return {
        ...currentSession,
        items: updatedItems,
        subtotal,
        serviceCharge,
        totalAmount,
        lastActiveTime: Date.now(),
      };
    });
  };

  const advanceItemStatus = (tableId: string, orderItemId: string) => {
    const session = sessions[tableId];
    if (session) {
      const currentItem = session.items.find((i) => i.orderItemId === orderItemId);
      if (currentItem) {
        let nextStatus: ItemStatus = currentItem.status;
        if (currentItem.status === 'PLACED') nextStatus = 'ACCEPTED';
        else if (currentItem.status === 'ACCEPTED') nextStatus = 'PREPARING';
        else if (currentItem.status === 'PREPARING') nextStatus = 'READY';
        else if (currentItem.status === 'READY') nextStatus = 'SERVED';

        if (nextStatus === 'READY') {
          sendDeviceNotification({
            title: `🍳 Food Ready for Pickup! — ${session.tableName}`,
            body: `"${currentItem.name}" (x${currentItem.quantity}) is prepared and ready on hot-pass!`,
            tag: `ready-${orderItemId}`,
          });
        } else if (nextStatus === 'PREPARING') {
          sendDeviceNotification({
            title: `👨‍🍳 Kitchen Cooking — ${session.tableName}`,
            body: `Chef started preparing "${currentItem.name}".`,
            tag: `prep-${orderItemId}`,
          });
        }
      }
    }

    updateSessionAndSync(tableId, (currentSession) => {
      const currentItem = currentSession.items.find((i) => i.orderItemId === orderItemId);
      if (!currentItem) return currentSession;

      let nextStatus: ItemStatus = currentItem.status;
      if (currentItem.status === 'PLACED') nextStatus = 'ACCEPTED';
      else if (currentItem.status === 'ACCEPTED') nextStatus = 'PREPARING';
      else if (currentItem.status === 'PREPARING') nextStatus = 'READY';
      else if (currentItem.status === 'READY') nextStatus = 'SERVED';

      const updatedItems = currentSession.items.map((item) =>
        item.orderItemId === orderItemId ? { ...item, status: nextStatus } : item
      );

      return {
        ...currentSession,
        items: updatedItems,
        lastActiveTime: Date.now(),
      };
    });
  };

  const voidOrderItem = (tableId: string, orderItemId: string, reason: string, isWaste = false) => {
    updateSessionAndSync(tableId, (session) => {
      const updatedItems = session.items.map((item) =>
        item.orderItemId === orderItemId
          ? { ...item, status: 'VOIDED' as ItemStatus, voidReason: reason, isWaste }
          : item
      );

      const unpaidActiveItems = updatedItems.filter((i) => i.status !== 'VOIDED' && !i.paid);
      const subtotal = unpaidActiveItems.reduce((sum, i) => sum + i.totalPrice, 0);
      const serviceCharge = Math.round(subtotal * tenant.serviceChargeRate);
      const totalAmount = subtotal + serviceCharge;

      return {
        ...session,
        items: updatedItems,
        subtotal,
        serviceCharge,
        totalAmount,
        lastActiveTime: Date.now(),
      };
    });
  };

  // Assistance Requests
  const requestAssistance = (type: 'waiter' | 'water' | 'bill' | 'cutlery' | 'general', label: string) => {
    const newReq: AssistanceRequest = {
      id: `ast-${Date.now()}`,
      type,
      label,
      tableId: activeTableId,
      time: Date.now(),
      status: 'pending',
      requestedBy: currentGuest || 'Guest',
    };

    const tableName = tables.find((t) => t.id === activeTableId)?.name || 'Table';

    sendDeviceNotification({
      title: `🛎️ Assistance Requested — ${tableName}`,
      body: `${label} requested by guest ${currentGuest || 'Guest'}. Please attend to table.`,
      tag: `assist-${activeTableId}-${type}`,
    });

    updateSessionAndSync(activeTableId, (current) => ({
      ...current,
      assistanceRequests: [...current.assistanceRequests, newReq],
      lastActiveTime: Date.now(),
    }));
  };

  const resolveAssistance = (tableId: string, requestId: string) => {
    updateSessionAndSync(tableId, (session) => ({
      ...session,
      assistanceRequests: session.assistanceRequests.map((r) =>
        r.id === requestId ? { ...r, status: 'resolved' as const } : r
      ),
      lastActiveTime: Date.now(),
    }));
  };

  // Billing and Payments
  const requestBill = (method?: 'mobile_money' | 'cash' | 'card', provider?: 'airtel' | 'mpamba') => {
    const tableName = tables.find((t) => t.id === activeTableId)?.name || 'Table';
    const methodLabel = method === 'cash' ? 'Cash' : method === 'mobile_money' ? `Mobile Money (${provider?.toUpperCase() || 'Airtel/Mpamba'})` : 'Card';

    sendDeviceNotification({
      title: `💳 Bill Requested — ${tableName}`,
      body: `${tableName} requested payment via ${methodLabel}. Total: ${tenant.currencySymbol} ${activeSession.totalAmount.toLocaleString()}`,
      tag: `bill-${activeTableId}`,
    });

    updateSessionAndSync(activeTableId, (current) => ({
      ...current,
      status: 'waiting_payment',
      paymentState: 'PAYMENT_REQUESTED',
      paymentMethod: method,
      mobileMoneyProvider: provider,
      lastActiveTime: Date.now(),
    }));
  };

  const startMobileMoneyPayment = (provider: 'airtel' | 'mpamba', phone: string) => {
    updateSessionAndSync(activeTableId, (current) => ({
      ...current,
      paymentState: 'PROCESSING',
      paymentMethod: 'mobile_money',
      mobileMoneyProvider: provider,
      phoneNumber: phone,
      lastActiveTime: Date.now(),
    }));
  };

  const cancelPaymentPrompt = () => {
    updateSessionAndSync(activeTableId, (current) => ({
      ...current,
      paymentState: 'UNPAID',
      lastActiveTime: Date.now(),
    }));
  };

  const confirmPayment = (
    tableId: string,
    method: 'mobile_money' | 'cash' | 'card',
    amount?: number,
    guestName = currentGuest || 'Guest',
    itemIds?: string[]
  ) => {
    const session = sessions[tableId] || activeSession;
    const paymentAmount = amount !== undefined ? amount : session.totalAmount;
    const isPartial = paymentAmount < session.totalAmount;

    const unpaidItems = session.items.filter((i) => !i.paid && i.status !== 'VOIDED');
    const itemsToMark = itemIds && itemIds.length > 0
      ? unpaidItems.filter((i) => itemIds.includes(i.orderItemId))
      : unpaidItems;

    const record = {
      id: `pay-${Date.now()}`,
      amount: paymentAmount,
      subtotal: Math.round(paymentAmount / (1 + tenant.serviceChargeRate)),
      serviceCharge: paymentAmount - Math.round(paymentAmount / (1 + tenant.serviceChargeRate)),
      method,
      provider: session.mobileMoneyProvider,
      paidBy: guestName,
      timestamp: Date.now(),
      itemIds: itemsToMark.map((i) => i.orderItemId),
    };

    const tableName = tables.find((t) => t.id === tableId)?.name || 'Table';
    sendDeviceNotification({
      title: `✅ Payment Confirmed — ${tableName}`,
      body: `${tenant.currencySymbol} ${paymentAmount.toLocaleString()} settled via ${method.toUpperCase()} by ${guestName}.`,
      tag: `paid-${tableId}`,
    });

    updateSessionAndSync(tableId, (current) => {
      const existingHistory = current.paymentHistory || [];
      const updatedHistory = [...existingHistory, record];

      // Mark targeted items as paid
      const markedItemIds = new Set(itemsToMark.map((i) => i.orderItemId));
      const updatedItems = current.items.map((i) =>
        markedItemIds.has(i.orderItemId) ? { ...i, paid: true, paidAt: Date.now() } : i
      );

      const stillUnpaidItems = updatedItems.filter((i) => !i.paid && i.status !== 'VOIDED');

      if (!isPartial || stillUnpaidItems.length === 0) {
        return {
          ...current,
          items: current.items.map((i) => ({ ...i, paid: true, paidAt: Date.now() })),
          status: 'occupied',
          paymentState: 'PAYMENT_CONFIRMED',
          paidAmount: (current.paidAmount || 0) + paymentAmount,
          isPaid: true,
          subtotal: 0,
          serviceCharge: 0,
          totalAmount: 0,
          paymentHistory: updatedHistory,
          lastActiveTime: Date.now(),
        };
      }

      const remainingTotal = Math.max(0, current.totalAmount - paymentAmount);
      const remainingSubtotal = Math.round(remainingTotal / (1 + tenant.serviceChargeRate));
      const remainingServiceCharge = remainingTotal - remainingSubtotal;

      return {
        ...current,
        items: updatedItems,
        paidAmount: (current.paidAmount || 0) + paymentAmount,
        subtotal: remainingSubtotal,
        serviceCharge: remainingServiceCharge,
        totalAmount: remainingTotal,
        paymentHistory: updatedHistory,
        paymentState: remainingTotal === 0 ? 'PAYMENT_CONFIRMED' : 'UNPAID',
        isPaid: remainingTotal === 0,
        lastActiveTime: Date.now(),
      };
    });
  };

  const confirmSplitPayment = (
    tableId: string,
    splitType: 'full' | 'even' | 'by_guest' | 'by_item',
    amountPaid: number,
    method: 'mobile_money' | 'cash' | 'card',
    guestName: string,
    itemIds?: string[]
  ) => {
    confirmPayment(tableId, method, amountPaid, guestName, itemIds);
  };

  // Table Management & Manual Clear Overrides
  const clearTable = (
    tableId: string,
    reasonCode: 'paid_cash' | 'paid_mobile_money' | 'unpaid_walkout' | 'other',
    note?: string
  ) => {
    const session = sessions[tableId];
    const tableName = tables.find((t) => t.id === tableId)?.name || 'Table';

    if (reasonCode === 'unpaid_walkout' && session && session.totalAmount > 0) {
      const newLog: WalkoutLog = {
        id: `wo-${Date.now()}`,
        tableId,
        tableName,
        amount: session.totalAmount,
        reason: note || 'Guests departed without settling balance',
        timestamp: Date.now(),
        clearedBy: 'Francis (Floor Staff)',
      };
      setWalkoutLogs((prev) => [newLog, ...prev]);

      sendDeviceNotification({
        title: `⚠️ Walkout Logged — ${tableName}`,
        body: `Loss of ${tenant.currencySymbol} ${session.totalAmount.toLocaleString()} recorded in manager audit register.`,
        tag: `walkout-${tableId}`,
      });
    }

    closeTableSession(tableId);
  };

  const setTableStatus = (tableId: string, status: TableStatus) => {
    updateSessionAndSync(tableId, (current) => ({
      ...current,
      status,
      lastActiveTime: Date.now(),
    }));
  };

  const submitFeedback = (rating: number, foodRating: number, serviceRating: number, comment?: string) => {
    const newFeedback: CustomerFeedback = {
      id: `fb-${Date.now()}`,
      rating,
      foodRating,
      serviceRating,
      comment,
      tableId: activeTableId,
      timestamp: Date.now(),
    };
    setFeedbackList((prev) => [newFeedback, ...prev]);
  };

  const toggleItemAvailability = (itemId: string) => {
    setMenu((prev) =>
      prev.map((i) => (i.id === itemId ? { ...i, available: !i.available } : i))
    );
  };

  const updateMenuItem = (updatedItem: MenuItem) => {
    setMenu((prev) => prev.map((i) => (i.id === updatedItem.id ? updatedItem : i)));
  };

  const addNewMenuItem = (newItem: Omit<MenuItem, 'id'>) => {
    const item: MenuItem = {
      ...newItem,
      id: `m-${Date.now()}`,
    };
    setMenu((prev) => [item, ...prev]);
  };

  const resetDemoData = () => {
    localStorage.clear();
    setMenu(getInitialMenuForTenant(tenant.slug));
    setTables(getInitialTablesForTenant(tenant.slug));
    setSessions(tenant.slug === 'lakeview' ? INITIAL_TABLE_SESSIONS : {});
    setCart([]);
    setWalkoutLogs(tenant.slug === 'lakeview' ? INITIAL_WALKOUTS : []);
    setCurrentGuest('');
    setActiveTableId(tenant.slug === 'capitalgrill' ? 'cgt-1' : 't12');
  };

  const simulateNextStep = () => {
    const session = activeSession;
    if (!session || session.items.length === 0) return;

    const placedItem = session.items.find((i) => i.status === 'PLACED');
    if (placedItem) {
      advanceItemStatus(activeTableId, placedItem.orderItemId);
      return;
    }
    const acceptedItem = session.items.find((i) => i.status === 'ACCEPTED');
    if (acceptedItem) {
      advanceItemStatus(activeTableId, acceptedItem.orderItemId);
      return;
    }
    const prepItem = session.items.find((i) => i.status === 'PREPARING');
    if (prepItem) {
      advanceItemStatus(activeTableId, prepItem.orderItemId);
      return;
    }
    const readyItem = session.items.find((i) => i.status === 'READY');
    if (readyItem) {
      advanceItemStatus(activeTableId, readyItem.orderItemId);
      return;
    }
  };

  return (
    <RestaurantContext.Provider
      value={{
        menu,
        toggleItemAvailability,
        updateMenuItem,
        addNewMenuItem,
        tables,
        activeTableId,
        setActiveTableId,
        activeSession,
        sessions,
        currentGuest,
        setCurrentGuest,
        addGuestToSession,
        leaveTableSession,
        closeTableSession,
        cart,
        addToCart,
        removeFromCart,
        updateCartQuantity,
        clearCart,
        cartSubtotal,
        cartTotalCount,
        placeOrder,
        updateItemStatus,
        voidOrderItem,
        advanceItemStatus,
        requestAssistance,
        resolveAssistance,
        requestBill,
        startMobileMoneyPayment,
        confirmPayment,
        confirmSplitPayment,
        cancelPaymentPrompt,
        clearTable,
        setTableStatus,
        walkoutLogs,
        feedbackList,
        submitFeedback,
        resetDemoData,
        simulateNextStep,
      }}
    >
      {children}
    </RestaurantContext.Provider>
  );
}

export function useRestaurant() {
  const context = useContext(RestaurantContext);
  if (!context) {
    throw new Error('useRestaurant must be used within a RestaurantProvider');
  }
  return context;
}
