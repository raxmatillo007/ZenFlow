<script setup lang="ts">
import { ref, onMounted, watch, computed } from 'vue';
import { Plus, Check, Trash2, Flag, ListTodo, Sparkles } from 'lucide-vue-next';
import { clsx } from 'clsx';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { useLanguage } from '../context/language';
import { dataService, getAuthToken } from '../services/api';

const { t } = useLanguage();
const [tasks, setTasks] = useLocalStorage('zenflow-tasks', []);
const newTask = ref('');
const priority = ref('medium');
const filter = ref('all');
const hasLoadedRemote = ref(false);

const normalizeTask = (task) => ({
  id: String(task?.id || Date.now()),
  text: String(task?.text || '').trim(),
  completed: Boolean(task?.completed),
  createdAt: Number(task?.createdAt) || Date.now(),
  priority: ['low', 'medium', 'high'].includes(task?.priority) ? task.priority : 'medium'
});

onMounted(async () => {
  if (!getAuthToken()) {
    hasLoadedRemote.value = true;
    return;
  }

  try {
    const remoteTasks = await dataService.getTasks();
    setTasks(Array.isArray(remoteTasks) ? remoteTasks.map(normalizeTask).filter((task) => task.text) : []);
  } catch (error) {
    console.error('Tasks yuklanmadi:', error);
  } finally {
    hasLoadedRemote.value = true;
  }
});

watch(
  tasks,
  async (value) => {
    if (!hasLoadedRemote.value || !getAuthToken()) return;
    try {
      const normalized = Array.isArray(value) ? value.map(normalizeTask).filter((task) => task.text) : [];
      await dataService.saveTasks(normalized);
    } catch (error) {
      console.error('Tasks saqlanmadi:', error);
    }
  },
  { deep: true }
);

const totalTasks = computed(() => tasks.value.length);
const completedTasks = computed(() => tasks.value.filter((task) => task.completed).length);
const remainingTasks = computed(() => totalTasks.value - completedTasks.value);
const progress = computed(() => (totalTasks.value ? Math.round((completedTasks.value / totalTasks.value) * 100) : 0));

const orderedTasks = computed(() => {
  const list = [...tasks.value];
  const weight = { high: 0, medium: 1, low: 2 };
  return list.sort((a, b) => {
    if (a.completed !== b.completed) return Number(a.completed) - Number(b.completed);
    if (weight[a.priority] !== weight[b.priority]) return weight[a.priority] - weight[b.priority];
    return Number(b.createdAt) - Number(a.createdAt);
  });
});

const filteredTasks = computed(() => {
  if (filter.value === 'active') return orderedTasks.value.filter((task) => !task.completed);
  if (filter.value === 'done') return orderedTasks.value.filter((task) => task.completed);
  return orderedTasks.value;
});

const addTask = () => {
  const text = newTask.value.trim();
  if (!text) return;

  const task = {
    id: Date.now().toString(),
    text,
    completed: false,
    createdAt: Date.now(),
    priority: priority.value
  };

  setTasks([task, ...tasks.value.map(normalizeTask)]);
  newTask.value = '';
  priority.value = 'medium';
};

const toggleTask = (id: string) => {
  setTasks(tasks.value.map((task) => (task.id === id ? { ...task, completed: !task.completed } : task)));
};

const deleteTask = (id: string) => {
  setTasks(tasks.value.filter((task) => task.id !== id));
};

const clearDone = () => {
  setTasks(tasks.value.filter((task) => !task.completed));
};

const getPriorityColor = (p: string) => {
  switch (p) {
    case 'high':
      return 'text-rose-300 bg-rose-500/12 border-rose-400/25';
    case 'medium':
      return 'text-amber-200 bg-amber-500/12 border-amber-400/25';
    case 'low':
      return 'text-cyan-200 bg-cyan-500/12 border-cyan-400/25';
    default:
      return 'text-white/50';
  }
};
</script>

<template>
  <div class="glass-panel rounded-[2rem] p-5 md:p-6 w-full h-full flex flex-col">
    <div class="flex items-start justify-between gap-3">
      <div>
        <h3 class="text-white font-semibold flex items-center gap-3 text-lg">
          <div class="grid h-10 w-10 place-items-center rounded-2xl border border-white/10 bg-white/5">
            <ListTodo :size="18" class="text-cyan-300" />
          </div>
          {{ t('tasks.title') }}
        </h3>
        <p class="mt-2 text-sm text-white/45">{{ t('tasks.tip') }}</p>
      </div>
      <div class="rounded-2xl border border-white/10 bg-black/20 px-3 py-2 text-right">
        <p class="text-[11px] uppercase tracking-[0.22em] text-white/35">{{ t('tasks.summary') }}</p>
        <p class="mt-1 text-lg font-semibold text-white">{{ progress }}%</p>
      </div>
    </div>

    <div class="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
      <div class="rounded-2xl border border-white/8 bg-black/20 p-3">
        <p class="text-[11px] uppercase tracking-[0.18em] text-white/35">{{ t('tasks.completed') }}</p>
        <p class="mt-2 text-lg font-semibold text-white">{{ completedTasks }}</p>
      </div>
      <div class="rounded-2xl border border-white/8 bg-black/20 p-3">
        <p class="text-[11px] uppercase tracking-[0.18em] text-white/35">{{ t('tasks.remaining') }}</p>
        <p class="mt-2 text-lg font-semibold text-white">{{ remainingTasks }}</p>
      </div>
      <div class="rounded-2xl border border-white/8 bg-black/20 p-3">
        <p class="text-[11px] uppercase tracking-[0.18em] text-white/35">{{ t('tasks.title') }}</p>
        <p class="mt-2 text-lg font-semibold text-white">{{ totalTasks }}</p>
      </div>
    </div>

    <div class="mt-4 h-2 overflow-hidden rounded-full bg-black/35">
      <div class="h-full rounded-full bg-gradient-to-r from-cyan-400 via-teal-400 to-emerald-400 transition-all duration-500" :style="{ width: `${progress}%` }" />
    </div>

    <form class="mt-5 space-y-3" @submit.prevent="addTask">
      <div class="relative">
        <input
          v-model="newTask"
          type="text"
          maxlength="120"
          :placeholder="t('tasks.placeholder')"
          class="glass-input w-full rounded-2xl py-3.5 pl-4 pr-14 text-white placeholder-white/35"
        />
        <button
          type="submit"
          :disabled="!newTask.trim()"
          class="absolute right-2 top-2 inline-flex h-10 w-10 items-center justify-center rounded-xl bg-white/10 text-white transition-colors hover:bg-white/20 disabled:opacity-50"
        >
          <Plus :size="18" />
        </button>
      </div>

      <div class="custom-scrollbar -mx-1 flex items-center gap-2 overflow-x-auto px-1 pb-1 sm:mx-0 sm:flex-wrap sm:overflow-visible sm:px-0 sm:pb-0">
        <button
          v-for="p in ['low', 'medium', 'high']"
          :key="p"
          type="button"
          @click="priority = p"
          :class="clsx(
            'shrink-0 rounded-full border px-3 py-1.5 text-xs font-medium transition-all capitalize flex items-center gap-1.5 whitespace-nowrap',
            priority === p ? getPriorityColor(p) : 'bg-white/5 border-white/8 text-white/45 hover:bg-white/10 hover:text-white'
          )"
        >
          <Flag :size="11" :fill="priority === p ? 'currentColor' : 'none'" />
          {{ t(`priority.${p}`) }}
        </button>
      </div>
    </form>

    <div class="mt-5 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
      <div class="custom-scrollbar -mx-1 flex items-center gap-2 overflow-x-auto px-1 pb-1 sm:mx-0 sm:flex-wrap sm:overflow-visible sm:px-0 sm:pb-0">
        <button
          v-for="tab in ['all', 'active', 'done']"
          :key="tab"
          @click="filter = tab"
          :class="clsx(
            'shrink-0 rounded-full border px-3 py-1.5 text-xs font-semibold transition-all whitespace-nowrap',
            filter === tab ? 'border-cyan-300/30 bg-cyan-400/12 text-cyan-100' : 'border-white/8 bg-white/5 text-white/50 hover:bg-white/10 hover:text-white'
          )"
        >
          {{ t(`tasks.${tab}`) }}
        </button>
      </div>
      <button
        v-if="completedTasks"
        @click="clearDone"
        class="w-full rounded-full border border-rose-400/20 bg-rose-500/10 px-3 py-1.5 text-xs font-semibold text-rose-100 transition-colors hover:bg-rose-500/16 sm:w-auto"
      >
        {{ t('tasks.clearDone') }}
      </button>
    </div>

    <div class="mt-4 flex-1 overflow-y-auto pr-1 custom-scrollbar">
      <div v-if="filteredTasks.length === 0" class="grid min-h-[220px] place-items-center rounded-[1.75rem] border border-dashed border-white/10 bg-black/20 p-6 text-center">
        <div>
          <Sparkles :size="28" class="mx-auto mb-3 text-white/25" />
          <p class="text-sm text-white/40">{{ t('tasks.empty') }}</p>
        </div>
      </div>

      <div v-else class="space-y-2">
        <div
          v-for="task in filteredTasks"
          :key="task.id"
          :class="clsx(
            'group flex items-center gap-3 rounded-[1.35rem] border p-3 transition-all duration-300',
            task.completed
              ? 'border-white/6 bg-white/[0.04] opacity-70'
              : 'border-white/8 bg-black/20 hover:border-white/14 hover:bg-black/28'
          )"
        >
          <button
            @click="toggleTask(task.id)"
            :class="clsx(
              'flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full border-2 transition-colors',
              task.completed ? 'border-emerald-400 bg-emerald-400 text-slate-950' : 'border-white/30 text-transparent hover:border-white/60'
            )"
          >
            <Check :size="12" :stroke-width="4" />
          </button>

          <div class="min-w-0 flex-1">
            <div :class="clsx('truncate text-sm text-white transition-all', task.completed && 'line-through text-white/40')">
              {{ task.text }}
            </div>
            <div class="mt-2 flex items-center gap-2">
              <span :class="clsx('rounded-full border px-2 py-0.5 text-[10px] uppercase tracking-[0.18em]', getPriorityColor(task.priority || 'medium'))">
                {{ t(`priority.${task.priority || 'medium'}`) }}
              </span>
            </div>
          </div>

          <button
            @click="deleteTask(task.id)"
            class="rounded-xl p-2 text-white/35 transition-all hover:bg-rose-500/10 hover:text-rose-300 md:opacity-0 md:group-hover:opacity-100"
          >
            <Trash2 :size="16" />
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
