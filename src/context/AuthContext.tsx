import React, { createContext, useContext, useState, useEffect } from 'react';
import { TenantStaffMember, StaffRole } from '../types';
import { useTenant } from './TenantContext';

interface AuthContextType {
  currentStaff: TenantStaffMember | null;
  isAuthenticatedStaff: boolean;
  activeRole: StaffRole | 'customer';
  isPinModalOpen: boolean;
  pinModalTargetRole: StaffRole | null;
  pinModalCallback: ((success: boolean) => void) | null;
  loginWithPin: (pin: string, staffMember?: TenantStaffMember) => { success: boolean; error?: string };
  loginAsStaff: (staff: TenantStaffMember) => void;
  logoutStaff: () => void;
  openPinModal: (targetRole?: StaffRole, callback?: (success: boolean) => void) => void;
  closePinModal: () => void;
  verifyPinAction: (pin: string) => boolean;
  staffList: TenantStaffMember[];
  addStaffMember: (newStaff: Omit<TenantStaffMember, 'id'>) => void;
  removeStaffMember: (staffId: string) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { tenant } = useTenant();

  const [staffList, setStaffList] = useState<TenantStaffMember[]>(() => {
    const saved = localStorage.getItem(`orderflow_staff_${tenant.slug}`);
    return saved ? JSON.parse(saved) : (tenant.staff || []);
  });

  const [currentStaff, setCurrentStaff] = useState<TenantStaffMember | null>(() => {
    const saved = sessionStorage.getItem(`orderflow_current_staff_${tenant.slug}`);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        return null;
      }
    }
    return null;
  });

  const [isPinModalOpen, setIsPinModalOpen] = useState(false);
  const [pinModalTargetRole, setPinModalTargetRole] = useState<StaffRole | null>(null);
  const [pinModalCallback, setPinModalCallback] = useState<((success: boolean) => void) | null>(null);

  // Sync staff list when tenant changes
  useEffect(() => {
    const saved = localStorage.getItem(`orderflow_staff_${tenant.slug}`);
    setStaffList(saved ? JSON.parse(saved) : (tenant.staff || []));

    const savedStaff = sessionStorage.getItem(`orderflow_current_staff_${tenant.slug}`);
    if (savedStaff) {
      try {
        setCurrentStaff(JSON.parse(savedStaff));
      } catch {
        setCurrentStaff(null);
      }
    } else {
      setCurrentStaff(null);
    }
  }, [tenant.slug, tenant.staff]);

  // Persist staff list
  useEffect(() => {
    localStorage.setItem(`orderflow_staff_${tenant.slug}`, JSON.stringify(staffList));
  }, [staffList, tenant.slug]);

  // Persist session staff
  useEffect(() => {
    if (currentStaff) {
      sessionStorage.setItem(`orderflow_current_staff_${tenant.slug}`, JSON.stringify(currentStaff));
    } else {
      sessionStorage.removeItem(`orderflow_current_staff_${tenant.slug}`);
    }
  }, [currentStaff, tenant.slug]);

  const loginWithPin = (pin: string, specificStaff?: TenantStaffMember): { success: boolean; error?: string } => {
    const candidate = specificStaff
      ? (specificStaff.pinCode === pin ? specificStaff : null)
      : staffList.find((s) => s.pinCode === pin && s.active);

    if (candidate) {
      setCurrentStaff(candidate);
      return { success: true };
    }
    return { success: false, error: 'Incorrect 4-digit PIN' };
  };

  const loginAsStaff = (staff: TenantStaffMember) => {
    setCurrentStaff(staff);
  };

  const logoutStaff = () => {
    setCurrentStaff(null);
  };

  const openPinModal = (targetRole?: StaffRole, callback?: (success: boolean) => void) => {
    setPinModalTargetRole(targetRole || null);
    setPinModalCallback(() => callback || null);
    setIsPinModalOpen(true);
  };

  const closePinModal = () => {
    setIsPinModalOpen(false);
    setPinModalTargetRole(null);
    setPinModalCallback(null);
  };

  const verifyPinAction = (pin: string): boolean => {
    if (!currentStaff) {
      // Look for any manager or waiter PIN
      const found = staffList.find((s) => s.pinCode === pin && s.active);
      return !!found;
    }
    return currentStaff.pinCode === pin;
  };

  const addStaffMember = (newStaff: Omit<TenantStaffMember, 'id'>) => {
    const created: TenantStaffMember = {
      ...newStaff,
      id: `st_${Date.now()}`,
    };
    setStaffList((prev) => [...prev, created]);
  };

  const removeStaffMember = (staffId: string) => {
    setStaffList((prev) => prev.filter((s) => s.id !== staffId));
    if (currentStaff?.id === staffId) {
      setCurrentStaff(null);
    }
  };

  const activeRole: StaffRole | 'customer' = currentStaff ? currentStaff.role : 'customer';

  return (
    <AuthContext.Provider
      value={{
        currentStaff,
        isAuthenticatedStaff: !!currentStaff,
        activeRole,
        isPinModalOpen,
        pinModalTargetRole,
        pinModalCallback,
        loginWithPin,
        loginAsStaff,
        logoutStaff,
        openPinModal,
        closePinModal,
        verifyPinAction,
        staffList,
        addStaffMember,
        removeStaffMember,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
