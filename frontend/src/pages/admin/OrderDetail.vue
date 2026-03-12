<script setup>
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { useLanguage } from '../../composables/useLanguage'
import api from '../../utils/api'

const route = useRoute()
const { formatPrice, locale } = useLanguage()

const order = ref(null)
const loading = ref(true)
const updating = ref(false)
const newStatus = ref('')
const trackingNumber = ref('')
const cargoProvider = ref('manual')

// Fatura
const invoice = ref(null)
const generatingInvoice = ref(false)

// Kargo
const shipment = ref(null)

const statusOptions = ['pending', 'confirmed', 'preparing', 'shipped', 'delivered', 'cancelled']
const statusLabels = {
  pending: { tr: 'Bekliyor', en: 'Pending' },
  confirmed: { tr: 'Onaylandı', en: 'Confirmed' },
  preparing: { tr: 'Hazırlanıyor', en: 'Preparing' },
  shipped: { tr: 'Kargoda', en: 'Shipped' },
  delivered: { tr: 'Teslim Edildi', en: 'Delivered' },
  cancelled: { tr: 'İptal', en: 'Cancelled' }
}

const statusColors = {
  pending: 'bg-yellow-100 text-yellow-700 border-yellow-200',
  confirmed: 'bg-blue-100 text-blue-700 border-blue-200',
  preparing: 'bg-purple-100 text-purple-700 border-purple-200',
  shipped: 'bg-indigo-100 text-indigo-700 border-indigo-200',
  delivered: 'bg-green-100 text-green-700 border-green-200',
  cancelled: 'bg-red-100 text-red-700 border-red-200'
}

const cargoProviders = [
  { value: 'manual', label: { tr: 'Manuel', en: 'Manual' } },
  { value: 'yurtici', label: { tr: 'Yurtiçi Kargo', en: 'Yurtiçi Kargo' } },
  { value: 'aras', label: { tr: 'Aras Kargo', en: 'Aras Kargo' } },
  { value: 'mng', label: { tr: 'MNG Kargo', en: 'MNG Kargo' } },
  { value: 'ptt', label: { tr: 'PTT Kargo', en: 'PTT Kargo' } }
]

const shipmentStatusLabels = {
  created: { tr: 'Oluşturuldu', en: 'Created' },
  picked_up: { tr: 'Alındı', en: 'Picked Up' },
  in_transit: { tr: 'Yolda', en: 'In Transit' },
  out_for_delivery: { tr: 'Dağıtımda', en: 'Out for Delivery' },
  delivered: { tr: 'Teslim Edildi', en: 'Delivered' },
  returned: { tr: 'İade', en: 'Returned' }
}

async function fetchOrder() {
  try {
    const { data } = await api.get(`/orders/${route.params.id}`)
    order.value = data
    newStatus.value = data.status
    trackingNumber.value = data.trackingNumber || ''
  } catch (error) {
    console.error(error)
  } finally {
    loading.value = false
  }
}

async function fetchInvoice() {
  try {
    const { data } = await api.get(`/invoices/order/${route.params.id}`)
    invoice.value = data
  } catch {
    // Fatura henüz oluşturulmamış
  }
}

async function fetchShipment() {
  try {
    const { data } = await api.get(`/shipments/order/${route.params.id}`)
    shipment.value = data
    if (data.provider) cargoProvider.value = data.provider
  } catch {
    // Gönderi henüz oluşturulmamış
  }
}

async function updateStatus() {
  updating.value = true
  try {
    const payload = {
      status: newStatus.value,
      trackingNumber: trackingNumber.value,
      cargoProvider: cargoProvider.value
    }
    const { data } = await api.put(`/orders/${route.params.id}/status`, payload)
    order.value = data

    // Kargoya verildiyse shipment bilgisini yenile
    if (newStatus.value === 'shipped') {
      await fetchShipment()
    }
  } catch (error) {
    alert(error.response?.data?.message || 'Hata')
  } finally {
    updating.value = false
  }
}

async function generateInvoice() {
  generatingInvoice.value = true
  try {
    const { data } = await api.post(`/invoices/${route.params.id}`)
    invoice.value = data
    alert(locale.value === 'tr' ? 'Fatura başarıyla oluşturuldu!' : 'Invoice generated successfully!')
  } catch (error) {
    alert(error.response?.data?.message || 'Fatura oluşturulamadı')
  } finally {
    generatingInvoice.value = false
  }
}

async function downloadInvoice() {
  if (!invoice.value) return
  try {
    const response = await api.get(`/invoices/${invoice.value._id}/pdf`, { responseType: 'blob' })
    const url = window.URL.createObjectURL(new Blob([response.data]))
    const a = document.createElement('a')
    a.href = url
    a.download = `${invoice.value.invoiceNumber}.pdf`
    a.click()
    window.URL.revokeObjectURL(url)
  } catch (error) {
    alert(locale.value === 'tr' ? 'PDF indirilemedi' : 'Could not download PDF')
  }
}

// E-Fatura
const eInvoiceSubmitting = ref(false)
const eInvoiceChecking = ref(false)

const eInvoiceStatusLabels = {
  local_draft: { tr: 'Yerel Taslak', en: 'Local Draft' },
  sent_draft: { tr: 'Taslak Gönderildi', en: 'Draft Sent' },
  pending: { tr: 'Bekliyor', en: 'Pending' },
  in_progress: { tr: 'İşleniyor', en: 'In Progress' },
  completed: { tr: 'Tamamlandı', en: 'Completed' },
  error: { tr: 'Hata', en: 'Error' },
  cancelled: { tr: 'İptal', en: 'Cancelled' }
}

const eInvoiceStatusColors = {
  local_draft: 'bg-gray-100 text-gray-600',
  sent_draft: 'bg-blue-100 text-blue-700',
  pending: 'bg-yellow-100 text-yellow-700',
  in_progress: 'bg-indigo-100 text-indigo-700',
  completed: 'bg-green-100 text-green-700',
  error: 'bg-red-100 text-red-700',
  cancelled: 'bg-red-100 text-red-700'
}

async function submitEInvoice() {
  if (!invoice.value) return
  eInvoiceSubmitting.value = true
  try {
    const { data } = await api.post(`/invoices/${invoice.value._id}/e-invoice/submit`)
    invoice.value = data
    alert(locale.value === 'tr' ? 'E-fatura gönderildi!' : 'E-invoice submitted!')
  } catch (error) {
    alert(error.response?.data?.message || (locale.value === 'tr' ? 'E-fatura gönderilemedi' : 'E-invoice submission failed'))
  } finally {
    eInvoiceSubmitting.value = false
  }
}

async function formalizeEInvoice() {
  if (!invoice.value) return
  eInvoiceSubmitting.value = true
  try {
    const { data } = await api.post(`/invoices/${invoice.value._id}/e-invoice/formalize`)
    invoice.value = data
    alert(locale.value === 'tr' ? 'E-fatura onaylandı!' : 'E-invoice formalized!')
  } catch (error) {
    alert(error.response?.data?.message || (locale.value === 'tr' ? 'Onaylama başarısız' : 'Formalization failed'))
  } finally {
    eInvoiceSubmitting.value = false
  }
}

async function checkEInvoiceStatus() {
  if (!invoice.value) return
  eInvoiceChecking.value = true
  try {
    const { data } = await api.get(`/invoices/${invoice.value._id}/e-invoice/status`)
    invoice.value = data
  } catch (error) {
    alert(error.response?.data?.message || (locale.value === 'tr' ? 'Durum sorgulanamadı' : 'Could not check status'))
  } finally {
    eInvoiceChecking.value = false
  }
}

async function downloadOfficialPdf() {
  if (!invoice.value) return
  try {
    const response = await api.get(`/invoices/${invoice.value._id}/e-invoice/pdf`, { responseType: 'blob' })
    const url = window.URL.createObjectURL(new Blob([response.data]))
    const a = document.createElement('a')
    a.href = url
    a.download = `e-fatura-${invoice.value.invoiceNumber}.pdf`
    a.click()
    window.URL.revokeObjectURL(url)
  } catch (error) {
    alert(locale.value === 'tr' ? 'Resmi PDF indirilemedi' : 'Could not download official PDF')
  }
}

function formatDate(d) {
  return new Date(d).toLocaleDateString(locale.value === 'tr' ? 'tr-TR' : 'en-US', {
    day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit'
  })
}

onMounted(async () => {
  await fetchOrder()
  fetchInvoice()
  fetchShipment()
})
</script>

<template>
  <div class="min-h-screen bg-gray-50">
    <div class="bg-dark-bg text-white">
      <div class="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
        <h1 class="text-lg font-heading">{{ locale === 'tr' ? 'Sipariş Detayı' : 'Order Detail' }}</h1>
        <router-link to="/admin/orders" class="text-xs underline opacity-70 hover:opacity-100">{{ locale === 'tr' ? 'Geri' : 'Back' }}</router-link>
      </div>
    </div>

    <div v-if="loading" class="text-center py-20">
      <div class="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin mx-auto"></div>
    </div>

    <div v-else-if="order" class="max-w-5xl mx-auto px-4 py-8">
      <!-- Üst Bilgi Kartları -->
      <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <!-- Sipariş Bilgisi -->
        <div class="bg-white border border-gray-200 rounded-xl p-6">
          <h3 class="text-xs uppercase tracking-widest text-gray-500 mb-4">{{ locale === 'tr' ? 'Sipariş Bilgisi' : 'Order Info' }}</h3>
          <p class="text-sm mb-2"><span class="text-gray-400">ID:</span> <span class="font-mono font-medium">#{{ order._id.slice(-8).toUpperCase() }}</span></p>
          <p class="text-sm mb-2"><span class="text-gray-400">{{ locale === 'tr' ? 'Tarih' : 'Date' }}:</span> {{ formatDate(order.createdAt) }}</p>
          <p class="text-sm mb-2"><span class="text-gray-400">{{ locale === 'tr' ? 'Toplam' : 'Total' }}:</span> <span class="font-bold text-lg">{{ formatPrice(order.totalAmount) }}</span></p>
          <p class="text-sm">
            <span class="text-gray-400">{{ locale === 'tr' ? 'Durum' : 'Status' }}:</span>
            <span :class="statusColors[order.status]" class="text-xs px-2.5 py-1 rounded-full font-medium ml-1">
              {{ statusLabels[order.status]?.[locale] }}
            </span>
          </p>
        </div>

        <!-- Teslimat Adresi -->
        <div class="bg-white border border-gray-200 rounded-xl p-6">
          <h3 class="text-xs uppercase tracking-widest text-gray-500 mb-4">{{ locale === 'tr' ? 'Teslimat Adresi' : 'Shipping Address' }}</h3>
          <p class="text-sm font-medium mb-1">{{ order.shippingAddress.fullName }}</p>
          <p class="text-sm text-gray-500 mb-1">{{ order.shippingAddress.phone }}</p>
          <p class="text-sm text-gray-500 mb-1">{{ order.shippingAddress.street }}</p>
          <p class="text-sm text-gray-500">{{ order.shippingAddress.district }}, {{ order.shippingAddress.city }}</p>
        </div>

        <!-- Fatura -->
        <div class="bg-white border border-gray-200 rounded-xl p-6">
          <h3 class="text-xs uppercase tracking-widest text-gray-500 mb-4">{{ locale === 'tr' ? 'Fatura' : 'Invoice' }}</h3>
          <template v-if="invoice">
            <p class="text-sm mb-2"><span class="text-gray-400">{{ locale === 'tr' ? 'Fatura No' : 'Invoice #' }}:</span> <span class="font-mono font-medium">{{ invoice.invoiceNumber }}</span></p>
            <p class="text-sm mb-2"><span class="text-gray-400">{{ locale === 'tr' ? 'Tarih' : 'Date' }}:</span> {{ formatDate(invoice.issuedAt) }}</p>
            <p class="text-sm mb-4">
              <span :class="invoice.status === 'issued' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'" class="text-xs px-2 py-0.5 rounded-full">
                {{ invoice.status === 'issued' ? (locale === 'tr' ? 'Kesildi' : 'Issued') : (locale === 'tr' ? 'İptal' : 'Cancelled') }}
              </span>
            </p>
            <button @click="downloadInvoice" class="w-full flex items-center justify-center gap-2 px-4 py-2 bg-accent text-white text-xs font-medium rounded-lg hover:bg-accent-dark transition-colors">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              {{ locale === 'tr' ? 'PDF İndir' : 'Download PDF' }}
            </button>

            <!-- E-Fatura Bölümü -->
            <div v-if="invoice.eInvoice?.enabled" class="mt-4 pt-4 border-t border-gray-100">
              <p class="text-xs text-gray-400 uppercase tracking-wider mb-2">E-Fatura</p>
              <p class="text-xs mb-1">
                <span class="text-gray-400">ETTN:</span>
                <span class="font-mono text-[10px]">{{ invoice.eInvoice.ettn }}</span>
              </p>
              <p class="text-xs mb-1">
                <span class="text-gray-400">{{ locale === 'tr' ? 'Sağlayıcı' : 'Provider' }}:</span>
                <span class="font-medium capitalize">{{ invoice.eInvoice.provider }}</span>
              </p>
              <p class="text-xs mb-2">
                <span class="text-gray-400">{{ locale === 'tr' ? 'Durum' : 'Status' }}:</span>
                <span :class="eInvoiceStatusColors[invoice.eInvoice.eInvoiceStatus]" class="text-[10px] px-2 py-0.5 rounded-full ml-1">
                  {{ eInvoiceStatusLabels[invoice.eInvoice.eInvoiceStatus]?.[locale] }}
                </span>
              </p>
              <p v-if="invoice.eInvoice.errorMessage" class="text-[10px] text-red-500 mb-2">
                {{ invoice.eInvoice.errorMessage }}
              </p>
              <div class="flex gap-2 mt-2">
                <button @click="checkEInvoiceStatus" :disabled="eInvoiceChecking"
                  class="flex-1 text-[10px] px-2 py-1.5 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50">
                  {{ eInvoiceChecking ? '...' : (locale === 'tr' ? 'Durum Sorgula' : 'Check Status') }}
                </button>
                <button v-if="invoice.eInvoice.eInvoiceStatus === 'sent_draft'" @click="formalizeEInvoice" :disabled="eInvoiceSubmitting"
                  class="flex-1 text-[10px] px-2 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50">
                  {{ eInvoiceSubmitting ? '...' : (locale === 'tr' ? 'GİB\'e Gönder' : 'Submit to GIB') }}
                </button>
                <button v-if="invoice.eInvoice.eInvoiceStatus === 'completed'" @click="downloadOfficialPdf"
                  class="flex-1 text-[10px] px-2 py-1.5 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors">
                  {{ locale === 'tr' ? 'Resmi PDF' : 'Official PDF' }}
                </button>
              </div>
            </div>
            <!-- E-Faturaya Gönder butonu (henüz gönderilmemişse) -->
            <div v-else class="mt-3">
              <button @click="submitEInvoice" :disabled="eInvoiceSubmitting"
                class="w-full flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white text-[10px] font-medium rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50">
                <div v-if="eInvoiceSubmitting" class="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                {{ eInvoiceSubmitting ? '...' : (locale === 'tr' ? 'E-Faturaya Gönder' : 'Submit E-Invoice') }}
              </button>
            </div>
          </template>
          <template v-else>
            <p class="text-sm text-gray-400 mb-4">{{ locale === 'tr' ? 'Henüz fatura oluşturulmamış' : 'No invoice generated yet' }}</p>
            <button
              @click="generateInvoice"
              :disabled="generatingInvoice"
              class="w-full flex items-center justify-center gap-2 px-4 py-2 bg-green-600 text-white text-xs font-medium rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
            >
              <svg v-if="!generatingInvoice" class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <div v-else class="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              {{ generatingInvoice ? '...' : (locale === 'tr' ? 'Fatura Oluştur' : 'Generate Invoice') }}
            </button>
          </template>
        </div>
      </div>

      <!-- Ürünler -->
      <div class="bg-white border border-gray-200 rounded-xl p-6 mb-6">
        <h3 class="text-xs uppercase tracking-widest text-gray-500 mb-4">{{ locale === 'tr' ? 'Ürünler' : 'Items' }}</h3>
        <div v-for="item in order.items" :key="item._id" class="flex gap-4 py-3 border-b border-gray-100 last:border-0">
          <div class="w-16 h-16 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
            <img :src="item.image || '/placeholder.svg'" class="w-full h-full object-cover" />
          </div>
          <div class="flex-1 min-w-0">
            <p class="text-sm font-medium text-gray-800 truncate">{{ item.name }}</p>
            <p class="text-xs text-gray-400">{{ [item.size, item.color].filter(Boolean).join(' / ') }} x{{ item.quantity }}</p>
          </div>
          <p class="text-sm font-semibold text-gray-800 flex-shrink-0">{{ formatPrice(item.price * item.quantity) }}</p>
        </div>

        <!-- Toplam özet -->
        <div class="mt-4 pt-4 border-t border-gray-200 space-y-1 text-sm">
          <div v-if="order.discountAmount > 0" class="flex justify-between text-gray-500">
            <span>{{ locale === 'tr' ? 'İndirim' : 'Discount' }}</span>
            <span class="text-red-500">-{{ formatPrice(order.discountAmount) }}</span>
          </div>
          <div class="flex justify-between text-gray-500">
            <span>{{ locale === 'tr' ? 'Kargo' : 'Shipping' }}</span>
            <span>{{ order.shippingCost > 0 ? formatPrice(order.shippingCost) : (locale === 'tr' ? 'Ücretsiz' : 'Free') }}</span>
          </div>
          <div class="flex justify-between text-lg font-bold text-gray-800 pt-2">
            <span>{{ locale === 'tr' ? 'Toplam' : 'Total' }}</span>
            <span>{{ formatPrice(order.totalAmount) }}</span>
          </div>
        </div>
      </div>

      <!-- Kargo Bilgisi -->
      <div v-if="shipment" class="bg-white border border-gray-200 rounded-xl p-6 mb-6">
        <h3 class="text-xs uppercase tracking-widest text-gray-500 mb-4">{{ locale === 'tr' ? 'Kargo Bilgisi' : 'Shipping Info' }}</h3>

        <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
          <div>
            <p class="text-xs text-gray-400 mb-1">{{ locale === 'tr' ? 'Kargo Firması' : 'Provider' }}</p>
            <p class="text-sm font-medium">{{ cargoProviders.find(p => p.value === shipment.provider)?.label[locale] || shipment.provider }}</p>
          </div>
          <div>
            <p class="text-xs text-gray-400 mb-1">{{ locale === 'tr' ? 'Takip No' : 'Tracking #' }}</p>
            <p class="text-sm font-mono font-medium">{{ shipment.trackingNumber }}</p>
          </div>
          <div>
            <p class="text-xs text-gray-400 mb-1">{{ locale === 'tr' ? 'Durum' : 'Status' }}</p>
            <p class="text-sm font-medium">{{ shipmentStatusLabels[shipment.status]?.[locale] || shipment.status }}</p>
          </div>
          <div>
            <p class="text-xs text-gray-400 mb-1">{{ locale === 'tr' ? 'Takip Linki' : 'Track' }}</p>
            <a v-if="shipment.trackingUrl" :href="shipment.trackingUrl" target="_blank" class="text-xs text-accent hover:underline font-medium">
              {{ locale === 'tr' ? 'Takip Et' : 'Track' }} →
            </a>
            <span v-else class="text-xs text-gray-400">-</span>
          </div>
        </div>

        <!-- Kargo Durum Geçmişi -->
        <div v-if="shipment.statusHistory?.length" class="mt-4 pt-4 border-t border-gray-100">
          <p class="text-xs text-gray-400 uppercase tracking-wider mb-3">{{ locale === 'tr' ? 'Durum Geçmişi' : 'Status History' }}</p>
          <div class="space-y-2">
            <div v-for="(h, i) in shipment.statusHistory" :key="i" class="flex items-start gap-3">
              <div class="w-2 h-2 rounded-full bg-accent mt-1.5 flex-shrink-0"></div>
              <div>
                <p class="text-xs font-medium text-gray-700">{{ shipmentStatusLabels[h.status]?.[locale] || h.status }}</p>
                <p class="text-xs text-gray-400">{{ formatDate(h.date) }}</p>
                <p v-if="h.description" class="text-xs text-gray-500">{{ h.description }}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Durum Güncelleme + Kargo -->
      <div class="bg-white border border-gray-200 rounded-xl p-6">
        <h3 class="text-xs uppercase tracking-widest text-gray-500 mb-4">{{ locale === 'tr' ? 'Durum Güncelle' : 'Update Status' }}</h3>
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
          <div>
            <label class="text-xs text-gray-500 mb-1.5 block">{{ locale === 'tr' ? 'Durum' : 'Status' }}</label>
            <select v-model="newStatus" class="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-accent">
              <option v-for="s in statusOptions" :key="s" :value="s">{{ statusLabels[s][locale] }}</option>
            </select>
          </div>
          <div>
            <label class="text-xs text-gray-500 mb-1.5 block">{{ locale === 'tr' ? 'Kargo Firması' : 'Cargo Provider' }}</label>
            <select v-model="cargoProvider" class="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-accent">
              <option v-for="p in cargoProviders" :key="p.value" :value="p.value">{{ p.label[locale] }}</option>
            </select>
          </div>
          <div>
            <label class="text-xs text-gray-500 mb-1.5 block">{{ locale === 'tr' ? 'Kargo Takip No' : 'Tracking Number' }}</label>
            <input v-model="trackingNumber" type="text" class="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-accent" :placeholder="locale === 'tr' ? 'Takip numarası...' : 'Tracking number...'" />
          </div>
          <button
            @click="updateStatus"
            :disabled="updating"
            class="h-[42px] flex items-center justify-center gap-2 px-6 bg-accent text-white text-sm font-medium rounded-lg hover:bg-accent-dark transition-colors disabled:opacity-50"
          >
            <div v-if="updating" class="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            {{ updating ? '' : (locale === 'tr' ? 'Güncelle' : 'Update') }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
