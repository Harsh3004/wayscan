import { Q } from '@nozbe/watermelondb';
import { database, potholeDetectionsCollection } from '../database';
import { PotholeDetection } from '../database/models';

const EARTH_RADIUS_METERS = 6371000;
const DISTANCE_FILTER_ENABLED = false;
const DISTANCE_FILTER_RADIUS_METERS = 5;
const API_URL = 'http://192.168.29.207:5000/sync';

function toRadians(degrees: number): number {
  return degrees * (Math.PI / 180);
}

function haversineDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const dLat = toRadians(lat2 - lat1);
  const dLon = toRadians(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return EARTH_RADIUS_METERS * c;
}

let lastProcessedCoordinate: { lat: number; lon: number } | null = null;
let isSyncing = false;
let deviceId = `device_${Date.now()}`;

export function setDeviceId(id: string): void {
  deviceId = id;
}

export function getDeviceId(): string {
  return deviceId;
}

export function isDistanceFilterEnabled(): boolean {
  return DISTANCE_FILTER_ENABLED;
}

export function getDistanceFilterRadius(): number {
  return DISTANCE_FILTER_RADIUS_METERS;
}

export async function shouldProcessPothole(
  lat: number,
  lon: number
): Promise<{ shouldProcess: boolean; reason: string }> {
  if (!DISTANCE_FILTER_ENABLED) {
    return { shouldProcess: true, reason: 'distance_filter_disabled' };
  }

  if (!lastProcessedCoordinate) {
    const queue = await getQueuedDetections();
    if (queue.length > 0) {
      const last = queue[queue.length - 1];
      lastProcessedCoordinate = { lat: last.latitude, lon: last.longitude };
    }
  }

  if (!lastProcessedCoordinate) {
    return { shouldProcess: true, reason: 'first_detection' };
  }

  const distance = haversineDistance(
    lat,
    lon,
    lastProcessedCoordinate.lat,
    lastProcessedCoordinate.lon
  );

  if (distance < DISTANCE_FILTER_RADIUS_METERS) {
    return { shouldProcess: false, reason: 'within_radius' };
  }

  return { shouldProcess: true, reason: 'outside_radius' };
}

export function updateLastProcessedCoordinate(lat: number, lon: number): void {
  lastProcessedCoordinate = { lat, lon };
}

export async function addDetectionToQueue(
  lat: number,
  lon: number,
  confidence: number,
  timestamp: number
): Promise<void> {
  await database.write(async () => {
    await potholeDetectionsCollection.create((p: PotholeDetection) => {
      p.latitude = lat;
      p.longitude = lon;
      p.confidence = confidence;
      p.timestamp = timestamp;
      p.deviceId = deviceId;
      p.imageUrl = null;
      p.synced = false;
    });
  });
  updateLastProcessedCoordinate(lat, lon);
}

export async function getQueuedDetections(): Promise<PotholeDetection[]> {
  return potholeDetectionsCollection
    .query(Q.where('synced', false), Q.sortBy('created_at', Q.asc))
    .fetch();
}

export async function clearQueueAndGetDetections(): Promise<PotholeDetection[]> {
  const queue = await getQueuedDetections();
  if (queue.length === 0) return [];
  
  await database.write(async () => {
    const deletions = queue.map((r) => r.prepareDestroyPermanently());
    await database.batch(...deletions);
  });
  
  return queue;
}

export async function deleteDetections(ids: string[]): Promise<void> {
  if (ids.length === 0) return;
  await database.write(async () => {
    const records = await potholeDetectionsCollection.query(Q.where('id', Q.oneOf(ids))).fetch();
    const deletions = records.map((r) => r.prepareDestroyPermanently());
    await database.batch(...deletions);
  });
}

export async function getQueuedCount(): Promise<number> {
  return potholeDetectionsCollection.query(Q.where('synced', false)).fetchCount();
}

async function sendToBackend(detection: PotholeDetection): Promise<{ success: boolean; syncedId: string }> {
  const payload = {
    lat: detection.latitude,
    lon: detection.longitude,
    confidence: detection.confidence,
    timestamp: detection.timestamp,
    processed: false,
    device_id: deviceId,
    image_url: detection.imageUrl,
  };

  console.log('[Sync] Payload sent:', JSON.stringify(payload));

  try {
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    const responseText = await response.text();
    console.log('[Sync] Response:', responseText);

    if (response.ok) {
      return { success: true, syncedId: detection.id };
    }
    
    console.warn('[PotholeService] Backend error:', response.status);
    return { success: false, syncedId: '' };
  } catch (error) {
    console.error('[PotholeService] Network error:', error);
    return { success: false, syncedId: '' };
  }
}

export async function processOnline(isConnected: boolean): Promise<{ synced: number; failed: number }> {
  if (!isConnected) {
    return { synced: 0, failed: 0 };
  }

  if (isSyncing) {
    return { synced: 0, failed: 0 };
  }

  isSyncing = true;
  let totalSynced = 0;
  let totalFailed = 0;

  try {
    const queue = await getQueuedDetections();
    
    if (queue.length === 0) {
      isSyncing = false;
      return { synced: 0, failed: 0 };
    }

    for (const detection of queue) {
      const result = await sendToBackend(detection);
      
      if (result.success) {
        await deleteDetections([result.syncedId]);
        totalSynced++;
        lastProcessedCoordinate = null;
      } else {
        totalFailed = queue.length - totalSynced;
        break;
      }
    }
  } finally {
    isSyncing = false;
  }

  return { synced: totalSynced, failed: totalFailed };
}