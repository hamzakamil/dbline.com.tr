<script setup>
import { useHead } from '@unhead/vue'
import { useLanguage } from '../composables/useLanguage'
const { locale } = useLanguage()

useHead({
  title: () => locale.value === 'tr' ? 'Hakkimizda | DB Line Official' : 'About Us | DB Line Official',
  meta: [
    { name: 'description', content: () => locale.value === 'tr'
      ? 'DB Line Official - Premium pilates coraplari, taytlar ve spor aksesuarlari tasarlayan Turk markasi. Hikayemizi kesfet.'
      : 'DB Line Official - Turkish brand designing premium pilates socks, leggings and sport accessories. Discover our story.'
    },
    { property: 'og:title', content: () => locale.value === 'tr' ? 'Hakkimizda | DB Line Official' : 'About Us | DB Line Official' },
    { property: 'og:type', content: 'website' },
    { property: 'og:url', content: 'https://dbline.com.tr/about' },
  ],
  link: [{ rel: 'canonical', href: 'https://dbline.com.tr/about' }]
})
</script>

<template>
  <div class="max-w-4xl mx-auto px-4 py-16">
    <h1 class="text-3xl font-heading text-center mb-8">{{ locale === 'tr' ? 'Hakkımızda' : 'About Us' }}</h1>

    <div class="prose max-w-none text-gray-600 leading-relaxed">
      <template v-if="locale === 'tr'">
        <p class="text-lg mb-6">
          DB Line Official olarak, aktif yaşam tarzını benimseyen kadınlar için premium kalitede tayt, çorap ve spor aksesuarları tasarlıyoruz.
        </p>
        <p class="mb-6">
          Markamız, konforu ve stili bir araya getirerek pilates, yoga ve günlük spor aktivitelerinizde kendinizi en iyi hissetmenizi sağlıyor. Her ürünümüz, en kaliteli kumaşlardan özenle üretilmektedir.
        </p>
        <p class="mb-6">
          Misyonumuz, hareket eden her kadına güven ve rahatlık sunmaktır. Sürdürülebilir üretim süreçleri ve yenilikçi tasarımlarımızla sektörde fark yaratmayı hedefliyoruz.
        </p>
      </template>
      <template v-else>
        <p class="text-lg mb-6">
          At DB Line Official, we design premium quality leggings, socks and sports accessories for women who embrace an active lifestyle.
        </p>
        <p class="mb-6">
          Our brand combines comfort and style to make you feel your best during pilates, yoga and daily sports activities. Each of our products is carefully crafted from the finest fabrics.
        </p>
        <p class="mb-6">
          Our mission is to offer confidence and comfort to every woman in motion. We aim to make a difference in the industry with our sustainable production processes and innovative designs.
        </p>
      </template>
    </div>
  </div>
</template>
