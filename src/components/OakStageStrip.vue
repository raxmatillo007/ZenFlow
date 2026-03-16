<script setup>
import { computed } from 'vue';
import { clsx } from 'clsx';

const props = defineProps({
  currentStageKey: String,
  compact: {
    type: Boolean,
    default: false
  }
});

const STAGES = [
  { key: 'oak.stage.soil', label: 'Yer bosqichi' },
  { key: 'oak.stage.seed', label: "Urug'" },
  { key: 'oak.stage.sprout', label: 'Nihol' },
  { key: 'oak.stage.sapling', label: "Ko'chat" },
  { key: 'oak.stage.young', label: 'Yosh eman' }
];

const normalizeStageKey = (key) => {
  if (key === 'oak.stage.strong' || key === 'oak.stage.big' || key === 'oak.stage.ancient' || key === 'oak.stage.legend') {
    return 'oak.stage.young';
  }
  return key || 'oak.stage.soil';
};

const activeIndex = computed(() => {
  const normalized = normalizeStageKey(props.currentStageKey);
  const index = STAGES.findIndex((stage) => stage.key === normalized);
  return index >= 0 ? index : 0;
});
</script>

<template>
  <div :class="clsx('oak-progress', compact && 'oak-progress--compact')">
    <div class="oak-progress__track" />
    <div
      class="oak-progress__track oak-progress__track--active"
      :style="{ width: `${(activeIndex / (STAGES.length - 1)) * 100}%` }"
    />

    <div
      v-for="(stage, index) in STAGES"
      :key="stage.key"
      :class="clsx(
        'oak-progress__step',
        index === activeIndex && 'is-active',
        index < activeIndex && 'is-done'
      )"
    >
      <div class="oak-progress__circle">
        <svg
          v-if="stage.key === 'oak.stage.soil'"
          viewBox="0 0 100 100"
          class="oak-progress__art"
          fill="none"
        >
          <ellipse cx="50" cy="79" rx="32" ry="10" fill="#173C5A" opacity="0.32" />
          <path d="M18 72C26 62 38 58 50 58C62 58 74 62 82 72V76H18V72Z" fill="#E7E0BF" opacity="0.9" />
          <ellipse cx="50" cy="72" rx="24" ry="8" fill="#5A4A40" />
          <ellipse cx="36" cy="72" rx="5" ry="3" fill="#6F5A50" />
          <ellipse cx="65" cy="73" rx="5" ry="3" fill="#6F5A50" />
          <path d="M50 44C40 44 33 52 33 62C33 72 40 79 50 79C60 79 67 72 67 62C67 52 60 44 50 44Z" fill="#DC7C1F" />
          <path d="M52 45C58 46 62 51 63 57C58 58 53 54 52 45Z" fill="#FFD296" opacity="0.85" />
        </svg>

        <svg
          v-else-if="stage.key === 'oak.stage.seed'"
          viewBox="0 0 100 100"
          class="oak-progress__art"
          fill="none"
        >
          <ellipse cx="50" cy="81" rx="28" ry="8" fill="#173C5A" opacity="0.32" />
          <ellipse cx="50" cy="76" rx="18" ry="5" fill="#1F5C71" opacity="0.35" />
          <path d="M48 30C38 34 31 46 34 59C37 73 48 82 59 78C69 74 74 61 71 48C68 36 57 28 48 30Z" fill="#D9A864" />
          <path d="M54 31C50 38 48 47 49 76" stroke="#67411C" stroke-width="4.5" stroke-linecap="round" stroke-dasharray="5 5" />
          <path d="M46 29C53 28 58 31 61 36" stroke="#F8E4B3" stroke-width="4" stroke-linecap="round" opacity="0.7" />
        </svg>

        <svg
          v-else-if="stage.key === 'oak.stage.sprout'"
          viewBox="0 0 100 100"
          class="oak-progress__art"
          fill="none"
        >
          <ellipse cx="50" cy="81" rx="28" ry="8" fill="#173C5A" opacity="0.32" />
          <ellipse cx="50" cy="75" rx="17" ry="5" fill="#8B4F1D" />
          <rect x="47" y="42" width="6" height="28" rx="3" fill="#88C84D" />
          <path d="M49 42C35 31 22 33 21 45C34 47 44 46 49 42Z" fill="#70D75F" />
          <path d="M51 42C65 31 78 33 79 45C66 47 56 46 51 42Z" fill="#5FCB53" />
        </svg>

        <svg
          v-else-if="stage.key === 'oak.stage.sapling'"
          viewBox="0 0 100 100"
          class="oak-progress__art"
          fill="none"
        >
          <ellipse cx="50" cy="82" rx="30" ry="8" fill="#173C5A" opacity="0.32" />
          <path d="M43 79C45 72 47 66 47 58C47 48 44 41 43 34H57C56 41 53 48 53 58C53 66 55 72 57 79H43Z" fill="#995726" />
          <path d="M49 53C41 46 34 39 30 31" stroke="#995726" stroke-width="4" stroke-linecap="round" />
          <path d="M51 50C60 43 67 37 71 28" stroke="#995726" stroke-width="4" stroke-linecap="round" />
          <circle cx="50" cy="34" r="13" fill="#67D758" />
          <circle cx="38" cy="39" r="9" fill="#4FCC4F" />
          <circle cx="63" cy="39" r="9" fill="#4FCC4F" />
          <circle cx="49" cy="47" r="11" fill="#36B643" />
        </svg>

        <svg
          v-else
          viewBox="0 0 100 100"
          class="oak-progress__art oak-progress__art--oak"
          fill="none"
        >
          <ellipse cx="50" cy="83" rx="32" ry="9" fill="#173C5A" opacity="0.34" />
          <path d="M40 82C43 73 45 65 45 54C45 43 42 33 40 25H60C58 33 55 43 55 54C55 65 57 73 60 82H40Z" fill="#9C5A28" />
          <path d="M48 57C37 49 27 40 20 28" stroke="#9C5A28" stroke-width="5" stroke-linecap="round" />
          <path d="M52 54C64 46 74 36 81 24" stroke="#9C5A28" stroke-width="5" stroke-linecap="round" />
          <circle cx="50" cy="26" r="17" fill="#7CE160" />
          <circle cx="34" cy="29" r="13" fill="#6AD755" />
          <circle cx="66" cy="29" r="13" fill="#6AD755" />
          <circle cx="22" cy="40" r="11" fill="#58CB4C" />
          <circle cx="78" cy="40" r="11" fill="#58CB4C" />
          <circle cx="36" cy="46" r="12" fill="#44BE45" />
          <circle cx="64" cy="46" r="12" fill="#44BE45" />
          <circle cx="50" cy="53" r="15" fill="#33B240" />
        </svg>
      </div>

      <p class="oak-progress__label">{{ stage.label }}</p>
    </div>
  </div>
</template>

<style scoped>
.oak-progress {
  position: relative;
  display: flex;
  align-items: flex-start;
  justify-content: flex-start;
  gap: 10px;
  padding: 20px 16px 34px;
  background: linear-gradient(180deg, #14203a 0%, #0b1630 100%);
  border: 1px solid rgba(103, 232, 249, 0.12);
  border-radius: 20px;
  overflow-x: auto;
}

.oak-progress--compact {
  padding: 16px 10px 28px;
}

.oak-progress__track {
  position: absolute;
  left: 54px;
  right: 54px;
  top: 57px;
  height: 4px;
  background: #34495e;
  border-radius: 999px;
}

.oak-progress__track--active {
  right: auto;
  background: linear-gradient(90deg, #34d399, #67e8f9);
  box-shadow: 0 0 14px rgba(52, 211, 153, 0.45);
}

.oak-progress--compact .oak-progress__track {
  left: 44px;
  right: 44px;
  top: 51px;
}

.oak-progress__step {
  position: relative;
  z-index: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 96px;
  flex: 0 0 96px;
}

.oak-progress--compact .oak-progress__step {
  width: 82px;
  flex-basis: 82px;
}

.oak-progress__circle {
  width: 76px;
  height: 76px;
  border-radius: 999px;
  background: radial-gradient(circle at 30% 25%, rgba(31, 107, 87, 0.3), rgba(18, 32, 58, 0.95));
  border: 1px solid rgba(103, 232, 249, 0.18);
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 0 0 6px rgba(103, 232, 249, 0.05), 0 8px 18px rgba(2, 6, 23, 0.35);
  transition: transform 0.25s ease, box-shadow 0.25s ease, border-color 0.25s ease;
}

.oak-progress--compact .oak-progress__circle {
  width: 64px;
  height: 64px;
}

.oak-progress__step:hover .oak-progress__circle {
  transform: translateY(-2px) scale(1.03);
}

.oak-progress__step.is-active .oak-progress__circle {
  border-color: rgba(110, 231, 183, 0.65);
  box-shadow: 0 0 0 8px rgba(52, 211, 153, 0.08), 0 0 24px rgba(52, 211, 153, 0.35);
  transform: scale(1.08);
}

.oak-progress__step.is-done .oak-progress__circle {
  border-color: rgba(110, 231, 183, 0.35);
}

.oak-progress__art {
  width: 54px;
  height: 54px;
}

.oak-progress--compact .oak-progress__art {
  width: 44px;
  height: 44px;
}

.oak-progress__label {
  margin-top: 10px;
  color: #cbd5e1;
  font-size: 13px;
  line-height: 1.2;
  font-weight: 600;
  text-align: center;
}

.oak-progress--compact .oak-progress__label {
  font-size: 11px;
}

.oak-progress__step.is-active .oak-progress__label {
  color: #d1fae5;
}

@media (max-width: 768px) {
  .oak-progress {
    padding-inline: 12px;
  }
}
</style>
