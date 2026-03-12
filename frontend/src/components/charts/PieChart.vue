<script setup>
import { computed } from 'vue'
import { Doughnut } from 'vue-chartjs'
import {
  Chart as ChartJS,
  ArcElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js'

ChartJS.register(ArcElement, Title, Tooltip, Legend)

const props = defineProps({
  labels: { type: Array, default: () => [] },
  data: { type: Array, default: () => [] },
  colors: { type: Array, default: () => ['#CA9C53', '#121212', '#6B5858', '#C9A196', '#A67D3D', '#E8D5B0', '#242833', '#B08878'] },
  height: { type: Number, default: 280 },
  title: { type: String, default: '' }
})

const chartData = computed(() => ({
  labels: props.labels,
  datasets: [{
    data: props.data,
    backgroundColor: props.colors.slice(0, props.data.length),
    borderWidth: 2,
    borderColor: '#ffffff',
    hoverOffset: 8
  }]
}))

const chartOptions = computed(() => ({
  responsive: true,
  maintainAspectRatio: false,
  cutout: '55%',
  plugins: {
    legend: { position: 'bottom', labels: { padding: 16, usePointStyle: true, pointStyle: 'circle' } },
    title: { display: !!props.title, text: props.title, font: { size: 14 } },
    tooltip: {
      callbacks: {
        label: (ctx) => {
          const total = ctx.dataset.data.reduce((a, b) => a + b, 0)
          const pct = total > 0 ? ((ctx.raw / total) * 100).toFixed(1) : 0
          return `${ctx.label}: ${ctx.raw} (${pct}%)`
        }
      }
    }
  }
}))
</script>

<template>
  <div :style="{ height: height + 'px' }">
    <Doughnut :data="chartData" :options="chartOptions" />
  </div>
</template>
