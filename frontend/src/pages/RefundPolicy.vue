<script setup>
import { useHead } from '@unhead/vue'
import { useLanguage } from '../composables/useLanguage'
const { locale } = useLanguage()

useHead({
  title: () => locale.value === 'tr' ? 'Geri Odeme Politikasi | DB Line Official' : 'Refund Policy | DB Line Official',
  meta: [
    { name: 'description', content: () => locale.value === 'tr'
      ? 'DB Line Official iade ve geri odeme politikasi. 14 gun iade garantisi. Kolay iade sureci.'
      : 'DB Line Official return and refund policy. 14-day return guarantee. Easy return process.'
    },
  ],
  link: [{ rel: 'canonical', href: 'https://dbline.com.tr/refund-policy' }]
})
</script>

<template>
  <div class="page-width py-16">
    <h1 class="text-3xl font-heading text-center mb-8">{{ locale === 'tr' ? 'Geri Ödeme Politikası' : 'Refund Policy' }}</h1>

    <div class="max-w-3xl mx-auto text-gray-600 leading-relaxed text-sm">
      <template v-if="locale === 'tr'">
        <h2 class="text-lg font-semibold text-gray-800 mt-8 mb-3">1. İade Koşulları</h2>
        <p class="mb-4">
          Satın aldığınız ürünleri, teslim tarihinden itibaren 14 gün içinde iade edebilirsiniz.
          İade edilecek ürünlerin kullanılmamış, yıkanmamış ve orijinal ambalajında olması gerekmektedir.
          Etiketleri çıkarılmış veya kullanım izi bulunan ürünler iade kabul edilmez.
        </p>

        <h2 class="text-lg font-semibold text-gray-800 mt-8 mb-3">2. İade Süreci</h2>
        <p class="mb-4">
          İade talebinizi <router-link to="/contact" class="text-accent hover:underline">iletişim</router-link> sayfamız
          üzerinden veya e-posta yoluyla iletebilirsiniz. Talebiniz onaylandıktan sonra size iade kargo kodu gönderilecektir.
          Ürünü anlaşmalı kargo firması ile göndermeniz yeterlidir.
        </p>

        <h2 class="text-lg font-semibold text-gray-800 mt-8 mb-3">3. Geri Ödeme</h2>
        <p class="mb-4">
          İade edilen ürün tarafımıza ulaştıktan ve kontrolleri yapıldıktan sonra, geri ödeme işlemi
          5-10 iş günü içinde gerçekleştirilir. Ödeme, siparişte kullanılan ödeme yöntemine iade edilir.
          Kredi kartı ile yapılan ödemelerde, bankanızın iade süresi değişkenlik gösterebilir.
        </p>

        <h2 class="text-lg font-semibold text-gray-800 mt-8 mb-3">4. Değişim</h2>
        <p class="mb-4">
          Beden değişikliği talep edebilirsiniz. Değişim için aynı iade süreci geçerlidir.
          Stokta mevcut olması durumunda yeni beden gönderilir, aksi halde iade işlemi yapılır.
        </p>

        <h2 class="text-lg font-semibold text-gray-800 mt-8 mb-3">5. İade Edilemeyecek Ürünler</h2>
        <p class="mb-4">
          Hijyen nedeniyle çorap ürünleri, ambalajı açılmış iç giyim ürünleri ve kişiye özel
          hazırlanan ürünler iade kabul edilmez.
        </p>
      </template>

      <template v-else>
        <h2 class="text-lg font-semibold text-gray-800 mt-8 mb-3">1. Return Conditions</h2>
        <p class="mb-4">
          You can return purchased items within 14 days of the delivery date.
          Items must be unused, unwashed, and in their original packaging.
          Items with removed tags or signs of use will not be accepted for return.
        </p>

        <h2 class="text-lg font-semibold text-gray-800 mt-8 mb-3">2. Return Process</h2>
        <p class="mb-4">
          You can submit your return request through our <router-link to="/contact" class="text-accent hover:underline">contact</router-link> page
          or via email. Once your request is approved, a return shipping code will be sent to you.
          Simply ship the product using the contracted courier.
        </p>

        <h2 class="text-lg font-semibold text-gray-800 mt-8 mb-3">3. Refund</h2>
        <p class="mb-4">
          After the returned product is received and inspected, the refund will be processed
          within 5-10 business days. Payment will be refunded to the original payment method.
          For credit card payments, your bank's refund timeline may vary.
        </p>

        <h2 class="text-lg font-semibold text-gray-800 mt-8 mb-3">4. Exchange</h2>
        <p class="mb-4">
          You can request a size exchange. The same return process applies for exchanges.
          If the requested size is in stock, it will be shipped; otherwise, a refund will be issued.
        </p>

        <h2 class="text-lg font-semibold text-gray-800 mt-8 mb-3">5. Non-Returnable Items</h2>
        <p class="mb-4">
          Due to hygiene reasons, socks, opened intimate apparel, and custom-made
          products are not eligible for returns.
        </p>
      </template>
    </div>
  </div>
</template>
