'use client';

import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  Wrench, Truck, CheckCircle2, AlertTriangle,
  ChevronRight, LayoutGrid, Search, Filter, Download,
  ChevronDown, CheckSquare, Square, Users
} from 'lucide-react';
import { potholes as allPotholes, FIELD_TEAMS } from '@/lib/mock-data';
import { PotholeCluster, Status } from '@/lib/types';
import { cn, formatDate } from '@/lib/utils';
import { useLanguage } from '@/components/providers/language-provider';

function exportCSV(data: PotholeCluster[]) {
  const headers = ['ID', 'Location', 'City', 'State', 'Priority', 'Status', 'Assigned Team', 'First Detected', 'Vehicles'];
  const rows = data.map(p => [
    p.id, p.locationName, p.city, p.state, p.priority, p.status,
    p.assignedTeam || 'Unassigned', p.firstDetected, p.uniqueVehicleCount
  ]);
  const csv = [headers, ...rows].map(r => r.map(String).join(',')).join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = 'wayscan_work_orders.csv'; a.click();
  URL.revokeObjectURL(url);
}

export default function WorkOrdersPage() {
  const { t } = useLanguage();
  const [data, setData] = useState(allPotholes);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterTeam, setFilterTeam] = useState('all');
  const [filterPriority, setFilterPriority] = useState('all');
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [bulkTeam, setBulkTeam] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  const filtered = useMemo(() => {
    return data
      .filter(p => filterStatus === 'all' || p.status === filterStatus)
      .filter(p => filterTeam === 'all' || p.assignedTeam === filterTeam)
      .filter(p => filterPriority === 'all' || p.priority === filterPriority)
      .filter(p =>
        p.locationName.toLowerCase().includes(search.toLowerCase()) ||
        p.city.toLowerCase().includes(search.toLowerCase())
      );
  }, [data, filterStatus, filterTeam, filterPriority, search]);

  const toggleSelect = (id: string) => {
    setSelected(prev => {
      const n = new Set(prev);
      n.has(id) ? n.delete(id) : n.add(id);
      return n;
    });
  };

  const toggleAll = () => {
    if (selected.size === filtered.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(filtered.map(p => p.id)));
    }
  };

  const handleMarkRepaired = (id: string) => {
    setData(prev => prev.map(p => p.id === id ? { ...p, status: 'repaired' as Status } : p));
  };

  const handleAssignTeam = (id: string, team: string) => {
    setData(prev => prev.map(p => p.id === id ? { ...p, assignedTeam: team } : p));
  };

  const handleBulkAssign = () => {
    if (!bulkTeam) return;
    setData(prev => prev.map(p => selected.has(p.id) ? { ...p, assignedTeam: bulkTeam } : p));
    setSelected(new Set());
    setBulkTeam('');
  };

  const stats = {
    critical: data.filter(p => p.priority === 'high' && p.status !== 'repaired').length,
    inProgress: data.filter(p => p.status === 'in-progress').length,
    completed: data.filter(p => p.status === 'repaired').length,
  };

  return (
    <div className="space-y-8 pb-10">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
          <div className="flex items-center gap-2 text-blue-600 dark:text-blue-500 text-xs font-black uppercase tracking-widest mb-1.5">
            <LayoutGrid className="w-3 h-3" /> {t('nav.dashboard')}
            <ChevronRight className="w-3 h-3 text-slate-300 dark:text-slate-600" />
            <span className="text-slate-400 dark:text-slate-500">{t('nav.work_orders')}</span>
          </div>
          <h1 className="text-4xl font-black text-slate-800 dark:text-slate-100 tracking-tight">{t('work_orders.title')}</h1>
          <p className="text-slate-500 dark:text-slate-400 font-medium mt-1">{t('work_orders.subtitle')}</p>
        </motion.div>
        <button
          onClick={() => exportCSV(filtered)}
          className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-xl font-bold text-sm shadow-lg shadow-blue-200 dark:shadow-blue-900/20 hover:bg-blue-700 transition-all"
        >
          <Download className="w-4 h-4" /> Export CSV
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: t('work_orders.metrics.critical'), value: stats.critical, cls: 'bg-red-50 dark:bg-red-950/30 border-red-100 dark:border-red-900/50 text-red-700 dark:text-red-400' },
          { label: t('work_orders.metrics.in_progress'), value: stats.inProgress, cls: 'bg-blue-50 dark:bg-blue-900/30 border-blue-100 dark:border-blue-900/50 text-blue-700 dark:text-blue-400' },
          { label: t('work_orders.metrics.completed'), value: stats.completed, cls: 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-100 dark:border-emerald-900/50 text-emerald-700 dark:text-emerald-400' },
        ].map((s, i) => (
          <div key={i} className={cn("border p-5 rounded-3xl", s.cls)}>
            <div className="text-[10px] font-black uppercase tracking-widest mb-1 opacity-70">{s.label}</div>
            <div className="text-3xl font-black">{s.value}</div>
          </div>
        ))}
      </div>

      {/* Main Table Card */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[2.5rem] shadow-sm overflow-hidden">
        {/* Toolbar */}
        <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[200px] max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder={t('work_orders.search')}
              className="w-full h-10 pl-10 pr-4 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/50 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-slate-800 dark:text-slate-100 dark:placeholder-slate-500"
            />
          </div>

          <button
            onClick={() => setShowFilters(f => !f)}
            className={cn(
              "flex items-center gap-2 px-3 py-2 rounded-xl border text-sm font-bold transition-all",
              showFilters
                ? "bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-800 text-blue-600 dark:text-blue-400"
                : "bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700"
            )}
          >
            <Filter className="w-4 h-4" /> Filters {showFilters ? '▴' : '▾'}
          </button>

          <span className="text-xs font-bold text-slate-400 uppercase ml-auto">{filtered.length} orders</span>
        </div>

        {/* Filter Row */}
        {showFilters && (
          <div className="px-5 py-3 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 flex flex-wrap gap-3">
            {[
              { label: 'Priority', value: filterPriority, setter: setFilterPriority, options: [['all','Any Priority'],['high','High'],['medium','Medium'],['low','Low']] },
              { label: 'Status', value: filterStatus, setter: setFilterStatus, options: [['all','All Status'],['reported','Reported'],['in-progress','In Progress'],['repaired','Repaired']] },
              { label: 'Team', value: filterTeam, setter: setFilterTeam, options: [['all','All Teams'], ...FIELD_TEAMS.map(t => [t, t])] },
            ].map(({ label, value, setter, options }) => (
              <div key={label} className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">{label}</label>
                <select
                  value={value}
                  onChange={e => setter(e.target.value)}
                  className="h-9 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 text-xs font-bold text-slate-700 dark:text-slate-200 focus:ring-2 focus:ring-blue-500/20 outline-none"
                >
                  {options.map(([val, lbl]) => <option key={val} value={val}>{lbl}</option>)}
                </select>
              </div>
            ))}
          </div>
        )}

        {/* Bulk Action Bar */}
        {selected.size > 0 && (
          <div className="px-5 py-3 border-b border-blue-100 dark:border-blue-900/50 bg-blue-50/50 dark:bg-blue-950/20 flex flex-wrap items-center gap-3">
            <span className="text-sm font-black text-blue-700 dark:text-blue-400">{selected.size} selected</span>
            <select
              value={bulkTeam}
              onChange={e => setBulkTeam(e.target.value)}
              className="h-9 bg-white dark:bg-slate-800 border border-blue-200 dark:border-blue-800 rounded-xl px-3 text-xs font-bold text-slate-700 dark:text-slate-200 focus:ring-2 focus:ring-blue-500/20 outline-none"
            >
              <option value="">Assign to team…</option>
              {FIELD_TEAMS.map(team => <option key={team} value={team}>{team}</option>)}
            </select>
            <button
              onClick={handleBulkAssign}
              disabled={!bulkTeam}
              className="h-9 px-4 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-xs font-black rounded-xl transition-all flex items-center gap-1.5"
            >
              <Users className="w-3.5 h-3.5" /> Assign All
            </button>
            <button onClick={() => setSelected(new Set())} className="h-9 px-3 text-xs font-bold text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors ml-auto">
              Clear
            </button>
          </div>
        )}

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/50 dark:bg-slate-800/50">
                <th className="p-4 w-10">
                  <button onClick={toggleAll} className="text-slate-400 dark:text-slate-500 hover:text-blue-500 transition-colors">
                    {selected.size === filtered.length && filtered.length > 0 ? <CheckSquare className="w-4 h-4 text-blue-500" /> : <Square className="w-4 h-4" />}
                  </button>
                </th>
                <th className="p-4 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Location</th>
                <th className="p-4 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Priority</th>
                <th className="p-4 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Assign Team</th>
                <th className="p-4 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Detected</th>
                <th className="p-4 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50">
              {filtered.map(order => (
                <tr
                  key={order.id}
                  className={cn(
                    "hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors group",
                    selected.has(order.id) && "bg-blue-50/40 dark:bg-blue-950/10"
                  )}
                >
                  <td className="p-4">
                    <button onClick={() => toggleSelect(order.id)} className="text-slate-300 dark:text-slate-600 hover:text-blue-500 transition-colors">
                      {selected.has(order.id) ? <CheckSquare className="w-4 h-4 text-blue-500" /> : <Square className="w-4 h-4" />}
                    </button>
                  </td>
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center group-hover:bg-blue-50 dark:group-hover:bg-blue-900/30 transition-colors">
                        <Wrench className="w-4 h-4 text-slate-400 group-hover:text-blue-500 transition-colors" />
                      </div>
                      <div>
                        <div className="text-sm font-black text-slate-800 dark:text-slate-200">{order.locationName}</div>
                        <div className="text-xs font-bold text-slate-400 dark:text-slate-500">{order.city}, {order.state}</div>
                      </div>
                    </div>
                  </td>
                  <td className="p-4">
                    <span className={cn(
                      "text-[10px] font-black uppercase tracking-tight px-2 py-0.5 rounded-full border",
                      order.priority === 'high' ? "bg-red-50 dark:bg-red-950/30 text-red-600 dark:text-red-400 border-red-100 dark:border-red-900/50" :
                      order.priority === 'medium' ? "bg-orange-50 dark:bg-orange-950/30 text-orange-600 dark:text-orange-400 border-orange-100 dark:border-orange-900/50" :
                      "bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400 border-emerald-100 dark:border-emerald-900/50"
                    )}>
                      {order.priority}
                    </span>
                  </td>
                  <td className="p-4">
                    <select
                      value={order.assignedTeam || ''}
                      onChange={e => handleAssignTeam(order.id, e.target.value)}
                      className="h-9 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-2 text-xs font-bold text-slate-700 dark:text-slate-200 focus:ring-2 focus:ring-blue-500/20 outline-none"
                    >
                      <option value="">Unassigned</option>
                      {FIELD_TEAMS.map(team => <option key={team} value={team}>{team}</option>)}
                    </select>
                  </td>
                  <td className="p-4 text-sm font-bold text-slate-500 dark:text-slate-400">{formatDate(order.firstDetected)}</td>
                  <td className="p-4 text-right">
                    <div className="flex items-center gap-2 justify-end">
                      {order.status !== 'repaired' && (
                        <button
                          onClick={() => handleMarkRepaired(order.id)}
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-black rounded-lg shadow-sm shadow-emerald-200 dark:shadow-emerald-900/20 transition-all"
                        >
                          <CheckCircle2 className="w-3 h-3" /> Repaired
                        </button>
                      )}
                      {order.status === 'repaired' && (
                        <span className="text-[10px] font-black text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/30 px-2 py-1 rounded-lg">✓ Done</span>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filtered.length === 0 && (
            <div className="py-16 text-center text-slate-400 dark:text-slate-500 font-bold">No orders match the current filters.</div>
          )}
        </div>
      </div>
    </div>
  );
}
