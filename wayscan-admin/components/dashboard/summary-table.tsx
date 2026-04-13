'use client';

import React from 'react';
import { PotholeCluster } from '@/lib/types';
import { cn, formatDate } from '@/lib/utils';
import { useLanguage } from '@/components/providers/language-provider';
import { MapPin, Users, Calendar, ArrowRight, ExternalLink } from 'lucide-react';

interface SummaryTableProps {
  data: PotholeCluster[];
  selectedId: string | null;
  onSelect: (pothole: PotholeCluster) => void;
}

export default function SummaryTable({ data, selectedId, onSelect }: SummaryTableProps) {
  const { t } = useLanguage();
  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl overflow-hidden shadow-sm h-full flex flex-col">
      <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
            <Users className="w-4 h-4" />
          </div>
          <h3 className="font-bold text-slate-800 dark:text-slate-100">{t('dashboard.table.title')}</h3>
        </div>
        <span className="text-[10px] font-black text-slate-400 uppercase bg-slate-50 dark:bg-slate-800 px-2 py-1 rounded-md border border-slate-100 dark:border-slate-700">
          {t('dashboard.table.showing_reports', { count: data.length })}
        </span>
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar">
        <div className="min-w-full">
          {data.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 px-6 text-center">
              <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4 border border-slate-100">
                <MapPin className="text-slate-200 w-8 h-8" />
              </div>
              <p className="font-bold text-slate-400 dark:text-slate-500">{t('dashboard.table.no_reports')}</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-50 dark:divide-slate-800/50">
              {data.map((item) => (
                <button
                  key={item.id}
                  onClick={() => onSelect(item)}
                  className={cn(
                    "w-full flex items-start text-left p-4 transition-all hover:bg-slate-50 dark:hover:bg-slate-800/50 group border-l-4",
                    selectedId === item.id 
                      ? "bg-blue-50/50 dark:bg-blue-900/20 border-blue-500" 
                      : "border-transparent"
                  )}
                >
                  <div className="flex-1 min-w-0 pr-4">
                    <div className="flex items-center gap-2 mb-1.5">
                      <span className={cn(
                        "text-[9px] font-black uppercase tracking-tighter px-1.5 py-0.5 rounded",
                        item.priority === 'high' ? "bg-red-100 text-red-600" :
                        item.priority === 'medium' ? "bg-orange-100 text-orange-600" :
                        "bg-emerald-100 text-emerald-600"
                      )}>
                        {t(`dashboard.modal.priority.${item.priority}`)}
                      </span>
                      <span className={cn(
                        "text-[9px] font-bold text-slate-400 flex items-center gap-1"
                      )}>
                        <Calendar className="w-2.5 h-2.5" />
                        {formatDate(item.firstDetected)}
                      </span>
                    </div>
                    
                    <h4 className="font-bold text-slate-800 dark:text-slate-200 text-sm truncate mb-1">
                      {t(`data.locations.${item.locationName}`)}
                    </h4>
                    
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-500">
                        <Users className="w-3.5 h-3.5 text-slate-400" />
                        {item.uniqueVehicleCount} <span className="text-[10px] font-medium text-slate-400">vehicles</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 capitalize">
                        <div className={cn(
                          "w-2 h-2 rounded-full",
                          item.status === 'repaired' ? "bg-emerald-500" :
                          item.status === 'in-progress' ? "bg-blue-500" : "bg-orange-500"
                        )} />
                        {t(`dashboard.modal.status.${item.status.replace('-', '_')}`)}
                      </div>
                    </div>
                  </div>
                  
                  <div className="w-8 h-8 rounded-full border border-slate-100 dark:border-slate-700 flex items-center justify-center text-slate-300 dark:text-slate-600 group-hover:bg-white dark:group-hover:bg-slate-800 group-hover:text-blue-500 group-hover:border-blue-100 dark:group-hover:border-blue-900/50 transition-all">
                    <ArrowRight className="w-4 h-4" />
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {data.length > 0 && (
        <div className="p-3 border-t border-slate-100 dark:border-slate-800">
           <button className="w-full py-2.5 bg-slate-50 dark:bg-slate-800/80 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest transition-colors flex items-center justify-center gap-2">
             {t('dashboard.table.view_full_report')} <ExternalLink className="w-3 h-3" />
           </button>
        </div>
      )}
    </div>
  );
}
