import { useEffect, useState, useRef } from 'react';
import { KPIStats } from '@/lib/types';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001';

export function useRealtimeStats(initialStats: KPIStats, enabled: boolean = true) {
  const [stats, setStats] = useState<KPIStats>(initialStats);
  const [connected, setConnected] = useState(false);
  const eventSourceRef = useRef<EventSource | null>(null);

  useEffect(() => {
    if (!enabled) return;

    const connect = () => {
      const eventSource = new EventSource(`${API_BASE}/events/stream`);

      eventSourceRef.current = eventSource;

      eventSource.onopen = () => {
        setConnected(true);
      };

      eventSource.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          setStats({
            totalActive: data.totalActive ?? stats.totalActive,
            criticalHazards: data.criticalHazards ?? stats.criticalHazards,
            repairedThisMonth: data.repairedThisMonth ?? stats.repairedThisMonth,
            avgResolutionTime: data.avgResolutionTime ?? stats.avgResolutionTime,
            pendingSync: data.pendingSync ?? stats.pendingSync,
          });
        } catch (error) {
          console.warn('Failed to parse SSE data:', error);
        }
      };

      eventSource.onerror = () => {
        setConnected(false);
        eventSource.close();
        setTimeout(connect, 5000);
      };
    };

    connect();

    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
      }
    };
  }, [enabled]);

  return { stats, connected };
}