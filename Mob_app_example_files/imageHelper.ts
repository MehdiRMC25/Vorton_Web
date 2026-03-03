import { ImageSourcePropType } from "react-native";

const CLOUDINARY_FOLDER = "vorton-products";

/**
 * Public_id from filename: strip path/extension, collapse spaces around hyphens, lowercase.
 * Matches upload script so Cloudinary lookup works (public_id is case-sensitive).
 */
function filenameToPublicIdExact(filename: string): string {
  const base = filename.trim().replace(/^\//, "").replace(/\.[^.]+$/, "");
  return base.replace(/\s*-\s*/g, "-");
}

/** Build full Cloudinary URL from a filename using exact name (strip extension only). */
function cloudinaryUrlFromFilename(filename: string): string | null {
  const cloudName =
    typeof process !== "undefined" && process.env?.EXPO_PUBLIC_CLOUDINARY_CLOUD_NAME;
  if (!cloudName || !filename?.trim()) return null;
  const publicId = filenameToPublicIdExact(filename);
  if (!publicId) return null;
  return `https://res.cloudinary.com/${cloudName}/image/upload/${CLOUDINARY_FOLDER}/${encodeURIComponent(publicId)}`;
}

/** If URL already has a Cloudinary transform, use as-is; otherwise add size/format. */
function ensureOptimizedUrl(url: string, size: "thumb" | "detail"): string {
  const hasTransform = url.includes("/upload/w_");
  if (hasTransform) return url;
  const transform = size === "thumb" ? "w_400,q_auto,f_auto" : "w_800,q_auto,f_auto";
  if (url.includes("res.cloudinary.com") && url.includes("/image/upload/")) {
    return url.replace("/image/upload/", `/image/upload/${transform}/`);
  }
  return url;
}

export function getProductImageSource(
  image?: string,
  _imageType?: "local" | "remote",
  size: "thumb" | "detail" = "thumb"
): ImageSourcePropType | null {
  if (!image || typeof image !== "string" || !image.trim()) return null;
  const raw = image.trim();
  if (raw.startsWith("http://") || raw.startsWith("https://")) {
    const uri = ensureOptimizedUrl(raw, size);
    return { uri };
  }
  // Nested/filename from MongoDB (image or images[]): resolve to full Cloudinary URL
  const fullUrl = cloudinaryUrlFromFilename(raw);
  if (fullUrl) {
    const uri = ensureOptimizedUrl(fullUrl, size);
    return { uri };
  }
  return null;
}
