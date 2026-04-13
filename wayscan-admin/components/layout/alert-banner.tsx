'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, Clock, Zap, X, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { mockAlerts, potholes, mockDashboardStats } from '@/lib/mock-data';
import { AlertItem } from '@/lib/types';

interface ActiveBanner {
  id: string;
  type: AlertItem['type'];
  title: string;
  message: string;
}

const TYPE_CONFIG = {
  high_priority: {
    icon: AlertTriangle,
    bg: 'bg-red-500',
    border: 'border-red-600',
    text: 'text-white',
  },
  unresolved_7d: {
    icon: Clock,
    bg: 'bg-orange-500',
    border: 'border-orange-600',
    text: 'text-white',
  },
  queue_overflow: {
    icon: Zap,
    bg: 'bg-blue-600',
    border: 'border-blue-700',
    text: 'text-white',
  },
  system: {
    icon: Zap,
    bg: 'bg-slate-700',
    border: 'border-slate-800',
    text: 'text-white',
  },
};

function buildActiveBanners(): ActiveBanner[] {
  const banners: ActiveBanner[] = [];

  // Check for high-priority unresolved
  const highPriority = potholes.filter(p => p.priority === 'high' && p.status !== 'repaired');
  if (highPriority.length > 0) {
    banners.push({
      id: 'auto-high',
      type: 'high_priority',
      title: `${highPriority.length} Critical Hazards Active`,
      message: `${highPriority[0].locationName} and ${highPriority.length - 1} other locations need immediate attention.`,
    });
  }

  // Check for unresolved > 7 days
  const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
  const longUnresolved = potholes.filter(
    p => p.status === 'reported' && new Date(p.firstDetected).getTime() < sevenDaysAgo
  );
  if (longUnresolved.length > 0) {
    banners.push({
      id: 'auto-7d',
      type: 'unresolved_7d',
      title: `${longUnresolved.length} Reports Unresolved for 7+ Days`,
      message: `Oldest: ${longUnresolved[0].locationName}. Consider escalating.`,
    });
  }

  // Check if queue > 50
  if (mockDashboardStats.pendingSync > 50) {
    banners.push({
      id: 'auto-queue',
      type: 'queue_overflow',
      title: 'Sync Queue Critical',
      message: `Queue has ${mockDashboardStats.pendingSync} pending reports. Force sync recommended.`,
    });
  }

  return banners;
}

export default function AlertBanner() {
  const [banners, setBanners] = useState<ActiveBanner[]>([]);
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    setBanners(buildActiveBanners());
  }, []);

  const visible = banners.filter(b => !dismissed.has(b.id));

  if (visible.length === 0) return null;

  const current = visible[currentIndex % visible.length];
  const cfg = TYPE_CONFIG[current.type];
  const Icon = cfg.icon;

  const dismiss = (id: string) => {
    setDismissed(prev => new Set(prev).add(id));
    setCurrentIndex(0);
  };

  return (
    <AnimatePresence>
      <motion.div
        key={current.id}
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -8 }}
        className={cn(
          "flex items-center gap-3 px-4 py-3 border-b",
          cfg.bg, cfg.border, cfg.text
        )}
      >
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <Icon className="w-4 h-4 flex-shrink-0 opacity-90" />
          <span className="font-black text-sm">{current.title}</span>
          <span className="text-sm opacity-80 hidden md:inline truncate">— {current.message}</span>
        </div>

        <div className="flex items-center gap-2 flex-shrink-0">
          {visible.length > 1 && (
            <button
              onClick={() => setCurrentIndex(i => (i + 1) % visible.length)}
              className="flex items-center gap-1 text-xs font-black opacity-80 hover:opacity-100 bg-white/20 hover:bg-white/30 px-2 py-1 rounded-lg transition-all"
            >
              {currentIndex + 1}/{visible.length} <ChevronRight className="w-3 h-3" />
            </button>
          )}
          <button
            onClick={() => dismiss(current.id)}
            className="p-1 rounded-lg bg-white/20 hover:bg-white/30 transition-all opacity-80 hover:opacity-100"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
