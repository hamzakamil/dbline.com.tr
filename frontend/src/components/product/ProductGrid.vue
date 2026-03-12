<script setup>
import ProductCard from './ProductCard.vue'

defineProps({
  products: { type: Array, default: () => [] },
  cols: { type: Number, default: 4 }
})
</script>

<template>
  <div
    class="grid grid-cols-2 product-grid-dynamic"
    :style="{ gap: 'var(--product-grid-gap)' }"
  >
    <ProductCard v-for="product in products" :key="product._id" :product="product" />
  </div>
</template>
