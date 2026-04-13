'use client';

import React from 'react';
import { 
  Filter, 
  MapPin, 
  AlertCircle, 
  FileCheck, 
  Globe, 
  Clock,
  RotateCcw,
  SlidersHorizontal,
  ArrowUpDown,
  Flame,
} from 'lucide-react';
import { FilterState } from '@/lib/types';
import { STATE_CITY_MAP } from '@/lib/mock-data';
import { useLanguage } from '@/components/providers/language-provider';
import { cn } from '@/lib/utils';

interface FilterPanelProps {
  filters: FilterState;
  onChange: (filters: FilterState) => void;
}

const TIME_CHIP_KEYS = [
  { value: 'all', key: 'dashboard.filters.options.lifetime' },
  { value: '24h', key: 'dashboard.filters.options.last_24h' },
  { value: '7d', key: 'dashboard.filters.options.last_7d' },
  { value: '30d', key: 'dashboard.filters.options.last_30d' },
];

export default function FilterPanel({ filters, onChange }: FilterPanelProps) {
  const { t } = useLanguage();
  const activeCount = Object.entries(filters).filter(([key, val]) => 
    key !== 'sortBy' && key !== 'sortHighPriority' && val !== 'all'
  ).length + (filters.sortHighPriority ? 1 : 0);

  const updateFilter = (key: keyof FilterState, value: string | boolean) => {
    onChange({ ...filters, [key]: value });
  };

  const resetFilters = () => {
    onChange({
      state: 'all',
      city: 'all',
      priority: 'all',
      status: 'all',
      areaType: 'all',
      timeRange: 'all',
      sortBy: 'priority',
      sortHighPriority: false,
    });
  };

  // Get cities based on selected state
  const availableCities = filters.state !== 'all' 
    ? STATE_CITY_MAP[filters.state] || []
    : Object.values(STATE_CITY_MAP).flat();

  const handleStateChange = (state: string) => {
    // Reset city when state changes
    onChange({ ...filters, state, city: 'all' });
  };

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-slate-900 dark:bg-slate-700 text-white flex items-center justify-center">
            <SlidersHorizontal className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100">{t('dashboard.filters.title')}</h2>
            <p className="text-xs font-semibold text-slate-400 dark:text-slate-500">{t('dashboard.filters.subtitle')}</p>
          </div>
          {activeCount > 0 && (
            <span className="ml-2 bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-400 text-[10px] font-black px-2 py-1 rounded-full border border-blue-200 dark:border-blue-800 uppercase tracking-tighter">
              {activeCount} Active
            </span>
          )}
        </div>
        
        <div className="flex items-center gap-3">
          {/* Sort by Priority Toggle */}
          <button
            onClick={() => updateFilter('sortHighPriority', !filters.sortHighPriority)}
            className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all border",
              filters.sortHighPriority
                ? "bg-red-50 dark:bg-red-950/30 text-red-600 dark:text-red-400 border-red-200 dark:border-red-900/50"
                : "bg-slate-50 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700"
            )}
          >
            <Flame className={cn("w-4 h-4", filters.sortHighPriority && "text-red-500")} />
            {t('dashboard.filters.sort_priority')}
          </button>

          <button 
            onClick={resetFilters}
            className="flex items-center gap-2 px-4 py-2 text-sm font-bold text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl transition-colors"
          >
            <RotateCcw className="w-4 h-4" />
            {t('dashboard.filters.reset_all')}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        
        {/* State Filter */}
        <div className="space-y-1.5">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5 ml-1">
            <MapPin className="w-3 h-3" /> {t('dashboard.filters.state')}
          </label>
          <select 
            value={filters.state} 
            onChange={(e) => handleStateChange(e.target.value)}
            className="w-full h-11 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 text-sm font-semibold text-slate-700 dark:text-slate-200 outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all cursor-pointer"
          >
            <option value="all">{t('dashboard.filters.options.all_states')}</option>
            {Object.keys(STATE_CITY_MAP).map(state => (
              <option key={state} value={state}>{t(`data.states.${state}`) || state}</option>
            ))}
          </select>
        </div>

        {/* City Filter — depends on State */}
        <div className="space-y-1.5">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5 ml-1">
            <MapPin className="w-3 h-3 opacity-50" /> {t('dashboard.filters.city')}
          </label>
          <select 
            value={filters.city} 
            onChange={(e) => updateFilter('city', e.target.value)}
            className={cn(
              "w-full h-11 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 text-sm font-semibold text-slate-700 dark:text-slate-200 outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all cursor-pointer",
              filters.state === 'all' && "opacity-60"
            )}
          >
            <option value="all">{t('dashboard.filters.options.all_cities')}</option>
            {availableCities.map(city => (
              <option key={city} value={city}>{t(`data.cities.${city}`) || city}</option>
            ))}
          </select>
        </div>

        {/* Priority Filter */}
        <div className="space-y-1.5">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5 ml-1">
            <AlertCircle className={cn("w-3 h-3", filters.priority !== 'all' && "text-red-500")} /> {t('dashboard.filters.priority_level')}
          </label>
          <select 
            value={filters.priority} 
            onChange={(e) => updateFilter('priority', e.target.value)}
            className="w-full h-11 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 text-sm font-semibold text-slate-700 dark:text-slate-200 outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all cursor-pointer"
          >
            <option value="all">{t('dashboard.filters.options.any_priority')}</option>
            <option value="high">{t('dashboard.modal.priority.high')}</option>
            <option value="medium">{t('dashboard.modal.priority.medium')}</option>
            <option value="low">{t('dashboard.modal.priority.low')}</option>
          </select>
        </div>

        {/* Status Filter */}
        <div className="space-y-1.5">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5 ml-1">
            <FileCheck className="w-3 h-3" /> {t('dashboard.filters.status')}
          </label>
          <select 
            value={filters.status} 
            onChange={(e) => updateFilter('status', e.target.value)}
            className="w-full h-11 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 text-sm font-semibold text-slate-700 dark:text-slate-200 outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all cursor-pointer"
          >
            <option value="all">{t('dashboard.filters.options.all_status')}</option>
            <option value="reported">{t('dashboard.modal.status.reported')}</option>
            <option value="in-progress">{t('dashboard.modal.status.in_progress')}</option>
            <option value="repaired">{t('dashboard.modal.status.repaired')}</option>
          </select>
        </div>

        {/* Area Type Toggle */}
        <div className="space-y-1.5">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5 ml-1">
            <Globe className="w-3 h-3" /> {t('dashboard.filters.area_mode')}
          </label>
          <div className="flex h-11 bg-slate-100/50 dark:bg-slate-800/50 p-1 rounded-xl border border-slate-200 dark:border-slate-700">
            {(['all', 'urban', 'rural'] as const).map((mode) => (
              <button
                key={mode}
                onClick={() => updateFilter('areaType', mode)}
                className={cn(
                  "flex-1 text-[10px] font-black uppercase transition-all rounded-lg",
                  filters.areaType === mode 
                    ? "bg-white dark:bg-slate-600 text-blue-600 dark:text-blue-400 shadow-sm border border-slate-200 dark:border-slate-500" 
                    : "text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300"
                )}
              >
                {t(`dashboard.filters.${mode}`)}
              </button>
            ))}
          </div>
        </div>

        {/* Time Filter — Chips */}
        <div className="space-y-1.5">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5 ml-1">
            <Clock className="w-3 h-3" /> {t('dashboard.filters.timeframe')}
          </label>
          <div className="flex gap-1.5 flex-wrap">
            {TIME_CHIP_KEYS.map((chip) => (
              <button
                key={chip.value}
                onClick={() => updateFilter('timeRange', chip.value)}
                className={cn(
                  "px-3 py-2 rounded-lg text-[11px] font-black transition-all border whitespace-nowrap",
                  filters.timeRange === chip.value
                    ? "bg-blue-600 dark:bg-blue-500 text-white border-blue-600 dark:border-blue-500 shadow-md shadow-blue-200 dark:shadow-blue-900/20"
                    : "bg-slate-50 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700"
                )}
              >
                {t(chip.key)}
              </button>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}
