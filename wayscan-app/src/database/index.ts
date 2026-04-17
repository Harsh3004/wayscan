import { Database } from '@nozbe/watermelondb';
import SQLiteAdapter from '@nozbe/watermelondb/adapters/sqlite';
import { schema } from './schema';
import { PotholeDetection, Settings } from './models';

const adapter = new SQLiteAdapter({
  schema,
  dbName: 'wayscan',
  jsi: true,
  onSetUpError: (error) => {
    console.error('WatermelonDB setup error:', error);
  },
});

export const database = new Database({
  adapter,
  modelClasses: [PotholeDetection, Settings],
});

export const potholeDetectionsCollection = database.get<PotholeDetection>('pothole_detections');
export const settingsCollection = database.get<Settings>('settings');