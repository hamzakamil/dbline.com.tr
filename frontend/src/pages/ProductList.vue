<script setup>
import { onMounted, watch, ref, computed } from 'vue'
import { useRoute } from 'vue-router'
import { useHead } from '@unhead/vue'
import { useProductStore } from '../stores/products'
import { useLanguage } from '../composables/useLanguage'
import { useCollectionSchema, useBreadcrumbSchema } from '../composables/useSchema'
import ProductGrid from '../components/product/ProductGrid.vue'

const route = useRoute()
const store = useProductStore()
const { t, localized, locale } = useLanguage()

const currentPage = ref(1)
const sortBy = ref('')

const currentCategory = computed(() =>
  route.params.slug ? store.categories.find(c => c.slug === route.params.slug) : null
)
const categoryName = computed(() =>
  currentCategory.value ? localized(currentCategory.value.name) : ''
)

// Schema.org: CollectionPage for category pages
useCollectionSchema(computed(() => {
  if (!categoryName.value) return null
  return {
    name: categoryName.value,
    description: locale.value === 'tr'
      ? `DB Line ${categoryName.value} koleksiyonu. Premium kalite pilates urunleri.`
      : `DB Line ${categoryName.value} collection. Premium quality pilates products.`,
    url: `/category/${route.params.slug}`
  }
}))

// Schema.org: Breadcrumb
useBreadcrumbSchema(computed(() => {
  const items = [
    { name: locale.value === 'tr' ? 'Ana Sayfa' : 'Home', url: '/' }
  ]
  if (categoryName.value) {
    items.push({ name: categoryName.value })
  } else {
    items.push({ name: locale.value === 'tr' ? 'Tum Urunler' : 'All Products' })
  }
  return items
}))

const pageTitle = computed(() => {
  if (categoryName.value) {
    return locale.value === 'tr'
      ? `${categoryName.value} - Online Satin Al | DB Line Official`
      : `${categoryName.value} - Shop Online | DB Line Official`
  }
  if (route.query.search) {
    return `"${route.query.search}" | DB Line Official`
  }
  return locale.value === 'tr'
    ? 'Tum Urunler | DB Line Official'
    : 'All Products | DB Line Official'
})

const pageDescription = computed(() => {
  if (categoryName.value) {
    return locale.value === 'tr'
      ? `DB Line ${categoryName.value} koleksiyonu. Premium kalite, uygun fiyat. ${store.total}+ urun arasinda secin. Ucretsiz kargo firsati!`
      : `DB Line ${categoryName.value} collection. Premium quality, great prices. Choose from ${store.total}+ products. Free shipping available!`
  }
  return locale.value === 'tr'
    ? 'DB Line Official urun katalogu. Pilates coraplari, taytlar ve spor aksesuarlari. Premium kalite, hizli kargo.'
    : 'DB Line Official product catalog. Pilates socks, leggings and sport accessories. Premium quality, fast shipping.'
})

const canonicalUrl = computed(() => {
  if (route.params.slug) return `https://dbline.com.tr/category/${route.params.slug}`
  return 'https://dbline.com.tr/products'
})

useHead({
  title: pageTitle,
  meta: [
    { name: 'description', content: pageDescription },
    { property: 'og:title', content: pageTitle },
    { property: 'og:description', content: pageDescription },
    { property: 'og:type', content: 'website' },
    { property: 'og:url', content: canonicalUrl },
    { property: 'og:image', content: 'https://dbline.com.tr/og-image.jpg' },
    { property: 'og:site_name', content: 'DB Line Official' },
    { property: 'og:locale', content: computed(() => locale.value === 'tr' ? 'tr_TR' : 'en_US') },
    { name: 'twitter:card', content: 'summary_large_image' },
    { name: 'twitter:title', content: pageTitle },
    { name: 'twitter:description', content: pageDescription },
  ],
  link: [
    { rel: 'canonical', href: canonicalUrl }
  ]
})

async function loadProducts() {
  const params = { page: currentPage.value, limit: 12 }
  if (route.params.slug) params.category = route.params.slug
  if (route.query.search) params.search = route.query.search
  if (sortBy.value) params.sort = sortBy.value
  await store.fetchProducts(params)
}

onMounted(async () => {
  await store.fetchCategories()
  await loadProducts()
})

watch(() => route.params.slug, loadProducts)
watch(() => route.query.search, loadProducts)
watch(sortBy, loadProducts)

function changePage(page) {
  currentPage.value = page
  loadProducts()
  window.scrollTo({ top: 0, behavior: 'smooth' })
}
</script>

<template>
  <div class="page-width py-8">
    <!-- Başlık -->
    <div class="flex items-center justify-between mb-8">
      <div>
        <h1 class="text-2xl font-heading">
          <template v-if="route.params.slug">
            {{ localized(store.categories.find(c => c.slug === route.params.slug)?.name) || route.params.slug }}
          </template>
          <template v-else-if="route.query.search">
            "{{ route.query.search }}"
          </template>
          <template v-else>
            {{ t.home.featuredProducts }}
          </template>
        </h1>
        <p class="text-sm text-gray-400 mt-1">{{ store.total }} {{ locale === 'tr' ? 'ürün' : 'products' }}</p>
      </div>

      <!-- Sıralama -->
      <select v-model="sortBy" class="border border-gray-200 px-3 py-2 text-sm focus:outline-none">
        <option value="">{{ locale === 'tr' ? 'Sırala' : 'Sort' }}</option>
        <option value="price_asc">{{ locale === 'tr' ? 'Fiyat: Düşükten Yükseğe' : 'Price: Low to High' }}</option>
        <option value="price_desc">{{ locale === 'tr' ? 'Fiyat: Yüksekten Düşüğe' : 'Price: High to Low' }}</option>
        <option value="name">{{ locale === 'tr' ? 'İsim' : 'Name' }}</option>
      </select>
    </div>

    <!-- Yükleniyor -->
    <div v-if="store.loading" class="text-center py-20">
      <div class="inline-block w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
      <p class="mt-4 text-sm text-gray-400">{{ t.common.loading }}</p>
    </div>

    <!-- Sonuç yok -->
    <div v-else-if="store.products.length === 0" class="text-center py-20">
      <p class="text-gray-400">{{ t.common.noResults }}</p>
    </div>

    <!-- Ürün grid -->
    <template v-else>
      <ProductGrid :products="store.products" :cols="4" />

      <!-- Sayfalama -->
      <div v-if="store.pages > 1" class="flex justify-center gap-2 mt-12">
        <button
          v-for="page in store.pages"
          :key="page"
          @click="changePage(page)"
          :class="['w-10 h-10 border text-sm', currentPage === page ? 'bg-accent text-white border-accent' : 'border-gray-200 hover:border-accent']"
        >{{ page }}</button>
      </div>
    </template>
  </div>
</template>
