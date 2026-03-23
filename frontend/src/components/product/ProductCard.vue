<script setup>
import { useLanguage } from '../../composables/useLanguage'

const { localized, formatPrice } = useLanguage()

const props = defineProps({
  product: { type: Object, required: true }
})
</script>

<template>
  <router-link :to="`/products/${product.slug}`" class="group block">
    <!-- Resim -->
    <div class="relative aspect-square bg-gray-light overflow-hidden mb-3">
      <img
        :src="product.images?.[0] || '/placeholder.svg'"
        :alt="localized(product.name)"
        loading="lazy"
        width="400"
        height="400"
        class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
      />
      <!-- İndirim badge -->
      <span
        v-if="product.salePrice"
        class="absolute top-3 left-3 bg-accent text-white text-[10px] uppercase tracking-wider px-2 py-1"
      >Sale</span>
    </div>

    <!-- Bilgi -->
    <div class="text-center">
      <h3 class="text-sm mb-1 group-hover:opacity-70 transition-opacity">{{ localized(product.name) }}</h3>

      <!-- Yıldızlar -->
      <div v-if="product.rating > 0" class="flex items-center justify-center gap-1 mb-1">
        <div class="flex">
          <svg
            v-for="i in 5"
            :key="i"
            class="w-3 h-3"
            :class="i <= product.rating ? 'text-yellow-400' : 'text-gray-300'"
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
          </svg>
        </div>
        <span class="text-[10px] text-gray-400">{{ product.reviewCount }}</span>
      </div>

      <!-- Fiyat -->
      <div class="flex items-center justify-center gap-2">
        <span v-if="product.salePrice" class="text-sm line-through text-gray-400">{{ formatPrice(product.price) }}</span>
        <span class="text-sm font-medium" :class="product.salePrice ? 'text-accent-dark' : ''">
          {{ formatPrice(product.salePrice || product.price) }}
        </span>
      </div>
    </div>
  </router-link>
</template>

