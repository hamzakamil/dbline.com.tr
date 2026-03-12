<script setup>
import { ref, onMounted, computed } from 'vue'
import { useHead } from '@unhead/vue'
import { useProductStore } from '../stores/products'
import { useLanguage } from '../composables/useLanguage'
import { useWebSiteSchema } from '../composables/useSchema'
import HeroBanner from '../components/common/HeroBanner.vue'
import ProductGrid from '../components/product/ProductGrid.vue'
import api from '../utils/api'

const store = useProductStore()
const { t, localized, locale } = useLanguage()

useWebSiteSchema()

const pageTitle = computed(() =>
  locale.value === 'tr'
    ? 'DB Line Official | Premium Pilates Çorap & Spor Giyim'
    : 'DB Line Official | Premium Pilates Socks & Sportswear'
)
const pageDescription = computed(() =>
  locale.value === 'tr'
    ? 'Kaymaz pilates çorapları, taytlar ve spor aksesuarları. Türkiye\'nin en kaliteli pilates ekipmanları. 500₺ üzeri ücretsiz kargo!'
    : 'Non-slip pilates socks, leggings and sport accessories. Turkey\'s highest quality pilates equipment. Free shipping over 500₺!'
)

useHead({
  title: pageTitle,
  meta: [
    { name: 'description', content: pageDescription },
    { property: 'og:title', content: pageTitle },
    { property: 'og:description', content: pageDescription },
    { property: 'og:type', content: 'website' },
    { property: 'og:url', content: 'https://dbline.com.tr/' },
    { property: 'og:image', content: 'https://dbline.com.tr/og-image.jpg' },
    { property: 'og:site_name', content: 'DB Line Official' },
    { property: 'og:locale', content: () => locale.value === 'tr' ? 'tr_TR' : 'en_US' },
    { name: 'twitter:card', content: 'summary_large_image' },
    { name: 'twitter:title', content: pageTitle },
    { name: 'twitter:description', content: pageDescription },
  ],
  link: [
    { rel: 'canonical', href: 'https://dbline.com.tr/' }
  ]
})


const heroImage = ref('')
const heroSlogan = ref({ tr: "Pilates'te denge ayaktan başlar.", en: 'Balance in Pilates starts from the feet.' })
const heroBanners = ref([])
const showCategoriesOnHome = ref(false)

async function fetchSiteSettings() {
  try {
    const { data } = await api.get(`/admin/settings`)
    if (data.heroImage) heroImage.value = data.heroImage
    if (data.heroSlogan) heroSlogan.value = data.heroSlogan
    if (data.heroBanners) heroBanners.value = data.heroBanners.filter(b => b.active)
    showCategoriesOnHome.value = data.layoutConfig?.showCategoriesOnHome ?? false
  } catch (e) {
    // Use defaults
  }
}

onMounted(async () => {
  await Promise.all([
    store.fetchProducts({ featured: true, limit: 8 }),
    store.fetchCategories(),
    fetchSiteSettings()
  ])
})
</script>

<template>
  <!-- Hero Banner -->
  <HeroBanner :heroImage="heroImage" :heroSlogan="heroSlogan" :banners="heroBanners" />

  <!-- Kategoriler -->
  <section v-if="showCategoriesOnHome" class="page-width" :style="{ paddingTop: 'var(--section-padding)', paddingBottom: 'var(--section-padding)' }">
    <h2 class="section-title">{{ t.home.categories }}</h2>
    <div class="grid grid-cols-1 category-grid-dynamic" :style="{ gap: 'var(--product-grid-gap)' }">
      <router-link
        v-for="cat in store.categories"
        :key="cat._id"
        :to="`/category/${cat.slug}`"
        class="group relative h-64 bg-gray-100 overflow-hidden"
      >
        <img
          v-if="cat.image"
          :src="cat.image"
          :alt="localized(cat.name)"
          loading="lazy"
          width="600"
          height="256"
          class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
        />
        <div class="absolute inset-0 bg-black/30 flex items-center justify-center">
          <h3 class="text-white text-lg uppercase tracking-widest font-heading">{{ localized(cat.name) }}</h3>
        </div>
      </router-link>
    </div>
  </section>

  <!-- Öne Çıkan Ürünler -->
  <section class="page-width" :style="{ paddingTop: 'var(--section-padding)', paddingBottom: 'var(--section-padding)' }">
    <h2 class="section-title">{{ t.home.featuredProducts }}</h2>
    <ProductGrid :products="store.products" :cols="4" />
    <div class="text-center mt-8">
      <router-link to="/products" class="btn-outline inline-block">{{ t.home.viewAll }}</router-link>
    </div>
  </section>

  <!-- Orta banner -->
  <section class="bg-gray-light py-20">
    <div class="page-width text-center">
      <p class="text-xs uppercase tracking-[0.3em] text-accent mb-4">DB LINE OFFICIAL</p>
      <h2 class="text-2xl md:text-4xl font-heading mb-4">{{ t.home.bestSellers }}</h2>
      <router-link to="/products?sort=best" class="btn-primary inline-block mt-4">{{ t.home.shopNow }}</router-link>
    </div>
  </section>
</template>
