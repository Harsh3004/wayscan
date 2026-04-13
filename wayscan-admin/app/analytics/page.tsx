'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line, AreaChart, Area
} from 'recharts';
import {
  BarChart3, TrendingUp, MapPin, Globe, CheckCircle2,
  ChevronRight, LayoutGrid, Trophy, Calendar, Activity
} from 'lucide-react';
import { useLanguage } from '@/components/providers/language-provider';
import { cn } from '@/lib/utils';
import { potholes } from '@/lib/mock-data';

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

const repairRateData = [
  { name: 'Repaired', value: 78 },
  { name: 'Pending', value: 22 },
];

const monthlyTrendData = [
  { month: 'Oct', reported: 180, repaired: 140, responseTime: 5.2 },
  { month: 'Nov', reported: 210, repaired: 165, responseTime: 4.9 },
  { month: 'Dec', reported: 175, repaired: 190, responseTime: 4.5 },
  { month: 'Jan', reported: 240, repaired: 200, responseTime: 4.8 },
  { month: 'Feb', reported: 195, repaired: 220, responseTime: 4.2 },
  { month: 'Mar', reported: 260, repaired: 230, responseTime: 3.8 },
  { month: 'Apr', reported: 280, repaired: 245, responseTime: 3.5 },
];

const responseTimeData = [
  { range: '<1d', count: 32 },
  { range: '1-2d', count: 58 },
  { range: '2-4d', count: 45 },
  { range: '4-7d', count: 28 },
  { range: '7-14d', count: 15 },
  { range: '>14d', count: 8 },
];

const worstRoads = [
  { rank: 1, location: 'Sion-Panvel Highway', city: 'Mumbai', count: 52, priority: 'high' },
  { rank: 2, location: 'Indiranagar 100ft Road', city: 'Bengaluru', count: 36, priority: 'high' },
  { rank: 3, location: 'Pune Nagar Road, Yerwada', city: 'Pune', count: 44, priority: 'high' },
  { rank: 4, location: 'Wright Town, Near Stadium', city: 'Jabalpur', count: 28, priority: 'high' },
  { rank: 5, location: 'Rural Road Sector 4, Panagar', city: 'Jabalpur', count: 20, priority: 'high' },
  { rank: 6, location: 'Gomti Nagar Link Road', city: 'Lucknow', count: 14, priority: 'medium' },
  { rank: 7, location: 'Civic Center Road', city: 'Jabalpur', count: 12, priority: 'medium' },
  { rank: 8, location: 'Thane Belapur Road', city: 'Mumbai', count: 15, priority: 'medium' },
  { rank: 9, location: 'Arera Colony', city: 'Bhopal', count: 6, priority: 'low' },
  { rank: 10, location: 'Janpath Road', city: 'Delhi', count: 3, priority: 'low' },
];

// Build a simple activity calendar for April 2024
const activityDays = Array.from({ length: 30 }, (_, i) => ({
  day: i + 1,
  count: Math.floor(Math.random() * 20),
}));

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];
const AREA_COLORS = ['#3b82f6', '#fbbf24'];
const REPAIR_COLORS = ['#10b981', '#f1f5f9'];

const getHeatColor = (count: number) => {
  if (count === 0) return 'bg-slate-100 dark:bg-slate-800';
  if (count < 5) return 'bg-blue-100 dark:bg-blue-900/40';
  if (count < 10) return 'bg-blue-300 dark:bg-blue-700/60';
  if (count < 15) return 'bg-blue-500 dark:bg-blue-500/80';
  return 'bg-blue-700 dark:bg-blue-400';
};

export default function AnalyticsPage() {
  const { t } = useLanguage();

  const metrics = [
    { label: t('analytics.metrics.repair_rate'), value: '78%', trend: '+4.2%', up: true, icon: CheckCircle2, color: 'emerald' },
    { label: t('analytics.metrics.active_reports'), value: '1,240', trend: '+12%', up: true, icon: BarChart3, color: 'blue' },
    { label: t('analytics.metrics.response_time'), value: '3.5d', trend: '-0.3d', up: false, icon: TrendingUp, color: 'purple' },
    { label: t('analytics.metrics.network_health'), value: '94%', trend: 'Stable', up: true, icon: Globe, color: 'orange' },
  ];

  return (
    <div className="space-y-8 pb-10">
      {/* Header */}
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

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {metrics.map((stat, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-3xl shadow-sm"
          >
            <div className="flex items-center justify-between mb-3">
              <div className={`w-10 h-10 rounded-xl bg-${stat.color}-50 dark:bg-${stat.color}-950/30 flex items-center justify-center`}>
                <stat.icon className={`w-5 h-5 text-${stat.color}-500`} />
              </div>
              <span className={cn(
                "text-[10px] font-black px-2 py-0.5 rounded-full",
                stat.up
                  ? "bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400"
                  : "bg-orange-50 dark:bg-orange-950/30 text-orange-600 dark:text-orange-400"
              )}>{stat.trend}</span>
            </div>
            <div className="text-2xl font-black text-slate-800 dark:text-slate-100 mb-1">{stat.value}</div>
            <div className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">{stat.label}</div>
          </motion.div>
        ))}
      </div>

      {/* Monthly Trend + Repair Rate Donut */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[2rem] p-8 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-black text-slate-800 dark:text-slate-100 flex items-center gap-2">
              <Activity className="w-5 h-5 text-blue-500" /> Monthly Trend
            </h3>
            <span className="text-[10px] font-black text-slate-400 uppercase bg-slate-50 dark:bg-slate-800 px-2 py-1 rounded-lg border border-slate-200 dark:border-slate-700">Oct – Apr</span>
          </div>
          <div className="h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={monthlyTrendData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorReported" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="colorRepaired" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 11, fontWeight: 700 }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 11, fontWeight: 700 }} dx={-10} />
                <Tooltip contentStyle={{ borderRadius: '14px', border: '1px solid #e2e8f0', boxShadow: '0 10px 25px -5px rgb(0 0 0 / 0.1)', padding: '12px' }} />
                <Area type="monotone" dataKey="reported" name="Reported" stroke="#3b82f6" strokeWidth={2.5} fill="url(#colorReported)" dot={{ r: 4, fill: '#3b82f6' }} />
                <Area type="monotone" dataKey="repaired" name="Repaired" stroke="#10b981" strokeWidth={2.5} fill="url(#colorRepaired)" dot={{ r: 4, fill: '#10b981' }} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Repair Rate Donut */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[2rem] p-8 shadow-sm flex flex-col items-center justify-center">
          <h3 className="text-xl font-black text-slate-800 dark:text-slate-100 flex items-center gap-2 mb-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-500" /> Repair Rate
          </h3>
          <p className="text-xs font-semibold text-slate-400 mb-6">Current month</p>
          <div className="h-[200px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={repairRateData} innerRadius={60} outerRadius={80} paddingAngle={4} dataKey="value" startAngle={90} endAngle={-270}>
                  <Cell fill="#10b981" />
                  <Cell fill="#f1f5f9" />
                </Pie>
                <Tooltip contentStyle={{ borderRadius: '12px' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="text-center -mt-4">
            <div className="text-4xl font-black text-emerald-600 dark:text-emerald-400">78%</div>
            <div className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">Potholes Repaired</div>
          </div>
          <div className="flex items-center gap-4 mt-5 text-xs font-bold">
            <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded-full bg-emerald-500" />Repaired</div>
            <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded-full bg-slate-200 dark:bg-slate-700" />Pending</div>
          </div>
        </div>
      </div>

      {/* Response Time Histogram + City Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* City Distribution */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[2rem] p-8 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-black text-slate-800 dark:text-slate-100 flex items-center gap-2">
              <MapPin className="w-5 h-5 text-blue-500" /> {t('analytics.city_distribution')}
            </h3>
          </div>
          <div className="h-[260px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={cityData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 11, fontWeight: 700 }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 11, fontWeight: 700 }} dx={-10} />
                <Tooltip cursor={{ fill: '#f8fafc' }} contentStyle={{ borderRadius: '14px', border: '1px solid #e2e8f0', boxShadow: '0 10px 25px -5px rgb(0 0 0 / 0.1)', padding: '12px' }} />
                <Bar dataKey="count" radius={[10, 10, 0, 0]} barSize={36} name="Reports">
                  {cityData.map((_, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Response Time Histogram */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[2rem] p-8 shadow-sm">
          <h3 className="text-xl font-black text-slate-800 dark:text-slate-100 flex items-center gap-2 mb-6">
            <TrendingUp className="w-5 h-5 text-purple-500" /> Response Time
          </h3>
          <div className="h-[260px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={responseTimeData} layout="vertical" margin={{ left: 10, right: 10 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                <XAxis type="number" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 700 }} />
                <YAxis dataKey="range" type="category" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 700 }} />
                <Tooltip contentStyle={{ borderRadius: '14px', border: '1px solid #e2e8f0', padding: '10px' }} />
                <Bar dataKey="count" fill="#8b5cf6" radius={[0, 6, 6, 0]} name="Count" barSize={16} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Top 10 Worst Roads + Daily Activity Heatmap */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top 10 */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[2rem] p-8 shadow-sm">
          <h3 className="text-xl font-black text-slate-800 dark:text-slate-100 flex items-center gap-2 mb-6">
            <Trophy className="w-5 h-5 text-amber-500" /> Top 10 Worst Roads
          </h3>
          <div className="space-y-2.5">
            {worstRoads.map((road) => (
              <div key={road.rank} className="flex items-center gap-3 p-3 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors group">
                <span className={cn(
                  "w-7 h-7 rounded-xl flex items-center justify-center text-[11px] font-black flex-shrink-0",
                  road.rank <= 3 ? "bg-amber-100 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400" : "bg-slate-100 dark:bg-slate-800 text-slate-400"
                )}>
                  {road.rank}
                </span>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-bold text-slate-800 dark:text-slate-200 truncate">{road.location}</div>
                  <div className="text-xs font-semibold text-slate-400">{road.city}</div>
                </div>
                <div className="flex items-center gap-2">
                  <span className={cn(
                    "text-[9px] font-black uppercase px-1.5 py-0.5 rounded",
                    road.priority === 'high' ? "bg-red-100 dark:bg-red-950/40 text-red-600 dark:text-red-400" :
                    road.priority === 'medium' ? "bg-orange-100 dark:bg-orange-950/40 text-orange-600 dark:text-orange-400" :
                    "bg-emerald-100 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400"
                  )}>{road.priority}</span>
                  <span className="text-sm font-black text-slate-600 dark:text-slate-300">{road.count}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Daily Activity Heatmap Calendar */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[2rem] p-8 shadow-sm">
          <h3 className="text-xl font-black text-slate-800 dark:text-slate-100 flex items-center gap-2 mb-2">
            <Calendar className="w-5 h-5 text-blue-500" /> Daily Activity
          </h3>
          <p className="text-xs font-semibold text-slate-400 dark:text-slate-500 mb-6">April 2024 — Reports per day</p>
          <div className="grid grid-cols-7 gap-2 mb-4">
            {['S','M','T','W','T','F','S'].map((d, i) => (
              <div key={i} className="text-center text-[10px] font-black text-slate-400 uppercase">{d}</div>
            ))}
          </div>
          {/* Offset April 1 = Monday (col 2 = index 1) */}
          <div className="grid grid-cols-7 gap-2">
            <div /> {/* April starts on Monday */}
            {activityDays.map((day) => (
              <div
                key={day.day}
                title={`Apr ${day.day}: ${day.count} reports`}
                className={cn("aspect-square rounded-lg cursor-pointer transition-all hover:scale-110 hover:ring-2 hover:ring-blue-400", getHeatColor(day.count))}
              />
            ))}
          </div>
          <div className="flex items-center gap-2 mt-5 text-[10px] font-bold text-slate-400">
            <span>Less</span>
            {['bg-slate-100 dark:bg-slate-800','bg-blue-100 dark:bg-blue-900/40','bg-blue-300 dark:bg-blue-700/60','bg-blue-500','bg-blue-700 dark:bg-blue-400'].map((c,i) => (
              <div key={i} className={cn("w-4 h-4 rounded-sm", c)} />
            ))}
            <span>More</span>
          </div>
        </div>
      </div>
    </div>
  );
}
