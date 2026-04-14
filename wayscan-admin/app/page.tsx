'use client';

import React, { useEffect, useMemo, useState } from 'react';
import KPICards from '@/components/dashboard/kpi-cards';
import FilterPanel from '@/components/dashboard/filter-panel';
import SummaryTable from '@/components/dashboard/summary-table';
import DetailModal from '@/components/dashboard/detail-modal';
import TrendChart from '@/components/dashboard/trend-chart';
import dynamic from 'next/dynamic';
import { potholes as allPotholes } from '@/lib/mock-data';
import { mockDashboardStats } from '@/lib/mock-data';
import { buildDashboardChatContext } from '@/lib/chat-context';
import { useDashboardChatContext } from '@/components/dashboard/chat-context-provider';
import { PotholeCluster, FilterState, Status } from '@/lib/types';
import { LayoutGrid, Map as MapIcon, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLanguage } from '@/components/providers/language-provider';
import { Navigation } from 'lucide-react';

const PriorityMap = dynamic(() => import('@/components/dashboard/priority-map'), { 
  ssr: false,
  loading: () => (
    <div className="w-full h-full bg-slate-100 dark:bg-slate-800 rounded-3xl animate-pulse flex flex-col items-center justify-center border border-slate-200 dark:border-slate-700">
      <Navigation className="w-8 h-8 text-slate-300 dark:text-slate-600 animate-bounce" />
    </div>
  )
});

export default function OverviewPage() {
  const { t } = useLanguage();
  const { setDashboardChatContext } = useDashboardChatContext();
  
  const [filters, setFilters] = useState<FilterState>({
    state: 'all',
    city: 'all',
    priority: 'all',
    status: 'all',
    areaType: 'all',
    timeRange: 'all',
    sortBy: 'priority',
    sortHighPriority: false,
  });

  const [selectedPothole, setSelectedPothole] = useState<PotholeCluster | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [potholeData, setPotholeData] = useState(allPotholes);
  const [mapCustomCenter, setMapCustomCenter] = useState<[number, number] | null>(null);
  const dashboardContext = useMemo(
    () => buildDashboardChatContext(potholeData, mockDashboardStats),
    [potholeData],
  );

  useEffect(() => {
    setDashboardChatContext(dashboardContext);

    return () => {
      setDashboardChatContext(null);
    };
  }, [dashboardContext, setDashboardChatContext]);

  const filteredData = useMemo(() => {
    let data = [...potholeData];

    if (filters.state !== 'all') data = data.filter(p => p.state === filters.state);
    if (filters.city !== 'all') data = data.filter(p => p.city === filters.city);
    if (filters.priority !== 'all') data = data.filter(p => p.priority === filters.priority);
    if (filters.status !== 'all') data = data.filter(p => p.status === filters.status);
    if (filters.areaType !== 'all') data = data.filter(p => p.areaType === filters.areaType);

    if (filters.timeRange !== 'all') {
      const now = new Date();
      const cutoff = new Date();
      if (filters.timeRange === '24h') cutoff.setHours(now.getHours() - 24);
      if (filters.timeRange === '7d') cutoff.setDate(now.getDate() - 7);
      if (filters.timeRange === '30d') cutoff.setDate(now.getDate() - 30);
      data = data.filter(p => new Date(p.firstDetected) >= cutoff);
    }

    // Sort logic — sortHighPriority overrides sortBy
    if (filters.sortHighPriority) {
      const order = { high: 0, medium: 1, low: 2 };
      data.sort((a, b) => order[a.priority] - order[b.priority]);
    } else if (filters.sortBy === 'priority') {
      const order = { high: 0, medium: 1, low: 2 };
      data.sort((a, b) => order[a.priority] - order[b.priority]);
    } else if (filters.sortBy === 'date') {
      data.sort((a, b) => new Date(b.firstDetected).getTime() - new Date(a.firstDetected).getTime());
    } else if (filters.sortBy === 'vehicles') {
      data.sort((a, b) => b.uniqueVehicleCount - a.uniqueVehicleCount);
    } else if (filters.sortBy === 'status') {
      const sOrder = { reported: 0, 'in-progress': 1, repaired: 2 };
      data.sort((a, b) => sOrder[a.status] - sOrder[b.status]);
    }

    return data;
  }, [potholeData, filters]);

  const handleSelect = (pothole: PotholeCluster) => {
    setSelectedId(pothole.id);
    setSelectedPothole(pothole);
  };

  const handleStatusChange = (id: string, newStatus: Status) => {
    setPotholeData(prev => prev.map(p => p.id === id ? { ...p, status: newStatus } : p));
    if (selectedPothole?.id === id) {
      setSelectedPothole(prev => prev ? { ...prev, status: newStatus } : null);
    }
  };

  const handleUpdateFilters = (newFilters: Partial<FilterState>) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
  };

  const handleSelectPothole = (id: string) => {
    setSelectedId(id);
    const pothole = potholeData.find(p => p.id === id);
    if (pothole) setSelectedPothole(pothole);
  };

  return (
    <div className="space-y-8 pb-10">
      {/* Page Heading */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
        >
          <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400 text-xs font-black uppercase tracking-widest mb-1.5">
            <LayoutGrid className="w-3 h-3" /> {t('app.title')}
            <ChevronRight className="w-3 h-3 text-slate-300 dark:text-slate-600" />
            <span className="text-slate-400 dark:text-slate-500">{t('dashboard.overview')}</span>
          </div>
          <h1 className="text-4xl font-black text-slate-800 dark:text-slate-100 tracking-tight">{t('app.subtitle')}</h1>
          <p className="text-slate-500 dark:text-slate-400 font-medium mt-1">{t('dashboard.overview_subtitle')}</p>
        </motion.div>
        
        <div className="flex items-center gap-3">
          <div className="mr-2 hidden sm:block">
            <div className="flex flex-col items-end leading-tight">
              <span className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase">{t('dashboard.kpi.online')}</span>
              <span className="text-sm font-bold text-slate-600 dark:text-slate-300">{t('dashboard.kpi.active_vehicles')}</span>
            </div>
          </div>
          <div className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-pulse shadow-sm shadow-emerald-200" />
        </div>
      </div>

      {/* KPI Stats */}
      <KPICards />

      {/* Filters Section */}
      <FilterPanel filters={filters} onChange={setFilters} />

      {/* Main Map + Table Interaction Area */}
      <div className="grid grid-cols-1 xl:grid-cols-5 gap-8" style={{ minHeight: '650px' }}>
        
        {/* Map Panel (60% weight) */}
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="xl:col-span-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-3 shadow-md group relative overflow-hidden"
        >
          <div className="absolute top-6 left-6 z-20 flex items-center gap-2 bg-white/90 dark:bg-slate-900/90 backdrop-blur px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm pointer-events-none">
            <MapIcon className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            <span className="text-xs font-black text-slate-700 dark:text-slate-300 uppercase tracking-tighter">{t('dashboard.map.title')}</span>
          </div>
          <PriorityMap 
            data={filteredData} 
            selectedId={selectedId} 
            onMarkerClick={handleSelect} 
            overrideCenter={mapCustomCenter}
          />
        </motion.div>

        {/* List Feed (40% weight) */}
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="xl:col-span-2 h-full"
        >
          <SummaryTable 
            data={filteredData} 
            selectedId={selectedId} 
            onSelect={handleSelect} 
          />
        </motion.div>
      </div>

      {/* Trend Analysis Section */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
      >
        <TrendChart />
      </motion.div>

      {/* Detail Lightbox */}
      <AnimatePresence>
        {selectedPothole && (
          <DetailModal 
            pothole={selectedPothole} 
            onClose={() => { setSelectedPothole(null); setSelectedId(null); }}
            onStatusChange={handleStatusChange}
          />
        )}
      </AnimatePresence>

    </div>
  );
}
