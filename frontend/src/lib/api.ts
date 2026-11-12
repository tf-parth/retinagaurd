import {
  User,
  ScreeningCase,
  ScreeningListResponse,
  DashboardMetrics,
  SimulationParams,
  SimulationResult
} from './types';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';

function getAuthHeader(): Record<string, string> {
  if (typeof window === 'undefined') return {};
  const token = localStorage.getItem('retinaguard_token');
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export const api = {
  // Auth
  async login(email: string, password: string):Promise<{ access_token: string; user: User }> {
    const res = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: 'Login failed' }));
      throw new Error(err.detail || 'Login failed');
    }
    return res.json();
  },

  async register(data: { email: string; password: string; full_name: string; role: string; facility_name?: string }): Promise<User> {
    const res = await fetch(`${API_BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: 'Registration failed' }));
      throw new Error(err.detail || 'Registration failed');
    }
    return res.json();
  },

  async getMe(): Promise<User> {
    const res = await fetch(`${API_BASE_URL}/auth/me`, {
      headers: { ...getAuthHeader() },
    });
    if (!res.ok) throw new Error('Failed to load user profile');
    return res.json();
  },

  // Screenings
  async uploadScreening(formData: FormData): Promise<ScreeningCase> {
    const res = await fetch(`${API_BASE_URL}/screenings`, {
      method: 'POST',
      headers: { ...getAuthHeader() },
      body: formData,
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: 'Screening upload failed' }));
      throw new Error(err.detail || 'Screening upload failed');
    }
    return res.json();
  },

  async getScreening(id: string): Promise<ScreeningCase> {
    const res = await fetch(`${API_BASE_URL}/screenings/${id}`, {
      headers: { ...getAuthHeader() },
    });
    if (!res.ok) throw new Error('Case not found');
    return res.json();
  },

  async listScreenings(page = 1, pageSize = 20, search?: string, referableOnly?: boolean): Promise<ScreeningListResponse> {
    const params = new URLSearchParams({
      page: page.toString(),
      page_size: pageSize.toString(),
    });
    if (search) params.append('search', search);
    if (referableOnly !== undefined) params.append('referable_only', referableOnly.toString());

    const res = await fetch(`${API_BASE_URL}/screenings?${params.toString()}`, {
      headers: { ...getAuthHeader() },
    });
    if (!res.ok) throw new Error('Failed to fetch screenings');
    return res.json();
  },

  getReportDownloadUrl(id: string): string {
    return `${API_BASE_URL}/screenings/${id}/report`;
  },

  // Dashboard & Health
  async getDashboardMetrics(): Promise<DashboardMetrics> {
    const res = await fetch(`${API_BASE_URL}/dashboard/metrics`, {
      headers: { ...getAuthHeader() },
    });
    if (!res.ok) throw new Error('Failed to load dashboard metrics');
    return res.json();
  },

  async getHealth(): Promise<any> {
    const res = await fetch(`${API_BASE_URL}/health`);
    if (!res.ok) throw new Error('Health check failed');
    return res.json();
  },

  // Operational Simulation
  async runSimulation(params: SimulationParams): Promise<SimulationResult> {
    const res = await fetch(`${API_BASE_URL}/simulation/run`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    });
    if (!res.ok) throw new Error('Failed to run operational simulation');
    return res.json();
  },
};
