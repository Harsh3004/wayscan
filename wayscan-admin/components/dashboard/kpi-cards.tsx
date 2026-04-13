'use client';

import React from 'react';
import { 
  AlertTriangle, 
  CheckCircle2, 
  Clock, 
  Layers, 
  RefreshCw,
  TrendingUp,
  TrendingDown
} from 'lucide-react';
import { motion, useMotionValue, useTransform, animate } from 'framer-motion';
import { useEffect } from 'react';
import { LineChart, Line, ResponsiveContainer } from 'recharts';
import { useLanguage } from '@/components/providers/language-provider';
import { cn } from '@/lib/utils';
import { mockDashboardStats } from '@/lib/mock-data';

const getKpis = (t: any) => [
  {
    title: t('dashboard.kpi.total_potholes'),
    value: mockDashboardStats.totalActive,
    // sparklineData: mockDashboardStats.totalActiveSparkline,
    trend: '+12%',
    trendUp: true,
    icon: Layers,
    color: 'blue',
  },
  {
    title: t('dashboard.kpi.critical_priorities'),
    value: mockDashboardStats.criticalHazards,
    // sparklineData: mockDashboardStats.criticalHazardsSparkline,
    trend: '-5%',
    trendUp: false,
    icon: AlertTriangle,
    color: 'red',
  },
  {
    title: t('dashboard.kpi.repaired_this_week'),
    value: mockDashboardStats.repairedThisMonth,
    // sparklineData: mockDashboardStats.repairedThisMonthSparkline,
    trend: '+18%',
    trendUp: true,
    icon: CheckCircle2,
    color: 'green',
  },
  {
    title: t('dashboard.kpi.avg_resolution_time'),
    value: `${mockDashboardStats.avgResolutionTime}`,
    // sparklineData: mockDashboardStats.avgResolutionTimeSparkline,
    trend: '-0.4d',
    trendUp: false,
    icon: Clock,
    color: 'purple',
  },
  {
    title: t('dashboard.kpi.pending_sync'),
    value: mockDashboardStats.pendingSync,
    // sparklineData: mockDashboardStats.pendingSyncSparkline,
    trend: 'Queue',
    trendUp: true,
    icon: RefreshCw,
    color: 'orange',
  },
];

const colorVariants: Record<string, string> = {
  blue: 'bg-blue-50 text-blue-600 border-blue-100',
  red: 'bg-red-50 text-red-600 border-red-100',
  green: 'bg-emerald-50 text-emerald-600 border-emerald-100',
  purple: 'bg-purple-50 text-purple-600 border-purple-100',
  orange: 'bg-orange-50 text-orange-600 border-orange-100',
};

const iconVariants: Record<string, string> = {
  blue: 'bg-blue-600 text-white shadow-blue-200',
  red: 'bg-red-600 text-white shadow-red-200',
  green: 'bg-emerald-600 text-white shadow-emerald-200',
  purple: 'bg-purple-600 text-white shadow-purple-200',
  orange: 'bg-orange-600 text-white shadow-orange-200',
};

function CountUp({ value }: { value: number | string }) {
  const isNumber = typeof value === 'number' || !isNaN(Number(value));
  const numValue = isNumber ? Number(value) : 0;
  
  const count = useMotionValue(0);
  const rounded = useTransform(count, (latest) => {
    if (!isNumber) return value;
    return Number.isInteger(numValue) ? Math.round(latest).toString() : latest.toFixed(1);
  });

  useEffect(() => {
    if (isNumber) {
      const controls = animate(count, numValue, { duration: 1.5, ease: "easeOut" });
      return () => controls.stop();
    }
  }, [numValue, isNumber]);

  if (!isNumber) return <span>{value}</span>;
  return <motion.span>{rounded}</motion.span>;
}

// function Sparkline({ data, color }: { data: number[], color: string }) {
//   const chartData = data.map((val, i) => ({ value: val, index: i }));
//   const hexColor = color === 'blue' ? '#2563eb' : 
//                    color === 'red' ? '#dc2626' : 
//                    color === 'green' ? '#059669' : 
//                    color === 'purple' ? '#9333ea' : 
//                    '#ea580c';
                   
//   return (
//     <div className="h-10 w-24">
//       <ResponsiveContainer width="100%" height="100%">
//         <LineChart data={chartData}>
//           <Line 
//             type="monotone" 
//             dataKey="value" 
//             stroke={hexColor} 
//             strokeWidth={2.5} 
//             dot={false}
//             isAnimationActive={true}
//             animationDuration={1500}
//           />
//         </LineChart>
//       </ResponsiveContainer>
//     </div>
//   );
// }

export default function KPICards() {
  const { t } = useLanguage();
  const kpis = getKpis(t);

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4 md:gap-6">
      {kpis.map((kpi, idx) => (
        <motion.div
          key={kpi.title}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: idx * 0.1 }}
          className="bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800 rounded-3xl p-6 shadow-sm hover:shadow-xl hover:translate-y-[-4px] transition-all duration-300 group cursor-default"
        >
          <div className="flex items-start justify-between mb-4">
            <div className={cn(
              "w-12 h-12 rounded-2xl flex items-center justify-center shadow-lg transition-transform group-hover:rotate-12",
              iconVariants[kpi.color]
            )}>
              <kpi.icon className="w-6 h-6" />
            </div>
            <div className={cn(
              "px-2.5 py-1 rounded-full text-[10px] font-extrabold flex items-center gap-1 border transition-colors",
              kpi.trendUp 
                ? "bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400 border-emerald-100 dark:border-emerald-900/50" 
                : "bg-red-50 dark:bg-red-950/30 text-red-600 dark:text-red-400 border-red-100 dark:border-red-900/50"
            )}>
              {kpi.trendUp ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
              {kpi.trend}
            </div>
          </div>
          
          <div className="flex items-end justify-between">
            <div className="space-y-1">
              <h3 className="text-sm font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">{kpi.title}</h3>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-black text-slate-800 dark:text-slate-100 tracking-tight">
                  <CountUp value={kpi.value} />
                </span>
              </div>
            </div>
            {/* {kpi.sparklineData && (
              <Sparkline data={kpi.sparklineData} color={kpi.color} />
            )} */}
          </div>
          
          {/* Decorative background circle */}
          <div className={cn(
            "absolute -right-4 -bottom-4 w-24 h-24 rounded-full opacity-[0.03] group-hover:scale-150 transition-transform duration-700",
            iconVariants[kpi.color].split(' ')[0]
          )} />
        </motion.div>
      ))}
    </div>
  );
}
