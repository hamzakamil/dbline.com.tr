<script setup>
import { onMounted, ref, computed } from 'vue'
import { useRoute } from 'vue-router'
import { useHead } from '@unhead/vue'
import { useProductStore } from '../stores/products'
import { useCartStore } from '../stores/cart'
import { useLanguage } from '../composables/useLanguage'
import { useProductSchema, useBreadcrumbSchema } from '../composables/useSchema'
import ProductGallery from '../components/product/ProductGallery.vue'
import ProductGrid from '../components/product/ProductGrid.vue'
import ProductReviews from '../components/product/ProductReviews.vue'

const route = useRoute()
const store = useProductStore()
const cart = useCartStore()
const { t, localized, formatPrice, locale } = useLanguage()

// Schema.org: Product structured data
useProductSchema(
  computed(() => store.product),
  computed(() => locale.value)
)

// Schema.org: Breadcrumb structured data
useBreadcrumbSchema(computed(() => {
  if (!store.product) return []
  const items = [
    { name: locale.value === 'tr' ? 'Ana Sayfa' : 'Home', url: '/' }
  ]
  if (store.product.category) {
    items.push({
      name: localized(store.product.category.name),
      url: `/category/${store.product.category.slug}`
    })
  }
  items.push({ name: localized(store.product.name) })
  return items
}))

const selectedSize = ref('')
const selectedColor = ref('')
const selectedVariants = ref({})
const quantity = ref(1)
const addedToCart = ref(false)
const shareMenuOpen = ref(false)
const linkCopied = ref(false)

const productName = computed(() => store.product ? localized(store.product.name) : '')
const productDesc = computed(() => {
  if (!store.product) return ''
  const desc = localized(store.product.description) || ''
  const plain = desc.replace(/<[^>]*>/g, '')
  return plain.substring(0, 155)
})
const productPrice = computed(() => store.product ? (store.product.salePrice || store.product.price) : 0)
const productImage = computed(() => store.product?.images?.[0] || 'https://dbline.com.tr/og-image.jpg')
const productUrl = computed(() => `https://dbline.com.tr/products/${route.params.slug}`)

useHead({
  title: computed(() => productName.value ? `${productName.value} | DB Line Official` : 'DB Line Official'),
  meta: [
    { name: 'description', content: computed(() =>
      locale.value === 'tr'
        ? `${productName.value} - ${productDesc.value}. ${formatPrice(productPrice.value)} fiyatla DB Line'da. Hizli kargo, guvenli odeme.`
        : `${productName.value} - ${productDesc.value}. Buy at DB Line for ${formatPrice(productPrice.value)}. Fast shipping, secure payment.`
    )},
    { property: 'og:title', content: computed(() => `${productName.value} | DB Line Official`) },
    { property: 'og:description', content: productDesc },
    { property: 'og:type', content: 'product' },
    { property: 'og:url', content: productUrl },
    { property: 'og:image', content: productImage },
    { property: 'og:site_name', content: 'DB Line Official' },
    { property: 'og:locale', content: computed(() => locale.value === 'tr' ? 'tr_TR' : 'en_US') },
    { property: 'product:price:amount', content: computed(() => String(productPrice.value)) },
    { property: 'product:price:currency', content: 'TRY' },
    { name: 'twitter:card', content: 'summary_large_image' },
    { name: 'twitter:title', content: computed(() => `${productName.value} | DB Line Official`) },
    { name: 'twitter:description', content: productDesc },
    { name: 'twitter:image', content: productImage },
  ],
  link: [
    { rel: 'canonical', href: productUrl }
  ]
})

onMounted(async () => {
  await store.fetchProduct(route.params.slug)
})

function addToCart() {
  if (!store.product) return
  cart.addItem(store.product, selectedSize.value, selectedColor.value, quantity.value, selectedVariants.value)
  addedToCart.value = true
  setTimeout(() => { addedToCart.value = false }, 2000)
}

async function shareProduct() {
  const shareData = {
    title: productName.value,
    text: productDesc.value,
    url: window.location.href
  }
  if (navigator.share) {
    try {
      await navigator.share(shareData)
    } catch (e) {
      // Kullanıcı iptal etti
    }
  } else {
    shareMenuOpen.value = !shareMenuOpen.value
  }
}

function copyLink() {
  navigator.clipboard.writeText(window.location.href)
  linkCopied.value = true
  setTimeout(() => { linkCopied.value = false; shareMenuOpen.value = false }, 1500)
}

function shareToWhatsApp() {
  window.open(`https://wa.me/?text=${encodeURIComponent(productName.value + ' ' + window.location.href)}`, '_blank')
  shareMenuOpen.value = false
}

function shareToFacebook() {
  window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(window.location.href)}`, '_blank', 'width=600,height=400')
  shareMenuOpen.value = false
}

function shareToTwitter() {
  window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(productName.value)}&url=${encodeURIComponent(window.location.href)}`, '_blank', 'width=600,height=400')
  shareMenuOpen.value = false
}
</script>

<template>
  <div v-if="store.loading" class="flex items-center justify-center py-20">
    <div class="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
  </div>

  <div v-else-if="store.product" class="page-width py-8">
    <!-- Breadcrumb -->
    <nav aria-label="Breadcrumb" class="text-xs text-gray-400 mb-6">
      <ol class="flex items-center flex-wrap">
        <li>
          <router-link to="/" class="hover:text-primary">{{ t.nav.home }}</router-link>
          <span class="mx-2">/</span>
        </li>
        <li v-if="store.product.category">
          <router-link :to="`/category/${store.product.category.slug}`" class="hover:text-primary">{{ localized(store.product.category.name) }}</router-link>
          <span class="mx-2">/</span>
        </li>
        <li>
          <span class="text-primary">{{ localized(store.product.name) }}</span>
        </li>
      </ol>
    </nav>

    <div class="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-12">
      <!-- Sol: Galeri -->
      <ProductGallery :images="store.product.images" />

      <!-- Sağ: Bilgi -->
      <div>
        <h1 class="text-2xl font-heading mb-2">{{ localized(store.product.name) }}</h1>

        <!-- Yıldızlar -->
        <div v-if="store.product.rating > 0" class="flex items-center gap-2 mb-4">
          <div class="flex">
            <svg
              v-for="i in 5" :key="i"
              class="w-4 h-4"
              :class="i <= store.product.rating ? 'text-yellow-400' : 'text-gray-300'"
              fill="currentColor" viewBox="0 0 20 20"
            >
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            </svg>
          </div>
          <a href="#reviews" class="text-sm text-gray-400 hover:text-accent transition-colors">{{ store.product.reviewCount }} {{ t.product.reviews }}</a>
        </div>

        <!-- Fiyat -->
        <div class="flex items-center gap-3 mb-6">
          <span v-if="store.product.salePrice" class="text-xl line-through text-gray-400">{{ formatPrice(store.product.price) }}</span>
          <span class="text-2xl font-medium" :class="store.product.salePrice ? 'text-accent-dark' : ''">
            {{ formatPrice(store.product.salePrice || store.product.price) }}
          </span>
          <span v-if="store.product.salePrice" class="bg-accent text-white text-xs px-2 py-1 uppercase">{{ t.product.sale }}</span>
        </div>

        <!-- Varyantlar (Tasarım, Desen, vb.) -->
        <div v-for="(variant, vIdx) in (store.product.variants || [])" :key="vIdx" class="mb-6">
          <label class="text-xs uppercase tracking-widest mb-2 block">
            {{ localized(variant.label) }}
          </label>
          <div class="flex flex-wrap gap-2">
            <button
              v-for="(opt, oIdx) in variant.options"
              :key="oIdx"
              @click="selectedVariants[localized(variant.label)] = localized(opt.name)"
              class="px-5 py-2.5 border text-sm transition-all"
              :class="selectedVariants[localized(variant.label)] === localized(opt.name)
                ? 'border-primary bg-primary text-white'
                : 'border-gray-300 hover:border-gray-500'"
              :style="{ borderRadius: 'var(--btn-radius)' }"
            >
              {{ localized(opt.name) }}
            </button>
          </div>
        </div>

        <!-- Beden -->
        <div v-if="store.product.sizes?.length" class="mb-6">
          <label class="text-xs uppercase tracking-widest mb-2 block">{{ t.product.size }}</label>
          <div class="flex flex-wrap gap-2">
            <button
              v-for="size in store.product.sizes" :key="size"
              @click="selectedSize = size"
              :class="['w-12 h-12 border text-sm', selectedSize === size ? 'border-accent bg-accent text-white' : 'border-gray-200 hover:border-accent']"
            >{{ size }}</button>
          </div>
        </div>

        <!-- Renk -->
        <div v-if="store.product.colors?.length" class="mb-6">
          <label class="text-xs uppercase tracking-widest mb-2 block">{{ t.product.color }}</label>
          <div class="flex flex-wrap gap-2">
            <button
              v-for="color in store.product.colors" :key="color.hex"
              @click="selectedColor = localized(color.name)"
              :class="['w-8 h-8 rounded-full border-2', selectedColor === localized(color.name) ? 'border-accent' : 'border-gray-200']"
              :style="{ backgroundColor: color.hex }"
              :title="localized(color.name)"
            ></button>
          </div>
        </div>

        <!-- Miktar -->
        <div class="mb-6">
          <label class="text-xs uppercase tracking-widest mb-2 block">{{ t.product.quantity }}</label>
          <div class="flex items-center border border-gray-200 w-fit">
            <button @click="quantity > 1 && quantity--" class="w-10 h-10 flex items-center justify-center hover:bg-gray-50">-</button>
            <span class="w-12 h-10 flex items-center justify-center border-x border-gray-200">{{ quantity }}</span>
            <button @click="quantity++" class="w-10 h-10 flex items-center justify-center hover:bg-gray-50">+</button>
          </div>
        </div>

        <!-- Sepete ekle -->
        <button @click="addToCart" class="btn-primary w-full mb-4">
          {{ addedToCart ? '✓ ' + t.cart.itemAdded : t.product.addToCart }}
        </button>

        <!-- Stok -->
        <p class="text-sm" :class="store.product.stock > 0 ? 'text-green-600' : 'text-red-500'">
          {{ store.product.stock > 0 ? t.product.inStock : t.product.outOfStock }}
        </p>

        <!-- Açıklama -->
        <div class="mt-8 pt-8 border-t border-gray-100">
          <h3 class="text-xs uppercase tracking-widest mb-4">{{ t.product.description }}</h3>
          <div class="text-sm text-gray-600 leading-relaxed" v-html="localized(store.product.description)"></div>
        </div>

        <!-- Paylaş -->
        <div class="mt-6 pt-6 border-t border-gray-100 relative">
          <button
            @click="shareProduct"
            class="inline-flex items-center gap-2 text-sm hover:opacity-70 transition-opacity"
            :style="{ color: 'var(--color-primary)' }"
          >
            <svg class="w-5 h-5" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" d="M7.217 10.907a2.25 2.25 0 100 2.186m0-2.186c.18.324.283.696.283 1.093s-.103.77-.283 1.093m0-2.186l9.566-5.314m-9.566 7.5l9.566 5.314m0 0a2.25 2.25 0 103.935 2.186 2.25 2.25 0 00-3.935-2.186zm0-12.814a2.25 2.25 0 103.933-2.185 2.25 2.25 0 00-3.933 2.185z" />
            </svg>
            {{ locale === 'tr' ? 'Paylaş' : 'Share' }}
          </button>
          <!-- Fallback paylaşım menüsü (Web Share API yoksa) -->
          <div
            v-if="shareMenuOpen"
            class="absolute left-0 bottom-full mb-2 bg-white border border-gray-200 shadow-lg py-2 min-w-[200px] z-50"
          >
            <button @click="copyLink" class="w-full text-left px-4 py-2 text-sm hover:bg-gray-50 flex items-center gap-3">
              <svg class="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" d="M13.19 8.688a4.5 4.5 0 011.242 7.244l-4.5 4.5a4.5 4.5 0 01-6.364-6.364l1.757-1.757m9.86-2.04a4.5 4.5 0 00-1.242-7.244l-4.5-4.5a4.5 4.5 0 00-6.364 6.364L5.89 9.21" />
              </svg>
              {{ linkCopied ? (locale === 'tr' ? 'Kopyalandı!' : 'Copied!') : (locale === 'tr' ? 'Linki Kopyala' : 'Copy Link') }}
            </button>
            <button @click="shareToWhatsApp" class="w-full text-left px-4 py-2 text-sm hover:bg-gray-50 flex items-center gap-3">
              <svg class="w-4 h-4 text-green-600" fill="currentColor" viewBox="0 0 24 24">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
              </svg>
              WhatsApp
            </button>
            <button @click="shareToFacebook" class="w-full text-left px-4 py-2 text-sm hover:bg-gray-50 flex items-center gap-3">
              <svg class="w-4 h-4 text-blue-600" fill="currentColor" viewBox="0 0 24 24">
                <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
              </svg>
              Facebook
            </button>
            <button @click="shareToTwitter" class="w-full text-left px-4 py-2 text-sm hover:bg-gray-50 flex items-center gap-3">
              <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
              </svg>
              X (Twitter)
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Müşteri Yorumları -->
    <ProductReviews v-if="store.product._id" :product-id="store.product._id" />
  </div>
</template>
