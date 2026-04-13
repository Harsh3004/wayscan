'use client';

import React, { useEffect, useState, useCallback, useRef } from 'react';
import { PotholeCluster } from '@/lib/types';
import { cn } from '@/lib/utils';
import { Navigation, Maximize2, Minimize2, Crosshair, Layers } from 'lucide-react';
import { useLanguage } from '@/components/providers/language-provider';
import { MapContainer, TileLayer, Marker, Popup, Tooltip, useMap } from 'react-leaflet';

interface PriorityMapProps {
  data: PotholeCluster[];
  selectedId: string | null;
  onMarkerClick: (pothole: PotholeCluster) => void;
  overrideCenter?: [number, number] | null;
  isFullscreen?: boolean;
  onToggleFullscreen?: () => void;
}

const DEFAULT_CENTER: [number, number] = [22.5, 80.0];

// ─── Map-internal controller: flyTo / fitBounds ───────────────────────
function MapController({
  center,
  zoom,
  fitAll,
  data,
}: {
  center: [number, number];
  zoom: number;
  fitAll: boolean;
  data: PotholeCluster[];
}) {
  const map = useMap();
  const prevCenter = useRef<string>('');
  const prevFitAll = useRef(false);

  useEffect(() => {
    const key = `${center[0]},${center[1]},${zoom}`;
    if (key === prevCenter.current) return;
    prevCenter.current = key;
    map.flyTo(center, zoom, { duration: 1.2 });
  }, [center, zoom, map]);

  useEffect(() => {
    if (fitAll && !prevFitAll.current && data.length > 0) {
      const lats = data.map(d => d.lat);
      const lngs = data.map(d => d.lng);
      map.fitBounds(
        [
          [Math.min(...lats) - 0.8, Math.min(...lngs) - 0.8],
          [Math.max(...lats) + 0.8, Math.max(...lngs) + 0.8],
        ],
        { padding: [48, 48], duration: 1.2 }
      );
    }
    prevFitAll.current = fitAll;
  }, [fitAll, data, map]);

  return null;
}

// ─── Map Resizer: Fixes the gray tiles issue with Framer Motion ────────
function MapResizer() {
  const map = useMap();
  
  useEffect(() => {
    // Force Leaflet to recalculate its size after framer-motion animations finish
    const timeoutId = setTimeout(() => {
      map.invalidateSize();
    }, 400);

    return () => clearTimeout(timeoutId);
  }, [map]);

  return null;
}

export default function PriorityMap({
  data,
  selectedId,
  onMarkerClick,
  overrideCenter,
  isFullscreen,
  onToggleFullscreen,
}: PriorityMapProps) {
  const { t } = useLanguage();
  const [L, setL] = useState<any>(null);
  const [isMounted, setIsMounted] = useState(false);
  const [areaFilter, setAreaFilter] = useState<'all' | 'urban' | 'rural'>('all');
  const [fitAll, setFitAll] = useState(false);

  useEffect(() => {
    import('leaflet').then(leaflet => {
      // Fix Leaflet default icon paths for Next.js
      delete (leaflet.Icon.Default.prototype as any)._getIconUrl;
      leaflet.Icon.Default.mergeOptions({
        iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
        iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
        shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
      });
      setL(leaflet);
      setIsMounted(true);
    });
  }, []);

  const selectedItem = data.find(p => p.id === selectedId);
  const mapCenter: [number, number] = overrideCenter
    ? overrideCenter
    : selectedItem
    ? [selectedItem.lat, selectedItem.lng]
    : DEFAULT_CENTER;
  const mapZoom = selectedItem ? 14 : 5;

  const visibleData = areaFilter === 'all' ? data : data.filter(d => d.areaType === areaFilter);

  const createIcon = useCallback(
    (priority: string, isSelected: boolean) => {
      if (!L) return null;
      const color =
        priority === 'high' ? '#ef4444' : priority === 'medium' ? '#f97316' : '#10b981';
      const size = isSelected ? 42 : 32;
      return L.divIcon({
        className: 'custom-div-icon',
        html: `
          <div style="position:relative;width:${size}px;height:${size}px;display:flex;align-items:center;justify-content:center">
            ${isSelected ? `<div style="position:absolute;inset:0;border-radius:50%;background:${color};opacity:0.25;animation:ping 1s cubic-bezier(0,0,0.2,1) infinite"></div>` : ''}
            <div style="position:relative;width:${size}px;height:${size}px;border-radius:50%;background:${color};border:3px solid white;box-shadow:0 4px 14px rgba(0,0,0,0.25);display:flex;align-items:center;justify-content:center">
              <svg xmlns="http://www.w3.org/2000/svg" width="${size / 2.5}" height="${size / 2.5}" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>
            </div>
          </div>`,
        iconSize: [size, size],
        iconAnchor: [size / 2, size],
        popupAnchor: [0, -size],
      });
    },
    [L]
  );

  if (!isMounted || !L) {
    return (
      <div className="w-full h-full bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-900 rounded-3xl flex flex-col items-center justify-center border border-slate-200 dark:border-slate-700 animate-pulse">
        <Navigation className="w-10 h-10 text-slate-300 dark:text-slate-600 animate-bounce" />
        <p className="mt-4 font-bold text-slate-400 dark:text-slate-500 text-sm">
          {t('dashboard.map.initializing')}
        </p>
      </div>
    );
  }

  return (
    <div className="relative w-full h-full rounded-3xl overflow-hidden" style={{ minHeight: 480 }}>

      {/* ── Map ── */}
      <MapContainer
        center={DEFAULT_CENTER}
        zoom={5}
        scrollWheelZoom
        style={{ height: '100%', width: '100%' }}
        className="rounded-3xl"
        zoomControl={false}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          maxZoom={19}
        />

        {/* This MapResizer fixes the empty gray tile issue */}
        <MapResizer />

        <MapController
          center={mapCenter}
          zoom={mapZoom}
          fitAll={fitAll}
          data={visibleData}
        />

        {visibleData.map(pothole => (
          <Marker
            key={pothole.id}
            position={[pothole.lat, pothole.lng]}
            icon={createIcon(pothole.priority, selectedId === pothole.id)}
            eventHandlers={{ click: () => onMarkerClick(pothole) }}
          >
            {/* Hover tooltip */}
            <Tooltip
              direction="top"
              offset={[0, -8]}
              permanent={false}
              className="leaflet-custom-tooltip"
            >
              <span
                className={cn(
                  'text-[9px] font-black uppercase px-1.5 py-0.5 rounded mr-1.5',
                  pothole.priority === 'high'
                    ? 'bg-red-100 text-red-600'
                    : pothole.priority === 'medium'
                    ? 'bg-orange-100 text-orange-600'
                    : 'bg-emerald-100 text-emerald-600'
                )}
              >
                {t(`dashboard.modal.priority.${pothole.priority}`)}
              </span>
              <span className="font-bold text-slate-800">{pothole.locationName}</span>
            </Tooltip>

            {/* Click popup */}
            <Popup className="custom-popup" minWidth={220}>
              <div className="p-3">
                <div className="flex items-center justify-between mb-2 gap-2">
                  <span
                    className={cn(
                      'text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full',
                      pothole.priority === 'high'
                        ? 'bg-red-100 text-red-600'
                        : pothole.priority === 'medium'
                        ? 'bg-orange-100 text-orange-600'
                        : 'bg-emerald-100 text-emerald-600'
                    )}
                  >
                    {t(`dashboard.modal.priority.${pothole.priority}`)}
                  </span>
                  <span className="text-[10px] font-bold text-slate-400 capitalize">
                    {pothole.areaType}
                  </span>
                </div>
                <h4 className="font-bold text-slate-800 text-sm mb-1 leading-tight">
                  {pothole.locationName}
                </h4>
                <div className="flex items-center gap-3 text-xs text-slate-500 font-semibold mb-3">
                  <span>{pothole.city}, {pothole.state}</span>
                  <span className="text-blue-600 font-black">
                    {pothole.uniqueVehicleCount} {t('dashboard.map.vehicles')}
                  </span>
                </div>
                <button
                  onClick={() => onMarkerClick(pothole)}
                  className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white text-[11px] font-black uppercase rounded-xl transition-colors"
                >
                  {t('dashboard.map.view_details')}
                </button>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>

      {/* ── Overlay Controls (z-index: 800, OUTSIDE MapContainer) ── */}

      {/* Top-center: Urban/Rural toggle */}
      <div className="map-control-layer" style={{ top: 12, left: '50%', transform: 'translateX(-50%)' }}>
        <div className="flex items-center gap-1 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border border-slate-200 dark:border-slate-600 rounded-2xl p-1 shadow-xl">
          {(['all', 'urban', 'rural'] as const).map(mode => (
            <button
              key={mode}
              onClick={() => setAreaFilter(mode)}
              className={cn(
                'px-4 py-1.5 rounded-xl text-[11px] font-black uppercase tracking-wide transition-all',
                areaFilter === mode
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-200'
                  : 'text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
              )}
            >
              {mode === 'all'
                ? t('dashboard.filters.all')
                : mode === 'urban'
                ? t('dashboard.filters.urban')
                : t('dashboard.filters.rural')}
            </button>
          ))}
        </div>
      </div>

      {/* Top-right: Fullscreen */}
      {onToggleFullscreen && (
        <div className="map-control-layer" style={{ top: 12, right: 12 }}>
          <button
            onClick={onToggleFullscreen}
            title={isFullscreen ? 'Exit fullscreen' : 'Fullscreen'}
            className="w-10 h-10 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border border-slate-200 dark:border-slate-600 rounded-xl shadow-xl flex items-center justify-center text-slate-600 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>
        </div>
      )}

      {/* Right-side: Cluster zoom + Locate me */}
      <div className="map-control-layer flex flex-col gap-2" style={{ right: 12, bottom: 80 }}>
        {/* Cluster zoom */}
        <button
          onClick={() => {
            setFitAll(true);
            setTimeout(() => setFitAll(false), 100);
          }}
          title="Zoom to all markers"
          className="w-10 h-10 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border border-slate-200 dark:border-slate-600 rounded-xl shadow-xl flex items-center justify-center text-slate-600 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
        >
          <Layers className="w-4 h-4" />
        </button>

        {/* Locate me */}
        <button
          onClick={() => {
            navigator.geolocation?.getCurrentPosition(
              pos => {
                // Will trigger MapController via a state update is complex;
                // Instead directly dispatch a custom event
                const event = new CustomEvent('wayscan:locate', {
                  detail: { lat: pos.coords.latitude, lng: pos.coords.longitude },
                });
                window.dispatchEvent(event);
              },
              () => {
                const event = new CustomEvent('wayscan:locate', {
                  detail: { lat: 23.1815, lng: 79.9864 },
                });
                window.dispatchEvent(event);
              }
            );
          }}
          title="Locate me"
          className="w-10 h-10 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border border-slate-200 dark:border-slate-600 rounded-xl shadow-xl flex items-center justify-center text-slate-600 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
        >
          <Crosshair className="w-4 h-4" />
        </button>
      </div>

      {/* Bottom-left: Legend */}
      <div className="map-control-layer hidden md:block" style={{ bottom: 24, left: 12 }}>
        <div className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border border-slate-200 dark:border-slate-700 rounded-2xl p-3 shadow-xl">
          <h5 className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2">
            {t('dashboard.map.legend_title')}
          </h5>
          <div className="space-y-1.5">
            {[
              { color: '#ef4444', label: `${t('dashboard.map.high')} (10+)` },
              { color: '#f97316', label: `${t('dashboard.map.medium')} (4–9)` },
              { color: '#10b981', label: `${t('dashboard.map.low')} (1–3)` },
            ].map(({ color, label }) => (
              <div key={label} className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full shadow-sm" style={{ background: color }} />
                <span className="text-[10px] font-bold text-slate-700 dark:text-slate-300">
                  {label}
                </span>
              </div>
            ))}
          </div>
          <div className="mt-2 pt-2 border-t border-slate-100 dark:border-slate-800 text-[9px] font-black text-slate-400 uppercase">
            {visibleData.length} {t('dashboard.map.unique_detections')}
          </div>
        </div>
      </div>
    </div>
  );
}