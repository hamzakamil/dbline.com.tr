<script setup>
import { useHead } from '@unhead/vue'
import { useLanguage } from '../composables/useLanguage'
const { locale } = useLanguage()

useHead({
  title: () => locale.value === 'tr' ? 'Nakliye Politikasi | DB Line Official' : 'Shipping Policy | DB Line Official',
  meta: [
    { name: 'description', content: () => locale.value === 'tr'
      ? 'DB Line Official kargo ve nakliye politikasi. 500TL uzeri ucretsiz kargo. 3-7 is gunu teslimat.'
      : 'DB Line Official shipping policy. Free shipping over 500TL. 3-7 business day delivery.'
    },
  ],
  link: [{ rel: 'canonical', href: 'https://dbline.com.tr/shipping-policy' }]
})
</script>

<template>
  <div class="page-width py-16">
    <h1 class="text-3xl font-heading text-center mb-8">{{ locale === 'tr' ? 'Nakliye Politikası' : 'Shipping Policy' }}</h1>

    <div class="max-w-3xl mx-auto text-gray-600 leading-relaxed text-sm">
      <template v-if="locale === 'tr'">
        <h2 class="text-lg font-semibold text-gray-800 mt-8 mb-3">1. Kargo Ücreti</h2>
        <p class="mb-4">
          500 TL ve üzeri siparişlerde kargo ücretsizdir.
          500 TL altındaki siparişlerde standart kargo ücreti uygulanır.
          Kargo ücreti, ödeme aşamasında sepetinizde gösterilir.
        </p>

        <h2 class="text-lg font-semibold text-gray-800 mt-8 mb-3">2. Teslimat Süresi</h2>
        <p class="mb-4">
          Siparişleriniz, ödeme onayından sonra 1-3 iş günü içinde kargoya verilir.
          Kargo teslimat süresi bulunduğunuz bölgeye göre 2-5 iş günü arasında değişmektedir.
          Toplam teslimat süresi ortalama 3-7 iş günüdür.
        </p>

        <h2 class="text-lg font-semibold text-gray-800 mt-8 mb-3">3. Kargo Takibi</h2>
        <p class="mb-4">
          Siparişiniz kargoya verildikten sonra, kargo takip numarası e-posta adresinize gönderilir.
          Bu numara ile kargo firmasının web sitesinden gönderinizi takip edebilirsiniz.
        </p>

        <h2 class="text-lg font-semibold text-gray-800 mt-8 mb-3">4. Teslimat Bölgeleri</h2>
        <p class="mb-4">
          Türkiye genelinde tüm il ve ilçelere teslimat yapılmaktadır.
          Uluslararası gönderi seçenekleri için lütfen
          <router-link to="/contact" class="text-accent hover:underline">iletişim</router-link> sayfamızdan bize ulaşın.
        </p>

        <h2 class="text-lg font-semibold text-gray-800 mt-8 mb-3">5. Hasarlı Teslimat</h2>
        <p class="mb-4">
          Kargo tesliminde paketinizi kontrol ediniz. Hasarlı veya açılmış paketleri teslim almayınız
          ve durumu tutanak ile kayıt altına aldırınız. Hasarlı teslimat durumunda 48 saat içinde
          bize bildirmenizi rica ederiz.
        </p>
      </template>

      <template v-else>
        <h2 class="text-lg font-semibold text-gray-800 mt-8 mb-3">1. Shipping Cost</h2>
        <p class="mb-4">
          Orders over 500 TL qualify for free shipping.
          A standard shipping fee applies for orders under 500 TL.
          The shipping cost is displayed in your cart at checkout.
        </p>

        <h2 class="text-lg font-semibold text-gray-800 mt-8 mb-3">2. Delivery Time</h2>
        <p class="mb-4">
          Orders are shipped within 1-3 business days after payment confirmation.
          Delivery time varies between 2-5 business days depending on your location.
          Total estimated delivery is 3-7 business days.
        </p>

        <h2 class="text-lg font-semibold text-gray-800 mt-8 mb-3">3. Shipment Tracking</h2>
        <p class="mb-4">
          Once your order is shipped, a tracking number will be sent to your email address.
          You can track your shipment on the carrier's website using this number.
        </p>

        <h2 class="text-lg font-semibold text-gray-800 mt-8 mb-3">4. Delivery Areas</h2>
        <p class="mb-4">
          We deliver to all cities and districts across Turkey.
          For international shipping options, please reach out via our
          <router-link to="/contact" class="text-accent hover:underline">contact</router-link> page.
        </p>

        <h2 class="text-lg font-semibold text-gray-800 mt-8 mb-3">5. Damaged Delivery</h2>
        <p class="mb-4">
          Please inspect your package upon delivery. Do not accept damaged or opened packages
          and have the situation documented. Please notify us within 48 hours in case of
          damaged delivery.
        </p>
      </template>
    </div>
  </div>
</template>
