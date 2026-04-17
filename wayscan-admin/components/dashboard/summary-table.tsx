'use client';

import React, { useState, useMemo } from 'react';
import { PotholeCluster, SortDirection } from '@/lib/types';
import { cn, formatDate } from '@/lib/utils';
import { useLanguage } from '@/components/providers/language-provider';
import { MapPin, Users, Calendar, ArrowRight, Search, ChevronUp, ChevronDown, ChevronsUpDown } from 'lucide-react';

interface SummaryTableProps {
  data: PotholeCluster[];
  selectedId: string | null;
  onSelect: (pothole: PotholeCluster) => void;
}

type SortKey = 'priority' | 'firstDetected' | 'status' | 'uniqueVehicleCount';

const PRIORITY_ORDER = { high: 0, medium: 1, low: 2 };
const STATUS_ORDER = { reported: 0, 'in-progress': 1, repaired: 2 };
const PAGE_SIZE_OPTIONS = [10, 20, 50];

function SortIcon({ column, sortKey, direction }: { column: SortKey; sortKey: SortKey; direction: SortDirection }) {
  if (column !== sortKey) return <ChevronsUpDown className="w-3 h-3 text-slate-300 dark:text-slate-600" />;
  return direction === 'asc'
    ? <ChevronUp className="w-3 h-3 text-blue-500" />
    : <ChevronDown className="w-3 h-3 text-blue-500" />;
}

export default function SummaryTable({ data, selectedId, onSelect }: SummaryTableProps) {
  const { t } = useLanguage();
  const [search, setSearch] = useState('');
  const [sortKey, setSortKey] = useState<SortKey>('priority');
  const [sortDir, setSortDir] = useState<SortDirection>('asc');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    } else {
      setSortKey(key);
      setSortDir('asc');
    }
    setPage(1);
  };

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return data.filter(item =>
      item.locationName.toLowerCase().includes(q) ||
      item.city.toLowerCase().includes(q) ||
      item.state.toLowerCase().includes(q)
    );
  }, [data, search]);

  const sorted = useMemo(() => {
    return [...filtered].sort((a, b) => {
      let cmp = 0;
      if (sortKey === 'priority') cmp = PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority];
      else if (sortKey === 'firstDetected') {
        const dateA = a.firstDetected ? new Date(a.firstDetected).getTime() : 0;
        const dateB = b.firstDetected ? new Date(b.firstDetected).getTime() : 0;
        cmp = dateA - dateB;
      }
      else if (sortKey === 'status') cmp = STATUS_ORDER[a.status] - STATUS_ORDER[b.status];
      else if (sortKey === 'uniqueVehicleCount') cmp = a.uniqueVehicleCount - b.uniqueVehicleCount;
      return sortDir === 'asc' ? cmp : -cmp;
    });
  }, [filtered, sortKey, sortDir]);

  const totalPages = Math.max(1, Math.ceil(sorted.length / pageSize));
  const paginated = sorted.slice((page - 1) * pageSize, page * pageSize);

  const ThButton = ({ label, col }: { label: string; col: SortKey }) => (
    <button
      onClick={() => handleSort(col)}
      className="flex items-center gap-1 text-[10px] font-black text-slate-400 uppercase tracking-widest hover:text-slate-600 dark:hover:text-slate-300 transition-colors group"
    >
      {label}
      <SortIcon column={col} sortKey={sortKey} direction={sortDir} />
    </button>
  );

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl overflow-hidden shadow-sm h-full flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-slate-100 dark:border-slate-800 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
            <h3 className="font-bold text-slate-800 dark:text-slate-100">{t('dashboard.table.title')}</h3>
          </div>
          <span className="text-[10px] font-black text-slate-400 uppercase bg-slate-50 dark:bg-slate-800 px-2 py-1 rounded-md border border-slate-100 dark:border-slate-700">
            {sorted.length} {t('dashboard.table.results')}
          </span>
        </div>
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1); }}
            placeholder="Search location, city…"
            className="w-full h-9 pl-9 pr-3 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-200 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all"
          />
        </div>
      </div>

      {/* Column Headers */}
      <div className="grid grid-cols-4 gap-2 px-4 py-2.5 bg-slate-50/80 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800">
        <ThButton label={t('dashboard.table.sort_priority')} col="priority" />
        <ThButton label={t('dashboard.table.sort_date')} col="firstDetected" />
        <ThButton label={t('dashboard.table.sort_status')} col="status" />
        <ThButton label={t('dashboard.table.sort_vehicles')} col="uniqueVehicleCount" />
      </div>

      {/* Table Body */}
      <div className="flex-1 overflow-y-auto custom-scrollbar">
        {paginated.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
            <div className="w-14 h-14 bg-slate-50 dark:bg-slate-800 rounded-full flex items-center justify-center mb-3 border border-slate-100 dark:border-slate-700">
              <MapPin className="text-slate-300 dark:text-slate-600 w-6 h-6" />
            </div>
            <p className="font-bold text-slate-400 dark:text-slate-500 text-sm">
              {search ? 'No results found' : t('dashboard.table.no_reports')}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-50 dark:divide-slate-800/50">
            {paginated.map((item) => (
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
                <div className="flex-1 min-w-0 pr-3">
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className={cn(
                      "text-[9px] font-black uppercase tracking-tighter px-1.5 py-0.5 rounded",
                      item.priority === 'high' ? "bg-red-100 dark:bg-red-950/40 text-red-600 dark:text-red-400" :
                        item.priority === 'medium' ? "bg-orange-100 dark:bg-orange-950/40 text-orange-600 dark:text-orange-400" :
                          "bg-emerald-100 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400"
                    )}>
                      {t(`dashboard.modal.priority.${item.priority}`)}
                    </span>
                    <span className="text-[9px] font-bold text-slate-400 flex items-center gap-1">
                      <Calendar className="w-2.5 h-2.5" />
                      {formatDate(item.firstDetected)}
                    </span>
                  </div>
                  <h4 className="font-bold text-slate-800 dark:text-slate-200 text-sm truncate mb-1">
                    {t(`data.locations.${item.locationName}`) || item.locationName}
                  </h4>
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-500">
                      <Users className="w-3 h-3 text-slate-400" />
                      {item.uniqueVehicleCount}
                      <span className="text-[10px] text-slate-400">vehicles</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-500">
                      <div className={cn(
                        "w-1.5 h-1.5 rounded-full",
                        item.status === 'repaired' ? "bg-emerald-500" :
                          item.status === 'in-progress' ? "bg-blue-500" : "bg-orange-500"
                      )} />
                      {t(`dashboard.modal.status.${item.status.replace('-', '_')}`)}
                    </div>
                  </div>
                </div>
                <div className="w-7 h-7 rounded-full border border-slate-100 dark:border-slate-700 flex items-center justify-center text-slate-300 dark:text-slate-600 group-hover:bg-white dark:group-hover:bg-slate-800 group-hover:text-blue-500 group-hover:border-blue-100 dark:group-hover:border-blue-900/50 transition-all flex-shrink-0">
                  <ArrowRight className="w-3.5 h-3.5" />
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Pagination Footer */}
      {sorted.length > 0 && (
        <div className="p-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2 flex-wrap">
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] font-bold text-slate-400 uppercase">Rows:</span>
            {PAGE_SIZE_OPTIONS.map(size => (
              <button
                key={size}
                onClick={() => { setPageSize(size); setPage(1); }}
                className={cn(
                  "w-8 h-7 rounded-lg text-[11px] font-black transition-all",
                  pageSize === size
                    ? "bg-blue-600 text-white shadow-sm"
                    : "bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700"
                )}
              >
                {size}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] font-bold text-slate-400">
              {(page - 1) * pageSize + 1}–{Math.min(page * pageSize, sorted.length)} of {sorted.length}
            </span>
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className="w-7 h-7 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 text-xs font-black disabled:opacity-40 hover:bg-slate-200 dark:hover:bg-slate-700 transition-all"
            >‹</button>
            <button
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="w-7 h-7 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 text-xs font-black disabled:opacity-40 hover:bg-slate-200 dark:hover:bg-slate-700 transition-all"
            >›</button>
          </div>
        </div>
      )}
    </div>
  );
}
