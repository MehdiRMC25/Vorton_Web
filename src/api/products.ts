import { config, cloudinaryUrl } from '../config'
import type { ApiProductDoc } from './types'
import type { Product, ProductVariant } from '../types'

/** Map color names (and skuColor suffixes) to hex for swatches. Include all API variants (EN/AZ, with/without spaces). */
const COLOR_HEX: Record<string, string> = {
  Grey: '#6b7280',
  Gray: '#6b7280',
  Black: '#1a1a1a',
  White: '#f5f5f5',
  Navy: '#1e3a5f',
  Blue: '#2563eb',
  Purple: '#7c3aed',
  Beige: '#d4a574',
  Red: '#dc2626',
  Green: '#16a34a',
  Olive: '#84cc16',
  Brown: '#92400e',
  'Dark Purple': '#4c1d95',
  'Light Grey': '#9ca3af',
  Boz: '#8b7355',
  Pink: '#ec4899',
  'Hot Pink': '#ff69b4',
  'Hot-Pink': '#ff69b4',
  Orange: '#f97316',
  Yellow: '#eab308',
  Maroon: '#881337',
  Burgundy: '#9f1239',
  Cream: '#fef3c7',
  Khaki: '#a3a36e',
  Teal: '#0d9488',
  Mint: '#6ee7b7',
  Lavender: '#a78bfa',
  Charcoal: '#374151',
  /* Blue variants so swatches match product images */
  'Dark Blue': '#1e3a5f',
  'Royal Blue': '#1d4ed8',
  'Light Blue': '#38bdf8',
  'Sky Blue': '#0ea5e9',
  'Navy Blue': '#1e3a5f',
  'Midnight Blue': '#1e293b',
  /* Azeri / alternate names */
  Mavi: '#2563eb',
  'Tünd mavi': '#1e3a5f',
  'Tünd Mavi': '#1e3a5f',
  Bənövşəyi: '#7c3aed',
  Qara: '#1a1a1a',
  Boz: '#8b7355',
  Ağ: '#f5f5f5',
  Qırmızı: '#dc2626',
  Yaşıl: '#16a34a',
  Narıncı: '#f97316',
}

/** Aliases: alternate spellings or API values that should map to a known key. */
const COLOR_ALIASES: Record<string, string> = {
  navy: 'Navy',
  blue: 'Blue',
  purple: 'Purple',
  black: 'Black',
  white: 'White',
  grey: 'Grey',
  gray: 'Gray',
  red: 'Red',
  green: 'Green',
  darkblue: 'Dark Blue',
  'dark blue': 'Dark Blue',
  royalblue: 'Royal Blue',
  'royal blue': 'Royal Blue',
  lightblue: 'Light Blue',
  'light blue': 'Light Blue',
  navyblue: 'Navy Blue',
  'navy blue': 'Navy Blue',
  mavi: 'Blue',
  'tünd mavi': 'Dark Blue',
  hotpink: 'Hot Pink',
  'hot pink': 'Hot Pink',
  'hot-pink': 'Hot Pink',
}

/** Normalize for lookup: "purple" -> "Purple", "dark blue" -> "Dark Blue". */
function normalizeColorName(s: string): string {
  const t = s.trim()
  if (!t) return ''
  return t.replace(/\w+/g, (w) => w[0].toUpperCase() + w.slice(1).toLowerCase())
}

function colorToHex(color: string): string {
  if (!color || !color.trim()) return '#6b7280'
  const raw = color.trim()
  const normalized = normalizeColorName(raw)
  const alias = COLOR_ALIASES[raw.toLowerCase()] ?? COLOR_ALIASES[normalized.toLowerCase()]
  const key = alias ?? normalized ?? raw
  return COLOR_HEX[key] ?? COLOR_HEX[raw] ?? COLOR_HEX[normalized] ?? '#6b7280'
}

/** Get color name from end of skuColor e.g. "SKU-123-Purple" -> "Purple", "X-Blue" -> "Blue". */
function colorNameFromSkuColor(skuColor: string | undefined): string | null {
  if (!skuColor || typeof skuColor !== 'string') return null
  const trimmed = skuColor.trim()
  const lastDash = trimmed.lastIndexOf('-')
  if (lastDash === -1) return null
  const suffix = trimmed.slice(lastDash + 1).trim()
  if (!suffix || /^\d+$/.test(suffix)) return null
  return suffix
}

function slugFromSku(sku: string): string {
  return sku.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || sku
}

/** Only include a doc if it has at least one image (image or images[0]); allow full URL or filename. */
function hasImage(doc: ApiProductDoc): boolean {
  const img = doc.image ?? doc.images?.[0]
  return typeof img === 'string' && img.trim().length > 0
}

/** Use full URL as-is; otherwise build Cloudinary URL from filename (server may already send full URLs). */
function imageUrl(value: string | undefined): string {
  if (!value || !value.trim()) return ''
  const s = value.trim()
  if (s.startsWith('http://') || s.startsWith('https://')) return s
  return cloudinaryUrl(s)
}

const PRODUCTS_FETCH_TIMEOUT_MS = 20000

/** Fetch raw product documents from API (with timeout so we don't hang). */
export async function fetchApiProducts(): Promise<ApiProductDoc[]> {
  const path = config.productsPath.startsWith('/') ? config.productsPath : `/${config.productsPath}`
  const url = `${config.apiUrl}${path}`
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), PRODUCTS_FETCH_TIMEOUT_MS)
  let res: Response
  try {
    res = await fetch(url, { signal: controller.signal })
  } catch (err) {
    clearTimeout(timeoutId)
    if (err instanceof Error) {
      if (err.name === 'AbortError') {
        throw new Error('Products are taking too long to load. The server may be starting up—please try again in a moment.')
      }
      if (err.message.includes('Failed to fetch') || err.message.includes('NetworkError')) {
        throw new Error('Cannot reach the products server. Check your connection and that the products API URL is correct.')
      }
    }
    throw err
  }
  clearTimeout(timeoutId)
  if (!res.ok) {
    throw new Error(`Products API error: ${res.status} ${res.statusText}`)
  }
  const data = await res.json()
  let list: unknown[]
  if (Array.isArray(data)) {
    list = data
  } else if (data && typeof data === 'object' && !Array.isArray(data)) {
    list =
      (data as { products?: unknown[] }).products ??
      (data as { data?: unknown[] }).data ??
      (data as { items?: unknown[] }).items ??
      []
  } else {
    list = []
  }
  if (!Array.isArray(list)) {
    const keys = data && typeof data === 'object' ? Object.keys(data as object).join(', ') : 'non-object'
    throw new Error(
      `Products API did not return an array. Got: ${keys || typeof data}. ` +
        `Expected JSON array or object with "products", "data", or "items" array.`
    )
  }
  return list as ApiProductDoc[]
}

/**
 * Group docs by SKU; first doc per SKU is the "main" product.
 * Only include variants that have at least one image.
 * Only include products that have at least one variant with images (no empty cards).
 */
export function buildProductsFromApi(docs: ApiProductDoc[]): Product[] {
  const bySku = new Map<string, ApiProductDoc[]>()
  for (const doc of docs) {
    if (!doc.sku) continue
    const list = bySku.get(doc.sku) || []
    list.push(doc)
    bySku.set(doc.sku, list)
  }

  const products: Product[] = []

  for (const [sku, variants] of bySku) {
    const withImages = variants.filter(hasImage)
    if (withImages.length === 0) continue

    const first = withImages[0]
    const productVariants: ProductVariant[] = withImages.map((d) => {
      const imgList = Array.isArray(d.images) && d.images.length > 0 ? d.images : (d.image ? [d.image] : [])
      const colorFromDoc = String(d.color ?? d.rang ?? '').trim()
      return {
        skuColor: d.skuColor ?? (d.sku && colorFromDoc ? `${String(d.sku).trim()}-${colorFromDoc.replace(/\s+/g, '-')}` : ''),
        color: colorFromDoc,
        price: Number(d.price) || 0,
        discountedPrice: d.discountedPrice != null ? Number(d.discountedPrice) : undefined,
        image: imageUrl(d.image ?? d.images?.[0]),
        images: imgList.map((x) => imageUrl(typeof x === 'string' ? x : '')).filter(Boolean),
        sizes: Array.isArray(d.sizes) ? d.sizes : [],
        fabric: d.fabric,
        isDiscounted: d.isDiscounted,
        isNewCollection: d.isNewCollection,
      }
    })

    const v0 = productVariants[0]
    if (!v0.image) continue
    const isNew = productVariants.some((v) => v.isNewCollection)
    const onSale = productVariants.some(
      (v) => v.isDiscounted || (v.discountedPrice != null && v.discountedPrice < v.price)
    )

    const cat = (first.category ?? first.gender ?? '').toString().toLowerCase().trim()
    const category = (cat === 'women' ? 'women' : 'men') as 'men' | 'women'

    const product: Product = {
      id: (first.id ?? first._id ?? sku)?.toString() || sku,
      sku,
      slug: slugFromSku(sku),
      name: (first.name ?? first.sku ?? '').toString().trim() || sku,
      category,
      price: v0.price,
      salePrice: v0.discountedPrice,
      image: v0.image,
      images: v0.images?.length ? v0.images : undefined,
      sizes: v0.sizes,
      fabric: v0.fabric,
      isNew,
      onSale,
      colors: productVariants.map((v) => {
        const colorName = (v.color && v.color.trim()) || colorNameFromSkuColor(v.skuColor) || 'Grey'
        return { name: colorName, hex: colorToHex(colorName) }
      }),
      variants: productVariants,
    }

    products.push(product)
  }

  return products
}

export async function fetchProducts(): Promise<Product[]> {
  const docs = await fetchApiProducts()
  return buildProductsFromApi(docs)
}
