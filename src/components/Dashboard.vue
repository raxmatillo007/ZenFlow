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
import { Sparkles, Crown, Settings as SettingsIcon, LogOut, Maximize2, Minimize2, Palette, X, Trophy, Shield, Medal, Flame, Rocket, Flower2, Target, CloudLightning, Trees, Sun, Activity, TimerReset, Goal, Waves } from 'lucide-vue-next';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { clsx } from 'clsx';
import { useLanguage } from '../context/language';
import { authService, billingService, dataService, getAuthToken } from '../services/api';
import { xpNeededForLevel, getOakStage, getLevelRankKey, getLevelRewards, getNextRewardLevel, getStreakMultiplier, migrateRewardList, ensureLatestReward, getRewardLabel, getRewardIconKey, getRewardCubeClass } from '../progression';

const props = defineProps({ userName: String });
const emit = defineEmits(['logout']);
const { t } = useLanguage();
const DEFAULT_SETTINGS = { focus: 25, shortBreak: 5, longBreak: 15, autoStartBreaks: false, autoStartPomodoros: false, alarmSound: 'digital' };
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
const [dailyGoal, setDailyGoal] = useLocalStorage('zenflow-daily-goal', { date: '', targetXp: 150, currentXp: 0, completed: false });
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
      if (response?.ok && response?.billing) setIsPremium(Boolean(response.billing.isPremium));
    } catch (error) {
      console.error('Stripe checkout tasdiqlanmadi:', error);
    } finally {
      clearBillingQuery();
    }
    return;
  }
  if (billingState === 'cancel') clearBillingQuery();
};

const localDateStamp = () => {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
};

const normalizeSessions = (rawSessions) => (Array.isArray(rawSessions) ? rawSessions : [])
  .filter((session) => session && typeof session === 'object')
  .map((session) => ({ mode: session.mode || 'focus', timestamp: Number(session.timestamp) || Date.now(), duration: Number(session.duration) || 0 }))
  .filter((session) => session.duration > 0)
  .slice(0, 500);

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
        setDailyGoal({ date: bootstrap.progress.dailyGoal?.date || localDateStamp(), targetXp: Number(bootstrap.progress.dailyGoal?.targetXp) || 150, currentXp: Number(bootstrap.progress.dailyGoal?.currentXp) || 0, completed: Boolean(bootstrap.progress.dailyGoal?.completed) });
        await syncBillingFromUrl();
      } catch (error) {
        console.error('Backend bootstrap xatoligi:', error);
      }
    }
    const resetMark = localStorage.getItem('zenflow-progress-reset-mark');
    if (resetMark !== RESET_PROGRESS_VERSION) {
      const resetGoal = { date: localDateStamp(), targetXp: 150, currentXp: 0, completed: false };
      setXp(0); setLevel(0); setTotalXp(0); setUnlockedRewards([]); setLatestRewardKey(''); setStreak(0); setLastActiveDate(''); setDailyGoal(resetGoal); setSessions([]);
      if (getAuthToken()) {
        try {
          await dataService.saveProgress({ xp: 0, level: 0, totalXp: 0, unlockedRewards: [], latestRewardKey: '', streak: 0, lastActiveDate: '', dailyGoal: resetGoal, theme: theme.value || 'default', isPremium: Boolean(isPremium.value) });
        } catch (error) {
          console.error('Progress reset saqlanmadi:', error);
        }
      }
      localStorage.setItem('zenflow-progress-reset-mark', RESET_PROGRESS_VERSION);
    }
    if (!timerSettings.value?.alarmSound) setTimerSettings({ ...DEFAULT_SETTINGS, ...timerSettings.value, alarmSound: 'digital' });
    const safeRewards = migrateRewardList(unlockedRewards.value);
    const safeLatestReward = ensureLatestReward(latestRewardKey.value, safeRewards);
    if (JSON.stringify(safeRewards) !== JSON.stringify(unlockedRewards.value)) setUnlockedRewards(safeRewards);
    if (safeLatestReward !== latestRewardKey.value) setLatestRewardKey(safeLatestReward);
    const today = localDateStamp();
    const goal = dailyGoal.value || {};
    setDailyGoal({ date: goal.date === today ? goal.date : today, targetXp: Number(goal.targetXp) || 150, currentXp: goal.date === today ? Number(goal.currentXp) || 0 : 0, completed: goal.date === today ? Boolean(goal.completed) : false });
    const normalized = normalizeSessions(sessions.value);
    if (JSON.stringify(normalized) !== JSON.stringify(sessions.value)) setSessions(normalized);
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

const handleUpgrade = () => { isModalOpen.value = false; isBillingOpen.value = true; };
const handleLogout = async () => { try { await authService.logout(); } catch (error) { console.error('Logout xatoligi:', error); } finally { emit('logout'); } };
const toggleZenMode = () => { if (!isPremium.value) { isModalOpen.value = true; return; } zenMode.value = !zenMode.value; };
const scrollToSection = (id: string) => { const el = document.getElementById(id); if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' }); };
const cycleTheme = () => {
  if (!isPremium.value) { isModalOpen.value = true; return; }
  const themes = ['default', 'sunset', 'forest', 'midnight'];
  setTheme(themes[(themes.indexOf(theme.value) + 1) % themes.length]);
};

watch(timerSettings, (value) => {
  if (!hasHydrated.value || !getAuthToken()) return;
  if (settingsSyncTimer) clearTimeout(settingsSyncTimer);
  settingsSyncTimer = setTimeout(async () => { try { await dataService.saveSettings(value); } catch (error) { console.error('Settings saqlanmadi:', error); } }, 250);
}, { deep: true });

watch(sessions, (value) => {
  if (!hasHydrated.value || !getAuthToken()) return;
  if (sessionsSyncTimer) clearTimeout(sessionsSyncTimer);
  sessionsSyncTimer = setTimeout(async () => { try { await dataService.saveStats(normalizeSessions(value)); } catch (error) { console.error('Sessions saqlanmadi:', error); } }, 250);
}, { deep: true });

watch([xp, level, totalXp, unlockedRewards, latestRewardKey, streak, lastActiveDate, dailyGoal, theme, isPremium], () => {
  if (!hasHydrated.value || !getAuthToken()) return;
  if (progressSyncTimer) clearTimeout(progressSyncTimer);
  progressSyncTimer = setTimeout(async () => {
    try {
      await dataService.saveProgress({ xp: Number(xp.value) || 0, level: Math.max(0, Number(level.value) || 0), totalXp: Number(totalXp.value) || 0, unlockedRewards: migrateRewardList(unlockedRewards.value), latestRewardKey: ensureLatestReward(latestRewardKey.value, unlockedRewards.value), streak: Number(streak.value) || 0, lastActiveDate: lastActiveDate.value || '', dailyGoal: { date: dailyGoal.value?.date || localDateStamp(), targetXp: Number(dailyGoal.value?.targetXp) || 150, currentXp: Number(dailyGoal.value?.currentXp) || 0, completed: Boolean(dailyGoal.value?.completed) }, theme: theme.value || 'default', isPremium: Boolean(isPremium.value) });
    } catch (error) { console.error('Progress saqlanmadi:', error); }
  }, 250);
}, { deep: true });

const addXp = (amount) => {
  const currentLevel = Math.max(0, Number(level.value) || 0);
  const currentXp = Number(xp.value) || 0;
  const gained = Math.max(0, Math.round(amount * (isPremium.value ? 2 : 1)));
  if (gained <= 0) return;
  const today = localDateStamp();
  const diff = dayDiff(lastActiveDate.value, today);
  let nextStreak = Number(streak.value) || 0;
  if (!lastActiveDate.value) nextStreak = 1;
  else if (diff === 1) nextStreak += 1;
  else if (diff > 1) nextStreak = 1;
  setStreak(nextStreak);
  setLastActiveDate(today);
  const boostedGain = Math.max(1, Math.round(gained * getStreakMultiplier(nextStreak)));
  let remainingXp = currentXp + boostedGain;
  let nextLevel = currentLevel;
  const levelUps = [];
  const newRewardKeys = [];
  while (remainingXp >= xpNeededForLevel(nextLevel)) {
    remainingXp -= xpNeededForLevel(nextLevel);
    nextLevel += 1;
    levelUps.push(nextLevel);
    getLevelRewards(nextLevel).forEach((reward) => newRewardKeys.push(reward.key));
  }
  setLevel(nextLevel);
  setXp(remainingXp);
  setTotalXp((Number(totalXp.value) || 0) + boostedGain);
  const goal = dailyGoal.value || {};
  const nextGoalXp = (Number(goal.currentXp) || 0) + boostedGain;
  const targetXp = Number(goal.targetXp) || 150;
  setDailyGoal({ date: today, targetXp, currentXp: nextGoalXp, completed: nextGoalXp >= targetXp });
  if (newRewardKeys.length > 0) {
    const merged = Array.from(new Set([...migrateRewardList(unlockedRewards.value), ...newRewardKeys]));
    setUnlockedRewards(merged);
    setLatestRewardKey(newRewardKeys[newRewardKeys.length - 1] || '');
    rewardCelebration.value = { level: levelUps.length ? levelUps[levelUps.length - 1] : nextLevel, rewards: Array.from(new Set(newRewardKeys)) };
  }
  if (levelUps.length > 0) {
    levelUpToast.value = { levels: levelUps, rewards: newRewardKeys };
    if (levelUpTimer) clearTimeout(levelUpTimer);
    levelUpTimer = setTimeout(() => { levelUpToast.value = null; }, 3200);
  }
  const milestone = levelUps.filter((lvl) => lvl % 5 === 0).pop();
  if (milestone) milestoneModal.value = { level: milestone, rewards: newRewardKeys };
};

const themeClasses = computed(() => {
  switch (theme.value) {
    case 'sunset': return { shell: 'from-[#26131a] via-[#1b1e33] to-[#090d17]', accent: 'from-orange-400 to-rose-400' };
    case 'forest': return { shell: 'from-[#071914] via-[#0c1b24] to-[#050a13]', accent: 'from-emerald-300 to-cyan-300' };
    case 'midnight': return { shell: 'from-[#030712] via-[#07111f] to-[#000000]', accent: 'from-sky-300 to-indigo-300' };
    default: return { shell: 'from-[#07111f] via-[#0d1526] to-[#060a12]', accent: 'from-rose-300 to-orange-300' };
  }
});
const xpNeededNow = computed(() => xpNeededForLevel(level.value));
const oakStage = computed(() => getOakStage(level.value));
const levelRankKey = computed(() => getLevelRankKey(level.value));
const nextRewardLevel = computed(() => getNextRewardLevel(level.value));
const streakMultiplier = computed(() => getStreakMultiplier(streak.value));
const dailyGoalProgress = computed(() => Math.min(Math.round(((Number(dailyGoal.value?.currentXp) || 0) / (Number(dailyGoal.value?.targetXp) || 150)) * 100), 100));
const todayFocusMinutes = computed(() => {
  const today = localDateStamp();
  return (Array.isArray(sessions.value) ? sessions.value : []).reduce((sum, session) => {
    const stamp = new Date(Number(session.timestamp) || 0);
    const day = `${stamp.getFullYear()}-${String(stamp.getMonth() + 1).padStart(2, '0')}-${String(stamp.getDate()).padStart(2, '0')}`;
    return day === today ? sum + (Number(session.duration) || 0) : sum;
  }, 0);
});
const focusCyclesToday = computed(() => {
  const today = localDateStamp();
  return (Array.isArray(sessions.value) ? sessions.value : []).filter((session) => {
    const stamp = new Date(Number(session.timestamp) || 0);
    return `${stamp.getFullYear()}-${String(stamp.getMonth() + 1).padStart(2, '0')}-${String(stamp.getDate()).padStart(2, '0')}` === today;
  }).length;
});
const heroCards = computed(() => [
  { key: 'focus', label: t('progress.today_focus'), value: `${todayFocusMinutes.value} ${t('timer.minutes')}`, icon: TimerReset },
  { key: 'goal', label: t('progress.daily_goal'), value: `${dailyGoalProgress.value}%`, icon: Goal },
  { key: 'sound', label: t('sounds.title'), value: `${focusCyclesToday.value}`, icon: Waves }
]);
const mobileSections = computed(() => [
  { id: 'm-level', label: t('level') }, { id: 'm-timer', label: t('timer.focus') }, { id: 'm-tasks', label: t('tasks.title') }, { id: 'm-breath', label: t('breath.title') }, { id: 'm-stats', label: t('stats.title') }, { id: 'm-sounds', label: t('sounds.title') }, { id: 'm-ai', label: t('ai.title') }
]);
const getPrimaryRewardKey = (rewards: string[] = []) => rewards.length ? rewards[rewards.length - 1] : 'oak.reward.badge';
const rewardVisuals = { badge: Trophy, aura: Shield, theme: Palette, flare: Flame, nova: Rocket, zen: Flower2, focus: Target, storm: CloudLightning, forest: Trees, lumen: Sun, pulse: Activity, crown: Medal };
const getRewardIcon = (key: string) => rewardVisuals[getRewardIconKey(key)] || Trophy;
const getCelebrationCubeClass = (key: string) => String(getRewardCubeClass(key)).replace('reward-cube-', 'celebration-badge-');
</script>

<template>
  <div :class="clsx('min-h-screen bg-gradient-to-b text-white transition-colors duration-1000', themeClasses.shell)">
    <div class="fixed inset-0 pointer-events-none">
      <div class="absolute left-[-10%] top-[-8%] h-[28rem] w-[28rem] rounded-full bg-rose-500/12 blur-[140px] animate-float-slow" />
      <div class="absolute right-[-8%] top-[12%] h-[24rem] w-[24rem] rounded-full bg-cyan-500/10 blur-[120px] animate-float-medium" />
      <div class="absolute bottom-[-10%] left-[20%] h-[22rem] w-[22rem] rounded-full bg-emerald-500/10 blur-[120px] animate-float-fast" />
      <div class="absolute inset-0 surface-grid opacity-[0.07]" />
    </div>
    <PremiumModal :is-open="isModalOpen" @close="isModalOpen = false" @upgrade="handleUpgrade" />
    <BillingModal :is-open="isBillingOpen" @close="isBillingOpen = false" @upgraded="() => { setIsPremium(true); isBillingOpen = false; }" />
    <SettingsModal :is-open="isSettingsOpen" :settings="timerSettings" @close="isSettingsOpen = false" @save="setTimerSettings" />
    <div class="relative z-10 mx-auto w-full max-w-[1440px] px-4 py-4 pb-10 md:px-6 md:py-8 xl:px-8">
      <header class="glass-panel overflow-hidden rounded-[2rem] px-4 py-4 md:px-6">
        <div class="flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
          <div class="flex items-start gap-4">
            <div :class="clsx('grid h-12 w-12 place-items-center rounded-[1.2rem] bg-gradient-to-br shadow-lg', themeClasses.accent)"><Sparkles class="text-white" :size="22" /></div>
            <div>
              <div class="flex flex-wrap items-center gap-2">
                <h1 class="font-display text-2xl font-bold tracking-tight md:text-3xl">{{ t('app.name') }}</h1>
                <span v-if="isPremium" class="rounded-full bg-gradient-to-r from-amber-300 to-orange-400 px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-[0.22em] text-slate-950">{{ t('premium.badge') }}</span>
              </div>
              <p class="mt-1 text-sm text-white/55">{{ props.userName || t('welcome') }} · {{ t(levelRankKey) }}</p>
              <div class="mt-3 flex flex-wrap gap-2">
                <span class="badge-chip text-white/70">{{ t('streak') }}: {{ streak }}</span>
                <span class="badge-chip text-white/70">{{ t('progress.daily_goal') }}: {{ dailyGoalProgress }}%</span>
                <span class="badge-chip text-white/70">{{ todayFocusMinutes }} {{ t('timer.minutes') }}</span>
              </div>
            </div>
          </div>
          <div class="flex flex-wrap items-center gap-2">
            <LanguageSelector />
            <button @click="cycleTheme" class="rounded-xl border border-white/10 bg-white/5 p-3 text-white/75 transition-colors hover:bg-white/10 hover:text-white" :title="t('theme')"><Palette :size="18" /></button>
            <button @click="toggleZenMode" class="rounded-xl border border-white/10 bg-white/5 p-3 text-white/75 transition-colors hover:bg-white/10 hover:text-white" :title="t('zenMode')"><Maximize2 v-if="!zenMode" :size="18" /><Minimize2 v-else :size="18" /></button>
            <button @click="isSettingsOpen = true" class="rounded-xl border border-white/10 bg-white/5 p-3 text-white/75 transition-colors hover:bg-white/10 hover:text-white" :title="t('settings')"><SettingsIcon :size="18" /></button>
            <button @click="handleLogout" class="rounded-xl border border-white/10 bg-white/5 p-3 text-white/75 transition-colors hover:bg-rose-500/12 hover:text-rose-200" :title="t('logout')"><LogOut :size="18" /></button>
            <button v-if="!isPremium" @click="isModalOpen = true" class="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-amber-400 to-orange-500 px-4 py-3 text-sm font-bold text-white shadow-lg shadow-amber-500/20 transition-transform hover:scale-[1.01]"><Crown :size="16" />{{ t('premium.go') }}</button>
          </div>
        </div>
        <div class="mt-5 grid gap-3 md:grid-cols-3">
          <div v-for="card in heroCards" :key="card.key" class="rounded-[1.5rem] border border-white/8 bg-black/20 p-4">
            <div class="flex items-center justify-between"><p class="text-[11px] uppercase tracking-[0.22em] text-white/35">{{ card.label }}</p><component :is="card.icon" :size="16" class="text-white/50" /></div>
            <p class="mt-3 text-xl font-semibold text-white">{{ card.value }}</p>
          </div>
        </div>
      </header>
      <div class="mt-4 lg:hidden sticky top-2 z-20">
        <div class="glass-panel custom-scrollbar flex gap-2 overflow-x-auto rounded-[1.4rem] p-2">
          <button v-for="section in mobileSections" :key="section.id" @click="scrollToSection(section.id)" class="whitespace-nowrap rounded-xl bg-white/5 px-3 py-2 text-xs font-semibold text-white/70 transition-colors hover:bg-white/10 hover:text-white">{{ section.label }}</button>
        </div>
      </div>

      <div class="mt-5" v-if="zenMode">
        <div class="relative">
          <button @click="toggleZenMode" class="absolute right-3 top-3 z-20 rounded-xl border border-white/10 bg-white/8 p-3 text-white/70 transition-colors hover:bg-white/16 hover:text-white"><Minimize2 :size="18" /></button>
          <Timer :settings="timerSettings" @complete="(mins) => addXp(mins * 10)" />
        </div>
      </div>

      <template v-else>
        <div class="mt-5 hidden items-start gap-6 lg:grid lg:grid-cols-[minmax(0,1.2fr)_minmax(320px,0.8fr)] xl:grid-cols-[minmax(0,1.28fr)_minmax(360px,0.82fr)]">
          <div class="min-w-0 space-y-6">
            <Timer :settings="timerSettings" @complete="(mins) => addXp(mins * 10)" />
            <div class="grid min-w-0 gap-6 xl:grid-cols-2">
              <div class="min-w-0"><SoundMixer :is-premium="isPremium" @open-premium="isModalOpen = true" /></div>
              <div class="min-w-0"><AIAssistant :is-premium="isPremium" @open-premium="isModalOpen = true" /></div>
            </div>
            <div class="grid min-w-0 gap-6 xl:grid-cols-2">
              <div class="min-w-0"><Stats :is-premium="isPremium" /></div>
              <div class="min-w-0"><RewardCollection :unlocked-rewards="unlockedRewards" :latest-reward-key="latestRewardKey" :level="level" :next-reward-level="nextRewardLevel" /></div>
            </div>
          </div>
          <div class="min-w-0 space-y-6 lg:sticky lg:top-6">
            <Gamification :xp="xp" :level="level" :is-premium="isPremium" :total-xp="totalXp" :xp-needed="xpNeededNow" :oak-stage-key="oakStage.key" :oak-emoji="oakStage.emoji" :level-rank-key="levelRankKey" :streak="streak" :streak-multiplier="streakMultiplier" :next-reward-level="nextRewardLevel" :unlocked-rewards="unlockedRewards" :latest-reward-key="latestRewardKey" :daily-goal-progress="dailyGoalProgress" :daily-goal-target="dailyGoal.targetXp" :daily-goal-current="dailyGoal.currentXp" :daily-goal-completed="dailyGoal.completed" :today-focus-minutes="todayFocusMinutes" @open-detail="isProgressDetailOpen = true" />
            <TaskList />
            <BreathingExercise :is-premium="isPremium" @open-premium="isModalOpen = true" />
          </div>
        </div>

        <div class="mt-5 space-y-5 lg:hidden">
          <div id="m-level" class="scroll-mt-24">
            <Gamification :xp="xp" :level="level" :is-premium="isPremium" :total-xp="totalXp" :xp-needed="xpNeededNow" :oak-stage-key="oakStage.key" :oak-emoji="oakStage.emoji" :level-rank-key="levelRankKey" :streak="streak" :streak-multiplier="streakMultiplier" :next-reward-level="nextRewardLevel" :unlocked-rewards="unlockedRewards" :latest-reward-key="latestRewardKey" :daily-goal-progress="dailyGoalProgress" :daily-goal-target="dailyGoal.targetXp" :daily-goal-current="dailyGoal.currentXp" :daily-goal-completed="dailyGoal.completed" :today-focus-minutes="todayFocusMinutes" @open-detail="isProgressDetailOpen = true" />
          </div>
          <div id="m-timer" class="scroll-mt-24"><Timer :settings="timerSettings" @complete="(mins) => addXp(mins * 10)" /></div>
          <div id="m-tasks" class="scroll-mt-24"><TaskList /></div>
          <div id="m-breath" class="scroll-mt-24"><BreathingExercise :is-premium="isPremium" @open-premium="isModalOpen = true" /></div>
          <div id="m-stats" class="scroll-mt-24"><Stats :is-premium="isPremium" /></div>
          <div id="m-sounds" class="scroll-mt-24"><SoundMixer :is-premium="isPremium" @open-premium="isModalOpen = true" /></div>
          <div id="m-ai" class="scroll-mt-24"><AIAssistant :is-premium="isPremium" @open-premium="isModalOpen = true" /></div>
          <div class="scroll-mt-24"><RewardCollection :unlocked-rewards="unlockedRewards" :latest-reward-key="latestRewardKey" :level="level" :next-reward-level="nextRewardLevel" /></div>
        </div>
      </template>

      <div v-if="levelUpToast" class="fixed left-1/2 top-6 z-50 w-[min(92vw,420px)] -translate-x-1/2 rounded-2xl border border-emerald-300/35 bg-gradient-to-br from-emerald-500/18 to-cyan-500/18 px-5 py-4 shadow-2xl backdrop-blur-xl">
        <div class="flex items-center gap-3">
          <div :class="['w-10 h-10 rounded-xl flex items-center justify-center text-white reward-cube', getRewardCubeClass(getPrimaryRewardKey(levelUpToast.rewards))]"><component :is="getRewardIcon(getPrimaryRewardKey(levelUpToast.rewards))" class="reward-cube-icon" :size="16" /></div>
          <div><div class="text-sm font-semibold text-emerald-100">{{ t('oak.levelup') }}</div><div class="mt-0.5 text-sm text-white">{{ t('level') }} {{ levelUpToast.levels[levelUpToast.levels.length - 1] }}</div></div>
        </div>
        <div class="mt-2 text-xs font-medium text-white/85">{{ getRewardLabel(getPrimaryRewardKey(levelUpToast.rewards), t) }}</div>
      </div>

      <div v-if="milestoneModal" class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
        <div class="w-full max-w-md rounded-3xl border border-amber-300/30 bg-[#111827]/90 p-6 shadow-2xl">
          <div class="mb-4 flex items-start justify-between">
            <div><p class="text-xs uppercase tracking-[0.25em] text-amber-300">{{ t('progress.milestone') }}</p><h3 class="mt-1 text-2xl font-bold text-white">{{ t('level') }} {{ milestoneModal.level }}</h3></div>
            <button class="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10 text-white/80 transition-all hover:bg-white/20 hover:text-white" @click="milestoneModal = null"><X :size="18" /></button>
          </div>
          <p class="mb-4 text-sm text-white/70">{{ t('oak.levelup') }}</p>
          <div class="grid gap-2">
            <div v-for="(rewardKey, i) in (milestoneModal.rewards.length ? milestoneModal.rewards : ['oak.reward.badge'])" :key="`${rewardKey}-${i}`" class="rounded-xl border border-amber-400/30 bg-amber-500/10 px-3 py-2 text-sm text-amber-100">{{ getRewardLabel(rewardKey, t) }}</div>
          </div>
          <button class="mt-5 w-full rounded-xl bg-amber-500 py-2.5 font-semibold text-black hover:bg-amber-400" @click="milestoneModal = null">{{ t('progress.continue') }}</button>
        </div>
      </div>

      <div v-if="rewardCelebration" class="fixed inset-0 z-[60] flex items-center justify-center bg-black/75 p-4 backdrop-blur-md">
        <div class="pointer-events-none absolute inset-0 overflow-hidden">
          <span v-for="i in 28" :key="`confetti-${i}`" class="celebration-confetti" :style="{ left: `${(i * 17) % 100}%`, animationDelay: `${(i % 9) * 0.12}s`, animationDuration: `${2.4 + (i % 5) * 0.25}s` }" />
        </div>
        <div class="relative w-full max-w-lg rounded-3xl border border-amber-300/35 bg-[#101726]/95 p-6 shadow-[0_0_80px_rgba(251,191,36,0.25)] md:p-7">
          <button class="absolute right-4 top-4 flex h-10 w-10 items-center justify-center rounded-xl bg-white/10 text-white/80 transition-all hover:bg-white/20 hover:text-white" @click="rewardCelebration = null"><X :size="18" /></button>
          <p class="text-xs uppercase tracking-[0.28em] text-amber-300">{{ t('progress.milestone') }}</p>
          <h3 class="mt-2 text-3xl font-extrabold text-white">{{ t('oak.levelup') }}</h3>
          <p class="mt-1 text-white/70">{{ t('level') }} {{ rewardCelebration.level }}</p>
          <div class="my-6 flex items-center justify-center">
            <div :class="['celebration-badge', getCelebrationCubeClass(getPrimaryRewardKey(rewardCelebration.rewards))]">
              <span class="celebration-badge-layer celebration-badge-layer-back"></span>
              <span class="celebration-badge-layer celebration-badge-layer-mid"></span>
              <div :class="['celebration-badge-core', `${getCelebrationCubeClass(getPrimaryRewardKey(rewardCelebration.rewards))}-core`]"><component :is="getRewardIcon(getPrimaryRewardKey(rewardCelebration.rewards))" class="reward-cube-icon" :size="30" /></div>
              <span class="celebration-badge-shine"></span>
            </div>
          </div>
          <div class="flex items-center justify-center"><div class="min-w-[220px] rounded-xl border border-amber-300/40 bg-gradient-to-br from-amber-400/25 to-yellow-200/10 px-4 py-2 text-center text-sm font-semibold text-amber-50">{{ getRewardLabel(getPrimaryRewardKey(rewardCelebration.rewards), t) }}</div></div>
          <button class="mt-6 w-full rounded-xl bg-gradient-to-r from-amber-400 to-yellow-300 py-3 font-extrabold text-black shadow-lg shadow-amber-500/25 hover:from-amber-300 hover:to-yellow-200" @click="rewardCelebration = null">{{ t('progress.continue') }}</button>
        </div>
      </div>

      <ProgressDetailView v-if="isProgressDetailOpen" :level="level" :rank-key="levelRankKey" :total-xp="totalXp" :xp="xp" :xp-needed="xpNeededNow" :streak="streak" :streak-multiplier="streakMultiplier" :goal-current="dailyGoal.currentXp" :goal-target="dailyGoal.targetXp" :oak-stage-key="oakStage.key" :unlocked-rewards="unlockedRewards" :latest-reward-key="latestRewardKey" :sessions="sessions" @close="isProgressDetailOpen = false" />
    </div>
  </div>
</template>
