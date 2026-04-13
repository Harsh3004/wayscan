'use client';

import React, { useState } from 'react';
import dynamic from 'next/dynamic';
import { motion, AnimatePresence } from 'framer-motion';
import { MapIcon, Layers, LayoutGrid, ChevronRight } from 'lucide-react';
import { potholes as allPotholes } from '@/lib/mock-data';
import { PotholeCluster, Status } from '@/lib/types';
import DetailModal from '@/components/dashboard/detail-modal';
import { useLanguage } from '@/components/providers/language-provider';
import { cn } from '@/lib/utils';

const PriorityMap = dynamic(() => import('@/components/dashboard/priority-map'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full bg-slate-100 dark:bg-slate-800 rounded-[2.5rem] animate-pulse flex items-center justify-center text-slate-400 dark:text-slate-500 font-bold">
      Initializing Spatial Engine…
    </div>
  ),
});

export default function HeatmapPage() {
  const { t } = useLanguage();
  const [selectedPothole, setSelectedPothole] = useState<PotholeCluster | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [data, setData] = useState(allPotholes);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const handleSelect = (pothole: PotholeCluster) => {
    setSelectedId(pothole.id);
    setSelectedPothole(pothole);
  };

  const handleStatusChange = (id: string, newStatus: Status) => {
    setData(prev => prev.map(p => p.id === id ? { ...p, status: newStatus } : p));
    if (selectedPothole?.id === id) setSelectedPothole(prev => prev ? { ...prev, status: newStatus } : null);
  };

  return (
    <div className={cn("flex flex-col space-y-4", isFullscreen ? "fixed inset-0 z-[50] bg-white dark:bg-slate-950 p-4" : "h-[calc(100vh-140px)]")}>
      {!isFullscreen && (
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
            <div className="flex items-center gap-2 text-blue-600 dark:text-blue-500 text-xs font-black uppercase tracking-widest mb-1.5">
              <LayoutGrid className="w-3 h-3" /> {t('nav.dashboard')}
              <ChevronRight className="w-3 h-3 text-slate-300 dark:text-slate-600" />
              <span className="text-slate-400 dark:text-slate-500">{t('nav.live_map')}</span>
            </div>
            <h1 className="text-4xl font-black text-slate-800 dark:text-slate-100 tracking-tight">{t('heatmap.title')}</h1>
            <p className="text-slate-500 dark:text-slate-400 font-medium mt-1">{t('heatmap.subtitle')}</p>
          </motion.div>

          <div className="flex items-center gap-2">
            <div className="px-4 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm text-xs font-bold text-slate-600 dark:text-slate-300 flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              {t('heatmap.live_data')}
            </div>
            <div className="px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5" />
              {data.length} markers
            </div>
          </div>
        </div>
      )}

      <motion.div
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        className={cn(
          "bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[2.5rem] p-3 shadow-xl relative overflow-hidden",
          isFullscreen ? "flex-1" : "flex-1"
        )}
      >
        <PriorityMap
          data={data}
          selectedId={selectedId}
          onMarkerClick={handleSelect}
          isFullscreen={isFullscreen}
          onToggleFullscreen={() => setIsFullscreen(f => !f)}
        />
      </motion.div>

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
