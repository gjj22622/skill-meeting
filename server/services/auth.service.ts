import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { prisma } from '../lib/prisma.js';
import { config } from '../config.js';
import { AppError } from '../middleware/error.js';

export function generateToken(user: { id: string; email: string; role: string }) {
  return jwt.sign(
    { sub: user.id, email: user.email, role: user.role },
    config.jwtSecret,
    { expiresIn: config.jwtExpiresIn } as jwt.SignOptions
  );
}

export async function register(displayName: string, email: string, password: string) {
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    throw new AppError(409, '此 Email 已被註冊');
  }

  const passwordHash = await bcrypt.hash(password, 12);
  const user = await prisma.user.create({
    data: { displayName, email, passwordHash, role: 'user' },
  });

  const token = generateToken(user);
  return {
    user: { id: user.id, displayName: user.displayName, email: user.email, role: user.role },
    token,
  };
}

export async function login(email: string, password: string) {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    throw new AppError(401, 'Email 或密碼錯誤');
  }

  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) {
    throw new AppError(401, 'Email 或密碼錯誤');
  }

  const token = generateToken(user);
  return {
    user: { id: user.id, displayName: user.displayName, email: user.email, role: user.role },
    token,
  };
}

export async function getMe(userId: string) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw new AppError(404, '使用者不存在');
  return { id: user.id, displayName: user.displayName, email: user.email, role: user.role };
}

export async function ensureAdmin() {
  if (!config.adminEmail || !config.adminPassword) return;

  const existing = await prisma.user.findUnique({ where: { email: config.adminEmail } });
  if (existing) return;

  const passwordHash = await bcrypt.hash(config.adminPassword, 12);
  await prisma.user.create({
    data: {
      displayName: 'Admin',
      email: config.adminEmail,
      passwordHash,
      role: 'admin',
    },
  });
  console.log(`[Auth] Admin account created: ${config.adminEmail}`);
}
