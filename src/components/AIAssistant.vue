<script setup>
import { ref } from 'vue';
import { Bot, Sparkles, Send, Lock, ListTodo, Compass, Loader2 } from 'lucide-vue-next';
import { clsx } from 'clsx';
import { useLanguage } from '../context/language';

const props = defineProps({
  isPremium: Boolean
});

const emit = defineEmits(['open-premium']);

const { t, language } = useLanguage();
const mode = ref('plan');
const input = ref('');
const response = ref(null);
const isLoading = ref(false);

const generateResponse = () => {
  if (!input.value.trim()) return;

  isLoading.value = true;
  response.value = null;

  setTimeout(() => {
    let result = '';
    if (mode.value === 'plan') {
      if (language.value === 'uz') {
        result = `
**${input.value} bo'yicha kunlik reja:**

- 09:00 - 10:30: Chuqur o'rganish. Asosiy tushunchalarni ko'rib chiqing.
- 10:30 - 10:45: Qisqa tanaffus. Miya dam olishi kerak.
- 10:45 - 12:30: Amaliyot. ${input.value} bo'yicha kichik loyiha qiling.
- 12:30 - 13:30: Tushlik va toza havo.
- 13:30 - 15:00: Takrorlash va xatolarni tahlil qilish.
        `;
      } else if (language.value === 'ru') {
        result = `
**Plan na den po teme: ${input.value}**

- 09:00 - 10:30: Glubokaya rabota. Izuchenie osnov.
- 10:30 - 10:45: Kofe-breyk. Mozgu nuzhen otdyh.
- 10:45 - 12:30: Praktika. Sdelayte mini-proekt po ${input.value}.
- 12:30 - 13:30: Obed i svezhiy vozduh.
- 13:30 - 15:00: Povtorenie i analiz oshibok.
        `;
      } else {
        result = `
**Daily Plan for: ${input.value}**

- 09:00 - 10:30: Deep Work. Review core concepts.
- 10:30 - 10:45: Short break. Brain needs rest.
- 10:45 - 12:30: Practice. Build a small project on ${input.value}.
- 12:30 - 13:30: Lunch and fresh air.
- 13:30 - 15:00: Review and analyze mistakes.
        `;
      }
    } else {
      if (language.value === 'uz') {
        result = `
**Strategik maslahatl ar:**

"${input.value}" maqsadingizga erishish uchun eng muhimi - kichik qadamlar.

1. Fokus: Hamma narsani birdan o'rganishga urinmang.
2. Muhit: Telefonni "Do Not Disturb" ga qo'ying.
3. Motivatsiya: Natija emas, jarayondan zavqlaning.
        `;
      } else if (language.value === 'ru') {
        result = `
**Strategicheskiy sovet:**

Dlya dostizheniya celi "${input.value}" glavnoe - malen'kie shagi.

1. Fokus: Ne pytaytes' vyuchit' vse srazu.
2. Sreda: Postav'te telefon na "Ne bespokoit".
3. Motivaciya: Naslazhdaytes' processom, a ne tol'ko rezul'tatom.
        `;
      } else {
        result = `
**Strategic Advice:**

To achieve "${input.value}", the key is small steps.

1. Focus: Don't try to learn everything at once.
2. Environment: Put your phone on "Do Not Disturb".
3. Motivation: Enjoy the process, not just the result.
        `;
      }
    }

    response.value = result.trim();
    isLoading.value = false;
  }, 2000);
};
</script>

<template>
  <div class="bg-white/10 backdrop-blur-md border border-white/20 rounded-3xl p-6 w-full relative overflow-hidden flex flex-col h-full min-h-[300px]">
    <h3 class="text-white font-semibold mb-4 flex items-center gap-2">
      <Bot :size="20" class="text-rose-400" />
      <span>{{ t('ai.title') }}</span>
      <span v-if="!props.isPremium" class="ml-auto text-xs bg-amber-500/20 text-amber-300 px-2 py-0.5 rounded border border-amber-500/30">
        {{ t('premium.badge') }}
      </span>
    </h3>

    <div :class="clsx('flex-1 flex flex-col transition-all duration-500', !props.isPremium && 'blur-sm opacity-50 select-none pointer-events-none')">
      <div class="flex bg-black/20 p-1 rounded-xl mb-4">
        <button
          @click="mode = 'plan'"
          :class="clsx('flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-medium transition-all', mode === 'plan' ? 'bg-white/10 text-white shadow' : 'text-white/50 hover:text-white')"
        >
          <ListTodo :size="16" />
          {{ t('ai.plan') }}
        </button>
        <button
          @click="mode = 'strategy'"
          :class="clsx('flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-medium transition-all', mode === 'strategy' ? 'bg-white/10 text-white shadow' : 'text-white/50 hover:text-white')"
        >
          <Compass :size="16" />
          {{ t('ai.strategy') }}
        </button>
      </div>

      <div class="flex-1 bg-black/20 rounded-xl p-4 mb-4 overflow-y-auto custom-scrollbar text-sm text-white/80 leading-relaxed whitespace-pre-line border border-white/5">
        <div v-if="isLoading" class="flex flex-col items-center justify-center h-full text-white/50 gap-2">
          <Loader2 :size="24" class="animate-spin text-rose-400" />
          <span>{{ t('ai.thinking') }}</span>
        </div>
        <div v-else-if="response" class="animate-in fade-in slide-in-from-bottom-2 duration-500">
          {{ response }}
        </div>
        <div v-else class="flex flex-col items-center justify-center h-full text-white/30 text-center p-4">
          <Sparkles :size="32" class="mb-2 opacity-50" />
          <p>{{ t('ai.empty') }}</p>
        </div>
      </div>

      <div class="relative">
        <input
          v-model="input"
          type="text"
          :placeholder="mode === 'plan' ? t('ai.placeholder.plan') : t('ai.placeholder.strategy')"
          @keydown.enter="generateResponse"
          class="w-full bg-black/20 border border-white/10 rounded-xl py-3 pl-4 pr-12 text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-rose-500/50 transition-all"
        />
        <button
          @click="generateResponse"
          :disabled="!input.trim() || isLoading"
          class="absolute right-2 top-2 p-1.5 bg-rose-500 rounded-lg text-white hover:bg-rose-600 disabled:opacity-50 disabled:hover:bg-rose-500 transition-colors shadow-lg shadow-rose-500/20"
        >
          <Send :size="16" />
        </button>
      </div>
    </div>

    <div v-if="!props.isPremium" class="absolute inset-0 z-10 flex flex-col items-center justify-center bg-black/10">
      <div class="bg-black/40 backdrop-blur-md p-4 rounded-2xl border border-white/10 text-center transform hover:scale-105 transition-transform cursor-pointer shadow-2xl" @click="emit('open-premium')">
        <div class="w-12 h-12 bg-gradient-to-br from-rose-400 to-orange-500 rounded-full flex items-center justify-center mx-auto mb-3 shadow-lg shadow-rose-500/20">
          <Bot class="text-white" :size="24" />
        </div>
        <h4 class="text-white font-bold text-lg">{{ t('ai.locked.title') }}</h4>
        <p class="text-white/60 text-sm mt-1 mb-3 px-4">{{ t('ai.locked.desc') }}</p>
        <button class="bg-white text-black text-xs font-bold px-4 py-2 rounded-lg">
          {{ t('premium.btn') }}
        </button>
      </div>
    </div>
  </div>
</template>
