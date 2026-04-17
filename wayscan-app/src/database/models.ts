import { Model } from '@nozbe/watermelondb';
import { field, date } from '@nozbe/watermelondb/decorators';

export class PotholeDetection extends Model {
  static table = 'pothole_detections';

  @field('latitude') latitude!: number;
  @field('longitude') longitude!: number;
  @field('confidence') confidence!: number;
  @field('timestamp') timestamp!: number;
  @field('device_id') deviceId!: string;
  @field('image_url') imageUrl!: string | null;
  @field('synced') synced!: boolean;
  @date('created_at') createdAt!: Date;
  @field('synced_at') syncedAt!: number | null;
}

export class Settings extends Model {
  static table = 'settings';

  @field('distance_filter_enabled') distanceFilterEnabled!: boolean;
  @field('distance_filter_radius') distanceFilterRadius!: number;
  @field('device_id') deviceId!: string;
}