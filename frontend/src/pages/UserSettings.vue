<script setup>
import { ref, onMounted } from 'vue'
import { useHead } from '@unhead/vue'
import { useLanguage } from '../composables/useLanguage'
import { useAuthStore } from '../stores/auth'
import api from '../utils/api'

const { locale } = useLanguage()
const auth = useAuthStore()

useHead({
  title: () => locale.value === 'tr' ? 'Ayarlarim | DB Line Official' : 'My Settings | DB Line Official',
  meta: [{ name: 'robots', content: 'noindex, nofollow' }]
})

const loading = ref(false)
const saved = ref(false)

// Bildirim Kanalları
const channels = ref({
  email: true,
  push: false,
  whatsapp: false,
  whatsappNumber: ''
})

// Bildirim Türleri
const preferences = ref({
  orderUpdates: true,
  promotions: false,
  priceDrops: false,
  stockAlerts: false,
  newsletter: false
})

// Zaman Damgası Tercihi
const timestampScope = ref('all')
const specificDocuments = ref([])

async function fetchPreferences() {
  try {
    const token = localStorage.getItem('token')
    const { data } = await api.get(`/notifications/preferences`, {
      headers: { Authorization: `Bearer ${token}` }
    })

    if (data.notifications) {
      channels.value.email = data.notifications.email ?? true
      channels.value.push = data.notifications.push ?? false
      channels.value.whatsapp = data.notifications.whatsapp ?? false
      channels.value.whatsappNumber = data.notifications.whatsappNumber || ''
      if (data.notifications.preferences) {
        preferences.value = { ...preferences.value, ...data.notifications.preferences }
      }
    }

    if (data.timestampPreference) {
      timestampScope.value = data.timestampPreference.scope || 'all'
      specificDocuments.value = data.timestampPreference.specificDocuments || []
    }
  } catch (error) {
    console.error('Tercihler yüklenemedi:', error)
  }
}

async function savePreferences() {
  loading.value = true
  saved.value = false
  try {
    const token = localStorage.getItem('token')
    await api.put(`/notifications/preferences`, {
      notifications: {
        email: channels.value.email,
        push: channels.value.push,
        whatsapp: channels.value.whatsapp,
        whatsappNumber: channels.value.whatsappNumber,
        preferences: preferences.value
      },
      timestampPreference: {
        scope: timestampScope.value,
        specificDocuments: timestampScope.value === 'specific' ? specificDocuments.value : []
      }
    }, {
      headers: { Authorization: `Bearer ${token}` }
    })
    saved.value = true
    setTimeout(() => { saved.value = false }, 3000)
  } catch (error) {
    alert(error.response?.data?.message || 'Hata olustu')
  } finally {
    loading.value = false
  }
}

function toggleDocument(doc) {
  const idx = specificDocuments.value.indexOf(doc)
  if (idx > -1) {
    specificDocuments.value.splice(idx, 1)
  } else {
    specificDocuments.value.push(doc)
  }
}

onMounted(fetchPreferences)
</script>

<template>
  <div class="page-width py-8">
    <h1 class="text-2xl font-heading mb-8">{{ locale === 'tr' ? 'Ayarlarım' : 'My Settings' }}</h1>

    <div v-if="saved" class="bg-green-50 border border-green-200 text-green-700 p-3 text-sm mb-6">
      {{ locale === 'tr' ? 'Tercihleriniz kaydedildi!' : 'Your preferences have been saved!' }}
    </div>

    <form @submit.prevent="savePreferences" class="space-y-8 max-w-2xl">

      <!-- Bildirim Kanalları -->
      <div class="bg-white border p-6">
        <h2 class="text-sm uppercase tracking-widest mb-5 font-medium">
          {{ locale === 'tr' ? 'Bildirim Kanallari' : 'Notification Channels' }}
        </h2>

        <div class="space-y-4">
          <!-- E-posta -->
          <label class="flex items-center gap-3 cursor-pointer">
            <input type="checkbox" v-model="channels.email" class="w-5 h-5 accent-accent" />
            <div>
              <span class="text-sm font-medium">{{ locale === 'tr' ? 'E-posta Bildirimleri' : 'Email Notifications' }}</span>
              <p class="text-xs text-gray-400">{{ locale === 'tr' ? 'Siparis durumu ve kampanya bildirimleri e-posta ile' : 'Order updates and promotions via email' }}</p>
            </div>
          </label>

          <!-- Push -->
          <label class="flex items-center gap-3 cursor-pointer">
            <input type="checkbox" v-model="channels.push" class="w-5 h-5 accent-accent" />
            <div>
              <span class="text-sm font-medium">{{ locale === 'tr' ? 'Push Bildirimleri' : 'Push Notifications' }}</span>
              <p class="text-xs text-gray-400">{{ locale === 'tr' ? 'Tarayici uzerinden anlik bildirimler' : 'Real-time browser notifications' }}</p>
            </div>
          </label>

          <!-- WhatsApp -->
          <div>
            <label class="flex items-center gap-3 cursor-pointer">
              <input type="checkbox" v-model="channels.whatsapp" class="w-5 h-5 accent-accent" />
              <div>
                <span class="text-sm font-medium">{{ locale === 'tr' ? 'WhatsApp Bildirimleri' : 'WhatsApp Notifications' }}</span>
                <p class="text-xs text-gray-400">{{ locale === 'tr' ? 'Siparis guncellemelerini WhatsApp uzerinden alin' : 'Receive order updates via WhatsApp' }}</p>
              </div>
            </label>
            <!-- WhatsApp numara girişi -->
            <div v-if="channels.whatsapp" class="ml-8 mt-3">
              <label class="text-xs text-gray-500 mb-1 block">{{ locale === 'tr' ? 'WhatsApp Numaraniz' : 'Your WhatsApp Number' }}</label>
              <input
                v-model="channels.whatsappNumber"
                type="tel"
                placeholder="+90 5XX XXX XX XX"
                class="input-field max-w-xs"
              />
            </div>
          </div>
        </div>
      </div>

      <!-- Bildirim Türleri -->
      <div class="bg-white border p-6">
        <h2 class="text-sm uppercase tracking-widest mb-5 font-medium">
          {{ locale === 'tr' ? 'Bildirim Turleri' : 'Notification Types' }}
        </h2>

        <div class="space-y-3">
          <label class="flex items-center gap-3 cursor-pointer">
            <input type="checkbox" v-model="preferences.orderUpdates" class="w-5 h-5 accent-accent" />
            <span class="text-sm">{{ locale === 'tr' ? 'Siparis guncellemeleri' : 'Order updates' }}</span>
          </label>

          <label class="flex items-center gap-3 cursor-pointer">
            <input type="checkbox" v-model="preferences.promotions" class="w-5 h-5 accent-accent" />
            <span class="text-sm">{{ locale === 'tr' ? 'Promosyon ve kampanyalar' : 'Promotions and campaigns' }}</span>
          </label>

          <label class="flex items-center gap-3 cursor-pointer">
            <input type="checkbox" v-model="preferences.priceDrops" class="w-5 h-5 accent-accent" />
            <span class="text-sm">{{ locale === 'tr' ? 'Fiyat dususu bildirimleri' : 'Price drop alerts' }}</span>
          </label>

          <label class="flex items-center gap-3 cursor-pointer">
            <input type="checkbox" v-model="preferences.stockAlerts" class="w-5 h-5 accent-accent" />
            <span class="text-sm">{{ locale === 'tr' ? 'Stok bildirimleri' : 'Stock alerts' }}</span>
          </label>

          <label class="flex items-center gap-3 cursor-pointer">
            <input type="checkbox" v-model="preferences.newsletter" class="w-5 h-5 accent-accent" />
            <span class="text-sm">{{ locale === 'tr' ? 'Haftalik bulten' : 'Weekly newsletter' }}</span>
          </label>
        </div>
      </div>

      <!-- Zaman Damgası Tercihi -->
      <div class="bg-white border p-6">
        <h2 class="text-sm uppercase tracking-widest mb-5 font-medium">
          {{ locale === 'tr' ? 'Zaman Damgasi Tercihi' : 'Timestamp Preference' }}
        </h2>
        <p class="text-xs text-gray-400 mb-4">
          {{ locale === 'tr'
            ? 'Belgelerde zaman damgasi gosterim tercihinizi secin.'
            : 'Choose your timestamp display preference for documents.'
          }}
        </p>

        <div class="space-y-3">
          <label class="flex items-center gap-3 cursor-pointer">
            <input type="radio" v-model="timestampScope" value="all" name="timestamp" class="w-5 h-5 accent-accent" />
            <span class="text-sm">{{ locale === 'tr' ? 'Tum belgeler' : 'All documents' }}</span>
          </label>

          <label class="flex items-center gap-3 cursor-pointer">
            <input type="radio" v-model="timestampScope" value="specific" name="timestamp" class="w-5 h-5 accent-accent" />
            <span class="text-sm">{{ locale === 'tr' ? 'Belirli belgeler' : 'Specific documents' }}</span>
          </label>

          <!-- Belirli belgeler seçimi -->
          <div v-if="timestampScope === 'specific'" class="ml-8 space-y-2 mt-2">
            <label class="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                :checked="specificDocuments.includes('order')"
                @change="toggleDocument('order')"
                class="w-4 h-4 accent-accent"
              />
              <span class="text-sm">{{ locale === 'tr' ? 'Siparis belgeleri' : 'Order documents' }}</span>
            </label>

            <label class="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                :checked="specificDocuments.includes('invoice')"
                @change="toggleDocument('invoice')"
                class="w-4 h-4 accent-accent"
              />
              <span class="text-sm">{{ locale === 'tr' ? 'Fatura belgeleri' : 'Invoice documents' }}</span>
            </label>

            <label class="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                :checked="specificDocuments.includes('shipping')"
                @change="toggleDocument('shipping')"
                class="w-4 h-4 accent-accent"
              />
              <span class="text-sm">{{ locale === 'tr' ? 'Kargo belgeleri' : 'Shipping documents' }}</span>
            </label>
          </div>
        </div>
      </div>

      <!-- Kaydet -->
      <button type="submit" :disabled="loading" class="btn-primary">
        {{ loading ? '...' : (locale === 'tr' ? 'Tercihleri Kaydet' : 'Save Preferences') }}
      </button>
    </form>
  </div>
</template>
