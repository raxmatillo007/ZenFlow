<script setup>
import { ref, watch } from 'vue';
import { X, Settings, Clock, Save, Zap, Bell, Globe } from 'lucide-vue-next';
import { clsx } from 'clsx';
import { useLanguage } from '../context/language';

const props = defineProps({
  isOpen: Boolean,
  settings: Object
});

const emit = defineEmits(['close', 'save']);

const { language, setLanguage, t } = useLanguage();
const DEFAULT_SETTINGS = {
  focus: 25,
  shortBreak: 5,
  longBreak: 15,
  autoStartBreaks: false,
  autoStartPomodoros: false,
  alarmSound: 'digital'
};

const TIMER_LIMITS = {
  focus: { min: 1, max: 180 },
  shortBreak: { min: 1, max: 60 },
  longBreak: { min: 1, max: 90 }
};

const normalizeSettings = (value = {}) => ({
  ...DEFAULT_SETTINGS,
  ...value,
  focus: normalizeTimer('focus', value?.focus),
  shortBreak: normalizeTimer('shortBreak', value?.shortBreak),
  longBreak: normalizeTimer('longBreak', value?.longBreak),
  autoStartBreaks: Boolean(value?.autoStartBreaks),
  autoStartPomodoros: Boolean(value?.autoStartPomodoros),
  alarmSound: ['digital', 'bell', 'bird'].includes(value?.alarmSound) ? value.alarmSound : 'digital'
});

function normalizeTimer(key, rawValue) {
  const limits = TIMER_LIMITS[key];
  const parsed = Number.parseInt(rawValue, 10);
  if (!Number.isFinite(parsed)) return DEFAULT_SETTINGS[key];
  return Math.min(limits.max, Math.max(limits.min, parsed));
}

const localSettings = ref(normalizeSettings(props.settings));

watch(
  () => props.settings,
  (value) => {
    localSettings.value = normalizeSettings(value);
  },
  { deep: true }
);

const handleChange = (key, value) => {
  if (key in TIMER_LIMITS) {
    localSettings.value = { ...localSettings.value, [key]: value };
    return;
  }
  localSettings.value = { ...localSettings.value, [key]: value };
};

const handleTimerBlur = (key) => {
  localSettings.value = {
    ...localSettings.value,
    [key]: normalizeTimer(key, localSettings.value[key])
  };
};

const handleSave = () => {
  emit('save', normalizeSettings(localSettings.value));
  emit('close');
};
</script>

<template>
  <div v-if="props.isOpen" class="fixed inset-0 z-50 flex items-center justify-center p-4">
    <div class="absolute inset-0 bg-black/60 backdrop-blur-sm" @click="emit('close')" />

    <div class="relative w-full max-w-md bg-[#1e293b] border border-white/10 rounded-3xl overflow-hidden shadow-2xl animate-in fade-in zoom-in duration-200 flex flex-col max-h-[90vh]">
      <div class="p-6 border-b border-white/5 flex items-center justify-between bg-black/20">
        <h2 class="text-xl font-bold text-white flex items-center gap-2">
          <Settings :size="20" class="text-rose-400" />
          {{ t('settings') }}
        </h2>
        <button @click="emit('close')" class="text-white/50 hover:text-white transition-colors">
          <X :size="20" />
        </button>
      </div>

      <div class="p-6 overflow-y-auto custom-scrollbar space-y-6">
        <div class="space-y-3">
          <h3 class="text-xs font-bold text-white/40 uppercase tracking-wider flex items-center gap-2">
            <Globe :size="14" />
            {{ t('settings.language') }}
          </h3>
          <div class="flex bg-black/20 p-1 rounded-xl">
            <button
              v-for="lang in ['uz', 'ru', 'en']"
              :key="lang"
              @click="setLanguage(lang)"
              :class="clsx(
                'flex-1 py-2 rounded-lg text-sm font-bold transition-all uppercase',
                language === lang ? 'bg-white/10 text-white shadow' : 'text-white/40 hover:text-white'
              )"
            >
              {{ lang }}
            </button>
          </div>
        </div>

        <div class="space-y-3">
          <h3 class="text-xs font-bold text-white/40 uppercase tracking-wider flex items-center gap-2">
            <Clock :size="14" />
            {{ t('settings.timers') }}
          </h3>
          <div class="grid grid-cols-3 gap-3">
            <div v-for="item in [
              { label: t('timer.focus'), key: 'focus', color: 'text-rose-400' },
              { label: t('timer.shortBreak'), key: 'shortBreak', color: 'text-teal-400' },
              { label: t('timer.longBreak'), key: 'longBreak', color: 'text-indigo-400' }
            ]" :key="item.key" class="bg-white/5 p-3 rounded-xl border border-white/5 text-center">
              <label :class="clsx('block text-xs font-medium mb-2', item.color)">{{ item.label }}</label>
              <input
                type="number"
                :value="localSettings[item.key]"
                :min="TIMER_LIMITS[item.key].min"
                :max="TIMER_LIMITS[item.key].max"
                @input="handleChange(item.key, $event.target.value)"
                @blur="handleTimerBlur(item.key)"
                class="w-full bg-black/20 rounded-lg py-1 text-center text-white font-bold focus:outline-none focus:ring-2 focus:ring-white/20"
              />
              <p class="mt-2 text-[10px] text-white/35">
                {{ TIMER_LIMITS[item.key].min }}-{{ TIMER_LIMITS[item.key].max }} min
              </p>
            </div>
          </div>
        </div>

        <div class="space-y-3">
          <h3 class="text-xs font-bold text-white/40 uppercase tracking-wider flex items-center gap-2">
            <Zap :size="14" />
            {{ t('settings.automation') }}
          </h3>
          <div class="bg-white/5 rounded-xl border border-white/5 overflow-hidden">
            <label class="flex items-center justify-between p-4 cursor-pointer hover:bg-white/5 transition-colors border-b border-white/5">
              <span class="text-white text-sm">{{ t('settings.autoBreak') }}</span>
              <div class="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" :checked="localSettings.autoStartBreaks" @change="handleChange('autoStartBreaks', $event.target.checked)" class="sr-only peer" />
                <div class="w-11 h-6 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-rose-500"></div>
              </div>
            </label>
            <label class="flex items-center justify-between p-4 cursor-pointer hover:bg-white/5 transition-colors">
              <span class="text-white text-sm">{{ t('settings.autoFocus') }}</span>
              <div class="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" :checked="localSettings.autoStartPomodoros" @change="handleChange('autoStartPomodoros', $event.target.checked)" class="sr-only peer" />
                <div class="w-11 h-6 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-rose-500"></div>
              </div>
            </label>
          </div>
        </div>

        <div class="space-y-3">
          <h3 class="text-xs font-bold text-white/40 uppercase tracking-wider flex items-center gap-2">
            <Bell :size="14" />
            {{ t('settings.alarm') }}
          </h3>
          <div class="grid grid-cols-3 gap-2">
            <button
              v-for="sound in ['digital', 'bell', 'bird']"
              :key="sound"
              @click="handleChange('alarmSound', sound)"
              :class="clsx(
                'py-2 px-3 rounded-lg text-sm font-medium border transition-all capitalize',
                localSettings.alarmSound === sound ? 'bg-rose-500 text-white border-rose-500' : 'bg-white/5 text-white/60 border-white/5 hover:bg-white/10'
              )"
            >
              {{ sound }}
            </button>
          </div>
        </div>
      </div>

      <div class="p-6 border-t border-white/5 bg-black/20">
        <button @click="handleSave" class="w-full py-3 bg-white text-black font-bold rounded-xl hover:bg-gray-100 transition-colors flex items-center justify-center gap-2 active:scale-95">
          <Save :size="18" />
          {{ t('save') }}
        </button>
      </div>
    </div>
  </div>
</template>
