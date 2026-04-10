<script setup>
import { ref, computed } from 'vue';
import { Bot, Sparkles, Send, ListTodo, Compass, Loader2 } from 'lucide-vue-next';
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

const suggestions = computed(() => ({
  plan: [t('ai.suggestion.plan1'), t('ai.suggestion.plan2'), t('ai.suggestion.plan3')],
  strategy: [t('ai.suggestion.strategy1'), t('ai.suggestion.strategy2'), t('ai.suggestion.strategy3')]
}));

const createBlocks = (topic) => {
  const trimmed = topic.trim();
  if (mode.value === 'plan') {
    if (language.value === 'ru') {
      return {
        title: `План на сегодня: ${trimmed}`,
        items: [
          'Определите один главный результат на ближайшие 90 минут.',
          'Разбейте задачу на 3 коротких шага и начните с самого простого.',
          'Запустите один фокус-цикл без переключения контекста.',
          'После сессии запишите, что продвинулось и что мешало.'
        ]
      };
    }

    if (language.value === 'uz') {
      return {
        title: `Bugungi reja: ${trimmed}`,
        items: [
          "Keyingi 90 daqiqa uchun bitta asosiy natijani belgilang.",
          'Vazifani 3 qisqa qadamga ajrating va eng yengilidan boshlang.',
          'Bitta fokus siklini chalg‘imasdan yakunlang.',
          'Sessiyadan keyin nima siljigani va nima to‘sganini yozib qo‘ying.'
        ]
      };
    }

    return {
      title: `Today plan: ${trimmed}`,
      items: [
        'Pick one concrete outcome for the next 90 minutes.',
        'Break the work into 3 short steps and start with the easiest one.',
        'Run one focus cycle without context switching.',
        'After the session, note what moved and what blocked you.'
      ]
    };
  }

  if (language.value === 'ru') {
    return {
      title: `Стратегия: ${trimmed}`,
      items: [
        'Уберите один главный источник шума перед стартом.',
        'Снизьте порог входа: начните с 10 минут, а не с идеального плана.',
        'Определите короткий ритуал возврата, если внимание уплывет.',
        'Оцените энергию после цикла и скорректируйте темп, а не цель.'
      ]
    };
  }

  if (language.value === 'uz') {
    return {
      title: `Strategiya: ${trimmed}`,
      items: [
        'Boshlashdan oldin bitta asosiy chalg‘ituvchini olib tashlang.',
        'Kirishni osonlashtiring: ideal reja emas, 10 daqiqadan boshlang.',
        'Diqqat yo‘qolsa, qaytish uchun qisqa ritual belgilang.',
        'Har sikldan keyin energiyani tekshirib, tempni moslang.'
      ]
    };
  }

  return {
    title: `Strategy: ${trimmed}`,
    items: [
      'Remove one major distraction before you begin.',
      'Lower the entry barrier: start with 10 minutes instead of a perfect plan.',
      'Define a short reset ritual for when your attention drifts.',
      'Check your energy after each cycle and adjust the pace, not the goal.'
    ]
  };
};

const generateResponse = () => {
  if (!input.value.trim()) return;

  isLoading.value = true;
  response.value = null;

  window.setTimeout(() => {
    response.value = createBlocks(input.value);
    isLoading.value = false;
  }, 700);
};
</script>

<template>
  <div class="glass-panel rounded-[2rem] p-5 md:p-6 w-full relative overflow-hidden flex flex-col min-h-[320px]">
    <h3 class="text-white font-semibold mb-4 flex items-center gap-3 text-lg">
      <div class="grid h-10 w-10 place-items-center rounded-2xl border border-white/10 bg-white/5">
        <Bot :size="18" class="text-rose-300" />
      </div>
      <span>{{ t('ai.title') }}</span>
      <span v-if="!props.isPremium" class="ml-auto rounded-full border border-amber-400/25 bg-amber-500/12 px-2.5 py-1 text-[11px] font-semibold text-amber-100">
        {{ t('premium.badge') }}
      </span>
    </h3>

    <div :class="clsx('flex-1 flex flex-col transition-all duration-500', !props.isPremium && 'blur-sm opacity-45 select-none pointer-events-none')">
      <div class="flex rounded-2xl border border-white/8 bg-black/20 p-1">
        <button
          @click="mode = 'plan'"
          :class="clsx('flex-1 flex items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-semibold transition-all', mode === 'plan' ? 'bg-white/10 text-white' : 'text-white/50 hover:text-white')"
        >
          <ListTodo :size="16" />
          {{ t('ai.plan') }}
        </button>
        <button
          @click="mode = 'strategy'"
          :class="clsx('flex-1 flex items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-semibold transition-all', mode === 'strategy' ? 'bg-white/10 text-white' : 'text-white/50 hover:text-white')"
        >
          <Compass :size="16" />
          {{ t('ai.strategy') }}
        </button>
      </div>

      <div class="mt-4 flex flex-wrap gap-2">
        <button
          v-for="suggestion in suggestions[mode]"
          :key="suggestion"
          @click="input = suggestion"
          class="rounded-full border border-white/8 bg-white/5 px-3 py-1.5 text-xs font-medium text-white/65 transition-colors hover:bg-white/10 hover:text-white"
        >
          {{ suggestion }}
        </button>
      </div>

      <div class="mt-4 flex-1 rounded-[1.6rem] border border-white/8 bg-black/20 p-4 overflow-y-auto custom-scrollbar">
        <div v-if="isLoading" class="flex h-full flex-col items-center justify-center gap-2 text-white/50">
          <Loader2 :size="24" class="animate-spin text-rose-300" />
          <span>{{ t('ai.thinking') }}</span>
        </div>

        <div v-else-if="response" class="space-y-4">
          <div>
            <p class="text-xs uppercase tracking-[0.24em] text-rose-200/70">{{ mode === 'plan' ? t('ai.plan') : t('ai.strategy') }}</p>
            <h4 class="mt-2 text-lg font-semibold text-white">{{ response.title }}</h4>
          </div>

          <div class="space-y-2">
            <div
              v-for="(item, index) in response.items"
              :key="item"
              class="flex items-start gap-3 rounded-2xl border border-white/8 bg-white/[0.03] px-3 py-3 text-sm text-white/80"
            >
              <div class="mt-0.5 grid h-6 w-6 flex-shrink-0 place-items-center rounded-full bg-rose-500/12 text-xs font-semibold text-rose-100">
                {{ index + 1 }}
              </div>
              <p>{{ item }}</p>
            </div>
          </div>
        </div>

        <div v-else class="flex h-full flex-col items-center justify-center text-center text-white/30 p-4">
          <Sparkles :size="32" class="mb-3 opacity-50" />
          <p>{{ t('ai.empty') }}</p>
        </div>
      </div>

      <div class="mt-4 relative">
        <input
          v-model="input"
          type="text"
          :placeholder="mode === 'plan' ? t('ai.placeholder.plan') : t('ai.placeholder.strategy')"
          @keydown.enter="generateResponse"
          class="glass-input w-full rounded-2xl py-3.5 pl-4 pr-14 text-white placeholder-white/35"
        />
        <button
          @click="generateResponse"
          :disabled="!input.trim() || isLoading"
          class="absolute right-2 top-2 inline-flex h-10 w-10 items-center justify-center rounded-xl bg-rose-500 text-white transition-colors hover:bg-rose-600 disabled:opacity-50"
        >
          <Send :size="16" />
        </button>
      </div>
    </div>

    <div v-if="!props.isPremium" class="absolute inset-0 z-10 flex flex-col items-center justify-center bg-black/20 px-6">
      <div class="max-w-sm rounded-[1.75rem] border border-white/10 bg-[rgba(7,12,21,0.74)] p-5 text-center shadow-2xl">
        <div class="mx-auto mb-3 grid h-14 w-14 place-items-center rounded-2xl bg-gradient-to-br from-rose-400 to-orange-500 text-white">
          <Bot :size="24" />
        </div>
        <h4 class="text-lg font-semibold text-white">{{ t('ai.locked.title') }}</h4>
        <p class="mt-2 text-sm text-white/60">{{ t('ai.locked.desc') }}</p>
        <button @click="emit('open-premium')" class="mt-4 rounded-xl bg-white px-4 py-2 text-sm font-bold text-slate-950">
          {{ t('premium.btn') }}
        </button>
      </div>
    </div>
  </div>
</template>
