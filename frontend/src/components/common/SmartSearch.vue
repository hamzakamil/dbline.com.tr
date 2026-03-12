<script setup>
import { ref, watch, onMounted, onUnmounted, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import { useLanguage } from '../../composables/useLanguage'
import api from '../../utils/api'

const emit = defineEmits(['close'])
const router = useRouter()
const { locale, localized } = useLanguage()

const query = ref('')
const results = ref([])
const categories = ref([])
const total = ref(0)
const loading = ref(false)
const popular = ref([])
const recentViews = ref([])
const selectedIndex = ref(-1)
const inputRef = ref(null)

let debounceTimer = null

// Popüler aramaları ve son bakılanları yükle
async function loadInitial() {
  try {
    const { data } = await api.get(`/products/search/popular`)
    popular.value = data.popular || []
  } catch { /* ok */ }

  try {
    const saved = localStorage.getItem('dbline_recent_views')
    if (saved) recentViews.value = JSON.parse(saved).slice(0, 6)
  } catch { /* ok */ }
}

// Debounced arama
watch(query, (val) => {
  clearTimeout(debounceTimer)
  selectedIndex.value = -1
  if (!val || val.trim().length < 2) {
    results.value = []
    categories.value = []
    total.value = 0
    return
  }
  loading.value = true
  debounceTimer = setTimeout(async () => {
    try {
      const { data } = await api.get(`/products/search`, {
        params: { q: val.trim(), limit: 6 }
      })
      results.value = data.products || []
      categories.value = data.categories || []
      total.value = data.total || 0
    } catch {
      results.value = []
    } finally {
      loading.value = false
    }
  }, 300)
})

function selectResult(product) {
  emit('close')
  router.push(`/product/${product.slug}`)
}

function selectCategory(cat) {
  emit('close')
  router.push(`/category/${cat.slug}`)
}

function viewAll() {
  if (!query.value) return
  emit('close')
  router.push({ path: '/search', query: { q: query.value } })
}

function setQuery(term) {
  query.value = term
}

function handleKeydown(e) {
  const items = results.value
  if (e.key === 'Escape') {
    emit('close')
  } else if (e.key === 'ArrowDown') {
    e.preventDefault()
    selectedIndex.value = Math.min(selectedIndex.value + 1, items.length - 1)
  } else if (e.key === 'ArrowUp') {
    e.preventDefault()
    selectedIndex.value = Math.max(selectedIndex.value - 1, -1)
  } else if (e.key === 'Enter') {
    if (selectedIndex.value >= 0 && items[selectedIndex.value]) {
      selectResult(items[selectedIndex.value])
    } else if (query.value) {
      viewAll()
    }
  }
}

function formatPrice(price) {
  return `₺${price?.toFixed(2) || '0.00'}`
}

onMounted(() => {
  loadInitial()
  nextTick(() => inputRef.value?.focus())
  document.addEventListener('keydown', handleKeydown)
})

onUnmounted(() => {
  clearTimeout(debounceTimer)
  document.removeEventListener('keydown', handleKeydown)
})
</script>

<template>
  <Teleport to="body">
    <div class="fixed inset-0 z-[90]" @click.self="emit('close')">
      <!-- Overlay -->
      <div class="absolute inset-0 bg-black/40" @click="emit('close')"></div>

      <!-- Arama Paneli -->
      <div class="relative w-full max-w-2xl mx-auto mt-20 bg-white shadow-2xl animate-fadeIn">
        <!-- Input -->
        <div class="flex items-center border-b px-4">
          <svg class="w-5 h-5 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            ref="inputRef"
            v-model="query"
            type="text"
            class="flex-1 px-3 py-4 text-base outline-none"
            :placeholder="locale === 'tr' ? 'Ürün, kategori veya anahtar kelime ara...' : 'Search products, categories...'"
          />
          <button @click="emit('close')" class="text-gray-400 hover:text-gray-600 p-1">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <!-- İçerik -->
        <div class="max-h-[60vh] overflow-y-auto">
          <!-- Boş durum - popüler aramalar ve son bakılanlar -->
          <div v-if="!query" class="p-4">
            <div v-if="popular.length" class="mb-6">
              <h4 class="text-xs uppercase tracking-widest text-gray-400 mb-3">{{ locale === 'tr' ? 'Popüler Aramalar' : 'Popular Searches' }}</h4>
              <div class="flex flex-wrap gap-2">
                <button v-for="term in popular" :key="term" @click="setQuery(term)"
                  class="px-3 py-1.5 text-xs border border-gray-200 hover:border-accent hover:text-accent transition-colors">
                  {{ term }}
                </button>
              </div>
            </div>
            <div v-if="recentViews.length">
              <h4 class="text-xs uppercase tracking-widest text-gray-400 mb-3">{{ locale === 'tr' ? 'Son Baktıklarınız' : 'Recently Viewed' }}</h4>
              <div class="grid grid-cols-3 gap-3">
                <router-link v-for="item in recentViews" :key="item.slug" :to="`/product/${item.slug}`"
                  class="flex items-center gap-2 p-2 hover:bg-gray-50 transition-colors" @click="emit('close')">
                  <img v-if="item.image" :src="item.image" class="w-10 h-10 object-cover flex-shrink-0" />
                  <span class="text-xs truncate">{{ item.name }}</span>
                </router-link>
              </div>
            </div>
          </div>

          <!-- Loading -->
          <div v-else-if="loading" class="p-4 space-y-3">
            <div v-for="i in 3" :key="i" class="flex items-center gap-3 animate-pulse">
              <div class="w-12 h-12 bg-gray-200 flex-shrink-0"></div>
              <div class="flex-1">
                <div class="h-3 bg-gray-200 rounded w-2/3 mb-1.5"></div>
                <div class="h-3 bg-gray-200 rounded w-1/3"></div>
              </div>
            </div>
          </div>

          <!-- Sonuçlar -->
          <div v-else-if="query && query.length >= 2">
            <!-- Kategori eşleşmeleri -->
            <div v-if="categories.length" class="px-4 pt-3">
              <h4 class="text-xs uppercase tracking-widest text-gray-400 mb-2">{{ locale === 'tr' ? 'Kategoriler' : 'Categories' }}</h4>
              <div class="flex flex-wrap gap-2 mb-3">
                <button v-for="cat in categories" :key="cat._id" @click="selectCategory(cat)"
                  class="px-3 py-1.5 text-xs bg-gray-50 hover:bg-accent hover:text-white transition-colors">
                  {{ localized(cat.name) }}
                </button>
              </div>
            </div>

            <!-- Ürün sonuçları -->
            <div v-if="results.length">
              <div v-for="(product, idx) in results" :key="product._id"
                @click="selectResult(product)"
                class="flex items-center gap-3 px-4 py-3 cursor-pointer transition-colors border-b last:border-0"
                :class="selectedIndex === idx ? 'bg-gray-50' : 'hover:bg-gray-50'"
              >
                <img v-if="product.images?.length" :src="product.images[0]" class="w-12 h-12 object-cover flex-shrink-0" />
                <div v-else class="w-12 h-12 bg-gray-100 flex-shrink-0"></div>
                <div class="flex-1 min-w-0">
                  <div class="text-sm font-medium truncate">{{ localized(product.name) }}</div>
                  <div class="text-xs text-gray-400">{{ localized(product.category?.name) }}</div>
                </div>
                <div class="text-right flex-shrink-0">
                  <div class="text-sm font-medium">{{ formatPrice(product.price) }}</div>
                  <div v-if="product.comparePrice && product.comparePrice > product.price" class="text-xs text-gray-400 line-through">
                    {{ formatPrice(product.comparePrice) }}
                  </div>
                </div>
              </div>
            </div>

            <!-- Tüm sonuçları gör -->
            <div v-if="total > 0" class="p-4 border-t">
              <button @click="viewAll" class="w-full text-center text-sm text-accent hover:underline">
                {{ locale === 'tr' ? `Tüm Sonuçları Gör (${total} adet)` : `View All Results (${total})` }}
              </button>
            </div>

            <!-- Sonuç yok -->
            <div v-if="!results.length && !categories.length && !loading" class="p-6 text-center">
              <p class="text-sm text-gray-500 mb-3">
                {{ locale === 'tr' ? 'Aradığınız ürün bulunamadı' : 'No products found' }}
              </p>
              <a href="https://wa.me/905551234567" target="_blank"
                class="inline-flex items-center gap-2 text-sm text-green-600 hover:underline">
                <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/>
                  <path d="M12 0C5.373 0 0 5.373 0 12c0 2.123.553 4.118 1.523 5.853L0 24l6.336-1.66A11.943 11.943 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 22c-1.958 0-3.822-.527-5.47-1.482l-.392-.232-3.76.986.984-3.67-.254-.404A9.96 9.96 0 012 12c0-5.514 4.486-10 10-10s10 4.486 10 10-4.486 10-10 10z"/>
                </svg>
                {{ locale === 'tr' ? 'WhatsApp\'tan sorun!' : 'Ask via WhatsApp!' }}
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<style scoped>
.animate-fadeIn {
  animation: fadeIn 0.2s ease-out;
}
@keyframes fadeIn {
  from { opacity: 0; transform: translateY(-10px); }
  to { opacity: 1; transform: translateY(0); }
}
</style>
