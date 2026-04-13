'use client';

import React, { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import 'leaflet/dist/leaflet.css';
import { PotholeCluster } from '@/lib/types';
import { cn } from '@/lib/utils';
import { MapPin, Info, Navigation } from 'lucide-react';
import { useLanguage } from '@/components/providers/language-provider';

import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';

interface PriorityMapProps {
  data: PotholeCluster[];
  selectedId: string | null;
  onMarkerClick: (pothole: PotholeCluster) => void;
  overrideCenter?: [number, number] | null;
}

// Center of India roughly
const DEFAULT_CENTER: [number, number] = [21.0, 78.9629];

// Component to handle map view changes
function MapController({ center }: { center: [number, number] }) {
  const map = (useMap as any)();
  useEffect(() => {
    if (center) {
      map.flyTo(center, 14, { duration: 1.5 });
    }
  }, [center, map]);
  return null;
}

export default function PriorityMap({ data, selectedId, onMarkerClick, overrideCenter }: PriorityMapProps) {
  const { t } = useLanguage();
  const [L, setL] = useState<any>(null);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    import('leaflet').then((leaflet) => {
      setL(leaflet);
      setIsMounted(true);
    });
  }, []);

  const selectedItem = data.find(p => p.id === selectedId);
  const mapCenter: [number, number] = overrideCenter ? overrideCenter : selectedItem ? [selectedItem.lat, selectedItem.lng] : DEFAULT_CENTER;

  if (!isMounted || !L) {
    return (
      <div className="w-full h-full bg-slate-100 dark:bg-slate-800/50 rounded-3xl flex flex-col items-center justify-center border-2 border-white dark:border-slate-800 shadow-inner animate-pulse">
        <Navigation className="w-12 h-12 text-slate-300 dark:text-slate-600 animate-bounce" />
        <p className="mt-4 font-bold text-slate-400 dark:text-slate-500 capitalize">{t('dashboard.map.initializing')}</p>
      </div>
    );
  }

  // Create custom icon function
  const createIcon = (priority: string, isSelected: boolean) => {
    const color = priority === 'high' ? '#ef4444' : priority === 'medium' ? '#f97316' : '#10b981';
    const size = isSelected ? 40 : 32;
    
    const sizeClass = isSelected ? 'w-10 h-10' : 'w-8 h-8';
    
    return L.divIcon({
      className: 'custom-div-icon',
      html: `
        <div class="relative flex items-center justify-center">
          <div class="absolute w-full h-full rounded-full animate-ping opacity-20" style="background-color: ${color}"></div>
          <div class="relative ${sizeClass} rounded-full border-4 border-white shadow-xl flex items-center justify-center transition-all duration-300 transform ${isSelected ? 'scale-125' : 'hover:scale-110'}" style="background-color: ${color};">
             <svg xmlns="http://www.w3.org/2000/svg" width="${size/2}" height="${size/2}" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-map-pin"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>
          </div>
        </div>
      `,
      iconSize: [size, size],
      iconAnchor: [size/2, size],
    });
  };

  return (
    <div className="w-full h-full relative group">
      <MapContainer 
        center={DEFAULT_CENTER} 
        zoom={5} 
        style={{ height: '100%', width: '100%' }}
        scrollWheelZoom={true}
        className="z-10"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        
        <MapController center={mapCenter} />

        {data.map((pothole) => (
          <Marker
            key={pothole.id}
            position={[pothole.lat, pothole.lng]}
            icon={createIcon(pothole.priority, selectedId === pothole.id)}
            eventHandlers={{
              click: () => onMarkerClick(pothole),
            }}
          >
            <Popup className="custom-popup">
              <div className="p-1 min-w-[200px]">
                <div className="flex items-center justify-between mb-2">
                  <span className={cn(
                    "text-[10px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded",
                    pothole.priority === 'high' ? "bg-red-100 text-red-600" :
                    pothole.priority === 'medium' ? "bg-orange-100 text-orange-600" :
                    "bg-emerald-100 text-emerald-600"
                  )}>
                    {t(`dashboard.modal.priority.${pothole.priority}`)}
                  </span>
                  <span className="text-[10px] font-bold text-slate-400 capitalize">{pothole.areaType}</span>
                </div>
                <h4 className="font-bold text-slate-800 text-sm mb-1">{t(`data.locations.${pothole.locationName}`)}</h4>
                <div className="flex items-center gap-3 text-xs text-slate-500 font-semibold mb-2">
                  <span className="flex items-center gap-1"><Navigation className="w-3 h-3" /> {pothole.city}</span>
                  <span className="flex items-center gap-1"><Info className="w-3 h-3" /> {pothole.uniqueVehicleCount} Detects</span>
                </div>
                <button 
                  onClick={() => onMarkerClick(pothole)}
                  className="w-full py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-[10px] font-bold uppercase rounded-lg transition-colors"
                >
                  {t('dashboard.map.view_details')}
                </button>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>

      {/* Map Legend Overlay */}
      <div className="absolute bottom-6 left-6 z-20 bg-white/90 dark:bg-slate-900/90 backdrop-blur shadow-xl border border-slate-200 dark:border-slate-800 rounded-2xl p-4 hidden md:block">
        <h5 className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-3">{t('dashboard.map.legend_title')}</h5>
        <div className="space-y-2.5">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-red-500 shadow-sm shadow-red-200 dark:shadow-red-900/50" />
            <span className="text-xs font-bold text-slate-700 dark:text-slate-300">{t('dashboard.map.high')} (10+ {t('dashboard.map.vehicles')})</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-orange-500 shadow-sm shadow-orange-200 dark:shadow-orange-900/50" />
            <span className="text-xs font-bold text-slate-700 dark:text-slate-300">{t('dashboard.map.medium')} (4-9 {t('dashboard.map.vehicles')})</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-emerald-500 shadow-sm shadow-emerald-200 dark:shadow-emerald-900/50" />
            <span className="text-xs font-bold text-slate-700 dark:text-slate-300">{t('dashboard.map.low')} (1-3 {t('dashboard.map.vehicles')})</span>
          </div>
        </div>
      </div>
    </div>
  );
}
