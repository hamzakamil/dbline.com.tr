<script setup>
import { ref, onMounted } from 'vue'
import { useLanguage } from '../composables/useLanguage'
import { useAuthStore } from '../stores/auth'
import api from '../utils/api'

const { locale } = useLanguage()
const auth = useAuthStore()

const orders = ref([])
const loading = ref(true)

async function fetchOrders() {
  try {
    const { data } = await api.get(`/orders/my-orders`)
    orders.value = data || []
  } catch (error) {
    console.error(error)
  } finally {
    loading.value = false
  }
}

function formatDate(d) {
  return new Date(d).toLocaleDateString('tr-TR', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

function formatPrice(price) {
  return `₺${price?.toFixed(2) || '0.00'}`
}

const statusMap = {
  pending: { tr: 'Beklemede', en: 'Pending', class: 'bg-amber-50 text-amber-600' },
  confirmed: { tr: 'Onaylandı', en: 'Confirmed', class: 'bg-blue-50 text-blue-600' },
  shipped: { tr: 'Kargoda', en: 'Shipped', class: 'bg-purple-50 text-purple-600' },
  delivered: { tr: 'Teslim Edildi', en: 'Delivered', class: 'bg-green-50 text-green-600' },
  cancelled: { tr: 'İptal', en: 'Cancelled', class: 'bg-red-50 text-red-600' }
}

onMounted(fetchOrders)
</script>

<template>
  <div class="page-width py-8">
    <h1 class="text-2xl font-heading mb-6">{{ locale === 'tr' ? 'Siparişlerim' : 'My Orders' }}</h1>

    <div v-if="loading" class="text-center py-12 text-gray-400">...</div>

    <div v-else-if="orders.length === 0" class="text-center py-16">
      <p class="text-gray-500 mb-4">{{ locale === 'tr' ? 'Henüz siparişiniz yok' : 'No orders yet' }}</p>
      <router-link to="/products" class="btn-primary inline-block">
        {{ locale === 'tr' ? 'Alışverişe Başla' : 'Start Shopping' }}
      </router-link>
    </div>

    <div v-else class="space-y-4">
      <div v-for="order in orders" :key="order._id" class="bg-white border p-5">
        <div class="flex items-center justify-between mb-3">
          <div>
            <span class="text-xs text-gray-400">{{ locale === 'tr' ? 'Sipariş No:' : 'Order #:' }} </span>
            <span class="text-sm font-mono font-medium">{{ order.orderNumber || order._id?.slice(-8) }}</span>
          </div>
          <div class="flex items-center gap-3">
            <span :class="['text-xs px-2 py-1 rounded', statusMap[order.status]?.class || 'bg-gray-50 text-gray-500']">
              {{ locale === 'tr' ? statusMap[order.status]?.tr : statusMap[order.status]?.en || order.status }}
            </span>
            <span class="text-xs text-gray-400">{{ formatDate(order.createdAt) }}</span>
          </div>
        </div>
        <div class="flex items-center justify-between">
          <div class="text-sm text-gray-500">
            {{ order.items?.length || 0 }} {{ locale === 'tr' ? 'ürün' : 'items' }}
          </div>
          <div class="text-sm font-medium">{{ formatPrice(order.totalAmount) }}</div>
        </div>
      </div>
    </div>
  </div>
</template>
