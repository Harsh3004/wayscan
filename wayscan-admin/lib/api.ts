import { PotholeCluster, KPIStats, FilterState } from './types';
import { potholes as mockPotholes, mockDashboardStats } from './mock-data';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

let authToken: string | null = null;

export function setAuthToken(token: string | null) {
  authToken = token;
}

export function getAuthToken(): string | null {
  return authToken;
}

async function fetchWithAuth(endpoint: string, options: RequestInit = {}) {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> || {}),
  };

  if (authToken) {
    headers['Authorization'] = `Bearer ${authToken}`;
  }

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    throw new Error(`API Error: ${response.status}`);
  }

  return response.json();
}

export interface PotholesResponse {
  data: PotholeCluster[];
  total: number;
}

export async function fetchPotholes(filters?: Partial<FilterState>): Promise<PotholeCluster[]> {
  try {
    const params = new URLSearchParams();
    if (filters?.status && filters.status !== 'all') params.append('status', filters.status);
    if (filters?.priority && filters.priority !== 'all') params.append('priority', filters.priority);
    if (filters?.state && filters.state !== 'all') params.append('state', filters.state);
    if (filters?.city && filters.city !== 'all') params.append('city', filters.city);

    const queryString = params.toString();
    const endpoint = `/potholes${queryString ? `?${queryString}` : ''}`;

    const result = await fetchWithAuth(endpoint);
    if (result.data && Array.isArray(result.data)) {
      return result.data;
    }
    if (Array.isArray(result)) {
      return result;
    }
    throw new Error('Invalid response format');
  } catch (error) {
    console.warn('API fetch failed, using mock data:', error);
    return mockPotholes;
  }
}

export async function fetchDashboardStats(): Promise<KPIStats> {
  try {
    const result = await fetchWithAuth('/dashboard/stats');
    return {
      totalActive: result.totalActive ?? 0,
      criticalHazards: result.criticalHazards ?? 0,
      repairedThisMonth: result.repairedThisMonth ?? 0,
      avgResolutionTime: result.avgResolutionTime ?? 0,
      pendingSync: result.pendingSync ?? 0,
    };
  } catch (error) {
    console.warn('API fetch failed, using mock data:', error);
    return mockDashboardStats;
  }
}

export async function updatePothole(
  id: string,
  data: Partial<PotholeCluster>
): Promise<PotholeCluster | null> {
  try {
    const payload: Record<string, unknown> = {};
    if (data.status) payload.status = data.status;
    if (data.assignedTeam !== undefined) payload.assignedTeam = data.assignedTeam || null;
    if (data.notes !== undefined) payload.notes = data.notes;
    if (data.deadline) payload.deadline = data.deadline;
    if (data.internalNotes) payload.internalNotes = data.internalNotes;
    if (data.locationName) payload.locationName = data.locationName;
    if (data.city) payload.city = data.city;
    if (data.state) payload.state = data.state;

    console.log('Updating pothole:', id, 'with data:', payload);

    const result = await fetchWithAuth(`/potholes/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    });

    console.log('Update result:', result);
    return result;
  } catch (error) {
    console.error('API update failed:', error);
    return null;
  }
}

export async function login(username: string, password: string): Promise<{ success: boolean; user?: User; error?: string }> {
  try {
    const response = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    });

    const data = await response.json();
    if (!response.ok) {
      return { success: false, error: data.error || 'Invalid credentials' };
    }

    if (data.token && data.user) {
      setAuthToken(data.token);
      return { success: true, user: data.user };
    }
    return { success: false, error: 'Invalid response from server' };
  } catch (error) {
    return { success: false, error: 'Network error or server unreachable' };
  }
}

export async function signup(username: string, password: string): Promise<{ success: boolean; user?: User; error?: string }> {
  try {
    const response = await fetch(`${API_BASE}/auth/signup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    });

    const data = await response.json();
    if (!response.ok) {
      return { success: false, error: data.error || 'Failed to sign up' };
    }

    if (data.token && data.user) {
      setAuthToken(data.token);
      return { success: true, user: data.user };
    }
    return { success: false, error: 'Invalid response from server' };
  } catch (error) {
    return { success: false, error: 'Network error or server unreachable' };
  }
}

export async function fetchMe(): Promise<User | null> {
  try {
    const result = await fetchWithAuth('/auth/me');
    return result;
  } catch (error) {
    return null;
  }
}

export async function logout(): Promise<void> {
  setAuthToken(null);
}

export interface CityData { name: string; count: number; }
export interface MonthlyData { month: string; reported: number; repaired: number; resolved?: number; }
export interface PriorityData { name: string; count: number; color: string; }
export interface StatusData { name: string; count: number; color: string; }

export async function fetchCityDistribution(): Promise<CityData[]> {
  try {
    const result = await fetchWithAuth('/analytics/cities');
    if (result.data && Array.isArray(result.data)) {
      return result.data;
    }
    throw new Error('Invalid response');
  } catch (error) {
    console.warn('API fetch failed, using mock data:', error);
    return [
      { name: 'Mumbai', count: 156 },
      { name: 'Delhi', count: 142 },
      { name: 'Bengaluru', count: 98 },
      { name: 'Jabalpur', count: 62 },
      { name: 'Lucknow', count: 45 },
    ];
  }
}

export async function fetchMonthlyTrends(): Promise<MonthlyData[]> {
  try {
    const result = await fetchWithAuth('/analytics/monthly');
    if (result.data && Array.isArray(result.data)) {
      return result.data.map((m: { month: string; reported: number; resolved: number }) => ({
        month: m.month,
        reported: m.reported,
        repaired: m.resolved,
      }));
    }
    throw new Error('Invalid response');
  } catch (error) {
    console.warn('API fetch failed, using mock data:', error);
    return [
      { month: 'Oct', reported: 180, repaired: 140 },
      { month: 'Nov', reported: 210, repaired: 165 },
      { month: 'Dec', reported: 175, repaired: 190 },
      { month: 'Jan', reported: 240, repaired: 200 },
      { month: 'Feb', reported: 195, repaired: 220 },
      { month: 'Mar', reported: 260, repaired: 230 },
    ];
  }
}

export async function fetchPriorityDistribution(): Promise<PriorityData[]> {
  try {
    const result = await fetchWithAuth('/analytics/priority-distribution');
    if (result.data && Array.isArray(result.data)) {
      return result.data;
    }
    throw new Error('Invalid response');
  } catch (error) {
    console.warn('API fetch failed, using mock data:', error);
    return [
      { name: 'High', count: 14, color: '#ef4444' },
      { name: 'Medium', count: 28, color: '#f97316' },
      { name: 'Low', count: 20, color: '#10b981' },
    ];
  }
}

export async function fetchStatusDistribution(): Promise<StatusData[]> {
  try {
    const result = await fetchWithAuth('/analytics/status-distribution');
    if (result.data && Array.isArray(result.data)) {
      return result.data;
    }
    throw new Error('Invalid response');
  } catch (error) {
    console.warn('API fetch failed, using mock data:', error);
    return [
      { name: 'Open', count: 45, color: '#ef4444' },
      { name: 'In Progress', count: 22, color: '#3b82f6' },
      { name: 'Resolved', count: 33, color: '#10b981' },
    ];
  }
}