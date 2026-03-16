<script setup lang="ts">
import { ref, computed, watch, onBeforeUnmount } from 'vue';
import { Play, Pause, RotateCcw, Coffee, Brain, Armchair } from 'lucide-vue-next';
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

const focusTime = computed(() => props.settings?.focus || 25);
const shortBreakTime = computed(() => props.settings?.shortBreak || 5);
const longBreakTime = computed(() => props.settings?.longBreak || 15);

const timeLeft = ref(focusTime.value * 60);
const alarmRef = ref(null);
const [sessions, setSessions] = useLocalStorage('zenflow-sessions', []);
const focusCheckpointLeft = ref(focusTime.value * 60);
let audioContext = null;

const playFallbackBeep = () => {
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
  oscillator.frequency.value = 880;
  gainNode.gain.value = 0.08;
  oscillator.connect(gainNode);
  gainNode.connect(audioContext.destination);
  oscillator.start();
  oscillator.stop(audioContext.currentTime + 0.18);
};

watch([focusTime, shortBreakTime, longBreakTime, mode, isActive], () => {
  if (!isActive.value) {
    const times = {
      focus: focusTime.value,
      shortBreak: shortBreakTime.value,
      longBreak: longBreakTime.value
    };
    timeLeft.value = times[mode.value] * 60;
  }
});

watch(
  () => props.settings?.alarmSound,
  () => {
    const soundUrls: Record<string, string> = {
      digital: 'https://samplelib.com/lib/preview/mp3/sample-3s.mp3',
      bell: 'https://samplelib.com/lib/preview/mp3/sample-6s.mp3',
      bird: 'https://samplelib.com/lib/preview/mp3/sample-9s.mp3'
    };

    const soundKey = props.settings?.alarmSound || 'digital';
    const url = soundUrls[soundKey] || soundUrls.digital;
    try {
      alarmRef.value = new Audio(url);
      alarmRef.value.crossOrigin = 'anonymous';
      alarmRef.value.preload = 'auto';
    } catch (e) {
      console.error('Audio yuklashda xatolik:', e);
    }
  },
  { immediate: true }
);

let intervalId = null;

const commitFocusProgress = (spentSeconds) => {
  const safeSpent = Number(spentSeconds) || 0;
  if (safeSpent <= 0) return;

  // Keep UX responsive: even short real usage is counted as 1 minute progress.
  const durationMins = Math.max(1, Math.round(safeSpent / 60));
  const newSession = {
    mode: 'focus',
    timestamp: Date.now(),
    duration: durationMins
  };
  const currentSessions = Array.isArray(sessions.value) ? sessions.value : [];
  setSessions([newSession, ...currentSessions].slice(0, 500));
  emit('complete', durationMins);
};

const handleTimerComplete = () => {
  if (alarmRef.value) {
    alarmRef.value.play().catch(() => playFallbackBeep());
  } else {
    playFallbackBeep();
  }

  if (mode.value === 'focus') {
    const spentFromCheckpoint = Math.max(focusCheckpointLeft.value - timeLeft.value, 0);
    commitFocusProgress(spentFromCheckpoint);
    focusCheckpointLeft.value = 0;
  }

  if (mode.value === 'focus') {
    if (props.settings?.autoStartBreaks) {
      mode.value = 'shortBreak';
      timeLeft.value = shortBreakTime.value * 60;
      setTimeout(() => (isActive.value = true), 1000);
    } else {
      isActive.value = false;
    }
  } else {
    if (props.settings?.autoStartPomodoros) {
      mode.value = 'focus';
      timeLeft.value = focusTime.value * 60;
      setTimeout(() => (isActive.value = true), 1000);
    } else {
      isActive.value = false;
    }
  }

  if (!props.settings?.autoStartBreaks && !props.settings?.autoStartPomodoros) {
    isActive.value = false;
  }
};

watch([isActive, timeLeft], () => {
  if (intervalId) {
    clearInterval(intervalId);
    intervalId = null;
  }

  if (isActive.value && timeLeft.value > 0) {
    intervalId = window.setInterval(() => {
      timeLeft.value -= 1;
    }, 1000);
  } else if (timeLeft.value === 0 && isActive.value) {
    handleTimerComplete();
  }
});

watch([timeLeft, mode], () => {
  document.title = `${formatTime(timeLeft.value)} - ${t(`timer.${mode.value}`)} | ZenFlow`;
});

onBeforeUnmount(() => {
  if (intervalId) clearInterval(intervalId);
  if (audioContext) {
    audioContext.close().catch(() => {});
    audioContext = null;
  }
});

const toggleTimer = () => {
  if (mode.value === 'focus' && isActive.value) {
    const spentFromCheckpoint = Math.max(focusCheckpointLeft.value - timeLeft.value, 0);
    commitFocusProgress(spentFromCheckpoint);
    focusCheckpointLeft.value = timeLeft.value;
  }

  isActive.value = !isActive.value;

  if (mode.value === 'focus' && isActive.value) {
    focusCheckpointLeft.value = timeLeft.value;
  }
};

const resetTimer = () => {
  if (mode.value === 'focus' && isActive.value) {
    const spentFromCheckpoint = Math.max(focusCheckpointLeft.value - timeLeft.value, 0);
    commitFocusProgress(spentFromCheckpoint);
  }

  isActive.value = false;
  const times = {
    focus: focusTime.value,
    shortBreak: shortBreakTime.value,
    longBreak: longBreakTime.value
  };
  timeLeft.value = times[mode.value] * 60;
  if (mode.value === 'focus') {
    focusCheckpointLeft.value = timeLeft.value;
  }
};

const changeMode = (newMode) => {
  if (mode.value === 'focus' && isActive.value) {
    const spentFromCheckpoint = Math.max(focusCheckpointLeft.value - timeLeft.value, 0);
    commitFocusProgress(spentFromCheckpoint);
  }

  mode.value = newMode;
  isActive.value = false;
  const times = {
    focus: focusTime.value,
    shortBreak: shortBreakTime.value,
    longBreak: longBreakTime.value
  };
  timeLeft.value = times[newMode] * 60;
  if (newMode === 'focus') {
    focusCheckpointLeft.value = timeLeft.value;
  }
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
  focus: 'text-rose-400',
  shortBreak: 'text-teal-400',
  longBreak: 'text-indigo-400'
};

const BG_COLORS = {
  focus: 'from-rose-500/20 to-rose-900/5',
  shortBreak: 'from-teal-500/20 to-teal-900/5',
  longBreak: 'from-indigo-500/20 to-indigo-900/5'
};

const currentTotalTime = computed(() => {
  if (mode.value === 'focus') return focusTime.value * 60;
  if (mode.value === 'shortBreak') return shortBreakTime.value * 60;
  return longBreakTime.value * 60;
});

const progress = computed(() => ((currentTotalTime.value - timeLeft.value) / currentTotalTime.value) * 100);
const radius = 140;
const circumference = 2 * Math.PI * radius;
const strokeDashoffset = computed(() => circumference - (progress.value / 100) * circumference);
</script>

<template>
  <div class="glass-panel rounded-[2rem] md:rounded-[2.5rem] p-6 md:p-8 flex flex-col items-center justify-center relative overflow-hidden group min-h-[320px] md:min-h-[400px]">
    <div :class="clsx('absolute inset-0 bg-gradient-to-br transition-all duration-1000 opacity-50', BG_COLORS[mode])" />

    <div class="flex space-x-1 mb-6 md:mb-10 relative z-10 bg-black/30 p-1 md:p-1.5 rounded-xl md:rounded-2xl backdrop-blur-md border border-white/5 w-full max-w-[300px] md:max-w-none justify-center">
      <button
        v-for="m in ['focus', 'shortBreak', 'longBreak']"
        :key="m"
        @click="changeMode(m)"
        :class="clsx(
          'flex-1 md:flex-none px-3 md:px-5 py-2 md:py-2.5 rounded-lg md:rounded-xl text-xs md:text-sm font-medium transition-all duration-300',
          mode === m ? 'bg-white/10 text-white shadow-lg border border-white/10' : 'text-white/40 hover:text-white hover:bg-white/5'
        )"
      >
        {{ t(`timer.${m}`) }}
      </button>
    </div>

    <div class="relative z-10 mb-8 md:mb-10 flex items-center justify-center w-full max-w-[260px] md:max-w-[320px] aspect-square">
      <div class="absolute inset-0 flex items-center justify-center pointer-events-none opacity-20">
        <svg viewBox="0 0 320 320" class="w-full h-full transform -rotate-90">
          <circle cx="160" cy="160" :r="radius" stroke="currentColor" stroke-width="4" fill="transparent" class="text-white/10" />
          <circle
            cx="160"
            cy="160"
            :r="radius"
            stroke="currentColor"
            stroke-width="4"
            fill="transparent"
            :stroke-dasharray="circumference"
            :stroke-dashoffset="strokeDashoffset"
            stroke-linecap="round"
            :class="clsx('transition-all duration-1000 ease-linear', COLORS[mode])"
          />
        </svg>
      </div>

      <div :class="clsx('text-center transition-all duration-300', isActive && 'animate-breathe')">
        <div class="text-[3.5rem] md:text-7xl lg:text-[7rem] font-bold text-white tracking-tighter tabular-nums leading-none drop-shadow-2xl">
          {{ formatTime(timeLeft) }}
        </div>
        <div :class="clsx('flex items-center justify-center gap-2 mt-2 md:mt-4 font-medium tracking-[0.2em] uppercase text-xs md:text-sm opacity-80', COLORS[mode])">
          <component :is="ICONS[mode]" :size="16" />
          <span>{{ t(`timer.${mode}`) }}</span>
        </div>
      </div>
    </div>

    <div class="flex items-center gap-4 md:gap-6 relative z-10">
      <button
        @click="toggleTimer"
        :class="clsx(
          'w-16 h-16 md:w-20 md:h-20 rounded-full flex items-center justify-center hover:scale-110 transition-all duration-300 active:scale-95 shadow-2xl shadow-black/20 group-hover:shadow-white/5',
          isActive ? 'bg-white/10 text-white border border-white/20 backdrop-blur-md' : 'bg-white text-gray-900'
        )"
      >
        <Pause v-if="isActive" :size="28" class="md:w-8 md:h-8" />
        <Play v-else :size="28" class="md:w-8 md:h-8 ml-1" />
      </button>

      <button @click="resetTimer" class="w-12 h-12 md:w-14 md:h-14 rounded-full bg-white/5 text-white/70 flex items-center justify-center hover:bg-white/10 hover:text-white transition-all border border-white/5 hover:rotate-180 duration-500">
        <RotateCcw :size="20" class="md:w-[22px] md:h-[22px]" />
      </button>
    </div>
  </div>
</template>
