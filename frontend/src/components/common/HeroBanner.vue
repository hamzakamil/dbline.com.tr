<script setup>
import { useLanguage } from '../../composables/useLanguage'

const { t, locale, localized } = useLanguage()

const props = defineProps({
  heroImage: { type: String, default: '' },
  heroSlogan: { type: Object, default: () => ({ tr: "Pilates'te denge ayaktan başlar.", en: 'Balance in Pilates starts from the feet.' }) },
  banners: { type: Array, default: () => [] }
})
</script>

<template>
  <section class="relative">
    <!-- Hero with uploaded image -->
    <div
      v-if="heroImage"
      class="relative w-full overflow-hidden"
    >
      <img
        :src="heroImage"
        alt="DB Line"
        class="w-full h-auto object-cover object-center"
        :style="{ maxHeight: 'var(--hero-max-height)' }"
      />
      <!-- Slogan overlay -->
      <div class="absolute inset-0 flex items-end justify-center pb-12 md:pb-16">
        <div class="text-center px-4">
          <p class="text-white text-lg md:text-2xl lg:text-3xl font-light tracking-wide drop-shadow-lg">
            {{ localized(heroSlogan) }}
          </p>
        </div>
      </div>
    </div>

    <!-- Dynamic banners from admin -->
    <div
      v-else-if="banners && banners.length > 0"
      class="relative w-full overflow-hidden"
    >
      <div
        v-for="(banner, index) in banners"
        :key="index"
        v-show="index === 0"
        class="relative w-full"
      >
        <img
          v-if="banner.image"
          :src="banner.image"
          alt=""
          class="w-full h-auto object-cover object-center" :style="{ maxHeight: 'var(--hero-max-height)' }"
        />
        <div class="absolute inset-0 flex items-end justify-center pb-12 md:pb-16">
          <div class="text-center px-4">
            <h2 class="text-white text-2xl md:text-4xl font-light tracking-wide drop-shadow-lg mb-3">
              {{ localized(banner.title) }}
            </h2>
            <p v-if="localized(banner.subtitle)" class="text-white text-sm md:text-base font-light drop-shadow-md mb-6">
              {{ localized(banner.subtitle) }}
            </p>
            <router-link
              :to="banner.link || '/products'"
              class="bg-white text-primary px-8 py-3 text-sm uppercase tracking-widest hover:bg-gray-100 transition-colors inline-block"
            >
              {{ t.home.shopNow }}
            </router-link>
          </div>
        </div>
      </div>
    </div>

    <!-- Default hero (no image uploaded yet) - uses dblineekran.jpg -->
    <div
      v-else
      class="relative w-full overflow-hidden"
    >
      <img
        src="/dblineekran.jpg"
        alt="DB Line"
        class="w-full h-auto object-cover object-center" :style="{ maxHeight: 'var(--hero-max-height)' }"
      />
      <div class="absolute inset-0 flex items-end justify-center pb-12 md:pb-16">
        <div class="text-center px-4">
          <p class="text-white text-lg md:text-2xl lg:text-3xl font-light tracking-wide drop-shadow-lg">
            {{ localized(heroSlogan) }}
          </p>
        </div>
      </div>
    </div>
  </section>
</template>
