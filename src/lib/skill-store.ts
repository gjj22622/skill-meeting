import { Skill } from './types';
import defaultSkills from '@/data/default-skills.json';

const STORAGE_KEY = 'skill-meeting-skills';
const DISABLED_KEY = 'skill-meeting-disabled';

// ============================================================
// localStorage helpers (fallback for unauthenticated users)
// ============================================================

export function getDefaultSkills(): Skill[] {
  return defaultSkills as Skill[];
}

/** Get IDs of disabled default skills */
function getDisabledIds(): Set<string> {
  if (typeof window === 'undefined') return new Set();
  const stored = localStorage.getItem(DISABLED_KEY);
  if (!stored) return new Set();
  try {
    return new Set(JSON.parse(stored) as string[]);
  } catch {
    return new Set();
  }
}

/** Save disabled IDs */
function saveDisabledIds(ids: Set<string>): void {
  localStorage.setItem(DISABLED_KEY, JSON.stringify([...ids]));
}

/** Toggle a default skill's active state (localStorage only) */
export function toggleDefaultSkill(id: string): boolean {
  const disabled = getDisabledIds();
  if (disabled.has(id)) {
    disabled.delete(id);
  } else {
    disabled.add(id);
  }
  saveDisabledIds(disabled);
  return !disabled.has(id); // returns new isActive state
}

/** Get all skills with isActive status (localStorage) */
export function getAllSkills(): Skill[] {
  const disabled = getDisabledIds();
  const defaults = getDefaultSkills().map((s) => ({
    ...s,
    isDefault: true,
    isActive: !disabled.has(s.id),
  }));

  if (typeof window === 'undefined') {
    return defaults;
  }
  const stored = localStorage.getItem(STORAGE_KEY);
  if (!stored) {
    return defaults;
  }
  try {
    const custom = JSON.parse(stored) as Skill[];
    return [...defaults, ...custom.map((s) => ({ ...s, isDefault: false, isActive: s.isActive !== false }))];
  } catch {
    return defaults;
  }
}

/** Get only active skills (localStorage, for meeting skill selection) */
export function getActiveSkills(): Skill[] {
  return getAllSkills().filter((s) => s.isActive !== false);
}

export function getCustomSkills(): Skill[] {
  if (typeof window === 'undefined') return [];
  const stored = localStorage.getItem(STORAGE_KEY);
  if (!stored) return [];
  try {
    return JSON.parse(stored) as Skill[];
  } catch {
    return [];
  }
}

export function saveCustomSkill(skill: Skill): void {
  const customs = getCustomSkills();
  const idx = customs.findIndex((s) => s.id === skill.id);
  if (idx >= 0) {
    customs[idx] = { ...skill, isActive: skill.isActive !== false };
  } else {
    customs.push({ ...skill, isActive: true });
  }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(customs));
}

export function deleteCustomSkill(id: string): void {
  const customs = getCustomSkills().filter((s) => s.id !== id);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(customs));
}

export function getSkillById(id: string): Skill | undefined {
  return getAllSkills().find((s) => s.id === id);
}

// ============================================================
// API-backed functions (for authenticated users)
// ============================================================

/** Fetch all skills from API (defaults + user's custom) */
export async function fetchSkillsFromApi(): Promise<Skill[]> {
  try {
    const res = await fetch('/api/skills', { credentials: 'include' });
    if (!res.ok) return [];
    return res.json();
  } catch {
    return [];
  }
}

/** Create a custom skill via API */
export async function createSkillViaApi(skill: Partial<Skill>): Promise<Skill | null> {
  try {
    const res = await fetch('/api/skills', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({
        name: skill.name,
        avatar: skill.avatar,
        expertise: skill.expertise,
        personality: skill.personality,
        prompt: skill.prompt,
        signature: skill.signature,
      }),
    });
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

/** Toggle custom skill's is_active via API */
export async function toggleCustomSkillApi(id: string, isActive: boolean): Promise<boolean> {
  try {
    const res = await fetch(`/api/skills/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ is_active: isActive }),
    });
    return res.ok;
  } catch {
    return false;
  }
}

/** Delete custom skill via API */
export async function deleteSkillViaApi(id: string): Promise<boolean> {
  try {
    const res = await fetch(`/api/skills/${id}`, {
      method: 'DELETE',
      credentials: 'include',
    });
    return res.ok;
  } catch {
    return false;
  }
}

// ============================================================
// Meeting storage (localStorage — unchanged)
// ============================================================

const MEETING_KEY = 'skill-meeting-meetings';

export function getMeetings() {
  if (typeof window === 'undefined') return [];
  const stored = localStorage.getItem(MEETING_KEY);
  if (!stored) return [];
  try {
    return JSON.parse(stored);
  } catch {
    return [];
  }
}

export function saveMeeting(meeting: unknown) {
  const meetings = getMeetings();
  const idx = meetings.findIndex((m: { id: string }) => m.id === (meeting as { id: string }).id);
  if (idx >= 0) {
    meetings[idx] = meeting;
  } else {
    meetings.push(meeting);
  }
  localStorage.setItem(MEETING_KEY, JSON.stringify(meetings));
}
