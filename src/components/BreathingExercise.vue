<script setup lang="ts">
import { ref, watch, onBeforeUnmount } from 'vue';
import { Wind, Play, Square, Lock, Activity } from 'lucide-vue-next';
import { clsx } from 'clsx';
import { useLanguage } from '../context/language';

const props = defineProps({
  isPremium: Boolean
});

const emit = defineEmits(['open-premium']);

const { t } = useLanguage();

const PATTERNS = {
  box: { inhale: 4, hold1: 4, exhale: 4, hold2: 4, name: 'breath.pattern.box' },
  relax: { inhale: 4, hold1: 7, exhale: 8, hold2: 0, name: 'breath.pattern.relax' },
  energy: { inhale: 2, hold1: 0, exhale: 1, hold2: 0, name: 'breath.pattern.energy' }
};

const isActive = ref(false);
const phase = ref<'inhale' | 'hold' | 'exhale'>('inhale');
const pattern = ref('box');
const text = ref('');
let cancelled = false;

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const runCycle = async () => {
  const currentPattern = PATTERNS[pattern.value];
  while (isActive.value && !cancelled) {
    phase.value = 'inhale';
    text.value = t('breath.inhale');
    await wait(currentPattern.inhale * 1000);
    if (!isActive.value || cancelled) break;

    if (currentPattern.hold1 > 0) {
      phase.value = 'hold';
      text.value = t('breath.hold');
      await wait(currentPattern.hold1 * 1000);
      if (!isActive.value || cancelled) break;
    }

    phase.value = 'exhale';
    text.value = t('breath.exhale');
    await wait(currentPattern.exhale * 1000);
    if (!isActive.value || cancelled) break;

    if (currentPattern.hold2 > 0) {
      phase.value = 'hold';
      text.value = t('breath.hold');
      await wait(currentPattern.hold2 * 1000);
      if (!isActive.value || cancelled) break;
    }
  }
};

watch([isActive, pattern], () => {
  cancelled = false;
  if (!isActive.value) {
    text.value = t('breath.start');
    return;
  }
  runCycle();
});

onBeforeUnmount(() => {
  cancelled = true;
});

const toggleExercise = () => {
  isActive.value = !isActive.value;
};

const selectPattern = (p) => {
  if (p !== 'box' && !props.isPremium) {
    emit('open-premium');
    return;
  }
  pattern.value = p;
  isActive.value = false;
};
</script>

<template>
  <div class="glass-panel rounded-[2rem] p-5 md:p-6 w-full relative overflow-hidden flex flex-col items-center">
    <div class="mb-6 flex w-full items-start justify-between gap-3">
      <h3 class="text-white font-semibold flex items-center gap-2">
        <Wind :size="20" class="text-teal-400" />
        <span>{{ t('breath.title') }}</span>
      </h3>

      <div class="flex shrink-0 gap-1 rounded-lg bg-black/20 p-1">
        <button
          v-for="p in ['box', 'relax', 'energy']"
          :key="p"
          @click="selectPattern(p)"
          :class="clsx(
            'p-1.5 rounded-md transition-all relative',
            pattern === p ? 'bg-white/10 text-white' : 'text-white/40 hover:text-white'
          )"
        >
          <Square v-if="p === 'box'" :size="14" />
          <Wind v-else-if="p === 'relax'" :size="14" />
          <Activity v-else :size="14" />
          <div v-if="p !== 'box' && !props.isPremium" class="absolute -top-1 -right-1 text-amber-500">
            <Lock :size="8" />
          </div>
        </button>
      </div>
    </div>

    <div class="relative w-40 h-40 flex items-center justify-center mb-6">
      <div :class="clsx(
        'absolute inset-0 rounded-full blur-2xl transition-all duration-1000',
        phase === 'inhale' ? 'bg-teal-500/30 scale-110' : phase === 'exhale' ? 'bg-blue-500/10 scale-75' : 'bg-white/10 scale-90'
      )" />

      <div :class="clsx(
        'w-24 h-24 rounded-full border-4 flex items-center justify-center transition-all duration-[4000ms] ease-in-out relative z-10',
        phase === 'inhale'
          ? 'w-32 h-32 border-teal-400 bg-teal-500/20 shadow-[0_0_30px_rgba(45,212,191,0.3)]'
          : phase === 'exhale'
            ? 'w-16 h-16 border-blue-400 bg-blue-500/10'
            : 'w-24 h-24 border-white/50 bg-white/5',
        !isActive && 'w-24 h-24 border-white/20 bg-transparent'
      )">
        <span class="text-xs font-bold uppercase tracking-widest text-white/80">
          {{ isActive ? text : t('breath.start') }}
        </span>
      </div>
    </div>

    <div class="text-center mb-4">
      <p class="text-sm font-medium text-white">{{ t(PATTERNS[pattern].name) }}</p>
    </div>

    <button
      @click="toggleExercise"
      :class="clsx(
        'w-full py-3 rounded-xl font-bold transition-all flex items-center justify-center gap-2',
        isActive ? 'bg-white/10 text-white hover:bg-white/20' : 'bg-teal-500 text-white hover:bg-teal-600 shadow-lg shadow-teal-500/20'
      )"
    >
      <Square v-if="isActive" :size="16" />
      <Play v-else :size="16" />
      {{ isActive ? t('breath.stop') : t('breath.start') }}
    </button>
  </div>
</template>
