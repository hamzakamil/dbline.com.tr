<script setup>
import { ref, reactive, computed, onMounted, watch } from 'vue'
import { useLanguage } from '../../composables/useLanguage'
import LineChart from '../../components/charts/LineChart.vue'
import BarChart from '../../components/charts/BarChart.vue'
import PieChart from '../../components/charts/PieChart.vue'
import FunnelChart from '../../components/charts/FunnelChart.vue'
import api from '../../utils/api'

const { formatPrice, locale } = useLanguage()

const token = localStorage.getItem('token')
const headers = { Authorization: `Bearer ${token}` }

// Tarih filtresi
const period = ref('30d')
const customFrom = ref('')
const customTo = ref('')
const loading = ref(true)

const dateParams = computed(() => {
  if (period.value === 'custom' && customFrom.value && customTo.value) {
    return `?from=${customFrom.value}&to=${customTo.value}`
  }
  return `?period=${period.value}`
})

// Data
const overview = reactive({ revenue: 0, orders: 0, avgOrder: 0, newCustomers: 0, prevRevenue: 0, prevOrders: 0, prevAvgOrder: 0, prevNewCustomers: 0 })
const sales = reactive({ daily: [], statusDist: [], paymentDist: [] })
const funnel = reactive({ steps: [] })
const products = reactive({ topSelling: [], leastSelling: [], categoryDist: [], stockVelocity: [], stockAging: [] })
const affinity = ref([])
const customers = reactive({ cityDist: [], topLTV: [], newTrend: [], repeatRate: 0, avgOrders: 0 })
const basket = reactive({ avgItems: 0, avgAmount: 0 })
const reviewsSummary = reactive({ total: 0, approved: 0, pending: 0, rejected: 0, avgRating: 0, photoRate: 0, ratingTrend: [], topReviewed: [] })
const couponsSummary = reactive({ total: 0, used: 0, pending: 0, sourceDist: [], withCouponAvg: 0, withoutCouponAvg: 0 })
const searchSummary = reactive({ topTerms: [], noResults: [], dailyTrend: [] })

// % değişim hesaplama
function pctChange(current, previous) {
  if (!previous || previous === 0) return current > 0 ? 100 : 0
  return (((current - previous) / previous) * 100).toFixed(1)
}

// Veri çekme
async function fetchAll() {
  loading.value = true
  const q = dateParams.value
  try {
    const [ov, sl, sf, pr, af, cu, bk, rv, cp, sr] = await Promise.all([
      api.get(`/analytics/overview${q}`, { headers }),
      api.get(`/analytics/sales${q}`, { headers }),
      api.get(`/analytics/sales-funnel${q}`, { headers }),
      api.get(`/analytics/products${q}`, { headers }),
      api.get(`/analytics/products/affinity${q}`, { headers }),
      api.get(`/analytics/customers${q}`, { headers }),
      api.get(`/analytics/basket${q}`, { headers }),
      api.get(`/analytics/reviews-summary${q}`, { headers }),
      api.get(`/analytics/coupons-summary${q}`, { headers }),
      api.get(`/analytics/search-summary${q}`, { headers })
    ])

    Object.assign(overview, ov.data)
    Object.assign(sales, sl.data)

    // Funnel
    const f = sf.data
    funnel.steps = [
      { label: 'Toplam', value: f.total, color: '#CA9C53' },
      { label: 'Onaylanan', value: f.confirmed, color: '#A67D3D' },
      { label: 'Hazırlanan', value: f.preparing, color: '#C9A196' },
      { label: 'Kargolanan', value: f.shipped, color: '#6B5858' },
      { label: 'Teslim', value: f.delivered, color: '#242833' }
    ]

    Object.assign(products, pr.data)
    affinity.value = af.data.pairs || []
    Object.assign(customers, cu.data)
    Object.assign(basket, bk.data)
    Object.assign(reviewsSummary, rv.data)
    Object.assign(couponsSummary, cp.data)
    Object.assign(searchSummary, sr.data)
  } catch (error) {
    console.error('Analytics yüklenemedi:', error)
  } finally {
    loading.value = false
  }
}

// Satış trend chart data
const salesChartLabels = computed(() => sales.daily.map(d => d.date))
const salesChartDatasets = computed(() => [{
  label: 'Gelir (₺)',
  data: sales.daily.map(d => d.revenue),
  borderColor: '#CA9C53',
  backgroundColor: 'rgba(202,156,83,0.1)'
}, {
  label: 'Sipariş',
  data: sales.daily.map(d => d.count),
  borderColor: '#6B5858',
  backgroundColor: 'rgba(107,88,88,0.1)',
  yAxisID: 'y1'
}])

const salesChartOptions = computed(() => ({
  responsive: true,
  maintainAspectRatio: false,
  plugins: { legend: { display: true } },
  scales: {
    y: { beginAtZero: true, position: 'left', grid: { color: '#f0f0f0' } },
    y1: { beginAtZero: true, position: 'right', grid: { drawOnChartArea: false } },
    x: { grid: { display: false } }
  }
}))

// Sipariş durumu pie
const statusLabels = computed(() => sales.statusDist.map(d => d._id))
const statusData = computed(() => sales.statusDist.map(d => d.count))
const statusColors = ['#f59e0b', '#3b82f6', '#8b5cf6', '#10b981', '#22c55e', '#ef4444']

// Ödeme durumu pie
const paymentLabels = computed(() => sales.paymentDist.map(d => d._id))
const paymentData = computed(() => sales.paymentDist.map(d => d.count))
const paymentColors = ['#f59e0b', '#22c55e', '#ef4444', '#6366f1']

// Kategori bar chart
const catLabels = computed(() => products.categoryDist.map(d => d.name))
const catDatasets = computed(() => [{
  label: 'Satış Adedi',
  data: products.categoryDist.map(d => d.totalQty),
  backgroundColor: '#CA9C53'
}])

// Şehir bar chart
const cityLabels = computed(() => customers.cityDist.map(d => d._id || 'Belirtilmemiş'))
const cityDatasets = computed(() => [{
  label: 'Müşteri',
  data: customers.cityDist.map(d => d.count),
  backgroundColor: '#6B5858'
}])

// Arama trend line
const searchTrendLabels = computed(() => searchSummary.dailyTrend.map(d => d.date))
const searchTrendDatasets = computed(() => [{
  label: 'Arama',
  data: searchSummary.dailyTrend.map(d => d.count),
  borderColor: '#8b5cf6',
  backgroundColor: 'rgba(139,92,246,0.1)'
}])

// Excel export
async function exportExcel(type) {
  try {
    const response = await api.get(`/analytics/export/${type}${dateParams.value}`, {
      headers,
      responseType: 'blob'
    })
    const url = window.URL.createObjectURL(new Blob([response.data]))
    const link = document.createElement('a')
    link.href = url
    link.setAttribute('download', `${type}-rapor.xlsx`)
    document.body.appendChild(link)
    link.click()
    link.remove()
    window.URL.revokeObjectURL(url)
  } catch (error) {
    console.error('Export hatası:', error)
  }
}

watch(period, () => {
  if (period.value !== 'custom') fetchAll()
})

function applyCustomDate() {
  if (customFrom.value && customTo.value) fetchAll()
}

onMounted(fetchAll)
</script>

<template>
  <div class="min-h-screen bg-gray-50">
    <!-- Admin Header -->
    <div class="bg-dark-bg text-white">
      <div class="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
        <h1 class="text-lg font-heading">DB LINE - {{ locale === 'tr' ? 'Yönetim Paneli' : 'Admin Panel' }}</h1>
        <router-link to="/" class="text-xs underline opacity-70 hover:opacity-100">{{ locale === 'tr' ? 'Siteye Dön' : 'Back to Site' }}</router-link>
      </div>
    </div>

    <div class="max-w-7xl mx-auto px-4 py-8">
      <!-- Admin Navigasyon -->
      <nav class="flex flex-wrap gap-2 mb-8">
        <router-link to="/admin" class="px-4 py-2 bg-white border text-sm hover:bg-gray-50">Dashboard</router-link>
        <router-link to="/admin/products" class="px-4 py-2 bg-white border text-sm hover:bg-gray-50">{{ locale === 'tr' ? 'Ürünler' : 'Products' }}</router-link>
        <router-link to="/admin/categories" class="px-4 py-2 bg-white border text-sm hover:bg-gray-50">{{ locale === 'tr' ? 'Kategoriler' : 'Categories' }}</router-link>
        <router-link to="/admin/orders" class="px-4 py-2 bg-white border text-sm hover:bg-gray-50">{{ locale === 'tr' ? 'Siparişler' : 'Orders' }}</router-link>
        <router-link to="/admin/sales-report" class="px-4 py-2 bg-white border text-sm hover:bg-gray-50">{{ locale === 'tr' ? 'Satış Raporu' : 'Sales Report' }}</router-link>
        <router-link to="/admin/analytics" class="px-4 py-2 bg-accent text-white text-sm">{{ locale === 'tr' ? 'Analitik' : 'Analytics' }}</router-link>
        <router-link to="/admin/marketing" class="px-4 py-2 bg-white border text-sm hover:bg-gray-50">{{ locale === 'tr' ? 'Pazarlama' : 'Marketing' }}</router-link>
        <router-link to="/admin/reviews" class="px-4 py-2 bg-white border text-sm hover:bg-gray-50">{{ locale === 'tr' ? 'Yorumlar' : 'Reviews' }}</router-link>
        <router-link to="/admin/settings" class="px-4 py-2 bg-white border text-sm hover:bg-gray-50">{{ locale === 'tr' ? 'Ayarlar' : 'Settings' }}</router-link>
      </nav>

      <!-- Sayfa Başlık + Export -->
      <div class="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 gap-4">
        <h2 class="text-2xl font-bold">BI & Analytics Dashboard</h2>
        <div class="flex gap-2">
          <button @click="exportExcel('sales')" class="px-3 py-1.5 bg-green-600 text-white text-xs hover:bg-green-700">Satış Excel</button>
          <button @click="exportExcel('products')" class="px-3 py-1.5 bg-green-600 text-white text-xs hover:bg-green-700">Ürün Excel</button>
          <button @click="exportExcel('customers')" class="px-3 py-1.5 bg-green-600 text-white text-xs hover:bg-green-700">Müşteri Excel</button>
        </div>
      </div>

      <!-- Tarih Filtresi -->
      <div class="flex flex-wrap items-center gap-2 mb-8 bg-white p-3 border">
        <button v-for="p in [{v:'today',l:'Bugün'},{v:'7d',l:'Son 7 Gün'},{v:'30d',l:'Bu Ay'},{v:'90d',l:'Son 3 Ay'}]" :key="p.v"
          @click="period = p.v"
          :class="['px-3 py-1.5 text-xs border transition-colors', period === p.v ? 'bg-accent text-white border-accent' : 'hover:bg-gray-50']">
          {{ p.l }}
        </button>
        <button @click="period = 'custom'"
          :class="['px-3 py-1.5 text-xs border transition-colors', period === 'custom' ? 'bg-accent text-white border-accent' : 'hover:bg-gray-50']">
          Özel Aralık
        </button>
        <template v-if="period === 'custom'">
          <input v-model="customFrom" type="date" class="border px-2 py-1 text-xs" />
          <span class="text-xs text-gray-400">-</span>
          <input v-model="customTo" type="date" class="border px-2 py-1 text-xs" />
          <button @click="applyCustomDate" class="px-3 py-1.5 text-xs bg-accent text-white">Uygula</button>
        </template>
      </div>

      <!-- Loading -->
      <div v-if="loading" class="flex items-center justify-center py-20">
        <div class="animate-spin w-8 h-8 border-2 border-accent border-t-transparent rounded-full"></div>
      </div>

      <template v-else>
        <!-- KPI Kartları -->
        <div class="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div class="bg-white p-5 border">
            <p class="text-xs text-gray-500 mb-1">Toplam Gelir</p>
            <p class="text-2xl font-bold text-green-600">{{ formatPrice(overview.revenue) }}</p>
            <p :class="['text-xs mt-1', pctChange(overview.revenue, overview.prevRevenue) >= 0 ? 'text-green-500' : 'text-red-500']">
              {{ pctChange(overview.revenue, overview.prevRevenue) >= 0 ? '+' : '' }}{{ pctChange(overview.revenue, overview.prevRevenue) }}% önceki döneme göre
            </p>
          </div>
          <div class="bg-white p-5 border">
            <p class="text-xs text-gray-500 mb-1">Sipariş Sayısı</p>
            <p class="text-2xl font-bold">{{ overview.orders }}</p>
            <p :class="['text-xs mt-1', pctChange(overview.orders, overview.prevOrders) >= 0 ? 'text-green-500' : 'text-red-500']">
              {{ pctChange(overview.orders, overview.prevOrders) >= 0 ? '+' : '' }}{{ pctChange(overview.orders, overview.prevOrders) }}%
            </p>
          </div>
          <div class="bg-white p-5 border">
            <p class="text-xs text-gray-500 mb-1">Ort. Sepet Tutarı</p>
            <p class="text-2xl font-bold">{{ formatPrice(overview.avgOrder) }}</p>
            <p :class="['text-xs mt-1', pctChange(overview.avgOrder, overview.prevAvgOrder) >= 0 ? 'text-green-500' : 'text-red-500']">
              {{ pctChange(overview.avgOrder, overview.prevAvgOrder) >= 0 ? '+' : '' }}{{ pctChange(overview.avgOrder, overview.prevAvgOrder) }}%
            </p>
          </div>
          <div class="bg-white p-5 border">
            <p class="text-xs text-gray-500 mb-1">Yeni Müşteri</p>
            <p class="text-2xl font-bold">{{ overview.newCustomers }}</p>
            <p :class="['text-xs mt-1', pctChange(overview.newCustomers, overview.prevNewCustomers) >= 0 ? 'text-green-500' : 'text-red-500']">
              {{ pctChange(overview.newCustomers, overview.prevNewCustomers) >= 0 ? '+' : '' }}{{ pctChange(overview.newCustomers, overview.prevNewCustomers) }}%
            </p>
          </div>
        </div>

        <!-- Satış Trend Grafiği -->
        <div class="bg-white p-5 border mb-8">
          <h3 class="text-sm font-bold mb-4">Satış Trendi</h3>
          <LineChart :labels="salesChartLabels" :datasets="salesChartDatasets" :height="320" />
        </div>

        <!-- Sipariş & Ödeme Durumu -->
        <div class="grid md:grid-cols-2 gap-4 mb-8">
          <div class="bg-white p-5 border">
            <h3 class="text-sm font-bold mb-4">Sipariş Durumu Dağılımı</h3>
            <PieChart :labels="statusLabels" :data="statusData" :colors="statusColors" :height="260" />
          </div>
          <div class="bg-white p-5 border">
            <h3 class="text-sm font-bold mb-4">Ödeme Durumu Dağılımı</h3>
            <PieChart :labels="paymentLabels" :data="paymentData" :colors="paymentColors" :height="260" />
          </div>
        </div>

        <!-- Satış Hunisi -->
        <div class="bg-white p-5 border mb-8">
          <h3 class="text-sm font-bold mb-4">Satış Hunisi</h3>
          <FunnelChart :steps="funnel.steps" />
        </div>

        <!-- En Çok/Az Satan Ürünler -->
        <div class="grid md:grid-cols-2 gap-4 mb-8">
          <div class="bg-white p-5 border">
            <h3 class="text-sm font-bold mb-4">En Çok Satan Ürünler</h3>
            <div class="space-y-2">
              <div v-for="(p, i) in products.topSelling" :key="i" class="flex items-center justify-between py-2 border-b last:border-0">
                <div class="flex items-center gap-2">
                  <span class="w-6 h-6 bg-accent text-white text-xs flex items-center justify-center rounded-full">{{ i + 1 }}</span>
                  <span class="text-sm">{{ p.name }}</span>
                </div>
                <span class="text-sm font-bold">{{ p.totalQty }} adet</span>
              </div>
              <p v-if="!products.topSelling.length" class="text-xs text-gray-400 text-center py-4">Veri yok</p>
            </div>
          </div>
          <div class="bg-white p-5 border">
            <h3 class="text-sm font-bold mb-4">En Az Satan Ürünler</h3>
            <div class="space-y-2">
              <div v-for="(p, i) in products.leastSelling" :key="i" class="flex items-center justify-between py-2 border-b last:border-0">
                <div class="flex items-center gap-2">
                  <span class="w-6 h-6 bg-gray-400 text-white text-xs flex items-center justify-center rounded-full">{{ i + 1 }}</span>
                  <span class="text-sm">{{ p.name }}</span>
                </div>
                <span class="text-sm font-bold">{{ p.totalQty }} adet</span>
              </div>
              <p v-if="!products.leastSelling.length" class="text-xs text-gray-400 text-center py-4">Veri yok</p>
            </div>
          </div>
        </div>

        <!-- Kategori Performansı -->
        <div class="bg-white p-5 border mb-8">
          <h3 class="text-sm font-bold mb-4">Kategori Performansı</h3>
          <BarChart :labels="catLabels" :datasets="catDatasets" :height="280" :horizontal="true" />
        </div>

        <!-- Stok Durumu -->
        <div class="grid md:grid-cols-2 gap-4 mb-8">
          <div class="bg-white p-5 border">
            <h3 class="text-sm font-bold mb-4">Stok Devir Hızı (Son 30 Gün)</h3>
            <div class="overflow-x-auto">
              <table class="w-full text-xs">
                <thead class="bg-gray-50">
                  <tr>
                    <th class="text-left p-2">Ürün</th>
                    <th class="text-right p-2">Stok</th>
                    <th class="text-right p-2">Satılan</th>
                    <th class="text-right p-2">Devir</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="(s, i) in products.stockVelocity" :key="i" class="border-b">
                    <td class="p-2">{{ s.name }}</td>
                    <td class="text-right p-2">{{ s.stock }}</td>
                    <td class="text-right p-2">{{ s.totalSold }}</td>
                    <td class="text-right p-2 font-bold">{{ s.velocity?.toFixed(1) }}x</td>
                  </tr>
                </tbody>
              </table>
              <p v-if="!products.stockVelocity?.length" class="text-xs text-gray-400 text-center py-4">Veri yok</p>
            </div>
          </div>
          <div class="bg-white p-5 border">
            <h3 class="text-sm font-bold mb-4">Stokta En Uzun Bekleyenler</h3>
            <div class="overflow-x-auto">
              <table class="w-full text-xs">
                <thead class="bg-gray-50">
                  <tr>
                    <th class="text-left p-2">Ürün</th>
                    <th class="text-right p-2">Stok</th>
                    <th class="text-right p-2">Bekleme (Gün)</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="(s, i) in products.stockAging" :key="i" class="border-b">
                    <td class="p-2">{{ s.name }}</td>
                    <td class="text-right p-2">{{ s.stock }}</td>
                    <td class="text-right p-2 font-bold" :class="s.agingDays > 90 ? 'text-red-500' : s.agingDays > 30 ? 'text-yellow-600' : 'text-green-600'">
                      {{ s.agingDays }} gün
                    </td>
                  </tr>
                </tbody>
              </table>
              <p v-if="!products.stockAging?.length" class="text-xs text-gray-400 text-center py-4">Veri yok</p>
            </div>
          </div>
        </div>

        <!-- Birlikte Alınan Ürünler -->
        <div class="bg-white p-5 border mb-8">
          <h3 class="text-sm font-bold mb-4">Birlikte En Çok Alınan Ürünler (Cross-sell)</h3>
          <div class="overflow-x-auto">
            <table class="w-full text-xs">
              <thead class="bg-gray-50">
                <tr>
                  <th class="text-left p-2">#</th>
                  <th class="text-left p-2">Ürün 1</th>
                  <th class="text-left p-2">Ürün 2</th>
                  <th class="text-right p-2">Birlikte Sipariş</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="(pair, i) in affinity" :key="i" class="border-b">
                  <td class="p-2">{{ i + 1 }}</td>
                  <td class="p-2">{{ pair.product1Name }}</td>
                  <td class="p-2">{{ pair.product2Name }}</td>
                  <td class="text-right p-2 font-bold">{{ pair.count }}</td>
                </tr>
              </tbody>
            </table>
            <p v-if="!affinity.length" class="text-xs text-gray-400 text-center py-4">Veri yok</p>
          </div>
        </div>

        <!-- Müşteri Analizi -->
        <div class="grid md:grid-cols-2 gap-4 mb-8">
          <div class="bg-white p-5 border">
            <h3 class="text-sm font-bold mb-4">Şehir Bazlı Müşteri Dağılımı</h3>
            <BarChart :labels="cityLabels" :datasets="cityDatasets" :height="280" />
          </div>
          <div class="bg-white p-5 border">
            <h3 class="text-sm font-bold mb-4">En Değerli Müşteriler (LTV)</h3>
            <div class="space-y-2">
              <div v-for="(c, i) in customers.topLTV" :key="i" class="flex items-center justify-between py-2 border-b last:border-0">
                <div class="flex items-center gap-2">
                  <span class="w-6 h-6 bg-accent text-white text-xs flex items-center justify-center rounded-full">{{ i + 1 }}</span>
                  <span class="text-sm">{{ c.name || c.email }}</span>
                </div>
                <div class="text-right">
                  <span class="text-sm font-bold">{{ formatPrice(c.totalSpent) }}</span>
                  <span class="text-xs text-gray-400 ml-1">({{ c.orderCount }} sipariş)</span>
                </div>
              </div>
              <p v-if="!customers.topLTV?.length" class="text-xs text-gray-400 text-center py-4">Veri yok</p>
            </div>
            <div class="mt-4 pt-4 border-t grid grid-cols-2 gap-4">
              <div class="text-center">
                <p class="text-lg font-bold">{{ customers.repeatRate?.toFixed(1) }}%</p>
                <p class="text-xs text-gray-500">Tekrar Müşteri</p>
              </div>
              <div class="text-center">
                <p class="text-lg font-bold">{{ customers.avgOrders?.toFixed(1) }}</p>
                <p class="text-xs text-gray-500">Ort. Sipariş/Müşteri</p>
              </div>
            </div>
          </div>
        </div>

        <!-- Sepet Analizi -->
        <div class="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div class="bg-white p-5 border text-center">
            <p class="text-xs text-gray-500 mb-1">Ort. Sepet Büyüklüğü</p>
            <p class="text-2xl font-bold">{{ basket.avgItems?.toFixed(1) }}</p>
            <p class="text-xs text-gray-400">ürün/sipariş</p>
          </div>
          <div class="bg-white p-5 border text-center">
            <p class="text-xs text-gray-500 mb-1">Ort. Sepet Tutarı</p>
            <p class="text-2xl font-bold">{{ formatPrice(basket.avgAmount) }}</p>
          </div>
          <div class="bg-white p-5 border text-center">
            <p class="text-xs text-gray-500 mb-1">Kuponlu Ort. Tutar</p>
            <p class="text-2xl font-bold">{{ formatPrice(couponsSummary.withCouponAvg) }}</p>
          </div>
          <div class="bg-white p-5 border text-center">
            <p class="text-xs text-gray-500 mb-1">Kuponsuz Ort. Tutar</p>
            <p class="text-2xl font-bold">{{ formatPrice(couponsSummary.withoutCouponAvg) }}</p>
          </div>
        </div>

        <!-- Yorum & Kupon Özeti -->
        <div class="grid md:grid-cols-2 gap-4 mb-8">
          <div class="bg-white p-5 border">
            <h3 class="text-sm font-bold mb-4">Yorum İstatistikleri</h3>
            <div class="grid grid-cols-2 gap-4 mb-4">
              <div class="text-center p-3 bg-gray-50">
                <p class="text-lg font-bold">{{ reviewsSummary.total }}</p>
                <p class="text-xs text-gray-500">Toplam</p>
              </div>
              <div class="text-center p-3 bg-gray-50">
                <p class="text-lg font-bold">{{ reviewsSummary.avgRating?.toFixed(1) }}</p>
                <p class="text-xs text-gray-500">Ort. Puan</p>
              </div>
              <div class="text-center p-3 bg-gray-50">
                <p class="text-lg font-bold">{{ reviewsSummary.approved }}</p>
                <p class="text-xs text-gray-500">Onaylanan</p>
              </div>
              <div class="text-center p-3 bg-gray-50">
                <p class="text-lg font-bold">{{ reviewsSummary.photoRate?.toFixed(0) }}%</p>
                <p class="text-xs text-gray-500">Fotoğraflı</p>
              </div>
            </div>
            <h4 class="text-xs font-bold mb-2 text-gray-600">En Çok Yorum Alan</h4>
            <div v-for="(p, i) in reviewsSummary.topReviewed" :key="i" class="flex justify-between text-xs py-1 border-b last:border-0">
              <span>{{ p.name }}</span>
              <span class="font-bold">{{ p.reviewCount }} yorum</span>
            </div>
          </div>
          <div class="bg-white p-5 border">
            <h3 class="text-sm font-bold mb-4">Kupon Performansı</h3>
            <div class="grid grid-cols-3 gap-4 mb-4">
              <div class="text-center p-3 bg-gray-50">
                <p class="text-lg font-bold">{{ couponsSummary.total }}</p>
                <p class="text-xs text-gray-500">Toplam</p>
              </div>
              <div class="text-center p-3 bg-gray-50">
                <p class="text-lg font-bold text-green-600">{{ couponsSummary.used }}</p>
                <p class="text-xs text-gray-500">Kullanılan</p>
              </div>
              <div class="text-center p-3 bg-gray-50">
                <p class="text-lg font-bold">{{ couponsSummary.total > 0 ? ((couponsSummary.used / couponsSummary.total) * 100).toFixed(0) : 0 }}%</p>
                <p class="text-xs text-gray-500">Dönüşüm</p>
              </div>
            </div>
            <h4 class="text-xs font-bold mb-2 text-gray-600">Kaynak Dağılımı</h4>
            <div v-for="(s, i) in couponsSummary.sourceDist" :key="i" class="flex justify-between text-xs py-1 border-b last:border-0">
              <span>{{ s._id || 'Diğer' }}</span>
              <span class="font-bold">{{ s.count }}</span>
            </div>
          </div>
        </div>

        <!-- Arama Analizi -->
        <div class="bg-white p-5 border mb-8">
          <h3 class="text-sm font-bold mb-4">Arama Trendi</h3>
          <LineChart :labels="searchTrendLabels" :datasets="searchTrendDatasets" :height="200" />
        </div>

        <div class="grid md:grid-cols-2 gap-4 mb-8">
          <div class="bg-white p-5 border">
            <h3 class="text-sm font-bold mb-4">En Çok Aranan Terimler</h3>
            <div v-for="(t, i) in searchSummary.topTerms" :key="i" class="flex items-center justify-between text-xs py-1.5 border-b last:border-0">
              <div class="flex items-center gap-2">
                <span class="text-gray-400">{{ i + 1 }}.</span>
                <span>{{ t.term }}</span>
              </div>
              <span class="font-bold">{{ t.count }}</span>
            </div>
            <p v-if="!searchSummary.topTerms?.length" class="text-xs text-gray-400 text-center py-4">Veri yok</p>
          </div>
          <div class="bg-white p-5 border">
            <h3 class="text-sm font-bold mb-4 text-red-600">Sonuç Bulunamayan Aramalar</h3>
            <div v-for="(t, i) in searchSummary.noResults" :key="i" class="flex items-center justify-between text-xs py-1.5 border-b last:border-0">
              <div class="flex items-center gap-2">
                <span class="text-gray-400">{{ i + 1 }}.</span>
                <span>{{ t.term }}</span>
              </div>
              <span class="font-bold text-red-500">{{ t.count }}</span>
            </div>
            <p v-if="!searchSummary.noResults?.length" class="text-xs text-gray-400 text-center py-4">Veri yok</p>
          </div>
        </div>
      </template>
    </div>
  </div>
</template>
