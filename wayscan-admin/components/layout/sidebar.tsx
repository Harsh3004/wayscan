'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  LayoutDashboard, 
  Map as MapIcon, 
  FileText, 
  Wrench, 
  BarChart3, 
  RefreshCw, 
  Users, 
  Settings,
  ChevronLeft,
  ChevronRight,
  LogOut,
  MapPin
} from 'lucide-react';
import { motion } from 'framer-motion';
import { useLanguage } from '@/components/providers/language-provider';
import { cn } from '@/lib/utils';

const navItems = [
  { key: 'dashboard', defaultName: 'Overview', href: '/', icon: LayoutDashboard },
  { key: 'live_map', defaultName: 'Heatmap', href: '/heatmap', icon: MapIcon },
  { key: 'reports', defaultName: 'Reports', href: '/reports', icon: FileText },
  { key: 'work_orders', defaultName: 'Work Orders', href: '/work-orders', icon: Wrench },
  { key: 'analytics', defaultName: 'Analytics', href: '/analytics', icon: BarChart3 },
  { key: 'sync_status', defaultName: 'Sync Status', href: '/sync-status', icon: RefreshCw, badge: 23 },
  { key: 'user_management', defaultName: 'User Management', href: '/users', icon: Users },
  { key: 'settings', defaultName: 'Settings', href: '/settings', icon: Settings },
];

export default function Sidebar() {
  const { t } = useLanguage();
  const [collapsed, setCollapsed] = useState(false);
  const pathname = usePathname();

  return (
    <motion.aside
      initial={false}
      animate={{ width: collapsed ? 80 : 280 }}
      className="relative flex flex-col h-full bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 shadow-sm z-30"
    >
      {/* Logo Section */}
      <div className="flex h-20 items-center px-6 border-b border-slate-100 dark:border-slate-800">
        <div className="flex items-center gap-3 overflow-hidden">
          <div className="flex-shrink-0 w-10 h-10 bg-blue-600 dark:bg-blue-500 rounded-xl flex items-center justify-center shadow-lg shadow-blue-200 dark:shadow-none">
            <MapPin className="text-white w-6 h-6" />
          </div>
          {!collapsed && (
            <motion.span
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-xl font-bold tracking-tight text-slate-800 dark:text-slate-100"
            >
              Way<span className="text-blue-600 dark:text-blue-400">Scan</span>
            </motion.span>
          )}
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-6 px-3 space-y-1 custom-scrollbar">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "group flex items-center gap-3 px-3 py-3 rounded-xl transition-all duration-200 relative",
                isActive 
                  ? "bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 font-semibold shadow-sm dark:shadow-none" 
                  : "text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50 hover:text-slate-800 dark:hover:text-slate-200"
              )}
            >
              <item.icon className={cn(
                "w-5 h-5 transition-transform group-hover:scale-110",
                isActive ? "text-blue-600 dark:text-blue-400" : "text-slate-400 dark:text-slate-500"
              )} />
              
              {!collapsed && (
                <motion.span
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="whitespace-nowrap flex-1"
                >
                  {t(`nav.${item.key}`, undefined)}
                  {/* Fallback handled in provider if missing, but we'll ensure they exist */}
                </motion.span>
              )}

              {item.badge && item.badge > 0 && (
                <span className={cn(
                  "flex items-center justify-center rounded-full bg-orange-500 dark:bg-orange-600 text-white text-[10px] font-bold leading-none px-1.5 py-1",
                  collapsed ? "absolute -top-1 -right-1" : "ml-auto"
                )}>
                  {item.badge}
                </span>
              )}

              {isActive && (
                <motion.div
                  layoutId="active-indicator"
                  className="absolute left-0 w-1 h-6 bg-blue-600 dark:bg-blue-500 rounded-r-full"
                />
              )}
            </Link>
          );
        })}
      </nav>

      {/* Footer / Profile */}
      <div className="p-4 border-t border-slate-100 dark:border-slate-800">
        {!collapsed && (
          <div className="bg-slate-50 dark:bg-slate-800/50 rounded-2xl p-3 mb-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-slate-200 dark:bg-slate-700 border-2 border-white dark:border-slate-800 shadow-sm overflow-hidden flex items-center justify-center text-slate-500 dark:text-slate-400 font-bold">
              AD
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate">{t('nav.admin_user')}</p>
              <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate">admin@wayscan.gov.in</p>
            </div>
          </div>
        )}
        
        <button className={cn(
          "w-full flex items-center gap-3 px-3 py-3 rounded-xl text-slate-500 dark:text-slate-400 hover:bg-red-50 dark:hover:bg-red-950/30 hover:text-red-600 dark:hover:text-red-400 transition-colors",
          collapsed && "justify-center"
        )}>
          <LogOut className="w-5 h-5" />
          {!collapsed && <span className="text-sm font-semibold">Logout</span>}
        </button>
      </div>

      {/* Collapse Toggle */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="absolute -right-3 top-24 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-full p-1 shadow-md dark:shadow-none hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-400 dark:text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 z-50 transition-colors"
      >
        {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
      </button>
    </motion.aside>
  );
}
