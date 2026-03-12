<script setup>
import { useCartStore } from '../stores/cart'
import { useLanguage } from '../composables/useLanguage'

const cart = useCartStore()
const { t, localized, formatPrice } = useLanguage()
</script>

<template>
  <div class="max-w-4xl mx-auto px-4 py-8">
    <h1 class="text-2xl font-heading mb-8">{{ t.cart.title }}</h1>

    <div v-if="cart.items.length === 0" class="text-center py-20">
      <svg class="w-20 h-20 mx-auto text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
      </svg>
      <p class="text-gray-400 mb-4">{{ t.cart.empty }}</p>
      <router-link to="/products" class="btn-primary inline-block">{{ t.cart.continueShopping }}</router-link>
    </div>

    <div v-else class="grid grid-cols-1 lg:grid-cols-3 gap-8">
      <!-- Ürün listesi -->
      <div class="lg:col-span-2">
        <div v-for="(item, index) in cart.items" :key="index" class="flex gap-4 py-6 border-b border-gray-100">
          <router-link :to="`/products/${item.slug}`" class="w-24 h-24 bg-gray-light flex-shrink-0 overflow-hidden">
            <img :src="item.image || '/placeholder.svg'" :alt="localized(item.name)" class="w-full h-full object-cover" />
          </router-link>
          <div class="flex-1">
            <h3 class="text-sm mb-1">{{ localized(item.name) }}</h3>
            <p v-if="item.size || item.color" class="text-xs text-gray-400 mb-3">
              {{ [item.size, item.color].filter(Boolean).join(' / ') }}
            </p>
            <div class="flex items-center justify-between">
              <div class="flex items-center border border-gray-200">
                <button @click="cart.updateQuantity(index, item.quantity - 1)" class="w-8 h-8 flex items-center justify-center text-sm hover:bg-gray-50">-</button>
                <span class="w-10 h-8 flex items-center justify-center text-sm border-x border-gray-200">{{ item.quantity }}</span>
                <button @click="cart.updateQuantity(index, item.quantity + 1)" class="w-8 h-8 flex items-center justify-center text-sm hover:bg-gray-50">+</button>
              </div>
              <div class="flex items-center gap-4">
                <span class="text-sm font-medium">{{ formatPrice((item.salePrice || item.price) * item.quantity) }}</span>
                <button @click="cart.removeItem(index)" class="text-gray-400 hover:text-red-500 text-xs underline">{{ t.cart.remove }}</button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Özet -->
      <div class="bg-gray-light p-6">
        <h3 class="text-sm uppercase tracking-widest mb-6">{{ t.cart.title }}</h3>
        <div class="flex justify-between text-sm mb-3">
          <span>{{ t.cart.subtotal }}</span>
          <span>{{ formatPrice(cart.subtotal) }}</span>
        </div>
        <div class="flex justify-between text-sm mb-3">
          <span>{{ t.cart.shipping }}</span>
          <span>{{ cart.shippingCost === 0 ? t.cart.freeShipping : formatPrice(cart.shippingCost) }}</span>
        </div>
        <div class="border-t border-gray-300 pt-3 mt-3 flex justify-between font-medium">
          <span>{{ t.cart.total }}</span>
          <span>{{ formatPrice(cart.total) }}</span>
        </div>
        <router-link to="/checkout" class="btn-primary w-full block text-center mt-6">{{ t.cart.checkout }}</router-link>
        <router-link to="/products" class="block text-center text-xs underline mt-3 text-gray-500">{{ t.cart.continueShopping }}</router-link>
      </div>
    </div>
  </div>
</template>
