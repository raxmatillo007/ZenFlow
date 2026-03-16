<script setup>
import { computed } from 'vue';
import { X, Zap, Flame, Target, Sparkles, Leaf, Lock, Trophy, Shield, Palette, Rocket, Flower2, CloudLightning, Trees, Sun, Activity, Medal } from 'lucide-vue-next';
import { useLanguage } from '../context/language';
import OakTree from './OakTree.vue';
import { migrateRewardList, getAllRewardPreviewKeys, getRewardCubeClass, getRewardIconKey, getRewardLabel } from '../progression';

const props = defineProps({
  level: Number,
  rankKey: String,
  totalXp: Number,
  xp: Number,
  xpNeeded: Number,
  streak: Number,
  streakMultiplier: Number,
  goalCurrent: Number,
  goalTarget: Number,
  oakStageKey: String,
  unlockedRewards: Array,
  latestRewardKey: String,
  sessions: Array
});

defineEmits(['close']);

const { t } = useLanguage();

const progressPct = computed(() => Math.min(((props.xp || 0) / (props.xpNeeded || 1)) * 100, 100));
const goalPct = computed(() => Math.min(((props.goalCurrent || 0) / (props.goalTarget || 1)) * 100, 100));

const unlockedSet = computed(() => {
  return new Set(migrateRewardList(props.unlockedRewards));
});

const rewardItems = computed(() => {
  const unlocked = migrateRewardList(props.unlockedRewards);
  const count = Math.min(Math.max(unlocked.length + 12, 30), 120);
  const preview = getAllRewardPreviewKeys(count);
  return preview.map((key) => ({ key, unlocked: unlockedSet.value.has(key) }));
});

const recentSessions = computed(() => {
  const list = Array.isArray(props.sessions) ? props.sessions : [];
  return list.slice(0, 30);
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
  <div class="fixed inset-0 z-50 bg-black/65 backdrop-blur-sm p-3 md:p-8 overflow-hidden">
    <div class="max-w-6xl mx-auto rounded-3xl border border-white/15 bg-[#0b1220]/95 p-4 md:p-8 shadow-2xl max-h-[92vh] flex flex-col">
      <div class="flex items-start justify-between gap-4 mb-6">
        <div>
          <p class="text-emerald-300 text-xs uppercase tracking-[0.2em]">{{ t('progress.detail') }}</p>
          <h2 class="text-white text-2xl md:text-3xl font-bold mt-1">{{ t('level') }} {{ props.level }}</h2>
          <p class="text-white/60 text-sm mt-1">{{ t(props.rankKey || 'oak.rank.rookie') }}</p>
        </div>
        <button class="w-11 h-11 rounded-xl bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-all" @click="$emit('close')">
          <X :size="18" />
        </button>
      </div>

      <div class="flex-1 overflow-hidden flex flex-col gap-6">
      <div class="grid grid-cols-1 lg:grid-cols-12 gap-4 md:gap-6">
        <div class="lg:col-span-4 rounded-2xl border border-emerald-400/20 bg-emerald-500/5 p-4">
          <div class="flex items-center gap-4">
            <OakTree :level="props.level" />
            <div>
              <p class="text-xs text-emerald-200 uppercase tracking-[0.2em]">{{ t('oak.growth') }}</p>
              <p class="text-white text-lg font-semibold">{{ t(props.oakStageKey || 'oak.stage.seed') }}</p>
            </div>
          </div>
          <div class="mt-4">
            <div class="flex justify-between text-xs text-white/70 mb-1">
              <span>{{ props.xp || 0 }} / {{ props.xpNeeded || 0 }} XP</span>
              <span>{{ Math.round(progressPct) }}%</span>
            </div>
            <div class="h-2 w-full bg-black/40 rounded-full overflow-hidden">
              <div class="h-full bg-gradient-to-r from-yellow-400 via-orange-400 to-emerald-400" :style="{ width: `${progressPct}%` }"></div>
            </div>
          </div>
        </div>

        <div class="lg:col-span-8 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div class="rounded-2xl border border-white/10 bg-black/20 p-4">
            <p class="text-xs text-white/50 uppercase">{{ t('progress.total_xp') }}</p>
            <p class="text-2xl font-bold text-amber-300 mt-1 flex items-center gap-2"><Zap :size="18" /> {{ props.totalXp || 0 }}</p>
          </div>
          <div class="rounded-2xl border border-white/10 bg-black/20 p-4">
            <p class="text-xs text-white/50 uppercase">{{ t('streak') }}</p>
            <p class="text-2xl font-bold text-rose-300 mt-1 flex items-center gap-2"><Flame :size="18" /> {{ props.streak || 0 }}</p>
            <p class="text-xs text-white/60 mt-1">x{{ (props.streakMultiplier || 1).toFixed(2) }}</p>
          </div>
          <div class="rounded-2xl border border-white/10 bg-black/20 p-4">
            <p class="text-xs text-white/50 uppercase">{{ t('progress.daily_goal') }}</p>
            <p class="text-2xl font-bold text-cyan-300 mt-1 flex items-center gap-2"><Target :size="18" /> {{ props.goalCurrent || 0 }}/{{ props.goalTarget || 150 }}</p>
            <div class="h-1.5 bg-black/40 rounded-full mt-2 overflow-hidden">
              <div class="h-full bg-cyan-400" :style="{ width: `${goalPct}%` }"></div>
            </div>
          </div>
        </div>
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-12 gap-4 md:gap-6 min-h-0">
        <div class="lg:col-span-5 rounded-2xl border border-white/10 bg-black/20 p-4 min-h-[280px] overflow-y-auto custom-scrollbar">
          <h3 class="text-white font-semibold mb-3">{{ t('progress.rewards') }}</h3>
          <div v-if="rewardItems.length" class="grid grid-cols-2 gap-3">
            <div
              v-for="item in rewardItems"
              :key="item.key"
              class="rounded-2xl border border-white/10 bg-black/20 p-4 min-h-[112px] flex flex-col items-center justify-center gap-2"
            >
              <div
                :class="[
                  'w-14 h-14 rounded-2xl flex items-center justify-center reward-cube reward-cube-static',
                  item.unlocked ? `${getRewardCubeClass(item.key)} text-white` : 'bg-slate-700/35 border-slate-500/40 text-white/35'
                ]"
              >
                <component v-if="item.unlocked" :is="rewardVisuals[getRewardIconKey(item.key)] || Leaf" class="reward-cube-icon" :size="22" />
                <Lock v-else :size="18" />
              </div>
              <span :class="['text-sm font-semibold', item.unlocked ? 'text-white/90' : 'text-white/40']">
                {{ item.unlocked ? getRewardLabel(item.key, t) : t('progress.locked') }}
              </span>
            </div>
          </div>
          <div v-else class="rounded-2xl border border-white/10 bg-black/20 p-4 min-h-[112px] flex flex-col items-center justify-center gap-2">
            <div
              class="w-14 h-14 rounded-2xl flex items-center justify-center text-white/50 bg-white/10"
            >
              <Leaf :size="22" />
            </div>
            <span class="text-sm font-semibold text-white/90">
              {{ t('progress.locked') }}
            </span>
          </div>
        </div>

        <div class="lg:col-span-7 rounded-2xl border border-white/10 bg-black/20 p-4 min-h-[280px] flex flex-col">
          <h3 class="text-white font-semibold mb-3">{{ t('progress.recent_sessions') }}</h3>
          <div v-if="!recentSessions.length" class="text-sm text-white/50 py-8 text-center">
            {{ t('stats.empty') }}
          </div>
          <div v-else class="space-y-2 flex-1 overflow-y-auto custom-scrollbar pr-1">
            <div
              v-for="(s, i) in recentSessions"
              :key="i"
              class="rounded-xl border border-white/10 bg-white/5 px-3 py-2 flex items-center justify-between"
            >
              <div class="text-sm text-white/80 flex items-center gap-2">
                <Sparkles :size="14" class="text-emerald-300" />
                {{ new Date(s.timestamp).toLocaleString([], { hour: '2-digit', minute: '2-digit' }) }}
              </div>
              <div class="text-sm text-cyan-200 font-semibold">{{ s.duration }} {{ t('timer.minutes') }}</div>
            </div>
          </div>
        </div>
      </div>
      </div>
    </div>
  </div>
</template>
