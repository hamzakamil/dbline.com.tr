<script setup>
import { ref, onMounted } from 'vue'
import { useLanguage } from '../../composables/useLanguage'
import api from '../../utils/api'

const { locale, localized } = useLanguage()

const visible = ref(false)
const step = ref('form') // 'form' | 'success'
const submitting = ref(false)
const couponCode = ref('')

const form = ref({
  name: '',
  surname: '',
  phone: '',
  email: '',
  whatsappOptIn: true
})

const popupConfig = ref({
  active: true,
  delaySeconds: 3,
  image: '',
  title: { tr: 'İlk Alışverişinde %10 İndirim', en: 'Get 10% Off Your First Order' },
  subtitle: { tr: 'Hoşgeldin indirimi için bilgilerini gir', en: 'Enter your details for a welcome discount' },
  discountPercent: 10
})

function getCookie(name) {
  const match = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'))
  return match ? match[2] : null
}

function setCookie(name, value, days) {
  const maxAge = days * 24 * 60 * 60
  document.cookie = `${name}=${value}; max-age=${maxAge}; path=/`
}

async function fetchPopupSettings() {
  try {
    const { data } = await api.get(`/admin/settings`)
    if (data.marketingPopup) {
      popupConfig.value = { ...popupConfig.value, ...data.marketingPopup }
    }
  } catch {
    // varsayılan kullan
  }
}

async function submitForm() {
  if (!form.value.name || !form.value.phone) return
  submitting.value = true
  try {
    const { data } = await api.post(`/coupons/generate-whatsapp`, {
      name: form.value.name,
      surname: form.value.surname,
      phone: form.value.phone,
      email: form.value.email
    })
    couponCode.value = data.couponCode
    step.value = 'success'
    setCookie('dbline_promo_shown', '1', 30)
  } catch {
    alert(locale.value === 'tr' ? 'Bir hata oluştu' : 'An error occurred')
  } finally {
    submitting.value = false
  }
}

function close() {
  visible.value = false
  setCookie('dbline_promo_shown', '1', 30)
}

onMounted(async () => {
  if (getCookie('dbline_promo_shown')) return
  await fetchPopupSettings()
  if (!popupConfig.value.active) return
  setTimeout(() => {
    visible.value = true
  }, (popupConfig.value.delaySeconds || 3) * 1000)
})
</script>

<template>
  <Teleport to="body">
    <transition name="popup-fade">
      <div v-if="visible" class="fixed inset-0 z-[100] flex items-center justify-center p-4" @click.self="close">
        <!-- Overlay -->
        <div class="absolute inset-0 bg-black/50"></div>

        <!-- Popup -->
        <div class="relative bg-white w-full max-w-md shadow-2xl animate-slide-up overflow-hidden">
          <!-- Kapatma butonu -->
          <button @click="close" class="absolute top-3 right-3 z-10 w-8 h-8 flex items-center justify-center text-gray-400 hover:text-gray-600">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>

          <!-- Görsel -->
          <div v-if="popupConfig.image" class="w-full h-40 bg-gray-100">
            <img :src="popupConfig.image" alt="" class="w-full h-full object-cover" />
          </div>
          <div v-else class="w-full h-32 flex items-center justify-center" :style="{ backgroundColor: 'var(--color-banner-bg)' }">
            <img src="/logo.svg" alt="DB Line" class="h-16 opacity-70" />
          </div>

          <div class="p-6">
            <!-- Form step -->
            <template v-if="step === 'form'">
              <h3 class="text-xl font-heading font-semibold text-center mb-1">
                {{ localized(popupConfig.title) }}
              </h3>
              <p class="text-sm text-gray-500 text-center mb-5">
                {{ localized(popupConfig.subtitle) }}
              </p>

              <div class="space-y-3">
                <div class="grid grid-cols-2 gap-3">
                  <input v-model="form.name" type="text" class="input-field text-sm"
                    :placeholder="locale === 'tr' ? 'Ad' : 'First Name'" required />
                  <input v-model="form.surname" type="text" class="input-field text-sm"
                    :placeholder="locale === 'tr' ? 'Soyad' : 'Last Name'" />
                </div>
                <input v-model="form.phone" type="tel" class="input-field text-sm"
                  :placeholder="locale === 'tr' ? 'WhatsApp No (+90...)' : 'WhatsApp No (+90...)'" required />
                <input v-model="form.email" type="email" class="input-field text-sm"
                  :placeholder="locale === 'tr' ? 'E-posta (opsiyonel)' : 'Email (optional)'" />

                <label class="flex items-start gap-2 cursor-pointer">
                  <input type="checkbox" v-model="form.whatsappOptIn" class="w-4 h-4 accent-accent mt-0.5" />
                  <span class="text-xs text-gray-500">
                    {{ locale === 'tr' ? 'WhatsApp bildirimlerini kabul ediyorum' : 'I accept WhatsApp notifications' }}
                  </span>
                </label>

                <button
                  @click="submitForm"
                  :disabled="submitting || !form.name || !form.phone"
                  class="btn-accent w-full"
                  :style="{ borderRadius: 'var(--btn-radius)' }"
                >
                  {{ submitting ? '...' : (locale === 'tr' ? 'İNDİRİM KODUMU AL' : 'GET MY DISCOUNT CODE') }}
                </button>
              </div>

              <p class="text-[10px] text-gray-400 text-center mt-3">
                <router-link to="/privacy-policy" class="underline" @click="close">
                  {{ locale === 'tr' ? 'Gizlilik politikamızı okuyun' : 'Read our privacy policy' }}
                </router-link>
              </p>
            </template>

            <!-- Success step -->
            <template v-else>
              <div class="text-center py-4">
                <div class="w-14 h-14 mx-auto mb-3 rounded-full flex items-center justify-center" :style="{ backgroundColor: 'var(--color-accent)' }">
                  <svg class="w-7 h-7 text-white" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <h3 class="text-lg font-heading font-semibold mb-2">
                  {{ locale === 'tr' ? 'İndirim Kodunuz Hazır!' : 'Your Discount Code is Ready!' }}
                </h3>
                <div class="bg-gray-50 border-2 border-dashed border-accent py-3 px-6 text-xl font-mono font-bold tracking-widest my-4">
                  {{ couponCode }}
                </div>
                <p class="text-sm text-gray-500 mb-4">
                  {{ locale === 'tr' ? 'Bu kodu WhatsApp üzerinden de aldınız.' : 'This code was also sent via WhatsApp.' }}
                </p>
                <button @click="close" class="btn-primary text-sm" :style="{ borderRadius: 'var(--btn-radius)' }">
                  {{ locale === 'tr' ? 'ALIŞVERİŞE BAŞLA' : 'START SHOPPING' }}
                </button>
              </div>
            </template>
          </div>
        </div>
      </div>
    </transition>
  </Teleport>
</template>

<style scoped>
.popup-fade-enter-active,
.popup-fade-leave-active {
  transition: opacity 0.3s ease;
}
.popup-fade-enter-from,
.popup-fade-leave-to {
  opacity: 0;
}
.animate-slide-up {
  animation: slideUp 0.4s ease-out;
}
@keyframes slideUp {
  from {
    transform: translateY(20px);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
}
</style>
