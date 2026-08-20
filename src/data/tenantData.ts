import { Tenant, MenuItem, RestaurantTable } from '../types';

export const DEMO_TENANTS: Record<string, Tenant> = {
  lakeview: {
    id: 'rest_lakeview_01',
    slug: 'lakeview',
    name: 'Lakeview Bistro & Bar',
    tagline: 'Lake Malawi Fresh Grills & Craft Cocktails',
    location: 'Senga Bay, Salima, Malawi',
    currency: 'MWK',
    currencySymbol: 'MK',
    taxRate: 0.0,
    serviceChargeRate: 0.10,
    idleAlertMinutes: 25,
    autoExpireHours: 4,
    branding: {
      tagline: 'Fresh Fish & Lake Breezes',
      coverImageUrl: 'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=1200&q=80',
      primaryColor: '#059669', // Emerald
      accentColor: '#d97706', // Amber
    },
    paychangu: {
      enabled: true,
      publicKey: 'pub-lakeview-demo-185d5980',
      feeBearer: 'RESTAURANT',
      airtelEnabled: true,
      mpambaEnabled: true,
      cardsEnabled: true,
    },
    staff: [
      { id: 'st_1', name: 'Francis Kanyama', email: 'francis@lakeview.mw', role: 'waiter', pinCode: '1111', assignedSections: ['Lake Patio', 'Garden Lounge'], active: true },
      { id: 'st_2', name: 'Grace Chirwa', email: 'grace@lakeview.mw', role: 'waiter', pinCode: '2222', assignedSections: ['Dining Room'], active: true },
      { id: 'st_3', name: 'Chef Banda', email: 'kitchen@lakeview.mw', role: 'kitchen', pinCode: '3333', active: true },
      { id: 'st_4', name: 'Chifundo (Bartender)', email: 'bar@lakeview.mw', role: 'bartender', pinCode: '4444', active: true },
      { id: 'st_5', name: 'Manager Tembo', email: 'manager@lakeview.mw', role: 'manager', pinCode: '9999', active: true },
    ],
  },
  capitalgrill: {
    id: 'rest_capitalgrill_02',
    slug: 'capitalgrill',
    name: 'Capital Grill & Smokehouse',
    tagline: 'Premium Steaks, Gourmet Burgers & Fine Wine',
    location: 'City Centre, Lilongwe, Malawi',
    currency: 'MWK',
    currencySymbol: 'MK',
    taxRate: 0.165,
    serviceChargeRate: 0.10,
    idleAlertMinutes: 20,
    autoExpireHours: 3,
    branding: {
      tagline: 'Prime Cuts & Artisan Spirits',
      coverImageUrl: 'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=1200&q=80',
      primaryColor: '#b91c1c', // Ruby
      accentColor: '#f59e0b', // Amber
    },
    paychangu: {
      enabled: true,
      publicKey: 'pub-capitalgrill-demo-849204',
      feeBearer: 'CUSTOMER',
      airtelEnabled: true,
      mpambaEnabled: true,
      cardsEnabled: true,
    },
    staff: [
      { id: 'cg_1', name: 'Patrick Phiri', email: 'patrick@capitalgrill.mw', role: 'waiter', pinCode: '1234', assignedSections: ['Main Hall', 'VIP Terrace'], active: true },
      { id: 'cg_2', name: 'Executive Chef Moyo', email: 'moyo@capitalgrill.mw', role: 'kitchen', pinCode: '4321', active: true },
      { id: 'cg_3', name: 'General Manager Gondwe', email: 'gondwe@capitalgrill.mw', role: 'manager', pinCode: '8888', active: true },
    ],
  },
  mzuzuclub: {
    id: 'rest_mzuzuclub_03',
    slug: 'mzuzuclub',
    name: 'Mzuzu Golf & Terrace Club',
    tagline: 'Fairway Views, Refreshing Brews & Hearty Meals',
    location: 'Golf Course Road, Mzuzu, Malawi',
    currency: 'MWK',
    currencySymbol: 'MK',
    taxRate: 0.0,
    serviceChargeRate: 0.05,
    idleAlertMinutes: 30,
    autoExpireHours: 5,
    branding: {
      tagline: 'Relaxed Dining in the Green Hills',
      coverImageUrl: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=1200&q=80',
      primaryColor: '#1e3a8a', // Royal Blue
      accentColor: '#10b981', // Emerald
    },
    paychangu: {
      enabled: true,
      publicKey: 'pub-mzuzuclub-demo-592014',
      feeBearer: 'SPLIT',
      airtelEnabled: true,
      mpambaEnabled: true,
      cardsEnabled: true,
    },
    staff: [
      { id: 'mz_1', name: 'Wongani Nyirenda', email: 'wongani@mzuzuclub.mw', role: 'waiter', pinCode: '5555', assignedSections: ['Clubhouse Patio', '19th Hole Bar'], active: true },
      { id: 'mz_2', name: 'Head Chef Kumwenda', email: 'chef@mzuzuclub.mw', role: 'kitchen', pinCode: '6666', active: true },
      { id: 'mz_3', name: 'Club Secretary Kaunda', email: 'manager@mzuzuclub.mw', role: 'manager', pinCode: '7777', active: true },
    ],
  },
};

export const CAPITAL_GRILL_MENU: MenuItem[] = [
  {
    id: 'cg-m1',
    name: 'Tomahawk Ribeye Steak (650g)',
    category: 'food',
    station: 'kitchen',
    price: 24500,
    description: 'Dry-aged prime beef ribeye flame-seared on charcoal, basted in rosemary-garlic butter with truffle fries.',
    image: 'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=600&q=80',
    popular: true,
    available: true,
    preparationTimeMins: 25,
    addOns: [
      { id: 'cg-ao1', name: 'Creamy Madagascar Peppercorn Sauce', price: 2000 },
      { id: 'cg-ao2', name: 'Charred Bone Marrow Butter', price: 2500 },
      { id: 'cg-ao3', name: 'Grilled King Prawns (2pcs)', price: 4500 },
    ],
  },
  {
    id: 'cg-m2',
    name: 'Smoked Brisket Burger',
    category: 'food',
    station: 'kitchen',
    price: 11500,
    description: '14-hour hickory smoked beef brisket, tangy bourbon BBQ glaze, crispy tobacco onions, smoked gouda on brioche.',
    image: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=600&q=80',
    popular: true,
    available: true,
    preparationTimeMins: 15,
    addOns: [
      { id: 'cg-ao4', name: 'Extra Double Bacon', price: 2000 },
      { id: 'cg-ao5', name: 'Jalapeno Cheese Poppers (3pcs)', price: 2200 },
    ],
  },
  {
    id: 'cg-m3',
    name: 'Old Fashioned Barrel Smoke',
    category: 'drinks',
    station: 'bar',
    price: 6500,
    description: 'Bourbon whiskey, aromatic bitters, orange twist, flamed over oak wood smoke.',
    image: 'https://images.unsplash.com/photo-1551024709-8f23befc6f87?auto=format&fit=crop&w=600&q=80',
    popular: true,
    available: true,
    preparationTimeMins: 5,
  },
  {
    id: 'cg-m4',
    name: 'Cast Iron Skillet Cookie',
    category: 'desserts',
    station: 'kitchen',
    price: 4800,
    description: 'Warm, gooey dark chocolate chip skillet cookie topped with Madagascar vanilla ice cream and hot salted caramel.',
    image: 'https://images.unsplash.com/photo-1587314168485-3236d6710814?auto=format&fit=crop&w=600&q=80',
    popular: true,
    available: true,
    preparationTimeMins: 12,
  },
];

export const CAPITAL_GRILL_TABLES: RestaurantTable[] = [
  { id: 'cgt-1', number: 1, name: 'Table 1', section: 'Dining Room', capacity: 2, assignedWaiter: 'Patrick Phiri' },
  { id: 'cgt-2', number: 2, name: 'Table 2', section: 'Dining Room', capacity: 4, assignedWaiter: 'Patrick Phiri' },
  { id: 'cgt-vip', number: 99, name: 'VIP Booth 1', section: 'Garden Lounge', capacity: 8, assignedWaiter: 'Patrick Phiri' },
];
