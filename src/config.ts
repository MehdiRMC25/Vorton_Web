// Vite exposes only env vars prefixed with VITE_ to the client.
// Create a .env file with these variables (see .env.example).

export const config = {
  apiUrl: (import.meta.env.VITE_API_URL || 'https://vorton-mob-app.onrender.com').replace(/\/$/, ''),
  productsPath: import.meta.env.VITE_PRODUCTS_PATH || '/api/products',
  cloudinary: {
    cloudName: import.meta.env.VITE_CLOUDINARY_CLOUD_NAME || '',
    folder: import.meta.env.VITE_CLOUDINARY_FOLDER || 'vorton-products',
  },
}

/** Filename → public_id: strip path/extension, collapse spaces around hyphens (match mobile imageHelper + server). */
function filenameToPublicId(filename: string): string {
  if (!filename || typeof filename !== 'string') return ''
  const base = filename.trim().replace(/^\//, '').replace(/\.[^.]+$/, '')
  return base.replace(/\s*-\s*/g, '-')
}

export function cloudinaryUrl(filename: string): string {
  const { cloudName, folder } = config.cloudinary
  if (!cloudName || !filename?.trim()) return ''
  const raw = filename.trim()
  if (raw.startsWith('http://') || raw.startsWith('https://')) return raw
  const publicId = filenameToPublicId(raw)
  if (!publicId) return ''
  const base = `https://res.cloudinary.com/${cloudName}/image/upload`
  const path = folder ? `${folder}/${encodeURIComponent(publicId)}` : encodeURIComponent(publicId)
  return `${base}/${path}`
}
