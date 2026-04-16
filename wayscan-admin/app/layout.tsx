import React from 'react';
import type { Metadata } from 'next';
import './globals.css';
import { DashboardChatContextProvider } from '@/components/dashboard/chat-context-provider';
import { ThemeProvider } from '@/components/providers/theme-provider';
import { LanguageProvider } from '@/components/providers/language-provider';
import { AuthProvider } from '@/lib/AuthContext';

export const metadata: Metadata = {
  title: 'WayScan | AI-Powered Road Intelligence',
  description: 'AI-powered pothole and civic issue detection system',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="bg-slate-50 dark:bg-slate-950 font-sans antialiased text-slate-800 dark:text-slate-50">
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
          <LanguageProvider>
            <AuthProvider>
              <DashboardChatContextProvider>
                {children}
              </DashboardChatContextProvider>
            </AuthProvider>
          </LanguageProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
