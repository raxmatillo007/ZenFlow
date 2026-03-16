<script setup lang="ts">
import { ref, onMounted, watch } from 'vue';
import { Plus, Check, Trash2, Flag } from 'lucide-vue-next';
import { clsx } from 'clsx';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { useLanguage } from '../context/language';
import { dataService, getAuthToken } from '../services/api';

const { t } = useLanguage();
const [tasks, setTasks] = useLocalStorage('zenflow-tasks', []);
const newTask = ref('');
const priority = ref('medium');
const hasLoadedRemote = ref(false);

onMounted(async () => {
  if (!getAuthToken()) {
    hasLoadedRemote.value = true;
    return;
  }

  try {
    const remoteTasks = await dataService.getTasks();
    setTasks(Array.isArray(remoteTasks) ? remoteTasks : []);
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
      await dataService.saveTasks(Array.isArray(value) ? value : []);
    } catch (error) {
      console.error('Tasks saqlanmadi:', error);
    }
  },
  { deep: true }
);

const addTask = () => {
  if (!newTask.value.trim()) return;
  const task = {
    id: Date.now().toString(),
    text: newTask.value,
    completed: false,
    createdAt: Date.now(),
    priority: priority.value
  };
  setTasks([task, ...tasks.value]);
  newTask.value = '';
  priority.value = 'medium';
};

const toggleTask = (id: string) => {
  setTasks(tasks.value.map((t) => (t.id === id ? { ...t, completed: !t.completed } : t)));
};

const deleteTask = (id: string) => {
  setTasks(tasks.value.filter((t) => t.id !== id));
};

const getPriorityColor = (p: string) => {
  switch (p) {
    case 'high': return 'text-rose-500 bg-rose-500/10 border-rose-500/20';
    case 'medium': return 'text-amber-500 bg-amber-500/10 border-amber-500/20';
    case 'low': return 'text-blue-500 bg-blue-500/10 border-blue-500/20';
    default: return 'text-white/50';
  }
};
</script>

<template>
  <div class="bg-white/10 backdrop-blur-md border border-white/20 rounded-3xl p-6 w-full h-full flex flex-col">
    <h3 class="text-white font-semibold mb-4 flex items-center gap-2">
      <Check :size="20" />
      <span>{{ t('tasks.title') }}</span>
      <span class="ml-auto text-xs bg-white/10 px-2 py-1 rounded-full text-white/70">
        {{ tasks.filter((t) => t.completed).length }}/{{ tasks.length }}
      </span>
    </h3>

    <form class="mb-4 space-y-2" @submit.prevent="addTask">
      <div class="relative">
        <input
          v-model="newTask"
          type="text"
          :placeholder="t('tasks.placeholder')"
          class="w-full bg-black/20 border border-white/10 rounded-xl py-3 pl-4 pr-12 text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-white/20 transition-all"
        />
        <button
          type="submit"
          :disabled="!newTask.trim()"
          class="absolute right-2 top-2 p-1.5 bg-white/10 rounded-lg text-white hover:bg-white/20 disabled:opacity-50 disabled:hover:bg-white/10 transition-colors"
        >
          <Plus :size="18" />
        </button>
      </div>

      <div class="flex gap-2">
        <button
          v-for="p in ['low', 'medium', 'high']"
          :key="p"
          type="button"
          @click="priority = p"
          :class="clsx(
            'px-3 py-1 rounded-lg text-xs font-medium border transition-all capitalize flex items-center gap-1',
            priority === p ? getPriorityColor(p) : 'bg-white/5 border-white/5 text-white/40 hover:bg-white/10'
          )"
        >
          <Flag :size="10" :fill="priority === p ? 'currentColor' : 'none'" />
          {{ t(`priority.${p}`) }}
        </button>
      </div>
    </form>

    <div class="flex-1 overflow-y-auto space-y-2 pr-2 custom-scrollbar">
      <div v-if="tasks.length === 0" class="text-center text-white/30 py-8 text-sm">
        {{ t('tasks.empty') }}
      </div>
      <div v-else>
        <div
          v-for="task in tasks"
          :key="task.id"
          :class="clsx(
            'group flex items-center gap-3 p-3 rounded-xl transition-all duration-300 border border-transparent',
            task.completed ? 'bg-white/5 opacity-60' : 'bg-white/10 hover:bg-white/15 hover:border-white/10'
          )"
        >
          <button
            @click="toggleTask(task.id)"
            :class="clsx(
              'flex-shrink-0 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors',
              task.completed ? 'bg-green-500 border-green-500 text-white' : 'border-white/40 text-transparent hover:border-white/60'
            )"
          >
            <Check :size="12" :stroke-width="4" />
          </button>

          <div class="flex-1 min-w-0">
            <div :class="clsx('text-sm text-white transition-all truncate', task.completed && 'line-through text-white/50')">
              {{ task.text }}
            </div>
            <div class="flex items-center gap-2 mt-1">
              <span :class="clsx('text-[10px] px-1.5 py-0.5 rounded border uppercase tracking-wider', getPriorityColor(task.priority || 'medium'))">
                {{ t(`priority.${task.priority || 'medium'}`) }}
              </span>
            </div>
          </div>

          <button
            @click="deleteTask(task.id)"
            class="opacity-0 group-hover:opacity-100 p-1.5 text-white/40 hover:text-rose-400 hover:bg-rose-400/10 rounded-lg transition-all"
          >
            <Trash2 :size="16" />
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
