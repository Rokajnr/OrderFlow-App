export type Category = 'food' | 'drinks' | 'desserts';
export type Station = 'kitchen' | 'bar';

export type ItemStatus = 'PLACED' | 'ACCEPTED' | 'PREPARING' | 'READY' | 'SERVED' | 'VOIDED';

export type TableStatus = 'available' | 'occupied' | 'waiting_payment' | 'unattended';

export type PaymentState =
  | 'UNPAID'
  | 'PAYMENT_REQUESTED'
  | 'PROCESSING'
  | 'WAITING_FOR_CONFIRMATION'
  | 'PAYMENT_CONFIRMED'
  | 'READY_TO_CLOSE'
  | 'SESSION_CLOSED'
  | 'FAILED';

export interface MenuItemAddOn {
  id: string;
  name: string;
  price: number;
}

export interface MenuItem {
  id: string;
  name: string;
  category: Category;
  station: Station;
  price: number;
  description: string;
  image: string;
  popular?: boolean;
  available: boolean;
  preparationTimeMins: number;
  addOns?: MenuItemAddOn[];
}

export interface OrderItem {
  orderItemId: string;
  itemId: string;
  name: string;
  category: Category;
  station: Station;
  unitPrice: number;
  quantity: number;
  selectedAddOns: MenuItemAddOn[];
  totalPrice: number;
  notes?: string;
  orderedBy: string; // e.g. "Alice", "Bob"
  status: ItemStatus;
  timestamp: number;
  voidReason?: string;
  isWaste?: boolean;
  paid?: boolean;
  paidAt?: number;
  paymentCycleId?: string;
}

export interface AssistanceRequest {
  id: string;
  type: 'waiter' | 'water' | 'bill' | 'cutlery' | 'general';
  label: string;
  tableId: string;
  time: number;
  status: 'pending' | 'resolved';
  requestedBy: string;
}

export interface PaymentRecord {
  id: string;
  amount: number;
  subtotal: number;
  serviceCharge: number;
  method: 'mobile_money' | 'cash' | 'card';
  provider?: 'airtel' | 'mpamba';
  paidBy: string;
  timestamp: number;
  itemIds: string[];
}

export interface TableSession {
  sessionId: string;
  tableId: string;
  tableName: string;
  status: TableStatus;
  guests: string[]; // ['Alice', 'Bob']
  currentGuest: string;
  items: OrderItem[];
  assistanceRequests: AssistanceRequest[];
  paymentState: PaymentState;
  paymentMethod?: 'mobile_money' | 'cash' | 'card';
  mobileMoneyProvider?: 'airtel' | 'mpamba';
  phoneNumber?: string;
  paidAmount?: number;
  paidBy?: string;
  paymentHistory?: PaymentRecord[];
  createdAt: number;
  lastActiveTime: number;
  subtotal: number; // Outstanding unpaid subtotal
  serviceCharge: number; // Outstanding unpaid service charge
  totalAmount: number; // Outstanding unpaid total amount
  isPaid: boolean;
}

export interface RestaurantTable {
  id: string;
  number: number;
  name: string;
  section: 'Lake Patio' | 'Dining Room' | 'Bar Area' | 'Garden Lounge';
  capacity: number;
  assignedWaiter: string;
  currentSessionId?: string;
}

export interface WalkoutLog {
  id: string;
  tableId: string;
  tableName: string;
  amount: number;
  reason: string;
  timestamp: number;
  clearedBy: string;
}

export interface CustomerFeedback {
  id: string;
  rating: number; // 1 to 5
  foodRating: number;
  serviceRating: number;
  comment?: string;
  tableId: string;
  timestamp: number;
}
