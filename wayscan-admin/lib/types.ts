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
  internalNotes?: string[];
  deadline?: string;
}

export interface FilterState {
  state: string;
  city: string;
  priority: string;
  status: string;
  areaType: string;
  timeRange: string;
  sortBy: 'priority' | 'date' | 'vehicles' | 'status';
  sortHighPriority: boolean;
}

export interface KPIStats {
  totalActive: number;
  criticalHazards: number;
  repairedThisMonth: number;
  avgResolutionTime: number;
  pendingSync: number;
}

export interface AppUser {
  id: number;
  name: string;
  role: 'admin' | 'field_officer' | 'viewer';
  zone: string;
  email: string;
  status: 'active' | 'offline' | 'inactive';
  lastActive?: string;
  assignedZone?: string;
}

export interface AlertItem {
  id: string;
  type: 'high_priority' | 'unresolved_7d' | 'queue_overflow' | 'system';
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  potholeId?: string;
}

export type SortDirection = 'asc' | 'desc';
