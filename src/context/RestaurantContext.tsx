import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
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
  addGuestToSession: (name: string) => void;
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
  confirmPayment: (tableId: string, method: 'mobile_money' | 'cash' | 'card', amount?: number, guestName?: string) => void;
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
  const [menu, setMenu] = useState<MenuItem[]>(() => {
    const saved = localStorage.getItem('orderflow_menu');
    return saved ? JSON.parse(saved) : INITIAL_MENU;
  });

  const [tables] = useState<RestaurantTable[]>(INITIAL_TABLES);

  const [sessions, setSessions] = useState<Record<string, TableSession>>(() => {
    const saved = localStorage.getItem('orderflow_sessions');
    return saved ? JSON.parse(saved) : INITIAL_TABLE_SESSIONS;
  });

  const [activeTableId, setActiveTableId] = useState<string>(() => {
    const saved = localStorage.getItem('orderflow_active_table_id');
    return saved || 't12';
  });
  const [currentGuest, setCurrentGuest] = useState<string>(() => {
    const saved = localStorage.getItem('orderflow_current_guest');
    return saved !== null ? saved : '';
  });
  const [cart, setCart] = useState<CartItem[]>(() => {
    const saved = localStorage.getItem('orderflow_cart');
    return saved ? JSON.parse(saved) : [];
  });
  const [walkoutLogs, setWalkoutLogs] = useState<WalkoutLog[]>(() => {
    const saved = localStorage.getItem('orderflow_walkouts');
    return saved ? JSON.parse(saved) : INITIAL_WALKOUTS;
  });
  const [feedbackList, setFeedbackList] = useState<CustomerFeedback[]>([]);

  // Cross-device Firebase Firestore Real-Time Listener
  useEffect(() => {
    if (!db) {
      console.warn('Firestore instance not available.');
      return;
    }

    testFirestoreConnection();

    let unsubscribe = () => {};
    try {
      unsubscribe = onSnapshot(
        collection(db, 'table_sessions'),
        (snapshot) => {
          if (!snapshot.empty) {
            const remoteSessions: Record<string, TableSession> = {};
            snapshot.forEach((docSnap) => {
              remoteSessions[docSnap.id] = docSnap.data() as TableSession;
            });
            setSessions((prev) => ({
              ...INITIAL_TABLE_SESSIONS,
              ...prev,
              ...remoteSessions,
            }));
          } else {
            // Initialize Firestore with default tables on first launch
            Object.entries(INITIAL_TABLE_SESSIONS).forEach(([tId, sess]) => {
              if (db) {
                setDoc(doc(db, 'table_sessions', tId), sess).catch((err) =>
                  handleFirestoreError(err, OperationType.WRITE, `table_sessions/${tId}`)
                );
              }
            });
          }
        },
        (error) => {
          handleFirestoreError(error, OperationType.LIST, 'table_sessions');
        }
      );
    } catch (error) {
      console.warn('Could not attach Firestore listener, running locally:', error);
    }

    return () => {
      try {
        unsubscribe();
      } catch {
        // ignore unsubscribe failure
      }
    };
  }, []);

  // Helper to persist a table session to Firebase Firestore
  const syncSessionToFirestore = async (tableId: string, updatedSession: TableSession) => {
    if (!db) return;
    try {
      await setDoc(doc(db, 'table_sessions', tableId), updatedSession);
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `table_sessions/${tableId}`);
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
        guests: [currentGuest],
        currentGuest,
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

  // Local fallback storage
  useEffect(() => {
    localStorage.setItem('orderflow_menu', JSON.stringify(menu));
  }, [menu]);

  useEffect(() => {
    localStorage.setItem('orderflow_sessions', JSON.stringify(sessions));
  }, [sessions]);

  useEffect(() => {
    localStorage.setItem('orderflow_walkouts', JSON.stringify(walkoutLogs));
  }, [walkoutLogs]);

  useEffect(() => {
    if (currentGuest && currentGuest !== 'Guest') {
      localStorage.setItem('orderflow_current_guest', currentGuest);
    } else {
      localStorage.removeItem('orderflow_current_guest');
    }
  }, [currentGuest]);

  useEffect(() => {
    if (activeTableId) {
      localStorage.setItem('orderflow_active_table_id', activeTableId);
    }
  }, [activeTableId]);

  useEffect(() => {
    localStorage.setItem('orderflow_cart', JSON.stringify(cart));
  }, [cart]);

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
        orderedBy: currentGuest,
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
    localStorage.removeItem('orderflow_cart');
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
    localStorage.removeItem('orderflow_current_guest');
  };

  const closeTableSession = (tableId: string) => {
    clearCart();
    localStorage.removeItem('orderflow_cart');
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
      localStorage.removeItem('orderflow_current_guest');
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
      orderedBy: cartItem.orderedBy || currentGuest,
      status: 'PLACED',
      timestamp: Date.now(),
      paid: false,
    }));

    const tableName = tables.find((t) => t.id === activeTableId)?.name || 'Table';

    sendDeviceNotification({
      title: `📥 New Order Placed — ${tableName}`,
      body: `${newOrderItems.length} item(s) sent to Kitchen KDS by ${currentGuest}. Total: MK ${cartSubtotal.toLocaleString()}`,
      tag: `order-${activeTableId}`,
    });

    updateSessionAndSync(activeTableId, (current) => {
      const updatedItems = [...current.items, ...newOrderItems];
      const unpaidActiveItems = updatedItems.filter((i) => i.status !== 'VOIDED' && !i.paid);
      const subtotal = unpaidActiveItems.reduce((sum, i) => sum + i.totalPrice, 0);
      const serviceCharge = Math.round(subtotal * 0.1);
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
      const serviceCharge = Math.round(subtotal * 0.1);
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
      const serviceCharge = Math.round(subtotal * 0.1);
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
      requestedBy: currentGuest,
    };

    const tableName = tables.find((t) => t.id === activeTableId)?.name || 'Table';

    sendDeviceNotification({
      title: `🛎️ Assistance Requested — ${tableName}`,
      body: `${label} requested by guest ${currentGuest}. Please attend to table.`,
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

  // Payments & State Machine
  const requestBill = (method?: 'mobile_money' | 'cash' | 'card', provider?: 'airtel' | 'mpamba') => {
    const tableName = tables.find((t) => t.id === activeTableId)?.name || 'Table';
    const methodLabel = method === 'mobile_money'
      ? (provider === 'airtel' ? 'Airtel Money' : 'TNM Mpamba')
      : method === 'cash' ? 'Cash' : method === 'card' ? 'POS Card' : 'Bill';

    sendDeviceNotification({
      title: `💳 Bill Requested — ${tableName}`,
      body: `Guest requested ${methodLabel} settlement (MK ${activeSession.totalAmount.toLocaleString()}).`,
      tag: `bill-${activeTableId}`,
    });

    updateSessionAndSync(activeTableId, (current) => ({
      ...current,
      status: 'waiting_payment',
      paymentState: 'PAYMENT_REQUESTED',
      paymentMethod: method || current.paymentMethod,
      mobileMoneyProvider: provider || current.mobileMoneyProvider,
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

  const confirmPayment = (
    tableId: string,
    method: 'mobile_money' | 'cash' | 'card',
    amount?: number,
    guestName?: string
  ) => {
    const current = sessions[tableId];
    if (current) {
      const unpaidItems = current.items.filter((i) => i.status !== 'VOIDED' && !i.paid);
      const activeItems = current.items.filter((i) => i.status !== 'VOIDED');
      const computedSubtotal = unpaidItems.length > 0
        ? unpaidItems.reduce((sum, i) => sum + i.totalPrice, 0)
        : activeItems.reduce((sum, i) => sum + i.totalPrice, 0);
      const computedService = Math.round(computedSubtotal * 0.1);
      const computedTotal = computedSubtotal + computedService;

      const finalAmount = (amount && amount > 0)
        ? amount
        : (current.totalAmount > 0 ? current.totalAmount : (computedTotal > 0 ? computedTotal : 27500));
      const finalGuest = guestName || current.currentGuest || current.guests?.[0] || 'Guest';

      sendDeviceNotification({
        title: `✅ Payment Received — ${current.tableName}`,
        body: `${finalGuest} paid MK ${finalAmount.toLocaleString()} via ${method === 'mobile_money' ? 'Mobile Money' : method === 'cash' ? 'Cash' : 'POS'}. Table is ready to clear.`,
        tag: `payment-confirmed-${tableId}`,
      });
    }

    updateSessionAndSync(tableId, (currentSession) => {
      const unpaidItems = currentSession.items.filter((i) => i.status !== 'VOIDED' && !i.paid);
      const activeItems = currentSession.items.filter((i) => i.status !== 'VOIDED');
      const computedSubtotal = unpaidItems.length > 0
        ? unpaidItems.reduce((sum, i) => sum + i.totalPrice, 0)
        : activeItems.reduce((sum, i) => sum + i.totalPrice, 0);
      const computedService = Math.round(computedSubtotal * 0.1);
      const computedTotal = computedSubtotal + computedService;

      const finalAmount = (amount && amount > 0)
        ? amount
        : (currentSession.totalAmount > 0 ? currentSession.totalAmount : (computedTotal > 0 ? computedTotal : 27500));
      const finalGuest = guestName || currentSession.currentGuest || currentSession.guests?.[0] || 'Guest';

      const cyclePaymentId = `pay-${Date.now()}`;
      const unpaidItemIds: string[] = [];

      const updatedItems = currentSession.items.map((item) => {
        if (item.status !== 'VOIDED' && !item.paid) {
          unpaidItemIds.push(item.orderItemId);
          return {
            ...item,
            paid: true,
            paidAt: Date.now(),
            paymentCycleId: cyclePaymentId,
          };
        }
        return item;
      });

      const paymentRecord = {
        id: cyclePaymentId,
        amount: finalAmount,
        subtotal: computedSubtotal,
        serviceCharge: computedService,
        method,
        provider: currentSession.mobileMoneyProvider,
        paidBy: finalGuest,
        timestamp: Date.now(),
        itemIds: unpaidItemIds.length > 0 ? unpaidItemIds : activeItems.map((i) => i.orderItemId),
      };

      const updatedHistory = [...(currentSession.paymentHistory || []), paymentRecord];

      return {
        ...currentSession,
        items: updatedItems,
        paymentHistory: updatedHistory,
        paymentState: 'READY_TO_CLOSE',
        paymentMethod: method,
        paidAmount: (currentSession.paidAmount || 0) + finalAmount,
        paidBy: finalGuest,
        subtotal: 0,
        serviceCharge: 0,
        totalAmount: 0,
        isPaid: true,
        status: 'occupied',
        lastActiveTime: Date.now(),
      };
    });
  };

  const cancelPaymentPrompt = () => {
    updateSessionAndSync(activeTableId, (current) => ({
      ...current,
      paymentState: 'PAYMENT_REQUESTED',
      lastActiveTime: Date.now(),
    }));
  };

  // Table Clear
  const clearTable = (
    tableId: string,
    reasonCode: 'paid_cash' | 'paid_mobile_money' | 'unpaid_walkout' | 'other',
    note?: string
  ) => {
    const sessionToClear = sessions[tableId];
    if (reasonCode === 'unpaid_walkout' && sessionToClear) {
      const walkout: WalkoutLog = {
        id: `wo-${Date.now()}`,
        tableId,
        tableName: sessionToClear.tableName,
        amount: sessionToClear.totalAmount,
        reason: note || 'Walkout recorded by staff',
        timestamp: Date.now(),
        clearedBy: 'Francis (Staff)',
      };
      setWalkoutLogs((prev) => [walkout, ...prev]);
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

  // Menu Management
  const toggleItemAvailability = (itemId: string) => {
    setMenu((prev) =>
      prev.map((item) => (item.id === itemId ? { ...item, available: !item.available } : item))
    );
  };

  const updateMenuItem = (updated: MenuItem) => {
    setMenu((prev) => prev.map((item) => (item.id === updated.id ? updated : item)));
  };

  const addNewMenuItem = (newItem: Omit<MenuItem, 'id'>) => {
    const id = `m-${Date.now()}`;
    setMenu((prev) => [...prev, { ...newItem, id }]);
  };

  const submitFeedback = (rating: number, foodRating: number, serviceRating: number, comment?: string) => {
    const fb: CustomerFeedback = {
      id: `fb-${Date.now()}`,
      rating,
      foodRating,
      serviceRating,
      comment,
      tableId: activeTableId,
      timestamp: Date.now(),
    };
    setFeedbackList((prev) => [fb, ...prev]);
  };

  const resetDemoData = () => {
    setMenu(INITIAL_MENU);
    setSessions(INITIAL_TABLE_SESSIONS);
    setWalkoutLogs(INITIAL_WALKOUTS);
    setCart([]);
    setCurrentGuest('');
    setActiveTableId('t12');
    localStorage.removeItem('orderflow_menu');
    localStorage.removeItem('orderflow_sessions');
    localStorage.removeItem('orderflow_walkouts');
    localStorage.removeItem('orderflow_cart');
    localStorage.removeItem('orderflow_current_guest');
    localStorage.removeItem('orderflow_active_table_id');
    localStorage.removeItem('orderflow_role');
    localStorage.removeItem('orderflow_customer_view');

    // Reset Firestore documents
    if (db) {
      Object.entries(INITIAL_TABLE_SESSIONS).forEach(([tId, sess]) => {
        setDoc(doc(db, 'table_sessions', tId), sess).catch((err) =>
          handleFirestoreError(err, OperationType.WRITE, `table_sessions/${tId}`)
        );
      });
    }
  };

  const simulateNextStep = () => {
    const t12Session = sessions['t12'];
    if (!t12Session) return;
    const nextItem = t12Session.items.find((i) => i.status !== 'SERVED' && i.status !== 'VOIDED');
    if (nextItem) {
      advanceItemStatus('t12', nextItem.orderItemId);
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
