import React, { createContext, useContext, ReactNode } from 'react';

export interface ClearSignContextType {
  rpcUrl: string;
  networkPassphrase?: string;
}

const ClearSignContext = createContext<ClearSignContextType | undefined>(undefined);

export interface ClearSignProviderProps extends ClearSignContextType {
  children: ReactNode;
}

export function ClearSignProvider({ children, rpcUrl, networkPassphrase }: ClearSignProviderProps) {
  return (
    <ClearSignContext.Provider value={{ rpcUrl, networkPassphrase } as ClearSignContextType}>
      {children}
    </ClearSignContext.Provider>
  );
}

export function useClearSignContext() {
  const ctx = useContext(ClearSignContext);
  if (!ctx) {
    throw new Error('useClearSignContext must be used within a ClearSignProvider');
  }
  return ctx;
}
