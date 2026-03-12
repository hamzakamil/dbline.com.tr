import { useHead } from '@unhead/vue'
import { computed, unref } from 'vue'

const SITE_URL = 'https://dbline.com.tr'
const SITE_NAME = 'DB Line Official'
const LOGO_URL = `${SITE_URL}/logo.svg`

/**
 * JSON-LD Schema.org helper composable
 * Injects structured data into <head> via @unhead/vue
 */

function injectJsonLd(schemaRef) {
  useHead({
    script: [
      {
        type: 'application/ld+json',
        innerHTML: computed(() => JSON.stringify(unref(schemaRef)))
      }
    ]
  })
}

/**
 * Organization schema - global site identity
 */
export function useOrganizationSchema() {
  injectJsonLd({
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: SITE_NAME,
    url: SITE_URL,
    logo: LOGO_URL,
    sameAs: [
      'https://www.instagram.com/dblinestudio/'
    ],
    contactPoint: {
      '@type': 'ContactPoint',
      contactType: 'customer service',
      email: 'info@dbline.com.tr',
      availableLanguage: ['Turkish', 'English']
    }
  })
}

/**
 * WebSite schema with SearchAction - for homepage
 */
export function useWebSiteSchema() {
  injectJsonLd({
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: SITE_NAME,
    url: SITE_URL,
    potentialAction: {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: `${SITE_URL}/products?search={search_term}`
      },
      'query-input': 'required name=search_term'
    }
  })
}

/**
 * Product schema - for product detail pages
 * @param {import('vue').Ref|Object} productRef - Reactive product object
 * @param {string} locale - Current locale ('tr' or 'en')
 */
export function useProductSchema(productRef, locale) {
  const schema = computed(() => {
    const product = unref(productRef)
    if (!product) return null

    const loc = unref(locale)
    const name = product.name?.[loc] || product.name?.tr || ''
    const description = (product.description?.[loc] || product.description?.tr || '').replace(/<[^>]*>/g, '')
    const price = product.salePrice || product.price
    const images = (product.images || []).map(img =>
      img.startsWith('http') ? img : `${SITE_URL}${img}`
    )

    const schema = {
      '@context': 'https://schema.org',
      '@type': 'Product',
      name,
      description: description.substring(0, 500),
      image: images,
      brand: {
        '@type': 'Brand',
        name: 'DB Line'
      },
      offers: {
        '@type': 'Offer',
        price: String(price),
        priceCurrency: 'TRY',
        availability: product.stock > 0
          ? 'https://schema.org/InStock'
          : 'https://schema.org/OutOfStock',
        url: `${SITE_URL}/products/${product.slug}`,
        seller: {
          '@type': 'Organization',
          name: SITE_NAME
        }
      }
    }

    if (product.rating > 0 && product.reviewCount > 0) {
      schema.aggregateRating = {
        '@type': 'AggregateRating',
        ratingValue: String(product.rating),
        reviewCount: String(product.reviewCount),
        bestRating: '5',
        worstRating: '1'
      }
    }

    return schema
  })

  useHead({
    script: [
      {
        type: 'application/ld+json',
        innerHTML: computed(() => {
          const val = schema.value
          return val ? JSON.stringify(val) : ''
        })
      }
    ]
  })
}

/**
 * BreadcrumbList schema
 * @param {Array<{name: string, url?: string}>} items - Breadcrumb items
 */
export function useBreadcrumbSchema(itemsRef) {
  const schema = computed(() => {
    const items = unref(itemsRef)
    if (!items || items.length === 0) return null

    return {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: items.map((item, index) => {
        const entry = {
          '@type': 'ListItem',
          position: index + 1,
          name: item.name
        }
        if (item.url) {
          entry.item = item.url.startsWith('http') ? item.url : `${SITE_URL}${item.url}`
        }
        return entry
      })
    }
  })

  useHead({
    script: [
      {
        type: 'application/ld+json',
        innerHTML: computed(() => {
          const val = schema.value
          return val ? JSON.stringify(val) : ''
        })
      }
    ]
  })
}

/**
 * CollectionPage schema - for category/collection pages
 * @param {Object} options - { name, description, url }
 */
export function useCollectionSchema(optionsRef) {
  const schema = computed(() => {
    const opts = unref(optionsRef)
    if (!opts?.name) return null

    return {
      '@context': 'https://schema.org',
      '@type': 'CollectionPage',
      name: opts.name,
      description: opts.description || '',
      url: opts.url?.startsWith('http') ? opts.url : `${SITE_URL}${opts.url || ''}`
    }
  })

  useHead({
    script: [
      {
        type: 'application/ld+json',
        innerHTML: computed(() => {
          const val = schema.value
          return val ? JSON.stringify(val) : ''
        })
      }
    ]
  })
}
