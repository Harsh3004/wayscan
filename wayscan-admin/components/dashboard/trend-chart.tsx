'use client';

import React from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell
} from 'recharts';
import { motion } from 'framer-motion';
import { BarChart3, ArrowUpRight, TrendingUp } from 'lucide-react';
import { useLanguage } from '@/components/providers/language-provider';

const data = [
  { name: 'Week 1', detected: 45, repaired: 32 },
  { name: 'Week 2', detected: 52, repaired: 41 },
  { name: 'Week 3', detected: 38, repaired: 44 },
  { name: 'Week 4', detected: 65, repaired: 52 },
  { name: 'Week 5', detected: 48, repaired: 58 },
  { name: 'Week 6', detected: 58, repaired: 49 },
  { name: 'Week 7', detected: 72, repaired: 61 },
  { name: 'Week 8', detected: 60, repaired: 68 },
];

export default function TrendChart() {
  const { t } = useLanguage();
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[2rem] p-8 shadow-sm"
    >
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <div className="flex items-center gap-2 mb-1">
             <div className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                <BarChart3 className="w-4 h-4" />
             </div>
             <h3 className="text-xl font-black text-slate-800 dark:text-slate-100">{t('dashboard.chart.title')}</h3>
          </div>
          <p className="text-sm font-semibold text-slate-400 dark:text-slate-500">{t('dashboard.chart.subtitle')}</p>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="px-4 py-2 bg-slate-50 dark:bg-slate-800/80 border border-slate-100 dark:border-slate-700/50 rounded-xl">
             <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Efficiency Rate</div>
             <div className="text-sm font-bold text-slate-700 dark:text-slate-200 flex items-center gap-2">
                <TrendingUp className="w-3.5 h-3.5 text-emerald-500 dark:text-emerald-400" />
                84.2% <span className="text-emerald-500 dark:text-emerald-400 font-extrabold">+2.1%</span>
             </div>
          </div>
        </div>
      </div>

      <div className="h-[350px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={data}
            margin={{ top: 20, right: 30, left: 0, bottom: 0 }}
            barGap={8}
          >
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
            <XAxis 
              dataKey="name" 
              axisLine={false} 
              tickLine={false} 
              tick={{ fill: '#94a3b8', fontSize: 11, fontWeight: 700 }}
              dy={15}
            />
            <YAxis 
              axisLine={false} 
              tickLine={false} 
              tick={{ fill: '#94a3b8', fontSize: 11, fontWeight: 700 }}
              dx={-10}
            />
            <Tooltip
              contentStyle={{ 
                backgroundColor: '#fff', 
                borderRadius: '16px', 
                border: '1px solid #e2e8f0',
                boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)',
                padding: '12px'
              }}
              cursor={{ fill: '#f8fafc' }}
            />
            <Legend 
              verticalAlign="top" 
              align="right" 
              iconType="circle"
              wrapperStyle={{ paddingBottom: '30px', fontSize: '11px', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.05em' }}
            />
            <Bar 
              name={t('dashboard.chart.new_detections')} 
              dataKey="detected" 
              fill="#3b82f6" 
              radius={[6, 6, 0, 0]} 
              barSize={20}
            />
            <Bar 
              name={t('dashboard.chart.repaired_issues')} 
              dataKey="repaired" 
              fill="#10b981" 
              radius={[6, 6, 0, 0]} 
              barSize={20}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
      
      <div className="mt-8 pt-6 border-t border-slate-50 dark:border-slate-800/50 flex items-center justify-between text-xs font-bold text-slate-400">
         <div className="flex items-center gap-4">
            <div className="flex items-center gap-1.5">
               <div className="w-2 h-2 rounded-full bg-blue-500" />
               {t('dashboard.chart.ai_alert_threshold')}: 5m
            </div>
            <div className="flex items-center gap-1.5">
               <div className="w-2 h-2 rounded-full bg-emerald-500" />
               {t('dashboard.chart.target_sla')}: 72 Hours
            </div>
         </div>
         <button className="text-blue-600 hover:text-blue-700 font-black uppercase tracking-widest flex items-center gap-1">
            {t('dashboard.chart.download_report')} <ArrowUpRight className="w-3.5 h-3.5" />
         </button>
      </div>
    </motion.div>
  );
}
