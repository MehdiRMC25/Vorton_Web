import { config, cloudinaryUrl } from '../config'
import type { ApiProductDoc } from './types'
import type { Product, ProductVariant } from '../types'

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
  'Boz': '#8b7355',
}

function colorToHex(color: string): string {
  return COLOR_HEX[color] || '#6b7280'
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

/** Fetch raw product documents from API */
export async function fetchApiProducts(): Promise<ApiProductDoc[]> {
  const path = config.productsPath.startsWith('/') ? config.productsPath : `/${config.productsPath}`
  const url = `${config.apiUrl}${path}`
  const res = await fetch(url)
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
      return {
        skuColor: d.skuColor ?? (d.sku && d.color ? `${String(d.sku).trim()}-${String(d.color).trim().replace(/\s+/g, '-')}` : ''),
        color: String(d.color ?? '').trim(),
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
      colors: productVariants.map((v) => ({ name: v.color, hex: colorToHex(v.color) })),
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
