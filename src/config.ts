// Vite exposes only env vars prefixed with VITE_ to the client.
// Create a .env file with these variables (see .env.example).

export const config = {
  apiUrl: (import.meta.env.VITE_API_URL || 'https://vorton-mob-app.onrender.com').replace(/\/$/, ''),
  productsPath: import.meta.env.VITE_PRODUCTS_PATH || '/api/products',
  /** Payment backend base URL (no trailing slash). Backend must allow CORS for your site origin. */
  paymentApiUrl: (import.meta.env.VITE_PAYMENT_API_URL || 'https://vorton-payement.onrender.com').replace(/\/$/, ''),
  /** Path for creating a payment. payement_backend uses /api/v1/payments/create */
  paymentCreatePath: import.meta.env.VITE_PAYMENT_CREATE_PATH || '/api/v1/payments/create',
  /** Where the bank redirects after payment. Set to https://vorton.uk/payment-done.html for production. */
  paymentReturnUrl: import.meta.env.VITE_PAYMENT_RETURN_URL || '',
  /** Unified API base URL used for auth calls. */
  apiBaseUrl: (import.meta.env.VITE_API_BASE_URL || 'https://vorton-payement.onrender.com').replace(/\/$/, ''),
  /** Auth API base URL (defaults to VITE_API_BASE_URL). */
  authApiUrl: (import.meta.env.VITE_AUTH_API_URL || import.meta.env.VITE_API_BASE_URL || 'https://vorton-payement.onrender.com').replace(/\/$/, ''),
  authLoginPath: import.meta.env.VITE_AUTH_LOGIN_PATH || '/auth/login',
  authSignUpPath: import.meta.env.VITE_AUTH_SIGNUP_PATH || '/auth/signup',
  authMePath: import.meta.env.VITE_AUTH_ME_PATH || '/api/v1/auth/me',
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
