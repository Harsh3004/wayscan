'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Search, Bell, Calendar, RefreshCw, Sun, Moon, Languages, 
         User, LogOut, Settings, ChevronDown, X, CheckCheck,
         AlertTriangle, Clock, Zap, Info } from 'lucide-react';
import { useTheme } from 'next-themes';
import { useLanguage } from '@/components/providers/language-provider';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { mockAlerts } from '@/lib/mock-data';
import { AlertItem } from '@/lib/types';
import { formatDate } from '@/lib/utils';

const ALERT_ICONS = {
  high_priority: { icon: AlertTriangle, color: 'text-red-500 bg-red-50 dark:bg-red-950/30' },
  unresolved_7d: { icon: Clock, color: 'text-orange-500 bg-orange-50 dark:bg-orange-950/30' },
  queue_overflow: { icon: Zap, color: 'text-blue-500 bg-blue-50 dark:bg-blue-950/30' },
  system: { icon: Info, color: 'text-slate-500 bg-slate-100 dark:bg-slate-800' },
};

export default function Header() {
  const pendingSync = 23;
  const { theme, setTheme } = useTheme();
  const { t, locale, setLocale } = useLanguage();
  const [mounted, setMounted] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [alerts, setAlerts] = useState<AlertItem[]>(mockAlerts);
  const [dateRange, setDateRange] = useState({ from: '', to: '' });
  const [datePickerOpen, setDatePickerOpen] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);
  const dateRef = useRef<HTMLDivElement>(null);

  const unreadCount = alerts.filter(a => !a.read).length;

  useEffect(() => { setMounted(true); }, []);

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) setNotifOpen(false);
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) setProfileOpen(false);
      if (dateRef.current && !dateRef.current.contains(e.target as Node)) setDatePickerOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const markAllRead = () => setAlerts(prev => prev.map(a => ({ ...a, read: true })));
  const markRead = (id: string) => setAlerts(prev => prev.map(a => a.id === id ? { ...a, read: true } : a));

  const today = new Date().toLocaleDateString(locale === 'hi' ? 'hi-IN' : 'en-IN', {
    day: 'numeric', month: 'short', year: 'numeric',
  });

  return (
    <header className="h-20 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 sticky top-0 z-20 px-4 md:px-8">
      <div className="flex h-full items-center justify-between gap-4 max-w-[1600px] mx-auto">

        {/* Search */}
        <div className="flex-1 max-w-md hidden md:block">
          <div className="relative group">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
            <input
              type="text"
              placeholder={t('header.search_placeholder')}
              className="w-full h-11 pl-10 pr-4 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/50 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm dark:text-slate-100 dark:placeholder-slate-400"
            />
          </div>
        </div>

        <div className="flex items-center gap-2 md:gap-4">

          {/* Date Range Picker */}
          <div ref={dateRef} className="relative hidden lg:block">
            <button
              onClick={() => setDatePickerOpen(o => !o)}
              className="flex items-center gap-2 px-3 py-2 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl text-sm hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
            >
              <Calendar className="w-4 h-4 text-blue-500" />
              <span className="font-semibold text-slate-700 dark:text-slate-200 text-xs">
                {dateRange.from && dateRange.to
                  ? `${dateRange.from} → ${dateRange.to}`
                  : today}
              </span>
            </button>
            <AnimatePresence>
              {datePickerOpen && (
                <motion.div
                  initial={{ opacity: 0, y: 8, scale: 0.97 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 8, scale: 0.97 }}
                  className="absolute top-full mt-2 right-0 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl p-4 z-50 min-w-[280px]"
                >
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Date Range</p>
                  <div className="grid grid-cols-2 gap-2 mb-3">
                    <div>
                      <label className="text-[10px] font-bold text-slate-400 mb-1 block">From</label>
                      <input type="date" value={dateRange.from} onChange={e => setDateRange(r => ({ ...r, from: e.target.value }))}
                        className="w-full h-9 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-2 text-xs font-semibold text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20" />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-slate-400 mb-1 block">To</label>
                      <input type="date" value={dateRange.to} onChange={e => setDateRange(r => ({ ...r, to: e.target.value }))}
                        className="w-full h-9 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-2 text-xs font-semibold text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20" />
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => { setDateRange({ from: '', to: '' }); setDatePickerOpen(false); }}
                      className="flex-1 h-8 text-[10px] font-black uppercase text-slate-500 dark:text-slate-400 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
                      Clear
                    </button>
                    <button onClick={() => setDatePickerOpen(false)}
                      className="flex-1 h-8 text-[10px] font-black uppercase text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-colors">
                      Apply
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Sync Badge */}
          <button className={cn(
            "hidden sm:flex items-center gap-2 px-3 py-2 rounded-xl transition-all",
            pendingSync > 0
              ? "bg-orange-50 dark:bg-orange-950/30 text-orange-600 dark:text-orange-400 border border-orange-100 dark:border-orange-900/50"
              : "bg-slate-50 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400"
          )}>
            <RefreshCw className={cn("w-4 h-4", pendingSync > 0 && "animate-spin-slow")} />
            <span className="text-xs font-bold leading-none">{pendingSync} Pending</span>
          </button>

          {/* Controls */}
          <div className="flex items-center gap-1">
            {/* Language */}
            {mounted && (
              <button
                onClick={() => setLocale(locale === 'en' ? 'hi' : 'en')}
                className="p-2.5 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/80 text-blue-500 dark:text-blue-400 font-bold hover:text-slate-800 dark:hover:text-slate-200 transition-colors text-xs uppercase tracking-widest"
                title={t('header.toggle_lang')}
              >
                <span className="flex items-center gap-1"><Languages className="w-4 h-4" />{locale}</span>
              </button>
            )}

            {/* Theme */}
            {mounted && (
              <button
                onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                className="p-2.5 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/80 text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 transition-colors"
              >
                {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
              </button>
            )}

            {/* Notification Bell */}
            <div ref={notifRef} className="relative">
              <button
                onClick={() => setNotifOpen(o => !o)}
                className="relative p-2.5 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/80 text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 transition-colors"
              >
                <Bell className="w-5 h-5" />
                {unreadCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] bg-red-500 rounded-full border-2 border-white dark:border-slate-900 flex items-center justify-center text-[10px] font-black text-white px-1">
                    {unreadCount}
                  </span>
                )}
              </button>

              {/* Notification Panel */}
              <AnimatePresence>
                {notifOpen && (
                  <motion.div
                    initial={{ opacity: 0, x: 20, scale: 0.97 }}
                    animate={{ opacity: 1, x: 0, scale: 1 }}
                    exit={{ opacity: 0, x: 20, scale: 0.97 }}
                    className="absolute top-full mt-2 right-0 w-[360px] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl z-50 overflow-hidden"
                  >
                    <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 dark:border-slate-800">
                      <div className="flex items-center gap-2">
                        <Bell className="w-4 h-4 text-slate-600 dark:text-slate-400" />
                        <span className="font-black text-slate-800 dark:text-slate-100 text-sm">Notifications</span>
                        {unreadCount > 0 && (
                          <span className="bg-red-100 dark:bg-red-950/40 text-red-600 dark:text-red-400 text-[10px] font-black px-1.5 py-0.5 rounded-full">{unreadCount} new</span>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        {unreadCount > 0 && (
                          <button onClick={markAllRead} className="flex items-center gap-1 text-[10px] font-black uppercase text-blue-600 dark:text-blue-400 hover:underline">
                            <CheckCheck className="w-3 h-3" /> All read
                          </button>
                        )}
                      </div>
                    </div>
                    <div className="max-h-[400px] overflow-y-auto custom-scrollbar divide-y divide-slate-50 dark:divide-slate-800/50">
                      {alerts.map(alert => {
                        const cfg = ALERT_ICONS[alert.type];
                        const Icon = cfg.icon;
                        return (
                          <button
                            key={alert.id}
                            onClick={() => markRead(alert.id)}
                            className={cn(
                              "w-full text-left px-4 py-3 flex items-start gap-3 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors",
                              !alert.read && "bg-blue-50/50 dark:bg-blue-900/10"
                            )}
                          >
                            <div className={cn("w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5", cfg.color)}>
                              <Icon className="w-4 h-4" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between gap-2 mb-0.5">
                                <p className={cn("text-sm font-black truncate", !alert.read ? "text-slate-800 dark:text-slate-100" : "text-slate-600 dark:text-slate-300")}>{alert.title}</p>
                                {!alert.read && <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0" />}
                              </div>
                              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium leading-relaxed line-clamp-2">{alert.message}</p>
                              <p className="text-[10px] text-slate-400 dark:text-slate-500 font-bold mt-1">{formatDate(alert.timestamp)}</p>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* Admin Profile Dropdown */}
          <div ref={profileRef} className="relative">
            <button
              onClick={() => setProfileOpen(o => !o)}
              className="flex items-center gap-2 pl-2 pr-3 py-1.5 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors border border-transparent hover:border-slate-200 dark:hover:border-slate-700"
            >
              <div className="w-8 h-8 rounded-full bg-blue-600 dark:bg-blue-500 flex items-center justify-center text-white font-black text-xs">AD</div>
              <div className="hidden md:block text-left">
                <p className="text-xs font-black text-slate-800 dark:text-slate-100 leading-tight">Admin</p>
                <p className="text-[10px] font-medium text-slate-400 leading-tight">Superuser</p>
              </div>
              <ChevronDown className={cn("w-3.5 h-3.5 text-slate-400 transition-transform hidden md:block", profileOpen && "rotate-180")} />
            </button>
            <AnimatePresence>
              {profileOpen && (
                <motion.div
                  initial={{ opacity: 0, y: 8, scale: 0.97 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 8, scale: 0.97 }}
                  className="absolute top-full mt-2 right-0 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl z-50 min-w-[200px] overflow-hidden"
                >
                  <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-800">
                    <p className="font-black text-slate-800 dark:text-slate-100 text-sm">Anjali Sharma</p>
                    <p className="text-xs text-slate-400 font-medium">admin@wayscan.gov.in</p>
                  </div>
                  {[
                    { icon: User, label: 'My Profile' },
                    { icon: Settings, label: 'Settings' },
                  ].map(item => (
                    <button key={item.label} className="w-full flex items-center gap-3 px-4 py-2.5 text-sm font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
                      <item.icon className="w-4 h-4 text-slate-400" />
                      {item.label}
                    </button>
                  ))}
                  <div className="border-t border-slate-100 dark:border-slate-800">
                    <button className="w-full flex items-center gap-3 px-4 py-2.5 text-sm font-bold text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors">
                      <LogOut className="w-4 h-4" />
                      Logout
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </header>
  );
}
