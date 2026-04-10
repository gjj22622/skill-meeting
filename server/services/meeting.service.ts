import { prisma } from '../lib/prisma.js';
import { NotFoundError, ForbiddenError } from '../middleware/error.js';

export async function list(ownerId: string) {
  return prisma.meeting.findMany({
    where: { ownerId },
    orderBy: { createdAt: 'desc' },
  });
}

export async function get(id: string) {
  const meeting = await prisma.meeting.findUnique({ where: { id } });
  if (!meeting) throw new NotFoundError('會議不存在');
  return meeting;
}

export async function getOwned(id: string, userId: string) {
  const meeting = await get(id);
  if (meeting.ownerId !== userId) throw new ForbiddenError('無權存取此會議');
  return meeting;
}

export async function create(data: {
  topic: string;
  sourceData?: string;
  rounds: number;
  goalType: string;
  skillIds: string[];
  ownerId: string;
}) {
  return prisma.meeting.create({
    data: {
      topic: data.topic,
      sourceData: data.sourceData || null,
      rounds: data.rounds,
      goalType: data.goalType,
      skillIds: JSON.stringify(data.skillIds),
      ownerId: data.ownerId,
      status: 'pending',
      currentRound: 0,
      currentPhase: 'opening',
    },
  });
}

export async function update(id: string, updates: Record<string, any>) {
  return prisma.meeting.update({ where: { id }, data: updates });
}

export async function remove(id: string) {
  // Cascade will delete messages and reports
  return prisma.meeting.delete({ where: { id } });
}

export async function getMessages(meetingId: string) {
  return prisma.message.findMany({
    where: { meetingId },
    orderBy: { createdAt: 'asc' },
  });
}

export async function addMessage(meetingId: string, data: {
  skillId: string;
  skillName: string;
  skillAvatar: string;
  round: number;
  phase: string;
  content: string;
  signature?: string;
}) {
  return prisma.message.create({
    data: { meetingId, ...data },
  });
}

export async function getReports(meetingId: string) {
  return prisma.report.findMany({
    where: { meetingId },
    orderBy: { createdAt: 'asc' },
  });
}

export async function addReport(meetingId: string, content: string) {
  return prisma.report.create({
    data: { meetingId, content },
  });
}
