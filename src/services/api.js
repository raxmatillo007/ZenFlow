import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || (import.meta.env.DEV ? 'http://localhost:4000/api' : '/api'),
  timeout: 10000
});

const CURRENT_USER_KEY = 'zenflow-user';
const AUTH_TOKEN_KEY = 'zenflow-token';

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

const setCurrentUser = (user) => {
  localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(user));
};

const setAuthToken = (token) => {
  localStorage.setItem(AUTH_TOKEN_KEY, token);
};

export const getAuthToken = () => localStorage.getItem(AUTH_TOKEN_KEY) || '';

const clearAuthToken = () => {
  localStorage.removeItem(AUTH_TOKEN_KEY);
};

const clearCurrentUser = () => {
  localStorage.removeItem(CURRENT_USER_KEY);
};

export const clearAuthState = () => {
  clearAuthToken();
  clearCurrentUser();
};

export const getCurrentUser = () => {
  const raw = localStorage.getItem(CURRENT_USER_KEY);
  return raw ? JSON.parse(raw) : null;
};

api.interceptors.request.use((config) => {
  const token = getAuthToken();
  if (token) {
    config.headers = config.headers || {};
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error?.response?.status === 401) {
      clearAuthState();
    }
    return Promise.reject(error);
  }
);

const saveAuthPayload = (payload) => {
  if (payload?.token) setAuthToken(payload.token);
  if (payload?.user) setCurrentUser(payload.user);
  return payload?.user || null;
};

export const authService = {
  async login({ email, password = '' }) {
    const { data } = await api.post('/auth/login', { email, password });
    return saveAuthPayload(data);
  },

  async loginWithGoogle(credential) {
    const { data } = await api.post('/auth/google', { credential });
    return saveAuthPayload(data);
  },

  async register({ name, email, password = '' }) {
    const { data } = await api.post('/auth/register', { name, email, password });
    return saveAuthPayload(data);
  },

  async logout() {
    try {
      await api.post('/auth/logout');
    } finally {
      clearAuthState();
    }
  },

  async me() {
    const { data } = await api.get('/auth/me');
    setCurrentUser(data);
    return data;
  },

  async updateProfile(user) {
    const { data } = await api.patch('/auth/profile', user);
    setCurrentUser(data);
    return data;
  }
};

export const dataService = {
  async bootstrap() {
    const { data } = await api.get('/bootstrap');
    if (data?.user) {
      setCurrentUser(data.user);
    }
    return {
      user: data?.user || getCurrentUser(),
      tasks: Array.isArray(data?.tasks) ? data.tasks : [],
      settings: { ...defaultSettings, ...(data?.settings || {}) },
      sessions: Array.isArray(data?.sessions) ? data.sessions : [],
      progress: {
        ...defaultProgress,
        ...(data?.progress || {}),
        dailyGoal: {
          ...defaultProgress.dailyGoal,
          ...(data?.progress?.dailyGoal || {})
        }
      }
    };
  },

  async getTasks() {
    const { data } = await api.get('/tasks');
    return data;
  },

  async saveTasks(tasks) {
    await api.put('/tasks', { tasks });
  },

  async getSettings() {
    const { data } = await api.get('/settings');
    return data ?? defaultSettings;
  },

  async saveSettings(settings) {
    await api.put('/settings', { settings });
  },

  async getStats() {
    const { data } = await api.get('/stats');
    return data;
  },

  async saveStats(sessions) {
    await api.put('/stats', { sessions });
  },

  async addSession(session) {
    const { data } = await api.post('/stats/session', { session });
    return data;
  },

  async getProgress() {
    const { data } = await api.get('/progress');
    return {
      ...defaultProgress,
      ...(data || {}),
      dailyGoal: {
        ...defaultProgress.dailyGoal,
        ...(data?.dailyGoal || {})
      }
    };
  },

  async saveProgress(progress) {
    const { data } = await api.put('/progress', { progress });
    return data;
  }
};

export const billingService = {
  async getPlans() {
    const { data } = await api.get('/billing/plans');
    return data;
  },

  async getStatus() {
    const { data } = await api.get('/billing/status');
    return data;
  },

  async createCheckout({ planCode, methodCode }) {
    const { data } = await api.post('/billing/checkout', { planCode, methodCode });
    return data;
  },

  async activateDev(planCode) {
    const { data } = await api.post('/billing/dev/activate', { planCode });
    return data;
  }
};
