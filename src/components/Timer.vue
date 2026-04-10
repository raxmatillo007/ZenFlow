<script setup lang="ts">
import { ref, computed, watch, onBeforeUnmount } from 'vue';
import { Play, Pause, RotateCcw, Coffee, Brain, Armchair, CheckCircle2, Gauge, Sparkles } from 'lucide-vue-next';
import { clsx } from 'clsx';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { useLanguage } from '../context/language';

const props = defineProps({
  settings: Object
});

const emit = defineEmits(['complete']);

const { t } = useLanguage();
const mode = ref('focus');
const isActive = ref(false);
const justCompleted = ref(false);
const intervalId = ref<number | null>(null);

const focusTime = computed(() => Number(props.settings?.focus) || 25);
const shortBreakTime = computed(() => Number(props.settings?.shortBreak) || 5);
const longBreakTime = computed(() => Number(props.settings?.longBreak) || 15);

const [sessions, setSessions] = useLocalStorage('zenflow-sessions', []);
const timeLeft = ref(focusTime.value * 60);
let audioContext = null;

const TIMES = computed(() => ({
  focus: focusTime.value,
  shortBreak: shortBreakTime.value,
  longBreak: longBreakTime.value
}));

const currentTotalTime = computed(() => TIMES.value[mode.value] * 60);
const progress = computed(() => {
  if (!currentTotalTime.value) return 0;
  return ((currentTotalTime.value - timeLeft.value) / currentTotalTime.value) * 100;
});

const todayCycles = computed(() => {
  const now = new Date();
  return (Array.isArray(sessions.value) ? sessions.value : []).filter((session) => {
    const stamp = new Date(Number(session?.timestamp) || 0);
    return (
      session?.mode === 'focus' &&
      stamp.getFullYear() === now.getFullYear() &&
      stamp.getMonth() === now.getMonth() &&
      stamp.getDate() === now.getDate()
    );
  }).length;
});

const timerStatus = computed(() => {
  if (justCompleted.value) return t('timer.completed');
  return isActive.value ? t('timer.running') : t('timer.ready');
});

const nextModeLabel = computed(() => {
  if (mode.value === 'focus') return t('timer.shortBreak');
  return t('timer.focus');
});

const playTone = (frequency = 880, duration = 0.22) => {
  const AudioCtx = window.AudioContext || window.webkitAudioContext;
  if (!AudioCtx) return;

  if (!audioContext) {
    audioContext = new AudioCtx();
  }

  if (audioContext.state === 'suspended') {
    audioContext.resume().catch(() => {});
  }

  const oscillator = audioContext.createOscillator();
  const gainNode = audioContext.createGain();
  oscillator.type = 'sine';
  oscillator.frequency.value = frequency;
  gainNode.gain.value = 0.08;
  oscillator.connect(gainNode);
  gainNode.connect(audioContext.destination);
  oscillator.start();
  oscillator.stop(audioContext.currentTime + duration);
};

const playAlarm = () => {
  const soundKey = props.settings?.alarmSound || 'digital';
  if (soundKey === 'bell') {
    playTone(1046, 0.24);
    window.setTimeout(() => playTone(1318, 0.22), 120);
    return;
  }
  if (soundKey === 'bird') {
    playTone(1568, 0.15);
    window.setTimeout(() => playTone(1760, 0.12), 110);
    window.setTimeout(() => playTone(1318, 0.16), 220);
    return;
  }
  playTone(880, 0.18);
  window.setTimeout(() => playTone(988, 0.18), 140);
};

const resetClock = (nextMode = mode.value) => {
  mode.value = nextMode;
  timeLeft.value = TIMES.value[nextMode] * 60;
  justCompleted.value = false;
};

const completeFocusSession = () => {
  const durationMins = Math.max(1, focusTime.value);
  const newSession = {
    mode: 'focus',
    timestamp: Date.now(),
    duration: durationMins
  };
  const currentSessions = Array.isArray(sessions.value) ? sessions.value : [];
  setSessions([newSession, ...currentSessions].slice(0, 500));
  emit('complete', durationMins);
};

const advanceAfterCompletion = () => {
  if (mode.value === 'focus') {
    completeFocusSession();
    if (props.settings?.autoStartBreaks) {
      resetClock('shortBreak');
      justCompleted.value = false;
      isActive.value = true;
      return;
    }
    isActive.value = false;
    justCompleted.value = true;
    return;
  }

  if (props.settings?.autoStartPomodoros) {
    resetClock('focus');
    justCompleted.value = false;
    isActive.value = true;
    return;
  }

  isActive.value = false;
  justCompleted.value = true;
};

const handleTimerComplete = () => {
  playAlarm();
  advanceAfterCompletion();
};

watch([focusTime, shortBreakTime, longBreakTime], () => {
  if (!isActive.value) {
    timeLeft.value = TIMES.value[mode.value] * 60;
  }
});

watch([isActive, timeLeft], () => {
  if (intervalId.value) {
    clearInterval(intervalId.value);
    intervalId.value = null;
  }

  if (isActive.value && timeLeft.value > 0) {
    justCompleted.value = false;
    intervalId.value = window.setInterval(() => {
      timeLeft.value = Math.max(0, timeLeft.value - 1);
    }, 1000);
    return;
  }

  if (timeLeft.value === 0) {
    handleTimerComplete();
  }
});

watch([timeLeft, mode], () => {
  document.title = `${formatTime(timeLeft.value)} - ${t(`timer.${mode.value}`)} | ZenFlow`;
});

onBeforeUnmount(() => {
  if (intervalId.value) clearInterval(intervalId.value);
  if (audioContext) {
    audioContext.close().catch(() => {});
    audioContext = null;
  }
});

const toggleTimer = () => {
  justCompleted.value = false;
  if (timeLeft.value === 0) {
    resetClock(mode.value);
  }
  isActive.value = !isActive.value;
};

const resetTimer = () => {
  isActive.value = false;
  resetClock(mode.value);
};

const changeMode = (newMode) => {
  isActive.value = false;
  resetClock(newMode);
};

const formatTime = (seconds) => {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
};

const ICONS = {
  focus: Brain,
  shortBreak: Coffee,
  longBreak: Armchair
};

const COLORS = {
  focus: 'text-rose-300',
  shortBreak: 'text-teal-300',
  longBreak: 'text-indigo-300'
};

const BG_COLORS = {
  focus: 'from-rose-500/18 via-rose-500/8 to-transparent',
  shortBreak: 'from-teal-500/18 via-teal-500/8 to-transparent',
  longBreak: 'from-indigo-500/18 via-indigo-500/8 to-transparent'
};

const radius = 136;
const circumference = 2 * Math.PI * radius;
const strokeDashoffset = computed(() => circumference - (progress.value / 100) * circumference);
</script>

<template>
  <div class="glass-panel rounded-[2rem] md:rounded-[2.75rem] p-5 md:p-8 relative overflow-hidden min-h-[360px] md:min-h-[440px]">
    <div class="absolute inset-0 surface-grid opacity-25" />
    <div :class="clsx('absolute inset-0 bg-gradient-to-br transition-all duration-1000', BG_COLORS[mode])" />
    <div class="relative z-10 flex h-full flex-col">
      <div class="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div class="flex items-center gap-3">
          <div class="badge-chip text-white/80">
            <Sparkles :size="14" class="text-amber-300" />
            <span>{{ timerStatus }}</span>
          </div>
          <div class="badge-chip text-white/60">
            <Gauge :size="14" class="text-cyan-300" />
            <span>{{ t('timer.cycles') }}: {{ todayCycles }}</span>
          </div>
        </div>
        <p class="text-sm text-white/45">{{ t('timer.tip') }}</p>
      </div>

      <div class="mt-5 flex space-x-1 rounded-2xl border border-white/10 bg-black/25 p-1.5 backdrop-blur-md">
        <button
          v-for="m in ['focus', 'shortBreak', 'longBreak']"
          :key="m"
          @click="changeMode(m)"
          :class="clsx(
            'flex-1 rounded-xl px-3 py-2.5 text-xs font-semibold transition-all md:text-sm',
            mode === m ? 'bg-white/12 text-white shadow-lg border border-white/10' : 'text-white/45 hover:bg-white/5 hover:text-white'
          )"
        >
          {{ t(`timer.${m}`) }}
        </button>
      </div>

      <div class="mt-6 flex flex-1 flex-col items-center justify-center">
        <div class="relative flex aspect-square w-full max-w-[290px] items-center justify-center md:max-w-[360px]">
          <svg viewBox="0 0 320 320" class="absolute inset-0 h-full w-full -rotate-90">
            <circle cx="160" cy="160" :r="radius" stroke="currentColor" stroke-width="8" fill="transparent" class="text-white/10" />
            <circle
              cx="160"
              cy="160"
              :r="radius"
              stroke="currentColor"
              stroke-width="8"
              fill="transparent"
              :stroke-dasharray="circumference"
              :stroke-dashoffset="strokeDashoffset"
              stroke-linecap="round"
              :class="clsx('transition-all duration-1000 ease-linear drop-shadow-[0_0_18px_rgba(255,255,255,0.15)]', COLORS[mode])"
            />
          </svg>

          <div :class="clsx('text-center transition-all duration-300', isActive && 'animate-breathe')">
            <div class="mb-3 inline-flex h-14 w-14 items-center justify-center rounded-2xl border border-white/10 bg-white/5 text-white/80">
              <component :is="ICONS[mode]" :size="24" />
            </div>
            <div class="text-[3.4rem] font-display font-bold tracking-[-0.06em] text-white tabular-nums leading-none drop-shadow-2xl md:text-[5.5rem]">
              {{ formatTime(timeLeft) }}
            </div>
            <div :class="clsx('mt-3 text-xs font-semibold uppercase tracking-[0.34em] md:text-sm', COLORS[mode])">
              {{ t(`timer.${mode}`) }}
            </div>
          </div>
        </div>

        <div class="mt-6 grid w-full max-w-3xl grid-cols-2 gap-3 md:grid-cols-4">
          <div class="rounded-2xl border border-white/8 bg-black/25 p-3">
            <p class="text-[11px] uppercase tracking-[0.2em] text-white/35">{{ t('timer.sessionLength') }}</p>
            <p class="mt-2 text-lg font-semibold text-white">{{ TIMES[mode] }} {{ t('timer.minutes') }}</p>
          </div>
          <div class="rounded-2xl border border-white/8 bg-black/25 p-3">
            <p class="text-[11px] uppercase tracking-[0.2em] text-white/35">{{ t('timer.upNext') }}</p>
            <p class="mt-2 text-lg font-semibold text-white">{{ nextModeLabel }}</p>
          </div>
          <div class="rounded-2xl border border-white/8 bg-black/25 p-3">
            <p class="text-[11px] uppercase tracking-[0.2em] text-white/35">{{ t('timer.auto') }}</p>
            <p class="mt-2 text-sm font-semibold text-white">
              {{ props.settings?.autoStartBreaks || props.settings?.autoStartPomodoros ? 'On' : 'Off' }}
            </p>
          </div>
          <div class="rounded-2xl border border-white/8 bg-black/25 p-3">
            <p class="text-[11px] uppercase tracking-[0.2em] text-white/35">{{ t('timer.cycles') }}</p>
            <p class="mt-2 flex items-center gap-2 text-lg font-semibold text-white">
              <CheckCircle2 :size="16" class="text-emerald-300" />
              {{ todayCycles }}
            </p>
          </div>
        </div>
      </div>

      <div class="mt-6 flex items-center justify-center gap-4 md:gap-6">
        <button
          @click="toggleTimer"
          :class="clsx(
            'flex h-16 w-16 items-center justify-center rounded-full border transition-all duration-300 active:scale-95 md:h-20 md:w-20',
            isActive ? 'border-white/20 bg-white/10 text-white hover:bg-white/16' : 'border-transparent bg-white text-slate-900 hover:scale-105'
          )"
          :title="isActive ? t('timer.pause') : t('timer.start')"
        >
          <Pause v-if="isActive" :size="28" class="md:h-8 md:w-8" />
          <Play v-else :size="28" class="ml-1 md:h-8 md:w-8" />
        </button>

        <button
          @click="resetTimer"
          class="flex h-12 w-12 items-center justify-center rounded-full border border-white/10 bg-white/5 text-white/70 transition-all duration-300 hover:rotate-180 hover:bg-white/10 hover:text-white md:h-14 md:w-14"
          :title="t('timer.reset')"
        >
          <RotateCcw :size="20" class="md:h-[22px] md:w-[22px]" />
        </button>
      </div>
    </div>
  </div>
</template>
