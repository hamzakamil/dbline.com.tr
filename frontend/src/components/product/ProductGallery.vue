<script setup>
import { ref, computed } from 'vue'

const props = defineProps({
  images: { type: Array, default: () => [] },
  displayStyle: { type: String, default: 'thumbnails' }
})

const activeIndex = ref(0)
const isHovering = ref(false)
const mousePos = ref({ x: 0, y: 0 })
const lensPos = ref({ x: 0, y: 0, w: 0, h: 0 })

const zoomFactor = 2.5
const showLightbox = ref(false)

const activeImage = computed(() => props.images[activeIndex.value] || '/placeholder.svg')

function onMouseMove(e, index = null) {
  if (index !== null) activeIndex.value = index
  const target = e.currentTarget
  if (!target) return
  const rect = target.getBoundingClientRect()
  
  let mouseX = e.clientX - rect.left
  let mouseY = e.clientY - rect.top
  
  const lensWidth = rect.width / zoomFactor
  const lensHeight = rect.height / zoomFactor
  
  let lensX = mouseX - (lensWidth / 2)
  let lensY = mouseY - (lensHeight / 2)
  
  lensX = Math.max(0, Math.min(lensX, rect.width - lensWidth))
  lensY = Math.max(0, Math.min(lensY, rect.height - lensHeight))
  
  lensPos.value = { x: lensX, y: lensY, w: lensWidth, h: lensHeight }
  
  const bgPosX = (lensX / (rect.width - lensWidth)) * 100
  const bgPosY = (lensY / (rect.height - lensHeight)) * 100
  
  mousePos.value = { x: bgPosX, y: bgPosY }
}

function onMouseEnter(e, index = null) {
  if (window.matchMedia('(hover: hover)').matches) {
    if (index !== null) activeIndex.value = index
    isHovering.value = true
    onMouseMove(e, index)
  }
}

function onMouseLeave() {
  isHovering.value = false
}

function openLightbox() {
  showLightbox.value = true
  document.body.style.overflow = 'hidden'
}

function closeLightbox() {
  showLightbox.value = false
  document.body.style.overflow = ''
}
</script>

<template>
  <div>
    <!-- Klasik (Thumbnails) ve Zoom Tasarımı -->
    <div v-if="displayStyle === 'thumbnails'" class="flex flex-col-reverse md:flex-row gap-4 relative">
      <!-- Küçük resimler -->
      <div class="flex md:flex-col gap-2 overflow-x-auto md:overflow-y-auto md:max-h-[600px] scrollbar-hide">
        <button
          v-for="(img, index) in images"
          :key="index"
          @click="activeIndex = index"
          :class="['w-16 h-16 md:w-20 md:h-20 flex-shrink-0 border-2 overflow-hidden', activeIndex === index ? 'border-primary' : 'border-transparent']"
        >
          <img :src="img" alt="" class="w-full h-full object-cover" />
        </button>
      </div>

      <!-- Ana resim -->
      <div 
        class="flex-1 aspect-square bg-gray-light relative cursor-none"
        ref="mainImageRef"
        @mousemove="onMouseMove"
        @mouseenter="onMouseEnter"
        @mouseleave="onMouseLeave"
      >
        <img
          :src="activeImage"
          alt=""
          class="w-full h-full object-cover"
        />
        <!-- Zoom Lensi (Çerçeve) -->
        <div 
          v-if="isHovering"
          class="absolute pointer-events-none bg-black/10 border border-black/20"
          :style="{
            left: `${lensPos.x}px`,
            top: `${lensPos.y}px`,
            width: `${lensPos.w}px`,
            height: `${lensPos.h}px`
          }"
        ></div>
        
        <!-- Zoomlanmış Büyük Resim Kutusu -->
        <div 
          v-if="isHovering"
          class="hidden md:block absolute top-0 left-full ml-8 w-[calc(100%+2rem)] h-full bg-white z-[30] border border-gray-200 shadow-2xl pointer-events-none"
          :style="{
            backgroundImage: `url(${activeImage})`,
            backgroundPosition: `${mousePos.x}% ${mousePos.y}%`,
            backgroundSize: `${zoomFactor * 100}%`,
            backgroundRepeat: 'no-repeat'
          }"
        >
        </div>
      </div>
    </div>

    <!-- Izgara (Grid) Tasarımı -->
    <div v-else-if="displayStyle === 'grid'" class="grid grid-cols-1 md:grid-cols-2 gap-4 relative">
      <div 
        v-for="(img, index) in images" 
        :key="'g'+index"
        :class="['bg-gray-light overflow-hidden relative cursor-zoom-in', index === 0 ? 'md:col-span-2' : '']"
        @mousemove="onMouseMove($event, index)"
        @mouseenter="onMouseEnter($event, index)"
        @mouseleave="onMouseLeave"
        @click="openLightbox"
      >
        <img :src="img" alt="" class="w-full h-auto object-cover !block" :class="isHovering && activeIndex === index ? 'opacity-90' : ''" />
        
        <!-- Grid İçin Zoom Lensi -->
        <div 
          v-if="isHovering && activeIndex === index"
          class="absolute pointer-events-none bg-black/10 border border-black/20"
          :style="{
            left: `${lensPos.x}px`,
            top: `${lensPos.y}px`,
            width: `${lensPos.w}px`,
            height: `${lensPos.h}px`
          }"
        ></div>
      </div>
      
      <!-- Grid İçin Sabit Zoomlanmış Resim Kutusu -->
      <div 
        v-if="isHovering"
        class="hidden lg:block fixed top-24 right-4 xl:right-[max(1rem,calc((100vw-80rem)/2+1rem))] w-[400px] xl:w-[450px] aspect-[3/4] bg-white z-[30] border border-gray-200 shadow-2xl pointer-events-none"
        :style="{
          backgroundImage: `url(${activeImage})`,
          backgroundPosition: `${mousePos.x}% ${mousePos.y}%`,
          backgroundSize: `${zoomFactor * 100}%`,
          backgroundRepeat: 'no-repeat'
        }"
      >
      </div>
    </div>

    <!-- Işık Kutusu (Lightbox Modal) -->
    <div v-if="showLightbox" class="fixed inset-0 z-[100] bg-white/95 overflow-y-auto" @click.self="closeLightbox">
      <button @click="closeLightbox" class="fixed top-6 right-6 z-[110] w-12 h-12 flex items-center justify-center bg-gray-100 hover:bg-gray-200 rounded-full transition-colors">
        <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg>
      </button>
      
      <div class="max-w-5xl mx-auto py-12 px-4 flex flex-col gap-8" @click.self="closeLightbox">
        <img v-for="(img, idx) in images" :key="'lb'+idx" :src="img" class="w-full h-auto shadow-sm" />
      </div>
    </div>
  </div>
</template>
