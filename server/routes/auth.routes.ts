import { Router, Request, Response, NextFunction } from 'express';
import * as authService from '../services/auth.service.js';
import { authMiddleware } from '../middleware/auth.js';

const router = Router();

router.post('/register', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { displayName, email, password } = req.body;
    if (!displayName || !email || !password) {
      res.status(400).json({ error: '請填寫完整的註冊資訊' });
      return;
    }
    if (password.length < 6) {
      res.status(400).json({ error: '密碼至少需要 6 個字元' });
      return;
    }
    const result = await authService.register(displayName, email, password);
    res.status(201).json(result);
  } catch (err) {
    next(err);
  }
});

router.post('/login', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      res.status(400).json({ error: '請填寫 Email 和密碼' });
      return;
    }
    const result = await authService.login(email, password);
    res.json(result);
  } catch (err) {
    next(err);
  }
});

router.get('/me', authMiddleware, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = await authService.getMe(req.user!.sub);
    res.json(user);
  } catch (err) {
    next(err);
  }
});

export default router;
