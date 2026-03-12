<script setup>
import { useHead } from '@unhead/vue'
import { useLanguage } from '../composables/useLanguage'
const { locale } = useLanguage()

useHead({
  title: () => locale.value === 'tr' ? 'Hizmet Sartlari | DB Line Official' : 'Terms of Service | DB Line Official',
  meta: [
    { name: 'description', content: () => locale.value === 'tr'
      ? 'DB Line Official kullanim sartlari ve kosullari. Alisveris yapmadan once lutfen okuyunuz.'
      : 'DB Line Official terms of service and conditions. Please read before making a purchase.'
    },
  ],
  link: [{ rel: 'canonical', href: 'https://dbline.com.tr/terms-of-service' }]
})
</script>

<template>
  <div class="page-width py-16">
    <h1 class="text-3xl font-heading text-center mb-8">{{ locale === 'tr' ? 'Hizmet Şartları' : 'Terms of Service' }}</h1>

    <div class="max-w-3xl mx-auto text-gray-600 leading-relaxed text-sm">
      <template v-if="locale === 'tr'">
        <p class="mb-4">
          Bu web sitesini kullanarak aşağıdaki şartları kabul etmiş sayılırsınız.
          Lütfen alışveriş yapmadan önce bu şartları dikkatle okuyunuz.
        </p>

        <h2 class="text-lg font-semibold text-gray-800 mt-8 mb-3">1. Genel Şartlar</h2>
        <p class="mb-4">
          dbline.com.tr web sitesi DB Line Official tarafından işletilmektedir.
          Site üzerinden sunulan ürün ve hizmetler Türkiye Cumhuriyeti yasalarına tabidir.
          Siteyi kullanarak bu şartları ve gizlilik politikamızı kabul etmiş olursunuz.
        </p>

        <h2 class="text-lg font-semibold text-gray-800 mt-8 mb-3">2. Ürün Bilgileri ve Fiyatlandırma</h2>
        <p class="mb-4">
          Ürün görselleri ve açıklamaları mümkün olduğunca doğru sunulmaya çalışılmaktadır.
          Ancak renk ve boyut gibi detaylar ekran ayarlarınıza bağlı olarak farklılık gösterebilir.
          Fiyatlar önceden bildirim yapılmaksızın değiştirilebilir. Sipariş anındaki fiyat geçerlidir.
        </p>

        <h2 class="text-lg font-semibold text-gray-800 mt-8 mb-3">3. Sipariş ve Ödeme</h2>
        <p class="mb-4">
          Sipariş vermek için üyelik oluşturmanız gerekmektedir. Ödeme işlemleri güvenli
          ödeme altyapısı üzerinden gerçekleştirilir. Siparişiniz, ödemenin onaylanmasının ardından
          işleme alınır.
        </p>

        <h2 class="text-lg font-semibold text-gray-800 mt-8 mb-3">4. Fikri Mülkiyet</h2>
        <p class="mb-4">
          Site üzerindeki tüm içerik, görseller, logolar ve tasarımlar DB Line Official'a aittir.
          İzinsiz kopyalanması, çoğaltılması veya dağıtılması yasaktır.
        </p>

        <h2 class="text-lg font-semibold text-gray-800 mt-8 mb-3">5. Sorumluluk Sınırı</h2>
        <p class="mb-4">
          DB Line Official, site kullanımından kaynaklanan dolaylı zararlardan sorumlu tutulamaz.
          Ürünlerin kullanım talimatlarına uyulmamasından doğan sorunlar garanti kapsamı dışındadır.
        </p>

        <h2 class="text-lg font-semibold text-gray-800 mt-8 mb-3">6. Uyuşmazlık Çözümü</h2>
        <p class="mb-4">
          Bu şartlardan doğan uyuşmazlıklarda Türkiye Cumhuriyeti mahkemeleri yetkilidir.
          Tüketici hakları kapsamındaki şikayetleriniz için Tüketici Hakem Heyetine başvurabilirsiniz.
        </p>

        <h2 class="text-lg font-semibold text-gray-800 mt-8 mb-3">7. İletişim</h2>
        <p class="mb-4">
          Sorularınız için <router-link to="/contact" class="text-accent hover:underline">iletişim</router-link> sayfamızdan bize ulaşabilirsiniz.
        </p>
      </template>

      <template v-else>
        <p class="mb-4">
          By using this website, you agree to the following terms.
          Please read these terms carefully before making a purchase.
        </p>

        <h2 class="text-lg font-semibold text-gray-800 mt-8 mb-3">1. General Terms</h2>
        <p class="mb-4">
          The website dbline.com.tr is operated by DB Line Official.
          Products and services offered on this site are subject to the laws of the Republic of Turkey.
          By using this site, you accept these terms and our privacy policy.
        </p>

        <h2 class="text-lg font-semibold text-gray-800 mt-8 mb-3">2. Product Information and Pricing</h2>
        <p class="mb-4">
          Product images and descriptions are presented as accurately as possible.
          However, details such as color and size may vary depending on your screen settings.
          Prices may change without prior notice. The price at the time of order placement applies.
        </p>

        <h2 class="text-lg font-semibold text-gray-800 mt-8 mb-3">3. Orders and Payment</h2>
        <p class="mb-4">
          You need to create an account to place an order. Payment transactions are processed
          through a secure payment infrastructure. Your order will be processed after payment confirmation.
        </p>

        <h2 class="text-lg font-semibold text-gray-800 mt-8 mb-3">4. Intellectual Property</h2>
        <p class="mb-4">
          All content, images, logos, and designs on this site belong to DB Line Official.
          Unauthorized copying, reproduction, or distribution is prohibited.
        </p>

        <h2 class="text-lg font-semibold text-gray-800 mt-8 mb-3">5. Limitation of Liability</h2>
        <p class="mb-4">
          DB Line Official cannot be held liable for indirect damages arising from the use of this site.
          Issues arising from failure to follow product usage instructions are not covered under warranty.
        </p>

        <h2 class="text-lg font-semibold text-gray-800 mt-8 mb-3">6. Dispute Resolution</h2>
        <p class="mb-4">
          Turkish courts have jurisdiction over disputes arising from these terms.
          For complaints within consumer rights, you may apply to the Consumer Arbitration Committee.
        </p>

        <h2 class="text-lg font-semibold text-gray-800 mt-8 mb-3">7. Contact</h2>
        <p class="mb-4">
          For any questions, please reach out via our <router-link to="/contact" class="text-accent hover:underline">contact</router-link> page.
        </p>
      </template>
    </div>
  </div>
</template>
