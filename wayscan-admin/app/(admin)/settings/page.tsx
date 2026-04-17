'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Settings, Bell, Shield, Cpu,
  ChevronRight, LayoutGrid, Save, Globe, Plus, X, MapPin, Trash2
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useLanguage } from '@/components/providers/language-provider';
import { ZONES, STATE_CITY_MAP } from '@/lib/mock-data';

const INITIAL_ALERT_SETTINGS = [
  { key: 'high_priority', label: 'High priority detected', enabled: true },
  { key: 'low_battery', label: 'Device battery < 20%', enabled: true },
  { key: 'weekly_summary', label: 'Weekly digest email', enabled: false },
  { key: 'urgent_dispatch', label: 'Urgent dispatch required', enabled: true },
  { key: 'unresolved_7d', label: 'Unresolved for 7+ days', enabled: true },
  { key: 'queue_overflow', label: 'Queue crosses 50 reports', enabled: false },
];

export default function SettingsPage() {
  const { t } = useLanguage();
  const [alertSettings, setAlertSettings] = useState(INITIAL_ALERT_SETTINGS);
  const [clusterRadius, setClusterRadius] = useState('5');
  const [confidence, setConfidence] = useState('0.75');
  const [saved, setSaved] = useState(false);

  // Zone management
  const [zones, setZones] = useState(ZONES);
  const [newZone, setNewZone] = useState('');

  // City management
  const [cityMap, setCityMap] = useState(STATE_CITY_MAP);
  const [selectedState, setSelectedState] = useState(Object.keys(STATE_CITY_MAP)[0]);
  const [newCity, setNewCity] = useState('');

  const toggleAlert = (key: string) => {
    setAlertSettings(prev => prev.map(a => a.key === key ? { ...a, enabled: !a.enabled } : a));
  };

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const addZone = () => {
    if (!newZone.trim() || zones.includes(newZone.trim())) return;
    setZones(prev => [...prev, newZone.trim()]);
    setNewZone('');
  };

  const removeZone = (zone: string) => setZones(prev => prev.filter(z => z !== zone));

  const addCity = () => {
    if (!newCity.trim()) return;
    setCityMap(prev => ({
      ...prev,
      [selectedState]: prev[selectedState].includes(newCity.trim())
        ? prev[selectedState]
        : [...prev[selectedState], newCity.trim()],
    }));
    setNewCity('');
  };

  const removeCity = (state: string, city: string) => {
    setCityMap(prev => ({ ...prev, [state]: prev[state].filter(c => c !== city) }));
  };

  return (
    <div className="space-y-8 pb-10">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
          <div className="flex items-center gap-2 text-blue-600 dark:text-blue-500 text-xs font-black uppercase tracking-widest mb-1.5">
            <LayoutGrid className="w-3 h-3" /> {t('nav.dashboard')}
            <ChevronRight className="w-3 h-3 text-slate-300 dark:text-slate-600" />
            <span className="text-slate-400 dark:text-slate-500">{t('nav.settings')}</span>
          </div>
          <h1 className="text-4xl font-black text-slate-800 dark:text-slate-100 tracking-tight">{t('settings.title')}</h1>
          <p className="text-slate-500 dark:text-slate-400 font-medium mt-1">{t('settings.subtitle')}</p>
        </motion.div>

        <button
          onClick={handleSave}
          className={cn(
            "flex items-center gap-2 px-6 py-3 rounded-2xl font-bold text-sm shadow-xl transition-all",
            saved
              ? "bg-emerald-600 text-white shadow-emerald-200 dark:shadow-emerald-900/20"
              : "bg-blue-600 text-white shadow-blue-200 dark:shadow-blue-900/20 hover:bg-blue-700"
          )}
        >
          <Save className="w-4 h-4" /> {saved ? 'Saved!' : t('settings.save_changes')}
        </button>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        {/* Left Column */}
        <div className="xl:col-span-2 space-y-6">

          {/* AI Settings */}
          <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[2.5rem] p-8 shadow-sm">
            <div className="flex items-center gap-3 mb-8">
              <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                <Cpu className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-black text-slate-800 dark:text-slate-100">{t('settings.ai.title')}</h3>
                <p className="text-xs font-bold text-slate-400 dark:text-slate-500">{t('settings.ai.subtitle')}</p>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">{t('settings.ai.radius_label')}</label>
                <input
                  type="number"
                  value={clusterRadius}
                  onChange={e => setClusterRadius(e.target.value)}
                  className="w-full h-12 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 text-sm font-black text-slate-700 dark:text-slate-200 focus:ring-2 focus:ring-blue-500/20 outline-none"
                />
                <p className="text-[10px] text-slate-400 dark:text-slate-500 font-medium">{t('settings.ai.radius_desc')}</p>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">{t('settings.ai.confidence_label')}</label>
                <input
                  type="text"
                  value={confidence}
                  onChange={e => setConfidence(e.target.value)}
                  className="w-full h-12 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 text-sm font-black text-slate-700 dark:text-slate-200 focus:ring-2 focus:ring-blue-500/20 outline-none"
                />
                <p className="text-[10px] text-slate-400 dark:text-slate-500 font-medium">{t('settings.ai.confidence_desc')}</p>
              </div>
            </div>
          </section>

          {/* Alert Toggles */}
          <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[2.5rem] p-8 shadow-sm">
            <div className="flex items-center gap-3 mb-8">
              <div className="w-10 h-10 rounded-xl bg-orange-50 dark:bg-orange-950/30 text-orange-600 dark:text-orange-400 flex items-center justify-center">
                <Bell className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-black text-slate-800 dark:text-slate-100">{t('settings.alerts.title')}</h3>
                <p className="text-xs font-bold text-slate-400 dark:text-slate-500">{t('settings.alerts.subtitle')}</p>
              </div>
            </div>
            <div className="space-y-3">
              {alertSettings.map(item => (
                <div key={item.key} className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-800">
                  <div>
                    <span className="text-sm font-bold text-slate-700 dark:text-slate-300">
  {t(`settings.alerts.${item.key}`) || item.label}
</span>
                  </div>
                  <button
                    onClick={() => toggleAlert(item.key)}
                    className={cn(
                      "w-12 h-6 rounded-full transition-all relative p-1 focus:outline-none",
                      item.enabled ? "bg-blue-600 dark:bg-blue-500" : "bg-slate-300 dark:bg-slate-600"
                    )}
                  >
                    <div className={cn(
                      "w-4 h-4 bg-white rounded-full shadow-sm transition-all duration-300",
                      item.enabled ? "translate-x-6" : "translate-x-0"
                    )} />
                  </button>
                </div>
              ))}
            </div>
          </section>

          {/* City Management */}
          <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[2.5rem] p-8 shadow-sm">
            <div className="flex items-center gap-3 mb-8">
              <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                <MapPin className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-black text-slate-800 dark:text-slate-100">City Management</h3>
                <p className="text-xs font-bold text-slate-400 dark:text-slate-500">Add or remove cities per state</p>
              </div>
            </div>

            {/* State Tabs */}
            <div className="flex flex-wrap gap-2 mb-5">
              {Object.keys(cityMap).map(state => (
                <button
                  key={state}
                  onClick={() => setSelectedState(state)}
                  className={cn(
                    "px-3 py-1.5 rounded-xl text-xs font-black transition-all border",
                    selectedState === state
                      ? "bg-blue-600 border-blue-600 text-white"
                      : "bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700"
                  )}
                >
                  {state}
                </button>
              ))}
            </div>

            {/* City Tags */}
            <div className="flex flex-wrap gap-2 mb-4 min-h-[40px]">
              {cityMap[selectedState]?.map(city => (
                <div key={city} className="flex items-center gap-1.5 bg-blue-50 dark:bg-blue-950/30 border border-blue-100 dark:border-blue-900/50 text-blue-700 dark:text-blue-400 px-3 py-1 rounded-xl text-xs font-bold">
                  {city}
                  <button onClick={() => removeCity(selectedState, city)} className="text-blue-400 hover:text-red-500 transition-colors ml-1">
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>

            <div className="flex gap-2">
              <input
                type="text"
                value={newCity}
                onChange={e => setNewCity(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && addCity()}
                placeholder={`Add city to ${selectedState}…`}
                className="flex-1 h-10 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 text-sm font-semibold text-slate-700 dark:text-slate-200 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              />
              <button
                onClick={addCity}
                className="h-10 px-4 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl flex items-center gap-1.5 text-sm transition-colors shadow-md shadow-blue-200 dark:shadow-blue-900/20"
              >
                <Plus className="w-4 h-4" /> Add
              </button>
            </div>
          </section>
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          {/* Zone Management */}
          <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[2.5rem] p-8 shadow-sm">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                <Globe className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-black text-slate-800 dark:text-slate-100">Zone Management</h3>
                <p className="text-xs font-bold text-slate-400 dark:text-slate-500">Operational zones</p>
              </div>
            </div>

            <div className="space-y-2 mb-4 max-h-[280px] overflow-y-auto custom-scrollbar">
              {zones.map(zone => (
                <div key={zone} className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-800 group">
                  <div className="flex items-center gap-2 text-sm font-bold text-slate-700 dark:text-slate-300">
                    <div className="w-2 h-2 rounded-full bg-blue-500" />
                    {zone}
                  </div>
                  <button
                    onClick={() => removeZone(zone)}
                    className="text-slate-300 dark:text-slate-600 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>

            <div className="flex gap-2">
              <input
                type="text"
                value={newZone}
                onChange={e => setNewZone(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && addZone()}
                placeholder="New zone name…"
                className="flex-1 h-10 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 text-sm font-semibold text-slate-700 dark:text-slate-200 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              />
              <button
                onClick={addZone}
                className="h-10 w-10 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl flex items-center justify-center transition-colors"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
          </section>

          {/* Security */}
          <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[2.5rem] p-8 shadow-sm">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-purple-50 dark:bg-purple-950/30 text-purple-600 dark:text-purple-400 flex items-center justify-center">
                <Shield className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-black text-slate-800 dark:text-slate-100">{t('settings.security.title')}</h3>
            </div>
            <div className="space-y-3">
              <button className="w-full p-4 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-2xl border border-slate-200 dark:border-slate-700 text-left transition-all">
                <div className="text-xs font-bold text-slate-800 dark:text-slate-200">{t('settings.security.api_key')}</div>
                <div className="text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase mt-0.5">{t('settings.security.api_key_desc')}</div>
              </button>
              <button className="w-full p-4 bg-red-50 dark:bg-red-950/30 hover:bg-red-100 dark:hover:bg-red-900/40 rounded-2xl border border-red-100 dark:border-red-900/50 text-left transition-all group">
                <div className="text-xs font-bold text-red-600 dark:text-red-400">{t('settings.security.purge_cache')}</div>
                <div className="text-[10px] text-red-400 dark:text-red-500 font-bold uppercase mt-0.5">{t('settings.security.purge_cache_desc')}</div>
              </button>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
