<script setup>
import { computed } from 'vue';
import { clsx } from 'clsx';

const props = defineProps({
  level: Number
});

const lvl = computed(() => Math.max(0, Number(props.level) || 0));
const stage = computed(() => {
  if (lvl.value < 1) return 'soil';
  if (lvl.value < 5) return 'seed';
  if (lvl.value < 13) return 'sprout';
  return 'tree';
});

const trunkHeight = computed(() => {
  if (lvl.value < 5) return 16;
  if (lvl.value < 13) return 22;
  if (lvl.value < 36) return 28;
  return 34;
});

const canopyScale = computed(() => {
  if (lvl.value < 3) return 0.28;
  if (lvl.value < 5) return 0.35;
  if (lvl.value < 8) return 0.5;
  if (lvl.value < 13) return 0.65;
  if (lvl.value < 21) return 0.8;
  if (lvl.value < 36) return 0.95;
  if (lvl.value < 61) return 1.1;
  return 1.25;
});

const branchOpacity = computed(() => (lvl.value >= 8 ? 1 : 0));
const leafOpacity = computed(() => (lvl.value >= 13 ? 1 : 0));
const canopyVariant = computed(() => {
  if (lvl.value < 13) return 'sprout';
  if (lvl.value < 21) return 'young';
  if (lvl.value < 36) return 'strong';
  if (lvl.value < 61) return 'big';
  return 'legend';
});

const canopyNodes = computed(() => {
  if (canopyVariant.value === 'young') {
    return [
      { x: 50, y: 36, r: 14, fill: '#2dd4bf' },
      { x: 38, y: 42, r: 11, fill: '#22c55e' },
      { x: 62, y: 42, r: 11, fill: '#22c55e' },
      { x: 50, y: 49, r: 13, fill: '#16a34a' }
    ];
  }
  if (canopyVariant.value === 'strong') {
    return [
      { x: 50, y: 30, r: 14, fill: '#4ade80' },
      { x: 35, y: 35, r: 12, fill: '#22c55e' },
      { x: 65, y: 35, r: 12, fill: '#22c55e' },
      { x: 27, y: 46, r: 11, fill: '#16a34a' },
      { x: 73, y: 46, r: 11, fill: '#16a34a' },
      { x: 41, y: 49, r: 13, fill: '#15803d' },
      { x: 59, y: 49, r: 13, fill: '#15803d' },
      { x: 50, y: 56, r: 14, fill: '#166534' }
    ];
  }
  if (canopyVariant.value === 'big') {
    return [
      { x: 50, y: 26, r: 16, fill: '#86efac' },
      { x: 34, y: 31, r: 13, fill: '#4ade80' },
      { x: 66, y: 31, r: 13, fill: '#4ade80' },
      { x: 22, y: 42, r: 12, fill: '#22c55e' },
      { x: 50, y: 40, r: 16, fill: '#22c55e' },
      { x: 78, y: 42, r: 12, fill: '#22c55e' },
      { x: 31, y: 54, r: 13, fill: '#16a34a' },
      { x: 50, y: 56, r: 17, fill: '#15803d' },
      { x: 69, y: 54, r: 13, fill: '#16a34a' }
    ];
  }
  return [
    { x: 50, y: 24, r: 17, fill: '#dcfce7' },
    { x: 34, y: 28, r: 14, fill: '#86efac' },
    { x: 66, y: 28, r: 14, fill: '#86efac' },
    { x: 20, y: 40, r: 13, fill: '#4ade80' },
    { x: 38, y: 40, r: 15, fill: '#22c55e' },
    { x: 62, y: 40, r: 15, fill: '#22c55e' },
    { x: 80, y: 40, r: 13, fill: '#4ade80' },
    { x: 28, y: 56, r: 14, fill: '#16a34a' },
    { x: 50, y: 57, r: 18, fill: '#15803d' },
    { x: 72, y: 56, r: 14, fill: '#16a34a' }
  ];
});
</script>

<template>
  <div class="relative w-24 h-24 rounded-full bg-gradient-to-b from-emerald-500/20 to-lime-700/10 border border-emerald-300/30 flex items-center justify-center overflow-hidden">
    <svg viewBox="0 0 100 100" class="w-20 h-20">
      <ellipse cx="50" cy="92" rx="24" ry="6" fill="rgba(16,185,129,0.25)" />

      <g v-if="stage === 'soil'">
        <ellipse cx="50" cy="80" rx="18" ry="6" fill="#14532d" opacity="0.65" />
        <ellipse cx="50" cy="77" rx="13" ry="4" fill="#166534" opacity="0.85" />
        <path d="M50 61 C43 61, 38 67, 38 73 C38 79, 43 84, 50 84 C57 84, 62 79, 62 73 C62 67, 57 61, 50 61 Z" fill="#92400e" />
        <path d="M50 61 C54 61, 58 64, 59 69 C55 70, 51 68, 50 61 Z" fill="#d97706" />
        <path d="M50 64 C46 64, 43 67, 43 72 C43 76, 46 79, 50 79 C54 79, 57 76, 57 72 C57 67, 54 64, 50 64 Z" fill="#b45309" />
      </g>

      <g v-else-if="stage === 'seed'">
        <ellipse cx="50" cy="78" rx="18" ry="7" fill="#6b4423" />
        <rect
          x="45"
          :y="82 - trunkHeight"
          width="10"
          :height="trunkHeight"
          rx="3"
          fill="#8b5a2b"
        />
        <path d="M50 58 C44 51, 37 52, 35 60 C42 61, 48 62, 50 58 Z" fill="#4ade80" />
        <path d="M50 58 C56 51, 63 52, 65 60 C58 61, 52 62, 50 58 Z" fill="#22c55e" />
      </g>

      <g v-else>
        <rect
          x="43"
          :y="82 - trunkHeight"
          width="14"
          :height="trunkHeight"
          rx="4"
          fill="#7a4b26"
        />
        <path
          v-if="lvl >= 21"
          d="M50 61 C46 56 45 52 46 46 C49 49 50 53 50 61 Z"
          fill="#6b3f1d"
          opacity="0.65"
        />
      </g>

      <g v-if="stage === 'tree'" :style="{ opacity: branchOpacity }">
        <path d="M49 60 C40 55 30 49 22 40" stroke="#7a4b26" stroke-width="4.4" stroke-linecap="round" fill="none" />
        <path d="M51 58 C62 52 71 45 79 35" stroke="#7a4b26" stroke-width="4.4" stroke-linecap="round" fill="none" />
        <path v-if="lvl >= 21" d="M48 49 C39 43 31 35 27 26" stroke="#7a4b26" stroke-width="3.3" stroke-linecap="round" fill="none" />
        <path v-if="lvl >= 21" d="M52 46 C62 39 70 31 75 21" stroke="#7a4b26" stroke-width="3.3" stroke-linecap="round" fill="none" />
        <path v-if="lvl >= 36" d="M50 43 C46 34 45 26 47 17" stroke="#7a4b26" stroke-width="3" stroke-linecap="round" fill="none" />
      </g>

      <g v-if="stage === 'tree'" :transform="`translate(50 45) scale(${canopyScale}) translate(-50 -45)`">
        <circle
          v-for="(node, index) in canopyNodes"
          :key="`${canopyVariant}-${index}`"
          :cx="node.x"
          :cy="node.y"
          :r="node.r"
          :fill="node.fill"
        />
      </g>

      <g v-if="stage === 'tree'" :style="{ opacity: leafOpacity }">
        <circle cx="28" cy="42" r="2.2" fill="#bbf7d0" />
        <circle cx="71" cy="38" r="2.2" fill="#bbf7d0" />
        <circle cx="56" cy="28" r="2.2" fill="#bbf7d0" />
        <circle v-if="lvl >= 36" cx="39" cy="31" r="2" fill="#dcfce7" />
        <circle v-if="lvl >= 36" cx="64" cy="31" r="2" fill="#dcfce7" />
      </g>
    </svg>

    <div :class="clsx('absolute inset-0 pointer-events-none', lvl > 40 && 'animate-pulse')"></div>
  </div>
</template>
