<script setup>
import { useRoute } from 'vue-router'
import { useLanguage } from '../composables/useLanguage'

const route = useRoute()
const { t } = useLanguage()
</script>

<template>
  <div class="min-h-[60vh] flex items-center justify-center px-4 py-12">
    <div class="text-center">
      <div class="w-20 h-20 mx-auto mb-6 rounded-full bg-green-100 flex items-center justify-center">
        <svg class="w-10 h-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
        </svg>
      </div>
      <h1 class="text-2xl font-heading mb-2">{{ t.checkout.orderSuccess }}</h1>
      <p v-if="route.query.orderId" class="text-gray-500 text-sm mb-6">
        {{ t.checkout.orderNumber }}: #{{ route.query.orderId?.slice(-8).toUpperCase() }}
      </p>
      <router-link to="/" class="btn-primary inline-block">{{ t.cart.continueShopping }}</router-link>
    </div>
  </div>
</template>
