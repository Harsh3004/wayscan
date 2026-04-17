import { appSchema, tableSchema } from '@nozbe/watermelondb';

export const schema = appSchema({
  version: 1,
  tables: [
    tableSchema({
      name: 'pothole_detections',
      columns: [
        { name: 'latitude', type: 'number' },
        { name: 'longitude', type: 'number' },
        { name: 'confidence', type: 'number' },
        { name: 'timestamp', type: 'number' },
        { name: 'device_id', type: 'string' },
        { name: 'image_url', type: 'string', isOptional: true },
        { name: 'synced', type: 'boolean' },
        { name: 'created_at', type: 'number' },
        { name: 'synced_at', type: 'number', isOptional: true },
      ],
    }),
    tableSchema({
      name: 'settings',
      columns: [
        { name: 'distance_filter_enabled', type: 'boolean' },
        { name: 'distance_filter_radius', type: 'number' },
        { name: 'device_id', type: 'string' },
      ],
    }),
  ],
});