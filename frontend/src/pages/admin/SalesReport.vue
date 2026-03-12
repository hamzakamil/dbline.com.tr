<script setup>
import { ref, reactive, computed, onMounted, watch } from 'vue'
import { useLanguage } from '../../composables/useLanguage'
import LineChart from '../../components/charts/LineChart.vue'
import BarChart from '../../components/charts/BarChart.vue'
import PieChart from '../../components/charts/PieChart.vue'
import OrdersTable from '../../components/admin/OrdersTable.vue'
import api from '../../utils/api'

const { formatPrice, locale, t } = useLanguage()

// Tarih aralığı
const periodPreset = ref('thisMonth')
const customFrom = ref('')
const customTo = ref('')
const granularity = ref('daily')
const loading = ref(true)

const dateRange = computed(() => {
  const now = new Date()
  let from, to

  if (periodPreset.value === 'custom' && customFrom.value && customTo.value) {
    return { from: customFrom.value, to: customTo.value }
  }

  to = now.toISOString().split('T')[0]

  switch (periodPreset.value) {
    case 'today':
      from = to
      break
    case 'thisWeek': {
      const d = new Date(now)
      d.setDate(d.getDate() - d.getDay() + 1) // Pazartesi
      from = d.toISOString().split('T')[0]
      break
    }
    case 'thisMonth': {
      const d = new Date(now.getFullYear(), now.getMonth(), 1)
      from = d.toISOString().split('T')[0]
      break
    }
    case 'last3Months': {
      const d = new Date(now)
      d.setMonth(d.getMonth() - 3)
      from = d.toISOString().split('T')[0]
      break
    }
    default:
      from = new Date(now.getTime() - 30 * 86400000).toISOString().split('T')[0]
  }
  return { from, to }
})

const periodParam = computed(() => {
  const map = { today: 'today', thisWeek: '7d', thisMonth: '30d', last3Months: '90d' }
  return map[periodPreset.value] || '30d'
})

// KPI veriler
const kpi = reactive({
  revenue: { value: 0, change: 0 },
  orders: { value: 0, change: 0 },
  avgOrder: { value: 0, change: 0 },
  refunds: { count: 0, amount: 0 },
  netRevenue: 0
})

// Grafik verileri
const trendData = reactive({ labels: [], revenue: [], orders: [] })
const statusDist = ref({})
const paymentDist = ref({})
const topProducts = ref([])
const cityRevenue = ref([])

// Verçekme
async function fetchData() {
  loading.value = true
  const q = periodPreset.value === 'custom' && customFrom.value && customTo.value
    ? `?from=${customFrom.value}&to=${customTo.value}`
    : `?period=${periodParam.value}`

  try {
    const [overviewRes, salesRes, productsRes, cityRes] = await Promise.all([
      api.get(`/analytics/overview${q}`),
      api.get(`/analytics/sales${q}&granularity=${granularity.value}`),
      api.get(`/analytics/products${q}`),
      api.get(`/analytics/city-revenue${q}`)
    ])

    // KPI
    Object.assign(kpi.revenue, overviewRes.data.revenue)
    Object.assign(kpi.orders, overviewRes.data.orders)
    Object.assign(kpi.avgOrder, overviewRes.data.avgOrder)

    // Sales
    const sd = salesRes.data
    trendData.labels = sd.trend.labels
    trendData.revenue = sd.trend.revenue
    trendData.orders = sd.trend.orders
    statusDist.value = sd.statusDistribution || {}
    paymentDist.value = sd.paymentDistribution || {}
    kpi.refunds = sd.refunds || { count: 0, amount: 0 }
    kpi.netRevenue = kpi.revenue.value - (kpi.refunds.amount || 0)

    // Ürünler
    topProducts.value = productsRes.data.topSelling || []

    // Şehirler
    cityRevenue.value = cityRes.data.cities || []
  } catch (error) {
    console.error('SalesReport fetch error:', error)
  } finally {
    loading.value = false
  }
}

// Grafik hesaplamaları
const trendChartLabels = computed(() => trendData.labels)
const trendChartDatasets = computed(() => [{
  label: t.value.salesReport.revenue,
  data: trendData.revenue,
  borderColor: '#CA9C53',
  backgroundColor: '#CA9C5320'
}])

const statusChartLabels = computed(() => {
  const keys = Object.keys(statusDist.value)
  return keys.map(k => t.value.salesReport[k] || k)
})
const statusChartData = computed(() => Object.values(statusDist.value))

const paymentChartLabels = computed(() => {
  const keys = Object.keys(paymentDist.value)
  return keys.map(k => t.value.salesReport[k] || k)
})
const paymentChartData = computed(() => Object.values(paymentDist.value))

const topProductLabels = computed(() => topProducts.value.slice(0, 8).map(p => {
  const name = p.name?.tr || p.name?.en || p.name || '-'
  return name.length > 20 ? name.substring(0, 20) + '...' : name
}))
const topProductDatasets = computed(() => [{
  label: locale.value === 'tr' ? 'Satış Adedi' : 'Qty Sold',
  data: topProducts.value.slice(0, 8).map(p => p.totalQty),
  backgroundColor: '#CA9C53',
  borderColor: '#A67D3D'
}])

const cityLabels = computed(() => cityRevenue.value.slice(0, 10).map(c => c._id || '-'))
const cityDatasets = computed(() => [{
  label: t.value.salesReport.cityRevenue,
  data: cityRevenue.value.slice(0, 10).map(c => c.revenue),
  backgroundColor: '#242833',
  borderColor: '#121212'
}])

// Excel export
async function exportExcel() {
  try {
    const q = periodPreset.value === 'custom' && customFrom.value && customTo.value
      ? `?from=${customFrom.value}&to=${customTo.value}`
      : `?period=${periodParam.value}`
    const response = await api.get(`/analytics/export/sales${q}`, { responseType: 'blob' })
    const url = window.URL.createObjectURL(new Blob([response.data]))
    const a = document.createElement('a')
    a.href = url
    a.download = `sales-report-${new Date().toISOString().split('T')[0]}.xlsx`
    a.click()
    window.URL.revokeObjectURL(url)
  } catch (error) {
    console.error('Excel export error:', error)
  }
}

// KPI ikon ve renk
function changeColor(val) {
  return val > 0 ? 'text-green-600' : val < 0 ? 'text-red-600' : 'text-gray-400'
}
function changeArrow(val) {
  return val > 0 ? '↑' : val < 0 ? '↓' : '→'
}

watch([periodPreset, granularity], fetchData)
watch([customFrom, customTo], () => {
  if (periodPreset.value === 'custom' && customFrom.value && customTo.value) fetchData()
})

onMounted(fetchData)
</script>

<template>
  <div class="min-h-screen bg-gray-50">
    <!-- Header -->
    <div class="bg-dark-bg text-white">
      <div class="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
        <h1 class="text-lg font-heading">{{ t.salesReport.title }}</h1>
        <router-link to="/" class="text-xs underline opacity-70 hover:opacity-100">{{ locale === 'tr' ? 'Siteye Dön' : 'Back to Site' }}</router-link>
      </div>
    </div>

    <div class="max-w-7xl mx-auto px-4 py-8">
      <!-- Nav -->
      <nav class="flex flex-wrap gap-2 mb-8">
        <router-link to="/admin" class="px-4 py-2 bg-white border text-sm hover:bg-gray-50">Dashboard</router-link>
        <router-link to="/admin/products" class="px-4 py-2 bg-white border text-sm hover:bg-gray-50">{{ locale === 'tr' ? 'Ürünler' : 'Products' }}</router-link>
        <router-link to="/admin/categories" class="px-4 py-2 bg-white border text-sm hover:bg-gray-50">{{ locale === 'tr' ? 'Kategoriler' : 'Categories' }}</router-link>
        <router-link to="/admin/orders" class="px-4 py-2 bg-white border text-sm hover:bg-gray-50">{{ locale === 'tr' ? 'Siparişler' : 'Orders' }}</router-link>
        <router-link to="/admin/sales-report" class="px-4 py-2 bg-accent text-white text-sm">{{ locale === 'tr' ? 'Satış Raporu' : 'Sales Report' }}</router-link>
        <router-link to="/admin/analytics" class="px-4 py-2 bg-white border text-sm hover:bg-gray-50">{{ locale === 'tr' ? 'Analitik' : 'Analytics' }}</router-link>
        <router-link to="/admin/marketing" class="px-4 py-2 bg-white border text-sm hover:bg-gray-50">{{ locale === 'tr' ? 'Pazarlama' : 'Marketing' }}</router-link>
        <router-link to="/admin/reviews" class="px-4 py-2 bg-white border text-sm hover:bg-gray-50">{{ locale === 'tr' ? 'Yorumlar' : 'Reviews' }}</router-link>
        <router-link to="/admin/settings" class="px-4 py-2 bg-white border text-sm hover:bg-gray-50">{{ locale === 'tr' ? 'Ayarlar' : 'Settings' }}</router-link>
      </nav>

      <!-- Tarih + Export -->
      <div class="flex flex-wrap items-center gap-3 mb-6">
        <div class="flex bg-white border border-gray-200 rounded-lg overflow-hidden">
          <button
            v-for="p in ['today', 'thisWeek', 'thisMonth', 'last3Months', 'custom']"
            :key="p"
            @click="periodPreset = p"
            :class="[
              'px-3 py-2 text-xs font-medium transition-colors border-r last:border-r-0',
              periodPreset === p ? 'bg-accent text-white' : 'text-gray-600 hover:bg-gray-50'
            ]"
          >
            {{ t.salesReport[p] }}
          </button>
        </div>

        <div v-if="periodPreset === 'custom'" class="flex items-center gap-2">
          <input type="date" v-model="customFrom" class="border border-gray-200 rounded-lg px-3 py-2 text-xs" />
          <span class="text-gray-400">-</span>
          <input type="date" v-model="customTo" class="border border-gray-200 rounded-lg px-3 py-2 text-xs" />
        </div>

        <div class="ml-auto flex items-center gap-3">
          <!-- Granularity -->
          <div class="flex bg-white border border-gray-200 rounded-lg overflow-hidden">
            <button
              v-for="g in ['daily', 'weekly', 'monthly']"
              :key="g"
              @click="granularity = g"
              :class="[
                'px-3 py-2 text-xs font-medium transition-colors border-r last:border-r-0',
                granularity === g ? 'bg-gray-800 text-white' : 'text-gray-500 hover:bg-gray-50'
              ]"
            >
              {{ t.salesReport[g] }}
            </button>
          </div>

          <button @click="exportExcel" class="flex items-center gap-2 px-4 py-2 bg-green-600 text-white text-xs font-medium rounded-lg hover:bg-green-700 transition-colors">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            {{ t.salesReport.exportExcel }}
          </button>
        </div>
      </div>

      <!-- Loading -->
      <div v-if="loading" class="text-center py-20">
        <div class="w-10 h-10 border-2 border-accent border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
        <p class="text-sm text-gray-400">{{ t.common.loading }}</p>
      </div>

      <template v-else>
        <!-- KPI Kartları -->
        <div class="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
          <!-- Toplam Gelir -->
          <div class="bg-white border border-gray-200 rounded-xl p-5">
            <div class="flex items-center justify-between mb-2">
              <p class="text-xs font-medium text-gray-500 uppercase tracking-wider">{{ t.salesReport.revenue }}</p>
              <span :class="changeColor(kpi.revenue.change)" class="text-xs font-semibold">
                {{ changeArrow(kpi.revenue.change) }} {{ Math.abs(kpi.revenue.change) }}%
              </span>
            </div>
            <p class="text-2xl font-bold text-gray-800">{{ formatPrice(kpi.revenue.value) }}</p>
          </div>

          <!-- Sipariş Sayısı -->
          <div class="bg-white border border-gray-200 rounded-xl p-5">
            <div class="flex items-center justify-between mb-2">
              <p class="text-xs font-medium text-gray-500 uppercase tracking-wider">{{ t.salesReport.orders }}</p>
              <span :class="changeColor(kpi.orders.change)" class="text-xs font-semibold">
                {{ changeArrow(kpi.orders.change) }} {{ Math.abs(kpi.orders.change) }}%
              </span>
            </div>
            <p class="text-2xl font-bold text-gray-800">{{ kpi.orders.value }}</p>
          </div>

          <!-- Ort. Sipariş -->
          <div class="bg-white border border-gray-200 rounded-xl p-5">
            <div class="flex items-center justify-between mb-2">
              <p class="text-xs font-medium text-gray-500 uppercase tracking-wider">{{ t.salesReport.avgOrder }}</p>
              <span :class="changeColor(kpi.avgOrder.change)" class="text-xs font-semibold">
                {{ changeArrow(kpi.avgOrder.change) }} {{ Math.abs(kpi.avgOrder.change) }}%
              </span>
            </div>
            <p class="text-2xl font-bold text-gray-800">{{ formatPrice(kpi.avgOrder.value) }}</p>
          </div>

          <!-- İadeler -->
          <div class="bg-white border border-gray-200 rounded-xl p-5">
            <p class="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">{{ t.salesReport.refunds }}</p>
            <p class="text-2xl font-bold text-red-600">{{ formatPrice(kpi.refunds.amount) }}</p>
            <p class="text-xs text-gray-400 mt-1">{{ kpi.refunds.count }} {{ locale === 'tr' ? 'adet' : 'items' }}</p>
          </div>

          <!-- Net Gelir -->
          <div class="bg-white border border-gray-200 rounded-xl p-5">
            <p class="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">{{ t.salesReport.netRevenue }}</p>
            <p class="text-2xl font-bold text-green-700">{{ formatPrice(kpi.netRevenue) }}</p>
          </div>
        </div>

        <!-- Gelir Trend Grafiği -->
        <div class="bg-white border border-gray-200 rounded-xl p-6 mb-8">
          <h3 class="text-sm font-semibold text-gray-700 mb-4">{{ t.salesReport.revenueTrend }}</h3>
          <LineChart
            v-if="trendChartLabels.length"
            :labels="trendChartLabels"
            :datasets="trendChartDatasets"
            :height="320"
          />
          <p v-else class="text-center text-sm text-gray-400 py-12">{{ t.salesReport.noData }}</p>
        </div>

        <!-- 2'li grafik satırı: Sipariş Durumu + Ödeme Durumu -->
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div class="bg-white border border-gray-200 rounded-xl p-6">
            <h3 class="text-sm font-semibold text-gray-700 mb-4">{{ t.salesReport.orderStatus }}</h3>
            <PieChart
              v-if="statusChartData.length"
              :labels="statusChartLabels"
              :data="statusChartData"
              :height="280"
            />
            <p v-else class="text-center text-sm text-gray-400 py-12">{{ t.salesReport.noData }}</p>
          </div>
          <div class="bg-white border border-gray-200 rounded-xl p-6">
            <h3 class="text-sm font-semibold text-gray-700 mb-4">{{ t.salesReport.paymentStatus }}</h3>
            <PieChart
              v-if="paymentChartData.length"
              :labels="paymentChartLabels"
              :data="paymentChartData"
              :colors="['#22c55e', '#eab308', '#ef4444', '#6b7280', '#3b82f6']"
              :height="280"
            />
            <p v-else class="text-center text-sm text-gray-400 py-12">{{ t.salesReport.noData }}</p>
          </div>
        </div>

        <!-- 2'li grafik satırı: En Çok Satan + Şehir Geliri -->
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div class="bg-white border border-gray-200 rounded-xl p-6">
            <h3 class="text-sm font-semibold text-gray-700 mb-4">{{ t.salesReport.topProducts }}</h3>
            <BarChart
              v-if="topProductLabels.length"
              :labels="topProductLabels"
              :datasets="topProductDatasets"
              :height="300"
              :horizontal="true"
            />
            <p v-else class="text-center text-sm text-gray-400 py-12">{{ t.salesReport.noData }}</p>
          </div>
          <div class="bg-white border border-gray-200 rounded-xl p-6">
            <h3 class="text-sm font-semibold text-gray-700 mb-4">{{ t.salesReport.cityRevenue }}</h3>
            <BarChart
              v-if="cityLabels.length"
              :labels="cityLabels"
              :datasets="cityDatasets"
              :height="300"
            />
            <p v-else class="text-center text-sm text-gray-400 py-12">{{ t.salesReport.noData }}</p>
          </div>
        </div>

        <!-- Sipariş Tablosu -->
        <div class="bg-white border border-gray-200 rounded-xl p-6">
          <h3 class="text-sm font-semibold text-gray-700 mb-4">{{ locale === 'tr' ? 'Siparişler' : 'Orders' }}</h3>
          <OrdersTable :date-from="dateRange.from" :date-to="dateRange.to" />
        </div>
      </template>
    </div>
  </div>
</template>
