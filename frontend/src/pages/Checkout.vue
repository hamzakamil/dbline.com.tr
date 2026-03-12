<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useCartStore } from '../stores/cart'
import { useAuthStore } from '../stores/auth'
import { useLanguage } from '../composables/useLanguage'
import api from '../utils/api'

// Google login
const googleEnabled = ref(false)
const googleClientId = ref('')
const googleLoading = ref(false)
const googleError = ref('')

const router = useRouter()
const cart = useCartStore()
const auth = useAuthStore()
const { t, locale, formatPrice } = useLanguage()

// Çok adımlı akış
const step = ref('contact') // contact | verification | shipping | payment
const smsEnabled = ref(false)
const verificationType = ref('email') // sms | email

// Contact step
const contactEmail = ref('')
const contactLoading = ref(false)
const contactError = ref('')

// Verification step
const phoneNumber = ref('')
const otpCode = ref('')
const otpSent = ref(false)
const otpLoading = ref(false)
const verifyLoading = ref(false)
const verifyError = ref('')
const resendTimer = ref(0)
let resendInterval = null

// Shipping step
const form = ref({
  fullName: '',
  phone: '',
  street: '',
  city: '',
  district: '',
  zipCode: ''
})

// Payment step
const card = ref({
  cardHolderName: '',
  cardNumber: '',
  expireMonth: '',
  expireYear: '',
  cvc: ''
})

const loading = ref(false)
const error = ref('')
const paymentProvider = ref('iyzico')

// Kupon state
const couponInput = ref('')
const couponLoading = ref(false)
const couponError = ref('')
const appliedCoupon = ref(null)

const discountAmount = computed(() => {
  if (!appliedCoupon.value) return 0
  if (appliedCoupon.value.discountType === 'percentage') {
    return Math.round(cart.subtotal * appliedCoupon.value.discountValue / 100)
  }
  return appliedCoupon.value.discountValue
})

const finalTotal = computed(() => {
  return cart.subtotal - discountAmount.value + cart.shippingCost
})

// Kart numarası formatlama
const formattedCardNumber = computed({
  get: () => card.value.cardNumber,
  set: (val) => {
    card.value.cardNumber = val.replace(/\D/g, '').replace(/(.{4})/g, '$1 ').trim().substring(0, 19)
  }
})

// Kart tipi tespiti
const cardType = computed(() => {
  const num = card.value.cardNumber.replace(/\s/g, '')
  if (/^4/.test(num)) return 'visa'
  if (/^5[1-5]/.test(num) || /^2[2-7]/.test(num)) return 'mastercard'
  if (/^9792/.test(num)) return 'troy'
  return ''
})

// Adım bilgisi
const steps = computed(() => {
  const all = []
  if (!auth.isLoggedIn) {
    all.push({ key: 'contact', label: t.value.checkout.contactInfo })
    all.push({ key: 'verification', label: t.value.checkout.verification })
  }
  all.push({ key: 'shipping', label: t.value.checkout.shippingStep })
  all.push({ key: 'payment', label: t.value.checkout.paymentStep })
  return all
})

const currentStepIndex = computed(() => steps.value.findIndex(s => s.key === step.value))

// Giriş yapmış kullanıcı kontrolü
function initStep() {
  if (auth.isLoggedIn) {
    step.value = 'shipping'
    prefillFromAuth()
  } else {
    step.value = 'contact'
  }
}

function prefillFromAuth() {
  if (auth.user) {
    form.value.fullName = auth.user.name || ''
    form.value.phone = auth.user.phone || ''
  }
}

// STEP 1: Contact — E-posta gönder
async function submitContact() {
  if (!contactEmail.value.trim()) {
    contactError.value = locale.value === 'tr' ? 'E-posta adresi gerekli' : 'Email address is required'
    return
  }
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailRegex.test(contactEmail.value.trim())) {
    contactError.value = locale.value === 'tr' ? 'Geçerli bir e-posta adresi girin' : 'Enter a valid email address'
    return
  }

  contactLoading.value = true
  contactError.value = ''

  try {
    const { data } = await api.post('/auth/checkout-register', {
      email: contactEmail.value.trim()
    })

    smsEnabled.value = data.smsEnabled
    verificationType.value = data.smsEnabled ? 'sms' : 'email'
    step.value = 'verification'

    if (!data.smsEnabled) {
      otpSent.value = true
      startResendTimer()
    }
  } catch (err) {
    contactError.value = err.response?.data?.message || (locale.value === 'tr' ? 'Bir hata oluştu' : 'An error occurred')
  } finally {
    contactLoading.value = false
  }
}

// STEP 2: Verification — OTP gönder & doğrula
async function sendOtp() {
  if (!phoneNumber.value.trim()) {
    verifyError.value = locale.value === 'tr' ? 'Telefon numarası gerekli' : 'Phone number is required'
    return
  }

  otpLoading.value = true
  verifyError.value = ''

  try {
    await api.post('/auth/send-otp', {
      email: contactEmail.value.trim(),
      phone: phoneNumber.value.trim()
    })
    otpSent.value = true
    startResendTimer()
  } catch (err) {
    verifyError.value = err.response?.data?.message || (locale.value === 'tr' ? 'Kod gönderilemedi' : 'Failed to send code')
  } finally {
    otpLoading.value = false
  }
}

async function verifyOtp() {
  if (!otpCode.value.trim() || otpCode.value.trim().length !== 6) {
    verifyError.value = t.value.checkout.invalidCode
    return
  }

  verifyLoading.value = true
  verifyError.value = ''

  try {
    const { data } = await api.post('/auth/verify-otp', {
      email: contactEmail.value.trim(),
      code: otpCode.value.trim()
    })

    // Auth store'a yaz
    auth.setAuth(data)
    prefillFromAuth()
    step.value = 'shipping'
  } catch (err) {
    verifyError.value = err.response?.data?.message || t.value.checkout.invalidCode
  } finally {
    verifyLoading.value = false
  }
}

async function resendCode() {
  if (resendTimer.value > 0) return
  verifyError.value = ''

  try {
    await api.post('/auth/resend-verification', {
      email: contactEmail.value.trim(),
      type: verificationType.value,
      phone: phoneNumber.value.trim()
    })
    startResendTimer()
  } catch (err) {
    verifyError.value = err.response?.data?.message || (locale.value === 'tr' ? 'Kod gönderilemedi' : 'Failed to send code')
  }
}

function startResendTimer() {
  resendTimer.value = 60
  if (resendInterval) clearInterval(resendInterval)
  resendInterval = setInterval(() => {
    resendTimer.value--
    if (resendTimer.value <= 0) {
      clearInterval(resendInterval)
      resendInterval = null
    }
  }, 1000)
}

// STEP 3: Shipping → Payment
function submitShipping() {
  if (!form.value.fullName || !form.value.phone || !form.value.street || !form.value.city || !form.value.district) {
    error.value = locale.value === 'tr' ? 'Lütfen tüm teslimat bilgilerini doldurun' : 'Please fill all shipping fields'
    return
  }
  error.value = ''
  step.value = 'payment'
}

// STEP 4: Payment
async function fetchPaymentConfig() {
  try {
    const { data } = await api.get('/payment/config')
    paymentProvider.value = data.provider || 'iyzico'
  } catch {
    // Varsayılan kullan
  }
}

async function validateCoupon() {
  if (!couponInput.value.trim()) return
  couponLoading.value = true
  couponError.value = ''
  try {
    const { data } = await api.get(`/coupons/validate/${couponInput.value.trim()}`)
    if (data.valid) {
      if (data.minOrderAmount && cart.subtotal < data.minOrderAmount) {
        couponError.value = locale.value === 'tr'
          ? `Minimum sipariş tutarı: ${formatPrice(data.minOrderAmount)}`
          : `Minimum order amount: ${formatPrice(data.minOrderAmount)}`
        return
      }
      appliedCoupon.value = data
    } else {
      couponError.value = data.message || (locale.value === 'tr' ? 'Geçersiz kupon kodu' : 'Invalid coupon code')
    }
  } catch (err) {
    couponError.value = locale.value === 'tr' ? 'Geçersiz kupon kodu' : 'Invalid coupon code'
  } finally {
    couponLoading.value = false
  }
}

function removeCoupon() {
  appliedCoupon.value = null
  couponInput.value = ''
  couponError.value = ''
}

async function placeOrder() {
  if (!card.value.cardHolderName || !card.value.cardNumber || !card.value.expireMonth || !card.value.expireYear || !card.value.cvc) {
    error.value = locale.value === 'tr' ? 'Lütfen tüm kart bilgilerini doldurun' : 'Please fill all card fields'
    return
  }

  loading.value = true
  error.value = ''

  try {
    const orderData = {
      items: cart.items.map(item => ({
        product: item.productId,
        size: item.size,
        color: item.color,
        quantity: item.quantity
      })),
      shippingAddress: form.value,
      shippingCost: cart.shippingCost,
      couponCode: appliedCoupon.value ? couponInput.value.trim().toUpperCase() : null
    }

    const { data: order } = await api.post('/orders', orderData)

    const { data: paymentResult } = await api.post('/payment/process', {
      orderId: order._id,
      card: {
        cardHolderName: card.value.cardHolderName,
        cardNumber: card.value.cardNumber.replace(/\s/g, ''),
        expireMonth: card.value.expireMonth,
        expireYear: card.value.expireYear,
        cvc: card.value.cvc
      }
    })

    if (paymentResult.success) {
      cart.clearCart()
      router.push({ name: 'OrderSuccess', query: { orderId: order._id } })
    } else {
      error.value = paymentResult.message || (locale.value === 'tr' ? 'Ödeme başarısız' : 'Payment failed')
    }
  } catch (err) {
    error.value = err.response?.data?.message || (locale.value === 'tr' ? 'Bir hata oluştu' : 'An error occurred')
  } finally {
    loading.value = false
  }
}

function goBack() {
  const idx = currentStepIndex.value
  if (idx > 0) {
    step.value = steps.value[idx - 1].key
    error.value = ''
  }
}

async function fetchGoogleConfig() {
  try {
    const { data } = await api.get('/auth/google-client-id')
    googleEnabled.value = data.enabled
    googleClientId.value = data.clientId
  } catch {
    // Google giriş kapalı
  }
}

function handleGoogleLogin() {
  if (!window.google || !googleClientId.value) return
  window.google.accounts.id.initialize({
    client_id: googleClientId.value,
    callback: onGoogleResponse
  })
  window.google.accounts.id.prompt()
}

async function onGoogleResponse(response) {
  if (!response.credential) return
  googleLoading.value = true
  googleError.value = ''
  try {
    await auth.loginWithGoogle(response.credential)
    prefillFromAuth()
    step.value = 'shipping'
  } catch (err) {
    googleError.value = err.response?.data?.message || (locale.value === 'tr' ? 'Google giriş başarısız' : 'Google sign-in failed')
  } finally {
    googleLoading.value = false
  }
}

onMounted(() => {
  fetchPaymentConfig()
  fetchGoogleConfig()
  initStep()
})
</script>

<template>
  <div class="max-w-5xl mx-auto px-4 py-8">
    <h1 class="text-2xl font-heading mb-6">{{ t.checkout.title }}</h1>

    <!-- Progress Bar -->
    <div class="mb-8">
      <div class="flex items-center">
        <template v-for="(s, i) in steps" :key="s.key">
          <div class="flex items-center">
            <div
              class="w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium transition-colors"
              :class="currentStepIndex >= i
                ? 'bg-primary text-white'
                : 'bg-gray-200 text-gray-500'"
            >
              <svg v-if="currentStepIndex > i" class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" />
              </svg>
              <span v-else>{{ i + 1 }}</span>
            </div>
            <span
              class="ml-2 text-xs uppercase tracking-wider hidden sm:inline"
              :class="currentStepIndex >= i ? 'text-primary font-medium' : 'text-gray-400'"
            >{{ s.label }}</span>
          </div>
          <div
            v-if="i < steps.length - 1"
            class="flex-1 h-px mx-3"
            :class="currentStepIndex > i ? 'bg-primary' : 'bg-gray-200'"
          ></div>
        </template>
      </div>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
      <!-- Sol: Adımlara göre değişen içerik -->
      <div class="lg:col-span-2 space-y-6">

        <!-- STEP: Contact -->
        <div v-if="step === 'contact'" class="bg-white border p-6">
          <h2 class="text-sm uppercase tracking-widest mb-4">{{ t.checkout.contactInfo }}</h2>
          <p class="text-sm text-gray-500 mb-4">
            {{ locale === 'tr' ? 'Sipariş bilgilerinizi takip edebilmek için e-posta adresinizi girin.' : 'Enter your email to track your order information.' }}
          </p>
          <div class="space-y-4">
            <div>
              <label class="text-xs text-gray-500 mb-1 block">{{ t.checkout.email }}</label>
              <input
                v-model="contactEmail"
                type="email"
                class="input-field"
                :placeholder="locale === 'tr' ? 'ornek@email.com' : 'example@email.com'"
                @keyup.enter="submitContact"
              />
            </div>
            <p v-if="contactError" class="text-red-500 text-xs">{{ contactError }}</p>
            <button
              @click="submitContact"
              :disabled="contactLoading"
              class="btn-primary w-full"
            >
              <span v-if="contactLoading" class="inline-flex items-center gap-2">
                <svg class="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
                  <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
              </span>
              <span v-else>{{ t.checkout.continue }}</span>
            </button>
          </div>
          <div class="mt-4 text-center text-xs text-gray-400">
            {{ t.checkout.alreadyHaveAccount }}
            <router-link to="/login" class="underline hover:text-primary">{{ t.checkout.loginHere }}</router-link>
          </div>

          <!-- Google ile devam et -->
          <template v-if="googleEnabled">
            <div class="flex items-center gap-3 mt-5">
              <div class="flex-1 h-px bg-gray-200"></div>
              <span class="text-xs text-gray-400 uppercase">{{ t.auth.orWith }}</span>
              <div class="flex-1 h-px bg-gray-200"></div>
            </div>
            <button
              @click="handleGoogleLogin"
              :disabled="googleLoading"
              class="w-full flex items-center justify-center gap-3 border border-gray-300 px-4 py-3 hover:bg-gray-50 transition-colors mt-4"
            >
              <svg class="w-5 h-5" viewBox="0 0 24 24">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
              <span class="text-sm">{{ t.auth.googleLogin }}</span>
            </button>
            <p v-if="googleError" class="text-red-500 text-xs mt-2 text-center">{{ googleError }}</p>
          </template>
        </div>

        <!-- STEP: Verification -->
        <div v-if="step === 'verification'" class="bg-white border p-6">
          <button @click="goBack" class="text-xs text-gray-400 hover:text-primary mb-3 inline-flex items-center gap-1">
            <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
            {{ locale === 'tr' ? 'Geri' : 'Back' }}
          </button>
          <h2 class="text-sm uppercase tracking-widest mb-4">{{ t.checkout.verification }}</h2>

          <!-- SMS Yolu -->
          <div v-if="verificationType === 'sms'" class="space-y-4">
            <div v-if="!otpSent">
              <p class="text-sm text-gray-500 mb-3">{{ t.checkout.enterPhone }}</p>
              <div>
                <label class="text-xs text-gray-500 mb-1 block">{{ t.checkout.phone }}</label>
                <input
                  v-model="phoneNumber"
                  type="tel"
                  class="input-field"
                  placeholder="5XX XXX XX XX"
                  @keyup.enter="sendOtp"
                />
              </div>
              <p v-if="verifyError" class="text-red-500 text-xs mt-2">{{ verifyError }}</p>
              <button
                @click="sendOtp"
                :disabled="otpLoading"
                class="btn-primary w-full mt-3"
              >
                <span v-if="otpLoading" class="inline-flex items-center gap-2">
                  <svg class="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
                    <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                </span>
                <span v-else>{{ t.checkout.sendCode }}</span>
              </button>
            </div>

            <div v-else>
              <div class="bg-green-50 border border-green-200 p-3 mb-4 text-sm text-green-700 flex items-center gap-2">
                <svg class="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" />
                </svg>
                {{ t.checkout.codeSentToPhone }}
              </div>
              <div>
                <label class="text-xs text-gray-500 mb-1 block">{{ t.checkout.enterCode }}</label>
                <input
                  v-model="otpCode"
                  type="text"
                  class="input-field text-center text-lg tracking-[0.5em] font-mono"
                  placeholder="000000"
                  maxlength="6"
                  inputmode="numeric"
                  @keyup.enter="verifyOtp"
                />
              </div>
              <p v-if="verifyError" class="text-red-500 text-xs mt-2">{{ verifyError }}</p>
              <button
                @click="verifyOtp"
                :disabled="verifyLoading"
                class="btn-primary w-full mt-3"
              >
                <span v-if="verifyLoading" class="inline-flex items-center gap-2">
                  <svg class="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
                    <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                </span>
                <span v-else>{{ t.checkout.verify }}</span>
              </button>
              <button
                @click="resendCode"
                :disabled="resendTimer > 0"
                class="w-full text-center text-xs text-gray-400 hover:text-primary mt-3"
              >
                {{ resendTimer > 0 ? `${t.checkout.resendCode} (${resendTimer}s)` : t.checkout.resendCode }}
              </button>
            </div>
          </div>

          <!-- E-posta Yolu -->
          <div v-else class="space-y-4">
            <div class="bg-blue-50 border border-blue-200 p-3 text-sm text-blue-700 flex items-center gap-2">
              <svg class="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
              {{ t.checkout.codeSentToEmail }} ({{ contactEmail }})
            </div>
            <div>
              <label class="text-xs text-gray-500 mb-1 block">{{ t.checkout.enterCode }}</label>
              <input
                v-model="otpCode"
                type="text"
                class="input-field text-center text-lg tracking-[0.5em] font-mono"
                placeholder="000000"
                maxlength="6"
                inputmode="numeric"
                @keyup.enter="verifyOtp"
              />
            </div>
            <p v-if="verifyError" class="text-red-500 text-xs">{{ verifyError }}</p>
            <button
              @click="verifyOtp"
              :disabled="verifyLoading"
              class="btn-primary w-full"
            >
              <span v-if="verifyLoading" class="inline-flex items-center gap-2">
                <svg class="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
                  <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
              </span>
              <span v-else>{{ t.checkout.verify }}</span>
            </button>
            <button
              @click="resendCode"
              :disabled="resendTimer > 0"
              class="w-full text-center text-xs text-gray-400 hover:text-primary"
            >
              {{ resendTimer > 0 ? `${t.checkout.resendCode} (${resendTimer}s)` : t.checkout.resendCode }}
            </button>
          </div>
        </div>

        <!-- STEP: Shipping -->
        <div v-if="step === 'shipping'" class="bg-white border p-6">
          <button v-if="currentStepIndex > 0" @click="goBack" class="text-xs text-gray-400 hover:text-primary mb-3 inline-flex items-center gap-1">
            <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
            {{ locale === 'tr' ? 'Geri' : 'Back' }}
          </button>
          <h2 class="text-sm uppercase tracking-widest mb-4">{{ t.checkout.shippingInfo }}</h2>
          <div class="space-y-4">
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label class="text-xs text-gray-500 mb-1 block">{{ t.checkout.fullName }}</label>
                <input v-model="form.fullName" type="text" class="input-field" required />
              </div>
              <div>
                <label class="text-xs text-gray-500 mb-1 block">{{ t.checkout.phone }}</label>
                <input v-model="form.phone" type="tel" class="input-field" required />
              </div>
            </div>
            <div>
              <label class="text-xs text-gray-500 mb-1 block">{{ t.checkout.address }}</label>
              <textarea v-model="form.street" class="input-field" rows="2" required></textarea>
            </div>
            <div class="grid grid-cols-3 gap-4">
              <div>
                <label class="text-xs text-gray-500 mb-1 block">{{ t.checkout.city }}</label>
                <input v-model="form.city" type="text" class="input-field" required />
              </div>
              <div>
                <label class="text-xs text-gray-500 mb-1 block">{{ t.checkout.district }}</label>
                <input v-model="form.district" type="text" class="input-field" required />
              </div>
              <div>
                <label class="text-xs text-gray-500 mb-1 block">{{ t.checkout.zipCode }}</label>
                <input v-model="form.zipCode" type="text" class="input-field" />
              </div>
            </div>
          </div>
          <p v-if="error" class="text-red-500 text-xs mt-3">{{ error }}</p>
          <button @click="submitShipping" class="btn-primary w-full mt-6">
            {{ t.checkout.continue }}
          </button>
        </div>

        <!-- STEP: Payment -->
        <div v-if="step === 'payment'" class="space-y-6">
          <div class="bg-white border p-6">
            <button @click="goBack" class="text-xs text-gray-400 hover:text-primary mb-3 inline-flex items-center gap-1">
              <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" d="M15 19l-7-7 7-7" />
              </svg>
              {{ locale === 'tr' ? 'Geri' : 'Back' }}
            </button>

            <!-- Teslimat Özeti -->
            <div class="bg-gray-50 border p-4 mb-6">
              <div class="flex items-center justify-between mb-1">
                <span class="text-xs uppercase tracking-widest text-gray-400">{{ t.checkout.shippingInfo }}</span>
                <button @click="step = 'shipping'" class="text-xs text-primary hover:underline">
                  {{ locale === 'tr' ? 'Düzenle' : 'Edit' }}
                </button>
              </div>
              <p class="text-sm">{{ form.fullName }} &bull; {{ form.phone }}</p>
              <p class="text-sm text-gray-500">{{ form.street }}, {{ form.district }}/{{ form.city }} {{ form.zipCode }}</p>
            </div>

            <div class="flex items-center justify-between mb-4">
              <h2 class="text-sm uppercase tracking-widest">{{ locale === 'tr' ? 'Ödeme Bilgileri' : 'Payment Information' }}</h2>
              <div class="flex items-center gap-2">
                <svg class="h-6" viewBox="0 0 48 32" fill="none"><rect width="48" height="32" rx="4" fill="#1A1F71"/><path d="M19.5 21h-3l2-10h3l-2 10zm13-10l-2.8 6.8L29 11h-3.2l4.5 10h2.7l4.5-10h-2.5zm-7.5 0h-3l-1.8 10h3l1.8-10z" fill="#fff"/></svg>
                <svg class="h-6" viewBox="0 0 48 32" fill="none"><rect width="48" height="32" rx="4" fill="#fff" stroke="#ddd"/><circle cx="19" cy="16" r="8" fill="#EB001B" opacity=".8"/><circle cx="29" cy="16" r="8" fill="#F79E1B" opacity=".8"/></svg>
                <span class="text-xs text-gray-400 font-medium">TROY</span>
              </div>
            </div>

            <div class="space-y-4">
              <div>
                <label class="text-xs text-gray-500 mb-1 block">{{ locale === 'tr' ? 'Kart Üzerindeki İsim' : 'Name on Card' }}</label>
                <input
                  v-model="card.cardHolderName"
                  type="text"
                  class="input-field uppercase"
                  :placeholder="locale === 'tr' ? 'AD SOYAD' : 'FULL NAME'"
                />
              </div>
              <div>
                <label class="text-xs text-gray-500 mb-1 block">{{ locale === 'tr' ? 'Kart Numarası' : 'Card Number' }}</label>
                <div class="relative">
                  <input
                    v-model="formattedCardNumber"
                    type="text"
                    class="input-field pr-16"
                    placeholder="0000 0000 0000 0000"
                    maxlength="19"
                    inputmode="numeric"
                  />
                  <span v-if="cardType" class="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-medium uppercase"
                    :class="cardType === 'visa' ? 'text-blue-700' : cardType === 'mastercard' ? 'text-orange-500' : 'text-blue-500'">
                    {{ cardType }}
                  </span>
                </div>
              </div>
              <div class="grid grid-cols-3 gap-4">
                <div>
                  <label class="text-xs text-gray-500 mb-1 block">{{ locale === 'tr' ? 'Ay' : 'Month' }}</label>
                  <select v-model="card.expireMonth" class="input-field">
                    <option value="">{{ locale === 'tr' ? 'Ay' : 'MM' }}</option>
                    <option v-for="m in 12" :key="m" :value="String(m).padStart(2, '0')">{{ String(m).padStart(2, '0') }}</option>
                  </select>
                </div>
                <div>
                  <label class="text-xs text-gray-500 mb-1 block">{{ locale === 'tr' ? 'Yıl' : 'Year' }}</label>
                  <select v-model="card.expireYear" class="input-field">
                    <option value="">{{ locale === 'tr' ? 'Yıl' : 'YY' }}</option>
                    <option v-for="y in 10" :key="y" :value="String(2025 + y)">{{ 2025 + y }}</option>
                  </select>
                </div>
                <div>
                  <label class="text-xs text-gray-500 mb-1 block">CVC/CVV</label>
                  <input
                    v-model="card.cvc"
                    type="text"
                    class="input-field"
                    placeholder="000"
                    maxlength="4"
                    inputmode="numeric"
                  />
                </div>
              </div>
            </div>

            <!-- Güvenlik bilgisi -->
            <div class="flex items-center gap-2 mt-4 text-xs text-gray-400">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
              </svg>
              {{ locale === 'tr' ? 'Ödemeniz 256-bit SSL ile şifrelenerek güvenle işlenir.' : 'Your payment is securely processed with 256-bit SSL encryption.' }}
            </div>
          </div>

          <p v-if="error" class="text-red-500 text-sm">{{ error }}</p>

          <button
            @click="placeOrder"
            :disabled="loading"
            class="btn-primary w-full"
          >
            <span v-if="loading" class="inline-flex items-center gap-2">
              <svg class="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              {{ locale === 'tr' ? 'Ödeme İşleniyor...' : 'Processing Payment...' }}
            </span>
            <span v-else>
              {{ locale === 'tr' ? 'Ödemeyi Tamamla' : 'Complete Payment' }} - {{ formatPrice(finalTotal) }}
            </span>
          </button>
        </div>
      </div>

      <!-- Sağ: Sipariş Özeti (her adımda görünür) -->
      <div>
        <h2 class="text-sm uppercase tracking-widest mb-4">{{ t.cart.title }}</h2>
        <div class="bg-gray-light p-6 sticky top-24">
          <div v-for="item in cart.items" :key="item.productId + (item.size || '') + (item.color || '')" class="flex gap-3 mb-4">
            <img
              v-if="item.image"
              :src="item.image"
              :alt="item.name?.tr || item.name"
              class="w-14 h-14 object-cover border flex-shrink-0"
            />
            <div class="flex-1 min-w-0">
              <p class="text-sm truncate">{{ item.name?.tr || item.name }}</p>
              <p v-if="item.size || item.color" class="text-xs text-gray-400">
                <span v-if="item.size">{{ item.size }}</span>
                <span v-if="item.size && item.color"> / </span>
                <span v-if="item.color">{{ item.color }}</span>
              </p>
              <div class="flex justify-between items-center mt-1">
                <span class="text-xs text-gray-400">x{{ item.quantity }}</span>
                <span class="text-sm">{{ formatPrice((item.salePrice || item.price) * item.quantity) }}</span>
              </div>
            </div>
          </div>

          <!-- Kupon Kodu -->
          <div class="border-t border-gray-300 pt-4 mt-3 mb-4">
            <label class="text-xs uppercase tracking-widest mb-2 block">
              {{ locale === 'tr' ? 'İndirim Kodu' : 'Discount Code' }}
            </label>
            <div v-if="appliedCoupon" class="flex items-center justify-between bg-green-50 border border-green-200 px-3 py-2">
              <div class="flex items-center gap-1.5">
                <svg class="w-3.5 h-3.5 text-green-600" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" />
                </svg>
                <span class="text-sm font-medium text-green-700">{{ couponInput.toUpperCase() }}</span>
                <span class="text-xs text-green-600">
                  (-{{ appliedCoupon.discountType === 'percentage' ? appliedCoupon.discountValue + '%' : formatPrice(appliedCoupon.discountValue) }})
                </span>
              </div>
              <button @click="removeCoupon" class="text-xs text-red-500 hover:underline">
                {{ locale === 'tr' ? 'Kaldır' : 'Remove' }}
              </button>
            </div>
            <div v-else class="flex gap-2">
              <input
                v-model="couponInput"
                type="text"
                class="input-field flex-1 uppercase text-sm"
                :placeholder="locale === 'tr' ? 'Kupon kodu' : 'Coupon code'"
                @keyup.enter="validateCoupon"
              />
              <button
                @click="validateCoupon"
                :disabled="couponLoading || !couponInput.trim()"
                class="btn-outline text-xs px-3 whitespace-nowrap disabled:opacity-40"
              >
                {{ couponLoading ? '...' : (locale === 'tr' ? 'Uygula' : 'Apply') }}
              </button>
            </div>
            <p v-if="couponError" class="text-red-500 text-xs mt-1.5">{{ couponError }}</p>
          </div>

          <div class="border-t border-gray-300 pt-3">
            <div class="flex justify-between text-sm mb-2">
              <span>{{ t.cart.subtotal }}</span>
              <span>{{ formatPrice(cart.subtotal) }}</span>
            </div>
            <div v-if="discountAmount > 0" class="flex justify-between text-sm mb-2 text-green-600">
              <span>{{ locale === 'tr' ? 'İndirim' : 'Discount' }}</span>
              <span>-{{ formatPrice(discountAmount) }}</span>
            </div>
            <div class="flex justify-between text-sm mb-2">
              <span>{{ t.cart.shipping }}</span>
              <span>{{ cart.shippingCost === 0 ? t.cart.freeShipping : formatPrice(cart.shippingCost) }}</span>
            </div>
            <div class="border-t border-gray-300 pt-2 mt-2 flex justify-between font-medium text-lg">
              <span>{{ t.cart.total }}</span>
              <span>{{ formatPrice(finalTotal) }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
