<script setup>
import { computed } from 'vue'
import { Bar } from 'vue-chartjs'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js'

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend)

const props = defineProps({
  labels: { type: Array, default: () => [] },
  datasets: { type: Array, default: () => [] },
  height: { type: Number, default: 300 },
  horizontal: { type: Boolean, default: false },
  title: { type: String, default: '' }
})

const chartData = computed(() => ({
  labels: props.labels,
  datasets: props.datasets.map(ds => ({
    borderWidth: 1,
    borderRadius: 4,
    ...ds
  }))
}))

const chartOptions = computed(() => ({
  responsive: true,
  maintainAspectRatio: false,
  indexAxis: props.horizontal ? 'y' : 'x',
  plugins: {
    legend: { display: props.datasets.length > 1 },
    title: { display: !!props.title, text: props.title, font: { size: 14 } }
  },
  scales: {
    y: { beginAtZero: true, grid: { color: '#f0f0f0' } },
    x: { grid: { display: false } }
  }
}))
</script>

<template>
  <div :style="{ height: height + 'px' }">
    <Bar :data="chartData" :options="chartOptions" />
  </div>
</template>
