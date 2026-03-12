<script setup>
import { ref, onMounted, computed } from 'vue'
import { useLanguage } from '../../composables/useLanguage'
import { useAuthStore } from '../../stores/auth'
import { useProductStore } from '../../stores/products'
import api from '../../utils/api'

const props = defineProps({
  productId: { type: String, required: true }
})

const { locale, localized } = useLanguage()
const auth = useAuthStore()
const productStore = useProductStore()

const reviews = ref([])
const stats = ref({ average: 0, total: 0, distribution: {}, photoCount: 0 })
const loading = ref(true)
const sortBy = ref('recent')
const filter = ref('')

// Modal state
const showModal = ref(false)
const modalStep = ref(1) // 1: yıldız seçimi, 2: yorum yazma, 3: bilgiler & gönder
const submitting = ref(false)
const submitSuccess = ref(false)

const form = ref({
  rating: 0,
  title: '',
  comment: '',
  guestName: '',
  guestEmail: '',
  whatsappOptIn: false,
  whatsappNumber: ''
})

const hoverRating = ref(0)

const product = computed(() => productStore.product)
const productImage = computed(() => product.value?.images?.[0] || '/placeholder.svg')
const productName = computed(() => product.value ? localized(product.value.name) : '')

const filteredReviews = computed(() => {
  let filtered = [...reviews.value]
  if (filter.value === 'photos') {
    filtered = filtered.filter(r => r.mediaUrls && r.mediaUrls.length > 0)
  }
  return filtered
})

function openReviewModal() {
  form.value = { rating: 0, title: '', comment: '', guestName: '', guestEmail: '', whatsappOptIn: false, whatsappNumber: '' }
  modalStep.value = 1
  submitSuccess.value = false
  showModal.value = true
}

function closeModal() {
  showModal.value = false
}

function selectRating(star) {
  form.value.rating = star
}

function goToStep2() {
  if (form.value.rating > 0) {
    modalStep.value = 2
  }
}

function goBack() {
  if (modalStep.value === 3) {
    modalStep.value = 2
  } else if (modalStep.value === 2) {
    modalStep.value = 1
  }
}

function goToStep3() {
  if (form.value.comment) {
    if (auth.isLoggedIn) {
      submitReview()
    } else {
      modalStep.value = 3
    }
  }
}

async function submitReview() {
  if (!form.value.comment || !form.value.rating) return
  submitting.value = true
  try {
    const res = await api.post(`/reviews/${props.productId}`, form.value)
    submitSuccess.value = true
    setTimeout(() => {
      closeModal()
      fetchReviews()
    }, 2000)
  } catch (error) {
    alert(error.response?.data?.message || 'Error')
  } finally {
    submitting.value = false
  }
}

async function fetchReviews() {
  loading.value = true
  try {
    const { data } = await api.get(`/reviews/${props.productId}`, {
      params: { sort: sortBy.value, filter: filter.value }
    })
    reviews.value = data.reviews || []
    stats.value = data.stats || stats.value
  } catch (error) {
    console.error(error)
  } finally {
    loading.value = false
  }
}

async function markHelpful(reviewId) {
  try {
    await api.post(`/reviews/${reviewId}/helpful`)
    const review = reviews.value.find(r => r._id === reviewId)
    if (review) review.helpfulCount++
  } catch {
    // zaten oy verilmiş olabilir
  }
}

function formatDate(d) {
  return new Date(d).toLocaleDateString('tr-TR', { day: '2-digit', month: 'long', year: 'numeric' })
}

function changeSort(val) {
  sortBy.value = val
  fetchReviews()
}

onMounted(fetchReviews)
</script>

<template>
  <section class="py-12" id="reviews">
    <div class="page-width">
      <h2 class="section-title">{{ locale === 'tr' ? 'Müşteri Yorumları' : 'Customer Reviews' }}</h2>

      <!-- Özet Bölümü -->
      <div class="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
        <!-- Sol: Ortalama puan ve dağılım -->
        <div class="bg-white border p-6">
          <div class="flex items-center gap-6">
            <div class="text-center">
              <div class="text-4xl font-bold">{{ stats.average?.toFixed(1) || '0.0' }}</div>
              <div class="flex gap-0.5 justify-center my-1">
                <svg v-for="i in 5" :key="i" class="w-5 h-5" :class="i <= Math.round(stats.average || 0) ? 'text-amber-400' : 'text-gray-200'" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
                </svg>
              </div>
              <div class="text-xs text-gray-500">{{ stats.total || 0 }} {{ locale === 'tr' ? 'yorum' : 'reviews' }}</div>
            </div>
            <div class="flex-1 space-y-1.5">
              <div v-for="star in [5, 4, 3, 2, 1]" :key="star" class="flex items-center gap-2">
                <span class="text-xs text-gray-500 w-3">{{ star }}</span>
                <div class="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div class="h-full bg-amber-400 rounded-full" :style="{ width: (stats.distribution?.[star] || 0) + '%' }"></div>
                </div>
                <span class="text-xs text-gray-400 w-8 text-right">{{ stats.distribution?.[star] || 0 }}%</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Sağ: Yorum yaz butonu -->
        <div class="flex flex-col items-center justify-center bg-white border p-6">
          <p class="text-sm text-gray-500 mb-4">
            {{ locale === 'tr' ? 'Bu ürünü kullandınız mı?' : 'Have you used this product?' }}
          </p>
          <button @click="openReviewModal" class="btn-accent" :style="{ borderRadius: 'var(--btn-radius)' }">
            {{ locale === 'tr' ? 'Yorum Yaz' : 'Write a Review' }}
          </button>
        </div>
      </div>

      <!-- ====== YORUM YAZMA MODALI ====== -->
      <Teleport to="body">
        <Transition name="modal-fade">
          <div v-if="showModal" class="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <!-- Overlay -->
            <div class="absolute inset-0 bg-black/50" @click="closeModal"></div>

            <!-- Modal -->
            <div class="relative bg-white w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-xl" @click.stop>
              <!-- Kapat butonu -->
              <button @click="closeModal" class="absolute top-4 right-4 text-gray-400 hover:text-gray-600 z-10">
                <svg class="w-6 h-6" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>

              <!-- Başarılı gönderim -->
              <div v-if="submitSuccess" class="p-10 text-center">
                <div class="w-16 h-16 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg class="w-8 h-8 text-green-500" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <h3 class="text-xl font-heading mb-2">{{ locale === 'tr' ? 'Teşekkürler!' : 'Thank you!' }}</h3>
                <p class="text-sm text-gray-500">{{ locale === 'tr' ? 'Yorumunuz incelenmek üzere gönderildi.' : 'Your review has been submitted for approval.' }}</p>
              </div>

              <!-- ADIM 1: Yıldız Seçimi -->
              <div v-else-if="modalStep === 1" class="p-8 text-center">
                <h3 class="text-xl font-heading mb-2">
                  {{ locale === 'tr' ? 'Bu ürünü nasıl değerlendirirsiniz?' : 'How would you rate this product?' }}
                </h3>
                <p class="text-sm text-gray-400 mb-6">
                  {{ locale === 'tr' ? 'Deneyiminiz hakkında biraz bilgi vermek ister misiniz?' : 'We would love it if you would share a bit about your experience.' }}
                </p>

                <!-- Ürün görseli -->
                <div class="w-32 h-32 mx-auto mb-4 overflow-hidden bg-gray-50">
                  <img :src="productImage" :alt="productName" class="w-full h-full object-cover" />
                </div>
                <p class="font-heading text-lg mb-6">{{ productName }}</p>

                <!-- Büyük yıldızlar -->
                <div class="flex items-center justify-center gap-3 mb-3">
                  <button
                    v-for="i in 5"
                    :key="i"
                    type="button"
                    @click="selectRating(i)"
                    @mouseenter="hoverRating = i"
                    @mouseleave="hoverRating = 0"
                    class="transition-transform hover:scale-110"
                  >
                    <svg
                      class="w-12 h-12 md:w-14 md:h-14 transition-colors"
                      :class="i <= (hoverRating || form.rating) ? 'text-amber-400' : 'text-gray-200'"
                      fill="currentColor" viewBox="0 0 20 20"
                    >
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
                    </svg>
                  </button>
                </div>
                <div class="flex justify-between text-xs text-gray-400 max-w-xs mx-auto mb-8">
                  <span>{{ locale === 'tr' ? 'Kötü' : 'Poor' }}</span>
                  <span>{{ locale === 'tr' ? 'Harika' : 'Great' }}</span>
                </div>

                <!-- İleri butonu -->
                <button
                  @click="goToStep2"
                  :disabled="form.rating === 0"
                  class="btn-accent px-10 py-3 text-sm disabled:opacity-30 disabled:cursor-not-allowed"
                  :style="{ borderRadius: 'var(--btn-radius)' }"
                >
                  {{ locale === 'tr' ? 'Devam' : 'Next' }}
                </button>
              </div>

              <!-- ADIM 2: Yorum Yazma -->
              <div v-else-if="modalStep === 2" class="p-8">
                <!-- Ürün adı + seçili yıldızlar -->
                <h3 class="text-lg font-heading text-center mb-2">{{ productName }}</h3>
                <div class="flex items-center justify-center gap-1 mb-1">
                  <svg
                    v-for="i in 5"
                    :key="i"
                    class="w-8 h-8"
                    :class="i <= form.rating ? 'text-amber-400' : 'text-gray-200'"
                    fill="currentColor" viewBox="0 0 20 20"
                  >
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
                  </svg>
                </div>
                <div class="flex justify-between text-xs text-gray-400 max-w-[200px] mx-auto mb-6">
                  <span>{{ locale === 'tr' ? 'Kötü' : 'Poor' }}</span>
                  <span>{{ locale === 'tr' ? 'Harika' : 'Great' }}</span>
                </div>

                <!-- Yorum başlığı -->
                <div class="mb-4">
                  <label class="text-sm text-gray-700 mb-1.5 block">{{ locale === 'tr' ? 'Başlık (opsiyonel)' : 'Title (optional)' }}</label>
                  <input
                    v-model="form.title"
                    type="text"
                    class="w-full border border-gray-300 px-4 py-2.5 text-sm focus:outline-none focus:border-gray-500 transition-colors"
                    :placeholder="locale === 'tr' ? 'Yorumunuza bir başlık verin' : 'Give your review a title'"
                  />
                </div>

                <!-- Yorum metni -->
                <div class="mb-6">
                  <label class="text-sm text-gray-700 mb-1.5 block">{{ locale === 'tr' ? 'Yorum içeriği' : 'Review content' }}</label>
                  <textarea
                    v-model="form.comment"
                    rows="5"
                    class="w-full border border-gray-300 px-4 py-3 text-sm focus:outline-none focus:border-gray-500 transition-colors resize-none"
                    :placeholder="locale === 'tr' ? 'Yazmaya başlayın...' : 'Start writing here...'"
                  ></textarea>
                </div>

                <!-- Bilgilendirme metni -->
                <p class="text-xs text-gray-400 mb-6 text-center">
                  {{ locale === 'tr'
                    ? 'Yorumunuz yalnızca gerekli olduğunda sizinle iletişime geçmek için kullanılacaktır. Yorumunuzu göndererek kullanım koşullarımızı ve gizlilik politikamızı kabul etmiş olursunuz.'
                    : "We'll only contact you about your review if necessary. By submitting your review, you agree to our terms of conditions and privacy policy."
                  }}
                </p>

                <!-- Butonlar -->
                <div class="flex items-center justify-between">
                  <button @click="goBack" class="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 transition-colors">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
                    </svg>
                    {{ locale === 'tr' ? 'Geri' : 'Back' }}
                  </button>
                  <button
                    @click="goToStep3"
                    :disabled="!form.comment"
                    class="btn-accent px-10 py-3 text-sm disabled:opacity-30 disabled:cursor-not-allowed"
                    :style="{ borderRadius: 'var(--btn-radius)' }"
                  >
                    {{ locale === 'tr' ? (auth.isLoggedIn ? 'Gönder' : 'Devam') : (auth.isLoggedIn ? 'Submit' : 'Next') }}
                  </button>
                </div>
              </div>

              <!-- ADIM 3: Misafir Bilgileri (sadece giriş yapmamışsa) -->
              <div v-else-if="modalStep === 3" class="p-8">
                <h3 class="text-lg font-heading text-center mb-2">{{ locale === 'tr' ? 'Son bir adım' : 'One last step' }}</h3>
                <p class="text-sm text-gray-400 text-center mb-6">{{ locale === 'tr' ? 'Bilgilerinizi girin' : 'Enter your details' }}</p>

                <div class="space-y-4 mb-6">
                  <div>
                    <label class="text-sm text-gray-700 mb-1.5 block">{{ locale === 'tr' ? 'Adınız' : 'Your Name' }} *</label>
                    <input
                      v-model="form.guestName"
                      type="text"
                      class="w-full border border-gray-300 px-4 py-2.5 text-sm focus:outline-none focus:border-gray-500 transition-colors"
                      required
                    />
                  </div>
                  <div>
                    <label class="text-sm text-gray-700 mb-1.5 block">E-posta ({{ locale === 'tr' ? 'opsiyonel' : 'optional' }})</label>
                    <input
                      v-model="form.guestEmail"
                      type="email"
                      class="w-full border border-gray-300 px-4 py-2.5 text-sm focus:outline-none focus:border-gray-500 transition-colors"
                    />
                  </div>

                  <!-- WhatsApp opt-in -->
                  <div class="space-y-2">
                    <label class="flex items-center gap-2 cursor-pointer">
                      <input type="checkbox" v-model="form.whatsappOptIn" class="w-4 h-4 accent-amber-500" />
                      <span class="text-xs text-gray-500">{{ locale === 'tr' ? 'Yorumum yayınlandığında WhatsApp ile bilgilendir' : 'Notify me via WhatsApp when published' }}</span>
                    </label>
                    <input
                      v-if="form.whatsappOptIn"
                      v-model="form.whatsappNumber"
                      type="tel"
                      class="w-full border border-gray-300 px-4 py-2.5 text-sm focus:outline-none focus:border-gray-500 transition-colors"
                      :placeholder="'+90...'"
                    />
                  </div>
                </div>

                <!-- Butonlar -->
                <div class="flex items-center justify-between">
                  <button @click="goBack" class="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 transition-colors">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
                    </svg>
                    {{ locale === 'tr' ? 'Geri' : 'Back' }}
                  </button>
                  <button
                    @click="submitReview"
                    :disabled="submitting || !form.guestName"
                    class="btn-accent px-10 py-3 text-sm disabled:opacity-30 disabled:cursor-not-allowed"
                    :style="{ borderRadius: 'var(--btn-radius)' }"
                  >
                    {{ submitting ? '...' : (locale === 'tr' ? 'Gönder' : 'Submit') }}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </Transition>
      </Teleport>

      <!-- Filtreler -->
      <div class="flex flex-wrap items-center gap-3 mb-6">
        <button
          v-for="opt in [
            { value: 'recent', label: locale === 'tr' ? 'En Yeniler' : 'Most Recent' },
            { value: 'highest', label: locale === 'tr' ? 'En Yüksek Puan' : 'Highest Rated' },
            { value: 'helpful', label: locale === 'tr' ? 'En Faydalı' : 'Most Helpful' }
          ]"
          :key="opt.value"
          @click="changeSort(opt.value)"
          class="px-3 py-1.5 text-xs border transition-colors"
          :class="sortBy === opt.value ? 'border-accent text-accent' : 'border-gray-200 text-gray-500 hover:border-gray-400'"
        >{{ opt.label }}</button>
        <button
          @click="filter = filter === 'photos' ? '' : 'photos'; fetchReviews()"
          class="px-3 py-1.5 text-xs border transition-colors"
          :class="filter === 'photos' ? 'border-accent text-accent' : 'border-gray-200 text-gray-500 hover:border-gray-400'"
        >{{ locale === 'tr' ? 'Fotoğraflı' : 'With Photos' }} ({{ stats.photoCount || 0 }})</button>
      </div>

      <!-- Yorum Listesi -->
      <div v-if="loading" class="space-y-4">
        <div v-for="i in 3" :key="i" class="bg-white border p-6 animate-pulse">
          <div class="h-4 bg-gray-200 rounded w-1/4 mb-3"></div>
          <div class="h-3 bg-gray-200 rounded w-3/4 mb-2"></div>
          <div class="h-3 bg-gray-200 rounded w-1/2"></div>
        </div>
      </div>

      <div v-else-if="filteredReviews.length === 0" class="text-center py-12 text-gray-400 text-sm">
        {{ locale === 'tr' ? 'Henüz yorum yok. İlk yorumu siz yazın!' : 'No reviews yet. Be the first to write one!' }}
      </div>

      <div v-else class="space-y-4">
        <div v-for="review in filteredReviews" :key="review._id" class="bg-white border p-6">
          <div class="flex items-start justify-between">
            <div>
              <!-- Yıldızlar -->
              <div class="flex gap-0.5 mb-1">
                <svg v-for="i in 5" :key="i" class="w-4 h-4" :class="i <= review.rating ? 'text-amber-400' : 'text-gray-200'" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
                </svg>
              </div>
              <div class="flex items-center gap-2">
                <span class="text-sm font-medium">{{ review.user?.name || review.guestName || 'Anonim' }}</span>
                <span v-if="review.isVerifiedBuyer" class="text-[10px] bg-green-50 text-green-600 px-1.5 py-0.5 rounded">
                  {{ locale === 'tr' ? 'Doğrulanmış Alıcı' : 'Verified Buyer' }}
                </span>
              </div>
            </div>
            <span class="text-xs text-gray-400">{{ formatDate(review.createdAt) }}</span>
          </div>

          <h4 v-if="review.title" class="font-medium mt-2">{{ review.title }}</h4>
          <p class="text-sm text-gray-600 mt-1 leading-relaxed">{{ review.comment }}</p>

          <!-- Medya -->
          <div v-if="review.mediaUrls && review.mediaUrls.length" class="flex gap-2 mt-3 overflow-x-auto">
            <img v-for="(url, i) in review.mediaUrls" :key="i" :src="url" class="w-20 h-20 object-cover rounded border" />
          </div>

          <!-- Admin Yanıtı -->
          <div v-if="review.adminReply?.text" class="mt-3 bg-gray-50 p-3 border-l-2 border-accent">
            <div class="text-xs text-gray-500 mb-1">
              <strong>DB Line</strong> - {{ formatDate(review.adminReply.repliedAt) }}
            </div>
            <p class="text-sm text-gray-600">{{ review.adminReply.text }}</p>
          </div>

          <!-- Faydalı butonu -->
          <div class="mt-3 flex items-center gap-4">
            <button @click="markHelpful(review._id)" class="text-xs text-gray-400 hover:text-gray-600 flex items-center gap-1">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" d="M6.633 10.5c.806 0 1.533-.446 2.031-1.08a9.041 9.041 0 012.861-2.4c.723-.384 1.35-.956 1.653-1.715a4.498 4.498 0 00.322-1.672V3a.75.75 0 01.75-.75A2.25 2.25 0 0116.5 4.5c0 1.152-.26 2.243-.723 3.218-.266.558.107 1.282.725 1.282h3.126c1.026 0 1.945.694 2.054 1.715.045.422.068.85.068 1.285a11.95 11.95 0 01-2.649 7.521c-.388.482-.987.729-1.605.729H13.48c-.483 0-.964-.078-1.423-.23l-3.114-1.04a4.501 4.501 0 00-1.423-.23H5.904M14.25 9h2.25M5.904 18.75c.083.228.22.442.407.618.487.484 1.149.756 1.838.756h.164c.305 0 .599-.118.817-.335a1.14 1.14 0 00.335-.817V12.75a1.14 1.14 0 00-.335-.817 1.14 1.14 0 00-.817-.335h-.164a2.644 2.644 0 00-1.838.756 2.625 2.625 0 00-.407.618"/>
              </svg>
              {{ locale === 'tr' ? 'Faydalı' : 'Helpful' }} ({{ review.helpfulCount || 0 }})
            </button>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

<style scoped>
.modal-fade-enter-active { transition: opacity 0.25s ease; }
.modal-fade-leave-active { transition: opacity 0.2s ease; }
.modal-fade-enter-from, .modal-fade-leave-to { opacity: 0; }
</style>
