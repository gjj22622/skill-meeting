import { Skill } from './types';
import defaultSkills from '@/data/default-skills.json';

const STORAGE_KEY = 'skill-meeting-skills';
const DISABLED_KEY = 'skill-meeting-disabled';

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

/** Toggle a default skill's active state */
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

/** Get all skills with isActive status */
export function getAllSkills(): Skill[] {
  const disabled = getDisabledIds();
  const defaults = getDefaultSkills().map((s) => ({
    ...s,
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
    return [...defaults, ...custom.map((s) => ({ ...s, isActive: s.isActive !== false }))];
  } catch {
    return defaults;
  }
}

/** Get only active skills (for meeting skill selection) */
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
