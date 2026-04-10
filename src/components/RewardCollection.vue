<script setup>
import { computed } from 'vue';
import { Lock, Trophy, Shield, Palette, Flame, Rocket, Flower2, Target, CloudLightning, Trees, Sun, Activity, Medal } from 'lucide-vue-next';
import { clsx } from 'clsx';
import { useLanguage } from '../context/language';
import { migrateRewardList, getAllRewardPreviewKeys, getRewardCubeClass, getRewardIconKey, getRewardLabel } from '../progression';

const props = defineProps({
  unlockedRewards: Array,
  latestRewardKey: String,
  level: Number,
  nextRewardLevel: Number
});

const { t } = useLanguage();

const unlockedSet = computed(() => {
  return new Set(migrateRewardList(props.unlockedRewards));
});

const unlockedCount = computed(() => {
  return unlockedSet.value.size;
});

const rewardSlots = computed(() => {
  const unlocked = migrateRewardList(props.unlockedRewards);
  const count = Math.min(Math.max(unlocked.length + 9, 24), 96);
  const preview = getAllRewardPreviewKeys(count);
  return preview.map((key) => ({
    key,
    unlocked: unlockedSet.value.has(key)
  }));
});

const getCubeClass = (key) => {
  return getRewardCubeClass(key);
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
</script>

<template>
  <div class="glass-panel rounded-[2rem] p-5 w-full relative overflow-hidden">
    <div class="flex items-center justify-between mb-4">
      <h3 class="text-white font-semibold text-sm tracking-wide">{{ t('progress.rewards') }}</h3>
      <span class="text-xs text-white/50">{{ unlockedCount }}</span>
    </div>

    <div class="rounded-2xl border border-white/10 bg-black/20 p-4 min-h-[108px] max-h-[260px] overflow-y-auto custom-scrollbar">
      <div v-if="rewardSlots.length" class="grid grid-cols-3 gap-3">
        <div
          v-for="slot in rewardSlots"
          :key="slot.key"
          class="flex flex-col items-center justify-center gap-2"
        >
          <div
            :class="clsx(
              'w-14 h-14 rounded-2xl flex items-center justify-center reward-cube reward-cube-static',
              slot.unlocked ? `${getCubeClass(slot.key)} text-white` : 'bg-slate-700/35 border-slate-500/40 text-white/35'
            )"
          >
            <component v-if="slot.unlocked" :is="rewardVisuals[getRewardIconKey(slot.key)] || Trophy" class="reward-cube-icon" :size="22" />
            <Lock v-else :size="18" />
          </div>
          <span :class="clsx('text-xs text-center font-semibold', slot.unlocked ? 'text-white/90' : 'text-white/40')">
            {{ slot.unlocked ? getRewardLabel(slot.key, t) : t('progress.locked') }}
          </span>
        </div>
      </div>
      <div v-else class="flex flex-col items-center justify-center gap-2">
        <div class="w-14 h-14 rounded-2xl flex items-center justify-center bg-white/10 text-white/40">
          <Lock :size="20" />
        </div>
        <span class="text-sm text-center leading-tight font-semibold text-white/90">
          {{ t('progress.locked') }}
        </span>
      </div>
    </div>

    <p class="text-[11px] text-white/60 mt-4">
      {{ t('nextLevel') }} {{ props.nextRewardLevel }} - {{ t('level') }} {{ props.level }}
    </p>
  </div>
</template>
