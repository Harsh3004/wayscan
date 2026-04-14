import { KPIStats, PotholeCluster, Priority, Status } from './types';

export interface DashboardPotholeSnapshot {
  id: string;
  locationName: string;
  city: string;
  state: string;
  priority: Priority;
  status: Status;
  areaType: string;
  totalReports: number;
  uniqueVehicleCount: number;
  firstDetected: string;
  lastDetected: string;
  assignedTeam?: string;
  notes?: string;
  deadline?: string;
}

export interface CityBreakdownItem {
  city: string;
  state: string;
  count: number;
}

export interface DashboardChatContext {
  generatedAt: string;
  stats: KPIStats;
  latestDetection: DashboardPotholeSnapshot | null;
  recentDetections: DashboardPotholeSnapshot[];
  criticalPotholes: DashboardPotholeSnapshot[];
  cityBreakdown: CityBreakdownItem[];
  potholeClusters: DashboardPotholeSnapshot[];
}

export interface CompactDashboardChatContext {
  generatedAt: string;
  stats: KPIStats;
  latestDetection: DashboardPotholeSnapshot | null;
  recentDetections: DashboardPotholeSnapshot[];
  criticalPotholes: DashboardPotholeSnapshot[];
  cityBreakdown: CityBreakdownItem[];
  potholeClusters: Array<Pick<DashboardPotholeSnapshot, 'id' | 'locationName' | 'city' | 'state' | 'priority' | 'status' | 'totalReports' | 'uniqueVehicleCount' | 'lastDetected'>>;
}

const priorityRank: Record<Priority, number> = {
  high: 0,
  medium: 1,
  low: 2,
};

function toSnapshot(pothole: PotholeCluster): DashboardPotholeSnapshot {
  return {
    id: pothole.id,
    locationName: pothole.locationName,
    city: pothole.city,
    state: pothole.state,
    priority: pothole.priority,
    status: pothole.status,
    areaType: pothole.areaType,
    totalReports: pothole.totalReports,
    uniqueVehicleCount: pothole.uniqueVehicleCount,
    firstDetected: pothole.firstDetected,
    lastDetected: pothole.lastDetected,
    assignedTeam: pothole.assignedTeam,
    notes: pothole.notes,
    deadline: pothole.deadline,
  };
}

function sortByLastDetectedDesc(a: DashboardPotholeSnapshot, b: DashboardPotholeSnapshot): number {
  return new Date(b.lastDetected).getTime() - new Date(a.lastDetected).getTime();
}

export function buildDashboardChatContext(
  potholes: PotholeCluster[],
  stats: KPIStats,
): DashboardChatContext {
  const potholeClusters = potholes.map(toSnapshot).sort(sortByLastDetectedDesc);

  const cityCounts = new Map<string, CityBreakdownItem>();
  for (const pothole of potholeClusters) {
    const key = `${pothole.city}__${pothole.state}`;
    const current = cityCounts.get(key);
    if (current) {
      current.count += 1;
    } else {
      cityCounts.set(key, {
        city: pothole.city,
        state: pothole.state,
        count: 1,
      });
    }
  }

  const criticalPotholes = potholeClusters
    .filter(pothole => pothole.priority === 'high' && pothole.status !== 'repaired')
    .sort((a, b) => {
      const priorityComparison = priorityRank[a.priority] - priorityRank[b.priority];
      if (priorityComparison !== 0) return priorityComparison;
      return sortByLastDetectedDesc(a, b);
    })
    .slice(0, 5);

  return {
    generatedAt: new Date().toISOString(),
    stats,
    latestDetection: potholeClusters[0] ?? null,
    recentDetections: potholeClusters.slice(0, 5),
    criticalPotholes,
    cityBreakdown: Array.from(cityCounts.values()).sort((a, b) => {
      if (b.count !== a.count) return b.count - a.count;
      return a.city.localeCompare(b.city);
    }).slice(0, 5),
    potholeClusters,
  };
}

export function buildCompactDashboardChatContext(
  context: DashboardChatContext,
  clusterLimit: number = 8,
): CompactDashboardChatContext {
  return {
    generatedAt: context.generatedAt,
    stats: context.stats,
    latestDetection: context.latestDetection,
    recentDetections: context.recentDetections.slice(0, 5),
    criticalPotholes: context.criticalPotholes.slice(0, 5),
    cityBreakdown: context.cityBreakdown.slice(0, 5),
    potholeClusters: context.potholeClusters.slice(0, clusterLimit).map(
      ({ id, locationName, city, state, priority, status, totalReports, uniqueVehicleCount, lastDetected }) => ({
        id,
        locationName,
        city,
        state,
        priority,
        status,
        totalReports,
        uniqueVehicleCount,
        lastDetected,
      }),
    ),
  };
}
