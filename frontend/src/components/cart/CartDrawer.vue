<script setup>
import { useCartStore } from '../../stores/cart'
import { useLanguage } from '../../composables/useLanguage'
import CartItem from './CartItem.vue'

const cart = useCartStore()
const { t, formatPrice } = useLanguage()
</script>

<template>
  <!-- Overlay -->
  <Transition name="fade">
    <div v-if="cart.isOpen" class="fixed inset-0 bg-black/50 z-[60]" @click="cart.isOpen = false"></div>
  </Transition>

  <!-- Drawer -->
  <Transition name="slide-right">
    <div v-if="cart.isOpen" class="fixed top-0 right-0 w-full max-w-md h-full bg-white z-[70] flex flex-col shadow-2xl">
      <!-- Header -->
      <div class="flex items-center justify-between px-6 py-4 border-b">
        <h2 class="text-sm uppercase tracking-widest">{{ t.cart.title }} ({{ cart.itemCount }})</h2>
        <button @click="cart.isOpen = false">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <!-- Ürünler -->
      <div class="flex-1 overflow-y-auto px-6 py-4">
        <div v-if="cart.items.length === 0" class="text-center py-12">
          <svg class="w-16 h-16 mx-auto text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
          </svg>
          <p class="text-gray-400 text-sm">{{ t.cart.empty }}</p>
          <button @click="cart.isOpen = false" class="mt-4 text-sm underline">{{ t.cart.continueShopping }}</button>
        </div>

        <CartItem
          v-for="(item, index) in cart.items"
          :key="index"
          :item="item"
          :index="index"
        />
      </div>

      <!-- Footer -->
      <div v-if="cart.items.length > 0" class="border-t px-6 py-4">
        <div class="flex justify-between text-sm mb-2">
          <span>{{ t.cart.subtotal }}</span>
          <span>{{ formatPrice(cart.subtotal) }}</span>
        </div>
        <div class="flex justify-between text-sm mb-4">
          <span>{{ t.cart.shipping }}</span>
          <span>{{ cart.shippingCost === 0 ? t.cart.freeShipping : formatPrice(cart.shippingCost) }}</span>
        </div>
        <div class="flex justify-between font-medium mb-4">
          <span>{{ t.cart.total }}</span>
          <span>{{ formatPrice(cart.total) }}</span>
        </div>
        <router-link
          to="/checkout"
          class="btn-primary w-full block text-center"
          @click="cart.isOpen = false"
        >{{ t.cart.checkout }}</router-link>
      </div>
    </div>
  </Transition>
</template>

<style scoped>
.fade-enter-active, .fade-leave-active { transition: opacity 0.3s; }
.fade-enter-from, .fade-leave-to { opacity: 0; }
.slide-right-enter-active, .slide-right-leave-active { transition: transform 0.3s ease; }
.slide-right-enter-from, .slide-right-leave-to { transform: translateX(100%); }
</style>
