<script setup>
import { ref, computed } from 'vue';
import { BarChart3, TrendingUp, Clock, Calendar, History, Brain, Flame } from 'lucide-vue-next';
import { clsx } from 'clsx';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { useLanguage } from '../context/language';

const props = defineProps({
  isPremium: Boolean
});

const { t } = useLanguage();
const [sessions] = useLocalStorage('zenflow-sessions', []);
const view = ref('overview');

const safeSessions = computed(() => (
  Array.isArray(sessions.value)
    ? sessions.value
        .filter((session) => session && typeof session === 'object' && Number(session.duration) > 0)
        .map((session) => ({
          ...session,
          timestamp: Number(session.timestamp) || Date.now(),
          duration: Number(session.duration) || 0
        }))
    : []
));

const orderedSessions = computed(() => [...safeSessions.value].sort((a, b) => b.timestamp - a.timestamp));

const totalMinutes = computed(() => safeSessions.value.reduce((acc, curr) => acc + curr.duration, 0));
const averageSession = computed(() => (safeSessions.value.length ? Math.round(totalMinutes.value / safeSessions.value.length) : 0));
const bestSession = computed(() => safeSessions.value.reduce((best, session) => Math.max(best, session.duration), 0));

const sameDay = (dateA, dateB) =>
  dateA.getFullYear() === dateB.getFullYear() &&
  dateA.getMonth() === dateB.getMonth() &&
  dateA.getDate() === dateB.getDate();

const todayMinutes = computed(() => {
  const now = new Date();
  return safeSessions.value.reduce((sum, session) => {
    const stamp = new Date(session.timestamp);
    return sameDay(stamp, now) ? sum + session.duration : sum;
  }, 0);
});

const thisWeekMinutes = computed(() => {
  const now = new Date();
  const startOfWeek = new Date(now);
  const day = startOfWeek.getDay();
  const diff = day === 0 ? 6 : day - 1;
  startOfWeek.setDate(startOfWeek.getDate() - diff);
  startOfWeek.setHours(0, 0, 0, 0);

  return safeSessions.value.reduce((sum, session) => {
    const stamp = new Date(session.timestamp);
    return stamp >= startOfWeek ? sum + session.duration : sum;
  }, 0);
});

const weekdaySeries = computed(() => {
  const formatter = new Intl.DateTimeFormat(undefined, { weekday: 'short' });
  const now = new Date();
  const days = Array.from({ length: 7 }, (_, index) => {
    const day = new Date(now);
    day.setDate(now.getDate() - (6 - index));
    day.setHours(0, 0, 0, 0);
    return {
      key: day.toISOString(),
      label: formatter.format(day),
      value: 0,
      isToday: sameDay(day, now)
    };
  });

  safeSessions.value.forEach((session) => {
    const stamp = new Date(session.timestamp);
    stamp.setHours(0, 0, 0, 0);
    const dayKey = stamp.toISOString();
    const match = days.find((day) => day.key === dayKey);
    if (match) match.value += session.duration;
  });

  const max = Math.max(...days.map((day) => day.value), 1);
  return days.map((day) => ({
    ...day,
    percent: Math.max((day.value / max) * 100, day.value > 0 ? 12 : 6)
  }));
});

const recentSessions = computed(() => {
  const limit = props.isPremium ? 50 : 12;
  return orderedSessions.value.slice(0, limit);
});
</script>

<template>
  <div class="glass-panel rounded-[2rem] p-5 md:p-6 w-full relative overflow-hidden flex flex-col min-h-[340px]">
    <div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h3 class="text-white font-semibold flex items-center gap-3 text-lg">
          <div class="grid h-10 w-10 place-items-center rounded-2xl border border-white/10 bg-white/5">
            <TrendingUp :size="18" class="text-emerald-300" />
          </div>
          <span>{{ t('stats.title') }}</span>
        </h3>
        <p class="mt-2 text-sm text-white/45">{{ t('stats.weekly') }}</p>
      </div>
      <div class="flex self-start rounded-xl border border-white/8 bg-black/20 p-1 sm:self-auto">
        <button
          @click="view = 'overview'"
          :class="clsx('rounded-lg px-3 py-1.5 text-xs font-semibold transition-all', view === 'overview' ? 'bg-white/10 text-white' : 'text-white/45 hover:text-white')"
        >
          {{ t('stats.overview') }}
        </button>
        <button
          @click="view = 'history'"
          :class="clsx('rounded-lg px-3 py-1.5 text-xs font-semibold transition-all', view === 'history' ? 'bg-white/10 text-white' : 'text-white/45 hover:text-white')"
        >
          {{ t('stats.history') }}
        </button>
      </div>
    </div>

    <div class="mt-5 flex-1">
      <template v-if="view === 'overview'">
        <div class="grid grid-cols-2 gap-3 md:grid-cols-4">
          <div class="rounded-2xl border border-white/8 bg-black/20 p-4">
            <div class="flex items-center gap-2 text-white/50">
              <Clock :size="14" />
              <span class="text-xs">{{ t('stats.totalFocus') }}</span>
            </div>
            <div class="mt-2 text-2xl font-semibold text-white">{{ totalMinutes }}</div>
            <div class="text-xs text-white/40">{{ t('timer.minutes') }}</div>
          </div>

          <div class="rounded-2xl border border-white/8 bg-black/20 p-4">
            <div class="flex items-center gap-2 text-white/50">
              <Calendar :size="14" />
              <span class="text-xs">{{ t('stats.today') }}</span>
            </div>
            <div class="mt-2 text-2xl font-semibold text-white">{{ todayMinutes }}</div>
            <div class="text-xs text-white/40">{{ t('timer.minutes') }}</div>
          </div>

          <div class="rounded-2xl border border-white/8 bg-black/20 p-4">
            <div class="flex items-center gap-2 text-white/50">
              <BarChart3 :size="14" />
              <span class="text-xs">{{ t('stats.average') }}</span>
            </div>
            <div class="mt-2 text-2xl font-semibold text-white">{{ averageSession }}</div>
            <div class="text-xs text-white/40">{{ t('timer.minutes') }}</div>
          </div>

          <div class="rounded-2xl border border-white/8 bg-black/20 p-4">
            <div class="flex items-center gap-2 text-white/50">
              <Flame :size="14" />
              <span class="text-xs">{{ t('stats.best') }}</span>
            </div>
            <div class="mt-2 text-2xl font-semibold text-white">{{ bestSession }}</div>
            <div class="text-xs text-white/40">{{ t('timer.minutes') }}</div>
          </div>
        </div>

        <div class="mt-4 rounded-[1.75rem] border border-white/8 bg-black/20 p-4">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-[11px] uppercase tracking-[0.22em] text-white/35">{{ t('stats.weekly') }}</p>
              <p class="mt-1 text-lg font-semibold text-white">{{ thisWeekMinutes }} {{ t('timer.minutes') }}</p>
            </div>
            <div class="rounded-full border border-emerald-400/18 bg-emerald-400/10 px-3 py-1 text-xs font-semibold text-emerald-100">
              {{ safeSessions.length }} {{ t('stats.sessions').toLowerCase() }}
            </div>
          </div>

          <div class="mt-5 grid grid-cols-7 items-end gap-2">
            <div v-for="day in weekdaySeries" :key="day.key" class="flex flex-col items-center gap-2">
              <div
                :class="clsx(
                  'flex w-full items-end justify-center rounded-t-2xl transition-all',
                  day.isToday ? 'bg-gradient-to-t from-cyan-400 to-emerald-300' : 'bg-white/12 hover:bg-white/18'
                )"
                :style="{ height: `${Math.max(day.percent, 8)}px`, minHeight: '24px' }"
              >
                <span class="mb-2 text-[10px] font-semibold text-slate-950" v-if="day.value">{{ day.value }}</span>
              </div>
              <span :class="clsx('text-[11px] font-semibold', day.isToday ? 'text-white' : 'text-white/45')">{{ day.label }}</span>
            </div>
          </div>
        </div>
      </template>

      <div v-else class="flex h-full flex-col rounded-[1.75rem] border border-white/8 bg-black/20 overflow-hidden">
        <div v-if="recentSessions.length === 0" class="grid flex-1 place-items-center p-6 text-center text-white/30">
          <div>
            <History :size="28" class="mx-auto mb-3 opacity-50" />
            <p>{{ t('stats.empty') }}</p>
          </div>
        </div>

        <div v-else class="max-h-[360px] divide-y divide-white/6 overflow-y-auto custom-scrollbar">
          <div v-for="(session, idx) in recentSessions" :key="`${session.timestamp}-${idx}`" class="flex items-center justify-between gap-3 p-4 transition-colors hover:bg-white/[0.03]">
            <div class="flex min-w-0 items-center gap-3">
              <div class="grid h-10 w-10 place-items-center rounded-2xl bg-rose-500/12 text-rose-200">
                <Brain :size="16" />
              </div>
              <div class="min-w-0">
                <div class="truncate text-sm font-semibold text-white">{{ t('stats.session_name') }}</div>
                <div class="text-xs text-white/40">
                  {{ new Date(session.timestamp).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) }}
                </div>
              </div>
            </div>
            <div class="rounded-full border border-white/8 bg-white/5 px-3 py-1 text-sm font-semibold text-white/80">
              {{ session.duration }} {{ t('timer.minutes') }}
            </div>
          </div>
        </div>

        <div v-if="!props.isPremium && recentSessions.length > 0" class="border-t border-white/6 px-4 py-3 text-xs text-white/40">
          {{ t('stats.freeLimit') }}
        </div>
      </div>
    </div>
  </div>
</template>
