import React from 'react';
import Sidebar from '@/components/layout/sidebar';
import Header from '@/components/layout/header';
import AlertBanner from '@/components/layout/alert-banner';
import AgentPanel from '@/components/dashboard/agent-panel';
import { DashboardChatContextProvider } from '@/components/dashboard/chat-context-provider';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <DashboardChatContextProvider>
      <div className="flex h-screen overflow-hidden bg-slate-50 dark:bg-slate-900">
        <Sidebar />
        <div className="flex flex-col flex-1 overflow-hidden relative">
          <Header />
          <AlertBanner />
          <main className="flex-1 overflow-y-auto p-4 md:p-8 pt-6">
            <div className="max-w-400 mx-auto space-y-6">
              {children}
            </div>
          </main>
          {/* Global AI Assistant — available on every dashboard page */}
          <AgentPanel />
        </div>
      </div>
    </DashboardChatContextProvider>
  );
}
