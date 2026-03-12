<script setup>
import { ref, computed, onMounted } from 'vue'
import { useLanguage } from '../../composables/useLanguage'
import api from '../../utils/api'

const { locale } = useLanguage()

const categories = ref([])
const showForm = ref(false)
const editingId = ref(null)
const form = ref({ name: { tr: '', en: '' }, order: 0, active: true, parent: null })

const parentCategories = computed(() => categories.value.filter(c => !c.parent))

const childrenByParent = computed(() => {
  const map = {}
  categories.value.filter(c => c.parent).forEach(c => {
    const parentId = typeof c.parent === 'object' ? c.parent._id : c.parent
    if (!map[parentId]) map[parentId] = []
    map[parentId].push(c)
  })
  return map
})

// Hiyerarşik sıralı liste: üst kategori + altındaki alt kategoriler
const sortedCategories = computed(() => {
  const result = []
  parentCategories.value.forEach(parent => {
    result.push({ ...parent, _isParent: true })
    const children = childrenByParent.value[parent._id] || []
    children.sort((a, b) => a.order - b.order)
    children.forEach(child => {
      result.push({ ...child, _isChild: true })
    })
  })
  return result
})

function catName(cat) {
  return locale.value === 'tr' ? cat.name.tr : (cat.name.en || cat.name.tr)
}

async function fetchCategories() {
  const { data } = await api.get(`/categories`)
  categories.value = data
}

function editCategory(cat) {
  editingId.value = cat._id
  form.value = {
    name: { ...cat.name },
    order: cat.order,
    active: cat.active,
    parent: cat.parent ? (typeof cat.parent === 'object' ? cat.parent._id : cat.parent) : null
  }
  showForm.value = true
}

function resetForm() {
  editingId.value = null
  form.value = { name: { tr: '', en: '' }, order: 0, active: true, parent: null }
  showForm.value = false
}

async function saveCategory() {
  try {
    const payload = { ...form.value }
    if (!payload.parent) payload.parent = null
    if (editingId.value) {
      await api.put(`/categories/${editingId.value}`, payload)
    } else {
      await api.post(`/categories`, payload)
    }
    await fetchCategories()
    resetForm()
  } catch (error) {
    alert(error.response?.data?.message || 'Hata')
  }
}

async function deleteCategory(id) {
  const hasChildren = (childrenByParent.value[id] || []).length > 0
  const msg = hasChildren
    ? (locale.value === 'tr' ? 'Bu kategorinin alt kategorileri var. Silmek istediğinize emin misiniz? Alt kategoriler de silinecek.' : 'This category has subcategories. Are you sure? Subcategories will also be deleted.')
    : (locale.value === 'tr' ? 'Silmek istediğinize emin misiniz?' : 'Are you sure?')
  if (!confirm(msg)) return
  try {
    await api.delete(`/categories/${id}`)
    await fetchCategories()
  } catch (error) {
    alert(error.response?.data?.message || 'Hata')
  }
}

function addSubcategory(parentCat) {
  editingId.value = null
  form.value = { name: { tr: '', en: '' }, order: 0, active: true, parent: parentCat._id }
  showForm.value = true
}

onMounted(fetchCategories)
</script>

<template>
  <div class="min-h-screen bg-gray-50">
    <div class="bg-dark-bg text-white">
      <div class="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
        <h1 class="text-lg font-heading">{{ locale === 'tr' ? 'Kategori Yönetimi' : 'Category Management' }}</h1>
        <router-link to="/" class="text-xs underline opacity-70 hover:opacity-100">{{ locale === 'tr' ? 'Siteye Dön' : 'Back to Site' }}</router-link>
      </div>
    </div>

    <div class="max-w-7xl mx-auto px-4 py-8">
      <nav class="flex flex-wrap gap-2 mb-8">
        <router-link to="/admin" class="px-4 py-2 bg-white border text-sm hover:bg-gray-50">Dashboard</router-link>
        <router-link to="/admin/products" class="px-4 py-2 bg-white border text-sm hover:bg-gray-50">{{ locale === 'tr' ? 'Ürünler' : 'Products' }}</router-link>
        <router-link to="/admin/categories" class="px-4 py-2 bg-accent text-white text-sm">{{ locale === 'tr' ? 'Kategoriler' : 'Categories' }}</router-link>
        <router-link to="/admin/orders" class="px-4 py-2 bg-white border text-sm hover:bg-gray-50">{{ locale === 'tr' ? 'Siparişler' : 'Orders' }}</router-link>
        <router-link to="/admin/sales-report" class="px-4 py-2 bg-white border text-sm hover:bg-gray-50">{{ locale === 'tr' ? 'Satış Raporu' : 'Sales Report' }}</router-link>
        <router-link to="/admin/analytics" class="px-4 py-2 bg-white border text-sm hover:bg-gray-50">{{ locale === 'tr' ? 'Analitik' : 'Analytics' }}</router-link>
        <router-link to="/admin/marketing" class="px-4 py-2 bg-white border text-sm hover:bg-gray-50">{{ locale === 'tr' ? 'Pazarlama' : 'Marketing' }}</router-link>
        <router-link to="/admin/reviews" class="px-4 py-2 bg-white border text-sm hover:bg-gray-50">{{ locale === 'tr' ? 'Yorumlar' : 'Reviews' }}</router-link>
        <router-link to="/admin/settings" class="px-4 py-2 bg-white border text-sm hover:bg-gray-50">{{ locale === 'tr' ? 'Ayarlar' : 'Settings' }}</router-link>
      </nav>

      <div class="flex justify-between items-center mb-6">
        <h2 class="text-xl">{{ locale === 'tr' ? 'Kategoriler' : 'Categories' }}</h2>
        <button @click="showForm = !showForm; editingId = null; form.parent = null" class="btn-primary text-sm">
          + {{ locale === 'tr' ? 'Yeni Kategori' : 'New Category' }}
        </button>
      </div>

      <!-- Form -->
      <div v-if="showForm" class="bg-white border p-6 mb-6">
        <div class="grid grid-cols-1 md:grid-cols-5 gap-4">
          <div>
            <label class="text-xs text-gray-500 mb-1 block">{{ locale === 'tr' ? 'Üst Kategori' : 'Parent Category' }}</label>
            <select v-model="form.parent" class="input-field">
              <option :value="null">{{ locale === 'tr' ? '— Ana Kategori —' : '— Top Level —' }}</option>
              <option
                v-for="cat in parentCategories.filter(c => c._id !== editingId)"
                :key="cat._id"
                :value="cat._id"
              >{{ catName(cat) }}</option>
            </select>
          </div>
          <div>
            <label class="text-xs text-gray-500 mb-1 block">{{ locale === 'tr' ? 'Kategori Adı (TR)' : 'Name (TR)' }}</label>
            <input v-model="form.name.tr" type="text" class="input-field" required />
          </div>
          <div>
            <label class="text-xs text-gray-500 mb-1 block">{{ locale === 'tr' ? 'Kategori Adı (EN)' : 'Name (EN)' }}</label>
            <input v-model="form.name.en" type="text" class="input-field" required />
          </div>
          <div>
            <label class="text-xs text-gray-500 mb-1 block">{{ locale === 'tr' ? 'Sıra' : 'Order' }}</label>
            <input v-model.number="form.order" type="number" class="input-field" />
          </div>
          <div class="flex items-end gap-2">
            <button @click="saveCategory" class="btn-primary text-sm">{{ locale === 'tr' ? 'Kaydet' : 'Save' }}</button>
            <button @click="resetForm" class="btn-outline text-sm">{{ locale === 'tr' ? 'İptal' : 'Cancel' }}</button>
          </div>
        </div>
        <!-- Seçili üst kategori bilgisi -->
        <div v-if="form.parent" class="mt-3 text-xs text-gray-500">
          {{ locale === 'tr' ? 'Alt kategori olarak eklenecek:' : 'Will be added as subcategory of:' }}
          <strong>{{ catName(parentCategories.find(c => c._id === form.parent) || { name: { tr: '', en: '' } }) }}</strong>
        </div>
      </div>

      <!-- Hiyerarşik Liste -->
      <div class="bg-white border">
        <table class="w-full text-sm">
          <thead class="bg-gray-50 border-b">
            <tr>
              <th class="text-left px-4 py-3">{{ locale === 'tr' ? 'Sıra' : 'Order' }}</th>
              <th class="text-left px-4 py-3">{{ locale === 'tr' ? 'Türkçe' : 'Turkish' }}</th>
              <th class="text-left px-4 py-3">{{ locale === 'tr' ? 'İngilizce' : 'English' }}</th>
              <th class="text-left px-4 py-3">Slug</th>
              <th class="text-left px-4 py-3">{{ locale === 'tr' ? 'Tip' : 'Type' }}</th>
              <th class="text-right px-4 py-3">{{ locale === 'tr' ? 'İşlemler' : 'Actions' }}</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="cat in sortedCategories"
              :key="cat._id"
              class="border-b hover:bg-gray-50"
              :class="{ 'bg-gray-50/50': cat._isChild }"
            >
              <td class="px-4 py-3">{{ cat.order }}</td>
              <td class="px-4 py-3" :class="{ 'pl-10': cat._isChild }">
                <span v-if="cat._isChild" class="text-gray-400 mr-1">└</span>
                {{ cat.name.tr }}
              </td>
              <td class="px-4 py-3">{{ cat.name.en }}</td>
              <td class="px-4 py-3 text-gray-400">{{ cat.slug }}</td>
              <td class="px-4 py-3">
                <span v-if="cat._isChild" class="text-xs bg-blue-50 text-blue-600 px-2 py-0.5 rounded">
                  {{ locale === 'tr' ? 'Alt Kategori' : 'Subcategory' }}
                </span>
                <span v-else class="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded">
                  {{ locale === 'tr' ? 'Ana Kategori' : 'Main' }}
                </span>
              </td>
              <td class="px-4 py-3 text-right">
                <button
                  v-if="cat._isParent"
                  @click="addSubcategory(cat)"
                  class="text-green-600 hover:underline text-xs mr-3"
                  :title="locale === 'tr' ? 'Alt Kategori Ekle' : 'Add Subcategory'"
                >+ {{ locale === 'tr' ? 'Alt Kategori' : 'Sub' }}</button>
                <button @click="editCategory(cat)" class="text-blue-600 hover:underline text-xs mr-3">{{ locale === 'tr' ? 'Düzenle' : 'Edit' }}</button>
                <button @click="deleteCategory(cat._id)" class="text-red-500 hover:underline text-xs">{{ locale === 'tr' ? 'Sil' : 'Delete' }}</button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>
