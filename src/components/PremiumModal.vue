<script setup>
import { X, Crown, Zap, BarChart3, Bot, Maximize2 } from 'lucide-vue-next';
import { useLanguage } from '../context/language';

const props = defineProps({
  isOpen: Boolean
});

const emit = defineEmits(['close', 'upgrade']);

const { t } = useLanguage();

const features = [
  { icon: Maximize2, text: t('premium.feature1') },
  { icon: Bot, text: t('premium.feature2') },
  { icon: BarChart3, text: t('premium.feature3') },
  { icon: Crown, text: t('premium.feature4') },
];
</script>

<template>
  <div v-if="props.isOpen" class="fixed inset-0 z-50 flex items-center justify-center p-4">
    <div class="absolute inset-0 bg-black/60 backdrop-blur-sm" @click="emit('close')" />

    <div class="relative w-full max-w-md bg-[#1e293b] border border-amber-500/30 rounded-3xl overflow-hidden shadow-2xl shadow-amber-500/20 animate-in fade-in zoom-in duration-300 max-h-[90vh] flex flex-col">
      <div class="h-28 md:h-32 bg-gradient-to-br from-amber-400 to-orange-600 relative flex items-center justify-center overflow-hidden flex-shrink-0">
        <div class="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-20"></div>
        <div class="text-center relative z-10">
          <div class="w-10 h-10 md:w-12 md:h-12 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center mx-auto mb-2 shadow-lg">
            <Crown class="text-white" :size="20" />
          </div>
          <h2 class="text-xl md:text-2xl font-bold text-white">{{ t('premium.title') }}</h2>
        </div>
        <button @click="emit('close')" class="absolute top-4 right-4 text-white/70 hover:text-white bg-black/20 hover:bg-black/40 rounded-full p-1 transition-colors">
          <X :size="20" />
        </button>
      </div>

      <div class="p-5 md:p-6 space-y-5 md:space-y-6 overflow-y-auto custom-scrollbar">
        <div class="space-y-3 md:space-y-4">
          <div v-for="(feature, idx) in features" :key="idx" class="flex items-center gap-3 text-white/90">
            <div class="p-2 bg-amber-500/10 rounded-lg text-amber-400 flex-shrink-0">
              <component :is="feature.icon" :size="18" />
            </div>
            <span class="text-sm font-medium">{{ feature.text }}</span>
          </div>
        </div>

        <div class="bg-white/5 rounded-xl p-4 text-center border border-white/10">
          <span class="text-white/50 text-sm line-through block">$9.99</span>
          <div class="flex items-baseline justify-center gap-1 text-white">
            <span class="text-3xl font-bold">$4.99</span>
            <span class="text-sm text-white/60">/mo</span>
          </div>
          <p class="text-xs text-amber-400 mt-1">{{ t('premium.discount') }}</p>
        </div>

        <button @click="emit('upgrade')" class="w-full py-3.5 bg-gradient-to-r from-amber-400 to-orange-500 hover:from-amber-500 hover:to-orange-600 text-white font-bold rounded-xl shadow-lg shadow-amber-500/25 transition-all active:scale-95 flex items-center justify-center gap-2">
          <Zap :size="18" />
          {{ t('premium.btn') }}
        </button>

        <p class="text-center text-xs text-white/30">
          {{ t('premium.cancel') }}
        </p>
      </div>
    </div>
  </div>
</template>
