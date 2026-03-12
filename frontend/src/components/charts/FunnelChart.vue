<script setup>
import { computed } from 'vue'

const props = defineProps({
  steps: {
    type: Array,
    default: () => []
    // [{ label: 'Toplam', value: 100, color: '#CA9C53' }, ...]
  }
})

const maxValue = computed(() => props.steps.length > 0 ? props.steps[0].value : 1)

const stepsWithPct = computed(() =>
  props.steps.map((step, i) => ({
    ...step,
    pct: maxValue.value > 0 ? ((step.value / maxValue.value) * 100).toFixed(1) : 0,
    dropPct: i > 0 && props.steps[i - 1].value > 0
      ? (((props.steps[i - 1].value - step.value) / props.steps[i - 1].value) * 100).toFixed(1)
      : null,
    widthPct: maxValue.value > 0 ? Math.max((step.value / maxValue.value) * 100, 8) : 8
  }))
)

const defaultColors = ['#CA9C53', '#A67D3D', '#C9A196', '#6B5858', '#242833', '#B08878']
</script>

<template>
  <div class="space-y-2">
    <div
      v-for="(step, i) in stepsWithPct"
      :key="i"
      class="flex items-center gap-3"
    >
      <div class="w-28 text-right text-xs text-gray-600 shrink-0">{{ step.label }}</div>
      <div class="flex-1 relative">
        <div
          class="h-9 flex items-center px-3 transition-all duration-500"
          :style="{
            width: step.widthPct + '%',
            backgroundColor: step.color || defaultColors[i % defaultColors.length],
            borderRadius: '4px'
          }"
        >
          <span class="text-white text-xs font-medium whitespace-nowrap">
            {{ step.value }} ({{ step.pct }}%)
          </span>
        </div>
      </div>
      <div class="w-20 text-xs shrink-0">
        <span v-if="step.dropPct !== null" class="text-red-500">-{{ step.dropPct }}%</span>
        <span v-else class="text-gray-400">-</span>
      </div>
    </div>
  </div>
</template>
