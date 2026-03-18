import { Skill } from './types';
import defaultSkills from '@/data/default-skills.json';

const STORAGE_KEY = 'skill-meeting-skills';

export function getDefaultSkills(): Skill[] {
  return defaultSkills as Skill[];
}

export function getAllSkills(): Skill[] {
  if (typeof window === 'undefined') {
    return getDefaultSkills();
  }
  const stored = localStorage.getItem(STORAGE_KEY);
  if (!stored) {
    return getDefaultSkills();
  }
  try {
    const custom = JSON.parse(stored) as Skill[];
    return [...getDefaultSkills(), ...custom];
  } catch {
    return getDefaultSkills();
  }
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
    customs[idx] = skill;
  } else {
    customs.push(skill);
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
