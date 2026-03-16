<script setup>
import { ref, computed } from 'vue';
import { BarChart3, TrendingUp, Clock, Calendar, History, Brain } from 'lucide-vue-next';
import { clsx } from 'clsx';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { useLanguage } from '../context/language';

const props = defineProps({
  isPremium: Boolean
});

const { t } = useLanguage();
const [sessions] = useLocalStorage('zenflow-sessions', []);
const view = ref('overview');

const safeSessions = computed(() => (Array.isArray(sessions.value) ? sessions.value : []));
const orderedSessions = computed(() => {
  return safeSessions.value
    .filter((s) => s && typeof s === 'object' && Number(s.duration) > 0)
    .slice()
    .sort((a, b) => (Number(b.timestamp) || 0) - (Number(a.timestamp) || 0));
});

const totalMinutes = computed(() => safeSessions.value.reduce((acc, curr) => acc + (Number(curr.duration) || 0), 0));
const hours = computed(() => Math.floor(totalMinutes.value / 60));
const minutes = computed(() => totalMinutes.value % 60);
</script>

<template>
  <div class="bg-white/10 backdrop-blur-md border border-white/20 rounded-3xl p-6 w-full relative overflow-hidden flex flex-col min-h-[300px] max-h-[520px]">
    <div class="flex items-center justify-between mb-4">
      <h3 class="text-white font-semibold flex items-center gap-2">
        <TrendingUp :size="20" />
        <span>{{ t('stats.title') }}</span>
      </h3>
      <div class="flex bg-black/20 rounded-lg p-1">
        <button
          @click="view = 'overview'"
          :class="clsx('p-1.5 rounded-md transition-all', view === 'overview' ? 'bg-white/10 text-white' : 'text-white/40 hover:text-white')"
          :title="t('stats.overview')"
        >
          <BarChart3 :size="14" />
        </button>
        <button
          @click="view = 'history'"
          :class="clsx('p-1.5 rounded-md transition-all', view === 'history' ? 'bg-white/10 text-white' : 'text-white/40 hover:text-white')"
          :title="t('stats.history')"
        >
          <History :size="14" />
        </button>
      </div>
    </div>

    <div class="flex-1 transition-all duration-500 flex flex-col gap-3">
      <template v-if="view === 'overview'">
        <div class="grid grid-cols-2 gap-3">
          <div class="bg-black/20 p-4 rounded-2xl">
            <div class="flex items-center gap-2 text-white/60 mb-1">
              <Clock :size="14" />
              <span class="text-xs">{{ t('stats.totalFocus') }}</span>
            </div>
            <div class="text-2xl font-bold text-white">{{ hours }}h {{ minutes }}m</div>
            <div class="text-xs text-green-400 mt-1">Live</div>
          </div>

          <div class="bg-black/20 p-4 rounded-2xl">
            <div class="flex items-center gap-2 text-white/60 mb-1">
              <Calendar :size="14" />
              <span class="text-xs">{{ t('stats.sessions') }}</span>
            </div>
            <div class="text-2xl font-bold text-white">{{ safeSessions.length }}</div>
            <div class="text-xs text-orange-400 mt-1">Updated</div>
          </div>
        </div>

        <div class="flex-1 bg-black/20 p-4 rounded-2xl flex items-end justify-between gap-1 px-2 pb-2 min-h-[100px]">
          <div
            v-for="(h, i) in [40, 65, 30, 80, 55, 90, 70]"
            :key="i"
            class="w-full bg-white/10 rounded-t-sm hover:bg-rose-500/50 transition-colors relative group"
            :style="{ height: `${h}%` }"
          >
            <div class="absolute -top-8 left-1/2 -translate-x-1/2 bg-black text-white text-[10px] px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
              {{ h }} min
            </div>
          </div>
        </div>
      </template>

      <div v-else class="flex-1 bg-black/20 rounded-2xl overflow-hidden">
        <div v-if="orderedSessions.length === 0" class="h-full flex flex-col items-center justify-center text-white/30 text-sm p-4">
          <History :size="24" class="mb-2 opacity-50" />
          {{ t('stats.empty') }}
        </div>
        <div v-else class="divide-y divide-white/5 overflow-y-auto custom-scrollbar max-h-[320px]">
          <div v-for="(session, idx) in orderedSessions" :key="idx" class="p-3 flex items-center justify-between hover:bg-white/5 transition-colors">
            <div class="flex items-center gap-3">
              <div class="w-8 h-8 rounded-full bg-rose-500/20 flex items-center justify-center text-rose-400">
                <Brain :size="14" />
              </div>
              <div>
                <div class="text-sm text-white font-medium">{{ t('stats.session_name') }}</div>
                <div class="text-xs text-white/40">
                  {{ new Date(session.timestamp).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) }}
                </div>
              </div>
            </div>
            <div class="text-sm font-bold text-white/80">{{ session.duration }} {{ t('timer.minutes') }}</div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
