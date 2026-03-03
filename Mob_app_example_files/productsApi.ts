export interface Product {
  id: string;
  /** SKU = same model; used to group products and images belonging to the same model. */
  sku: string;
  /** SKU-Color = identifies the color variant (e.g. HOD-2TR-UX-319-Cream); used to fetch this variant's image. Not displayed in UI. */
  skuColor?: string;
  name: string;
  category: "men" | "women" | "unisex" | "";
  color: string;
  fabric: string;
  price: number;
  discountedPrice?: number | null;
  sizes: string[];
  image?: string;
  images?: string[];
  thumbnailUrl?: string;
  detailImageUrl?: string;
  /** Fallback Cloudinary URL from SKU only (when skuColor image 404s). */
  imageFallbackUrl?: string;
  videoUrl?: string;
  imageType?: "local" | "remote";
  isNewCollection?: boolean;
}

const DEFAULT_SIZES = ["S", "M", "L", "XL"];

/** Ensure product has name, color, fabric, sizes from MongoDB/API; only fall back to defaults when missing. */
function normalizeProduct(p: any): Product {
  if (!p || typeof p !== "object") return p;
  const rawName = (p.name ?? p.ADI ?? p.productName ?? p.product_title ?? p.productTitle ?? p.title ?? (p as any)["Product Name"] ?? "").toString().trim();
  const name = rawName || String(p.sku ?? "").trim();
  const color = String(p.color ?? p.colour ?? (p as any).Rəngi ?? "").trim();
  const rawFabric = (p.fabric ?? p.material ?? p.fabricType ?? (p as any)["Fabric Type"] ?? "").toString().trim();
  const fabric = rawFabric || "Not specified";
  let sizes: string[] = [];
  const rawSizes = p.sizes ?? p.Sizes ?? p.availableSizes ?? (p as any).size ?? (p as any).Size ?? (p as any).size_options;
  if (Array.isArray(rawSizes) && rawSizes.length > 0) {
    sizes = rawSizes.map((s: unknown) => String(s).trim()).filter(Boolean);
  } else if (typeof rawSizes === "string" && rawSizes.trim()) {
    const str = rawSizes.trim();
    if (str.startsWith("[")) {
      try {
        const parsed = JSON.parse(str) as unknown;
        if (Array.isArray(parsed)) sizes = parsed.map((s: unknown) => String(s).trim()).filter(Boolean);
        else sizes = str.split(",").map((s) => s.trim()).filter(Boolean);
      } catch {
        sizes = str.split(",").map((s) => s.trim()).filter(Boolean);
      }
    } else {
      sizes = str.split(",").map((s) => s.trim()).filter(Boolean);
    }
  }
  // Backend is source of truth for sizes; only use default when API sent nothing (so we don't mask backend bugs)
  if (sizes.length === 0) sizes = DEFAULT_SIZES;
  const cat = String(p.category ?? p.gender ?? "").toLowerCase().trim();
  const category = (cat === "men" || cat === "women" || cat === "unisex" ? cat : "") as Product["category"];
  // SKU = group (same model); SKU-Color = identify color variant. Fetch image by skuColor so each color gets its own image.
  const cloudName = typeof process !== "undefined" ? (process as any).env?.EXPO_PUBLIC_CLOUDINARY_CLOUD_NAME : undefined;
  const folder = "vorton-products";
  // Filename → public_id: strip extension, collapse spaces, lowercase (match upload script / Cloudinary)
  const filenameToPublicId = (s: string): string => {
    const base = s.trim().replace(/^\//, "").replace(/\.[^.]+$/, "");
    return base.replace(/\s*-\s*/g, "-");
  };
  const toPublicIdNormalized = (s: string): string => {
    const base = s.trim().replace(/^\//, "").replace(/\.[^.]+$/, "");
    let n = base.replace(/\s+/g, "-").replace(/[^a-zA-Z0-9_-]/g, "").toLowerCase();
    const m = n.match(/^(.+)-\d+$/);
    return m ? m[1] : n;
  };
  const buildCloudinaryUrl = (publicId: string): string =>
    `https://res.cloudinary.com/${cloudName}/image/upload/${folder}/${encodeURIComponent(publicId)}`;
  const toUrl = (s: unknown): string | undefined => {
    if (typeof s !== "string" || !s.trim()) return undefined;
    const raw = s.trim();
    if (raw.startsWith("http://") || raw.startsWith("https://")) return raw;
    if (cloudName) {
      const publicId = filenameToPublicId(raw);
      return publicId ? buildCloudinaryUrl(publicId) : undefined;
    }
    return raw;
  };
  const effectiveSkuColor =
    (typeof p.skuColor === "string" && p.skuColor.trim())
      ? p.skuColor.trim()
      : (p.sku && p.color ? `${String(p.sku).trim()}-${String(p.color).trim().replace(/\s+/g, "-")}` : "");
  const hasFullUrl = (x: unknown) => typeof x === "string" && (x.startsWith("http://") || x.startsWith("https://"));
  let image: string | undefined;
  if (hasFullUrl(p.image)) image = p.image as string;
  else if (hasFullUrl(p.thumbnailUrl)) image = p.thumbnailUrl as string;
  else if (cloudName && (typeof p.image === "string" && p.image.trim())) {
    const publicId = filenameToPublicId(p.image);
    if (publicId) image = buildCloudinaryUrl(publicId);
  }
  if (image == null && cloudName && Array.isArray(p.images) && p.images[0]) {
    const publicId = filenameToPublicId(String(p.images[0]));
    if (publicId) image = buildCloudinaryUrl(publicId);
  }
  if (image == null) image = toUrl(p.image) ?? (p.image as string | undefined);
  const images = Array.isArray(p.images)
    ? p.images.map((x: unknown) => (hasFullUrl(x) ? x : toUrl(x) ?? (typeof x === "string" ? x : ""))).filter(Boolean) as string[]
    : (image ? [image] : undefined);
  // Fallback: SKU-only (normalized) when variant image 404s
  const imageFallbackUrl =
    cloudName && p.sku && typeof p.sku === "string" && p.sku.trim()
      ? (() => {
          const pid = toPublicIdNormalized(p.sku.trim());
          return pid ? buildCloudinaryUrl(pid) : undefined;
        })()
      : undefined;

  return {
    id: String(p.id ?? ""),
    sku: String(p.sku ?? ""),
    skuColor: effectiveSkuColor || (typeof p.skuColor === "string" && p.skuColor.trim() ? p.skuColor.trim() : undefined),
    name,
    category,
    color,
    fabric,
    price: Number(p.price) || 0,
    discountedPrice: p.discountedPrice != null ? Number(p.discountedPrice) : null,
    sizes,
    image,
    images,
    thumbnailUrl: p.thumbnailUrl,
    detailImageUrl: p.detailImageUrl,
    imageFallbackUrl,
    videoUrl: typeof p.videoUrl === "string" && p.videoUrl.trim() ? p.videoUrl.trim() : undefined,
    imageType: p.imageType,
    isNewCollection: !!(
      p.isNewCollection === true ||
      (p as any).is_new_collection === true ||
      (p as any).IsNewCollection === true ||
      (p as any).newCollection === true
    ),
  };
}

export function getEffectivePrice(p: Product): number {
  const d = p.discountedPrice;
  return d != null && d < p.price && d >= 0 ? d : p.price;
}

const isWeb = typeof window !== "undefined";
const inDev = typeof __DEV__ !== "undefined" && __DEV__;
const fallbackWeb = "http://localhost:3001";
const fallbackPhone = "http://192.168.110.19:3001";
const RENDER_API_URL = "https://vorton-mob-app.onrender.com";
const raw = typeof process !== "undefined" && process.env?.EXPO_PUBLIC_API_URL ? String(process.env.EXPO_PUBLIC_API_URL).trim() : "";
// Mobile/native: never use localhost; use env or Render URL only. Web: allow localhost fallback in dev.
const API_BASE = raw
  ? raw.replace(/\/?$/, "")
  : isWeb
    ? (inDev ? fallbackWeb : RENDER_API_URL)
    : RENDER_API_URL;
if (inDev) {
  console.log("[productsApi] API_BASE =", API_BASE, raw ? "(from env)" : isWeb ? "(web local fallback)" : "(mobile: Render default)");
}

/** Call from app to see if server is reachable (for debug). */
export async function checkApiHealth(): Promise<{ ok: boolean; message?: string; error?: string }> {
  try {
    const res = await fetch(`${API_BASE}/api/health`);
    const data = await res.json().catch(() => ({}));
    if (res.ok && data?.ok) return { ok: true, message: "Server reachable" };
    return { ok: false, error: data?.message || res.statusText };
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    return { ok: false, error: msg };
  }
}

/** Home page media: video URLs from MongoDB videos collection (document _id: "home"). */
export async function fetchHomeVideos(): Promise<{ ok: boolean; videoUrls: string[] }> {
  try {
    const res = await fetch(`${API_BASE}/api/home-videos`);
    const data = await res.json().catch(() => ({}));
    const videoUrls = Array.isArray(data?.videoUrls) ? data.videoUrls : [];
    return { ok: res.ok, videoUrls };
  } catch (e: unknown) {
    return { ok: false, videoUrls: [] };
  }
}

export { API_BASE };

const CACHE_TTL_MS = 2 * 60 * 1000; // 2 minutes for product lists
const PRODUCT_BY_ID_TTL_MS = 45 * 1000; // 45 seconds for single product so DB updates (name, sizes, etc.) show soon
const cache: {
  products: { data: Product[]; ts: number } | null;
  productsCategory: Record<string, { data: Product[]; ts: number }>;
  productById: Record<string, { data: Product; ts: number }>;
} = {
  products: null,
  productsCategory: {},
  productById: {},
};

function isExpired(ts: number) {
  return Date.now() - ts > CACHE_TTL_MS;
}
function isProductByIdExpired(ts: number) {
  return Date.now() - ts > PRODUCT_BY_ID_TTL_MS;
}

export async function fetchProducts(category?: string, options?: { skipCache?: boolean; listView?: boolean }): Promise<{ ok: boolean; products?: any[]; error?: string; fromFallback?: boolean }> {
  if (!API_BASE) {
    return {
      ok: false,
      error: "API URL not configured. Set EXPO_PUBLIC_API_URL in .env (e.g., http://localhost:3001 for web, http://YOUR_PC_IP:3001 for mobile)."
    };
  }

  const listView = options?.listView === true;
  const key = listView && !category ? "__all__listView" : (category ?? "__all__");
  const useCache = !options?.skipCache;
  const cached = useCache && ((listView && !category) ? cache.productsCategory[key] : (category != null ? cache.productsCategory[key] : cache.products));
  if (cached && !isExpired(cached.ts)) {
    return { ok: true, products: cached.data };
  }

  try {
    let url = category
      ? `${API_BASE}/api/products?category=${encodeURIComponent(category)}`
      : `${API_BASE}/api/products`;
    if (listView && !category) url += "?onePerModel=1";
    if (listView && category) url += (url.includes("?") ? "&" : "?") + "onePerModel=1";

    const res = await fetch(url, { cache: "no-store" });
    const data = await res.json();

    if (!res.ok) {
      return { ok: false, error: data.error || res.statusText };
    }
    const raw = data.products || [];
    const list = raw.map((p: any) => { try { return normalizeProduct(p); } catch { return null; } }).filter((x): x is Product => x != null);
    const entry = { data: list, ts: Date.now() };
    if (listView && !category) cache.productsCategory[key] = entry;
    else if (category != null) cache.productsCategory[key] = entry;
    else cache.products = entry;
    list.forEach((p: Product) => {
      if (p.id) cache.productById[p.id] = { data: p, ts: Date.now() };
    });
    return { ok: true, products: list, fromFallback: !!data.fromFallback };
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    return {
      ok: false,
      error: `Failed to fetch products. Server running? API URL: ${API_BASE}. Error: ${msg}`
    };
  }
}

/** Fetch multiple categories in a single request (e.g. "men,unisex").
 *  Falls back to parallel individual fetches if the combined endpoint isn't available. */
export async function fetchProductsByCategories(categories: string[]): Promise<{ ok: boolean; products?: Product[]; error?: string }> {
  if (!API_BASE) {
    return { ok: false, error: "API URL not configured." };
  }
  const key = [...categories].sort().join(",");
  const cached = cache.productsCategory[key];
  if (cached && !isExpired(cached.ts)) {
    return { ok: true, products: cached.data };
  }
  try {
    // Try combined endpoint first
    const url = `${API_BASE}/api/products?categories=${encodeURIComponent(key)}`;
    const res = await fetch(url);
    const data = await res.json();
    if (res.ok && Array.isArray(data.products)) {
      const list = (data.products || []).map((p: any) => { try { return normalizeProduct(p); } catch { return null; } }).filter((x): x is Product => x != null);
      cache.productsCategory[key] = { data: list, ts: Date.now() };
      list.forEach((p: Product) => { if (p.id) cache.productById[p.id] = { data: p, ts: Date.now() }; });
      return { ok: true, products: list };
    }
  } catch (_) {
    // Combined endpoint not available, fall through to parallel fetches
  }
  // Fallback: fetch each category in parallel and merge
  try {
    const results = await Promise.all(categories.map((c) => fetchProducts(c)));
    const failed = results.find((r) => !r.ok);
    if (failed) return { ok: false, error: failed.error };
    const seen = new Set<string>();
    const merged: Product[] = [];
    for (const r of results) {
      for (const p of r.products ?? []) {
        if (!seen.has(p.id)) { seen.add(p.id); merged.push(p); }
      }
    }
    cache.productsCategory[key] = { data: merged, ts: Date.now() };
    return { ok: true, products: merged };
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    return { ok: false, error: `Failed to fetch products. Error: ${msg}` };
  }
}

export async function fetchProductById(id: string): Promise<{ ok: boolean; product?: any; error?: string }> {
  if (!API_BASE) {
    return { 
      ok: false, 
      error: "API URL not configured. Set EXPO_PUBLIC_API_URL in .env." 
    };
  }

  const cached = cache.productById[id];
  if (cached && !isProductByIdExpired(cached.ts)) {
    return { ok: true, product: cached.data };
  }
  
  try {
    const res = await fetch(`${API_BASE}/api/products/${encodeURIComponent(id)}`);
    const data = await res.json();
    
    if (!res.ok) {
      return { ok: false, error: data.error || res.statusText };
    }
    const product = data.product ? normalizeProduct(data.product) : undefined;
    if (product) cache.productById[id] = { data: product, ts: Date.now() };
    return { ok: true, product };
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    return { 
      ok: false, 
      error: `Failed to fetch product. Make sure the server is running and EXPO_PUBLIC_API_URL is set. Error: ${msg}` 
    };
  }
}

/** Base SKU = all hyphen-segments except the last (color suffix). Re-exported for use with variants. */
import { getBaseSku } from "../data/colorSwatches";
export { getBaseSku } from "../data/colorSwatches";

/** One product per base SKU (first by sku order). Use in list views so each model appears once; other colors are variants on the product page. */
export function oneProductPerBaseSku(products: Product[]): Product[] {
  const sorted = [...products].sort((a, b) => (a.sku || "").localeCompare(b.sku || ""));
  const byBase = new Map<string, Product>();
  for (const p of sorted) {
    const base = getBaseSku(p.sku) || (p.sku || "").trim() || p.id;
    if (!base) continue;
    if (!byBase.has(base)) byBase.set(base, p);
  }
  return Array.from(byBase.values());
}

/** Fetch all variants (same model, different colors) for a base SKU. */
export async function fetchVariantsByBaseSku(baseSku: string): Promise<{ ok: boolean; variants?: Product[]; error?: string }> {
  if (!API_BASE || !baseSku?.trim()) {
    return { ok: false, error: "API URL or baseSku missing." };
  }
  try {
    const res = await fetch(`${API_BASE}/api/product-variants/${encodeURIComponent(baseSku.trim())}`);
    const data = await res.json();
    if (!res.ok) return { ok: false, error: data?.error || res.statusText };
    const variants = (data.variants || []).map((p: any) => { try { return normalizeProduct(p); } catch { return null; } }).filter((x): x is Product => x != null);
    return { ok: true, variants };
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    return { ok: false, error: msg };
  }
}
