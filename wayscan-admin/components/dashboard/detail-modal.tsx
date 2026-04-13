'use client';

import React, { useState } from 'react';
import { 
  X, 
  MapPin, 
  Users, 
  Calendar, 
  Layers, 
  ExternalLink, 
  CheckCircle, 
  Truck, 
  AlertCircle,
  Clock,
  Navigation,
  Image as ImageIcon,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { PotholeCluster, Status } from '@/lib/types';
import { cn, formatDate } from '@/lib/utils';
import { motion } from 'framer-motion';
import { useLanguage } from '@/components/providers/language-provider';

interface DetailModalProps {
  pothole: PotholeCluster;
  onClose: () => void;
  onStatusChange: (id: string, status: Status) => void;
}

export default function DetailModal({ pothole, onClose, onStatusChange }: DetailModalProps) {
  const { t } = useLanguage();
  const [currentImage, setCurrentImage] = useState(0);

  const statusColors = {
    reported: 'bg-orange-50 dark:bg-orange-950/30 text-orange-700 dark:text-orange-400 border-orange-200 dark:border-orange-900/50',
    'in-progress': 'bg-blue-50 dark:bg-blue-950/30 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-900/50',
    repaired: 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-900/50',
  };

  const priorityColors = {
    high: 'text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-900/50',
    medium: 'text-orange-600 dark:text-orange-400 bg-orange-50 dark:bg-orange-950/30 border-orange-200 dark:border-orange-900/50',
    low: 'text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-900/50',
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 md:p-8">
      {/* Backdrop */}
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
      />

      {/* Modal Content */}
      <motion.div 
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 20 }}
        className="relative w-full max-w-5xl bg-white dark:bg-slate-900 rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col md:flex-row"
      >
        {/* Close Button */}
        <button 
          onClick={onClose}
          className="absolute top-6 right-6 z-30 p-2 bg-white/10 hover:bg-white/20 text-white rounded-full backdrop-blur-md border border-white/20 transition-all md:text-slate-400 md:dark:text-slate-400 md:hover:bg-slate-100 md:dark:hover:bg-slate-800 md:border-slate-200 md:dark:border-slate-700 md:bg-white md:dark:bg-slate-900"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Gallery Section */}
        <div className="md:w-1/2 bg-slate-900 relative min-h-[400px] md:min-h-full flex items-center justify-center group/gallery">
          {/* Main Display Image */}
          <div className="absolute inset-0 overflow-hidden">
             <motion.img 
               key={currentImage}
               initial={{ opacity: 0, scale: 1.1 }}
               animate={{ opacity: 1, scale: 1 }}
               src={pothole.images?.[currentImage] || `https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?q=80&w=1470&auto=format&fit=crop`} 
               alt="Pothole"
               className="w-full h-full object-cover opacity-60 transition-all duration-700"
             />
             <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-slate-950/40" />
          </div>
          
          <div className="relative z-10 p-6 w-full h-full flex flex-col">
            <div className="flex items-center justify-between mb-auto">
               <div className="flex items-center gap-2 bg-black/40 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/10">
                  <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                  <span className="text-[10px] font-black text-white uppercase tracking-widest">{t('dashboard.modal.evidence')} #00{currentImage + 1}</span>
               </div>
               <div className="text-[10px] font-black text-white/60 uppercase tracking-widest">CAM-ID-WX44</div>
            </div>

            <div className="mt-auto relative aspect-[4/3] bg-black/40 rounded-[2rem] overflow-hidden border border-white/10 shadow-2xl flex items-center justify-center group">
               <img 
                 src={pothole.images?.[currentImage] || `https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?q=80&w=1470&auto=format&fit=crop`} 
                 alt="Evidence"
                 className="w-full h-full object-cover"
               />
               
               {/* Slider Controls */}
               <div className="absolute inset-y-0 left-0 flex items-center pl-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button 
                    onClick={(e) => { e.stopPropagation(); setCurrentImage(prev => prev > 0 ? prev - 1 : 2); }}
                    className="p-2 rounded-full bg-white/10 hover:bg-white/90 text-white hover:text-slate-900 backdrop-blur-md transition-all"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>
               </div>
               <div className="absolute inset-y-0 right-0 flex items-center pr-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button 
                    onClick={(e) => { e.stopPropagation(); setCurrentImage(prev => prev < 2 ? prev + 1 : 0); }}
                    className="p-2 rounded-full bg-white/10 hover:bg-white/90 text-white hover:text-slate-900 backdrop-blur-md transition-all"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>
               </div>
               
               {/* Progress Indicators */}
               <div className="absolute bottom-4 inset-x-0 flex items-center justify-center gap-1.5">
                  {[0, 1, 2].map((i) => (
                    <div 
                      key={i} 
                      className={cn(
                        "h-1 rounded-full transition-all duration-300", 
                        i === currentImage ? "w-8 bg-blue-500" : "w-1.5 bg-white/30"
                      )} 
                    />
                  ))}
               </div>
            </div>
            
            <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-4 mt-6">
               <div className="flex items-center justify-between mb-3 border-b border-white/5 pb-2">
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
        <div className="md:w-1/2 p-6 md:p-10 flex flex-col max-h-[90vh] overflow-y-auto custom-scrollbar bg-white dark:bg-slate-900">
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-4">
               <span className={cn("text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full border", statusColors[pothole.status])}>
                 {t(`dashboard.modal.status.${pothole.status.replace('-', '_')}`)}
               </span>
               <span className={cn("text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full", priorityColors[pothole.priority])}>
                 {t(`dashboard.modal.priority.${pothole.priority}`)}
               </span>
            </div>
            
             <h2 className="text-4xl font-black text-slate-800 dark:text-slate-100 tracking-tight leading-none mb-3">
              {t(`data.locations.${pothole.locationName}`)}
            </h2>
            <div className="flex items-center gap-4 text-slate-400 font-bold text-xs">
              <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5 text-blue-500" /> {pothole.city}, {pothole.state}</span>
              <span className="w-px h-3 bg-slate-200" />
              <span className="flex items-center gap-1 uppercase tracking-widest font-black text-[10px]">{pothole.areaType} Area</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 mb-8">
            <div className="bg-blue-50/50 dark:bg-blue-900/20 p-5 rounded-3xl border border-blue-100/50 dark:border-blue-800/30 group/stat">
               <div className="flex items-center gap-2 text-blue-600/60 dark:text-blue-400/80 text-[10px] font-black uppercase tracking-widest mb-1.5 transition-colors group-hover/stat:text-blue-600 dark:group-hover/stat:text-blue-400">
                 <Users className="w-3.5 h-3.5" /> {t('dashboard.modal.unique_vehicles')}
               </div>
               <div className="text-3xl font-black text-slate-800 dark:text-slate-100">{pothole.uniqueVehicleCount}</div>
               <p className="text-[10px] font-bold text-blue-400 dark:text-blue-500 mt-1 uppercase">{t('dashboard.modal.primary_driver')}</p>
            </div>
            <div className="bg-slate-50 dark:bg-slate-800 p-5 rounded-3xl border border-slate-100 dark:border-slate-700 group/stat">
               <div className="flex items-center gap-2 text-slate-400 dark:text-slate-500 text-[10px] font-black uppercase tracking-widest mb-1.5 transition-colors group-hover/stat:text-slate-600 dark:group-hover/stat:text-slate-400">
                 <Layers className="w-3.5 h-3.5" /> {t('dashboard.modal.incident_cluster')}
               </div>
               <div className="text-3xl font-black text-slate-800 dark:text-slate-100">{pothole.totalReports}</div>
               <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 mt-1 uppercase">{t('dashboard.modal.total_reports_sweded')}</p>
            </div>
          </div>

          <div className="space-y-6 mb-10 text-sm">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
               <span className="font-bold text-slate-400 flex items-center gap-2 capitalize"><Clock className="w-4 h-4" /> {t('dashboard.modal.first_detected')}</span>
               <span className="font-bold text-slate-700 dark:text-slate-300">{formatDate(pothole.firstDetected)}</span>
            </div>
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
               <span className="font-bold text-slate-400 flex items-center gap-2 capitalize"><Navigation className="w-4 h-4" /> {t('dashboard.modal.assigned_team')}</span>
               <span className="font-bold text-blue-600 dark:text-blue-400">{pothole.assignedTeam || t('dashboard.modal.unassigned')}</span>
            </div>
            <div className="pt-2">
               <h4 className="font-black text-slate-800 dark:text-slate-200 text-xs uppercase tracking-widest mb-2 flex items-center gap-2">
                 <CheckCircle className="w-4 h-4 text-emerald-500" /> {t('dashboard.modal.admin_notes')}
               </h4>
               <p className="p-4 bg-slate-50 dark:bg-slate-800/80 rounded-2xl text-slate-600 dark:text-slate-300 font-medium italic border border-slate-100 dark:border-slate-700">
                 "{pothole.notes || t('dashboard.modal.no_notes')}"
               </p>
            </div>
          </div>

          <div className="mt-auto flex flex-col sm:flex-row gap-3">
             <div className="flex-1 space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">{t('dashboard.modal.change_status')}</label>
                 <select 
                  value={pothole.status}
                  onChange={(e) => onStatusChange(pothole.id, e.target.value as Status)}
                  className="w-full h-12 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 text-sm font-bold text-slate-700 dark:text-slate-200 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all shadow-sm"
                >
                  <option value="reported">{t('dashboard.modal.status.reported')}</option>
                  <option value="in-progress">{t('dashboard.modal.status.in_progress')}</option>
                  <option value="repaired">{t('dashboard.modal.status.repaired')}</option>
                </select>
             </div>
             
             <button className="sm:w-1/3 h-12 mt-auto bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-lg shadow-blue-200 transition-all flex items-center justify-center gap-2">
                <Truck className="w-4 h-4" /> {t('dashboard.modal.dispatch_team')}
             </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
