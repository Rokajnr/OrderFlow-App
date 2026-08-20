export type Category = 'food' | 'drinks' | 'desserts';
export type Station = 'kitchen' | 'bar';

export type ItemStatus = 'PLACED' | 'ACCEPTED' | 'PREPARING' | 'READY' | 'SERVED' | 'VOIDED';

export type TableStatus = 'available' | 'occupied' | 'waiting_payment' | 'unattended';

export type StaffRole = 'owner' | 'manager' | 'waiter' | 'kitchen' | 'bartender' | 'cashier';

export type PaymentFeeBearer = 'RESTAURANT' | 'CUSTOMER' | 'SPLIT';

export interface PayChanguConfig {
  enabled: boolean;
  publicKey: string;
  secretKey?: string;
  feeBearer: PaymentFeeBearer;
  airtelEnabled: boolean;
  mpambaEnabled: boolean;
  cardsEnabled: boolean;
}

export interface TenantBranding {
  logoUrl?: string;
  tagline?: string;
  coverImageUrl?: string;
  primaryColor?: string;
  accentColor?: string;
}

export interface TenantStaffMember {
  id: string;
  name: string;
  email: string;
  role: StaffRole;
  pinCode: string; // 4-digit PIN for quick shift actions
  assignedSections?: string[];
  active: boolean;
}

export interface Tenant {
  id: string;
  slug: string; // e.g. 'lakeview' -> lakeview.orderflow.mw
  name: string;
  tagline: string;
  location: string;
  currency: string; // 'MWK'
  currencySymbol: string; // 'MK'
  taxRate: number; // e.g. 0.165
  serviceChargeRate: number; // e.g. 0.10
  idleAlertMinutes: number; // e.g. 25
  autoExpireHours: number; // e.g. 4
  branding: TenantBranding;
  paychangu: PayChanguConfig;
  staff: TenantStaffMember[];
}

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
