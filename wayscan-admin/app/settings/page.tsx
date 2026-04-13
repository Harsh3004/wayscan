'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { 
  Settings, Bell, Shield, Database, Cpu, 
  ChevronRight, LayoutGrid, Save, Sliders, Globe
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useLanguage } from '@/components/providers/language-provider';

export default function SettingsPage() {
  const { t } = useLanguage();

  return (
    <div className="space-y-8 pb-10">
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

        <button className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-2xl font-bold text-sm shadow-xl shadow-blue-200 dark:shadow-blue-900/20 hover:bg-blue-700 transition-all">
          <Save className="w-4 h-4" /> {t('settings.save_changes')}
        </button>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        {/* AI & Logic Settings */}
        <div className="xl:col-span-2 space-y-6">
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

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
               <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest ml-1">{t('settings.ai.radius_label')}</label>
                  <input type="number" defaultValue={5} className="w-full h-12 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 text-sm font-black text-slate-700 dark:text-slate-200 focus:ring-2 focus:ring-blue-500/20 outline-none" />
                  <p className="text-[10px] text-slate-400 dark:text-slate-500 ml-1 font-medium">{t('settings.ai.radius_desc')}</p>
               </div>
               <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest ml-1">{t('settings.ai.confidence_label')}</label>
                  <input type="text" defaultValue="0.75" className="w-full h-12 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 text-sm font-black text-slate-700 dark:text-slate-200 focus:ring-2 focus:ring-blue-500/20 outline-none" />
                  <p className="text-[10px] text-slate-400 dark:text-slate-500 ml-1 font-medium">{t('settings.ai.confidence_desc')}</p>
               </div>
            </div>
          </section>

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

            <div className="space-y-4">
               {[
                 { label: t('settings.alerts.high_priority'), enabled: true },
                 { label: t('settings.alerts.low_battery'), enabled: true },
                 { label: t('settings.alerts.weekly_summary'), enabled: false },
                 { label: t('settings.alerts.urgent_dispatch'), enabled: true },
               ].map((item, i) => (
                 <div key={i} className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-800">
                    <span className="text-sm font-bold text-slate-700 dark:text-slate-300">{item.label}</span>
                    <button className={cn(
                      "w-12 h-6 rounded-full transition-all relative p-1",
                      item.enabled ? "bg-blue-600 dark:bg-blue-500" : "bg-slate-300 dark:bg-slate-600"
                    )}>
                       <div className={cn(
                         "w-4 h-4 bg-white rounded-full transition-all",
                         item.enabled ? "translate-x-6" : "translate-x-0"
                       )} />
                    </button>
                 </div>
               ))}
            </div>
          </section>
        </div>

        {/* Region & Security Settings */}
        <div className="space-y-6">
           <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[2.5rem] p-8 shadow-sm">
             <div className="flex items-center gap-3 mb-8">
                <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                   <Globe className="w-5 h-5" />
                </div>
                <div>
                   <h3 className="text-lg font-black text-slate-800 dark:text-slate-100">{t('settings.regions.title')}</h3>
                   <p className="text-xs font-bold text-slate-400 dark:text-slate-500">{t('settings.regions.subtitle')}</p>
                </div>
             </div>
             
             <div className="space-y-4">
                <div className="text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest border-b border-slate-50 dark:border-slate-800 pb-2">{t('settings.regions.primary')}</div>
                {['Mumbai Metropolitan', 'National Capital Territory', 'Jabalpur Division', 'Lucknow Junction'].map((city, i) => (
                  <div key={i} className="flex items-center gap-3 text-sm font-bold text-slate-600 dark:text-slate-300">
                     <div className="w-2 h-2 rounded-full bg-blue-600 dark:bg-blue-500" /> {t(`data.cities.${city}`)}
                  </div>
                ))}
                <button className="text-xs font-black text-blue-600 dark:text-blue-400 uppercase tracking-widest mt-4 hover:underline transition-all">{t('settings.regions.add_region')}</button>
             </div>
           </section>

           <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[2.5rem] p-8 shadow-sm">
             <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl bg-purple-50 dark:bg-purple-950/30 text-purple-600 dark:text-purple-400 flex items-center justify-center">
                   <Shield className="w-5 h-5" />
                </div>
                <div>
                   <h3 className="text-lg font-black text-slate-800 dark:text-slate-100">{t('settings.security.title')}</h3>
                </div>
             </div>
             
             <div className="space-y-3">
                <button className="w-full p-4 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-2xl border border-slate-200 dark:border-slate-700 text-left transition-all">
                   <div className="text-xs font-bold text-slate-800 dark:text-slate-200">{t('settings.security.api_key')}</div>
                   <div className="text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase mt-0.5">{t('settings.security.api_key_desc')}</div>
                </button>
                <button className="w-full p-4 bg-red-50 dark:bg-red-950/30 hover:bg-red-100 dark:hover:bg-red-900/40 rounded-2xl border border-red-100 dark:border-red-900/50 text-left transition-all group">
                   <div className="text-xs font-bold text-red-600 dark:text-red-400 group-hover:text-red-700 dark:group-hover:text-red-300">{t('settings.security.purge_cache')}</div>
                   <div className="text-[10px] text-red-400 dark:text-red-500 font-bold uppercase mt-0.5">{t('settings.security.purge_cache_desc')}</div>
                </button>
             </div>
           </section>
        </div>
      </div>
    </div>
  );
}
