export type GoalType = 'consensus' | 'exploration' | 'brainstorming';
export type MeetingStatus = 'pending' | 'running' | 'completed' | 'failed';
export type Phase = 'opening' | 'discussion' | 'summary' | 'signature';

export interface Skill {
  id: string;
  name: string;
  avatar: string;
  expertise: string[];
  personality: string;
  prompt: string;
  signature: {
    style: string;
  };
  ownerId?: string;
  isDefault?: boolean;
  createdAt?: string;
}

export interface Meeting {
  id: string;
  topic: string;
  sourceData?: string;
  rounds: number;
  goalType: GoalType;
  status: MeetingStatus;
  createdAt: string;
  ownerId: string;
  skillIds: string[];
  currentRound: number;
  currentPhase: Phase;
  totalInputTokens?: number;
  totalOutputTokens?: number;
  durationSeconds?: number;
  startTime?: string;
  endTime?: string;
}

export interface Message {
  id: string;
  meetingId: string;
  skillId: string;
  skillName: string;
  skillAvatar: string;
  round: number;
  phase: Phase;
  content: string;
  signature?: string;
  createdAt: string;
}

export interface Report {
  id: string;
  meetingId: string;
  content: string;
  createdAt: string;
}

export interface DiscussionEvent {
  type: 'phase_change' | 'message' | 'round_change' | 'summary' | 'signature' | 'complete' | 'error';
  phase?: Phase;
  round?: number;
  message?: Message;
  content?: string;
  error?: string;
}
