/**
 * localStorage-based data store to replace Firestore.
 * Provides similar API patterns (CRUD, real-time subscriptions via polling).
 */

import { Meeting, Message, Skill, Report } from '../types';
import { v4 as uuidv4 } from 'uuid';

// ── helpers ──────────────────────────────────────────────────────────
function load<T>(key: string): T[] {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function save<T>(key: string, data: T[]) {
  localStorage.setItem(key, JSON.stringify(data));
  // Dispatch a storage event so other tabs / subscribers can react
  window.dispatchEvent(new CustomEvent('store-change', { detail: { key } }));
}

// ── Generic subscription (polling-free, event-based) ─────────────────
type Unsubscribe = () => void;

export function subscribe<T>(key: string, cb: (items: T[]) => void): Unsubscribe {
  // Fire immediately with current data
  cb(load<T>(key));

  const handler = (e: Event) => {
    const detail = (e as CustomEvent).detail;
    if (detail?.key === key) {
      cb(load<T>(key));
    }
  };

  window.addEventListener('store-change', handler);
  // Also listen to native storage events (other tabs)
  const storageHandler = (e: StorageEvent) => {
    if (e.key === key) cb(load<T>(key));
  };
  window.addEventListener('storage', storageHandler);

  return () => {
    window.removeEventListener('store-change', handler);
    window.removeEventListener('storage', storageHandler);
  };
}

// ── Meetings ─────────────────────────────────────────────────────────
const MEETINGS_KEY = 'skill-meeting:meetings';

export function getMeetings(ownerId?: string): Meeting[] {
  const all = load<Meeting>(MEETINGS_KEY);
  return ownerId ? all.filter(m => m.ownerId === ownerId) : all;
}

export function getMeeting(id: string): Meeting | undefined {
  return load<Meeting>(MEETINGS_KEY).find(m => m.id === id);
}

export function addMeeting(data: Omit<Meeting, 'id'>): Meeting {
  const meetings = load<Meeting>(MEETINGS_KEY);
  const meeting: Meeting = { ...data, id: uuidv4() };
  meetings.push(meeting);
  save(MEETINGS_KEY, meetings);
  return meeting;
}

export function updateMeeting(id: string, updates: Partial<Meeting>) {
  const meetings = load<Meeting>(MEETINGS_KEY);
  const idx = meetings.findIndex(m => m.id === id);
  if (idx >= 0) {
    meetings[idx] = { ...meetings[idx], ...updates };
    save(MEETINGS_KEY, meetings);
  }
}

export function deleteMeeting(id: string) {
  save(MEETINGS_KEY, load<Meeting>(MEETINGS_KEY).filter(m => m.id !== id));
  // Also clean up sub-collections
  localStorage.removeItem(`skill-meeting:messages:${id}`);
  localStorage.removeItem(`skill-meeting:reports:${id}`);
  window.dispatchEvent(new CustomEvent('store-change', { detail: { key: `skill-meeting:messages:${id}` } }));
  window.dispatchEvent(new CustomEvent('store-change', { detail: { key: `skill-meeting:reports:${id}` } }));
}

export function subscribeMeetings(ownerId: string, cb: (items: Meeting[]) => void): Unsubscribe {
  return subscribe<Meeting>(MEETINGS_KEY, (all) => {
    cb(all.filter(m => m.ownerId === ownerId).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
  });
}

export function subscribeMeeting(id: string, cb: (m: Meeting | null) => void): Unsubscribe {
  return subscribe<Meeting>(MEETINGS_KEY, (all) => {
    cb(all.find(m => m.id === id) || null);
  });
}

export function subscribeAllMeetings(cb: (items: Meeting[]) => void): Unsubscribe {
  return subscribe<Meeting>(MEETINGS_KEY, cb);
}

// ── Messages (per meeting) ───────────────────────────────────────────
function messagesKey(meetingId: string) {
  return `skill-meeting:messages:${meetingId}`;
}

export function getMessages(meetingId: string): Message[] {
  return load<Message>(messagesKey(meetingId)).sort(
    (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
  );
}

export function addMessage(meetingId: string, data: Message) {
  const key = messagesKey(meetingId);
  const msgs = load<Message>(key);
  msgs.push(data);
  save(key, msgs);
}

export function subscribeMessages(meetingId: string, cb: (items: Message[]) => void): Unsubscribe {
  return subscribe<Message>(messagesKey(meetingId), (all) => {
    cb(all.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()));
  });
}

// ── Reports (per meeting) ────────────────────────────────────────────
function reportsKey(meetingId: string) {
  return `skill-meeting:reports:${meetingId}`;
}

export function getReports(meetingId: string): Report[] {
  return load<Report>(reportsKey(meetingId));
}

export function addReport(meetingId: string, data: Report) {
  const key = reportsKey(meetingId);
  const reports = load<Report>(key);
  reports.push(data);
  save(key, reports);
}

export function subscribeReports(meetingId: string, cb: (items: Report[]) => void): Unsubscribe {
  return subscribe<Report>(reportsKey(meetingId), cb);
}

// ── Skills (user-created) ────────────────────────────────────────────
const SKILLS_KEY = 'skill-meeting:skills';

export function getSkills(ownerId?: string): Skill[] {
  const all = load<Skill>(SKILLS_KEY);
  return ownerId ? all.filter(s => s.ownerId === ownerId) : all;
}

export function getSkill(id: string): Skill | undefined {
  return load<Skill>(SKILLS_KEY).find(s => s.id === id);
}

export function addSkill(data: Omit<Skill, 'id'> & { id?: string }): Skill {
  const skills = load<Skill>(SKILLS_KEY);
  const skill: Skill = { ...data, id: data.id || uuidv4() };
  skills.push(skill);
  save(SKILLS_KEY, skills);
  return skill;
}

export function deleteSkill(id: string) {
  save(SKILLS_KEY, load<Skill>(SKILLS_KEY).filter(s => s.id !== id));
}

export function subscribeSkills(ownerId: string, cb: (items: Skill[]) => void): Unsubscribe {
  return subscribe<Skill>(SKILLS_KEY, (all) => {
    cb(all.filter(s => s.ownerId === ownerId));
  });
}

export function subscribeAllSkills(cb: (items: Skill[]) => void): Unsubscribe {
  return subscribe<Skill>(SKILLS_KEY, cb);
}
