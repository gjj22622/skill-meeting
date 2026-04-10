import { Router, Request, Response, NextFunction } from 'express';
import * as skillService from '../services/skill.service.js';

const router = Router();

// GET /api/skills
router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const skills = await skillService.list(req.user!.sub);
    // Parse JSON fields for frontend
    const parsed = skills.map(s => ({
      ...s,
      expertise: JSON.parse(s.expertise),
      signature: JSON.parse(s.signature),
    }));
    res.json(parsed);
  } catch (err) { next(err); }
});

// POST /api/skills
router.post('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { name, avatar, expertise, personality, prompt, signature } = req.body;
    if (!name || !personality || !prompt) {
      res.status(400).json({ error: '請填寫必要欄位' });
      return;
    }
    const skill = await skillService.create({
      name,
      avatar: avatar || '👤',
      expertise: expertise || [],
      personality,
      prompt,
      signature: signature || { style: '{name} | 專長：{expertise}' },
      ownerId: req.user!.sub,
    });
    // Return parsed
    res.status(201).json({
      ...skill,
      expertise: JSON.parse(skill.expertise),
      signature: JSON.parse(skill.signature),
    });
  } catch (err) { next(err); }
});

// DELETE /api/skills/:id
router.delete('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    await skillService.remove(req.params.id as string, req.user!.sub);
    res.json({ success: true });
  } catch (err) { next(err); }
});

export default router;
