<script setup>
import { ref, onMounted, onBeforeUnmount, watch, computed } from 'vue';
import {
  Volume2,
  CloudRain,
  Trees,
  Flame,
  Wind,
  Waves,
  Sparkles,
  Lock,
  SlidersHorizontal
} from 'lucide-vue-next';
import { sounds } from '../data';
import { clsx } from 'clsx';
import { useLanguage } from '../context/language';
import { useLocalStorage } from '../hooks/useLocalStorage';

const props = defineProps({
  isPremium: Boolean
});

const emit = defineEmits(['open-premium']);
const { t } = useLanguage();

const iconMap = {
  CloudRain,
  Trees,
  Flame,
  Wind,
  Waves,
  Sparkles
};

const PRESETS = [
  { id: 'focus', nameKey: 'preset.focus', volumes: { rain: 42, fire: 16, forest: 0, wind: 0, waves: 0, universe: 0 } },
  { id: 'nature', nameKey: 'preset.nature', volumes: { rain: 18, fire: 0, forest: 56, waves: 0, wind: 0, universe: 0 } },
  { id: 'work', nameKey: 'preset.work', volumes: { rain: 24, fire: 12, forest: 18, waves: 0, wind: 0, universe: 0 }, premium: true },
  { id: 'study', nameKey: 'preset.study', volumes: { rain: 34, fire: 22, forest: 12, waves: 0, wind: 0, universe: 0 }, premium: true },
  { id: 'night', nameKey: 'preset.night', volumes: { rain: 0, fire: 0, forest: 0, waves: 30, wind: 34, universe: 28 }, premium: true }
];

const defaultVolumes = Object.fromEntries(sounds.map((sound) => [sound.id, 0]));
const [storedVolumes, setStoredVolumes] = useLocalStorage('zenflow-sound-volumes', defaultVolumes);
const [masterVolume, setMasterVolume] = useLocalStorage('zenflow-master-volume', 85);
const [activePresetId, setActivePresetId] = useLocalStorage('zenflow-sound-preset', '');

const volumes = ref({ ...defaultVolumes, ...storedVolumes.value });
const audioRefs = ref({});

const activeCount = computed(() => Object.values(volumes.value).filter((volume) => Number(volume) > 0).length);

const syncPersistedValues = () => {
  setStoredVolumes({ ...volumes.value });
};

onMounted(() => {
  sounds.forEach((sound) => {
    if (!audioRefs.value[sound.id]) {
      const audio = new Audio(sound.url);
      audio.loop = true;
      audio.preload = 'auto';
      audio.volume = ((volumes.value[sound.id] || 0) / 100) * ((masterVolume.value || 100) / 100);
      audioRefs.value[sound.id] = audio;
    }
  });
});

onBeforeUnmount(() => {
  Object.values(audioRefs.value).forEach((audio) => {
    audio.pause();
    audio.src = '';
  });
});

const syncAudioVolumes = (newVolumes, startIds = []) => {
  Object.entries(newVolumes).forEach(([id, vol]) => {
    const audio = audioRefs.value[id];
    if (!audio) return;

    const normalized = Math.max(0, Number(vol) || 0) / 100;
    const master = Math.max(0, Number(masterVolume.value) || 0) / 100;
    audio.volume = normalized * master;

    if (normalized === 0 || master === 0) {
      audio.pause();
      return;
    }

    if ((startIds.includes(id) || !audio.paused) && audio.paused) {
      audio.play().catch(() => {});
    }
  });
};

watch(
  masterVolume,
  () => {
    syncAudioVolumes(volumes.value);
  },
  { deep: false }
);

watch(
  storedVolumes,
  (value) => {
    volumes.value = { ...defaultVolumes, ...(value || {}) };
    syncAudioVolumes(volumes.value);
  },
  { deep: true }
);

const handleVolumeChange = (id, value, isLocked) => {
  if (isLocked) {
    emit('open-premium');
    return;
  }

  volumes.value = { ...volumes.value, [id]: value };
  setActivePresetId('');
  syncPersistedValues();
  syncAudioVolumes(volumes.value, value > 0 ? [id] : []);
};

const toggleMute = (id, isLocked) => {
  if (isLocked) {
    emit('open-premium');
    return;
  }

  const nextVolume = volumes.value[id] > 0 ? 0 : 50;
  volumes.value = { ...volumes.value, [id]: nextVolume };
  setActivePresetId('');
  syncPersistedValues();
  syncAudioVolumes(volumes.value, nextVolume > 0 ? [id] : []);
};

const applyPreset = (preset) => {
  if (preset.premium && !props.isPremium) {
    emit('open-premium');
    return;
  }

  volumes.value = { ...volumes.value, ...preset.volumes };
  setActivePresetId(preset.id);
  syncPersistedValues();

  const startIds = Object.entries(preset.volumes)
    .filter(([, volume]) => volume > 0)
    .map(([id]) => id);

  syncAudioVolumes(volumes.value, startIds);
};

const muteAll = () => {
  const zeroVolumes = Object.fromEntries(sounds.map((sound) => [sound.id, 0]));
  volumes.value = zeroVolumes;
  setActivePresetId('');
  syncPersistedValues();
  syncAudioVolumes(zeroVolumes);
};
</script>

<template>
  <div class="glass-panel rounded-[2rem] p-5 md:p-6 w-full">
    <div class="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
      <div>
        <h3 class="text-white font-semibold flex items-center gap-3 text-lg">
          <div class="grid h-10 w-10 place-items-center rounded-2xl border border-white/10 bg-white/5">
            <Volume2 :size="18" class="text-rose-300" />
          </div>
          {{ t('sounds.title') }}
        </h3>
        <p class="mt-2 text-sm text-white/45">
          {{ activeCount ? `${t('sounds.active')}: ${activeCount}` : t('sounds.none') }}
        </p>
      </div>

      <button @click="muteAll" class="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-semibold text-white/60 transition-colors hover:bg-white/10 hover:text-white">
        {{ t('sounds.mute') }}
      </button>
    </div>

    <div class="mt-5 rounded-[1.6rem] border border-white/8 bg-black/20 p-4">
      <div class="mb-3 flex items-center justify-between gap-3">
        <p class="text-xs font-bold uppercase tracking-[0.22em] text-white/35">{{ t('sounds.master') }}</p>
        <span class="text-sm font-semibold text-white/80">{{ masterVolume }}%</span>
      </div>
      <input
        :value="masterVolume"
        type="range"
        min="0"
        max="100"
        @input="setMasterVolume(Number($event.target.value))"
        class="h-2 w-full cursor-pointer appearance-none rounded-full bg-white/10"
      />
    </div>

    <div class="mt-5 min-w-0">
      <div class="mb-3 flex items-center justify-between gap-3">
        <p class="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.22em] text-white/35">
          <SlidersHorizontal :size="12" />
          {{ t('sounds.presets') }}
        </p>
        <span class="text-[11px] font-medium text-white/35">Swipe</span>
      </div>

      <div class="custom-scrollbar -mx-1 overflow-x-auto px-1 pb-2">
        <div class="flex min-w-max items-center gap-2">
        <button
          v-for="preset in PRESETS"
          :key="preset.id"
          @click="applyPreset(preset)"
          :class="clsx(
            'group relative inline-flex shrink-0 items-center justify-center gap-2 overflow-hidden whitespace-nowrap rounded-full border px-4 py-2.5 text-sm font-semibold tracking-tight transition-all duration-300',
            preset.premium && !props.isPremium
              ? 'border-amber-400/25 bg-amber-500/10 text-amber-50 hover:bg-amber-500/16'
              : activePresetId === preset.id
                ? 'border-cyan-300/35 bg-gradient-to-r from-cyan-400/18 via-sky-400/14 to-emerald-300/16 text-cyan-50 shadow-[0_0_24px_rgba(34,211,238,0.14)]'
                : 'border-white/10 bg-white/[0.04] text-white/70 hover:border-white/16 hover:bg-white/[0.08] hover:text-white'
          )"
        >
          <span
            v-if="activePresetId === preset.id"
            class="pointer-events-none absolute inset-0 bg-[linear-gradient(120deg,transparent,rgba(255,255,255,0.16),transparent)] opacity-70"
          />
          <Lock v-if="preset.premium && !props.isPremium" :size="12" />
          {{ t(preset.nameKey) }}
        </button>
        </div>
      </div>
    </div>

    <div class="mt-5 grid grid-cols-1 gap-3">
      <div
        v-for="sound in sounds"
        :key="sound.id"
        :class="clsx(
          'group relative flex items-center gap-4 rounded-[1.5rem] border p-4 transition-all',
          sound.isPremium && !props.isPremium
            ? 'border-amber-500/14 bg-amber-500/[0.06]'
            : volumes[sound.id] > 0
              ? 'border-white/16 bg-white/[0.06]'
              : 'border-white/8 bg-black/20 hover:border-white/14 hover:bg-black/28'
        )"
      >
        <button
          @click="toggleMute(sound.id, sound.isPremium && !props.isPremium)"
          :class="clsx(
            'z-10 flex h-12 w-12 items-center justify-center rounded-2xl transition-all',
            sound.isPremium && !props.isPremium
              ? 'bg-amber-500/12 text-amber-100'
              : volumes[sound.id] > 0
                ? `${sound.color} text-white shadow-lg`
                : 'bg-white/5 text-white/40 hover:bg-white/10 hover:text-white'
          )"
        >
          <Lock v-if="sound.isPremium && !props.isPremium" :size="18" />
          <component v-else :is="iconMap[sound.icon] || Sparkles" :size="20" />
        </button>

        <div class="flex-1">
          <div class="mb-2 flex items-center justify-between gap-3">
            <span :class="clsx('text-sm font-semibold tracking-wide', sound.isPremium && !props.isPremium ? 'text-amber-50' : 'text-white/85')">
              {{ t(`sound.${sound.id}`) }}
            </span>
            <span v-if="!(sound.isPremium && !props.isPremium)" class="text-xs font-semibold text-white/45">
              {{ volumes[sound.id] }}%
            </span>
          </div>

          <div class="relative h-2.5 overflow-hidden rounded-full bg-black/40">
            <div :class="clsx('absolute inset-y-0 left-0 rounded-full transition-all', sound.color)" :style="{ width: `${volumes[sound.id]}%` }" />
            <input
              type="range"
              min="0"
              max="100"
              :value="volumes[sound.id]"
              :disabled="sound.isPremium && !props.isPremium"
              @input="handleVolumeChange(sound.id, Number($event.target.value), sound.isPremium && !props.isPremium)"
              class="absolute inset-0 h-full w-full cursor-pointer opacity-0"
            />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
