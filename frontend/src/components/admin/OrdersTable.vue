<script setup>
import { ref, computed, watch } from 'vue'
import { useLanguage } from '../../composables/useLanguage'
import api from '../../utils/api'

const { formatPrice, locale, t } = useLanguage()

const props = defineProps({
  dateFrom: { type: String, default: '' },
  dateTo: { type: String, default: '' },
  compact: { type: Boolean, default: false },
  limit: { type: Number, default: 0 }
})

const orders = ref([])
const loading = ref(true)
const search = ref('')
const statusFilter = ref('')
const sortBy = ref('createdAt')
const sortOrder = ref('desc')
const page = ref(1)
const perPage = ref(10)
const total = ref(0)
const statusCounts = ref({})

const statusKeys = ['pending', 'confirmed', 'preparing', 'shipped', 'delivered', 'cancelled']

const statusColors = {
  pending: 'bg-yellow-100 text-yellow-700 border-yellow-200',
  confirmed: 'bg-blue-100 text-blue-700 border-blue-200',
  preparing: 'bg-purple-100 text-purple-700 border-purple-200',
  shipped: 'bg-indigo-100 text-indigo-700 border-indigo-200',
  delivered: 'bg-green-100 text-green-700 border-green-200',
  cancelled: 'bg-red-100 text-red-700 border-red-200'
}

const paymentColors = {
  paid: 'bg-green-100 text-green-700',
  pending: 'bg-yellow-100 text-yellow-700',
  failed: 'bg-red-100 text-red-700',
  refunded: 'bg-gray-100 text-gray-700'
}

const totalPages = computed(() => Math.ceil(total.value / perPage.value))

let searchTimeout = null

async function fetchOrders() {
  loading.value = true
  try {
    const params = {
      page: page.value,
      limit: props.limit || perPage.value,
      sortBy: sortBy.value,
      sortOrder: sortOrder.value
    }
    if (statusFilter.value) params.status = statusFilter.value
    if (search.value.trim()) params.search = search.value.trim()
    if (props.dateFrom) params.from = props.dateFrom
    if (props.dateTo) params.to = props.dateTo

    const { data } = await api.get('/orders', { params })
    orders.value = data.orders || []
    total.value = data.total || data.orders?.length || 0
    if (data.statusCounts) statusCounts.value = data.statusCounts
  } catch (error) {
    console.error('Orders fetch error:', error)
  } finally {
    loading.value = false
  }
}

function onSearch() {
  clearTimeout(searchTimeout)
  searchTimeout = setTimeout(() => {
    page.value = 1
    fetchOrders()
  }, 400)
}

function setStatus(status) {
  statusFilter.value = statusFilter.value === status ? '' : status
  page.value = 1
  fetchOrders()
}

function toggleSort(field) {
  if (sortBy.value === field) {
    sortOrder.value = sortOrder.value === 'asc' ? 'desc' : 'asc'
  } else {
    sortBy.value = field
    sortOrder.value = 'desc'
  }
  page.value = 1
  fetchOrders()
}

function sortIcon(field) {
  if (sortBy.value !== field) return '↕'
  return sortOrder.value === 'asc' ? '↑' : '↓'
}

function goToPage(p) {
  if (p < 1 || p > totalPages.value) return
  page.value = p
  fetchOrders()
}

function formatDate(dateStr) {
  return new Date(dateStr).toLocaleDateString(locale.value === 'tr' ? 'tr-TR' : 'en-US', {
    day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit'
  })
}

watch(() => [props.dateFrom, props.dateTo], () => {
  page.value = 1
  fetchOrders()
})

fetchOrders()

defineExpose({ fetchOrders })
</script>

<template>
  <div>
    <!-- Filtre Pilleri -->
    <div v-if="!compact" class="flex flex-wrap gap-2 mb-4">
      <button
        @click="setStatus('')"
        :class="[
          'px-3 py-1.5 text-xs font-medium rounded-full border transition-colors',
          !statusFilter ? 'bg-gray-800 text-white border-gray-800' : 'bg-white text-gray-600 border-gray-200 hover:border-gray-400'
        ]"
      >
        {{ t.salesReport.allStatuses }}
        <span class="ml-1 opacity-70">({{ total }})</span>
      </button>
      <button
        v-for="key in statusKeys"
        :key="key"
        @click="setStatus(key)"
        :class="[
          'px-3 py-1.5 text-xs font-medium rounded-full border transition-colors',
          statusFilter === key ? statusColors[key] + ' border-current' : 'bg-white text-gray-600 border-gray-200 hover:border-gray-400'
        ]"
      >
        {{ t.salesReport[key] }}
        <span v-if="statusCounts[key]" class="ml-1 opacity-70">({{ statusCounts[key] }})</span>
      </button>
    </div>

    <!-- Arama -->
    <div v-if="!compact" class="flex items-center gap-3 mb-4">
      <div class="relative flex-1 max-w-sm">
        <svg class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        <input
          v-model="search"
          @input="onSearch"
          :placeholder="t.salesReport.searchOrders"
          class="w-full pl-10 pr-4 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-accent"
        />
      </div>
      <select v-model="perPage" @change="page = 1; fetchOrders()" class="border border-gray-200 rounded-lg px-3 py-2 text-sm">
        <option :value="10">10</option>
        <option :value="25">25</option>
        <option :value="50">50</option>
      </select>
    </div>

    <!-- Loading -->
    <div v-if="loading" class="text-center py-12">
      <div class="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin mx-auto"></div>
    </div>

    <!-- Tablo -->
    <div v-else-if="orders.length" class="bg-white border border-gray-200 rounded-lg overflow-hidden">
      <div class="overflow-x-auto">
        <table class="w-full text-sm">
          <thead class="bg-gray-50 border-b border-gray-200">
            <tr>
              <th class="text-left px-4 py-3 font-medium text-gray-500">{{ t.salesReport.orderNo }}</th>
              <th class="text-left px-4 py-3 font-medium text-gray-500 cursor-pointer select-none hover:text-gray-800" @click="toggleSort('user')">
                {{ t.salesReport.customer }} <span class="text-xs">{{ sortIcon('user') }}</span>
              </th>
              <th class="text-left px-4 py-3 font-medium text-gray-500 cursor-pointer select-none hover:text-gray-800" @click="toggleSort('totalAmount')">
                {{ t.salesReport.amount }} <span class="text-xs">{{ sortIcon('totalAmount') }}</span>
              </th>
              <th v-if="!compact" class="text-left px-4 py-3 font-medium text-gray-500">{{ t.salesReport.status }}</th>
              <th v-if="!compact" class="text-left px-4 py-3 font-medium text-gray-500">{{ t.salesReport.payment }}</th>
              <th class="text-left px-4 py-3 font-medium text-gray-500 cursor-pointer select-none hover:text-gray-800" @click="toggleSort('createdAt')">
                {{ t.salesReport.date }} <span class="text-xs">{{ sortIcon('createdAt') }}</span>
              </th>
              <th class="text-right px-4 py-3 font-medium text-gray-500">{{ t.salesReport.detail }}</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-100">
            <tr v-for="order in orders" :key="order._id" class="hover:bg-gray-50 transition-colors">
              <td class="px-4 py-3 font-mono text-xs text-gray-600">#{{ order._id.slice(-8).toUpperCase() }}</td>
              <td class="px-4 py-3">
                <div class="font-medium text-gray-800">{{ order.user?.name || order.shippingAddress?.fullName || '-' }}</div>
                <div v-if="order.user?.email" class="text-xs text-gray-400">{{ order.user.email }}</div>
              </td>
              <td class="px-4 py-3 font-semibold text-gray-800">{{ formatPrice(order.totalAmount) }}</td>
              <td v-if="!compact" class="px-4 py-3">
                <span :class="statusColors[order.status]" class="text-xs px-2.5 py-1 rounded-full font-medium">
                  {{ t.salesReport[order.status] || order.status }}
                </span>
              </td>
              <td v-if="!compact" class="px-4 py-3">
                <span :class="paymentColors[order.paymentStatus] || 'bg-gray-100 text-gray-600'" class="text-xs px-2.5 py-1 rounded-full font-medium">
                  {{ t.salesReport[order.paymentStatus] || order.paymentStatus || '-' }}
                </span>
              </td>
              <td class="px-4 py-3 text-gray-500 text-xs">{{ formatDate(order.createdAt) }}</td>
              <td class="px-4 py-3 text-right">
                <router-link
                  :to="`/admin/orders/${order._id}`"
                  class="inline-flex items-center gap-1 text-accent hover:text-accent-dark text-xs font-medium"
                >
                  <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                </router-link>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Sayfalama -->
      <div v-if="!compact && totalPages > 1" class="flex items-center justify-between px-4 py-3 border-t border-gray-200 bg-gray-50">
        <div class="text-xs text-gray-500">
          {{ t.salesReport.showing }} {{ (page - 1) * perPage + 1 }}-{{ Math.min(page * perPage, total) }} {{ t.salesReport.of }} {{ total }}
        </div>
        <div class="flex gap-1">
          <button
            @click="goToPage(page - 1)"
            :disabled="page <= 1"
            class="px-3 py-1 text-xs border rounded hover:bg-white disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {{ t.salesReport.previous }}
          </button>
          <button
            v-for="p in Math.min(totalPages, 5)"
            :key="p"
            @click="goToPage(p)"
            :class="[
              'px-3 py-1 text-xs border rounded',
              page === p ? 'bg-accent text-white border-accent' : 'hover:bg-white'
            ]"
          >
            {{ p }}
          </button>
          <button
            @click="goToPage(page + 1)"
            :disabled="page >= totalPages"
            class="px-3 py-1 text-xs border rounded hover:bg-white disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {{ t.salesReport.next }}
          </button>
        </div>
      </div>
    </div>

    <!-- Boş durum -->
    <div v-else class="text-center py-12 text-gray-400">
      <svg class="w-12 h-12 mx-auto mb-3 opacity-40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
      </svg>
      <p class="text-sm">{{ t.salesReport.noData }}</p>
    </div>
  </div>
</template>
