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
    if (data.assignedTeam) payload.assignedTeam = data.assignedTeam;
    if (data.notes !== undefined) payload.notes = data.notes;
    if (data.deadline) payload.deadline = data.deadline;
    if (data.internalNotes) payload.internalNotes = data.internalNotes;
    if (data.locationName) payload.locationName = data.locationName;
    if (data.city) payload.city = data.city;
    if (data.state) payload.state = data.state;

    const result = await fetchWithAuth(`/potholes/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    });
    return result;
  } catch (error) {
    console.warn('API update failed:', error);
    return null;
  }
}

export async function login(username: string, password: string): Promise<boolean> {
  try {
    const response = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    });

    if (!response.ok) return false;

    const data = await response.json();
    if (data.token) {
      setAuthToken(data.token);
      return true;
    }
    return false;
  } catch {
    return false;
  }
}

export async function logout(): Promise<void> {
  setAuthToken(null);
}