export interface SkillSignature {
  style: string; // template string with {name}, {expertise}
}

export interface Skill {
  id: string;
  name: string;
  avatar: string;
  expertise: string[];
  personality: string;
  prompt: string;
  signature: SkillSignature;
  isDefault?: boolean;
  isActive?: boolean;
}

export type MeetingGoal = 'consensus' | 'explore' | 'brainstorm';
export type MeetingStatus = 'draft' | 'in_progress' | 'completed';
export type DiscussionPhase = 'opening' | 'discussion' | 'summary';

export interface Meeting {
  id: string;
  topic: string;
  sourceData: string;
  skillIds: string[];
  rounds: number;
  goalType: MeetingGoal;
  status: MeetingStatus;
  createdAt: string;
  messages: MeetingMessage[];
  report?: MeetingReport;
}

export interface MeetingMessage {
  id: string;
  skillId: string;
  skillName: string;
  skillAvatar: string;
  phase: DiscussionPhase;
  round?: number;
  content: string;
  timestamp: string;
}

export interface MeetingReport {
  topic: string;
  date: string;
  participants: { name: string; avatar: string }[];
  totalRounds: number;
  consensus: string;
  disagreements: string;
  openQuestions: string;
  signatures: string[];
  fullTranscript: MeetingMessage[];
}

export interface DiscussionEvent {
  type: 'phase' | 'message_start' | 'message_delta' | 'message_end' | 'report' | 'done' | 'error';
  phase?: DiscussionPhase;
  round?: number;
  skillId?: string;
  skillName?: string;
  skillAvatar?: string;
  content?: string;
  report?: MeetingReport;
  error?: string;
}
