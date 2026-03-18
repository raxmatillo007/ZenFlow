import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { OAuth2Client } from 'google-auth-library';
import {
  randomUUID,
  randomBytes,
  scryptSync,
  timingSafeEqual,
  createHmac
} from 'node:crypto';
import { prisma } from './lib/prisma.js';

const app = express();
const PORT = Number(process.env.PORT || 4000);
const TOKEN_TTL_SECONDS = Number(process.env.TOKEN_TTL_SECONDS || 60 * 60 * 24 * 7);
const AUTH_SECRET = process.env.AUTH_SECRET || 'change-me-in-production';
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID || '';
const CORS_ORIGINS = String(process.env.CORS_ORIGIN || '')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);
const googleClient = GOOGLE_CLIENT_ID ? new OAuth2Client(GOOGLE_CLIENT_ID) : null;
const NAME_MIN_LENGTH = 2;
const NAME_MAX_LENGTH = 50;
const PASSWORD_MIN_LENGTH = 8;
const APP_URL = process.env.APP_URL || 'http://localhost:5173';
const allowedOrigins = new Set([...CORS_ORIGINS, APP_URL].filter(Boolean));

const isAllowedOrigin = (origin) => {
  if (!origin) return true;
  if (allowedOrigins.has(origin)) return true;

  try {
    const { hostname } = new URL(origin);
    return hostname === 'localhost' || hostname === '127.0.0.1' || hostname.endsWith('.vercel.app');
  } catch {
    return false;
  }
};

app.use(cors({
  origin(origin, callback) {
    if (isAllowedOrigin(origin)) {
      return callback(null, true);
    }
    return callback(new Error('CORS origin not allowed'));
  }
}));
app.use(express.json());

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

const billingPlans = {
  monthly: {
    code: 'monthly',
    plan: 'PRO_MONTHLY',
    amount: 499,
    currency: 'USD',
    label: 'PRO Monthly'
  },
  yearly: {
    code: 'yearly',
    plan: 'PRO_YEARLY',
    amount: 3999,
    currency: 'USD',
    label: 'PRO Yearly'
  },
  lifetime: {
    code: 'lifetime',
    plan: 'PRO_LIFETIME',
    amount: 8999,
    currency: 'USD',
    label: 'PRO Lifetime'
  }
};

const billingProviders = {
  card: {
    code: 'card',
    provider: 'STRIPE',
    label: 'Visa / Mastercard',
    configured: Boolean(process.env.STRIPE_SECRET_KEY && process.env.STRIPE_PRICE_MONTHLY)
  },
  uzcard: {
    code: 'uzcard',
    provider: 'CLICK',
    label: 'Uzcard / Humo',
    configured: Boolean(process.env.CLICK_MERCHANT_ID || process.env.PAYME_MERCHANT_ID)
  }
};

const base64UrlEncode = (value) => Buffer.from(value).toString('base64url');
const base64UrlDecode = (value) => Buffer.from(value, 'base64url').toString('utf8');

const signToken = (payload) => {
  const header = { alg: 'HS256', typ: 'JWT' };
  const now = Math.floor(Date.now() / 1000);
  const body = {
    ...payload,
    iat: now,
    exp: now + TOKEN_TTL_SECONDS
  };
  const encodedHeader = base64UrlEncode(JSON.stringify(header));
  const encodedBody = base64UrlEncode(JSON.stringify(body));
  const signature = createHmac('sha256', AUTH_SECRET)
    .update(`${encodedHeader}.${encodedBody}`)
    .digest('base64url');
  return `${encodedHeader}.${encodedBody}.${signature}`;
};

const verifyToken = (token) => {
  const [encodedHeader, encodedBody, signature] = String(token || '').split('.');
  if (!encodedHeader || !encodedBody || !signature) {
    throw new Error('Malformed token');
  }
  const expected = createHmac('sha256', AUTH_SECRET)
    .update(`${encodedHeader}.${encodedBody}`)
    .digest();
  const actual = Buffer.from(signature, 'base64url');
  if (expected.length !== actual.length || !timingSafeEqual(expected, actual)) {
    throw new Error('Invalid signature');
  }
  const payload = JSON.parse(base64UrlDecode(encodedBody));
  const now = Math.floor(Date.now() / 1000);
  if (!payload.exp || payload.exp < now) {
    throw new Error('Token expired');
  }
  return payload;
};

const hashPassword = (password) => {
  const salt = randomBytes(16).toString('hex');
  const derived = scryptSync(password, salt, 64).toString('hex');
  return `scrypt:${salt}:${derived}`;
};

const createPlaceholderPasswordHash = () => hashPassword(randomBytes(24).toString('hex'));

const verifyPassword = (password, storedHash = '') => {
  if (!storedHash) return false;
  if (!storedHash.startsWith('scrypt:')) {
    return password === storedHash;
  }
  const [, salt, expectedHex] = storedHash.split(':');
  if (!salt || !expectedHex) return false;
  const derived = scryptSync(password, salt, 64);
  const expected = Buffer.from(expectedHex, 'hex');
  return derived.length === expected.length && timingSafeEqual(derived, expected);
};

const sanitizeUser = (user) => {
  if (!user) return null;
  const { passwordHash, ...safeUser } = user;
  return safeUser;
};

const createAuthResponse = (user) => ({
  token: signToken({ sub: user.id, email: user.email }),
  user: sanitizeUser(user)
});

const normalizeRewards = (value) => (Array.isArray(value) ? value : []);
const normalizeDailyGoal = (value) => ({
  ...defaultProgress.dailyGoal,
  ...(value && typeof value === 'object' ? value : {})
});
const isValidEmail = (value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value || '').trim().toLowerCase());

const validatePassword = (value) => {
  const password = String(value || '');
  const errors = [];

  if (password.length < PASSWORD_MIN_LENGTH) {
    errors.push(`Parol kamida ${PASSWORD_MIN_LENGTH} ta belgidan iborat bo'lishi kerak`);
  }
  if (!/[A-Z]/.test(password)) {
    errors.push("Parolda kamida 1 ta katta harf bo'lishi kerak");
  }
  if (!/[a-z]/.test(password)) {
    errors.push("Parolda kamida 1 ta kichik harf bo'lishi kerak");
  }
  if (!/\d/.test(password)) {
    errors.push("Parolda kamida 1 ta raqam bo'lishi kerak");
  }
  if (!/[^A-Za-z0-9]/.test(password)) {
    errors.push("Parolda kamida 1 ta maxsus belgi bo'lishi kerak");
  }

  return errors;
};

const validateRegisterPayload = ({ name, email, password }) => {
  const fieldErrors = {};
  const trimmedName = String(name || '').trim();
  const normalizedEmail = String(email || '').trim().toLowerCase();

  if (!trimmedName) {
    fieldErrors.name = "Ism kiritilishi shart";
  } else if (trimmedName.length < NAME_MIN_LENGTH) {
    fieldErrors.name = `Ism kamida ${NAME_MIN_LENGTH} ta harf bo'lishi kerak`;
  } else if (trimmedName.length > NAME_MAX_LENGTH) {
    fieldErrors.name = `Ism ${NAME_MAX_LENGTH} ta belgidan oshmasligi kerak`;
  }

  if (!normalizedEmail) {
    fieldErrors.email = 'Email kiritilishi shart';
  } else if (!isValidEmail(normalizedEmail)) {
    fieldErrors.email = "Email formati noto'g'ri";
  }

  const passwordErrors = validatePassword(password);
  if (!String(password || '')) {
    fieldErrors.password = 'Parol kiritilishi shart';
  } else if (passwordErrors.length > 0) {
    fieldErrors.password = passwordErrors[0];
    fieldErrors.passwordRules = passwordErrors;
  }

  return {
    fieldErrors,
    isValid: Object.keys(fieldErrors).length === 0,
    normalizedEmail,
    trimmedName
  };
};

const validateLoginPayload = ({ email, password }) => {
  const fieldErrors = {};
  const normalizedEmail = String(email || '').trim().toLowerCase();

  if (!normalizedEmail) {
    fieldErrors.email = 'Email kiritilishi shart';
  } else if (!isValidEmail(normalizedEmail)) {
    fieldErrors.email = "Email formati noto'g'ri";
  }

  if (!String(password || '').trim()) {
    fieldErrors.password = 'Parol kiritilishi shart';
  }

  return {
    fieldErrors,
    isValid: Object.keys(fieldErrors).length === 0,
    normalizedEmail
  };
};

const serializeTask = (task) => ({
  id: task.id,
  text: task.text,
  completed: task.completed,
  priority: task.priority,
  createdAt: new Date(task.createdAt).getTime(),
  updatedAt: new Date(task.updatedAt).getTime()
});

const serializeSession = (session) => ({
  id: session.id,
  mode: session.mode,
  duration: session.duration,
  timestamp: new Date(session.timestamp).getTime()
});

const serializeProgress = (progress, user) => {
  if (!progress) {
    return {
      ...defaultProgress,
      theme: user?.theme || defaultProgress.theme,
      isPremium: Boolean(user?.isPremium)
    };
  }

  return {
    xp: progress.xp,
    level: progress.level,
    totalXp: progress.totalXp,
    unlockedRewards: normalizeRewards(progress.unlockedRewards),
    latestRewardKey: progress.latestRewardKey || '',
    streak: progress.streak,
    lastActiveDate: progress.lastActiveDate || '',
    dailyGoal: normalizeDailyGoal(progress.dailyGoal),
    theme: progress.theme || user?.theme || defaultProgress.theme,
    isPremium: Boolean(progress.isPremium ?? user?.isPremium)
  };
};

const serializeSettings = (settings) => ({
  focus: settings?.focus ?? defaultSettings.focus,
  shortBreak: settings?.shortBreak ?? defaultSettings.shortBreak,
  longBreak: settings?.longBreak ?? defaultSettings.longBreak,
  autoStartBreaks: Boolean(settings?.autoStartBreaks),
  autoStartPomodoros: Boolean(settings?.autoStartPomodoros),
  alarmSound: settings?.alarmSound || defaultSettings.alarmSound
});

const serializeBillingStatus = (user) => ({
  isPremium: Boolean(user?.isPremium),
  premiumUntil: user?.premiumUntil || null,
  billingPlan: user?.billingPlan || 'FREE'
});

const ensureUserState = async (userId) => {
  await prisma.timerSettings.upsert({
    where: { userId },
    update: {},
    create: { ...defaultSettings, userId }
  });

  await prisma.userProgress.upsert({
    where: { userId },
    update: {},
    create: {
      userId,
      ...defaultProgress
    }
  });
};

const requireAuth = async (req, res, next) => {
  try {
    const header = req.headers.authorization || '';
    const [scheme, token] = header.split(' ');
    if (scheme !== 'Bearer' || !token) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    const payload = verifyToken(token);
    const user = await prisma.user.findUnique({ where: { id: payload.sub } });
    if (!user) {
      return res.status(401).json({ message: 'Invalid token user' });
    }

    await ensureUserState(user.id);
    req.user = user;
    return next();
  } catch {
    return res.status(401).json({ message: 'Invalid or expired token' });
  }
};

app.get('/api/health', async (_req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.json({ ok: true, db: true });
  } catch {
    res.status(500).json({ ok: false, db: false });
  }
});

app.post('/api/auth/register', async (req, res) => {
  const { name, email, password } = req.body ?? {};
  const { fieldErrors, isValid, normalizedEmail, trimmedName } = validateRegisterPayload({ name, email, password });

  if (!isValid) {
    return res.status(400).json({
      message: "Ro'yxatdan o'tish ma'lumotlari noto'g'ri",
      fieldErrors
    });
  }

  const exists = await prisma.user.findUnique({ where: { email: normalizedEmail } });
  if (exists) {
    return res.status(409).json({
      message: 'Bu email allaqachon ro‘yxatdan o‘tgan',
      fieldErrors: { email: 'Bu email allaqachon ishlatilgan' }
    });
  }

  const user = await prisma.user.create({
    data: {
      id: randomUUID(),
      name: trimmedName,
      email: normalizedEmail,
      passwordHash: hashPassword(password),
      isPremium: false,
      theme: 'default'
    }
  });

  await ensureUserState(user.id);
  return res.status(201).json(createAuthResponse(user));
});

app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body ?? {};
  const { fieldErrors, isValid, normalizedEmail } = validateLoginPayload({ email, password });

  if (!isValid) {
    return res.status(400).json({
      message: "Kirish ma'lumotlari noto'g'ri",
      fieldErrors
    });
  }

  const user = await prisma.user.findUnique({ where: { email: normalizedEmail } });
  if (!user || !verifyPassword(password, user.passwordHash)) {
    return res.status(401).json({ message: 'Invalid email or password' });
  }

  await ensureUserState(user.id);
  return res.json(createAuthResponse(user));
});

app.post('/api/auth/google', async (req, res) => {
  try {
    if (!googleClient || !GOOGLE_CLIENT_ID) {
      return res.status(500).json({ message: 'Google login is not configured' });
    }

    const { credential } = req.body ?? {};
    if (!credential) {
      return res.status(400).json({ message: 'Google credential is required' });
    }

    const ticket = await googleClient.verifyIdToken({
      idToken: credential,
      audience: GOOGLE_CLIENT_ID
    });

    const payload = ticket.getPayload();
    const email = String(payload?.email || '').trim().toLowerCase();
    if (!payload || !payload.email_verified || !email) {
      return res.status(401).json({ message: 'Invalid Google account' });
    }

    let user = await prisma.user.findUnique({ where: { email } });

    if (!user) {
      user = await prisma.user.create({
        data: {
          id: randomUUID(),
          name: String(payload.name || email.split('@')[0]).trim(),
          email,
          passwordHash: createPlaceholderPasswordHash(),
          isPremium: false,
          theme: 'default'
        }
      });
    }

    await ensureUserState(user.id);
    return res.json(createAuthResponse(user));
  } catch (error) {
    return res.status(401).json({ message: 'Google login failed' });
  }
});

app.post('/api/auth/logout', requireAuth, (_req, res) => {
  res.status(204).send();
});

app.get('/api/auth/me', requireAuth, async (req, res) => {
  const freshUser = await prisma.user.findUnique({ where: { id: req.user.id } });
  res.json(sanitizeUser(freshUser));
});

app.patch('/api/auth/profile', requireAuth, async (req, res) => {
  const { name, theme, isPremium } = req.body ?? {};
  const nextUser = await prisma.user.update({
    where: { id: req.user.id },
    data: {
      ...(typeof name === 'string' && name.trim() ? { name: name.trim() } : {}),
      ...(typeof theme === 'string' && theme.trim() ? { theme: theme.trim() } : {}),
      ...(typeof isPremium === 'boolean' ? { isPremium } : {})
    }
  });

  await prisma.userProgress.upsert({
    where: { userId: req.user.id },
    update: {
      ...(typeof theme === 'string' && theme.trim() ? { theme: theme.trim() } : {}),
      ...(typeof isPremium === 'boolean' ? { isPremium } : {})
    },
    create: {
      userId: req.user.id,
      ...defaultProgress,
      theme: typeof theme === 'string' && theme.trim() ? theme.trim() : nextUser.theme,
      isPremium: typeof isPremium === 'boolean' ? isPremium : nextUser.isPremium
    }
  });

  res.json(sanitizeUser(nextUser));
});

app.get('/api/bootstrap', requireAuth, async (req, res) => {
  const [user, tasks, settings, sessions, progress] = await Promise.all([
    prisma.user.findUnique({ where: { id: req.user.id } }),
    prisma.task.findMany({ where: { userId: req.user.id }, orderBy: { createdAt: 'desc' } }),
    prisma.timerSettings.findUnique({ where: { userId: req.user.id } }),
    prisma.focusSession.findMany({ where: { userId: req.user.id }, orderBy: { timestamp: 'desc' }, take: 500 }),
    prisma.userProgress.findUnique({ where: { userId: req.user.id } })
  ]);

  res.json({
    user: sanitizeUser(user),
    tasks: tasks.map(serializeTask),
    settings: serializeSettings(settings),
    sessions: sessions.map(serializeSession),
    progress: serializeProgress(progress, user)
  });
});

app.get('/api/tasks', requireAuth, async (req, res) => {
  const tasks = await prisma.task.findMany({
    where: { userId: req.user.id },
    orderBy: { createdAt: 'desc' }
  });
  res.json(tasks.map(serializeTask));
});

app.put('/api/tasks', requireAuth, async (req, res) => {
  const { tasks } = req.body ?? {};
  if (!Array.isArray(tasks)) {
    return res.status(400).json({ message: 'tasks are required' });
  }

  await prisma.$transaction([
    prisma.task.deleteMany({ where: { userId: req.user.id } }),
    prisma.task.createMany({
      data: tasks.map((task) => ({
        id: task.id || randomUUID(),
        text: String(task.text || ''),
        completed: Boolean(task.completed),
        priority: task.priority || 'medium',
        createdAt: task.createdAt ? new Date(Number(task.createdAt)) : new Date(),
        updatedAt: task.updatedAt ? new Date(Number(task.updatedAt)) : new Date(),
        userId: req.user.id
      }))
    })
  ]);

  res.status(204).send();
});

app.get('/api/settings', requireAuth, async (req, res) => {
  const settings = await prisma.timerSettings.findUnique({ where: { userId: req.user.id } });
  res.json(serializeSettings(settings));
});

app.put('/api/settings', requireAuth, async (req, res) => {
  const { settings } = req.body ?? {};
  if (!settings) {
    return res.status(400).json({ message: 'settings are required' });
  }

  await prisma.timerSettings.upsert({
    where: { userId: req.user.id },
    update: {
      focus: Number(settings.focus) || defaultSettings.focus,
      shortBreak: Number(settings.shortBreak) || defaultSettings.shortBreak,
      longBreak: Number(settings.longBreak) || defaultSettings.longBreak,
      autoStartBreaks: Boolean(settings.autoStartBreaks),
      autoStartPomodoros: Boolean(settings.autoStartPomodoros),
      alarmSound: settings.alarmSound || defaultSettings.alarmSound
    },
    create: {
      userId: req.user.id,
      focus: Number(settings.focus) || defaultSettings.focus,
      shortBreak: Number(settings.shortBreak) || defaultSettings.shortBreak,
      longBreak: Number(settings.longBreak) || defaultSettings.longBreak,
      autoStartBreaks: Boolean(settings.autoStartBreaks),
      autoStartPomodoros: Boolean(settings.autoStartPomodoros),
      alarmSound: settings.alarmSound || defaultSettings.alarmSound
    }
  });

  res.status(204).send();
});

app.get('/api/stats', requireAuth, async (req, res) => {
  const sessions = await prisma.focusSession.findMany({
    where: { userId: req.user.id },
    orderBy: { timestamp: 'desc' },
    take: 500
  });
  res.json(sessions.map(serializeSession));
});

app.put('/api/stats', requireAuth, async (req, res) => {
  const { sessions } = req.body ?? {};
  if (!Array.isArray(sessions)) {
    return res.status(400).json({ message: 'sessions are required' });
  }

  await prisma.$transaction([
    prisma.focusSession.deleteMany({ where: { userId: req.user.id } }),
    prisma.focusSession.createMany({
      data: sessions.map((session) => ({
        mode: session.mode || 'focus',
        duration: Number(session.duration) || 0,
        timestamp: session.timestamp ? new Date(Number(session.timestamp)) : new Date(),
        userId: req.user.id
      }))
    })
  ]);

  res.status(204).send();
});

app.post('/api/stats/session', requireAuth, async (req, res) => {
  const { session } = req.body ?? {};
  if (!session) {
    return res.status(400).json({ message: 'session is required' });
  }

  const created = await prisma.focusSession.create({
    data: {
      mode: session.mode || 'focus',
      duration: Number(session.duration) || 0,
      timestamp: session.timestamp ? new Date(Number(session.timestamp)) : new Date(),
      userId: req.user.id
    }
  });

  res.status(201).json(serializeSession(created));
});

app.get('/api/progress', requireAuth, async (req, res) => {
  const [user, progress] = await Promise.all([
    prisma.user.findUnique({ where: { id: req.user.id } }),
    prisma.userProgress.findUnique({ where: { userId: req.user.id } })
  ]);
  res.json(serializeProgress(progress, user));
});

app.put('/api/progress', requireAuth, async (req, res) => {
  const { progress } = req.body ?? {};
  if (!progress || typeof progress !== 'object') {
    return res.status(400).json({ message: 'progress is required' });
  }

  const nextTheme = typeof progress.theme === 'string' ? progress.theme : undefined;
  const nextPremium = typeof progress.isPremium === 'boolean' ? progress.isPremium : undefined;

  const [user] = await prisma.$transaction([
    prisma.user.update({
      where: { id: req.user.id },
      data: {
        ...(nextTheme ? { theme: nextTheme } : {}),
        ...(typeof nextPremium === 'boolean' ? { isPremium: nextPremium } : {})
      }
    }),
    prisma.userProgress.upsert({
      where: { userId: req.user.id },
      update: {
        xp: Number(progress.xp) || 0,
        level: Math.max(0, Number(progress.level) || 0),
        totalXp: Number(progress.totalXp) || 0,
        unlockedRewards: normalizeRewards(progress.unlockedRewards),
        latestRewardKey: progress.latestRewardKey || '',
        streak: Number(progress.streak) || 0,
        lastActiveDate: progress.lastActiveDate || '',
        dailyGoal: normalizeDailyGoal(progress.dailyGoal),
        theme: nextTheme || defaultProgress.theme,
        isPremium: typeof nextPremium === 'boolean' ? nextPremium : false
      },
      create: {
        userId: req.user.id,
        xp: Number(progress.xp) || 0,
        level: Math.max(0, Number(progress.level) || 0),
        totalXp: Number(progress.totalXp) || 0,
        unlockedRewards: normalizeRewards(progress.unlockedRewards),
        latestRewardKey: progress.latestRewardKey || '',
        streak: Number(progress.streak) || 0,
        lastActiveDate: progress.lastActiveDate || '',
        dailyGoal: normalizeDailyGoal(progress.dailyGoal),
        theme: nextTheme || defaultProgress.theme,
        isPremium: typeof nextPremium === 'boolean' ? nextPremium : false,
        userId: req.user.id
      }
    })
  ]);

  const freshProgress = await prisma.userProgress.findUnique({ where: { userId: req.user.id } });
  res.json(serializeProgress(freshProgress, user));
});

app.get('/api/billing/plans', (_req, res) => {
  res.json({
    plans: Object.values(billingPlans),
    providers: Object.values(billingProviders).map((provider) => ({
      code: provider.code,
      provider: provider.provider,
      label: provider.label,
      configured: provider.configured
    }))
  });
});

app.get('/api/billing/status', requireAuth, async (req, res) => {
  const user = await prisma.user.findUnique({ where: { id: req.user.id } });
  res.json(serializeBillingStatus(user));
});

app.post('/api/billing/checkout', requireAuth, async (req, res) => {
  const { planCode, methodCode } = req.body ?? {};
  const plan = billingPlans[String(planCode || '')];
  const method = billingProviders[String(methodCode || '')];

  if (!plan || !method) {
    return res.status(400).json({ message: 'Invalid billing plan or payment method' });
  }

  if (!method.configured) {
    return res.status(200).json({
      ok: false,
      mode: 'mock',
      configured: false,
      provider: method.provider,
      message: `${method.label} gateway is not configured yet`
    });
  }

  return res.status(200).json({
    ok: true,
    mode: 'redirect',
    provider: method.provider,
    checkoutUrl: `${APP_URL}/billing/redirect?plan=${plan.code}&provider=${method.provider.toLowerCase()}`
  });
});

app.post('/api/billing/dev/activate', requireAuth, async (req, res) => {
  if (process.env.NODE_ENV === 'production') {
    return res.status(403).json({ message: 'Dev billing activation is disabled in production' });
  }

  const { planCode } = req.body ?? {};
  const plan = billingPlans[String(planCode || '')];
  if (!plan) {
    return res.status(400).json({ message: 'Invalid billing plan' });
  }

  const premiumUntil =
    plan.code === 'monthly'
      ? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
      : plan.code === 'yearly'
        ? new Date(Date.now() + 365 * 24 * 60 * 60 * 1000)
        : new Date('2099-12-31T23:59:59.000Z');

  const user = await prisma.user.update({
    where: { id: req.user.id },
    data: {
      isPremium: true
    }
  });

  await prisma.userProgress.upsert({
    where: { userId: req.user.id },
    update: {
      isPremium: true
    },
    create: {
      userId: req.user.id,
      ...defaultProgress,
      isPremium: true
    }
  });

  return res.json({
    ok: true,
    message: 'Premium activated in development mode',
    billing: {
      ...serializeBillingStatus({
        ...user,
        premiumUntil,
        billingPlan: plan.plan
      }),
      provider: 'MANUAL'
    }
  });
});

app.listen(PORT, () => {
  if (AUTH_SECRET === 'change-me-in-production') {
    console.warn('AUTH_SECRET is using the default value. Set a strong AUTH_SECRET before deployment.');
  }
  console.log(`ZenFlow backend running on http://localhost:${PORT}`);
});
