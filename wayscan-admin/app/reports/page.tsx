'use client';

import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FileText, Search, Filter, Download, 
  LayoutGrid, ChevronRight, ArrowUpDown, 
  MapPin, Users, Calendar, Clock
} from 'lucide-react';
import { potholes as allPotholes } from '@/lib/mock-data';
import { PotholeCluster, Status } from '@/lib/types';
import { cn, formatDate } from '@/lib/utils';
import DetailModal from '@/components/dashboard/detail-modal';
import { useLanguage } from '@/components/providers/language-provider';

export default function ReportsPage() {
  const { t } = useLanguage();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPothole, setSelectedPothole] = useState<PotholeCluster | null>(null);
  const [data, setData] = useState(allPotholes);

  const filteredData = useMemo(() => {
    return data.filter(p => 
      p.locationName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.city.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [data, searchTerm]);

  const handleStatusChange = (id: string, newStatus: Status) => {
    setData(prev => prev.map(p => p.id === id ? { ...p, status: newStatus } : p));
    if (selectedPothole?.id === id) {
      setSelectedPothole(prev => prev ? { ...prev, status: newStatus } : null);
    }
  };

  return (
    <div className="space-y-8 pb-10">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
          <div className="flex items-center gap-2 text-blue-600 dark:text-blue-500 text-xs font-black uppercase tracking-widest mb-1.5">
            <LayoutGrid className="w-3 h-3" /> {t('nav.dashboard')}
            <ChevronRight className="w-3 h-3 text-slate-300 dark:text-slate-600" />
            <span className="text-slate-400 dark:text-slate-500">{t('nav.reports')}</span>
          </div>
          <h1 className="text-4xl font-black text-slate-800 dark:text-slate-100 tracking-tight">{t('reports.title')}</h1>
          <p className="text-slate-500 dark:text-slate-400 font-medium mt-1">{t('reports.subtitle')}</p>
        </motion.div>

        <button className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-2xl font-bold text-sm shadow-xl shadow-blue-200 dark:shadow-blue-900/20 hover:bg-blue-700 transition-all">
          <Download className="w-4 h-4" /> {t('reports.export_csv')}
        </button>
      </div>

      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[2.5rem] shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-4">
           <div className="relative flex-1 max-w-sm">
             <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 dark:text-slate-500" />
             <input 
               type="text" 
               placeholder={t('reports.search_placeholder')} 
               value={searchTerm}
               onChange={(e) => setSearchTerm(e.target.value)}
               className="w-full h-11 pl-10 pr-4 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/50 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-slate-800 dark:text-slate-100 dark:placeholder-slate-500" 
             />
           </div>
           <div className="flex items-center gap-3">
              <button className="flex items-center gap-2 px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold text-xs hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors">
                <Filter className="w-3.5 h-3.5" /> {t('reports.filters')}
              </button>
              <div className="w-px h-6 bg-slate-100 dark:bg-slate-800 mx-2" />
              <button className="flex items-center gap-2 text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                <ArrowUpDown className="w-4 h-4" /> {t('reports.sort_newest')}
              </button>
           </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50/50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800">
                <th className="p-5 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">{t('reports.table.id')}</th>
                <th className="p-5 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">{t('reports.table.location_info')}</th>
                <th className="p-5 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">{t('reports.table.priority')}</th>
                <th className="p-5 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">{t('reports.table.vehicle_count')}</th>
                <th className="p-5 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">{t('reports.table.status')}</th>
                <th className="p-5 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest text-right">{t('reports.table.activity')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 dark:divide-slate-800/50">
              {filteredData.map((pothole) => (
                <tr key={pothole.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors group">
                  <td className="p-5">
                    <span className="text-xs font-black text-slate-300 dark:text-slate-600">#{pothole.id.slice(0, 5)}</span>
                  </td>
                  <td className="p-5">
                    <div className="flex items-center gap-3">
                       <div className="w-10 h-10 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 flex items-center justify-center text-slate-400 dark:text-slate-500 group-hover:bg-white dark:group-hover:bg-slate-700 group-hover:text-blue-500 dark:group-hover:text-blue-400 group-hover:border-blue-200 dark:group-hover:border-blue-800 transition-colors">
                          <MapPin className="w-5 h-5" />
                       </div>
                       <div>
                          <div className="text-sm font-black text-slate-800 dark:text-slate-200">{t(`data.locations.${pothole.locationName}`)}</div>
                          <div className="text-[10px] font-bold text-slate-400 dark:text-slate-500 flex items-center gap-1 uppercase tracking-tight">
                            {t(`data.cities.${pothole.city}`)}, {pothole.state} • <span className="text-blue-500/70 dark:text-blue-400/80">{t(`data.areas.${pothole.areaType}`)}</span>
                          </div>
                       </div>
                    </div>
                  </td>
                  <td className="p-5">
                    <span className={cn(
                      "text-[9px] font-black uppercase tracking-tighter px-2 py-0.5 rounded border",
                      pothole.priority === 'high' ? "bg-red-50 dark:bg-red-950/30 text-red-600 dark:text-red-400 border-red-100 dark:border-red-900/50" :
                      pothole.priority === 'medium' ? "bg-orange-50 dark:bg-orange-950/30 text-orange-600 dark:text-orange-400 border-orange-100 dark:border-orange-900/50" :
                      "bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400 border-emerald-100 dark:border-emerald-900/50"
                    )}>
                      {t(`dashboard.modal.priority.${pothole.priority}`)}
                    </span>
                  </td>
                  <td className="p-5">
                    <div className="flex items-center gap-2">
                       <div className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                       <span className="text-sm font-black text-slate-700 dark:text-slate-300">{pothole.uniqueVehicleCount}</span>
                       <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase">{t('reports.table.vehicles')}</span>
                    </div>
                  </td>
                  <td className="p-5">
                    <div className="flex items-center gap-2 text-xs font-bold text-slate-600 dark:text-slate-400 capitalize">
                      <div className={cn(
                        "w-2 h-2 rounded-full",
                        pothole.status === 'repaired' ? "bg-emerald-500" :
                        pothole.status === 'in-progress' ? "bg-blue-500" : "bg-orange-500"
                      )} />
                      {t(`dashboard.modal.status.${pothole.status.replace('-', '_')}`)}
                    </div>
                  </td>
                  <td className="p-5 text-right">
                    <button 
                      onClick={() => setSelectedPothole(pothole)}
                      className="text-xs font-black text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 uppercase tracking-widest px-4 py-2 bg-blue-50 dark:bg-blue-900/30 hover:bg-blue-100 dark:hover:bg-blue-800/40 rounded-lg transition-all"
                    >
                      {t('reports.table.inspect')}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <AnimatePresence>
        {selectedPothole && (
          <DetailModal 
            pothole={selectedPothole} 
            onClose={() => setSelectedPothole(null)}
            onStatusChange={handleStatusChange}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
