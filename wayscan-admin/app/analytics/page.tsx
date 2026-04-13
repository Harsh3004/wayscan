'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line
} from 'recharts';
import { 
  BarChart3, TrendingUp, MapPin, Globe, CheckCircle2, 
  ArrowUpRight, ArrowDownRight, LayoutGrid, ChevronRight
} from 'lucide-react';
import { useLanguage } from '@/components/providers/language-provider';

const cityData = [
  { name: 'Mumbai', count: 156 },
  { name: 'Delhi', count: 142 },
  { name: 'Bengaluru', count: 98 },
  { name: 'Jabalpur', count: 62 },
  { name: 'Lucknow', count: 45 },
];

const areaData = [
  { name: 'Urban', value: 72 },
  { name: 'Rural', value: 28 },
];

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];
const AREA_COLORS = ['#3b82f6', '#fbbf24'];

export default function AnalyticsPage() {
  const { t } = useLanguage();

  const metrics = [
    { label: t('analytics.metrics.repair_rate'), value: '78%', trend: '+4.2%', icon: CheckCircle2, color: 'emerald' },
    { label: t('analytics.metrics.active_reports'), value: '1,240', trend: '+12%', icon: BarChart3, color: 'blue' },
    { label: t('analytics.metrics.response_time'), value: '3.2d', trend: '-0.5d', icon: TrendingUp, color: 'purple' },
    { label: t('analytics.metrics.network_health'), value: '94%', trend: t('analytics.metrics.stable'), icon: Globe, color: 'orange' },
  ];

  return (
    <div className="space-y-8 pb-10">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
          <div className="flex items-center gap-2 text-blue-600 dark:text-blue-500 text-xs font-black uppercase tracking-widest mb-1.5">
            <LayoutGrid className="w-3 h-3" /> {t('nav.dashboard')}
            <ChevronRight className="w-3 h-3 text-slate-300 dark:text-slate-600" />
            <span className="text-slate-400 dark:text-slate-500">{t('nav.analytics')}</span>
          </div>
          <h1 className="text-4xl font-black text-slate-800 dark:text-slate-100 tracking-tight">{t('analytics.title')}</h1>
          <p className="text-slate-500 dark:text-slate-400 font-medium mt-1">{t('analytics.subtitle')}</p>
        </motion.div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* City-wise Comparison */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[2rem] p-8 shadow-sm">
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-xl font-black text-slate-800 dark:text-slate-100 flex items-center gap-2">
              <MapPin className="w-5 h-5 text-blue-500" /> {t('analytics.city_distribution')}
            </h3>
            <button className="text-xs font-black text-blue-600 dark:text-blue-500 uppercase tracking-widest hover:underline">{t('analytics.view_all_cities')}</button>
          </div>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={cityData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 11, fontWeight: 700 }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 11, fontWeight: 700 }} dx={-10} />
                <Tooltip cursor={{ fill: '#f8fafc' }} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }} />
                <Bar dataKey="count" radius={[10, 10, 0, 0]} barSize={40}>
                  {cityData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} name={t(`data.cities.${entry.name}`)} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Rural vs Urban Split */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[2rem] p-8 shadow-sm">
          <h3 className="text-xl font-black text-slate-800 dark:text-slate-100 flex items-center gap-2 mb-8">
            <Globe className="w-5 h-5 text-emerald-500" /> {t('analytics.area_split')}
          </h3>
          <div className="h-[250px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={areaData} innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                  {areaData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={AREA_COLORS[index % AREA_COLORS.length]} name={t(`data.areas.${entry.name.toLowerCase()}`)} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ borderRadius: '12px' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex items-center justify-center gap-6 mt-4">
             {areaData.map((item, i) => (
               <div key={i} className="flex items-center gap-2">
                 <div className="w-3 h-3 rounded-full" style={{ backgroundColor: AREA_COLORS[i] }} />
                 <span className="text-xs font-bold text-slate-600 dark:text-slate-300">{t(`data.areas.${item.name.toLowerCase()}`)} ({item.value}%)</span>
               </div>
             ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {metrics.map((stat, i) => (
          <div key={i} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-3xl shadow-sm">
            <div className="flex items-center justify-between mb-2">
               <stat.icon className={`w-5 h-5 text-${stat.color}-500`} />
               <span className="text-[10px] font-black text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/30 px-2 py-0.5 rounded-full">{stat.trend}</span>
            </div>
            <div className="text-2xl font-black text-slate-800 dark:text-slate-100">{stat.value}</div>
            <div className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">{stat.label}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
