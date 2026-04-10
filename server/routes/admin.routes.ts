import { Router, Request, Response, NextFunction } from 'express';
import { prisma } from '../lib/prisma.js';
import * as meetingService from '../services/meeting.service.js';
import * as skillService from '../services/skill.service.js';

const router = Router();

// ── Stats ───────────────────────────────────────────────────────

// GET /api/admin/stats
router.get('/stats', async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const [meetingCount, userCount, skillCount] = await Promise.all([
      prisma.meeting.count(),
      prisma.user.count(),
      prisma.skill.count(),
    ]);

    const meetings = await prisma.meeting.findMany({
      select: { totalInputTokens: true, totalOutputTokens: true, durationSeconds: true },
    });

    const totalInputTokens = meetings.reduce((acc, m) => acc + m.totalInputTokens, 0);
    const totalOutputTokens = meetings.reduce((acc, m) => acc + m.totalOutputTokens, 0);
    const totalDuration = meetings.reduce((acc, m) => acc + (m.durationSeconds || 0), 0);

    res.json({
      meetingCount,
      userCount,
      skillCount,
      totalInputTokens,
      totalOutputTokens,
      totalDuration,
    });
  } catch (err) { next(err); }
});

// ── Meetings ────────────────────────────────────────────────────

// GET /api/admin/meetings
router.get('/meetings', async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const meetings = await prisma.meeting.findMany({
      include: { owner: { select: { displayName: true, email: true } } },
      orderBy: { createdAt: 'desc' },
    });
    res.json(meetings);
  } catch (err) { next(err); }
});

// DELETE /api/admin/meetings/:id
router.delete('/meetings/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    await meetingService.remove(req.params.id as string);
    res.json({ success: true });
  } catch (err) { next(err); }
});

// ── Skills (Admin CRUD for system defaults) ─────────────────────

// GET /api/admin/skills — list ALL skills (with owner info + isActive)
router.get('/skills', async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const skills = await prisma.skill.findMany({
      include: { owner: { select: { displayName: true, email: true } } },
      orderBy: { createdAt: 'asc' },
    });
    const parsed = skills.map(s => ({
      ...s,
      expertise: JSON.parse(s.expertise),
      signature: JSON.parse(s.signature),
    }));
    res.json(parsed);
  } catch (err) { next(err); }
});

// POST /api/admin/skills — create a new system default skill
router.post('/skills', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { name, avatar, expertise, personality, prompt, signature } = req.body;

    if (!name || !personality || !prompt) {
      res.status(400).json({ error: '必填欄位：name, personality, prompt' });
      return;
    }

    const skill = await skillService.adminCreateDefault({
      name,
      avatar: avatar || '🤖',
      expertise: expertise || [],
      personality,
      prompt,
      signature: signature || { style: `🤖 {name}\n📋 專長：{expertise}` },
    });

    // Parse JSON fields for response
    res.status(201).json({
      ...skill,
      expertise: JSON.parse(skill.expertise),
      signature: JSON.parse(skill.signature),
    });
  } catch (err) { next(err); }
});

// PUT /api/admin/skills/:id — update a system default skill
router.put('/skills/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { name, avatar, expertise, personality, prompt, signature } = req.body;

    const skill = await skillService.adminUpdateDefault(req.params.id as string, {
      name,
      avatar,
      expertise,
      personality,
      prompt,
      signature,
    });

    res.json({
      ...skill,
      expertise: JSON.parse(skill.expertise),
      signature: JSON.parse(skill.signature),
    });
  } catch (err) { next(err); }
});

// PATCH /api/admin/skills/:id/toggle — toggle isActive
router.patch('/skills/:id/toggle', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const skill = await skillService.adminToggle(req.params.id as string);
    res.json({
      ...skill,
      expertise: JSON.parse(skill.expertise),
      signature: JSON.parse(skill.signature),
    });
  } catch (err) { next(err); }
});

// DELETE /api/admin/skills/:id
router.delete('/skills/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    await skillService.adminRemove(req.params.id as string);
    res.json({ success: true });
  } catch (err) { next(err); }
});

// ── Users ───────────────────────────────────────────────────────

// GET /api/admin/users
router.get('/users', async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const users = await prisma.user.findMany({
      select: { id: true, displayName: true, email: true, role: true, createdAt: true },
      orderBy: { createdAt: 'desc' },
    });
    res.json(users);
  } catch (err) { next(err); }
});

export default router;
