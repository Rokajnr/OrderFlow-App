# OrderFlow — Technical Build Specification (v1.0)
### Multi-Tenant Restaurant & Bar Operations Platform

---

## 1. System Architecture & Multi-Tenant Routing

### 1.1 Multi-Tenant Subdomain Model
OrderFlow runs as a single-instance, multi-tenant Progressive Web App (PWA) hosted on a primary domain (`orderflow.mw` / `orderflow.app`). Every restaurant tenant is isolated logically by `restaurantId` and addressed via dedicated subdomains.

```
                    ┌──────────────────────────────────────────────┐
                    │               DNS Wildcard                   │
                    │              *.orderflow.mw                  │
                    └──────────────────────┬───────────────────────┘
                                           │
                        ┌──────────────────▼──────────────────┐
                        │       Single App Engine / CDN       │
                        │        (React PWA + Express)        │
                        └──────────────────┬──────────────────┘
                                           │
         ┌─────────────────────────────────┼─────────────────────────────────┐
         │ (lakeview.orderflow.mw)         │ (capitalgrill.orderflow.mw)     │ (app.orderflow.mw)
         ▼                                 ▼                                 ▼
┌──────────────────┐             ┌──────────────────┐             ┌──────────────────┐
│ Lakeview Bistro  │             │  Capital Grill   │             │  Platform Super  │
│ Tenant Context   │             │  Tenant Context  │             │  Admin Console   │
│ (ID: rest_lk_01) │             │ (ID: rest_cg_02) │             │ (Internal Ops)   │
└────────┬─────────┘             └────────┬─────────┘             └──────────────────┘
         │                                │
         └────────────────┬───────────────┘
                          │
            ┌─────────────▼─────────────┐
            │ Firebase Firestore / Auth │
            │   (Scoped by Tenant ID)   │
            └───────────────────────────┘
```

### 1.2 Subdomain Resolution Flow
1. **Client Request**: Browser loads `https://lakeview.orderflow.mw/t/12` (or `lakeview.orderflow.mw/waiter`).
2. **Tenant Resolver Hook (`useTenant`)**:
   - Extracts hostname: `window.location.hostname` → Subdomain is `lakeview`.
   - Resolves tenant slug `lakeview` against cached Firestore collection `restaurants` (where `slug == "lakeview"`).
   - Injects `restaurantId`, branding (name, logo, theme colors, currency `MK`), and configuration into the React Root Context (`TenantProvider`).
3. **Fallback & Local Dev Support**:
   - In localhost or preview environments (e.g. `localhost:3000?tenant=lakeview` or `orderflow.mw/r/lakeview/t12`), query param / path resolver provides automatic parity with production subdomains.

---

## 2. Authentication, Roles & Security (RBAC)

### 2.1 Role Hierarchy Matrix

| Role | Access Level | Auth Mechanism | Primary Devices | Permissions Summary |
|---|---|---|---|---|
| **Platform Admin** | Platform-Wide | Firebase Auth (Email/Pass + MFA) | Desktop | Restaurant billing, global health, impersonation |
| **Owner** | Full Restaurant | Firebase Auth (Email/Pass) | Desktop / Tablet | Financial reports, menu pricing, staff management, PayChangu settings |
| **Manager** | Floor Operations | Firebase Auth (Email/Pass + PIN) | Tablet / Mobile | Floor plan, live stock toggle, walkout reports, refunds/voids |
| **Waiter** | Assigned Floor | Staff ID + 4-digit PIN lockscreen | Mobile (PWA) | My tables, order dispatch, cash confirmation, table clearance |
| **Kitchen / Bar** | KDS Station | Station Token / PIN | Dedicated Tablet/TV | Order bump (`PREPARING` → `READY`), out-of-stock toggle |
| **Cashier** | Billing & Till | Staff ID + 4-digit PIN | POS Terminal / Tablet | Bill settlement, cash register balance, receipt reprint |
| **Diner (Guest)** | Table Session | Anonymous Auth / Session Token | Personal Smartphone | Read menu, place orders, call waiter, pay bill |

### 2.2 Firebase Authentication & Custom Claims Model
When a staff member is invited by an Owner or Manager, a Firebase User record is provisioned with custom user claims:
```typescript
interface StaffCustomClaims {
  tenantId: string;        // e.g. "rest_lakeview_01"
  role: "owner" | "manager" | "waiter" | "kitchen" | "bartender" | "cashier";
  staffId: string;         // Internal staff record ID
  assignedSections?: string[]; // e.g. ["patio", "dining_room"]
}
```

### 2.3 Fast PIN Quick-Switch (Shift Usability)
Waiters and floor staff share floor tablets or use fast-paced mobile devices. OrderFlow provides a **4-Digit Quick PIN Lockscreen**:
- Device stays authenticated to Firebase under the restaurant tenant session.
- Performing sensitive actions (e.g., cash collection confirmation, order voiding, manual table clear) prompts a 4-digit numeric keypad verifying `staff.pinCode` locally against the session cache before committing to Firestore.

### 2.4 Cryptographically Tamper-Proof Table QR Codes
To prevent diners at Table 02 from guessing Table 12's URL and placing unauthorized orders:
- **QR URL Format**: `https://lakeview.orderflow.mw/t/t12?s=e7f9a2b1`
- `s` parameter is a short HMAC signature generated by the restaurant's secret key (`hmacSha256("t12:lakeview", restaurantSecret).substring(0, 8)`).
- If the signature does not validate, the app prompts: *"Please scan the physical QR code on your table to verify your seat."*

---

## 3. Database Schema (Firestore Data Model)

All data is structured strictly within tenant boundaries.

```
/restaurants/{restaurantId}
  │  name: "Lakeview Bistro"
  │  slug: "lakeview"
  │  currency: "MWK"
  │  taxRate: 0.00
  │  serviceChargeRate: 0.10
  │  idleAlertMinutes: 25
  │  autoExpireHours: 4
  │  paychanguConfig: {
  │    publicKey: "pub_live_...",
  │    feeBearer: "RESTAURANT" | "CUSTOMER" | "SPLIT"
  │  }
  │
  ├── /tables/{tableId}
  │     tableNumber: "12"
  │     name: "Patio 12"
  │     section: "Lake Patio"
  │     qrCodeUrl: "https://..."
  │     qrSignature: "e7f9a2b1"
  │     currentSessionId: "sess_5821" | null
  │     status: "available" | "occupied" | "waiting_payment" | "unattended"
  │     lastActiveAt: Timestamp
  │
  ├── /menu_items/{itemId}
  │     name: "Chambo Fish & Chips"
  │     category: "food" | "drinks" | "desserts"
  │     station: "kitchen" | "bar"
  │     price: 18500
  │     prepTimeMinutes: 20
  │     isAvailable: true
  │     dietaryTags: ["halal", "gluten_free"]
  │     addOns: [{ id: "ao1", name: "Extra Tartar", price: 1500 }]
  │
  ├── /staff/{staffId}
  │     uid: "auth_uid_123"
  │     name: "Chifundo Banda"
  │     role: "waiter"
  │     pinHash: "..."
  │     isActive: true
  │
  ├── /table_sessions/{sessionId}
  │     tableId: "t12"
  │     tableNumber: "12"
  │     section: "Lake Patio"
  │     status: "ACTIVE" | "BILL_REQUESTED" | "PAID" | "CLEARED"
  │     openedAt: Timestamp
  │     closedAt: Timestamp | null
  │     participants: [
  │       { id: "p1", name: "Alice", isHost: true, joinedAt: Timestamp },
  │       { id: "p2", name: "Bob", isHost: false, joinedAt: Timestamp }
  │     ]
  │     subtotal: 37000
  │     serviceCharge: 3700
  │     totalAmount: 40700
  │     paymentMethod: "CASH" | "PAYCHANGU_MOBILE_MONEY" | null
  │     paymentStatus: "UNPAID" | "PENDING" | "CONFIRMED"
  │     splitType: "SINGLE" | "EQUAL" | "ITEMIZED"
  │     clearedReason: null | "paid_cash" | "paid_mobile_money" | "unpaid_walkout" | "other"
  │     clearedByStaffId: null | "staff_01"
  │     
  │     /orders/{orderId}
  │        roundNumber: 1
  │        createdAt: Timestamp
  │        items: [
  │          {
  │            itemId: "item_01",
  │            name: "Chambo Fish & Chips",
  │            quantity: 1,
  │            price: 18500,
  │            station: "kitchen",
  │            orderedBy: "Alice",
  │            status: "PLACED" | "ACCEPTED" | "PREPARING" | "READY" | "SERVED" | "VOIDED",
  │            notes: "Extra crispy chips",
  │            acceptedAt: Timestamp,
  │            readyAt: Timestamp,
  │            servedAt: Timestamp
  │          }
  │        ]
  │
  ├── /assistance_requests/{requestId}
  │     tableNumber: "12"
  │     type: "call_waiter" | "water" | "cutlery" | "bill" | "napkins"
  │     status: "PENDING" | "RESOLVED"
  │     createdAt: Timestamp
  │     resolvedAt: Timestamp | null
  │
  └── /walkout_logs/{logId}
        tableNumber: "12"
        sessionId: "sess_5821"
        amount: 40700
        itemsSummary: "2x Chambo Fish, 4x Carlsberg"
        staffId: "staff_01"
        staffName: "Chifundo Banda"
        notes: "Guests left table after drinks without paying"
        timestamp: Timestamp
```

---

## 4. State Machines & Order Lifecycles

### 4.1 Table Session Lifecycle
```
[ Table Available ]
        │  (Diner scans table QR)
        ▼
  [ ACTIVE ] ◄──────────┐
        │               │ ("Order More" Round added)
        ├───────────────┘
        │  (Diner taps "Request Bill")
        ▼
[ BILL_REQUESTED ] ──(Diner cancels bill request)──> [ ACTIVE ]
        │
        ├────────────────────────────────────────┐
        │ (Mobile Money / PayChangu Verified)    │ (Cash Collected by Waiter)
        ▼                                        ▼
 [ PAYMENT_CONFIRMED ]                    [ PAID (CASH) ]
        │                                        │
        └────────────────┬───────────────────────┘
                         │ (Waiter marks "Clear Table" / Auto-close)
                         ▼
                     [ CLEARED ]
                         │ (Table status resets to "available")
                         ▼
                 [ Table Available ]
```

### 4.2 Order Item State Progression
```
[ PLACED ] ──(Kitchen/Bar taps Accept)──> [ ACCEPTED / PREPARING ]
                                                   │
                                                   ▼ (Chef taps Ready)
                                            [ READY (HOT-PASS) ]
                                                   │
                                                   ▼ (Waiter delivers food)
                                               [ SERVED ]
```
*At any stage prior to `SERVED`, an authorized Waiter or Manager can mark an item as `VOIDED` (capturing reason and whether food was wasted).*

---

## 5. PayChangu Payment Integration Specification

### 5.1 Gateway Architecture
OrderFlow communicates with PayChangu's REST API using the restaurant's merchant credentials:
- **Supported Channels**: Airtel Money, TNM Mpamba, Instant Bank EFT, Credit/Debit Cards.
- **Merchant Model**: Direct settlement to the restaurant's merchant account. OrderFlow takes 0% markup.

### 5.2 Payment Execution Sequence
```
Diner Phone (PWA)           OrderFlow Server Proxy           PayChangu Gateway           Diner SIM/USSD
      │                               │                              │                         │
      │── 1. Selects Airtel/Mpamba ──>│                              │                         │
      │   + Enters phone number       │                              │                         │
      │                               │── 2. POST /v1/mobile-money ─>│                         │
      │                               │   (Amount, Phone, Ref, Key)  │                         │
      │                               │                              │── 3. Push STK Prompt ──>│
      │                               │<─ 4. Returns tx_ref ─────────│   (Enter 4-digit PIN)   │
      │<─ 5. "Check your phone PIN" ──│                              │                         │
      │                               │                              │                         │
      │                               │                              │<─ 6. PIN confirmed ─────│
      │                               │<─ 7. Webhook: charge.success─│                         │
      │                               │   (HMAC signature verified)  │                         │
      │                               │                              │                         │
      │                               │── 8. Firestore Update ──────>│                         │
      │                               │   (paymentStatus='CONFIRMED')│                         │
      │<─ 9. Real-time Toast: PAID ───│                              │                         │
```

### 5.3 Fee Distribution Configuration
Stored per restaurant:
1. **`RESTAURANT` (Default)**: Customer pays exact bill total (e.g. `MK 40,700`). Gateway deducts ~3% from settlement.
2. **`CUSTOMER`**: Gateway surcharge (~3%) added to customer's checkout summary: `MK 40,700 + MK 1,221 fee = MK 41,921`.
3. **`SPLIT`**: 50% absorbed by venue, 50% paid by customer.

---

## 6. Operational Safety, Idle Alerts & Walkout Audit

### 6.1 Idle Table Detection Engine
- Runs as a lightweight client/server rule:
  - If a table has status `occupied`, with all ordered items `SERVED`, and no active interaction for `> idleAlertMinutes` (default: 25 min):
  - Table visual state turns **Amber Warning: "Unattended (28m idle)"**.
  - Waiter receives a subtle push notification: *"Table 12 has been idle for 28 mins. Please check if guests require bill."*

### 6.2 Manual "Clear Table" Override & Walkout Register
Staff can override and clear any physical table at any time with a required reason code:
1. `paid_cash`: Marks tab paid via cash and clears floor.
2. `paid_mobile_money`: Clears floor if payment confirmed externally.
3. `unpaid_walkout`: **Auto-creates a permanent audit record** in `/walkout_logs/` containing itemized summary, lost revenue, timestamp, and staff ID. Generates an executive alert in the Manager Overview.
4. `other`: Table change, duplicate scan, or test session.

---

## 7. Kitchen Display System (KDS) & Multi-Station Routing

1. **Automatic Item Routing**:
   - Menu items tagged `station: "kitchen"` route to the Kitchen Display.
   - Menu items tagged `station: "bar"` route to the Bar Station Display.
   - A single customer cart containing 2 Burgers + 2 Beers splits automatically into respective station tickets sharing the same master order number (`#1042-K` and `#1042-B`).
2. **Elapsed Time Escalation**:
   - `< 10 mins`: Normal (Neutral).
   - `10 - 20 mins`: Moderate (Blue).
   - `> 20 mins`: Overdue (Pulsing Red warning banner).
3. **Audio Cues**: Optional gentle chime on new ticket arrival and ready-for-pickup bell.

---

## 8. Offline-First Architecture & Network Resilience

### 8.1 Caching Strategy (Service Worker)
- **Menu & Assets**: Cache-first with stale-while-revalidate (`/public/sw.js`). Menu images cached locally in browser cache storage.
- **Diner Cart Offline Fallback**:
  - Cart state stored in local IndexedDB.
  - If network drops during checkout: Diner is shown clear UI: *"Network interrupted. You can pay cash to your waiter, or we will retry connecting in 10s."*
  - Automatic exponential backoff retry queue when connectivity is restored.

---

## 9. API & Webhook Specifications

### 9.1 Payment Webhook Endpoint
- **URL**: `POST /api/webhooks/paychangu`
- **Headers**: `X-PayChangu-Signature: <HMAC_SHA256_HASH>`
- **Payload**:
```json
{
  "event": "charge.success",
  "data": {
    "tx_ref": "OF-LK-5821-1724078900",
    "amount": 40700,
    "currency": "MWK",
    "status": "successful",
    "customer": {
      "phone": "+265991234567"
    },
    "metadata": {
      "restaurantId": "rest_lakeview_01",
      "sessionId": "sess_5821",
      "tableNumber": "12"
    }
  }
}
```

---

## 10. Implementation Phasing & Milestones

### Phase 1: Multi-Tenant Foundation & Subdomain Router
- Implement `TenantProvider` and hostname slug extraction.
- Connect tenant data scoping across all Firestore queries.
- Implement Staff PIN lockscreen and role-based route guards.

### Phase 2: PayChangu Live Integration & Webhook Handler
- Implement `/api/paychangu/charge` proxy route.
- Implement `/api/webhooks/paychangu` verification and Firestore session settlement.
- Add merchant settings UI (API key entry, fee bearer selector).

### Phase 3: Hardware & QR Tooling
- Table QR code batch generator with cryptographic signature.
- Printable PDF table-stand export utility in Manager dashboard.
- Walkouts and write-offs shift export report.
