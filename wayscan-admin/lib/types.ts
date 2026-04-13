export type Priority = 'high' | 'medium' | 'low';
export type Status = 'reported' | 'in-progress' | 'repaired';
export type AreaType = 'urban' | 'rural';

export interface PotholeCluster {
  id: string;
  lat: number;
  lng: number;
  locationName: string;
  city: string;
  state: string;
  priority: Priority;
  status: Status;
  areaType: AreaType;
  uniqueVehicleCount: number;
  totalReports: number;
  firstDetected: string;
  lastDetected: string;
  images: string[];
  notes?: string;
  assignedTeam?: string;
}

export interface FilterState {
  state: string;
  city: string;
  priority: string;
  status: string;
  areaType: string;
  timeRange: string;
  sortBy: 'priority' | 'date' | 'vehicles';
}

export interface KPIStats {
  totalActive: number;
  criticalHazards: number;
  repairedThisMonth: number;
  avgResolutionTime: number;
  pendingSync: number;
}
