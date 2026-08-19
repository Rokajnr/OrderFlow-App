import React, { useState, useEffect } from 'react';
import { RestaurantProvider, useRestaurant } from './context/RestaurantContext';
import { TableWelcomeScreen } from './components/customer/TableWelcomeScreen';
import { MenuBrowseScreen } from './components/customer/MenuBrowseScreen';
import { CartReviewScreen } from './components/customer/CartReviewScreen';
import { LiveOrderTrackerScreen } from './components/customer/LiveOrderTrackerScreen';
import { BillAndPaymentScreen } from './components/customer/BillAndPaymentScreen';
import { MyTablesScreen } from './components/waiter/MyTablesScreen';
import { TableDetailScreen } from './components/waiter/TableDetailScreen';
import { KitchenDisplayBoard } from './components/kitchen/KitchenDisplayBoard';
import { ManagerOverviewScreen } from './components/manager/ManagerOverviewScreen';
import { MenuManagementScreen } from './components/manager/MenuManagementScreen';
import { NotificationToastContainer } from './components/common/NotificationToastContainer';
import { NotificationTesterModal } from './components/common/NotificationTesterModal';
import { BrandMark } from './components/common/BrandMark';
import { BeforeInstallPromptEvent } from './utils/pwa';
import {
  Smartphone,
  Users,
  ChefHat,
  BarChart3,
  RotateCcw,
  Layers,
  ChevronDown,
  Eye,
  EyeOff,
  Check,
  Share,
  X,
  Bell,
  Move,
} from 'lucide-react';

type RoleView = 'customer' | 'waiter' | 'kitchen' | 'manager';
type CustomerSubView = 'welcome' | 'menu' | 'cart' | 'tracker' | 'payment';
type WaiterSubView = 'tables' | 'detail';
type ManagerSubView = 'overview' | 'menu';
type DockPosition = 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left';

function MainApp() {
  const {
    activeTableId,
    setActiveTableId,
    tables,
    resetDemoData,
  } = useRestaurant();

  const [role, setRole] = useState<RoleView>(() => {
    const params = new URLSearchParams(window.location.search);
    const roleParam = params.get('role') as RoleView | null;
    if (roleParam && ['customer', 'waiter', 'kitchen', 'manager'].includes(roleParam)) {
      return roleParam;
    }
    const saved = localStorage.getItem('orderflow_role') as RoleView | null;
    if (saved && ['customer', 'waiter', 'kitchen', 'manager'].includes(saved)) {
      return saved;
    }
    return 'customer';
  });

  const [customerView, setCustomerView] = useState<CustomerSubView>(() => {
    const params = new URLSearchParams(window.location.search);
    const screenParam = params.get('screen');
    if (screenParam) {
      const num = parseInt(screenParam, 10);
      if (num === 1) return 'welcome';
      if (num === 2) return 'menu';
      if (num === 3) return 'cart';
      if (num === 4) return 'tracker';
      if (num === 5) return 'payment';
    }
    const saved = localStorage.getItem('orderflow_customer_view') as CustomerSubView | null;
    if (saved && ['welcome', 'menu', 'cart', 'tracker', 'payment'].includes(saved)) {
      return saved;
    }
    return 'welcome';
  });

  const [waiterView, setWaiterView] = useState<WaiterSubView>(() => {
    const saved = localStorage.getItem('orderflow_waiter_view') as WaiterSubView | null;
    return saved && ['tables', 'detail'].includes(saved) ? saved : 'tables';
  });

  const [selectedWaiterTableId, setSelectedWaiterTableId] = useState<string>(() => {
    const saved = localStorage.getItem('orderflow_active_table_id');
    return saved || 't12';
  });

  const [managerView, setManagerView] = useState<ManagerSubView>(() => {
    const saved = localStorage.getItem('orderflow_manager_view') as ManagerSubView | null;
    return saved && ['overview', 'menu'].includes(saved) ? saved : 'overview';
  });

  const [isPhoneFrame, setIsPhoneFrame] = useState<boolean>(false);
  const [showScreenPicker, setShowScreenPicker] = useState<boolean>(false);
  const [showDockScreenPicker, setShowDockScreenPicker] = useState<boolean>(false);
  
  // Default control bar state: Hidden top bar, small mini-circle orb at bottom-right corner
  const [isControlsHidden, setIsControlsHidden] = useState<boolean>(true);
  const [dockPosition, setDockPosition] = useState<DockPosition>('bottom-right');
  const [isMiniDock, setIsMiniDock] = useState<boolean>(true);

  const [showInstallModal, setShowInstallModal] = useState<boolean>(false);
  const [showNotificationTester, setShowNotificationTester] = useState<boolean>(false);
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [, setIsInstalled] = useState<boolean>(false);

  // Sync role & view states to localStorage
  useEffect(() => {
    localStorage.setItem('orderflow_role', role);
  }, [role]);

  useEffect(() => {
    localStorage.setItem('orderflow_customer_view', customerView);
  }, [customerView]);

  useEffect(() => {
    localStorage.setItem('orderflow_waiter_view', waiterView);
  }, [waiterView]);

  useEffect(() => {
    localStorage.setItem('orderflow_manager_view', managerView);
  }, [managerView]);

  // Handle URL query parameters for initial role & screen routing
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const roleParam = params.get('role') as RoleView | null;
    const screenParam = params.get('screen');

    if (roleParam && ['customer', 'waiter', 'kitchen', 'manager'].includes(roleParam)) {
      setRole(roleParam);
    }
    if (screenParam) {
      jumpToScreen(parseInt(screenParam, 10));
    }

    const isStandalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as any).standalone ||
      document.referrer.includes('android-app://');

    if (isStandalone) {
      setIsInstalled(true);
      setIsControlsHidden(true);
    }

    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);
    window.addEventListener('appinstalled', () => {
      setIsInstalled(true);
      setDeferredPrompt(null);
    });

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
    };
  }, []);

  const jumpToScreen = (screenNumber: number) => {
    setShowScreenPicker(false);
    setShowDockScreenPicker(false);
    switch (screenNumber) {
      case 1:
        setRole('customer');
        setCustomerView('welcome');
        break;
      case 2:
        setRole('customer');
        setCustomerView('menu');
        break;
      case 3:
        setRole('customer');
        setCustomerView('cart');
        break;
      case 4:
        setRole('customer');
        setCustomerView('tracker');
        break;
      case 5:
        setRole('customer');
        setCustomerView('payment');
        break;
      case 6:
        setRole('waiter');
        setWaiterView('tables');
        break;
      case 7:
        setRole('waiter');
        setSelectedWaiterTableId(activeTableId || 't12');
        setWaiterView('detail');
        break;
      case 8:
        setRole('kitchen');
        break;
      case 9:
        setRole('manager');
        setManagerView('overview');
        break;
      case 10:
        setRole('manager');
        setManagerView('menu');
        break;
    }
  };

  const getDockPositionClasses = () => {
    switch (dockPosition) {
      case 'bottom-right':
        return 'bottom-4 right-4';
      case 'bottom-left':
        return 'bottom-4 left-4';
      case 'top-right':
        return 'top-4 right-4';
      case 'top-left':
        return 'top-4 left-4';
      default:
        return 'bottom-4 right-4';
    }
  };

  const isDockAtBottom = dockPosition.startsWith('bottom');

  const cycleDockPosition = (e: React.MouseEvent) => {
    e.stopPropagation();
    const positions: DockPosition[] = ['bottom-right', 'bottom-left', 'top-left', 'top-right'];
    const nextIdx = (positions.indexOf(dockPosition) + 1) % positions.length;
    setDockPosition(positions[nextIdx]);
  };

  // Reusable 10 MVP Screens Menu List
  const renderScreenList = () => (
    <div className="space-y-1">
      <div className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-[#AAA298] border-b border-stone-800">
        Customer App
      </div>
      <button
        onClick={() => jumpToScreen(1)}
        className="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-stone-800 text-stone-200 flex items-center justify-between cursor-pointer"
      >
        <span>1 — Table welcome (QR scan)</span>
        <span className="text-[10px] text-[#AAA298]">Welcome</span>
      </button>
      <button
        onClick={() => jumpToScreen(2)}
        className="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-stone-800 text-stone-200 flex items-center justify-between cursor-pointer"
      >
        <span>2 — Menu browse &amp; customize</span>
        <span className="text-[10px] text-[#AAA298]">Add-ons</span>
      </button>
      <button
        onClick={() => jumpToScreen(3)}
        className="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-stone-800 text-stone-200 flex items-center justify-between cursor-pointer"
      >
        <span>3 — Cart / order review</span>
        <span className="text-[10px] text-[#AAA298]">Shared</span>
      </button>
      <button
        onClick={() => jumpToScreen(4)}
        className="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-stone-800 text-stone-200 flex items-center justify-between cursor-pointer"
      >
        <span>4 — Live order tracker</span>
        <span className="text-[10px] text-[#AAA298]">Timeline</span>
      </button>
      <button
        onClick={() => jumpToScreen(5)}
        className="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-stone-800 text-stone-200 flex items-center justify-between cursor-pointer"
      >
        <span>5 — Bill &amp; payment (3 states)</span>
        <span className="text-[10px] text-[#AAA298]">Mobile Money</span>
      </button>

      <div className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-[#AAA298] border-b border-stone-800 pt-2">
        Operations &amp; Admin
      </div>
      <button
        onClick={() => jumpToScreen(6)}
        className="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-stone-800 text-stone-200 flex items-center justify-between cursor-pointer"
      >
        <span>6 — Waiter floor view</span>
        <span className="text-[10px] text-[#AAA298]">Floor</span>
      </button>
      <button
        onClick={() => jumpToScreen(7)}
        className="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-stone-800 text-stone-200 flex items-center justify-between cursor-pointer"
      >
        <span>7 — Waiter table detail</span>
        <span className="text-[10px] text-[#AAA298]">Actions</span>
      </button>
      <button
        onClick={() => jumpToScreen(8)}
        className="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-stone-800 text-stone-200 flex items-center justify-between cursor-pointer"
      >
        <span>8 — Kitchen display board (KDS)</span>
        <span className="text-[10px] text-[#AAA298]">3 Columns</span>
      </button>
      <button
        onClick={() => jumpToScreen(9)}
        className="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-stone-800 text-stone-200 flex items-center justify-between cursor-pointer"
      >
        <span>9 — Manager overview</span>
        <span className="text-[10px] text-[#AAA298]">Metrics</span>
      </button>
      <button
        onClick={() => jumpToScreen(10)}
        className="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-stone-800 text-stone-200 flex items-center justify-between cursor-pointer"
      >
        <span>10 — Live menu management</span>
        <span className="text-[10px] text-[#AAA298]">Stock Toggle</span>
      </button>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#1E1B18] flex flex-col font-sans relative selection:bg-[#C9532F]/20">
      {/* Toast Notification Stream Container */}
      <NotificationToastContainer />

      {/* Top Application Bar - Role Switching & Demo Hub */}
      {!isControlsHidden ? (
        <header className="bg-[#141210] border-b border-[#2C2723] text-stone-200 sticky top-0 z-40 px-3 sm:px-6 py-2.5 shadow-lg transition-all duration-300">
          <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-2.5">
            {/* Brand Title */}
            <div className="flex items-center gap-2.5">
              <BrandMark size="sm" variant="terracotta" />
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="font-extrabold text-sm text-white tracking-tight">OrderFlow</span>
                  <span className="text-[10px] font-bold bg-[#C9532F]/20 text-[#F0D8CC] px-2 py-0.5 rounded-full border border-[#C9532F]/30">
                    Lakeview
                  </span>
                </div>
                <p className="text-[10px] text-[#AAA298] hidden sm:block">
                  Malawi Kwacha (MK) · Real-time Restaurant Operations
                </p>
              </div>
            </div>

            {/* Role Navigation Pills */}
            <div className="flex items-center gap-1 bg-[#231F1B] p-1 rounded-2xl border border-stone-800">
              <button
                onClick={() => setRole('customer')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                  role === 'customer'
                    ? 'bg-[#C9532F] text-white shadow-xs'
                    : 'text-[#AAA298] hover:text-white'
                }`}
              >
                <Smartphone className="w-3.5 h-3.5" />
                <span>Customer</span>
              </button>

              <button
                onClick={() => setRole('waiter')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                  role === 'waiter'
                    ? 'bg-[#C9532F] text-white shadow-xs'
                    : 'text-[#AAA298] hover:text-white'
                }`}
              >
                <Users className="w-3.5 h-3.5" />
                <span>Waiter</span>
              </button>

              <button
                onClick={() => setRole('kitchen')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                  role === 'kitchen'
                    ? 'bg-[#C9532F] text-white shadow-xs'
                    : 'text-[#AAA298] hover:text-white'
                }`}
              >
                <ChefHat className="w-3.5 h-3.5" />
                <span>Kitchen (KDS)</span>
              </button>

              <button
                onClick={() => setRole('manager')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                  role === 'manager'
                    ? 'bg-[#C9532F] text-white shadow-xs'
                    : 'text-[#AAA298] hover:text-white'
                }`}
              >
                <BarChart3 className="w-3.5 h-3.5" />
                <span>Manager</span>
              </button>
            </div>

            {/* Controls Hub */}
            <div className="flex items-center gap-2">
              {/* 10 MVP Screens Quick Jump */}
              <div className="relative">
                <button
                  onClick={() => setShowScreenPicker(!showScreenPicker)}
                  className="py-1.5 px-3 bg-[#2A2520] hover:bg-[#342E28] border border-stone-700 text-stone-200 text-xs font-bold rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Layers className="w-3.5 h-3.5 text-[#F0D8CC]" />
                  <span className="hidden sm:inline">10 MVP Screens</span>
                  <span className="sm:hidden">Screens</span>
                  <ChevronDown className="w-3 h-3 text-stone-400" />
                </button>

                {showScreenPicker && (
                  <>
                    <div
                      className="fixed inset-0 z-40 bg-transparent"
                      onClick={() => setShowScreenPicker(false)}
                    />
                    <div className="absolute right-0 top-full mt-2 w-[calc(100vw-32px)] max-w-[280px] sm:w-72 bg-[#211F1B] border border-stone-700 rounded-2xl shadow-2xl p-2 z-50 text-xs max-h-[calc(100vh-100px)] overflow-y-auto">
                      {renderScreenList()}
                    </div>
                  </>
                )}
              </div>

              {/* Notification Tester */}
              <button
                onClick={() => setShowNotificationTester(true)}
                className="py-1.5 px-2.5 bg-[#2A2520] hover:bg-[#342E28] border border-stone-700 text-[#F0D8CC] text-xs font-bold rounded-xl flex items-center gap-1 transition-colors cursor-pointer"
                title="Test Push Notifications"
              >
                <Bell className="w-3.5 h-3.5" />
                <span className="hidden md:inline">Alerts</span>
              </button>

              {/* Reset Data */}
              <button
                onClick={resetDemoData}
                className="p-2 bg-[#2A2520] hover:bg-[#342E28] text-stone-300 hover:text-white rounded-xl border border-stone-700 transition-colors cursor-pointer"
                title="Reset demo data"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>

              {/* Hide Controls Button */}
              <button
                onClick={() => {
                  setIsControlsHidden(true);
                  setIsMiniDock(true);
                }}
                className="py-1.5 px-3 bg-stone-800 hover:bg-stone-700 text-stone-200 text-xs font-bold rounded-xl border border-stone-600 flex items-center gap-1.5 transition-colors shadow-xs cursor-pointer"
                title="Minimize controls to floating dock"
              >
                <EyeOff className="w-3.5 h-3.5 text-[#F0D8CC]" />
                <span className="font-semibold">Hide Bar</span>
              </button>
            </div>
          </div>
        </header>
      ) : null}

      {/* Sub-Header context bar for Customer view: Active Table & Guest selector */}
      {!isControlsHidden && role === 'customer' && (
        <div className="bg-[#241F1A] border-b border-stone-800/80 px-4 py-2 text-xs text-stone-300">
          <div className="max-w-4xl mx-auto flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="text-[#AAA298] font-medium">Table:</span>
              <select
                value={activeTableId}
                onChange={(e) => setActiveTableId(e.target.value)}
                className="bg-[#1B1713] text-stone-200 font-bold border border-stone-700 rounded-lg px-2.5 py-1 text-xs focus:outline-none focus:border-[#C9532F]"
              >
                {tables.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name} ({t.section})
                  </option>
                ))}
              </select>
            </div>

            {/* Customer Sub-Tabs */}
            <div className="flex items-center gap-1">
              <button
                onClick={() => setCustomerView('welcome')}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold cursor-pointer ${
                  customerView === 'welcome'
                    ? 'bg-[#C9532F] text-white'
                    : 'text-[#AAA298] hover:text-white'
                }`}
              >
                1: Welcome
              </button>
              <button
                onClick={() => setCustomerView('menu')}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold cursor-pointer ${
                  customerView === 'menu'
                    ? 'bg-[#C9532F] text-white'
                    : 'text-[#AAA298] hover:text-white'
                }`}
              >
                2: Menu
              </button>
              <button
                onClick={() => setCustomerView('cart')}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold cursor-pointer ${
                  customerView === 'cart'
                    ? 'bg-[#C9532F] text-white'
                    : 'text-[#AAA298] hover:text-white'
                }`}
              >
                3: Cart
              </button>
              <button
                onClick={() => setCustomerView('tracker')}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold cursor-pointer ${
                  customerView === 'tracker'
                    ? 'bg-[#C9532F] text-white'
                    : 'text-[#AAA298] hover:text-white'
                }`}
              >
                4: Tracker
              </button>
              <button
                onClick={() => setCustomerView('payment')}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold cursor-pointer ${
                  customerView === 'payment'
                    ? 'bg-[#C9532F] text-white'
                    : 'text-[#AAA298] hover:text-white'
                }`}
              >
                5: Bill &amp; Pay
              </button>
            </div>

            {/* Simulated Frame Toggle */}
            <button
              onClick={() => setIsPhoneFrame(!isPhoneFrame)}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-bold border transition-colors hidden md:flex items-center gap-1 cursor-pointer ${
                isPhoneFrame
                  ? 'bg-[#C9532F]/20 border-[#C9532F] text-[#F0D8CC]'
                  : 'bg-stone-800 border-stone-700 text-[#AAA298] hover:text-white'
              }`}
            >
              <Smartphone className="w-3.5 h-3.5" />
              <span>{isPhoneFrame ? 'Exit Phone Frame' : 'Phone Frame View'}</span>
            </button>
          </div>
        </div>
      )}

      {/* Floating Dev Dock (Small circle orb by default in bottom-right corner) */}
      {isControlsHidden && (
        <aside
          aria-label="Developer Preview Controls"
          className={`fixed z-50 transition-all duration-200 ${getDockPositionClasses()}`}
        >
          {isMiniDock ? (
            <button
              onClick={() => setIsMiniDock(false)}
              aria-label="Expand Developer Preview Controls"
              className="w-10 h-10 rounded-full bg-[#C9532F] hover:bg-[#B54624] shadow-2xl flex items-center justify-center border-2 border-[#1E1B18] transition-all hover:scale-110 active:scale-95 cursor-pointer ring-2 ring-white/30"
              title="Expand OrderFlow Controls (Switch Roles & 10 Screens)"
            >
              <Layers className="w-4 h-4 text-white" />
            </button>
          ) : (
            <div className="relative bg-[#211F1B]/95 backdrop-blur-md border border-stone-700/90 shadow-2xl rounded-2xl p-1.5 flex flex-wrap items-center gap-1.5 text-stone-200 text-xs">
              <button
                onClick={() => setIsControlsHidden(false)}
                className="py-1.5 px-2.5 bg-[#C9532F] hover:bg-[#B54624] text-white font-bold rounded-xl flex items-center gap-1 shadow-xs transition-all text-xs cursor-pointer"
                title="Show full top navigation bar"
              >
                <Eye className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Show Bar</span>
              </button>

              {/* Role switcher icons */}
              <div className="flex items-center gap-0.5 bg-[#141210] p-0.5 rounded-xl border border-stone-800">
                <button
                  onClick={() => setRole('customer')}
                  className={`p-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    role === 'customer'
                      ? 'bg-[#C9532F] text-white shadow-xs'
                      : 'text-stone-400 hover:text-white'
                  }`}
                  title="Customer Menu"
                >
                  <Smartphone className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => setRole('waiter')}
                  className={`p-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    role === 'waiter'
                      ? 'bg-[#C9532F] text-white shadow-xs'
                      : 'text-stone-400 hover:text-white'
                  }`}
                  title="Waiter Tables"
                >
                  <Users className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => setRole('kitchen')}
                  className={`p-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    role === 'kitchen'
                      ? 'bg-[#C9532F] text-white shadow-xs'
                      : 'text-stone-400 hover:text-white'
                  }`}
                  title="Kitchen KDS"
                >
                  <ChefHat className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => setRole('manager')}
                  className={`p-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    role === 'manager'
                      ? 'bg-[#C9532F] text-white shadow-xs'
                      : 'text-stone-400 hover:text-white'
                  }`}
                  title="Manager Overview"
                >
                  <BarChart3 className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* 10 MVP Screens Trigger in Dock */}
              <div className="relative">
                <button
                  onClick={() => setShowDockScreenPicker(!showDockScreenPicker)}
                  className="py-1.5 px-2 bg-[#2A2520] hover:bg-[#342E28] border border-stone-700 text-[#F0D8CC] text-xs font-bold rounded-xl flex items-center gap-1 transition-colors cursor-pointer"
                  title="10 MVP Screens Menu"
                >
                  <Layers className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Screens</span>
                  <ChevronDown className="w-3 h-3 text-stone-400" />
                </button>

                {showDockScreenPicker && (
                  <>
                    <div
                      className="fixed inset-0 z-40 bg-transparent"
                      onClick={() => setShowDockScreenPicker(false)}
                    />
                    <div
                      className={`absolute right-0 ${
                        isDockAtBottom ? 'bottom-full mb-2' : 'top-full mt-2'
                      } w-[calc(100vw-32px)] max-w-[280px] sm:w-72 bg-[#211F1B] border border-stone-700 rounded-2xl shadow-2xl p-2 z-50 text-xs max-h-[70vh] overflow-y-auto`}
                    >
                      {renderScreenList()}
                    </div>
                  </>
                )}
              </div>

              {/* Notification Alerts Tester */}
              <button
                onClick={() => setShowNotificationTester(true)}
                className="p-1.5 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 rounded-xl border border-amber-500/40 transition-colors cursor-pointer"
                title="Test Push Notifications"
              >
                <Bell className="w-3.5 h-3.5" />
              </button>

              {/* Reset Data */}
              <button
                onClick={resetDemoData}
                className="p-1.5 bg-stone-800 hover:bg-stone-700 text-stone-400 hover:text-white rounded-xl transition-colors cursor-pointer"
                title="Reset demo data"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>

              {/* Move Position Button */}
              <button
                onClick={cycleDockPosition}
                className="p-1.5 bg-stone-800 hover:bg-stone-700 text-stone-400 hover:text-white rounded-xl transition-colors cursor-pointer"
                title={`Move dock to another corner (Current: ${dockPosition})`}
              >
                <Move className="w-3.5 h-3.5" />
              </button>

              {/* Minimize to Small Circle Orb */}
              <button
                onClick={() => {
                  setIsMiniDock(true);
                  setShowDockScreenPicker(false);
                }}
                className="p-1.5 text-stone-400 hover:text-white rounded-lg hover:bg-stone-800 cursor-pointer"
                title="Minimize to small corner circle"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          )}
        </aside>
      )}

      {/* Main Role Content Views */}
      <div className="flex-1">
        {/* CUSTOMER APP */}
        {role === 'customer' && (
          <div
            className={
              !isControlsHidden && isPhoneFrame
                ? 'py-8 px-4 flex justify-center bg-[#141210]'
                : ''
            }
          >
            <div
              className={
                !isControlsHidden && isPhoneFrame
                  ? 'w-[400px] h-[844px] bg-[#F5F0E7] rounded-[48px] border-[10px] border-[#2A2520] shadow-2xl overflow-y-auto relative'
                  : 'w-full'
              }
            >
              {customerView === 'welcome' && (
                <TableWelcomeScreen
                  onContinue={() => setCustomerView('menu')}
                />
              )}
              {customerView === 'menu' && (
                <MenuBrowseScreen
                  onOpenCart={() => setCustomerView('cart')}
                  onOpenTracker={() => setCustomerView('tracker')}
                  onOpenWelcome={() => setCustomerView('welcome')}
                />
              )}
              {customerView === 'cart' && (
                <CartReviewScreen
                  onBackToMenu={() => setCustomerView('menu')}
                  onOrderPlaced={() => setCustomerView('tracker')}
                />
              )}
              {customerView === 'tracker' && (
                <LiveOrderTrackerScreen
                  onBackToMenu={() => setCustomerView('menu')}
                  onRequestBill={() => setCustomerView('payment')}
                  onLeaveTable={() => setCustomerView('welcome')}
                />
              )}
              {customerView === 'payment' && (
                <BillAndPaymentScreen
                  onBackToTracker={() => setCustomerView('tracker')}
                  onBackToMenu={() => setCustomerView('menu')}
                  onLeaveTable={() => setCustomerView('welcome')}
                />
              )}
            </div>
          </div>
        )}

        {/* WAITER APP */}
        {role === 'waiter' && (
          <div>
            {waiterView === 'tables' && (
              <MyTablesScreen
                onSelectTable={(tableId) => {
                  setSelectedWaiterTableId(tableId);
                  setActiveTableId(tableId);
                  setWaiterView('detail');
                }}
              />
            )}
            {waiterView === 'detail' && (
              <TableDetailScreen
                tableId={selectedWaiterTableId}
                onBack={() => setWaiterView('tables')}
              />
            )}
          </div>
        )}

        {/* KITCHEN DISPLAY (KDS) */}
        {role === 'kitchen' && (
          <div>
            <KitchenDisplayBoard />
          </div>
        )}

        {/* MANAGER DASHBOARD */}
        {role === 'manager' && (
          <div>
            {managerView === 'overview' && (
              <ManagerOverviewScreen
                onSelectTable={(tableId) => {
                  setSelectedWaiterTableId(tableId);
                  setActiveTableId(tableId);
                  setRole('waiter');
                  setWaiterView('detail');
                }}
                onGoToMenu={() => setManagerView('menu')}
              />
            )}
            {managerView === 'menu' && (
              <MenuManagementScreen onBackToOverview={() => setManagerView('overview')} />
            )}
          </div>
        )}
      </div>

      {/* PWA Install Modal / Instructions */}
      {showInstallModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
          <div className="bg-[#FFFDF9] rounded-3xl p-6 max-w-sm w-full shadow-2xl border border-[#DDD6CA] animate-in zoom-in-95 duration-150 text-[#211F1B]">
            <div className="flex items-center justify-between pb-3 border-b border-[#DDD6CA]">
              <div className="flex items-center gap-2">
                <BrandMark size="sm" variant="terracotta" />
                <div>
                  <h3 className="font-extrabold text-sm text-[#211F1B]">Install OrderFlow</h3>
                  <p className="text-[11px] text-[#777067]">Lakeview Bar &amp; Grill</p>
                </div>
              </div>
              <button
                onClick={() => setShowInstallModal(false)}
                className="w-7 h-7 rounded-full bg-[#F5F0E7] flex items-center justify-center text-[#777067] hover:text-[#211F1B] cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="py-4 space-y-3 text-xs text-[#211F1B]">
              <p className="font-medium">
                Install this app on your device for instant offline access and full-screen table service:
              </p>

              <div className="space-y-2 bg-[#F5F0E7] p-3 rounded-2xl border border-[#DDD6CA]">
                <div className="flex items-start gap-2">
                  <span className="font-bold text-[#C9532F]">iOS Safari:</span>
                  <span>Tap Share <Share className="w-3.5 h-3.5 inline mx-0.5 text-sky-600" /> then select <strong>"Add to Home Screen"</strong>.</span>
                </div>
                <div className="flex items-start gap-2 pt-1 border-t border-[#DDD6CA]">
                  <span className="font-bold text-[#C9532F]">Android / Chrome:</span>
                  <span>Tap menu <strong>(⋮)</strong> and tap <strong>"Install app"</strong>.</span>
                </div>
              </div>

              <div className="flex items-center gap-2 text-[11px] text-[#166534] font-semibold bg-[#EBF7EE] p-2.5 rounded-xl border border-[#BBF7D0]">
                <Check className="w-4 h-4 shrink-0 text-[#16A34A]" />
                <span>Supports offline menu browsing, waiter tables, and instant KDS updates.</span>
              </div>
            </div>

            <button
              onClick={() => setShowInstallModal(false)}
              className="w-full py-2.5 bg-[#C9532F] hover:bg-[#B54624] text-white text-xs font-bold rounded-xl shadow-xs transition-colors cursor-pointer"
            >
              Got it
            </button>
          </div>
        </div>
      )}

      {/* Device Push Notifications Interactive Tester Modal */}
      <NotificationTesterModal
        isOpen={showNotificationTester}
        onClose={() => setShowNotificationTester(false)}
      />
    </div>
  );
}

export default function App() {
  return (
    <RestaurantProvider>
      <MainApp />
    </RestaurantProvider>
  );
}
