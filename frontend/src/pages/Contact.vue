<script setup>
import { ref } from 'vue'
import { useHead } from '@unhead/vue'
import { useLanguage } from '../composables/useLanguage'

const { locale } = useLanguage()

useHead({
  title: () => locale.value === 'tr' ? 'Iletisim | DB Line Official' : 'Contact | DB Line Official',
  meta: [
    { name: 'description', content: () => locale.value === 'tr'
      ? 'DB Line Official ile iletisime gecin. Sorulariniz, siparis takibi ve destek icin bize ulasin.'
      : 'Get in touch with DB Line Official. Reach us for questions, order tracking and support.'
    },
    { property: 'og:title', content: () => locale.value === 'tr' ? 'Iletisim | DB Line Official' : 'Contact | DB Line Official' },
    { property: 'og:type', content: 'website' },
    { property: 'og:url', content: 'https://dbline.com.tr/contact' },
  ],
  link: [{ rel: 'canonical', href: 'https://dbline.com.tr/contact' }]
})
const form = ref({ name: '', email: '', message: '' })
const sent = ref(false)

function handleSubmit() {
  sent.value = true
}
</script>

<template>
  <div class="max-w-4xl mx-auto px-4 py-16">
    <h1 class="text-3xl font-heading text-center mb-8">{{ locale === 'tr' ? 'İletişim' : 'Contact' }}</h1>

    <div class="grid grid-cols-1 md:grid-cols-2 gap-12">
      <!-- Form -->
      <div>
        <div v-if="sent" class="bg-green-50 border border-green-200 text-green-700 p-4 text-sm mb-6">
          {{ locale === 'tr' ? 'Mesajınız gönderildi. Teşekkürler!' : 'Your message has been sent. Thank you!' }}
        </div>

        <form @submit.prevent="handleSubmit" class="space-y-4">
          <div>
            <label class="text-xs text-gray-500 mb-1 block">{{ locale === 'tr' ? 'Ad Soyad' : 'Full Name' }}</label>
            <input v-model="form.name" type="text" class="input-field" required />
          </div>
          <div>
            <label class="text-xs text-gray-500 mb-1 block">{{ locale === 'tr' ? 'E-posta' : 'Email' }}</label>
            <input v-model="form.email" type="email" class="input-field" required />
          </div>
          <div>
            <label class="text-xs text-gray-500 mb-1 block">{{ locale === 'tr' ? 'Mesaj' : 'Message' }}</label>
            <textarea v-model="form.message" class="input-field" rows="5" required></textarea>
          </div>
          <button type="submit" class="btn-primary">{{ locale === 'tr' ? 'Gönder' : 'Send' }}</button>
        </form>
      </div>

      <!-- Bilgi -->
      <div class="space-y-6">
        <div>
          <h3 class="text-xs uppercase tracking-widest mb-2">{{ locale === 'tr' ? 'E-posta' : 'Email' }}</h3>
          <p class="text-sm text-gray-600">info@dbline.com.tr</p>
        </div>
        <div>
          <h3 class="text-xs uppercase tracking-widest mb-2">{{ locale === 'tr' ? 'Telefon' : 'Phone' }}</h3>
          <p class="text-sm text-gray-600">+90 (212) 000 00 00</p>
        </div>
        <div>
          <h3 class="text-xs uppercase tracking-widest mb-2">{{ locale === 'tr' ? 'Adres' : 'Address' }}</h3>
          <p class="text-sm text-gray-600">İstanbul, Türkiye</p>
        </div>
        <div>
          <h3 class="text-xs uppercase tracking-widest mb-2">{{ locale === 'tr' ? 'Sosyal Medya' : 'Social Media' }}</h3>
          <div class="flex gap-4">
            <a href="#" class="text-gray-600 hover:text-primary transition-colors">Instagram</a>
            <a href="#" class="text-gray-600 hover:text-primary transition-colors">Facebook</a>
            <a href="#" class="text-gray-600 hover:text-primary transition-colors">Twitter</a>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
