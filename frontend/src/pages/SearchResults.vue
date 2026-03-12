<script setup>
import { ref, watch, onMounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useLanguage } from '../composables/useLanguage'
import { useHead } from '@unhead/vue'
import api from '../utils/api'

const route = useRoute()
const router = useRouter()
const { locale, localized } = useLanguage()

const products = ref([])
const total = ref(0)
const page = ref(1)
const pages = ref(1)
const loading = ref(true)
const sort = ref('newest')

const searchQuery = computed(() => route.query.q || '')

useHead({
  title: computed(() => searchQuery.value
    ? `"${searchQuery.value}" ${locale.value === 'tr' ? 'arama sonuçları' : 'search results'} | DB Line`
    : 'DB Line'
  )
})

async function fetchResults() {
  if (!searchQuery.value) return
  loading.value = true
  try {
    let sortParam = ''
    if (sort.value === 'price_asc') sortParam = 'price_asc'
    else if (sort.value === 'price_desc') sortParam = 'price_desc'

    const { data } = await api.get(`/products/search`, {
      params: { q: searchQuery.value, page: page.value, limit: 12, sort: sortParam }
    })
    products.value = data.products || []
    total.value = data.total || 0
    pages.value = data.pages || 1
  } catch (error) {
    console.error(error)
  } finally {
    loading.value = false
  }
}

function changeSort(val) {
  sort.value = val
  page.value = 1
  fetchResults()
}

function changePage(p) {
  page.value = p
  fetchResults()
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

function formatPrice(price) {
  return `₺${price?.toFixed(2) || '0.00'}`
}

watch(() => route.query.q, () => {
  page.value = 1
  fetchResults()
})

onMounted(fetchResults)
</script>

<template>
  <div class="page-width py-8">
    <!-- Başlık -->
    <div class="mb-6">
      <h1 class="text-2xl font-heading">
        {{ locale === 'tr' ? 'Arama Sonuçları' : 'Search Results' }}
      </h1>
      <p class="text-sm text-gray-500 mt-1">
        <template v-if="searchQuery">
          "{{ searchQuery }}" {{ locale === 'tr' ? 'için' : 'for' }} {{ total }} {{ locale === 'tr' ? 'sonuç bulundu' : 'results found' }}
        </template>
      </p>
    </div>

    <!-- Filtreler -->
    <div class="flex items-center justify-between mb-6 pb-4 border-b">
      <div class="flex gap-3">
        <button v-for="opt in [
          { value: 'newest', label: locale === 'tr' ? 'En Yeniler' : 'Newest' },
          { value: 'price_asc', label: locale === 'tr' ? 'Fiyat (Artan)' : 'Price (Low)' },
          { value: 'price_desc', label: locale === 'tr' ? 'Fiyat (Azalan)' : 'Price (High)' }
        ]" :key="opt.value"
          @click="changeSort(opt.value)"
          class="px-3 py-1.5 text-xs border transition-colors"
          :class="sort === opt.value ? 'border-accent text-accent' : 'border-gray-200 text-gray-500'"
        >{{ opt.label }}</button>
      </div>
    </div>

    <!-- Loading -->
    <div v-if="loading" class="grid grid-cols-2 md:grid-cols-4 gap-4">
      <div v-for="i in 8" :key="i" class="animate-pulse">
        <div class="aspect-square bg-gray-200 mb-2"></div>
        <div class="h-3 bg-gray-200 rounded w-3/4 mb-1"></div>
        <div class="h-3 bg-gray-200 rounded w-1/3"></div>
      </div>
    </div>

    <!-- Sonuç yok -->
    <div v-else-if="products.length === 0" class="text-center py-16">
      <svg class="w-16 h-16 mx-auto text-gray-200 mb-4" fill="none" stroke="currentColor" stroke-width="1" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
      </svg>
      <h3 class="text-lg font-medium mb-2">{{ locale === 'tr' ? 'Sonuç bulunamadı' : 'No results found' }}</h3>
      <p class="text-sm text-gray-500 mb-6">{{ locale === 'tr' ? 'Farklı anahtar kelimeler deneyin' : 'Try different keywords' }}</p>
      <a href="https://wa.me/905551234567" target="_blank"
        class="inline-flex items-center gap-2 btn-accent" :style="{ borderRadius: 'var(--btn-radius)' }">
        <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/>
          <path d="M12 0C5.373 0 0 5.373 0 12c0 2.123.553 4.118 1.523 5.853L0 24l6.336-1.66A11.943 11.943 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 22c-1.958 0-3.822-.527-5.47-1.482l-.392-.232-3.76.986.984-3.67-.254-.404A9.96 9.96 0 012 12c0-5.514 4.486-10 10-10s10 4.486 10 10-4.486 10-10 10z"/>
        </svg>
        {{ locale === 'tr' ? 'WhatsApp\'tan Sorun' : 'Ask via WhatsApp' }}
      </a>
    </div>

    <!-- Ürün Grid -->
    <div v-else>
      <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
        <router-link v-for="product in products" :key="product._id" :to="`/product/${product.slug}`"
          class="group">
          <div class="aspect-square overflow-hidden bg-gray-100 mb-2">
            <img v-if="product.images?.length" :src="product.images[0]" :alt="localized(product.name)"
              class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" loading="lazy" />
          </div>
          <h3 class="text-sm font-medium truncate">{{ localized(product.name) }}</h3>
          <div class="flex items-center gap-2 mt-0.5">
            <span class="text-sm font-medium">{{ formatPrice(product.price) }}</span>
            <span v-if="product.comparePrice && product.comparePrice > product.price" class="text-xs text-gray-400 line-through">
              {{ formatPrice(product.comparePrice) }}
            </span>
          </div>
        </router-link>
      </div>

      <!-- Pagination -->
      <div v-if="pages > 1" class="flex justify-center gap-2 mt-8">
        <button v-for="p in pages" :key="p" @click="changePage(p)"
          class="w-9 h-9 text-sm border transition-colors"
          :class="page === p ? 'bg-accent text-white border-accent' : 'border-gray-200 hover:border-accent'"
        >{{ p }}</button>
      </div>
    </div>
  </div>
</template>
