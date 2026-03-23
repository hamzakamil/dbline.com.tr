<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useLanguage } from '../../composables/useLanguage'
import api from '../../utils/api'

const route = useRoute()
const router = useRouter()
const { locale } = useLanguage()

const isEdit = computed(() => !!route.params.id)
const categories = ref([])
const loading = ref(false)
const uploading = ref(false)

const form = ref({
  name: { tr: '', en: '' },
  description: { tr: '', en: '' },
  price: 0,
  salePrice: null,
  category: '',
  sizes: [],
  colors: [],
  variants: [],
  stock: 0,
  featured: false,
  active: true,
  galleryStyle: 'thumbnails',
  images: []
})

const sizeInput = ref('')
const colorNameTr = ref('')
const colorNameEn = ref('')
const colorHex = ref('#000000')

async function fetchCategories() {
  const { data } = await api.get(`/categories`)
  categories.value = data
}

async function fetchProduct() {
  if (!isEdit.value) return
  try {
    const { data } = await api.get(`/products/${route.params.id}`)
    form.value = { 
      ...data, 
      category: data.category?._id || data.category || '',
      variants: data.variants || [],
      galleryStyle: data.galleryStyle || 'thumbnails'
    }
  } catch (error) {
    console.error(error)
  }
}

async function uploadImages(event) {
  const files = event.target.files
  if (!files.length) return

  uploading.value = true
  const formData = new FormData()
  for (const file of files) {
    formData.append('images', file)
  }

  try {
    const { data } = await api.post(`/upload/multiple`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    })
    const urls = data.map(item => item.url)
    form.value.images = [...form.value.images, ...urls]
  } catch (error) {
    alert('Resim yükleme hatası')
  } finally {
    uploading.value = false
  }
}

function removeImage(index) {
  form.value.images.splice(index, 1)
}

function addSize() {
  if (sizeInput.value && !form.value.sizes.includes(sizeInput.value)) {
    form.value.sizes.push(sizeInput.value)
    sizeInput.value = ''
  }
}

function removeSize(index) {
  form.value.sizes.splice(index, 1)
}

function addColor() {
  if (colorNameTr.value) {
    form.value.colors.push({
      name: { tr: colorNameTr.value, en: colorNameEn.value || colorNameTr.value },
      hex: colorHex.value
    })
    colorNameTr.value = ''
    colorNameEn.value = ''
    colorHex.value = '#000000'
  }
}

function removeColor(index) {
  form.value.colors.splice(index, 1)
}

// Varyant yönetimi
const variantLabelTr = ref('')
const variantLabelEn = ref('')
const variantOptionTr = ref('')
const variantOptionEn = ref('')

function addVariantGroup() {
  if (!variantLabelTr.value) return
  form.value.variants.push({
    label: { tr: variantLabelTr.value, en: variantLabelEn.value || variantLabelTr.value },
    options: []
  })
  variantLabelTr.value = ''
  variantLabelEn.value = ''
}

function removeVariantGroup(index) {
  form.value.variants.splice(index, 1)
}

function addVariantOption(groupIndex) {
  if (!variantOptionTr.value) return
  form.value.variants[groupIndex].options.push({
    name: { tr: variantOptionTr.value, en: variantOptionEn.value || variantOptionTr.value }
  })
  variantOptionTr.value = ''
  variantOptionEn.value = ''
}

function removeVariantOption(groupIndex, optionIndex) {
  form.value.variants[groupIndex].options.splice(optionIndex, 1)
}

async function handleSubmit() {
  loading.value = true
  try {
    const payload = { ...form.value }
    if (!payload.salePrice) payload.salePrice = null

    if (isEdit.value) {
      await api.put(`/products/${route.params.id}`, payload)
    } else {
      await api.post(`/products`, payload)
    }
    router.push('/admin/products')
  } catch (error) {
    alert(error.response?.data?.message || 'Hata oluştu')
  } finally {
    loading.value = false
  }
}

onMounted(async () => {
  await fetchCategories()
  await fetchProduct()
})
</script>

<template>
  <div class="min-h-screen bg-gray-50">
    <div class="bg-dark-bg text-white">
      <div class="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
        <h1 class="text-lg font-heading">{{ isEdit ? (locale === 'tr' ? 'Ürün Düzenle' : 'Edit Product') : (locale === 'tr' ? 'Yeni Ürün' : 'New Product') }}</h1>
        <router-link to="/admin/products" class="text-xs underline opacity-70 hover:opacity-100">{{ locale === 'tr' ? 'Geri' : 'Back' }}</router-link>
      </div>
    </div>

    <div class="max-w-4xl mx-auto px-4 py-8">
      <form @submit.prevent="handleSubmit" class="space-y-6">
        <!-- Ürün Adı -->
        <div class="bg-white border p-6">
          <h3 class="text-sm uppercase tracking-widest mb-4">{{ locale === 'tr' ? 'Ürün Bilgileri' : 'Product Info' }}</h3>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label class="text-xs text-gray-500 mb-1 block">{{ locale === 'tr' ? 'Ürün Adı (TR)' : 'Product Name (TR)' }}</label>
              <input v-model="form.name.tr" type="text" class="input-field" required />
            </div>
            <div>
              <label class="text-xs text-gray-500 mb-1 block">{{ locale === 'tr' ? 'Ürün Adı (EN)' : 'Product Name (EN)' }}</label>
              <input v-model="form.name.en" type="text" class="input-field" required />
            </div>
            <div>
              <label class="text-xs text-gray-500 mb-1 block">{{ locale === 'tr' ? 'Açıklama (TR)' : 'Description (TR)' }}</label>
              <textarea v-model="form.description.tr" class="input-field" rows="4"></textarea>
            </div>
            <div>
              <label class="text-xs text-gray-500 mb-1 block">{{ locale === 'tr' ? 'Açıklama (EN)' : 'Description (EN)' }}</label>
              <textarea v-model="form.description.en" class="input-field" rows="4"></textarea>
            </div>
          </div>
        </div>

        <!-- Fiyat ve Stok -->
        <div class="bg-white border p-6">
          <h3 class="text-sm uppercase tracking-widest mb-4">{{ locale === 'tr' ? 'Fiyat & Stok' : 'Price & Stock' }}</h3>
          <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <label class="text-xs text-gray-500 mb-1 block">{{ locale === 'tr' ? 'Fiyat (₺)' : 'Price (₺)' }}</label>
              <input v-model.number="form.price" type="number" step="0.01" class="input-field" required />
            </div>
            <div>
              <label class="text-xs text-gray-500 mb-1 block">{{ locale === 'tr' ? 'İndirimli Fiyat (₺)' : 'Sale Price (₺)' }}</label>
              <input v-model.number="form.salePrice" type="number" step="0.01" class="input-field" />
            </div>
            <div>
              <label class="text-xs text-gray-500 mb-1 block">{{ locale === 'tr' ? 'Stok' : 'Stock' }}</label>
              <input v-model.number="form.stock" type="number" class="input-field" />
            </div>
            <div>
              <label class="text-xs text-gray-500 mb-1 block">{{ locale === 'tr' ? 'Kategori' : 'Category' }}</label>
              <select v-model="form.category" class="input-field" required>
                <option value="">{{ locale === 'tr' ? 'Seçin' : 'Select' }}</option>
                <option v-for="cat in categories" :key="cat._id" :value="cat._id">{{ cat.name.tr }}</option>
              </select>
            </div>
          </div>
          <div class="flex items-center gap-6 mt-4">
            <label class="flex items-center gap-2 text-sm">
              <input v-model="form.featured" type="checkbox" />
              {{ locale === 'tr' ? 'Öne Çıkan' : 'Featured' }}
            </label>
            <label class="flex items-center gap-2 text-sm">
              <input v-model="form.active" type="checkbox" />
              {{ locale === 'tr' ? 'Aktif' : 'Active' }}
            </label>
            <div class="flex items-center gap-2 ml-auto">
              <label class="text-xs text-gray-500">{{ locale === 'tr' ? 'Galeri Stili:' : 'Gallery Style:' }}</label>
              <select v-model="form.galleryStyle" class="border border-gray-200 px-3 py-1 text-sm focus:outline-none focus:border-primary">
                <option value="thumbnails">{{ locale === 'tr' ? 'Klasik (Küçük Resimli)' : 'Classic (Thumbnails)' }}</option>
                <option value="grid">{{ locale === 'tr' ? 'Izgara (Geniş)' : 'Grid (Wide)' }}</option>
              </select>
            </div>
          </div>
        </div>

        <!-- Resimler -->
        <div class="bg-white border p-6">
          <h3 class="text-sm uppercase tracking-widest mb-4">{{ locale === 'tr' ? 'Ürün Resimleri' : 'Product Images' }}</h3>
          <div class="flex flex-wrap gap-4 mb-4">
            <div v-for="(img, index) in form.images" :key="index" class="relative w-24 h-24 bg-gray-light overflow-hidden group">
              <img :src="img" class="w-full h-full object-cover" />
              <button
                @click.prevent="removeImage(index)"
                class="absolute top-1 right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
              >x</button>
            </div>
          </div>
          <label class="btn-outline inline-block cursor-pointer text-sm">
            {{ uploading ? (locale === 'tr' ? 'Yükleniyor...' : 'Uploading...') : (locale === 'tr' ? 'Resim Yükle' : 'Upload Images') }}
            <input type="file" accept="image/*" multiple class="hidden" @change="uploadImages" :disabled="uploading" />
          </label>
        </div>

        <!-- Bedenler -->
        <div class="bg-white border p-6">
          <h3 class="text-sm uppercase tracking-widest mb-4">{{ locale === 'tr' ? 'Bedenler' : 'Sizes' }}</h3>
          <div class="flex flex-wrap gap-2 mb-4">
            <span v-for="(size, index) in form.sizes" :key="index" class="bg-gray-100 px-3 py-1 text-sm flex items-center gap-2">
              {{ size }}
              <button @click.prevent="removeSize(index)" class="text-red-500 text-xs">x</button>
            </span>
          </div>
          <div class="flex gap-2">
            <input v-model="sizeInput" type="text" placeholder="XS, S, M, L, XL" class="input-field w-40" @keyup.enter.prevent="addSize" />
            <button @click.prevent="addSize" class="btn-outline text-sm">+</button>
          </div>
        </div>

        <!-- Renkler -->
        <div class="bg-white border p-6">
          <h3 class="text-sm uppercase tracking-widest mb-4">{{ locale === 'tr' ? 'Renkler' : 'Colors' }}</h3>
          <div class="flex flex-wrap gap-3 mb-4">
            <span v-for="(color, index) in form.colors" :key="index" class="flex items-center gap-2 bg-gray-100 px-3 py-1 text-sm">
              <span class="w-4 h-4 rounded-full border" :style="{ backgroundColor: color.hex }"></span>
              {{ color.name.tr }}
              <button @click.prevent="removeColor(index)" class="text-red-500 text-xs">x</button>
            </span>
          </div>
          <div class="flex flex-wrap gap-2 items-end">
            <div>
              <label class="text-xs text-gray-500 mb-1 block">TR</label>
              <input v-model="colorNameTr" type="text" placeholder="Siyah" class="input-field w-28" />
            </div>
            <div>
              <label class="text-xs text-gray-500 mb-1 block">EN</label>
              <input v-model="colorNameEn" type="text" placeholder="Black" class="input-field w-28" />
            </div>
            <div>
              <label class="text-xs text-gray-500 mb-1 block">{{ locale === 'tr' ? 'Renk' : 'Color' }}</label>
              <input v-model="colorHex" type="color" class="w-10 h-10 border cursor-pointer" />
            </div>
            <button @click.prevent="addColor" class="btn-outline text-sm h-10">+</button>
          </div>
        </div>

        <!-- Varyantlar (Tasarım, Desen, vb.) -->
        <div class="bg-white border p-6">
          <h3 class="text-sm uppercase tracking-widest mb-4">{{ locale === 'tr' ? 'Varyantlar (Tasarım, Desen vb.)' : 'Variants (Design, Pattern etc.)' }}</h3>
          <p class="text-xs text-gray-400 mb-4">{{ locale === 'tr' ? 'Ürün seçenekleri ekleyin. Örn: "Tasarım" grubu altında "Beyaz-Sarışın", "Beyaz-Esmer" gibi seçenekler.' : 'Add product options. E.g.: "Design" group with "White-Blonde", "White-Brunette" options.' }}</p>

          <!-- Mevcut varyant grupları -->
          <div v-for="(variant, gIdx) in form.variants" :key="gIdx" class="mb-4 border border-gray-100 p-4">
            <div class="flex items-center justify-between mb-3">
              <span class="text-sm font-medium">{{ variant.label.tr }} <span class="text-gray-400 text-xs">({{ variant.label.en }})</span></span>
              <button @click.prevent="removeVariantGroup(gIdx)" class="text-red-500 text-xs hover:underline">{{ locale === 'tr' ? 'Grubu Sil' : 'Remove Group' }}</button>
            </div>
            <!-- Seçenekler -->
            <div class="flex flex-wrap gap-2 mb-3">
              <span
                v-for="(opt, oIdx) in variant.options"
                :key="oIdx"
                class="bg-gray-100 px-3 py-1.5 text-sm flex items-center gap-2"
              >
                {{ opt.name.tr }} <span class="text-gray-400 text-xs">({{ opt.name.en }})</span>
                <button @click.prevent="removeVariantOption(gIdx, oIdx)" class="text-red-500 text-xs">x</button>
              </span>
            </div>
            <!-- Seçenek ekle -->
            <div class="flex flex-wrap gap-2 items-end">
              <div>
                <label class="text-xs text-gray-500 mb-1 block">{{ locale === 'tr' ? 'Seçenek (TR)' : 'Option (TR)' }}</label>
                <input v-model="variantOptionTr" type="text" :placeholder="locale === 'tr' ? 'Beyaz-Sarışın' : 'White-Blonde'" class="input-field w-36" @keyup.enter.prevent="addVariantOption(gIdx)" />
              </div>
              <div>
                <label class="text-xs text-gray-500 mb-1 block">{{ locale === 'tr' ? 'Seçenek (EN)' : 'Option (EN)' }}</label>
                <input v-model="variantOptionEn" type="text" :placeholder="locale === 'tr' ? 'White-Blonde' : 'White-Blonde'" class="input-field w-36" @keyup.enter.prevent="addVariantOption(gIdx)" />
              </div>
              <button @click.prevent="addVariantOption(gIdx)" class="btn-outline text-sm h-10">+ {{ locale === 'tr' ? 'Seçenek' : 'Option' }}</button>
            </div>
          </div>

          <!-- Yeni varyant grubu ekle -->
          <div class="border-t border-gray-100 pt-4 mt-4">
            <div class="flex flex-wrap gap-2 items-end">
              <div>
                <label class="text-xs text-gray-500 mb-1 block">{{ locale === 'tr' ? 'Grup Adı (TR)' : 'Group Name (TR)' }}</label>
                <input v-model="variantLabelTr" type="text" :placeholder="locale === 'tr' ? 'Tasarım' : 'Design'" class="input-field w-36" @keyup.enter.prevent="addVariantGroup" />
              </div>
              <div>
                <label class="text-xs text-gray-500 mb-1 block">{{ locale === 'tr' ? 'Grup Adı (EN)' : 'Group Name (EN)' }}</label>
                <input v-model="variantLabelEn" type="text" :placeholder="locale === 'tr' ? 'Design' : 'Design'" class="input-field w-36" @keyup.enter.prevent="addVariantGroup" />
              </div>
              <button @click.prevent="addVariantGroup" class="btn-primary text-sm h-10">+ {{ locale === 'tr' ? 'Yeni Grup' : 'New Group' }}</button>
            </div>
          </div>
        </div>

        <!-- Kaydet -->
        <div class="flex gap-4">
          <button type="submit" :disabled="loading" class="btn-primary">
            {{ loading ? (locale === 'tr' ? 'Kaydediliyor...' : 'Saving...') : (locale === 'tr' ? 'Kaydet' : 'Save') }}
          </button>
          <router-link to="/admin/products" class="btn-outline">{{ locale === 'tr' ? 'İptal' : 'Cancel' }}</router-link>
        </div>
      </form>
    </div>
  </div>
</template>
