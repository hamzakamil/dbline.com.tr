<script setup>
import { ref, onMounted } from 'vue'
import { useLanguage } from '../../composables/useLanguage'
import api from '../../utils/api'

const { locale } = useLanguage()

const settings = ref({
  marketingPopup: {
    active: true,
    delaySeconds: 3,
    image: '',
    title: { tr: 'İlk Alışverişinde %10 İndirim', en: 'Get 10% Off Your First Order' },
    subtitle: { tr: 'Hoşgeldin indirimi için bilgilerini gir', en: 'Enter your details for a welcome discount' },
    discountPercent: 10,
    couponValidDays: 7,
    minOrderAmount: 0,
    whatsappMessageTemplate: ''
  }
})

const coupons = ref([])
const loading = ref(false)
const saved = ref(false)
const uploading = ref(false)
const stats = ref({ total: 0, used: 0, pending: 0 })

async function fetchData() {
  try {
    const [settingsRes, couponsRes] = await Promise.all([
      api.get(`/admin/settings`),
      api.get(`/coupons/admin/list`)
    ])
    if (settingsRes.data.marketingPopup) {
      settings.value.marketingPopup = { ...settings.value.marketingPopup, ...settingsRes.data.marketingPopup }
    }
    coupons.value = couponsRes.data.coupons || couponsRes.data || []
    calculateStats()
  } catch (error) {
    console.error(error)
  }
}

function calculateStats() {
  stats.value.total = coupons.value.length
  stats.value.used = coupons.value.filter(c => c.usedCount > 0).length
  stats.value.pending = coupons.value.filter(c => c.usedCount === 0 && c.active).length
}

async function uploadPopupImage(event) {
  const file = event.target.files[0]
  if (!file) return
  uploading.value = true
  const formData = new FormData()
  formData.append('image', file)
  try {
    const { data } = await api.post(`/upload`, formData, { headers: { 'Content-Type': 'multipart/form-data' } })
    settings.value.marketingPopup.image = data.url || data.path
  } catch { alert('Upload failed') }
  finally { uploading.value = false }
}

async function saveSettings() {
  loading.value = true
  saved.value = false
  try {
    await api.put(`/admin/settings`, settings.value)
    saved.value = true
    setTimeout(() => { saved.value = false }, 3000)
  } catch (error) { alert(error.response?.data?.message || 'Error') }
  finally { loading.value = false }
}

async function deleteCoupon(id) {
  if (!confirm(locale.value === 'tr' ? 'Bu kuponu silmek istediğinize emin misiniz?' : 'Are you sure you want to delete this coupon?')) return
  try {
    await api.delete(`/coupons/admin/${id}`)
    coupons.value = coupons.value.filter(c => c._id !== id)
    calculateStats()
  } catch (error) {
    alert(error.response?.data?.message || 'Error')
  }
}

function formatDate(d) {
  return new Date(d).toLocaleDateString('tr-TR', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

onMounted(fetchData)
</script>

<template>
  <div class="min-h-screen bg-gray-50">
    <div class="bg-dark-bg text-white">
      <div class="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
        <h1 class="text-lg font-heading">{{ locale === 'tr' ? 'Pazarlama & Kuponlar' : 'Marketing & Coupons' }}</h1>
        <router-link to="/" class="text-xs underline opacity-70 hover:opacity-100">{{ locale === 'tr' ? 'Siteye Dön' : 'Back to Site' }}</router-link>
      </div>
    </div>

    <div class="max-w-4xl mx-auto px-4 py-8">
      <nav class="flex flex-wrap gap-2 mb-8">
        <router-link to="/admin" class="px-4 py-2 bg-white border text-sm hover:bg-gray-50">Dashboard</router-link>
        <router-link to="/admin/products" class="px-4 py-2 bg-white border text-sm hover:bg-gray-50">{{ locale === 'tr' ? 'Ürünler' : 'Products' }}</router-link>
        <router-link to="/admin/categories" class="px-4 py-2 bg-white border text-sm hover:bg-gray-50">{{ locale === 'tr' ? 'Kategoriler' : 'Categories' }}</router-link>
        <router-link to="/admin/orders" class="px-4 py-2 bg-white border text-sm hover:bg-gray-50">{{ locale === 'tr' ? 'Siparişler' : 'Orders' }}</router-link>
        <router-link to="/admin/sales-report" class="px-4 py-2 bg-white border text-sm hover:bg-gray-50">{{ locale === 'tr' ? 'Satış Raporu' : 'Sales Report' }}</router-link>
        <router-link to="/admin/analytics" class="px-4 py-2 bg-white border text-sm hover:bg-gray-50">{{ locale === 'tr' ? 'Analitik' : 'Analytics' }}</router-link>
        <router-link to="/admin/marketing" class="px-4 py-2 bg-accent text-white text-sm">{{ locale === 'tr' ? 'Pazarlama' : 'Marketing' }}</router-link>
        <router-link to="/admin/reviews" class="px-4 py-2 bg-white border text-sm hover:bg-gray-50">{{ locale === 'tr' ? 'Yorumlar' : 'Reviews' }}</router-link>
        <router-link to="/admin/settings" class="px-4 py-2 bg-white border text-sm hover:bg-gray-50">{{ locale === 'tr' ? 'Ayarlar' : 'Settings' }}</router-link>
      </nav>

      <!-- İstatistikler -->
      <div class="grid grid-cols-3 gap-4 mb-6">
        <div class="bg-white border p-4 text-center">
          <div class="text-2xl font-bold">{{ stats.total }}</div>
          <div class="text-xs text-gray-500">{{ locale === 'tr' ? 'Toplam Kupon' : 'Total Coupons' }}</div>
        </div>
        <div class="bg-white border p-4 text-center">
          <div class="text-2xl font-bold text-green-600">{{ stats.used }}</div>
          <div class="text-xs text-gray-500">{{ locale === 'tr' ? 'Kullanılan' : 'Used' }}</div>
        </div>
        <div class="bg-white border p-4 text-center">
          <div class="text-2xl font-bold text-amber-600">{{ stats.pending }}</div>
          <div class="text-xs text-gray-500">{{ locale === 'tr' ? 'Bekleyen' : 'Pending' }}</div>
        </div>
      </div>

      <div v-if="saved" class="bg-green-50 border border-green-200 text-green-700 p-3 text-sm mb-6">
        {{ locale === 'tr' ? 'Ayarlar kaydedildi!' : 'Settings saved!' }}
      </div>

      <form @submit.prevent="saveSettings" class="space-y-6">
        <!-- WhatsApp Kampanya Ayarları -->
        <div class="bg-white border p-6">
          <h3 class="text-sm uppercase tracking-widest mb-4">{{ locale === 'tr' ? 'WhatsApp Kampanya Ayarları' : 'WhatsApp Campaign Settings' }}</h3>
          <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label class="text-xs text-gray-500 mb-1 block">{{ locale === 'tr' ? 'İndirim Oranı (%)' : 'Discount Rate (%)' }}</label>
              <input v-model.number="settings.marketingPopup.discountPercent" type="number" class="input-field" />
            </div>
            <div>
              <label class="text-xs text-gray-500 mb-1 block">{{ locale === 'tr' ? 'Kupon Geçerlilik (gün)' : 'Coupon Validity (days)' }}</label>
              <input v-model.number="settings.marketingPopup.couponValidDays" type="number" class="input-field" />
            </div>
            <div>
              <label class="text-xs text-gray-500 mb-1 block">{{ locale === 'tr' ? 'Min. Sipariş Tutarı' : 'Min. Order Amount' }}</label>
              <input v-model.number="settings.marketingPopup.minOrderAmount" type="number" class="input-field" />
            </div>
          </div>
        </div>

        <!-- Popup Ayarları -->
        <div class="bg-white border p-6">
          <div class="flex items-center justify-between mb-4">
            <h3 class="text-sm uppercase tracking-widest">{{ locale === 'tr' ? 'Popup Ayarları' : 'Popup Settings' }}</h3>
            <label class="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" v-model="settings.marketingPopup.active" class="w-4 h-4 accent-accent" />
              <span class="text-xs text-gray-500">{{ locale === 'tr' ? 'Aktif' : 'Active' }}</span>
            </label>
          </div>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label class="text-xs text-gray-500 mb-1 block">{{ locale === 'tr' ? 'Gösterim Gecikmesi (sn)' : 'Display Delay (sec)' }}</label>
              <input v-model.number="settings.marketingPopup.delaySeconds" type="number" class="input-field" />
            </div>
            <div>
              <label class="text-xs text-gray-500 mb-1 block">{{ locale === 'tr' ? 'Popup Görseli' : 'Popup Image' }}</label>
              <label class="btn-outline cursor-pointer text-xs inline-block">
                {{ uploading ? '...' : (locale === 'tr' ? 'Görsel Yükle' : 'Upload Image') }}
                <input type="file" accept="image/*" class="hidden" @change="uploadPopupImage" />
              </label>
            </div>
            <div>
              <label class="text-xs text-gray-500 mb-1 block">{{ locale === 'tr' ? 'Başlık (TR)' : 'Title (TR)' }}</label>
              <input v-model="settings.marketingPopup.title.tr" type="text" class="input-field" />
            </div>
            <div>
              <label class="text-xs text-gray-500 mb-1 block">{{ locale === 'tr' ? 'Başlık (EN)' : 'Title (EN)' }}</label>
              <input v-model="settings.marketingPopup.title.en" type="text" class="input-field" />
            </div>
            <div>
              <label class="text-xs text-gray-500 mb-1 block">{{ locale === 'tr' ? 'Alt Başlık (TR)' : 'Subtitle (TR)' }}</label>
              <input v-model="settings.marketingPopup.subtitle.tr" type="text" class="input-field" />
            </div>
            <div>
              <label class="text-xs text-gray-500 mb-1 block">{{ locale === 'tr' ? 'Alt Başlık (EN)' : 'Subtitle (EN)' }}</label>
              <input v-model="settings.marketingPopup.subtitle.en" type="text" class="input-field" />
            </div>
          </div>
        </div>

        <!-- WhatsApp Mesaj Şablonu -->
        <div class="bg-white border p-6">
          <h3 class="text-sm uppercase tracking-widest mb-4">{{ locale === 'tr' ? 'WhatsApp Mesaj Şablonu' : 'WhatsApp Message Template' }}</h3>
          <textarea
            v-model="settings.marketingPopup.whatsappMessageTemplate"
            rows="4"
            class="input-field text-sm"
            :placeholder="locale === 'tr' ? 'Merhaba {name}! DB Line\'a hoşgeldiniz. İndirim kodunuz: {code}. Geçerlilik: {expiry}.' : 'Hello {name}! Welcome to DB Line. Your discount code: {code}. Valid until: {expiry}.'"
          ></textarea>
          <p class="text-xs text-gray-400 mt-1">{{ locale === 'tr' ? 'Değişkenler: {name}, {code}, {expiry}' : 'Variables: {name}, {code}, {expiry}' }}</p>
        </div>

        <button type="submit" :disabled="loading" class="btn-primary">
          {{ loading ? '...' : (locale === 'tr' ? 'Kaydet' : 'Save') }}
        </button>
      </form>

      <!-- Kupon Listesi -->
      <div class="bg-white border p-6 mt-8">
        <h3 class="text-sm uppercase tracking-widest mb-4">{{ locale === 'tr' ? 'Kupon Listesi' : 'Coupon List' }}</h3>
        <div v-if="coupons.length === 0" class="text-center text-gray-400 py-8 text-sm">
          {{ locale === 'tr' ? 'Henüz kupon yok' : 'No coupons yet' }}
        </div>
        <div v-else class="overflow-x-auto">
          <table class="w-full text-sm">
            <thead>
              <tr class="border-b text-left">
                <th class="py-2 pr-4 text-xs text-gray-500 uppercase">{{ locale === 'tr' ? 'Kod' : 'Code' }}</th>
                <th class="py-2 pr-4 text-xs text-gray-500 uppercase">{{ locale === 'tr' ? 'Kişi' : 'Person' }}</th>
                <th class="py-2 pr-4 text-xs text-gray-500 uppercase">{{ locale === 'tr' ? 'Telefon' : 'Phone' }}</th>
                <th class="py-2 pr-4 text-xs text-gray-500 uppercase">{{ locale === 'tr' ? 'Kullanıldı' : 'Used' }}</th>
                <th class="py-2 pr-4 text-xs text-gray-500 uppercase">{{ locale === 'tr' ? 'Tarih' : 'Date' }}</th>
                <th class="py-2 text-xs text-gray-500 uppercase"></th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="coupon in coupons" :key="coupon._id" class="border-b last:border-0">
                <td class="py-2 pr-4 font-mono font-bold text-xs">{{ coupon.code }}</td>
                <td class="py-2 pr-4">{{ coupon.assignedTo?.name || '-' }}</td>
                <td class="py-2 pr-4 text-xs text-gray-500">{{ coupon.assignedTo?.phone || '-' }}</td>
                <td class="py-2 pr-4">
                  <span v-if="coupon.usedCount > 0" class="text-green-600 text-xs font-medium">{{ locale === 'tr' ? 'Evet' : 'Yes' }}</span>
                  <span v-else class="text-gray-400 text-xs">{{ locale === 'tr' ? 'Hayır' : 'No' }}</span>
                </td>
                <td class="py-2 pr-4 text-xs text-gray-500">{{ formatDate(coupon.createdAt) }}</td>
                <td class="py-2">
                  <button @click="deleteCoupon(coupon._id)" class="text-red-500 hover:text-red-700 text-xs">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  </div>
</template>
