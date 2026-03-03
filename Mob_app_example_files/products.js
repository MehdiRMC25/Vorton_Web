const path = require("path");
const envPath = path.resolve(__dirname, "..", ".env");
const envCwd = path.resolve(process.cwd(), ".env");
require("dotenv").config({ path: envPath });
require("dotenv").config({ path: envCwd });
const { MongoClient, ObjectId } = require("mongodb");
const fallback = require("./fallbackProducts");

let client = null;
let collection = null;
let indexesCreated = false;

// --- Server-side in-memory cache (1 min so MongoDB updates show soon after re-import) ---
const CACHE_TTL_MS = 1 * 60 * 1000;
const serverCache = {
  all: null,        // { data: [...], ts: number }
  byCategory: {},   // { men: { data, ts }, ... }
  byId: {},         // { id: { data, ts }, ... }
};

function isCacheValid(entry) {
  return entry && (Date.now() - entry.ts < CACHE_TTL_MS);
}

// --- MongoDB projection: fetch all possible name/color/fabric/size fields from DB ---
// Includes CSV-style and localized names (e.g. Rəngi, ADI from Gundalik Geyimlar.csv)
const PROJECTION = {
  _id: 1, sku: 1, skuColor: 1, id: 1,
  name: 1, Name: 1, ADI: 1, productName: 1, product_name: 1, productTitle: 1, product_title: 1,
  "Product Name": 1, "Product Title": 1,
  title: 1, Title: 1, description: 1, itemName: 1, item_name: 1,
  category: 1, gender: 1, Sex: 1,
  color: 1, Color: 1, colour: 1, Colour: 1, Rəngi: 1, "Colour": 1,
  fabric: 1, Fabric: 1, material: 1, Material: 1, fabricType: 1, FabricType: 1, "Fabric Type": 1,
  price: 1, discountedPrice: 1,
  sizes: 1, Sizes: 1, Size: 1, size: 1, size_options: 1, availableSizes: 1, available_sizes: 1, sizeOptions: 1, "Available Sizes": 1,
  image: 1, images: 1, imageUrls: 1, imageList: 1,
  imageUrl: 1, imagePublicId: 1,
  videoUrl: 1, video: 1,
  isNewCollection: 1, is_new_collection: 1, IsNewCollection: 1, newCollection: 1,
  isDiscounted: 1, is_discounted: 1,
};

function hasMongoUri() {
  return !!process.env.MONGODB_URI;
}

function withCloudinaryTransform(url, transform) {
  if (!url || !url.includes("/upload/")) return url;
  return url.replace("/upload/", `/upload/${transform}/`);
}

async function getCollection() {
  const uri = process.env.MONGODB_URI;
  if (!uri) throw new Error("MONGODB_URI not set in .env");
  if (client && collection) return { collection };
  // Atlas + Render: autoSelectFamily:false often fixes SSL alert 80 (IPv4/IPv6 handshake)
  const opts = uri.startsWith("mongodb+srv://")
    ? { serverSelectionTimeoutMS: 15000, autoSelectFamily: false }
    : {};
  client = new MongoClient(uri, opts);
  await client.connect();
  const db = client.db("vorton_app");
  collection = db.collection("products");

  // Create indexes on first connection (idempotent). sku is non-unique (same model, different colors share sku).
  if (!indexesCreated) {
    try {
      await Promise.all([
        collection.createIndex({ gender: 1 }),
        collection.createIndex({ sku: 1 }),
        collection.createIndex({ skuColor: 1 }),
      ]);
      indexesCreated = true;
      console.log("[products] MongoDB indexes ensured (gender, sku, skuColor)");
    } catch (e) {
      console.warn("[products] Index creation skipped:", e.message);
    }
  }

  return { collection };
}

function normalize(doc) {
  if (!doc) return null;
  const id = doc._id ? doc._id.toString() : doc.id;
  const cloudBase = process.env.CLOUDINARY_CLOUD_NAME
    ? `https://res.cloudinary.com/${process.env.CLOUDINARY_CLOUD_NAME}/image/upload/vorton-products/`
    : "";
  // Filename → public_id: strip path/extension, collapse spaces around hyphens, then lowercase to match upload script.
  function filenameToPublicId(s) {
    if (!s || typeof s !== "string") return "";
    const base = s.trim().replace(/^\//, "").replace(/\.[^.]+$/, "");
    return base.replace(/\s*-\s*/g, "-");
  }
  function toPublicIdNormalized(s) {
    if (!s || typeof s !== "string") return "";
    const base = s.trim().replace(/^\//, "").replace(/\.[^.]+$/, "");
    let n = base.replace(/\s+/g, "-").replace(/[^a-zA-Z0-9_-]/g, "").toLowerCase();
    const m = n.match(/^(.+)-\d+$/);
    if (m) n = m[1];
    return n;
  }
  const color = (doc.color ?? doc.Color ?? doc.colour ?? doc.Rəngi ?? "").toString().trim();
  const skuColor = (doc.skuColor || "").toString().trim() || (doc.sku && color ? `${String(doc.sku).trim()}-${String(color).trim().replace(/\s+/g, "-")}` : "");

  // Primary image: exact filename from MongoDB first (matches Cloudinary), then full URL, then fallbacks
  let image = doc.imageUrl || null;
  if (!image && typeof doc.image === "string" && (doc.image.startsWith("http://") || doc.image.startsWith("https://"))) image = doc.image;
  if (!image && cloudBase && typeof doc.image === "string" && doc.image.trim()) {
    const publicId = filenameToPublicId(doc.image);
    if (publicId) image = cloudBase + encodeURIComponent(publicId);
  }
  if (!image && cloudBase && Array.isArray(doc.images) && doc.images[0]) {
    const publicId = filenameToPublicId(doc.images[0]);
    if (publicId) image = cloudBase + encodeURIComponent(publicId);
  }
  if (!image && cloudBase && skuColor) {
    const publicId = toPublicIdNormalized(skuColor);
    if (publicId) image = cloudBase + publicId;
  }
  if (!image && cloudBase && doc.sku) {
    const publicId = toPublicIdNormalized(doc.sku);
    if (publicId) image = cloudBase + publicId;
  }
  if (!image && cloudBase) {
    const publicId = toPublicIdNormalized(skuColor || doc.sku || "");
    if (publicId) image = cloudBase + publicId;
  }

  // Sizes: use only what's in MongoDB – never default to template when DB has any size data
  const rawSizes = doc.sizes ?? doc.Sizes ?? doc.availableSizes ?? doc.available_sizes ?? doc["Available Sizes"] ?? doc.sizeOptions ?? doc.size ?? doc.Size ?? doc.size_options;
  let sizes = [];
  if (Array.isArray(rawSizes) && rawSizes.length > 0) {
    sizes = rawSizes.map((s) => String(s).trim()).filter(Boolean);
  } else if (typeof rawSizes === "string" && rawSizes.trim()) {
    const str = rawSizes.trim();
    if (str.startsWith("[")) {
      try {
        const parsed = JSON.parse(str);
        if (Array.isArray(parsed)) sizes = parsed.map((s) => String(s).trim()).filter(Boolean);
        else sizes = str.split(",").map((s) => s.trim()).filter(Boolean);
      } catch {
        sizes = str.split(",").map((s) => s.trim()).filter(Boolean);
      }
    } else {
      sizes = str.split(",").map((s) => s.trim()).filter(Boolean);
    }
  }
  if (sizes.length === 0) sizes = ["S", "M", "L", "XL"];

  // Name: prefer real product name from MongoDB (and CSV/localized fields like ADI, "Product Name")
  const rawName =
    doc.name ?? doc.Name ?? doc.ADI ?? doc.productName ?? doc.product_name ?? doc.productTitle ?? doc.product_title
    ?? doc["Product Name"] ?? doc["Product Title"]
    ?? doc.title ?? doc.Title ?? doc.description ?? doc.itemName ?? doc.item_name ?? "";
  const name = String(rawName).trim();
  // Fabric: support fabric, Fabric, material, Material, fabricType, "Fabric Type"
  const rawFabric = doc.fabric ?? doc.Fabric ?? doc.material ?? doc.Material ?? doc.fabricType ?? doc.FabricType ?? doc["Fabric Type"] ?? "";
  const fabric = String(rawFabric).trim() || "Not specified";

  // Images array: build URLs with same public_id normalization so they match Cloudinary (upload script uses one per product).
  const rawImages = doc.images ?? doc.imageUrls ?? doc.imageList;
  let images = [];
  if (Array.isArray(rawImages) && rawImages.length > 0) {
    images = rawImages
      .filter((u) => typeof u === "string" && u.trim())
      .map((u) => {
        const s = u.trim().replace(/^\//, "");
        if (s.startsWith("http://") || s.startsWith("https://")) return s;
        if (cloudBase) {
          const publicId = filenameToPublicId(s);
          return publicId ? cloudBase + encodeURIComponent(publicId) : null;
        }
        return null;
      })
      .filter(Boolean);
  }
  if (images.length > 0 && !image) image = images[0];
  if (images.length === 0 && image) images = [image];

  const thumb = image ? withCloudinaryTransform(image, "w_400,q_auto,f_auto") : undefined;
  const detail = image ? withCloudinaryTransform(image, "w_800,q_auto,f_auto") : undefined;

  const videoUrl = (doc.videoUrl ?? doc.video ?? "").toString().trim() || undefined;

  const isNewCollection = !!(
    doc.isNewCollection === true ||
    doc.is_new_collection === true ||
    doc.IsNewCollection === true ||
    doc.newCollection === true
  );

  return {
    id: String(id || ""),
    sku: doc.sku || "",
    skuColor: skuColor || undefined,
    name: name || doc.sku || "",
    category: (doc.category ?? doc.gender ?? doc.Sex ?? "").toString().toLowerCase().trim(),
    color,
    fabric,
    price: Number(doc.price) || 0,
    discountedPrice: doc.discountedPrice != null ? Number(doc.discountedPrice) : null,
    sizes,
    image: image || undefined,
    images: images.length ? images : undefined,
    thumbnailUrl: thumb,
    detailImageUrl: detail,
    videoUrl,
    imageType: image ? "remote" : undefined,
    isNewCollection,
  };
}

async function getAllProducts() {
  if (!hasMongoUri()) {
    console.warn("[products] Using fallback: MONGODB_URI is not set (add it to .env or Render env vars)");
    return { list: fallback.getFallbackList(), fromFallback: true };
  }
  if (isCacheValid(serverCache.all)) return { list: serverCache.all.data, fromFallback: false };
  try {
    const { collection: col } = await getCollection();
    const docs = await col.find({}, { projection: PROJECTION }).sort({ sku: 1, _id: 1 }).toArray();
    const products = docs.map((d) => { try { return normalize(d); } catch (e) { console.warn("[products] normalize failed:", e.message); return null; } }).filter(Boolean);
    serverCache.all = { data: products, ts: Date.now() };
    products.forEach((p) => { if (p.id) serverCache.byId[p.id] = { data: p, ts: Date.now() }; });
    return { list: products, fromFallback: false };
  } catch (err) {
    console.warn("[products] Using fallback: MongoDB connection failed -", err.message);
    return { list: fallback.getFallbackList(), fromFallback: true };
  }
}

async function getProductById(id) {
  if (!hasMongoUri()) return fallback.getById(id);
  if (isCacheValid(serverCache.byId[id])) return serverCache.byId[id].data;
  try {
    const { collection: col } = await getCollection();
    let doc = null;
    try {
      if (ObjectId.isValid(id) && String(new ObjectId(id)) === id) doc = await col.findOne({ _id: new ObjectId(id) }, { projection: PROJECTION });
    } catch (_) {}
    if (!doc) doc = await col.findOne({ $or: [{ sku: id }, { skuColor: id }, { id: id }] }, { projection: PROJECTION });
    const product = normalize(doc);
    if (product && product.id) serverCache.byId[product.id] = { data: product, ts: Date.now() };
    return product;
  } catch (err) {
    console.warn("[products] Using fallback: MongoDB connection failed -", err.message);
    return fallback.getById(id);
  }
}

async function getProductsByCategory(category) {
  if (!hasMongoUri()) return fallback.getByCategory(category);
  if (isCacheValid(serverCache.byCategory[category])) return serverCache.byCategory[category].data;
  try {
    const { collection: col } = await getCollection();
    const c = String(category).trim().toLowerCase();
    const re = new RegExp(`^${c.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`, "i");
    const docs = await col.find({ $or: [{ category: re }, { gender: re }] }, { projection: PROJECTION }).sort({ sku: 1, _id: 1 }).toArray();
    const products = docs.map((d) => { try { return normalize(d); } catch (e) { console.warn("[products] normalize failed:", e.message); return null; } }).filter(Boolean);
    serverCache.byCategory[category] = { data: products, ts: Date.now() };
    return products;
  } catch (err) {
    console.warn("[products] Using fallback: MongoDB connection failed -", err.message);
    return fallback.getByCategory(category);
  }
}

async function checkConnection() {
  if (!hasMongoUri()) return { connected: false, error: "MONGODB_URI not set (add to .env or Render Environment)" };
  try {
    const { collection: col } = await getCollection();
    await col.findOne({}, { projection: { _id: 1 } });
    return { connected: true };
  } catch (err) {
    return { connected: false, error: err.message || String(err) };
  }
}

/** Home page media: read video URLs from videos collection, document { _id: "home", videoUrls: ["url1", "url2"] } */
async function getHomeVideos() {
  if (!hasMongoUri()) return [];
  try {
    await getCollection();
    const db = client.db("vorton_app");
    const doc = await db.collection("videos").findOne({ _id: "home" });
    const urls = doc?.videoUrls;
    if (!Array.isArray(urls)) return [];
    return urls.filter((u) => typeof u === "string" && u.trim()).slice(0, 10);
  } catch (err) {
    console.warn("[products] getHomeVideos failed:", err.message);
    return [];
  }
}

/** Only strip last segment if it looks like a color (non-numeric). Keeps e.g. -372 in base. */
function getBaseSku(sku) {
  const s = String(sku ?? "").trim();
  if (!s) return s;
  const parts = s.split("-").filter(Boolean);
  if (parts.length <= 1) return s;
  const last = parts[parts.length - 1] ?? "";
  if (/^\d+$/.test(last)) return s;
  return parts.slice(0, -1).join("-");
}

/** All variants for the same model: same SKU (group), different SKU-Color (identify colors). */
async function getVariantsByBaseSku(baseSku) {
  if (!baseSku || !String(baseSku).trim()) return [];
  if (!hasMongoUri()) return [];
  const base = String(baseSku).trim();
  const prefix = base + "-";
  const escapedPrefix = prefix.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  try {
    const { collection: col } = await getCollection();
    const docs = await col
      .find({
        $or: [
          { sku: base },
          { sku: { $regex: `^${escapedPrefix}` } },
          { skuColor: base },
          { skuColor: { $regex: `^${escapedPrefix}` } },
        ],
      }, { projection: PROJECTION })
      .sort({ sku: 1, skuColor: 1 })
      .toArray();
    return docs.map((d) => { try { return normalize(d); } catch (e) { console.warn("[products] normalize failed:", e.message); return null; } }).filter(Boolean);
  } catch (err) {
    console.warn("[products] getVariantsByBaseSku failed:", err.message);
    return [];
  }
}

/** One product per SKU (same model). Prefer variant with isNewCollection so New collections on home shows correctly. */
function oneProductPerBaseSku(products) {
  if (!Array.isArray(products) || products.length === 0) return [];
  const byModel = new Map();
  for (const p of products) {
    const modelSku = (p.sku || "").trim() || p.id;
    if (!modelSku) continue;
    const existing = byModel.get(modelSku);
    if (!existing) {
      byModel.set(modelSku, p);
    } else if (p.isNewCollection && !existing.isNewCollection) {
      byModel.set(modelSku, p);
    }
  }
  const result = Array.from(byModel.values());
  const skuHasNew = new Set(products.filter((p) => p.isNewCollection).map((p) => (p.sku || "").trim()).filter(Boolean));
  result.forEach((p) => {
    if (skuHasNew.has((p.sku || "").trim())) p.isNewCollection = true;
  });
  return result;
}

module.exports = { getAllProducts, getProductById, getProductsByCategory, getVariantsByBaseSku, getBaseSku, oneProductPerBaseSku, checkConnection, getHomeVideos };

