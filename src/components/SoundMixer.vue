<script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue';
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

// PRESET VOLUMES
const PRESETS = [
  { id: 'focus', nameKey: 'preset.focus', volumes: { rain: 40, fire: 20, forest: 0, wind: 0, waves: 0, universe: 0 } },
  { id: 'nature', nameKey: 'preset.nature', volumes: { rain: 20, fire: 0, forest: 60, waves: 0, wind: 0, universe: 0 } },
  { id: 'work', nameKey: 'preset.work', volumes: { rain: 25, fire: 10, forest: 20, waves: 0, wind: 0, universe: 0 }, premium: true },
  { id: 'study', nameKey: 'preset.study', volumes: { rain: 35, fire: 25, forest: 15, waves: 0, wind: 0, universe: 0 }, premium: true },
  { id: 'night', nameKey: 'preset.night', volumes: { rain: 0, fire: 0, forest: 0, waves: 35, wind: 35, universe: 30 }, premium: true },
];
const PRESET_ORDER = ['focus', 'nature', 'work', 'study', 'night'];
const orderedPresets = PRESETS
  .slice()
  .sort((a, b) => PRESET_ORDER.indexOf(a.id) - PRESET_ORDER.indexOf(b.id));

// REACTIVE VOLUMES
const volumes = ref(
  Object.fromEntries(sounds.map(s => [s.id, 0]))
);
const activePresetId = ref(null);

// AUDIO REFERENCES
const audioRefs = ref({});


// INIT AUDIO
onMounted(() => {
  sounds.forEach((sound) => {
    if (!audioRefs.value[sound.id]) {
      const audio = new Audio(sound.url);
      audio.loop = true;
      audio.preload = 'auto';
      audio.load();
      audioRefs.value[sound.id] = audio;
    }
  });
});

// CLEAR AUDIO ON UNMOUNT
onBeforeUnmount(() => {
  Object.values(audioRefs.value).forEach((audio) => {
    audio.pause();
    audio.src = '';
  });
});

// UPDATE AUDIO WITHOUT AUTO-START (unless explicitly requested)
const syncAudioVolumes = (newVolumes, startIds = []) => {
  Object.entries(newVolumes).forEach(([id, vol]) => {
    const audio = audioRefs.value[id];
    if (!audio) return;

    audio.volume = vol / 100;

    if (vol === 0) {
      audio.pause();
      return;
    }

    if (startIds.includes(id) && audio.paused) {
      audio.play().catch(() => {});
    }
  });
};

// SLIDER CHANGE
const handleVolumeChange = (id, value, isLocked) => {
  if (isLocked) {
    emit('open-premium');
    return;
  }

  volumes.value[id] = value;
  activePresetId.value = null;
  syncAudioVolumes(volumes.value, value > 0 ? [id] : []);
};

// BUTTON MUTE/UNMUTE
const toggleMute = (id, isLocked) => {
  if (isLocked) {
    emit('open-premium');
    return;
  }

  const nextVolume = volumes.value[id] > 0 ? 0 : 50;
  volumes.value[id] = nextVolume;
  activePresetId.value = null;
  syncAudioVolumes(volumes.value, nextVolume > 0 ? [id] : []);
};

// APPLY PRESET
const applyPreset = (preset) => {
  if (preset.premium && !props.isPremium) {
    emit('open-premium');
    return;
  }
  volumes.value = { ...volumes.value, ...preset.volumes };
  activePresetId.value = preset.id;
  const startIds = Object.entries(preset.volumes)
    .filter(([, vol]) => vol > 0)
    .map(([id]) => id);
  syncAudioVolumes(volumes.value, startIds);
};

// MUTE ALL
const muteAll = () => {
  const zeroVols = Object.fromEntries(sounds.map(s => [s.id, 0]));
  volumes.value = zeroVols;
  activePresetId.value = null;
  syncAudioVolumes(zeroVols);
};
</script>


<template>
  <div class="glass-panel rounded-[2rem] p-6 w-full">

    <!-- TITLE -->
    <div class="flex items-center justify-between mb-6">
      <h3 class="text-white font-semibold flex items-center gap-3 text-lg">
        <div class="p-2 bg-white/5 rounded-lg">
          <Volume2 :size="20" class="text-rose-300" />
        </div>
        {{ t('sounds.title') }}
      </h3>

      <button @click="muteAll" class="text-xs text-white/40 hover:text-white bg-white/5 px-3 py-1.5 rounded-full">
        {{ t('sounds.mute') }}
      </button>
    </div>

    <!-- PRESETS -->
    <div class="mb-6">
      <p class="text-xs font-bold text-white/30 uppercase tracking-wider mb-3 flex items-center gap-2">
        <SlidersHorizontal :size="12" />
        {{ t('sounds.presets') }}
      </p>

      <div class="grid grid-cols-2 sm:grid-cols-3 gap-2">
        <button
          v-for="preset in orderedPresets"
          :key="preset.id"
          @click="applyPreset(preset)"
          :class="clsx(
            'w-full px-3 py-2 rounded-xl text-sm font-medium border transition-all flex items-center justify-center gap-2 text-center',
            preset.premium && !props.isPremium
              ? 'bg-amber-500/10 border-amber-500/20 text-amber-500 hover:bg-amber-500/20'
              : activePresetId === preset.id
                ? 'bg-teal-500/25 border-teal-400/60 text-teal-100 shadow-lg shadow-teal-900/40'
              : 'bg-white/5 border-white/5 text-white/70 hover:bg-white/10 hover:text-white'
          )"
        >
          <Lock v-if="preset.premium && !props.isPremium" :size="12" />
          {{ t(preset.nameKey) }}
        </button>
      </div>
    </div>

    <!-- SOUND LIST -->
    <div class="grid grid-cols-1 gap-4">
      <div
        v-for="sound in sounds"
        :key="sound.id"
        :class="clsx(
          'group flex items-center gap-4 p-4 rounded-2xl transition-all relative border',
          sound.isPremium && !props.isPremium
            ? 'bg-black/20 border-amber-500/10 hover:border-amber-500/30'
            : volumes[sound.id] > 0
              ? 'bg-white/10 border-white/20 shadow-lg'
              : 'bg-black/20 border-white/5 hover:bg-black/30 hover:border-white/10'
        )"
      >
        <!-- MUTE BUTTON -->
        <button
          @click="toggleMute(sound.id, sound.isPremium && !props.isPremium)"
          :class="clsx(
            'w-12 h-12 rounded-xl flex items-center justify-center transition-all z-10',
            sound.isPremium && !props.isPremium
              ? 'bg-gradient-to-br from-amber-500/10 to-amber-900/10 text-amber-500'
              : volumes[sound.id] > 0
                ? `${sound.color} text-white shadow-lg scale-105`
                : 'bg-white/5 text-white/40 hover:text-white hover:bg-white/10'
          )"
        >
          <Lock v-if="sound.isPremium && !props.isPremium" :size="20" />
          <component v-else :is="iconMap[sound.icon] || Sparkles" :size="22" />
        </button>

        <!-- TITLE + SLIDER -->
        <div class="flex-1 relative z-10">
          <div class="flex justify-between text-sm text-white/80 mb-2">
            <span :class="clsx('font-medium tracking-wide', sound.isPremium && !props.isPremium && 'text-amber-200/80')">
              {{ t(`sound.${sound.id}`) }}
            </span>
            <span v-if="!(sound.isPremium && !props.isPremium)" class="text-xs opacity-60 font-mono">
              {{ volumes[sound.id] }}%
            </span>
          </div>

          <div class="relative h-2 w-full rounded-full bg-black/40 overflow-hidden">
            <div :class="clsx('absolute top-0 left-0 h-full transition-all rounded-full', sound.color)"
                 :style="{ width: volumes[sound.id] + '%' }">
            </div>

            <input
              type="range"
              min="0"
              max="100"
              :value="volumes[sound.id]"
              :disabled="sound.isPremium && !props.isPremium"
              @input="handleVolumeChange(sound.id, +$event.target.value, sound.isPremium && !props.isPremium)"
              class="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            />
          </div>
        </div>

        <div v-if="sound.isPremium && !props.isPremium"
             class="absolute inset-0 bg-gradient-to-r from-transparent via-amber-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"></div>
      </div>
    </div>
  </div>
</template>

