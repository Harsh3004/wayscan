'use client';

import React, { useState } from 'react';
import {
  X, MapPin, Users, Calendar, Layers, CheckCircle, Truck,
  AlertCircle, Clock, Navigation, ChevronLeft, ChevronRight,
  Share2, MessageSquare, Send, UserCheck, Wrench
} from 'lucide-react';
import { PotholeCluster, Status } from '@/lib/types';
import { cn, formatDate } from '@/lib/utils';
import { motion } from 'framer-motion';
import { useLanguage } from '@/components/providers/language-provider';
import { FIELD_TEAMS } from '@/lib/mock-data';
import { updatePothole } from '@/lib/api';

interface DetailModalProps {
  pothole: PotholeCluster;
  onClose: () => void;
  onStatusChange: (id: string, status: Status) => void;
}

export default function DetailModal({ pothole, onClose, onStatusChange }: DetailModalProps) {
  const { t } = useLanguage();
  const [currentImage, setCurrentImage] = useState(0);
  const [noteInput, setNoteInput] = useState('');
  const [notes, setNotes] = useState<string[]>(pothole.internalNotes || []);
  const [assignedTeam, setAssignedTeam] = useState(pothole.assignedTeam || '');
  const [copied, setCopied] = useState(false);

  const statusColors: Record<Status, string> = {
    reported: 'bg-orange-50 dark:bg-orange-950/30 text-orange-700 dark:text-orange-400 border-orange-200 dark:border-orange-900/50',
    'in-progress': 'bg-blue-50 dark:bg-blue-950/30 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-900/50',
    repaired: 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-900/50',
  };

  const priorityColors: Record<string, string> = {
    high: 'text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-900/50',
    medium: 'text-orange-600 dark:text-orange-400 bg-orange-50 dark:bg-orange-950/30 border-orange-200 dark:border-orange-900/50',
    low: 'text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-900/50',
  };

  const handleAddNote = () => {
    if (!noteInput.trim()) return;
    const newNotes = [...notes, noteInput.trim()];
    setNotes(newNotes);
    setNoteInput('');
    updatePothole(pothole.id, { internalNotes: newNotes });
  };

  const handleShareReport = () => {
    navigator.clipboard.writeText(`WayScan Report: ${pothole.locationName} — ID #${pothole.id}\nPriority: ${pothole.priority}\nStatus: ${pothole.status}\nCoords: ${pothole.lat}, ${pothole.lng}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleMarkRepaired = () => {
    onStatusChange(pothole.id, 'repaired');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 md:p-8">
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
      />

      {/* Modal */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 16 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 16 }}
        className="relative w-full max-w-5xl bg-white dark:bg-slate-900 rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col md:flex-row max-h-[90vh]"
      >
        {/* Close */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 z-30 p-2 bg-white/10 hover:bg-white/20 text-white rounded-full backdrop-blur-md border border-white/20 transition-all md:bg-white md:dark:bg-slate-800 md:text-slate-500 md:dark:text-slate-400 md:border-slate-200 md:dark:border-slate-700 md:hover:bg-slate-100 md:dark:hover:bg-slate-700"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Gallery */}
        <div className="md:w-5/12 bg-slate-900 relative min-h-[280px] md:min-h-full flex items-center justify-center flex-shrink-0">
          <div className="absolute inset-0 overflow-hidden">
            <motion.img
              key={currentImage}
              initial={{ opacity: 0, scale: 1.05 }}
              animate={{ opacity: 1, scale: 1 }}
              src={pothole.images?.[currentImage] || `https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?q=80&w=1470&auto=format&fit=crop`}
              alt="Pothole evidence"
              className="w-full h-full object-cover opacity-60"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-slate-950/40" />
          </div>

          <div className="relative z-10 p-5 w-full h-full flex flex-col">
            <div className="flex items-center justify-between mb-auto">
              <div className="flex items-center gap-2 bg-black/40 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/10">
                <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                <span className="text-[10px] font-black text-white uppercase tracking-widest">Evidence #{String(currentImage + 1).padStart(2, '0')}</span>
              </div>
              <div className="text-[10px] font-black text-white/60 uppercase tracking-widest">CAM-ID-WX44</div>
            </div>

            <div className="mt-auto relative aspect-[4/3] bg-black/40 rounded-2xl overflow-hidden border border-white/10 shadow-2xl flex items-center justify-center group">
              <img
                src={pothole.images?.[currentImage] || `https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?q=80&w=1470&auto=format&fit=crop`}
                alt="Evidence"
                className="w-full h-full object-cover"
              />
              {/* Navigation */}
              <div className="absolute inset-y-0 left-0 flex items-center pl-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <button onClick={(e) => { e.stopPropagation(); setCurrentImage(p => p > 0 ? p - 1 : 2); }} className="p-1.5 rounded-full bg-white/10 hover:bg-white/90 text-white hover:text-slate-900 transition-all">
                  <ChevronLeft className="w-4 h-4" />
                </button>
              </div>
              <div className="absolute inset-y-0 right-0 flex items-center pr-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <button onClick={(e) => { e.stopPropagation(); setCurrentImage(p => p < 2 ? p + 1 : 0); }} className="p-1.5 rounded-full bg-white/10 hover:bg-white/90 text-white hover:text-slate-900 transition-all">
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
              <div className="absolute bottom-3 inset-x-0 flex items-center justify-center gap-1.5">
                {[0, 1, 2].map(i => (
                  <div key={i} className={cn("h-1 rounded-full transition-all duration-300", i === currentImage ? "w-6 bg-blue-500" : "w-1.5 bg-white/30")} />
                ))}
              </div>
            </div>

            <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-3 mt-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-bold text-white/50 uppercase tracking-widest">{t('dashboard.modal.dashcam_timestamp')}</span>
                <span className="text-xs font-black text-white">{formatDate(pothole.lastDetected)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-white/50 uppercase tracking-widest">{t('dashboard.modal.confidence_score')}</span>
                <span className="text-xs font-black text-emerald-400">98.4% {t('dashboard.modal.accuracy')}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Info Section */}
        <div className="flex-1 flex flex-col overflow-y-auto custom-scrollbar bg-white dark:bg-slate-900">
          <div className="p-6 md:p-8 flex-1">
            {/* Title Block */}
            <div className="mb-6">
              <div className="flex items-center gap-2 mb-3">
                <span className={cn("text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full border", statusColors[pothole.status])}>
                  {t(`dashboard.modal.status.${pothole.status.replace('-', '_')}`)}
                </span>
                <span className={cn("text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full border", priorityColors[pothole.priority])}>
                  {t(`dashboard.modal.priority.${pothole.priority}`)}
                </span>
              </div>
              <h2 className="text-2xl md:text-3xl font-black text-slate-800 dark:text-slate-100 tracking-tight leading-tight mb-2">
                {pothole.locationName}
              </h2>
              <div className="flex items-center gap-3 text-slate-400 font-bold text-xs">
                <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5 text-blue-500" />{pothole.city}, {pothole.state}</span>
                <span className="w-px h-3 bg-slate-200 dark:bg-slate-700" />
                <span className="uppercase tracking-widest font-black text-[10px]">{pothole.areaType} Area</span>
              </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 gap-3 mb-6">
              <div className="bg-blue-50/60 dark:bg-blue-900/20 p-4 rounded-2xl border border-blue-100/50 dark:border-blue-800/30">
                <div className="text-blue-600/60 dark:text-blue-400/80 text-[10px] font-black uppercase tracking-widest mb-1 flex items-center gap-1.5">
                  <Users className="w-3 h-3" />{t('dashboard.modal.unique_vehicles')}
                </div>
                <div className="text-2xl font-black text-slate-800 dark:text-slate-100">{pothole.uniqueVehicleCount}</div>
              </div>
              <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-2xl border border-slate-100 dark:border-slate-700">
                <div className="text-slate-400 text-[10px] font-black uppercase tracking-widest mb-1 flex items-center gap-1.5">
                  <Layers className="w-3 h-3" />{t('dashboard.modal.incident_cluster')}
                </div>
                <div className="text-2xl font-black text-slate-800 dark:text-slate-100">{pothole.totalReports}</div>
              </div>
            </div>

            {/* Details */}
            <div className="space-y-3 mb-6 text-sm">
              <div className="flex items-center justify-between py-3 border-b border-slate-100 dark:border-slate-800">
                <span className="font-bold text-slate-400 flex items-center gap-2"><Clock className="w-4 h-4" />{t('dashboard.modal.first_detected')}</span>
                <span className="font-bold text-slate-700 dark:text-slate-300">{formatDate(pothole.firstDetected)}</span>
              </div>
{/* Assign Team Dropdown */}
  <div className="flex items-center justify-between py-3 border-b border-slate-100 dark:border-slate-800 gap-3">
    <span className="font-bold text-slate-400 flex items-center gap-2 flex-shrink-0"><UserCheck className="w-4 h-4" />Assign Team</span>
    <select
      value={assignedTeam}
      onChange={e => {
        setAssignedTeam(e.target.value);
        updatePothole(pothole.id, { assignedTeam: e.target.value || undefined });
      }}
      className="h-9 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 text-xs font-bold text-slate-700 dark:text-slate-200 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all"
    >
      <option value="">{t('dashboard.modal.unassigned')}</option>
      {FIELD_TEAMS.map(team => (
        <option key={team} value={team}>{team}</option>
      ))}
    </select>
  </div>
            </div>

            {/* Internal Notes */}
            <div className="mb-6">
              <h4 className="font-black text-slate-800 dark:text-slate-200 text-xs uppercase tracking-widest mb-3 flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-blue-500" /> Internal Notes
              </h4>
              {notes.length > 0 && (
                <div className="space-y-2 mb-3">
                  {notes.map((note, i) => (
                    <div key={i} className="p-3 bg-slate-50 dark:bg-slate-800/80 rounded-xl border border-slate-100 dark:border-slate-700 text-xs font-medium text-slate-600 dark:text-slate-300 flex items-start gap-2">
                      <span className="text-blue-400 font-black mt-0.5">—</span>
                      {note}
                    </div>
                  ))}
                </div>
              )}
              <div className="flex gap-2">
                <input
                  type="text"
                  value={noteInput}
                  onChange={e => setNoteInput(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleAddNote()}
                  placeholder="Add internal note…"
                  className="flex-1 h-9 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 text-xs font-medium text-slate-700 dark:text-slate-200 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all"
                />
                <button
                  onClick={handleAddNote}
                  className="w-9 h-9 bg-blue-600 hover:bg-blue-700 text-white rounded-xl flex items-center justify-center shadow-md shadow-blue-200 dark:shadow-blue-900/20 transition-colors"
                >
                  <Send className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>

          {/* Quick Actions Footer */}
          <div className="p-5 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 space-y-3">
            {/* Status Selector */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{t('dashboard.modal.change_status')}</label>
              <select
                value={pothole.status}
                onChange={(e) => onStatusChange(pothole.id, e.target.value as Status)}
                className="w-full h-10 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 text-sm font-bold text-slate-700 dark:text-slate-200 focus:ring-2 focus:ring-blue-500/20 outline-none shadow-sm"
              >
                <option value="reported">{t('dashboard.modal.status.reported')}</option>
                <option value="in-progress">{t('dashboard.modal.status.in_progress')}</option>
                <option value="repaired">{t('dashboard.modal.status.repaired')}</option>
              </select>
            </div>

            {/* Action Buttons */}
            <div className="grid grid-cols-3 gap-2">
              <button
                onClick={handleMarkRepaired}
                className="h-11 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-lg shadow-emerald-200 dark:shadow-emerald-900/20 transition-all flex items-center justify-center gap-1.5"
              >
                <Wrench className="w-3.5 h-3.5" />
                Repaired
              </button>
              <button
                className="h-11 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-lg shadow-blue-200 dark:shadow-blue-900/20 transition-all flex items-center justify-center gap-1.5"
              >
                <Truck className="w-3.5 h-3.5" />
                Dispatch
              </button>
              <button
                onClick={handleShareReport}
                className={cn(
                  "h-11 font-bold text-xs rounded-xl border transition-all flex items-center justify-center gap-1.5",
                  copied
                    ? "bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-900/50"
                    : "bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700"
                )}
              >
                <Share2 className="w-3.5 h-3.5" />
                {copied ? 'Copied!' : 'Share'}
              </button>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
