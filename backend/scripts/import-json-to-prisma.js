import 'dotenv/config';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { randomUUID } from 'node:crypto';
import { prisma } from '../lib/prisma.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DB_PATH = path.join(__dirname, '..', 'db.json');

const defaultSettings = {
  focus: 25,
  shortBreak: 5,
  longBreak: 15,
  autoStartBreaks: false,
  autoStartPomodoros: false,
  alarmSound: 'digital'
};

const defaultProgress = {
  xp: 0,
  level: 0,
  totalXp: 0,
  unlockedRewards: [],
  latestRewardKey: '',
  streak: 0,
  lastActiveDate: '',
  dailyGoal: {
    date: '',
    targetXp: 150,
    currentXp: 0,
    completed: false
  },
  theme: 'default',
  isPremium: false
};

const toDate = (value) => {
  if (!value) return new Date();
  const num = Number(value);
  if (Number.isFinite(num) && num > 0) return new Date(num);
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? new Date() : parsed;
};

const safePasswordHash = (user) => {
  if (user?.passwordHash) return user.passwordHash;
  return `imported-disabled:${randomUUID()}`;
};

const main = async () => {
  const raw = await fs.readFile(DB_PATH, 'utf8');
  const db = JSON.parse(raw);
  const users = Array.isArray(db.users) ? db.users : [];

  for (const rawUser of users) {
    const userId = rawUser.id || randomUUID();
    const email = String(rawUser.email || '').trim().toLowerCase();
    if (!email) continue;

    await prisma.user.upsert({
      where: { email },
      update: {
        name: rawUser.name || email.split('@')[0],
        passwordHash: safePasswordHash(rawUser),
        isPremium: Boolean(rawUser.isPremium),
        theme: rawUser.theme || 'default'
      },
      create: {
        id: userId,
        name: rawUser.name || email.split('@')[0],
        email,
        passwordHash: safePasswordHash(rawUser),
        isPremium: Boolean(rawUser.isPremium),
        theme: rawUser.theme || 'default',
        createdAt: rawUser.createdAt ? new Date(rawUser.createdAt) : new Date()
      }
    });

    const settings = db.settingsByUser?.[rawUser.id] || defaultSettings;
    await prisma.timerSettings.upsert({
      where: { userId },
      update: { ...defaultSettings, ...settings },
      create: { ...defaultSettings, ...settings, userId }
    });

    const progress = db.progressByUser?.[rawUser.id] || defaultProgress;
    await prisma.userProgress.upsert({
      where: { userId },
      update: {
        xp: Number(progress.xp) || 0,
        level: Math.max(0, Number(progress.level) || 0),
        totalXp: Number(progress.totalXp) || 0,
        unlockedRewards: Array.isArray(progress.unlockedRewards) ? progress.unlockedRewards : [],
        latestRewardKey: progress.latestRewardKey || '',
        streak: Number(progress.streak) || 0,
        lastActiveDate: progress.lastActiveDate || '',
        dailyGoal: progress.dailyGoal || defaultProgress.dailyGoal,
        theme: progress.theme || rawUser.theme || 'default',
        isPremium: Boolean(progress.isPremium ?? rawUser.isPremium)
      },
      create: {
        userId,
        xp: Number(progress.xp) || 0,
        level: Math.max(0, Number(progress.level) || 0),
        totalXp: Number(progress.totalXp) || 0,
        unlockedRewards: Array.isArray(progress.unlockedRewards) ? progress.unlockedRewards : [],
        latestRewardKey: progress.latestRewardKey || '',
        streak: Number(progress.streak) || 0,
        lastActiveDate: progress.lastActiveDate || '',
        dailyGoal: progress.dailyGoal || defaultProgress.dailyGoal,
        theme: progress.theme || rawUser.theme || 'default',
        isPremium: Boolean(progress.isPremium ?? rawUser.isPremium)
      }
    });

    await prisma.task.deleteMany({ where: { userId } });
    const tasks = Array.isArray(db.tasksByUser?.[rawUser.id]) ? db.tasksByUser[rawUser.id] : [];
    if (tasks.length) {
      await prisma.task.createMany({
        data: tasks.map((task) => ({
          id: task.id || randomUUID(),
          text: task.text || '',
          completed: Boolean(task.completed),
          priority: task.priority || 'medium',
          createdAt: toDate(task.createdAt),
          updatedAt: toDate(task.updatedAt || task.createdAt),
          userId
        }))
      });
    }

    await prisma.focusSession.deleteMany({ where: { userId } });
    const sessions = Array.isArray(db.statsByUser?.[rawUser.id]) ? db.statsByUser[rawUser.id] : [];
    if (sessions.length) {
      await prisma.focusSession.createMany({
        data: sessions.map((session) => ({
          mode: session.mode || 'focus',
          duration: Number(session.duration) || 0,
          timestamp: toDate(session.timestamp),
          userId
        }))
      });
    }
  }

  console.log(`Imported ${users.length} users from db.json into PostgreSQL.`);
};

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
