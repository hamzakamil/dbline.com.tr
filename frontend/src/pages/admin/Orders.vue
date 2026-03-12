<script setup>
import { ref, onMounted } from 'vue'
import { useLanguage } from '../../composables/useLanguage'
import api from '../../utils/api'

const { formatPrice, locale } = useLanguage()

const orders = ref([])
const loading = ref(true)
const statusFilter = ref('')

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

async function fetchOrders() {
  loading.value = true
  try {
    const params = {}
    if (statusFilter.value) params.status = statusFilter.value
    const { data } = await api.get(`/orders`, { params })
    orders.value = data.orders
  } catch (error) {
    console.error(error)
  } finally {
    loading.value = false
  }
}

onMounted(fetchOrders)
</script>

<template>
  <div class="min-h-screen bg-gray-50">
    <div class="bg-dark-bg text-white">
      <div class="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
        <h1 class="text-lg font-heading">{{ locale === 'tr' ? 'Sipariş Yönetimi' : 'Order Management' }}</h1>
        <router-link to="/" class="text-xs underline opacity-70 hover:opacity-100">{{ locale === 'tr' ? 'Siteye Dön' : 'Back to Site' }}</router-link>
      </div>
    </div>

    <div class="max-w-7xl mx-auto px-4 py-8">
      <nav class="flex flex-wrap gap-2 mb-8">
        <router-link to="/admin" class="px-4 py-2 bg-white border text-sm hover:bg-gray-50">Dashboard</router-link>
        <router-link to="/admin/products" class="px-4 py-2 bg-white border text-sm hover:bg-gray-50">{{ locale === 'tr' ? 'Ürünler' : 'Products' }}</router-link>
        <router-link to="/admin/categories" class="px-4 py-2 bg-white border text-sm hover:bg-gray-50">{{ locale === 'tr' ? 'Kategoriler' : 'Categories' }}</router-link>
        <router-link to="/admin/orders" class="px-4 py-2 bg-accent text-white text-sm">{{ locale === 'tr' ? 'Siparişler' : 'Orders' }}</router-link>
        <router-link to="/admin/sales-report" class="px-4 py-2 bg-white border text-sm hover:bg-gray-50">{{ locale === 'tr' ? 'Satış Raporu' : 'Sales Report' }}</router-link>
        <router-link to="/admin/analytics" class="px-4 py-2 bg-white border text-sm hover:bg-gray-50">{{ locale === 'tr' ? 'Analitik' : 'Analytics' }}</router-link>
        <router-link to="/admin/marketing" class="px-4 py-2 bg-white border text-sm hover:bg-gray-50">{{ locale === 'tr' ? 'Pazarlama' : 'Marketing' }}</router-link>
        <router-link to="/admin/reviews" class="px-4 py-2 bg-white border text-sm hover:bg-gray-50">{{ locale === 'tr' ? 'Yorumlar' : 'Reviews' }}</router-link>
        <router-link to="/admin/settings" class="px-4 py-2 bg-white border text-sm hover:bg-gray-50">{{ locale === 'tr' ? 'Ayarlar' : 'Settings' }}</router-link>
      </nav>

      <!-- Filtre -->
      <div class="flex justify-between items-center mb-6">
        <h2 class="text-xl">{{ locale === 'tr' ? 'Siparişler' : 'Orders' }}</h2>
        <select v-model="statusFilter" @change="fetchOrders" class="border px-3 py-2 text-sm">
          <option value="">{{ locale === 'tr' ? 'Tüm Durumlar' : 'All Statuses' }}</option>
          <option v-for="(label, key) in statusLabels" :key="key" :value="key">{{ label[locale] }}</option>
        </select>
      </div>

      <div v-if="loading" class="text-center py-12">
        <div class="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
      </div>

      <div v-else class="bg-white border overflow-x-auto">
        <table class="w-full text-sm">
          <thead class="bg-gray-50 border-b">
            <tr>
              <th class="text-left px-4 py-3">{{ locale === 'tr' ? 'Sipariş No' : 'Order #' }}</th>
              <th class="text-left px-4 py-3">{{ locale === 'tr' ? 'Müşteri' : 'Customer' }}</th>
              <th class="text-left px-4 py-3">{{ locale === 'tr' ? 'Tutar' : 'Amount' }}</th>
              <th class="text-left px-4 py-3">{{ locale === 'tr' ? 'Durum' : 'Status' }}</th>
              <th class="text-left px-4 py-3">{{ locale === 'tr' ? 'Tarih' : 'Date' }}</th>
              <th class="text-right px-4 py-3">{{ locale === 'tr' ? 'Detay' : 'Detail' }}</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="order in orders" :key="order._id" class="border-b hover:bg-gray-50">
              <td class="px-4 py-3 font-mono text-xs">#{{ order._id.slice(-8).toUpperCase() }}</td>
              <td class="px-4 py-3">{{ order.user?.name || '-' }}</td>
              <td class="px-4 py-3 font-medium">{{ formatPrice(order.totalAmount) }}</td>
              <td class="px-4 py-3">
                <span :class="statusColors[order.status]" class="text-xs px-2 py-1 rounded">
                  {{ statusLabels[order.status]?.[locale] || order.status }}
                </span>
              </td>
              <td class="px-4 py-3 text-gray-400">{{ new Date(order.createdAt).toLocaleDateString('tr-TR') }}</td>
              <td class="px-4 py-3 text-right">
                <router-link :to="`/admin/orders/${order._id}`" class="text-blue-600 hover:underline text-xs">
                  {{ locale === 'tr' ? 'Görüntüle' : 'View' }}
                </router-link>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>
