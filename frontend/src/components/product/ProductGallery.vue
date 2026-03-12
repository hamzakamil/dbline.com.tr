<script setup>
import { ref } from 'vue'

const props = defineProps({
  images: { type: Array, default: () => [] }
})

const activeIndex = ref(0)
</script>

<template>
  <div class="flex flex-col-reverse md:flex-row gap-4">
    <!-- Küçük resimler -->
    <div class="flex md:flex-col gap-2 overflow-x-auto md:overflow-y-auto md:max-h-[600px]">
      <button
        v-for="(img, index) in images"
        :key="index"
        @click="activeIndex = index"
        :class="['w-16 h-16 md:w-20 md:h-20 flex-shrink-0 border-2 overflow-hidden', activeIndex === index ? 'border-primary' : 'border-transparent']"
      >
        <img :src="img" alt="" class="w-full h-full object-cover" />
      </button>
    </div>

    <!-- Ana resim -->
    <div class="flex-1 aspect-square bg-gray-light overflow-hidden">
      <img
        :src="images[activeIndex] || '/placeholder.svg'"
        alt=""
        class="w-full h-full object-cover"
      />
    </div>
  </div>
</template>
