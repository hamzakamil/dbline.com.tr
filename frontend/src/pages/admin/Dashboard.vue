<script setup>
import { ref, computed, onMounted } from 'vue'
import { useLanguage } from '../../composables/useLanguage'
import SparklineChart from '../../components/charts/SparklineChart.vue'
import api from '../../utils/api'

const { formatPrice, locale, t } = useLanguage()

const loading = ref(true)
const data = ref({
  totalOrders: 0, totalProducts: 0, totalUsers: 0, totalRevenue: 0,
  pendingOrders: 0, todayRevenue: 0, todayOrders: 0,
  yesterdayRevenue: 0, yesterdayOrders: 0,
  thisWeekRevenue: 0, lastWeekRevenue: 0,
  sparkline: [], recentOrders: []
})

const sparklineData = computed(() => data.value.sparkline.map(s => s.revenue))

function pctChange(current, previous) {
  if (!previous || previous === 0) return current > 0 ? 100 : 0
  return Math.round(((current - previous) / previous) * 100)
}

function changeColor(val) {
  return val > 0 ? 'text-green-600' : val < 0 ? 'text-red-600' : 'text-gray-400'
}

function changeArrow(val) {
  return val > 0 ? '↑' : val < 0 ? '↓' : '→'
}

const todayVsYesterday = computed(() => pctChange(data.value.todayRevenue, data.value.yesterdayRevenue))
const weekVsLastWeek = computed(() => pctChange(data.value.thisWeekRevenue, data.value.lastWeekRevenue))

const statusLabels = {
  pending: { tr: 'Bekliyor', en: 'Pending' },
  confirmed: { tr: 'Onaylandı', en: 'Confirmed' },
  preparing: { tr: 'Hazırlanıyor', en: 'Preparing' },
  shipped: { tr: 'Kargoda', en: 'Shipped' },
  delivered: { tr: 'Teslim Edildi', en: 'Delivered' },
  cancelled: { tr: 'İptal', en: 'Cancelled' }
}

const statusColors = {
  pending: 'bg-yellow-100 text-yellow-700',
  confirmed: 'bg-blue-100 text-blue-700',
  preparing: 'bg-purple-100 text-purple-700',
  shipped: 'bg-indigo-100 text-indigo-700',
  delivered: 'bg-green-100 text-green-700',
  cancelled: 'bg-red-100 text-red-700'
}

onMounted(async () => {
  try {
    const { data: d } = await api.get('/admin/dashboard-enhanced')
    data.value = d
  } catch (error) {
    console.error('Dashboard yüklenemedi:', error)
    // Fallback: eski endpoint
    try {
      const { data: d } = await api.get('/admin/dashboard')
      data.value = { ...data.value, ...d }
    } catch {}
  } finally {
    loading.value = false
  }
})
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
        <router-link to="/admin" class="px-4 py-2 bg-accent text-white text-sm">Dashboard</router-link>
        <router-link to="/admin/products" class="px-4 py-2 bg-white border text-sm hover:bg-gray-50">{{ locale === 'tr' ? 'Ürünler' : 'Products' }}</router-link>
        <router-link to="/admin/categories" class="px-4 py-2 bg-white border text-sm hover:bg-gray-50">{{ locale === 'tr' ? 'Kategoriler' : 'Categories' }}</router-link>
        <router-link to="/admin/orders" class="px-4 py-2 bg-white border text-sm hover:bg-gray-50">{{ locale === 'tr' ? 'Siparişler' : 'Orders' }}</router-link>
        <router-link to="/admin/sales-report" class="px-4 py-2 bg-white border text-sm hover:bg-gray-50">{{ locale === 'tr' ? 'Satış Raporu' : 'Sales Report' }}</router-link>
        <router-link to="/admin/analytics" class="px-4 py-2 bg-white border text-sm hover:bg-gray-50">{{ locale === 'tr' ? 'Analitik' : 'Analytics' }}</router-link>
        <router-link to="/admin/marketing" class="px-4 py-2 bg-white border text-sm hover:bg-gray-50">{{ locale === 'tr' ? 'Pazarlama' : 'Marketing' }}</router-link>
        <router-link to="/admin/reviews" class="px-4 py-2 bg-white border text-sm hover:bg-gray-50">{{ locale === 'tr' ? 'Yorumlar' : 'Reviews' }}</router-link>
        <router-link to="/admin/settings" class="px-4 py-2 bg-white border text-sm hover:bg-gray-50">{{ locale === 'tr' ? 'Ayarlar' : 'Settings' }}</router-link>
      </nav>

      <div v-if="loading" class="text-center py-20">
        <div class="w-10 h-10 border-2 border-accent border-t-transparent rounded-full animate-spin mx-auto"></div>
      </div>

      <template v-else>
        <!-- KPI Kartları -->
        <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <!-- Bugünün Geliri -->
          <div class="bg-white border border-gray-200 rounded-xl p-5">
            <div class="flex items-center justify-between mb-1">
              <p class="text-xs font-medium text-gray-500 uppercase tracking-wider">{{ t.salesReport.todayRevenue }}</p>
              <span :class="changeColor(todayVsYesterday)" class="text-xs font-semibold">
                {{ changeArrow(todayVsYesterday) }} {{ Math.abs(todayVsYesterday) }}%
              </span>
            </div>
            <p class="text-2xl font-bold text-gray-800">{{ formatPrice(data.todayRevenue) }}</p>
            <div class="mt-2">
              <SparklineChart :data="sparklineData" color="#CA9C53" :height="36" />
            </div>
            <p class="text-xs text-gray-400 mt-1">{{ t.salesReport.vsYesterday }}</p>
          </div>

          <!-- Bugünün Siparişleri -->
          <div class="bg-white border border-gray-200 rounded-xl p-5">
            <div class="flex items-center justify-between mb-1">
              <p class="text-xs font-medium text-gray-500 uppercase tracking-wider">{{ locale === 'tr' ? 'Bugün Sipariş' : 'Today Orders' }}</p>
            </div>
            <p class="text-2xl font-bold text-gray-800">{{ data.todayOrders }}</p>
            <div class="mt-2">
              <SparklineChart :data="data.sparkline.map(s => s.orders)" color="#3b82f6" :height="36" />
            </div>
            <p class="text-xs text-gray-400 mt-1">{{ locale === 'tr' ? 'Dün' : 'Yesterday' }}: {{ data.yesterdayOrders }}</p>
          </div>

          <!-- Ort. Sipariş -->
          <div class="bg-white border border-gray-200 rounded-xl p-5">
            <p class="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">{{ t.salesReport.avgOrder }}</p>
            <p class="text-2xl font-bold text-gray-800">{{ formatPrice(data.todayOrders > 0 ? data.todayRevenue / data.todayOrders : 0) }}</p>
            <div class="flex gap-4 mt-3">
              <div>
                <p class="text-xs text-gray-400">{{ locale === 'tr' ? 'Toplam Gelir' : 'Total Revenue' }}</p>
                <p class="text-sm font-semibold text-green-700">{{ formatPrice(data.totalRevenue) }}</p>
              </div>
            </div>
          </div>

          <!-- Bekleyen Sipariş -->
          <div class="bg-white border border-gray-200 rounded-xl p-5">
            <p class="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">{{ locale === 'tr' ? 'Bekleyen' : 'Pending' }}</p>
            <p class="text-2xl font-bold" :class="data.pendingOrders > 0 ? 'text-yellow-600' : 'text-gray-800'">{{ data.pendingOrders }}</p>
            <div class="flex gap-3 mt-3">
              <div>
                <p class="text-xs text-gray-400">{{ locale === 'tr' ? 'Ürünler' : 'Products' }}</p>
                <p class="text-sm font-semibold">{{ data.totalProducts }}</p>
              </div>
              <div>
                <p class="text-xs text-gray-400">{{ locale === 'tr' ? 'Kullanıcılar' : 'Users' }}</p>
                <p class="text-sm font-semibold">{{ data.totalUsers }}</p>
              </div>
            </div>
          </div>
        </div>

        <!-- Bu Hafta vs Geçen Hafta -->
        <div class="bg-white border border-gray-200 rounded-xl p-5 mb-6">
          <div class="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p class="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">{{ locale === 'tr' ? 'Bu Hafta' : 'This Week' }}</p>
              <p class="text-xl font-bold text-gray-800">{{ formatPrice(data.thisWeekRevenue) }}</p>
            </div>
            <div class="flex items-center gap-3">
              <span :class="changeColor(weekVsLastWeek)" class="text-sm font-semibold">
                {{ changeArrow(weekVsLastWeek) }} {{ Math.abs(weekVsLastWeek) }}%
              </span>
              <span class="text-xs text-gray-400">{{ t.salesReport.vsLastWeek }}</span>
            </div>
            <div class="text-right">
              <p class="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">{{ locale === 'tr' ? 'Geçen Hafta' : 'Last Week' }}</p>
              <p class="text-xl font-bold text-gray-500">{{ formatPrice(data.lastWeekRevenue) }}</p>
            </div>
          </div>
        </div>

        <!-- Son 5 Sipariş -->
        <div class="bg-white border border-gray-200 rounded-xl p-6">
          <div class="flex items-center justify-between mb-4">
            <h3 class="text-sm font-semibold text-gray-700">{{ t.salesReport.recentOrders }}</h3>
            <router-link to="/admin/orders" class="text-xs text-accent hover:text-accent-dark font-medium">
              {{ t.salesReport.viewAll }} →
            </router-link>
          </div>

          <div v-if="data.recentOrders.length" class="overflow-x-auto">
            <table class="w-full text-sm">
              <thead class="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th class="text-left px-4 py-2.5 font-medium text-gray-500 text-xs">{{ t.salesReport.orderNo }}</th>
                  <th class="text-left px-4 py-2.5 font-medium text-gray-500 text-xs">{{ t.salesReport.customer }}</th>
                  <th class="text-left px-4 py-2.5 font-medium text-gray-500 text-xs">{{ t.salesReport.amount }}</th>
                  <th class="text-left px-4 py-2.5 font-medium text-gray-500 text-xs">{{ t.salesReport.status }}</th>
                  <th class="text-left px-4 py-2.5 font-medium text-gray-500 text-xs">{{ t.salesReport.date }}</th>
                  <th class="text-right px-4 py-2.5 font-medium text-gray-500 text-xs"></th>
                </tr>
              </thead>
              <tbody class="divide-y divide-gray-100">
                <tr v-for="order in data.recentOrders" :key="order._id" class="hover:bg-gray-50">
                  <td class="px-4 py-3 font-mono text-xs text-gray-600">#{{ order._id.slice(-8).toUpperCase() }}</td>
                  <td class="px-4 py-3 text-gray-800">{{ order.user?.name || '-' }}</td>
                  <td class="px-4 py-3 font-semibold">{{ formatPrice(order.totalAmount) }}</td>
                  <td class="px-4 py-3">
                    <span :class="statusColors[order.status]" class="text-xs px-2.5 py-1 rounded-full font-medium">
                      {{ statusLabels[order.status]?.[locale] || order.status }}
                    </span>
                  </td>
                  <td class="px-4 py-3 text-gray-500 text-xs">{{ new Date(order.createdAt).toLocaleDateString('tr-TR') }}</td>
                  <td class="px-4 py-3 text-right">
                    <router-link :to="`/admin/orders/${order._id}`" class="text-accent hover:text-accent-dark text-xs font-medium">
                      {{ t.salesReport.detail }}
                    </router-link>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
          <p v-else class="text-center text-gray-400 text-sm py-8">{{ t.salesReport.noData }}</p>
        </div>
      </template>
    </div>
  </div>
</template>
