<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount } from 'vue';
import { Globe, Check } from 'lucide-vue-next';
import { useLanguage } from '../context/language';
import { clsx } from 'clsx';

const { language, setLanguage } = useLanguage();
const isOpen = ref(false);
const dropdownRef = ref(null);

const handleClickOutside = (event: MouseEvent) => {
  if (dropdownRef.value && !dropdownRef.value.contains(event.target)) {
    isOpen.value = false;
  }
};

onMounted(() => {
  document.addEventListener('mousedown', handleClickOutside);
});

onBeforeUnmount(() => {
  document.removeEventListener('mousedown', handleClickOutside);
});

const languages = [
  { code: 'uz', label: "O'zbek", flag: 'UZ' },
  { code: 'ru', label: 'Russkiy', flag: 'RU' },
  { code: 'en', label: 'English', flag: 'EN' },
];
</script>

<template>
  <div class="relative" ref="dropdownRef">
    <button
      @click="isOpen = !isOpen"
      class="flex items-center gap-2 px-3 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/5 transition-all text-white/80 hover:text-white active:scale-95"
    >
      <Globe :size="18" />
      <span class="text-sm font-medium uppercase">{{ language }}</span>
    </button>

    <div
      v-if="isOpen"
      class="absolute top-full right-0 mt-2 w-40 bg-[#1e293b] border border-white/10 rounded-xl shadow-xl overflow-hidden z-50 animate-in fade-in zoom-in duration-200"
    >
      <button
        v-for="lang in languages"
        :key="lang.code"
        @click="() => { setLanguage(lang.code); isOpen = false; }"
        :class="clsx(
          'w-full flex items-center justify-between px-4 py-3 text-sm transition-colors hover:bg-white/5',
          language === lang.code ? 'text-rose-400 font-bold bg-white/5' : 'text-white/70'
        )"
      >
        <div class="flex items-center gap-3">
          <span class="text-lg">{{ lang.flag }}</span>
          <span>{{ lang.label }}</span>
        </div>
        <Check v-if="language === lang.code" :size="14" />
      </button>
    </div>
  </div>
</template>
