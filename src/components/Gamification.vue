<script setup>
import { computed } from 'vue';
import { Zap, Leaf, Sparkles, Trophy, Shield, Palette, Flame, Rocket, Flower2, Target, CloudLightning, Trees, Sun, Activity, Medal } from 'lucide-vue-next';
import { clsx } from 'clsx';
import { useLanguage } from '../context/language';
import OakTree from './OakTree.vue';
import { ensureLatestReward, getRewardCubeClass, getRewardIconKey, getRewardLabel } from '../progression';

const props = defineProps({
  xp: Number,
  level: Number,
  isPremium: Boolean,
  totalXp: Number,
  xpNeeded: Number,
  oakStageKey: String,
  oakEmoji: String,
  levelRankKey: String,
  streak: Number,
  streakMultiplier: Number,
  nextRewardLevel: Number,
  unlockedRewards: Array,
  latestRewardKey: String,
  dailyGoalProgress: Number,
  dailyGoalTarget: Number,
  dailyGoalCurrent: Number,
  dailyGoalCompleted: Boolean,
  todayFocusMinutes: Number
});
const emit = defineEmits(['open-detail']);

const { t } = useLanguage();
const progress = computed(() => Math.min(((props.xp || 0) / (props.xpNeeded || 1)) * 100, 100));
const goalProgress = computed(() => Math.max(0, Math.min(Number(props.dailyGoalProgress) || 0, 100)));
const goalCircumference = 2 * Math.PI * 18;
const goalOffset = computed(() => goalCircumference - ((goalProgress.value / 100) * goalCircumference));
const latestReward = computed(() => {
  return ensureLatestReward(props.latestRewardKey, props.unlockedRewards) || null;
});
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
</script>

<template>
  <div class="bg-white/10 backdrop-blur-md border border-white/20 rounded-3xl p-6 w-full mb-6 relative overflow-hidden">
    <div class="flex items-center justify-between mb-4">
      <div class="flex items-center gap-3">
        <div class="w-12 h-12 rounded-2xl bg-gradient-to-br from-yellow-400 to-orange-500 flex items-center justify-center shadow-lg shadow-orange-500/20 text-white font-bold text-xl">
          {{ props.level }}
        </div>
        <div>
          <h3 class="text-white font-bold text-lg leading-none">{{ t('level') }} {{ props.level }}</h3>
          <p class="text-white/50 text-xs mt-1 font-medium tracking-wide">
            {{ t(props.levelRankKey || 'oak.rank.rookie') }}
          </p>
        </div>
      </div>

      <div class="text-right">
        <div class="flex items-center gap-1 justify-end text-amber-400 font-bold">
          <Zap :size="16" />
          <span>{{ props.totalXp || 0 }} XP</span>
        </div>
        <p class="text-white/30 text-[10px] uppercase tracking-wider">
          {{ t('streak') }}: {{ props.streak || 0 }} | x{{ (props.streakMultiplier || 1).toFixed(2) }}
        </p>
        <button
          class="mt-2 text-xs px-3 py-1.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 border border-amber-300/30 text-amber-100 transition-all"
          @click="emit('open-detail')"
        >
          {{ t('progress.detail_btn') }}
        </button>
      </div>
    </div>

    <div class="rounded-2xl border border-emerald-400/20 bg-emerald-500/5 p-4 mb-4">
      <div class="flex items-center gap-4 justify-between">
        <div :class="clsx(progress > 75 && 'animate-breathe')">
          <OakTree :level="props.level" />
        </div>
        <div class="flex-1">
          <p class="text-emerald-200 text-xs uppercase tracking-[0.2em]">{{ t('oak.growth') }}</p>
          <p class="text-white text-lg font-semibold">{{ t(props.oakStageKey || 'oak.stage.seed') }}</p>
          <p class="text-white/60 text-xs mt-1">{{ t('oak.next_reward') }}: {{ props.nextRewardLevel }}</p>
        </div>
        <div class="relative w-12 h-12">
          <svg viewBox="0 0 44 44" class="w-12 h-12 -rotate-90">
            <circle cx="22" cy="22" r="18" stroke="currentColor" stroke-width="4" fill="none" class="text-white/15" />
            <circle
              cx="22"
              cy="22"
              r="18"
              stroke="currentColor"
              stroke-width="4"
              fill="none"
              :stroke-dasharray="goalCircumference"
              :stroke-dashoffset="goalOffset"
              stroke-linecap="round"
              :class="clsx('transition-all duration-700', props.dailyGoalCompleted ? 'text-emerald-300' : 'text-cyan-300')"
            />
          </svg>
          <div class="absolute inset-0 flex items-center justify-center text-[10px] font-bold text-white">
            {{ goalProgress }}%
          </div>
        </div>
      </div>
      <p class="text-[11px] text-white/60 mt-3">
        {{ t('progress.daily_goal') }}: {{ props.dailyGoalCurrent || 0 }} / {{ props.dailyGoalTarget || 150 }} XP
      </p>
      <p class="text-[11px] text-cyan-200/80 mt-1">
        {{ t('progress.today_focus') }}: {{ props.todayFocusMinutes || 0 }} {{ t('timer.minutes') }}
      </p>
      <div
        v-if="props.dailyGoalCompleted"
        class="mt-2 inline-flex items-center gap-1 px-2 py-1 rounded-full text-[10px] font-semibold bg-emerald-400/20 text-emerald-200 border border-emerald-300/30"
      >
        <Sparkles :size="12" />
        {{ t('progress.daily_completed') }}
      </div>
    </div>

    <div class="relative h-3 w-full bg-black/30 rounded-full overflow-hidden mb-4">
      <div
        :class="clsx(
          'absolute top-0 left-0 h-full rounded-full transition-all duration-1000',
          'bg-gradient-to-r from-yellow-400 via-orange-400 to-emerald-400'
        )"
        :style="{ width: `${progress}%` }"
      >
        <div class="absolute inset-0 bg-white/20 animate-pulse" />
      </div>
    </div>
    <div class="flex items-center justify-between text-xs text-white/60 mb-4">
      <span>{{ props.xp || 0 }} / {{ props.xpNeeded || 0 }} {{ t('xp') }}</span>
      <span>{{ t('nextLevel') }}: {{ (Number(props.level) || 0) + 1 }}</span>
    </div>

    <div class="rounded-xl border border-white/10 bg-black/20 p-3 min-h-[72px] flex items-center gap-3">
      <div
        :class="clsx(
          'w-10 h-10 rounded-xl flex items-center justify-center',
          latestReward ? `reward-cube ${getRewardCubeClass(latestReward)} text-white` : 'bg-white/10 text-white/50'
        )"
      >
        <component
          v-if="latestReward"
          :is="rewardVisuals[getRewardIconKey(latestReward)] || Leaf"
          class="reward-cube-icon"
          :size="16"
        />
        <Leaf v-else :size="16" />
      </div>
      <span class="text-xs text-white/90 font-semibold">
        {{ latestReward ? getRewardLabel(latestReward, t) : t('progress.locked') }}
      </span>
    </div>
  </div>
</template>
