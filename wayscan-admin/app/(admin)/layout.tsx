import React from 'react';
import Sidebar from '@/components/layout/sidebar';
import Header from '@/components/layout/header';
import AlertBanner from '@/components/layout/alert-banner';
import AgentPanel from '@/components/dashboard/agent-panel';

import ProtectedRoute from '@/components/ProtectedRoute';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ProtectedRoute>
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
          {/* Global AI Assistant — available on every admin page */}
          <AgentPanel />
        </div>
      </div>
    </ProtectedRoute>
  );
}
