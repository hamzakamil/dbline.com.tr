<script setup>
import { computed } from 'vue'
import { Line } from 'vue-chartjs'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js'

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler)

const props = defineProps({
  labels: { type: Array, default: () => [] },
  datasets: { type: Array, default: () => [] },
  height: { type: Number, default: 300 },
  title: { type: String, default: '' }
})

const chartData = computed(() => ({
  labels: props.labels,
  datasets: props.datasets.map(ds => ({
    fill: true,
    tension: 0.4,
    pointRadius: 3,
    pointHoverRadius: 6,
    borderWidth: 2,
    ...ds
  }))
}))

const chartOptions = computed(() => ({
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: { display: props.datasets.length > 1 },
    title: { display: !!props.title, text: props.title, font: { size: 14 } },
    tooltip: { mode: 'index', intersect: false }
  },
  scales: {
    y: { beginAtZero: true, grid: { color: '#f0f0f0' } },
    x: { grid: { display: false } }
  }
}))
</script>

<template>
  <div :style="{ height: height + 'px' }">
    <Line :data="chartData" :options="chartOptions" />
  </div>
</template>
