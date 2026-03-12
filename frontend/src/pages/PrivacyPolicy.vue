<script setup>
import { useHead } from '@unhead/vue'
import { useLanguage } from '../composables/useLanguage'
const { locale } = useLanguage()

useHead({
  title: () => locale.value === 'tr' ? 'Gizlilik Politikasi | DB Line Official' : 'Privacy Policy | DB Line Official',
  meta: [
    { name: 'description', content: () => locale.value === 'tr'
      ? 'DB Line Official gizlilik politikasi. Kisisel verilerinizin nasil toplandigi, kullanildigi ve korundugu hakkinda bilgi.'
      : 'DB Line Official privacy policy. Information about how your personal data is collected, used and protected.'
    },
  ],
  link: [{ rel: 'canonical', href: 'https://dbline.com.tr/privacy-policy' }]
})
</script>

<template>
  <div class="page-width py-16">
    <h1 class="text-3xl font-heading text-center mb-8">{{ locale === 'tr' ? 'Gizlilik Politikası' : 'Privacy Policy' }}</h1>

    <div class="max-w-3xl mx-auto text-gray-600 leading-relaxed text-sm">
      <template v-if="locale === 'tr'">
        <p class="mb-4">Son güncelleme: 2025</p>

        <h2 class="text-lg font-semibold text-gray-800 mt-8 mb-3">1. Toplanan Bilgiler</h2>
        <p class="mb-4">
          DB Line Official olarak, size daha iyi hizmet sunabilmek için aşağıdaki kişisel bilgileri topluyoruz:
          ad-soyad, e-posta adresi, telefon numarası, teslimat adresi ve ödeme bilgileri.
          Bu bilgiler yalnızca sipariş süreçleri ve müşteri hizmetleri kapsamında kullanılmaktadır.
        </p>

        <h2 class="text-lg font-semibold text-gray-800 mt-8 mb-3">2. Bilgilerin Kullanımı</h2>
        <p class="mb-4">
          Topladığımız bilgiler şu amaçlarla kullanılır: siparişlerinizi işleme almak ve teslim etmek,
          müşteri desteği sağlamak, ürün ve kampanya bilgilendirmeleri göndermek (izniniz dahilinde)
          ve alışveriş deneyiminizi iyileştirmek.
        </p>

        <h2 class="text-lg font-semibold text-gray-800 mt-8 mb-3">3. Bilgi Güvenliği</h2>
        <p class="mb-4">
          Kişisel bilgileriniz SSL şifreleme teknolojisi ile korunmaktadır. Ödeme bilgileriniz
          doğrudan ödeme altyapı sağlayıcımız (iyzico) tarafından işlenir ve sunucularımızda saklanmaz.
        </p>

        <h2 class="text-lg font-semibold text-gray-800 mt-8 mb-3">4. Çerezler</h2>
        <p class="mb-4">
          Web sitemiz, kullanıcı deneyimini geliştirmek amacıyla çerezler kullanmaktadır.
          Çerezler, oturum bilgilerinizi ve tercihlerinizi saklamak için kullanılır.
          Tarayıcı ayarlarınızdan çerezleri devre dışı bırakabilirsiniz.
        </p>

        <h2 class="text-lg font-semibold text-gray-800 mt-8 mb-3">5. Üçüncü Taraf Paylaşımı</h2>
        <p class="mb-4">
          Kişisel bilgileriniz, kargo şirketleri ve ödeme altyapı sağlayıcısı dışında
          hiçbir üçüncü tarafla paylaşılmaz. Bilgileriniz hiçbir koşulda satılmaz veya kiralanmaz.
        </p>

        <h2 class="text-lg font-semibold text-gray-800 mt-8 mb-3">6. Haklarınız</h2>
        <p class="mb-4">
          KVKK kapsamında kişisel verilerinizin işlenip işlenmediğini öğrenme, düzeltilmesini
          veya silinmesini talep etme hakkına sahipsiniz.
          Talepleriniz için <router-link to="/contact" class="text-accent hover:underline">iletişim</router-link> sayfamızdan bize ulaşabilirsiniz.
        </p>
      </template>

      <template v-else>
        <p class="mb-4">Last updated: 2025</p>

        <h2 class="text-lg font-semibold text-gray-800 mt-8 mb-3">1. Information We Collect</h2>
        <p class="mb-4">
          At DB Line Official, we collect the following personal information to serve you better:
          full name, email address, phone number, delivery address, and payment details.
          This information is used solely for order processing and customer service purposes.
        </p>

        <h2 class="text-lg font-semibold text-gray-800 mt-8 mb-3">2. How We Use Your Information</h2>
        <p class="mb-4">
          The information we collect is used to: process and deliver your orders,
          provide customer support, send product and campaign updates (with your consent),
          and improve your shopping experience.
        </p>

        <h2 class="text-lg font-semibold text-gray-800 mt-8 mb-3">3. Data Security</h2>
        <p class="mb-4">
          Your personal information is protected with SSL encryption technology. Your payment
          details are processed directly by our payment provider (iyzico) and are not stored on our servers.
        </p>

        <h2 class="text-lg font-semibold text-gray-800 mt-8 mb-3">4. Cookies</h2>
        <p class="mb-4">
          Our website uses cookies to enhance user experience. Cookies are used to store your
          session information and preferences. You can disable cookies through your browser settings.
        </p>

        <h2 class="text-lg font-semibold text-gray-800 mt-8 mb-3">5. Third-Party Sharing</h2>
        <p class="mb-4">
          Your personal information is not shared with any third party other than shipping companies
          and our payment provider. Your data is never sold or rented under any circumstances.
        </p>

        <h2 class="text-lg font-semibold text-gray-800 mt-8 mb-3">6. Your Rights</h2>
        <p class="mb-4">
          You have the right to inquire whether your personal data is being processed, and to request
          correction or deletion of your data.
          Please reach out via our <router-link to="/contact" class="text-accent hover:underline">contact</router-link> page for any requests.
        </p>
      </template>
    </div>
  </div>
</template>
