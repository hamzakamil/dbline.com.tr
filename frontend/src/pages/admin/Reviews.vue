<script setup>
import { ref, onMounted, computed } from 'vue'
import { useLanguage } from '../../composables/useLanguage'
import api from '../../utils/api'

const { locale } = useLanguage()

const activeTab = ref('pending')
const reviews = ref([])
const pendingStats = ref({})
const loading = ref(true)
const replyText = ref({})
const replyingTo = ref(null)

const filteredReviews = computed(() => {
  if (activeTab.value === 'pending') return reviews.value.filter(r => r.status === 'pending')
  if (activeTab.value === 'approved') return reviews.value.filter(r => r.status === 'approved')
  if (activeTab.value === 'rejected') return reviews.value.filter(r => r.status === 'rejected')
  return reviews.value
})

async function fetchReviews() {
  loading.value = true
  try {
    const [pendingRes, allRes] = await Promise.all([
      api.get(`/reviews/admin/pending`),
      api.get(`/reviews/admin/all`)
    ])
    reviews.value = allRes.data.reviews || allRes.data || []
    pendingStats.value = pendingRes.data.stats || {}
  } catch (error) {
    console.error(error)
  } finally {
    loading.value = false
  }
}

async function approve(id) {
  try {
    await api.put(`/reviews/admin/${id}/approve`)
    const review = reviews.value.find(r => r._id === id)
    if (review) review.status = 'approved'
  } catch (error) {
    alert(error.response?.data?.message || 'Error')
  }
}

async function reject(id) {
  try {
    await api.put(`/reviews/admin/${id}/reject`)
    const review = reviews.value.find(r => r._id === id)
    if (review) review.status = 'rejected'
  } catch (error) {
    alert(error.response?.data?.message || 'Error')
  }
}

async function submitReply(id) {
  const text = replyText.value[id]
  if (!text) return
  try {
    await api.put(`/reviews/admin/${id}/reply`, { text })
    const review = reviews.value.find(r => r._id === id)
    if (review) review.adminReply = { text, repliedAt: new Date() }
    replyingTo.value = null
    replyText.value[id] = ''
  } catch (error) {
    alert(error.response?.data?.message || 'Error')
  }
}

function formatDate(d) {
  return new Date(d).toLocaleDateString('tr-TR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}

onMounted(fetchReviews)
</script>

<template>
  <div class="min-h-screen bg-gray-50">
    <div class="bg-dark-bg text-white">
      <div class="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
        <h1 class="text-lg font-heading">{{ locale === 'tr' ? 'Yorum Yönetimi' : 'Review Management' }}</h1>
        <router-link to="/" class="text-xs underline opacity-70 hover:opacity-100">{{ locale === 'tr' ? 'Siteye Dön' : 'Back to Site' }}</router-link>
      </div>
    </div>

    <div class="max-w-5xl mx-auto px-4 py-8">
      <nav class="flex flex-wrap gap-2 mb-8">
        <router-link to="/admin" class="px-4 py-2 bg-white border text-sm hover:bg-gray-50">Dashboard</router-link>
        <router-link to="/admin/products" class="px-4 py-2 bg-white border text-sm hover:bg-gray-50">{{ locale === 'tr' ? 'Ürünler' : 'Products' }}</router-link>
        <router-link to="/admin/categories" class="px-4 py-2 bg-white border text-sm hover:bg-gray-50">{{ locale === 'tr' ? 'Kategoriler' : 'Categories' }}</router-link>
        <router-link to="/admin/orders" class="px-4 py-2 bg-white border text-sm hover:bg-gray-50">{{ locale === 'tr' ? 'Siparişler' : 'Orders' }}</router-link>
        <router-link to="/admin/sales-report" class="px-4 py-2 bg-white border text-sm hover:bg-gray-50">{{ locale === 'tr' ? 'Satış Raporu' : 'Sales Report' }}</router-link>
        <router-link to="/admin/analytics" class="px-4 py-2 bg-white border text-sm hover:bg-gray-50">{{ locale === 'tr' ? 'Analitik' : 'Analytics' }}</router-link>
        <router-link to="/admin/marketing" class="px-4 py-2 bg-white border text-sm hover:bg-gray-50">{{ locale === 'tr' ? 'Pazarlama' : 'Marketing' }}</router-link>
        <router-link to="/admin/reviews" class="px-4 py-2 bg-accent text-white text-sm">{{ locale === 'tr' ? 'Yorumlar' : 'Reviews' }}</router-link>
        <router-link to="/admin/settings" class="px-4 py-2 bg-white border text-sm hover:bg-gray-50">{{ locale === 'tr' ? 'Ayarlar' : 'Settings' }}</router-link>
      </nav>

      <!-- İstatistikler -->
      <div class="grid grid-cols-4 gap-4 mb-6">
        <div class="bg-white border p-4 text-center">
          <div class="text-2xl font-bold">{{ reviews.length }}</div>
          <div class="text-xs text-gray-500">{{ locale === 'tr' ? 'Toplam' : 'Total' }}</div>
        </div>
        <div class="bg-white border p-4 text-center">
          <div class="text-2xl font-bold text-amber-600">{{ reviews.filter(r => r.status === 'pending').length }}</div>
          <div class="text-xs text-gray-500">{{ locale === 'tr' ? 'Bekleyen' : 'Pending' }}</div>
        </div>
        <div class="bg-white border p-4 text-center">
          <div class="text-2xl font-bold text-green-600">{{ reviews.filter(r => r.status === 'approved').length }}</div>
          <div class="text-xs text-gray-500">{{ locale === 'tr' ? 'Onaylanan' : 'Approved' }}</div>
        </div>
        <div class="bg-white border p-4 text-center">
          <div class="text-2xl font-bold">{{ pendingStats.averageRating?.toFixed(1) || '-' }}</div>
          <div class="text-xs text-gray-500">{{ locale === 'tr' ? 'Ort. Puan' : 'Avg. Rating' }}</div>
        </div>
      </div>

      <!-- Tab -->
      <div class="flex border-b mb-6">
        <button v-for="tab in [
          { key: 'pending', label: locale === 'tr' ? 'Bekleyen' : 'Pending' },
          { key: 'approved', label: locale === 'tr' ? 'Onaylanan' : 'Approved' },
          { key: 'rejected', label: locale === 'tr' ? 'Reddedilen' : 'Rejected' },
          { key: 'all', label: locale === 'tr' ? 'Tümü' : 'All' }
        ]" :key="tab.key"
          @click="activeTab = tab.key"
          class="px-4 py-2 text-sm border-b-2 transition-colors"
          :class="activeTab === tab.key ? 'border-accent text-accent' : 'border-transparent text-gray-500'"
        >{{ tab.label }}</button>
      </div>

      <!-- Loading -->
      <div v-if="loading" class="text-center py-12 text-gray-400">...</div>

      <!-- Boş -->
      <div v-else-if="filteredReviews.length === 0" class="text-center py-12 text-gray-400 text-sm">
        {{ locale === 'tr' ? 'Bu kategoride yorum yok' : 'No reviews in this category' }}
      </div>

      <!-- Yorum Kartları -->
      <div v-else class="space-y-4">
        <div v-for="review in filteredReviews" :key="review._id" class="bg-white border p-5">
          <div class="flex items-start justify-between">
            <div>
              <div class="flex gap-0.5 mb-1">
                <svg v-for="i in 5" :key="i" class="w-4 h-4" :class="i <= review.rating ? 'text-amber-400' : 'text-gray-200'" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
                </svg>
              </div>
              <div class="text-sm font-medium">{{ review.user?.name || review.guestName || 'Anonim' }}</div>
              <div v-if="review.product" class="text-xs text-gray-400 mt-0.5">
                {{ locale === 'tr' ? 'Ürün:' : 'Product:' }} {{ review.product?.name?.tr || review.product?.name?.en || '-' }}
              </div>
            </div>
            <div class="flex items-center gap-2">
              <span class="text-[10px] px-2 py-0.5 rounded" :class="{
                'bg-amber-50 text-amber-600': review.status === 'pending',
                'bg-green-50 text-green-600': review.status === 'approved',
                'bg-red-50 text-red-600': review.status === 'rejected'
              }">{{ review.status }}</span>
              <span class="text-xs text-gray-400">{{ formatDate(review.createdAt) }}</span>
            </div>
          </div>

          <h4 v-if="review.title" class="font-medium mt-2 text-sm">{{ review.title }}</h4>
          <p class="text-sm text-gray-600 mt-1">{{ review.comment }}</p>

          <!-- Medya -->
          <div v-if="review.mediaUrls?.length" class="flex gap-2 mt-2">
            <img v-for="(url, i) in review.mediaUrls" :key="i" :src="url" class="w-16 h-16 object-cover rounded border" />
          </div>

          <!-- Admin yanıtı -->
          <div v-if="review.adminReply?.text" class="mt-3 bg-gray-50 p-3 border-l-2 border-accent text-sm">
            <div class="text-xs text-gray-500 mb-1"><strong>{{ locale === 'tr' ? 'Admin Yanıtı' : 'Admin Reply' }}</strong></div>
            {{ review.adminReply.text }}
          </div>

          <!-- Aksiyon Butonları -->
          <div class="mt-3 flex flex-wrap gap-2">
            <button v-if="review.status === 'pending'" @click="approve(review._id)" class="text-xs bg-green-50 text-green-600 px-3 py-1.5 hover:bg-green-100 transition-colors">
              {{ locale === 'tr' ? 'Onayla' : 'Approve' }}
            </button>
            <button v-if="review.status === 'pending'" @click="reject(review._id)" class="text-xs bg-red-50 text-red-600 px-3 py-1.5 hover:bg-red-100 transition-colors">
              {{ locale === 'tr' ? 'Reddet' : 'Reject' }}
            </button>
            <button @click="replyingTo = replyingTo === review._id ? null : review._id" class="text-xs bg-gray-50 text-gray-600 px-3 py-1.5 hover:bg-gray-100 transition-colors">
              {{ locale === 'tr' ? 'Yanıtla' : 'Reply' }}
            </button>
          </div>

          <!-- Yanıt formu -->
          <div v-if="replyingTo === review._id" class="mt-3 flex gap-2">
            <input v-model="replyText[review._id]" type="text" class="input-field flex-1 text-sm"
              :placeholder="locale === 'tr' ? 'Yanıtınızı yazın...' : 'Write your reply...'" />
            <button @click="submitReply(review._id)" class="btn-primary text-xs">
              {{ locale === 'tr' ? 'Gönder' : 'Send' }}
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
