'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { 
  Wrench, Truck, CheckCircle2, AlertTriangle, Clock, 
  ChevronRight, LayoutGrid, Search, Filter, Download
} from 'lucide-react';
import { potholes } from '@/lib/mock-data';
import { cn, formatDate } from '@/lib/utils';
import { useLanguage } from '@/components/providers/language-provider';

export default function WorkOrdersPage() {
  const { t } = useLanguage();
  const activeOrders = potholes.filter(p => p.status !== 'repaired');

  return (
    <div className="space-y-8 pb-10">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
          <div className="flex items-center gap-2 text-blue-600 dark:text-blue-500 text-xs font-black uppercase tracking-widest mb-1.5">
            <LayoutGrid className="w-3 h-3" /> {t('nav.dashboard')}
            <ChevronRight className="w-3 h-3 text-slate-300 dark:text-slate-600" />
            <span className="text-slate-400 dark:text-slate-500">{t('nav.work_orders')}</span>
          </div>
          <h1 className="text-4xl font-black text-slate-800 dark:text-slate-100 tracking-tight">{t('work_orders.title')}</h1>
          <p className="text-slate-500 dark:text-slate-400 font-medium mt-1">{t('work_orders.subtitle')}</p>
        </motion.div>

        <div className="flex items-center gap-2">
           <button className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-xl font-bold text-sm shadow-lg shadow-blue-200 dark:shadow-blue-900/20 hover:bg-blue-700 transition-all">
             <Download className="w-4 h-4" /> {t('work_orders.export_pdf')}
           </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
         <div className="bg-orange-50 dark:bg-orange-950/30 border border-orange-100 dark:border-orange-900/50 p-6 rounded-3xl">
            <div className="text-orange-600 dark:text-orange-400 font-black text-[10px] uppercase tracking-widest mb-1">{t('work_orders.metrics.critical')}</div>
            <div className="text-3xl font-black text-orange-700 dark:text-orange-500">{activeOrders.filter(o => o.priority === 'high').length}</div>
            <p className="text-xs font-bold text-orange-400 dark:text-orange-500/70 mt-1">{t('work_orders.metrics.critical_desc')}</p>
         </div>
         <div className="bg-blue-50 dark:bg-blue-900/30 border border-blue-100 dark:border-blue-900/50 p-6 rounded-3xl">
            <div className="text-blue-600 dark:text-blue-400 font-black text-[10px] uppercase tracking-widest mb-1">{t('work_orders.metrics.in_progress')}</div>
            <div className="text-3xl font-black text-blue-700 dark:text-blue-500">{activeOrders.filter(o => o.status === 'in-progress').length}</div>
            <p className="text-xs font-bold text-blue-400 dark:text-blue-500/70 mt-1">{t('work_orders.metrics.in_progress_desc')}</p>
         </div>
         <div className="bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-100 dark:border-emerald-900/50 p-6 rounded-3xl">
            <div className="text-emerald-600 dark:text-emerald-400 font-black text-[10px] uppercase tracking-widest mb-1">{t('work_orders.metrics.completed')}</div>
            <div className="text-3xl font-black text-emerald-700 dark:text-emerald-500">14</div>
            <p className="text-xs font-bold text-emerald-400 dark:text-emerald-500/70 mt-1">{t('work_orders.metrics.completed_desc')}</p>
         </div>
      </div>

      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[2.5rem] shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-4">
           <div className="relative flex-1 max-w-sm">
             <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 dark:text-slate-500" />
             <input type="text" placeholder={t('work_orders.search')} className="w-full h-10 pl-10 pr-4 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/50 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-slate-800 dark:text-slate-100 dark:placeholder-slate-500" />
           </div>
           <div className="flex items-center gap-2">
              <button className="p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"><Filter className="w-4 h-4" /></button>
              <div className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest ml-2">{t('work_orders.sort_date')}</div>
           </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/50 dark:bg-slate-800/50">
                <th className="p-5 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">{t('work_orders.table.location')}</th>
                <th className="p-5 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">{t('work_orders.table.priority')}</th>
                <th className="p-5 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">{t('work_orders.table.team')}</th>
                <th className="p-5 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">{t('work_orders.table.detected')}</th>
                <th className="p-5 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest text-right">{t('work_orders.table.actions')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50">
              {activeOrders.map((order) => (
                <tr key={order.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors group">
                  <td className="p-5">
                    <div className="flex items-center gap-3">
                       <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400 dark:text-slate-500 group-hover:bg-blue-50 dark:group-hover:bg-blue-900/30 group-hover:text-blue-500 dark:group-hover:text-blue-400 transition-colors">
                          <Wrench className="w-5 h-5" />
                       </div>
                       <div>
                          <div className="text-sm font-black text-slate-800 dark:text-slate-200">{t(`data.locations.${order.locationName}`)}</div>
                          <div className="text-xs font-bold text-slate-400 dark:text-slate-500">{t(`data.cities.${order.city}`)}, {order.state}</div>
                       </div>
                    </div>
                  </td>
                  <td className="p-5">
                     <span className={cn(
                       "text-[10px] font-black uppercase tracking-tighter px-2 py-0.5 rounded-full border",
                       order.priority === 'high' ? "bg-red-50 dark:bg-red-950/30 text-red-600 dark:text-red-400 border-red-100 dark:border-red-900/50" :
                       "bg-orange-50 dark:bg-orange-950/30 text-orange-600 dark:text-orange-400 border-orange-100 dark:border-orange-900/50"
                     )}>
                       {t(`dashboard.modal.priority.${order.priority}`)}
                     </span>
                  </td>
                  <td className="p-5">
                     <div className="flex items-center gap-2 text-sm font-bold text-slate-600 dark:text-slate-300">
                        <Truck className="w-4 h-4 text-slate-400 dark:text-slate-500" />
                        {order.assignedTeam || t('work_orders.table.pending')}
                     </div>
                  </td>
                  <td className="p-5">
                     <div className="text-sm font-bold text-slate-600 dark:text-slate-300">{formatDate(order.firstDetected)}</div>
                  </td>
                  <td className="p-5 text-right">
                    <button className="px-4 py-2 bg-slate-900 dark:bg-blue-600 hover:bg-slate-800 dark:hover:bg-blue-700 text-white text-xs font-black uppercase rounded-lg shadow-md transition-all">
                      {t('work_orders.table.dispatch')}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
