'use client';

import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';
import { DashboardChatContext } from '@/lib/chat-context';

type DashboardChatContextValue = {
  dashboardContext: DashboardChatContext | null;
  setDashboardChatContext: (context: DashboardChatContext | null) => void;
};

const DashboardChatContextContext = createContext<DashboardChatContextValue | null>(null);

export function DashboardChatContextProvider({ children }: { children: React.ReactNode }) {
  const [dashboardContext, setDashboardContextState] = useState<DashboardChatContext | null>(null);

  const setDashboardChatContext = useCallback((context: DashboardChatContext | null) => {
    setDashboardContextState(context);
  }, []);

  const value = useMemo(
    () => ({ dashboardContext, setDashboardChatContext }),
    [dashboardContext, setDashboardChatContext],
  );

  return <DashboardChatContextContext.Provider value={value}>{children}</DashboardChatContextContext.Provider>;
}

export function useDashboardChatContext() {
  const context = useContext(DashboardChatContextContext);

  if (!context) {
    throw new Error('useDashboardChatContext must be used within DashboardChatContextProvider');
  }

  return context;
}