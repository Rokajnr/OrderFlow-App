import React, { createContext, useContext, useState, useEffect } from 'react';
import { Tenant } from '../types';
import { DEMO_TENANTS } from '../data/tenantData';

interface TenantContextType {
  tenant: Tenant;
  tenantSlug: string;
  allTenants: Tenant[];
  setTenantSlug: (slug: string) => void;
  updatePayChanguConfig?: (config: Partial<Tenant['paychangu']>) => void;
  formatPrice: (amount: number) => string;
  isSubdomainDetected: boolean;
  detectedSubdomain: string | null;
}

const TenantContext = createContext<TenantContextType | undefined>(undefined);

export const TenantProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [detectedSubdomain, setDetectedSubdomain] = useState<string | null>(null);
  const [isSubdomainDetected, setIsSubdomainDetected] = useState(false);

  const [tenantSlug, setTenantSlugState] = useState<string>(() => {
    // 1. Check URL query param e.g. ?tenant=capitalgrill or ?r=capitalgrill
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      const paramTenant = urlParams.get('tenant') || urlParams.get('r');
      if (paramTenant && DEMO_TENANTS[paramTenant.toLowerCase()]) {
        return paramTenant.toLowerCase();
      }

      // 2. Check Subdomain e.g. "capitalgrill.orderflow.mw" or "lakeview.localhost"
      const hostname = window.location.hostname.toLowerCase();
      const parts = hostname.split('.');
      if (parts.length >= 3 || (parts.length === 2 && parts[1] === 'localhost')) {
        const potentialSubdomain = parts[0];
        if (DEMO_TENANTS[potentialSubdomain]) {
          return potentialSubdomain;
        }
      }

      // 3. Check SessionStorage
      const savedTenant = sessionStorage.getItem('orderflow_tenant_slug');
      if (savedTenant && DEMO_TENANTS[savedTenant]) {
        return savedTenant;
      }
    }
    return 'lakeview';
  });

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const hostname = window.location.hostname.toLowerCase();
      const parts = hostname.split('.');
      if (parts.length >= 3 || (parts.length === 2 && parts[1] === 'localhost')) {
        const potentialSubdomain = parts[0];
        if (potentialSubdomain !== 'www' && potentialSubdomain !== 'app' && potentialSubdomain !== 'api') {
          setDetectedSubdomain(potentialSubdomain);
          setIsSubdomainDetected(true);
          if (DEMO_TENANTS[potentialSubdomain]) {
            setTenantSlugState(potentialSubdomain);
          }
        }
      }
    }
  }, []);

  const setTenantSlug = (slug: string) => {
    if (DEMO_TENANTS[slug]) {
      setTenantSlugState(slug);
      if (typeof window !== 'undefined') {
        sessionStorage.setItem('orderflow_tenant_slug', slug);
        // Also update URL search param without full reload
        const url = new URL(window.location.href);
        url.searchParams.set('tenant', slug);
        window.history.replaceState({}, '', url.toString());
      }
    }
  };

  const [tenantsState, setTenantsState] = useState<Record<string, Tenant>>(DEMO_TENANTS);

  const currentTenant = tenantsState[tenantSlug] || DEMO_TENANTS.lakeview;

  const updatePayChanguConfig = (config: Partial<Tenant['paychangu']>) => {
    setTenantsState((prev) => ({
      ...prev,
      [tenantSlug]: {
        ...prev[tenantSlug],
        paychangu: {
          ...prev[tenantSlug].paychangu,
          ...config,
        },
      },
    }));
  };

  const formatPrice = (amount: number): string => {
    return `${currentTenant.currencySymbol} ${amount.toLocaleString()}`;
  };

  return (
    <TenantContext.Provider
      value={{
        tenant: currentTenant,
        tenantSlug,
        allTenants: Object.values(tenantsState),
        setTenantSlug,
        updatePayChanguConfig,
        formatPrice,
        isSubdomainDetected,
        detectedSubdomain,
      }}
    >
      {children}
    </TenantContext.Provider>
  );
};

export const useTenant = () => {
  const context = useContext(TenantContext);
  if (!context) {
    throw new Error('useTenant must be used within a TenantProvider');
  }
  return context;
};
