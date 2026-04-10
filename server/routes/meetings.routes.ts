import { Router, Request, Response, NextFunction } from 'express';
import * as meetingService from '../services/meeting.service.js';
import * as discussionService from '../services/discussion.service.js';

const router = Router();

// GET /api/meetings — list my meetings
router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const meetings = await meetingService.list(req.user!.sub);
    res.json(meetings);
  } catch (err) { next(err); }
});

// POST /api/meetings — create
router.post('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { topic, sourceData, rounds, goalType, skillIds } = req.body;
    if (!topic || !skillIds || skillIds.length < 2) {
      res.status(400).json({ error: '請提供主題和至少 2 個 Skill' });
      return;
    }
    const meeting = await meetingService.create({
      topic,
      sourceData,
      rounds: rounds || 3,
      goalType: goalType || 'consensus',
      skillIds,
      ownerId: req.user!.sub,
    });
    res.status(201).json(meeting);
  } catch (err) { next(err); }
});

// GET /api/meetings/:id — get single meeting
router.get('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const meeting = await meetingService.getOwned(req.params.id as string, req.user!.sub);
    res.json(meeting);
  } catch (err) { next(err); }
});

// DELETE /api/meetings/:id
router.delete('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    await meetingService.getOwned(req.params.id as string, req.user!.sub);
    await meetingService.remove(req.params.id as string);
    res.json({ success: true });
  } catch (err) { next(err); }
});

// POST /api/meetings/:id/start — start discussion
router.post('/:id/start', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const meeting = await meetingService.getOwned(req.params.id as string, req.user!.sub);
    if (meeting.status !== 'pending') {
      res.status(400).json({ error: '會議已經開始或已完成' });
      return;
    }
    // Start discussion in background
    discussionService.start(meeting.id);
    res.json({ status: 'started' });
  } catch (err) { next(err); }
});

// GET /api/meetings/:id/stream — SSE stream
router.get('/:id/stream', async (req: Request, res: Response, next: NextFunction) => {
  try {
    await meetingService.getOwned(req.params.id as string, req.user!.sub);

    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'X-Accel-Buffering': 'no',
    });

    // Send heartbeat
    const heartbeat = setInterval(() => {
      res.write(':heartbeat\n\n');
    }, 15000);

    const unsubscribe = discussionService.subscribe(req.params.id as string, (event) => {
      res.write(`data: ${JSON.stringify(event)}\n\n`);

      if (event.type === 'complete' || event.type === 'error') {
        clearInterval(heartbeat);
        res.end();
      }
    });

    req.on('close', () => {
      clearInterval(heartbeat);
      unsubscribe();
    });
  } catch (err) { next(err); }
});

// GET /api/meetings/:id/messages
router.get('/:id/messages', async (req: Request, res: Response, next: NextFunction) => {
  try {
    await meetingService.getOwned(req.params.id as string, req.user!.sub);
    const messages = await meetingService.getMessages(req.params.id as string);
    res.json(messages);
  } catch (err) { next(err); }
});

// GET /api/meetings/:id/reports
router.get('/:id/reports', async (req: Request, res: Response, next: NextFunction) => {
  try {
    await meetingService.getOwned(req.params.id as string, req.user!.sub);
    const reports = await meetingService.getReports(req.params.id as string);
    res.json(reports);
  } catch (err) { next(err); }
});

export default router;
