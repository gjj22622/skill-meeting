/**
 * Centralized API client for Skill Meeting.
 * All HTTP calls go through here — no more localStorage.
 */

const BASE = '/api';

function getToken(): string | null {
  return localStorage.getItem('token');
}

async function request<T>(path: string, opts: RequestInit = {}): Promise<T> {
  const token = getToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(opts.headers as Record<string, string> || {}),
  };

  const res = await fetch(`${BASE}${path}`, { ...opts, headers });

  if (!res.ok) {
    const body = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(body.error || `HTTP ${res.status}`);
  }

  return res.json();
}

// ── Auth ─────────────────────────────────────────────────────────

export const auth = {
  login: (email: string, password: string) =>
    request<{ token: string; user: any }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }),

  register: (email: string, password: string, displayName: string) =>
    request<{ token: string; user: any }>('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ email, password, displayName }),
    }),

  me: () => request<any>('/auth/me'),
};

// ── Skills (user-facing) ────────────────────────────────────────

export const skills = {
  list: () => request<any[]>('/skills'),

  create: (data: {
    name: string;
    avatar: string;
    expertise: string[];
    personality: string;
    prompt: string;
    signature: { style: string };
  }) =>
    request<any>('/skills', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  remove: (id: string) =>
    request<{ success: boolean }>(`/skills/${id}`, { method: 'DELETE' }),
};

// ── Meetings ────────────────────────────────────────────────────

export const meetings = {
  list: () => request<any[]>('/meetings'),

  get: (id: string) => request<any>(`/meetings/${id}`),

  create: (data: {
    topic: string;
    sourceData?: string;
    rounds: number;
    goalType: string;
    skillIds: string[];
  }) =>
    request<any>('/meetings', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  remove: (id: string) =>
    request<{ success: boolean }>(`/meetings/${id}`, { method: 'DELETE' }),
};

// ── Admin ───────────────────────────────────────────────────────

export interface AdminStats {
  meetingCount: number;
  userCount: number;
  skillCount: number;
  totalInputTokens: number;
  totalOutputTokens: number;
  totalDuration: number;
}

export const admin = {
  stats: () => request<AdminStats>('/admin/stats'),

  meetings: () => request<any[]>('/admin/meetings'),
  deleteMeeting: (id: string) =>
    request<{ success: boolean }>(`/admin/meetings/${id}`, { method: 'DELETE' }),

  skills: () => request<any[]>('/admin/skills'),

  createSkill: (data: {
    name: string;
    avatar: string;
    expertise: string[];
    personality: string;
    prompt: string;
    signature: { style: string };
  }) =>
    request<any>('/admin/skills', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  updateSkill: (id: string, data: {
    name?: string;
    avatar?: string;
    expertise?: string[];
    personality?: string;
    prompt?: string;
    signature?: { style: string };
  }) =>
    request<any>(`/admin/skills/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  toggleSkill: (id: string) =>
    request<any>(`/admin/skills/${id}/toggle`, { method: 'PATCH' }),

  deleteSkill: (id: string) =>
    request<{ success: boolean }>(`/admin/skills/${id}`, { method: 'DELETE' }),

  users: () => request<any[]>('/admin/users'),
};
