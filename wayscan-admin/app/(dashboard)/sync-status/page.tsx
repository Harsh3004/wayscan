'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  RefreshCw, Smartphone, Signal, SignalLow, SignalHigh,
  Clock, LayoutGrid, ChevronRight, Zap, Battery, BatteryLow, BatteryMedium
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useLanguage } from '@/components/providers/language-provider';

const initialDevices = [
  { id: 'WS-782', reports: 12, city: 'Jabalpur', lastSync: '2024-04-13T08:00:00Z', signal: 'low', battery: 84 },
  { id: 'WS-105', reports: 5, city: 'Lucknow', lastSync: '2024-04-13T09:45:00Z', signal: 'high', battery: 92 },
  { id: 'WS-992', reports: 8, city: 'Mumbai', lastSync: '2024-04-13T06:00:00Z', signal: 'none', battery: 45 },
  { id: 'WS-441', reports: 2, city: 'Delhi', lastSync: '2024-04-13T09:58:00Z', signal: 'high', battery: 98 },
];

function timeAgo(dateString: string): string {
  const diff = Math.floor((Date.now() - new Date(dateString).getTime()) / 1000);
  if (diff < 60) return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

function SignalIcon({ level }: { level: string }) {
  if (level === 'high') return <SignalHigh className="w-4 h-4 text-emerald-500" />;
  if (level === 'low') return <SignalLow className="w-4 h-4 text-orange-400" />;
  return <Signal className="w-4 h-4 text-red-400" />;
}

function BatteryIcon({ level }: { level: number }) {
  if (level > 70) return <Battery className="w-4 h-4 text-emerald-500" />;
  if (level > 30) return <BatteryMedium className="w-4 h-4 text-orange-400" />;
  return <BatteryLow className="w-4 h-4 text-red-400" />;
}

export default function SyncStatusPage() {
  const { t } = useLanguage();
  const [devices, setDevices] = useState(initialDevices);
  const [syncing, setSyncing] = useState<string | null>(null);

  const handleSync = (id: string) => {
    setSyncing(id);
    setTimeout(() => {
      setDevices(prev => prev.map(d => d.id === id
        ? { ...d, reports: 0, lastSync: new Date().toISOString(), signal: 'high' }
        : d
      ));
      setSyncing(null);
    }, 1800);
  };

  const totalQueue = devices.reduce((a, d) => a + d.reports, 0);
  const healthPct = Math.round((1 - totalQueue / 50) * 100);

  return (
    <div className="space-y-8 pb-10">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
          <div className="flex items-center gap-2 text-blue-600 dark:text-blue-500 text-xs font-black uppercase tracking-widest mb-1.5">
            <LayoutGrid className="w-3 h-3" /> {t('nav.dashboard')}
            <ChevronRight className="w-3 h-3 text-slate-300 dark:text-slate-600" />
            <span className="text-slate-400 dark:text-slate-500">{t('nav.sync_status')}</span>
          </div>
          <h1 className="text-4xl font-black text-slate-800 dark:text-slate-100 tracking-tight">{t('sync.title')}</h1>
          <p className="text-slate-500 dark:text-slate-400 font-medium mt-1">{t('sync.subtitle')}</p>
        </motion.div>

        <div className="flex items-center gap-3">
          <div className="px-4 py-2 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-100 dark:border-emerald-900/50 rounded-2xl flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-xs font-black text-emerald-700 dark:text-emerald-400 uppercase tracking-widest">{t('sync.network_online')}</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Sync Health Card */}
        <div className="lg:col-span-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[2.5rem] p-8 shadow-sm flex flex-col items-center justify-center text-center">
          <div className="relative mb-6">
            <svg className="w-32 h-32 transform -rotate-90" viewBox="0 0 128 128">
              <circle cx="64" cy="64" r="56" stroke="currentColor" strokeWidth="8" fill="transparent" className="text-slate-100 dark:text-slate-800" />
              <circle
                cx="64" cy="64" r="56" stroke="currentColor" strokeWidth="8" fill="transparent"
                className="text-blue-500"
                strokeDasharray={351.9}
                strokeDashoffset={351.9 * (1 - healthPct / 100)}
                strokeLinecap="round"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-2xl font-black text-slate-800 dark:text-slate-100">{healthPct}%</span>
              <span className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase">{t('sync.health_card.health')}</span>
            </div>
          </div>
          <h3 className="font-black text-slate-800 dark:text-slate-100 mb-1">{t('sync.health_card.queue_integrity')}</h3>
          <p className="text-xs font-medium text-slate-500 dark:text-slate-400">{totalQueue} {t('sync.health_card.items_waiting')}</p>
          <button
            onClick={() => devices.forEach(d => handleSync(d.id))}
            className="mt-6 w-full py-2.5 bg-blue-600 text-white rounded-xl font-bold text-xs uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-blue-700 transition-colors shadow-lg shadow-blue-200 dark:shadow-blue-900/20"
          >
            <RefreshCw className="w-3.5 h-3.5" /> {t('sync.health_card.force_sync')}
          </button>
        </div>

        {/* Device Table */}
        <div className="lg:col-span-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[2.5rem] shadow-sm overflow-hidden flex flex-col">
          <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <h3 className="font-black text-slate-800 dark:text-slate-100 flex items-center gap-2">
              <Smartphone className="w-5 h-5 text-slate-400" /> {t('sync.devices.title')}
            </h3>
            <span className="bg-slate-50 dark:bg-slate-800 text-slate-500 dark:text-slate-400 text-[10px] font-black px-3 py-1 rounded-full border border-slate-200 dark:border-slate-700">
              {devices.length} {t('sync.devices.connected')}
            </span>
          </div>
          <div className="flex-1 overflow-y-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-50/50 dark:bg-slate-800/50">
                  <th className="p-4 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase">{t('sync.devices.headers.device_id')}</th>
                  <th className="p-4 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase">{t('sync.devices.headers.current_zone')}</th>
                  <th className="p-4 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase">Last Sync</th>
                  <th className="p-4 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase">{t('sync.devices.headers.signal')}</th>
                  <th className="p-4 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase">Battery</th>
                  <th className="p-4 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase">{t('sync.devices.headers.queue')}</th>
                  <th className="p-4 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase text-right">{t('sync.devices.headers.actions')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50">
                {devices.map(device => (
                  <tr key={device.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/30 transition-colors">
                    <td className="p-4 font-black text-blue-600 dark:text-blue-500">{device.id}</td>
                    <td className="p-4 font-bold text-slate-600 dark:text-slate-300">{t(`data.cities.${device.city}`)}</td>
                    <td className="p-4">
                      <div className="flex items-center gap-1.5 text-xs font-bold text-slate-500 dark:text-slate-400">
                        <Clock className="w-3.5 h-3.5 text-slate-400" />
                        {timeAgo(device.lastSync)}
                      </div>
                    </td>
                    <td className="p-4"><SignalIcon level={syncing === device.id ? 'high' : device.signal} /></td>
                    <td className="p-4">
                      <div className="flex items-center gap-1.5">
                        <BatteryIcon level={device.battery} />
                        <span className="text-xs font-bold text-slate-500 dark:text-slate-400">{device.battery}%</span>
                      </div>
                    </td>
                    <td className="p-4">
                      <span className="font-black text-slate-800 dark:text-slate-200">{syncing === device.id ? 0 : device.reports}</span>
                      <span className="text-[10px] font-bold text-slate-400 uppercase ml-1.5">{t('sync.devices.reports')}</span>
                    </td>
                    <td className="p-4 text-right">
                      <button
                        onClick={() => handleSync(device.id)}
                        disabled={syncing === device.id}
                        className="px-3 py-1.5 bg-blue-50 dark:bg-blue-950/30 hover:bg-blue-100 dark:hover:bg-blue-900/40 text-blue-600 dark:text-blue-400 text-[10px] font-black rounded-lg transition-colors border border-blue-100 dark:border-blue-900/50 disabled:opacity-50 flex items-center gap-1.5"
                      >
                        <RefreshCw className={cn("w-3 h-3", syncing === device.id && "animate-spin")} />
                        {syncing === device.id ? 'Syncing…' : t('sync.devices.sync_now')}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
