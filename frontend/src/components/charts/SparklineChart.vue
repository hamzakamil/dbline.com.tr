<script setup>
import { computed } from 'vue'
import { Line } from 'vue-chartjs'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Filler
} from 'chart.js'

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Filler)

const props = defineProps({
  data: { type: Array, default: () => [] },
  color: { type: String, default: '#CA9C53' },
  height: { type: Number, default: 40 },
  fill: { type: Boolean, default: true }
})

const chartData = computed(() => ({
  labels: props.data.map((_, i) => i),
  datasets: [{
    data: props.data,
    borderColor: props.color,
    backgroundColor: props.fill ? props.color + '20' : 'transparent',
    fill: props.fill,
    tension: 0.4,
    borderWidth: 2,
    pointRadius: 0,
    pointHoverRadius: 0
  }]
}))

const chartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: { legend: { display: false }, tooltip: { enabled: false } },
  scales: {
    x: { display: false },
    y: { display: false }
  },
  elements: { line: { borderWidth: 2 } }
}
</script>

<template>
  <div :style="{ height: height + 'px' }">
    <Line :data="chartData" :options="chartOptions" />
  </div>
</template>
