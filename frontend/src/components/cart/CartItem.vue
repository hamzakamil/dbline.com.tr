<script setup>
import { useCartStore } from '../../stores/cart'
import { useLanguage } from '../../composables/useLanguage'

const cart = useCartStore()
const { localized, formatPrice } = useLanguage()

const props = defineProps({
  item: { type: Object, required: true },
  index: { type: Number, required: true }
})
</script>

<template>
  <div class="flex gap-4 py-4 border-b border-gray-100">
    <!-- Resim -->
    <router-link :to="`/products/${item.slug}`" class="w-20 h-20 bg-gray-light flex-shrink-0 overflow-hidden">
      <img :src="item.image || '/placeholder.svg'" :alt="localized(item.name)" class="w-full h-full object-cover" />
    </router-link>

    <!-- Bilgi -->
    <div class="flex-1 min-w-0">
      <h4 class="text-sm mb-1 truncate">{{ localized(item.name) }}</h4>
      <p v-if="item.size || item.color" class="text-xs text-gray-400 mb-2">
        <span v-if="item.size">{{ item.size }}</span>
        <span v-if="item.size && item.color"> / </span>
        <span v-if="item.color">{{ item.color }}</span>
      </p>

      <div class="flex items-center justify-between">
        <!-- Miktar -->
        <div class="flex items-center border border-gray-200">
          <button @click="cart.updateQuantity(index, item.quantity - 1)" class="w-7 h-7 flex items-center justify-center text-xs hover:bg-gray-50">-</button>
          <span class="w-8 h-7 flex items-center justify-center text-xs border-x border-gray-200">{{ item.quantity }}</span>
          <button @click="cart.updateQuantity(index, item.quantity + 1)" class="w-7 h-7 flex items-center justify-center text-xs hover:bg-gray-50">+</button>
        </div>

        <!-- Fiyat -->
        <span class="text-sm">{{ formatPrice((item.salePrice || item.price) * item.quantity) }}</span>
      </div>
    </div>

    <!-- Kaldır -->
    <button @click="cart.removeItem(index)" class="text-gray-400 hover:text-primary self-start">
      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M6 18L18 6M6 6l12 12" />
      </svg>
    </button>
  </div>
</template>
