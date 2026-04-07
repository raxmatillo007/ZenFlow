<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount, watch } from 'vue';
import Timer from './Timer.vue';
import SoundMixer from './SoundMixer.vue';
import TaskList from './TaskList.vue';
import Stats from './Stats.vue';
import AIAssistant from './AIAssistant.vue';
import PremiumModal from './PremiumModal.vue';
import BillingModal from './BillingModal.vue';
import SettingsModal from './SettingsModal.vue';
import LanguageSelector from './LanguageSelector.vue';
import Gamification from './Gamification.vue';
import BreathingExercise from './BreathingExercise.vue';
import RewardCollection from './RewardCollection.vue';
import ProgressDetailView from './ProgressDetailView.vue';
import {
  Sparkles,
  Crown,
  Settings as SettingsIcon,
  LogOut,
  Maximize2,
  Minimize2,
  Palette,
  X,
  Trophy,
  Shield,
  Medal,
  Flame,
  Rocket,
  Flower2,
  Target,
  CloudLightning,
  Trees,
  Sun,
  Activity
} from 'lucide-vue-next';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { clsx } from 'clsx';
import { useLanguage } from '../context/language';
import { authService, billingService, dataService, getAuthToken } from '../services/api';
import {
  xpNeededForLevel,
  getOakStage,
  getLevelRankKey,
  getLevelRewards,
  getNextRewardLevel,
  getStreakMultiplier,
  migrateRewardList,
  ensureLatestReward,
  getRewardLabel,
  getRewardIconKey,
  getRewardCubeClass
} from '../progression';

const props = defineProps({
  userName: String
});

const emit = defineEmits(['logout']);

const { t } = useLanguage();

const DEFAULT_SETTINGS = {
  focus: 25,
  shortBreak: 5,
  longBreak: 15,
  autoStartBreaks: false,
  autoStartPomodoros: false,
  alarmSound: 'digital'
};
const RESET_PROGRESS_VERSION = '2026-03-15-reset-level-0-v2';
const [isPremium, setIsPremium] = useLocalStorage<boolean>('zenflow-premium', false);
const [xp, setXp] = useLocalStorage<number>('zenflow-xp', 0);
const [level, setLevel] = useLocalStorage<number>('zenflow-level', 0);
const [theme, setTheme] = useLocalStorage<string>('zenflow-theme', 'default');
const [timerSettings, setTimerSettings] = useLocalStorage('zenflow-settings', DEFAULT_SETTINGS);
const [sessions, setSessions] = useLocalStorage('zenflow-sessions', []);
const [totalXp, setTotalXp] = useLocalStorage<number>('zenflow-total-xp', 0);
const [unlockedRewards, setUnlockedRewards] = useLocalStorage('zenflow-unlocked-rewards', []);
const [latestRewardKey, setLatestRewardKey] = useLocalStorage<string>('zenflow-latest-reward-key', '');
const [streak, setStreak] = useLocalStorage<number>('zenflow-streak', 0);
const [lastActiveDate, setLastActiveDate] = useLocalStorage<string>('zenflow-last-active-date', '');
const [dailyGoal, setDailyGoal] = useLocalStorage('zenflow-daily-goal', {
  date: '',
  targetXp: 150,
  currentXp: 0,
  completed: false
});

const isModalOpen = ref(false);
const isBillingOpen = ref(false);
const isSettingsOpen = ref(false);
const zenMode = ref(false);
const isProgressDetailOpen = ref(false);
const levelUpToast = ref<{ levels: number[]; rewards: string[] } | null>(null);
const milestoneModal = ref<{ level: number; rewards: string[] } | null>(null);
const rewardCelebration = ref<{ level: number; rewards: string[] } | null>(null);
const hasHydrated = ref(false);
let levelUpTimer = null;
let progressSyncTimer = null;
let settingsSyncTimer = null;
let sessionsSyncTimer = null;

const clearBillingQuery = () => {
  const url = new URL(window.location.href);
  url.searchParams.delete('billing');
  url.searchParams.delete('session_id');
  window.history.replaceState({}, document.title, `${url.pathname}${url.search}${url.hash}`);
};

const syncBillingFromUrl = async () => {
  const url = new URL(window.location.href);
  const billingState = url.searchParams.get('billing');
  const sessionId = url.searchParams.get('session_id');

  if (billingState === 'success' && sessionId) {
    try {
      const response = await billingService.confirmCheckout(sessionId);
      if (response?.ok && response?.billing) {
        setIsPremium(Boolean(response.billing.isPremium));
      }
    } catch (error) {
      console.error('Stripe checkout tasdiqlanmadi:', error);
    } finally {
      clearBillingQuery();
    }
    return;
  }

  if (billingState === 'cancel') {
    clearBillingQuery();
  }
};

const localDateStamp = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const normalizeSessions = (rawSessions) => {
  return (Array.isArray(rawSessions) ? rawSessions : [])
    .filter((s) => s && typeof s === 'object')
    .map((s) => ({
      mode: s.mode || 'focus',
      timestamp: Number(s.timestamp) || Date.now(),
      duration: Number(s.duration) || 0
    }))
    .filter((s) => s.duration > 0)
    .slice(0, 500);
};

onMounted(() => {
  (async () => {
    if (getAuthToken()) {
      try {
        const bootstrap = await dataService.bootstrap();
        setIsPremium(Boolean(bootstrap.progress.isPremium ?? bootstrap.user?.isPremium));
        setTheme(bootstrap.progress.theme || bootstrap.user?.theme || 'default');
        setTimerSettings({ ...DEFAULT_SETTINGS, ...(bootstrap.settings || {}) });
        setSessions(normalizeSessions(bootstrap.sessions));
        setXp(Number(bootstrap.progress.xp) || 0);
        setLevel(Math.max(0, Number(bootstrap.progress.level) || 0));
        setTotalXp(Number(bootstrap.progress.totalXp) || 0);
        setUnlockedRewards(migrateRewardList(bootstrap.progress.unlockedRewards));
        setLatestRewardKey(ensureLatestReward(bootstrap.progress.latestRewardKey, bootstrap.progress.unlockedRewards));
        setStreak(Number(bootstrap.progress.streak) || 0);
        setLastActiveDate(bootstrap.progress.lastActiveDate || '');
        setDailyGoal({
          date: bootstrap.progress.dailyGoal?.date || localDateStamp(),
          targetXp: Number(bootstrap.progress.dailyGoal?.targetXp) || 150,
          currentXp: Number(bootstrap.progress.dailyGoal?.currentXp) || 0,
          completed: Boolean(bootstrap.progress.dailyGoal?.completed)
        });
        await syncBillingFromUrl();
      } catch (error) {
        console.error('Backend bootstrap xatoligi:', error);
      }
    }

    const resetMark = localStorage.getItem('zenflow-progress-reset-mark');
    if (resetMark !== RESET_PROGRESS_VERSION) {
      const resetGoal = {
        date: localDateStamp(),
        targetXp: 150,
        currentXp: 0,
        completed: false
      };

      setXp(0);
      setLevel(0);
      setTotalXp(0);
      setUnlockedRewards([]);
      setLatestRewardKey('');
      setStreak(0);
      setLastActiveDate('');
      setDailyGoal(resetGoal);
      setSessions([]);

      if (getAuthToken()) {
        try {
          await dataService.saveProgress({
            xp: 0,
            level: 0,
            totalXp: 0,
            unlockedRewards: [],
            latestRewardKey: '',
            streak: 0,
            lastActiveDate: '',
            dailyGoal: resetGoal,
            theme: theme.value || 'default',
            isPremium: Boolean(isPremium.value)
          });
        } catch (error) {
          console.error('Progress reset saqlanmadi:', error);
        }
      }

      localStorage.setItem('zenflow-progress-reset-mark', RESET_PROGRESS_VERSION);
    }

    if (!timerSettings.value?.alarmSound) {
      setTimerSettings({ ...DEFAULT_SETTINGS, ...timerSettings.value, alarmSound: 'digital' });
    }

    const safeLevel = Math.max(0, Number(level.value) || 0);
    const safeXp = Number(xp.value) || 0;
    const safeTotalXp = Number(totalXp.value) || 0;
    const safeStreak = Number(streak.value) || 0;
    const safeRewards = migrateRewardList(unlockedRewards.value);
    const safeLatestReward = ensureLatestReward(latestRewardKey.value, safeRewards);
    if (safeLevel !== level.value) setLevel(safeLevel);
    if (safeXp !== xp.value) setXp(safeXp);
    if (safeTotalXp !== totalXp.value) setTotalXp(safeTotalXp);
    if (safeStreak !== streak.value) setStreak(safeStreak);
    if (JSON.stringify(safeRewards) !== JSON.stringify(unlockedRewards.value)) setUnlockedRewards(safeRewards);
    if (safeLatestReward !== latestRewardKey.value) setLatestRewardKey(safeLatestReward);

    const today = localDateStamp();
    const goal = dailyGoal.value || {};
    if (!goal || typeof goal !== 'object' || goal.date !== today) {
      setDailyGoal({
        date: today,
        targetXp: Number(goal.targetXp) || 150,
        currentXp: 0,
        completed: false
      });
    } else {
      setDailyGoal({
        date: goal.date,
        targetXp: Number(goal.targetXp) || 150,
        currentXp: Number(goal.currentXp) || 0,
        completed: Boolean(goal.completed)
      });
    }

    const normalizedSessions = normalizeSessions(sessions.value);
    if (JSON.stringify(normalizedSessions) !== JSON.stringify(sessions.value)) {
      setSessions(normalizedSessions);
    }

    hasHydrated.value = true;
  })();
});

onBeforeUnmount(() => {
  if (levelUpTimer) clearTimeout(levelUpTimer);
  if (progressSyncTimer) clearTimeout(progressSyncTimer);
  if (settingsSyncTimer) clearTimeout(settingsSyncTimer);
  if (sessionsSyncTimer) clearTimeout(sessionsSyncTimer);
});

const dayDiff = (a, b) => {
  if (!a || !b) return 0;
  const d1 = new Date(`${a}T00:00:00`);
  const d2 = new Date(`${b}T00:00:00`);
  return Math.round((d2.getTime() - d1.getTime()) / 86400000);
};

const handleUpgrade = () => {
  isModalOpen.value = false;
  isBillingOpen.value = true;
};

const handleLogout = async () => {
  try {
    await authService.logout();
  } catch (error) {
    console.error('Logout xatoligi:', error);
  } finally {
    emit('logout');
  }
};

const toggleZenMode = () => {
  if (!isPremium.value) {
    isModalOpen.value = true;
    return;
  }
  zenMode.value = !zenMode.value;
};

const scrollToSection = (id: string) => {
  const el = document.getElementById(id);
  if (!el) return;
  el.scrollIntoView({ behavior: 'smooth', block: 'start' });
};

const cycleTheme = () => {
  if (!isPremium.value) {
    isModalOpen.value = true;
    return;
  }
  const themes = ['default', 'sunset', 'forest', 'midnight'];
  const currentIndex = themes.indexOf(theme.value);
  const nextIndex = (currentIndex + 1) % themes.length;
  setTheme(themes[nextIndex]);
};

watch(
  timerSettings,
  (value) => {
    if (!hasHydrated.value || !getAuthToken()) return;
    if (settingsSyncTimer) clearTimeout(settingsSyncTimer);
    settingsSyncTimer = setTimeout(async () => {
      try {
        await dataService.saveSettings(value);
      } catch (error) {
        console.error('Settings saqlanmadi:', error);
      }
    }, 250);
  },
  { deep: true }
);

watch(
  sessions,
  (value) => {
    if (!hasHydrated.value || !getAuthToken()) return;
    if (sessionsSyncTimer) clearTimeout(sessionsSyncTimer);
    sessionsSyncTimer = setTimeout(async () => {
      try {
        await dataService.saveStats(normalizeSessions(value));
      } catch (error) {
        console.error('Sessions saqlanmadi:', error);
      }
    }, 250);
  },
  { deep: true }
);

watch(
  [xp, level, totalXp, unlockedRewards, latestRewardKey, streak, lastActiveDate, dailyGoal, theme, isPremium],
  () => {
    if (!hasHydrated.value || !getAuthToken()) return;
    if (progressSyncTimer) clearTimeout(progressSyncTimer);
    progressSyncTimer = setTimeout(async () => {
      try {
        await dataService.saveProgress({
          xp: Number(xp.value) || 0,
          level: Math.max(0, Number(level.value) || 0),
          totalXp: Number(totalXp.value) || 0,
          unlockedRewards: migrateRewardList(unlockedRewards.value),
          latestRewardKey: ensureLatestReward(latestRewardKey.value, unlockedRewards.value),
          streak: Number(streak.value) || 0,
          lastActiveDate: lastActiveDate.value || '',
          dailyGoal: {
            date: dailyGoal.value?.date || localDateStamp(),
            targetXp: Number(dailyGoal.value?.targetXp) || 150,
            currentXp: Number(dailyGoal.value?.currentXp) || 0,
            completed: Boolean(dailyGoal.value?.completed)
          },
          theme: theme.value || 'default',
          isPremium: Boolean(isPremium.value)
        });
      } catch (error) {
        console.error('Progress saqlanmadi:', error);
      }
    }, 250);
  },
  { deep: true }
);

const addXp = (amount) => {
  const currentLevel = Math.max(0, Number(level.value) || 0);
  const currentXp = Number(xp.value) || 0;

  const multiplier = isPremium.value ? 2 : 1;
  const gained = Math.max(0, Math.round(amount * multiplier));
  if (gained <= 0) return;

  const today = localDateStamp();
  const diff = dayDiff(lastActiveDate.value, today);
  let nextStreak = Number(streak.value) || 0;
  if (!lastActiveDate.value) {
    nextStreak = 1;
    setStreak(nextStreak);
  } else if (diff === 1) {
    nextStreak = (Number(streak.value) || 0) + 1;
    setStreak(nextStreak);
  } else if (diff > 1) {
    nextStreak = 1;
    setStreak(nextStreak);
  }
  setLastActiveDate(today);

  let nextLevel = currentLevel;
  const streakMultiplier = getStreakMultiplier(nextStreak);
  const boostedGain = Math.max(1, Math.round(gained * streakMultiplier));
  let remainingXp = currentXp + boostedGain;
  const levelUps = [];
  const newRewardKeys = [];

  while (remainingXp >= xpNeededForLevel(nextLevel)) {
    remainingXp -= xpNeededForLevel(nextLevel);
    nextLevel += 1;
    levelUps.push(nextLevel);
    const rewards = getLevelRewards(nextLevel);
    rewards.forEach((r) => newRewardKeys.push(r.key));
  }

  setLevel(nextLevel);
  setXp(remainingXp);
  setTotalXp((Number(totalXp.value) || 0) + boostedGain);

  const goal = dailyGoal.value || {};
  const nextGoalXp = (Number(goal.currentXp) || 0) + boostedGain;
  const targetXp = Number(goal.targetXp) || 150;
  setDailyGoal({
    date: today,
    targetXp,
    currentXp: nextGoalXp,
    completed: nextGoalXp >= targetXp
  });

  if (newRewardKeys.length > 0) {
    const currentRewards = migrateRewardList(unlockedRewards.value);
    const merged = Array.from(new Set([...currentRewards, ...newRewardKeys]));
    setUnlockedRewards(merged);
    setLatestRewardKey(newRewardKeys[newRewardKeys.length - 1] || '');
    rewardCelebration.value = {
      level: levelUps.length ? levelUps[levelUps.length - 1] : nextLevel,
      rewards: Array.from(new Set(newRewardKeys))
    };
  }

  if (levelUps.length > 0) {
    levelUpToast.value = { levels: levelUps, rewards: newRewardKeys };
    if (levelUpTimer) clearTimeout(levelUpTimer);
    levelUpTimer = setTimeout(() => {
      levelUpToast.value = null;
    }, 3200);
  }

  const milestone = levelUps.filter((lvl) => lvl % 5 === 0).pop();
  if (milestone) {
    milestoneModal.value = { level: milestone, rewards: newRewardKeys };
  }
};

const themeBackground = computed(() => {
  switch (theme.value) {
    case 'sunset': return 'bg-[#2a1b1b]';
    case 'forest': return 'bg-[#0f2a1b]';
    case 'midnight': return 'bg-[#000000]';
    default: return 'bg-[#0f172a]';
  }
});

const xpNeededNow = computed(() => xpNeededForLevel(level.value));
const oakStage = computed(() => getOakStage(level.value));
const levelRankKey = computed(() => getLevelRankKey(level.value));
const nextRewardLevel = computed(() => getNextRewardLevel(level.value));
const streakMultiplier = computed(() => getStreakMultiplier(streak.value));
const dailyGoalProgress = computed(() => {
  const goal = dailyGoal.value || {};
  const target = Number(goal.targetXp) || 150;
  const current = Number(goal.currentXp) || 0;
  return Math.min(Math.round((current / target) * 100), 100);
});
const todayFocusMinutes = computed(() => {
  const today = localDateStamp();
  const list = Array.isArray(sessions.value) ? sessions.value : [];
  return list.reduce((sum, s) => {
    const stamp = new Date(Number(s.timestamp) || 0);
    const y = stamp.getFullYear();
    const m = String(stamp.getMonth() + 1).padStart(2, '0');
    const d = String(stamp.getDate()).padStart(2, '0');
    const day = `${y}-${m}-${d}`;
    if (day !== today) return sum;
    return sum + (Number(s.duration) || 0);
  }, 0);
});

const getPrimaryRewardKey = (rewards: string[] = []) => {
  if (!rewards.length) return 'oak.reward.badge';
  return rewards[rewards.length - 1];
};

const rewardVisuals = {
  badge: Trophy,
  aura: Shield,
  theme: Palette,
  flare: Flame,
  nova: Rocket,
  zen: Flower2,
  focus: Target,
  storm: CloudLightning,
  forest: Trees,
  lumen: Sun,
  pulse: Activity,
  crown: Medal
};

const getRewardIcon = (key: string) => rewardVisuals[getRewardIconKey(key)] || Trophy;

const getCelebrationCubeClass = (key: string) => {
  const cube = getRewardCubeClass(key);
  return String(cube).replace('reward-cube-', 'celebration-badge-');
};

</script>

<template>
  <div :class="clsx('min-h-screen relative overflow-x-hidden text-white font-sans selection:bg-rose-500/30 transition-colors duration-1000', themeBackground)">
    <div class="fixed inset-0 z-0 pointer-events-none">
      <template v-if="theme === 'default'">
        <div class="absolute top-[-10%] left-[-10%] w-[60%] h-[60%] rounded-full bg-purple-900/20 blur-[80px] md:blur-[120px] animate-float-slow" />
        <div class="absolute bottom-[-10%] right-[-10%] w-[60%] h-[60%] rounded-full bg-blue-900/20 blur-[80px] md:blur-[120px] animate-float-medium" />
        <div class="absolute top-[30%] left-[40%] w-[40%] h-[40%] rounded-full bg-rose-900/10 blur-[60px] md:blur-[100px] animate-float-fast" />
      </template>
      <div v-else-if="theme === 'sunset'" class="absolute inset-0 bg-gradient-to-br from-orange-900/20 via-red-900/10 to-purple-900/20" />
      <div v-else-if="theme === 'forest'" class="absolute inset-0 bg-gradient-to-br from-green-900/20 via-emerald-900/10 to-teal-900/20" />
      <div class="absolute inset-0 opacity-[0.03] bg-[url('https://www.transparenttextures.com/patterns/noise.png')]" />
    </div>

    <PremiumModal :is-open="isModalOpen" @close="isModalOpen = false" @upgrade="handleUpgrade" />
    <BillingModal
      :is-open="isBillingOpen"
      @close="isBillingOpen = false"
      @upgraded="
        () => {
          setIsPremium(true);
          isBillingOpen = false;
        }
      "
    />
    <SettingsModal :is-open="isSettingsOpen" :settings="timerSettings" @close="isSettingsOpen = false" @save="setTimerSettings" />

    <div :class="clsx('relative z-10 w-full mx-auto px-3 md:px-6 xl:px-10 py-4 md:py-10 pb-10 transition-opacity duration-500')">
      <header class="flex items-center justify-between mb-6 md:mb-10">
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 md:w-12 md:h-12 bg-gradient-to-br from-rose-400 to-orange-400 rounded-2xl flex items-center justify-center shadow-lg shadow-rose-500/20">
            <Sparkles class="text-white" :size="20" />
          </div>
          <div>
            <h1 class="text-xl md:text-3xl font-bold tracking-tight flex items-center gap-2">
              {{ t('app.name') }}
              <span v-if="isPremium" class="text-[9px] md:text-[10px] bg-gradient-to-r from-amber-300 to-amber-500 text-black font-extrabold px-2 py-0.5 rounded-full tracking-wider shadow-lg shadow-amber-500/20 uppercase">
                {{ t('premium.badge') }}
              </span>
            </h1>
            <p class="text-white/40 text-[10px] md:text-xs font-medium tracking-[0.2em] uppercase hidden md:block">
              {{ props.userName }}
            </p>
          </div>
        </div>

        <div class="flex items-center gap-2 md:gap-3">
          <LanguageSelector />
          <button @click="isSettingsOpen = true" class="md:hidden p-2.5 bg-white/5 rounded-xl text-white/70 border border-white/5 active:scale-95 transition-transform">
            <SettingsIcon :size="20" />
          </button>
          <button @click="isSettingsOpen = true" class="hidden md:block p-3 bg-white/5 hover:bg-white/10 rounded-xl text-white/70 hover:text-white transition-all hover:rotate-90 duration-500 border border-white/5" :title="t('settings')">
            <SettingsIcon :size="20" />
          </button>
          <button @click="handleLogout" class="p-3 bg-white/5 hover:bg-rose-500/20 rounded-xl text-white/70 hover:text-rose-400 transition-all border border-white/5" :title="t('logout')">
            <LogOut :size="20" />
          </button>
          <button v-if="!isPremium" @click="isModalOpen = true" class="hidden md:flex items-center gap-2 bg-gradient-to-r from-amber-400 to-orange-500 text-white text-sm font-bold px-5 py-3 rounded-xl shadow-lg shadow-amber-500/20 hover:scale-105 transition-all active:scale-95">
            <Crown :size="18" />
            <span>{{ t('premium.go') }}</span>
          </button>
        </div>
      </header>

      <div class="lg:hidden sticky top-2 z-20 mb-4">
        <div class="flex gap-2 overflow-x-auto rounded-2xl p-2 bg-black/30 backdrop-blur-xl border border-white/10">
          <button @click="scrollToSection('m-level')" class="px-3 py-1.5 text-xs rounded-lg bg-white/5 hover:bg-white/10 whitespace-nowrap">{{ t('level') }}</button>
          <button @click="scrollToSection('m-tasks')" class="px-3 py-1.5 text-xs rounded-lg bg-white/5 hover:bg-white/10 whitespace-nowrap">{{ t('tasks.title') }}</button>
          <button @click="scrollToSection('m-breath')" class="px-3 py-1.5 text-xs rounded-lg bg-white/5 hover:bg-white/10 whitespace-nowrap">{{ t('breath.title') }}</button>
          <button @click="scrollToSection('m-stats')" class="px-3 py-1.5 text-xs rounded-lg bg-white/5 hover:bg-white/10 whitespace-nowrap">{{ t('stats.title') }}</button>
          <button @click="scrollToSection('m-sounds')" class="px-3 py-1.5 text-xs rounded-lg bg-white/5 hover:bg-white/10 whitespace-nowrap">{{ t('sounds.title') }}</button>
          <button @click="scrollToSection('m-ai')" class="px-3 py-1.5 text-xs rounded-lg bg-white/5 hover:bg-white/10 whitespace-nowrap">{{ t('ai.title') }}</button>
        </div>
      </div>

      <div :class="clsx('hidden lg:grid gap-8 items-start w-full', zenMode ? 'grid-cols-12' : 'grid-cols-12')">
        <div :class="clsx(zenMode ? 'col-span-12' : 'col-span-7', zenMode ? '' : 'space-y-6')">
          <div
            :class="clsx(
              'relative',
              zenMode && 'fixed inset-0 z-50 bg-transparent flex items-center justify-center px-4 md:px-8 py-8 md:py-12'
            )"
          >
            <button
              v-if="zenMode"
              @click="toggleZenMode"
              class="absolute top-24 right-4 z-20 w-12 h-12 rounded-xl bg-white/10 hover:bg-white/20 text-white/70 hover:text-white transition-all border border-white/10 backdrop-blur-md"
            >
              <Minimize2 :size="22" class="mx-auto" />
            </button>
            <div :class="clsx('w-full', zenMode && 'max-w-[1100px]')">
              <Timer :settings="timerSettings" @complete="(mins) => addXp(mins * 10)" />
            </div>
            <div v-if="!zenMode" class="hidden lg:flex absolute right-4 top-[44%] -translate-y-1/2 z-20 flex-col gap-4">
              <button
                @click="cycleTheme"
                class="w-14 h-14 bg-white/5 hover:bg-white/10 rounded-xl text-white/70 hover:text-white transition-all border border-white/10 backdrop-blur-md"
                :title="t('theme')"
              >
                <Palette :size="22" class="mx-auto" />
              </button>
              <button
                @click="toggleZenMode"
                class="w-14 h-14 bg-white/5 hover:bg-white/10 rounded-xl text-white/70 hover:text-white transition-all border border-white/10 backdrop-blur-md"
                :title="t('zenMode')"
              >
                <Maximize2 :size="22" class="mx-auto" />
              </button>
            </div>
            <p v-if="zenMode" class="absolute bottom-8 left-1/2 -translate-x-1/2 text-white/25 text-xs md:text-sm tracking-[0.45em] uppercase">Zen Mode</p>
          </div>
          <template v-if="!zenMode">
            <SoundMixer :is-premium="isPremium" @open-premium="isModalOpen = true" />
            <AIAssistant :is-premium="isPremium" @open-premium="isModalOpen = true" />
          </template>
        </div>
        <div v-if="!zenMode" class="col-span-5 space-y-6">
          <Gamification
            :xp="xp"
            :level="level"
            :is-premium="isPremium"
            :total-xp="totalXp"
            :xp-needed="xpNeededNow"
            :oak-stage-key="oakStage.key"
            :oak-emoji="oakStage.emoji"
            :level-rank-key="levelRankKey"
            :streak="streak"
            :streak-multiplier="streakMultiplier"
            :next-reward-level="nextRewardLevel"
            :unlocked-rewards="unlockedRewards"
            :latest-reward-key="latestRewardKey"
            :daily-goal-progress="dailyGoalProgress"
            :daily-goal-target="dailyGoal.targetXp"
            :daily-goal-current="dailyGoal.currentXp"
            :daily-goal-completed="dailyGoal.completed"
            :today-focus-minutes="todayFocusMinutes"
            @open-detail="isProgressDetailOpen = true"
          />
          <div class="min-h-[220px] lg:sticky lg:top-24">
            <TaskList />
          </div>
          <BreathingExercise :is-premium="isPremium" @open-premium="isModalOpen = true" />
          <Stats :is-premium="isPremium" />
          <RewardCollection
            :unlocked-rewards="unlockedRewards"
            :latest-reward-key="latestRewardKey"
            :level="level"
            :next-reward-level="nextRewardLevel"
          />
        </div>
      </div>

      <div class="lg:hidden space-y-5">
        <div id="m-level" class="scroll-mt-24">
          <Gamification
            :xp="xp"
            :level="level"
            :is-premium="isPremium"
            :total-xp="totalXp"
            :xp-needed="xpNeededNow"
            :oak-stage-key="oakStage.key"
            :oak-emoji="oakStage.emoji"
            :level-rank-key="levelRankKey"
            :streak="streak"
            :streak-multiplier="streakMultiplier"
            :next-reward-level="nextRewardLevel"
            :unlocked-rewards="unlockedRewards"
            :latest-reward-key="latestRewardKey"
            :daily-goal-progress="dailyGoalProgress"
            :daily-goal-target="dailyGoal.targetXp"
            :daily-goal-current="dailyGoal.currentXp"
            :daily-goal-completed="dailyGoal.completed"
            :today-focus-minutes="todayFocusMinutes"
            @open-detail="isProgressDetailOpen = true"
          />
        </div>
        <div id="m-timer" class="scroll-mt-24">
          <Timer :settings="timerSettings" @complete="(mins) => addXp(mins * 10)" />
        </div>
        <div id="m-tasks" class="scroll-mt-24 min-h-[220px]">
          <TaskList />
        </div>
        <div id="m-breath" class="scroll-mt-24">
          <BreathingExercise :is-premium="isPremium" @open-premium="isModalOpen = true" />
        </div>
        <div id="m-stats" class="scroll-mt-24">
          <Stats :is-premium="isPremium" />
        </div>
        <div id="m-sounds" class="scroll-mt-24">
          <SoundMixer :is-premium="isPremium" @open-premium="isModalOpen = true" />
        </div>
        <div id="m-ai" class="scroll-mt-24">
          <AIAssistant :is-premium="isPremium" @open-premium="isModalOpen = true" />
        </div>
        <div class="scroll-mt-24">
          <RewardCollection
            :unlocked-rewards="unlockedRewards"
            :latest-reward-key="latestRewardKey"
            :level="level"
            :next-reward-level="nextRewardLevel"
          />
        </div>
      </div>

      <div
        v-if="levelUpToast"
        class="fixed top-6 left-1/2 -translate-x-1/2 z-50 w-[min(92vw,420px)] bg-gradient-to-br from-emerald-500/20 to-cyan-500/20 border border-emerald-300/40 backdrop-blur-xl rounded-2xl px-5 py-4 shadow-2xl"
      >
        <div class="flex items-center gap-3">
          <div
            :class="[
              'w-10 h-10 rounded-xl flex items-center justify-center text-white reward-cube',
              getRewardCubeClass(getPrimaryRewardKey(levelUpToast.rewards))
            ]"
          >
            <component :is="getRewardIcon(getPrimaryRewardKey(levelUpToast.rewards))" class="reward-cube-icon" :size="16" />
          </div>
          <div>
            <div class="text-emerald-100 text-sm font-semibold">{{ t('oak.levelup') }}</div>
            <div class="text-white text-sm mt-0.5">{{ t('level') }} {{ levelUpToast.levels[levelUpToast.levels.length - 1] }}</div>
          </div>
        </div>
        <div class="mt-2 text-xs text-white/85 font-medium">
          {{ getRewardLabel(getPrimaryRewardKey(levelUpToast.rewards), t) }}
        </div>
      </div>

      <div
        v-if="milestoneModal"
        class="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4"
      >
        <div class="w-full max-w-md rounded-3xl border border-amber-300/30 bg-[#111827]/90 p-6 shadow-2xl">
          <div class="flex items-start justify-between mb-4">
            <div>
              <p class="text-amber-300 text-xs uppercase tracking-[0.25em]">{{ t('progress.milestone') }}</p>
              <h3 class="text-white text-2xl font-bold mt-1">{{ t('level') }} {{ milestoneModal.level }}</h3>
            </div>
            <button
              class="w-10 h-10 flex items-center justify-center rounded-xl bg-white/10 text-white/80 hover:text-white hover:bg-white/20 transition-all"
              @click="milestoneModal = null"
            >
              <X :size="18" />
            </button>
          </div>

          <p class="text-white/70 text-sm mb-4">{{ t('oak.levelup') }}</p>

          <div class="grid grid-cols-1 gap-2">
            <div
              v-for="(rk, i) in (milestoneModal.rewards.length ? milestoneModal.rewards : ['oak.reward.badge'])"
              :key="`${rk}-${i}`"
              class="rounded-xl border border-amber-400/30 bg-amber-500/10 px-3 py-2 text-sm text-amber-100"
            >
              {{ getRewardLabel(rk, t) }}
            </div>
          </div>

          <button
            class="mt-5 w-full rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-semibold py-2.5"
            @click="milestoneModal = null"
          >
            {{ t('progress.continue') }}
          </button>
        </div>
      </div>

      <div
        v-if="rewardCelebration"
        class="fixed inset-0 z-[60] bg-black/75 backdrop-blur-md flex items-center justify-center p-4"
      >
        <div class="celebration-wrap pointer-events-none absolute inset-0 overflow-hidden">
          <span
            v-for="i in 28"
            :key="`confetti-${i}`"
            class="celebration-confetti"
            :style="{
              left: `${(i * 17) % 100}%`,
              animationDelay: `${(i % 9) * 0.12}s`,
              animationDuration: `${2.4 + (i % 5) * 0.25}s`
            }"
          />
        </div>

        <div class="relative w-full max-w-lg rounded-3xl border border-amber-300/35 bg-[#101726]/95 shadow-[0_0_80px_rgba(251,191,36,0.25)] p-6 md:p-7">
          <button
            class="absolute top-4 right-4 w-10 h-10 rounded-xl bg-white/10 hover:bg-white/20 text-white/80 hover:text-white transition-all flex items-center justify-center"
            @click="rewardCelebration = null"
          >
            <X :size="18" />
          </button>

          <p class="text-amber-300 text-xs uppercase tracking-[0.28em]">{{ t('progress.milestone') }}</p>
          <h3 class="text-white text-3xl font-extrabold mt-2">{{ t('oak.levelup') }}</h3>
          <p class="text-white/70 mt-1">{{ t('level') }} {{ rewardCelebration.level }}</p>

          <div class="my-6 flex items-center justify-center">
            <div :class="['celebration-badge', getCelebrationCubeClass(getPrimaryRewardKey(rewardCelebration.rewards))]">
              <span class="celebration-badge-layer celebration-badge-layer-back"></span>
              <span class="celebration-badge-layer celebration-badge-layer-mid"></span>
              <div :class="['celebration-badge-core', `${getCelebrationCubeClass(getPrimaryRewardKey(rewardCelebration.rewards))}-core`]">
                <component :is="getRewardIcon(getPrimaryRewardKey(rewardCelebration.rewards))" class="reward-cube-icon" :size="30" />
              </div>
              <span class="celebration-badge-shine"></span>
            </div>
          </div>

          <div class="flex items-center justify-center">
            <div class="rounded-xl border border-amber-300/40 bg-gradient-to-br from-amber-400/25 to-yellow-200/10 px-4 py-2 text-sm text-amber-50 font-semibold min-w-[220px] text-center">
              {{ getRewardLabel(getPrimaryRewardKey(rewardCelebration.rewards), t) }}
            </div>
          </div>

          <button
            class="mt-6 w-full rounded-xl bg-gradient-to-r from-amber-400 to-yellow-300 hover:from-amber-300 hover:to-yellow-200 text-black font-extrabold py-3 shadow-lg shadow-amber-500/25"
            @click="rewardCelebration = null"
          >
            {{ t('progress.continue') }}
          </button>
        </div>
      </div>

      <div
        v-if="isProgressDetailOpen"
      >
        <ProgressDetailView
          :level="level"
          :rank-key="levelRankKey"
          :total-xp="totalXp"
          :xp="xp"
          :xp-needed="xpNeededNow"
          :streak="streak"
          :streak-multiplier="streakMultiplier"
          :goal-current="dailyGoal.currentXp"
          :goal-target="dailyGoal.targetXp"
          :oak-stage-key="oakStage.key"
          :unlocked-rewards="unlockedRewards"
          :latest-reward-key="latestRewardKey"
          :sessions="sessions"
          @close="isProgressDetailOpen = false"
        />
      </div>
    </div>
  </div>
</template>
