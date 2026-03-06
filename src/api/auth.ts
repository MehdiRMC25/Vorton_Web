import { config } from '../config'

export type AuthUser = {
  id: string | number
  email?: string
  phone?: string
  name?: string
  first_name?: string
  last_name?: string
  membership_number?: string
  address_line1?: string
  address_line2?: string
  city?: string
  postcode?: string
  country?: string
  created_at?: string
  address?: string
  [key: string]: unknown
}

export type LoginResponse = {
  token: string
  user: AuthUser
}

export class AuthApiError extends Error {
  status: number
  code: 'INVALID_CREDENTIALS' | 'VALIDATION_ERROR' | 'CONFLICT' | 'AUTH_UNAVAILABLE'

  constructor(
    status: number,
    code: 'INVALID_CREDENTIALS' | 'VALIDATION_ERROR' | 'CONFLICT' | 'AUTH_UNAVAILABLE',
    message: string
  ) {
    super(message)
    this.status = status
    this.code = code
  }
}

type SignupPayload = {
  fullName: string
  mobileNumber: string
  email?: string
  address?: string
  password: string
  confirmPassword: string
}

function toPath(path: string) {
  return path.startsWith('/') ? path : `/${path}`
}

function buildUrl(path: string) {
  return `${config.authApiUrl}${toPath(path)}`
}

function dedupePaths(paths: string[]) {
  return Array.from(new Set(paths.map(toPath)))
}

async function readErrorMessage(res: Response): Promise<string> {
  const text = await res.text()
  if (!text) return ''
  const isHtml = /<\s*!?\s*DOCTYPE|<\s*html|<\s*pre\s*>/i.test(text)
  if (isHtml || text.includes('Cannot POST') || text.includes('Not Found')) return ''
  try {
    const j = JSON.parse(text) as {
      message?: string
      error?: string
      details?: string
      errors?: string[] | string
    }
    if (Array.isArray(j.errors)) return j.errors.join(', ')
    if (typeof j.errors === 'string') return j.errors
    return j.message ?? j.error ?? j.details ?? ''
  } catch {
    return text.slice(0, 300)
  }
}

function toAuthUser(user: unknown): AuthUser {
  if (!user || typeof user !== 'object') return { id: 'user' }
  const u = user as Record<string, unknown>
  const firstName = typeof u.first_name === 'string' ? u.first_name : ''
  const lastName = typeof u.last_name === 'string' ? u.last_name : ''
  const fullName = [firstName, lastName].filter(Boolean).join(' ').trim()
  const addressLine1 = typeof u.address_line1 === 'string' ? u.address_line1 : ''
  const addressLine2 = typeof u.address_line2 === 'string' ? u.address_line2 : ''
  const city = typeof u.city === 'string' ? u.city : ''
  const postcode = typeof u.postcode === 'string' ? u.postcode : ''
  const country = typeof u.country === 'string' ? u.country : ''

  const mapped: AuthUser = {
    ...(u as AuthUser),
    id: (u.id as string | number | undefined) ?? 'user',
    email: typeof u.email === 'string' ? u.email : undefined,
    phone:
      (typeof u.phone === 'string' ? u.phone : undefined) ??
      (typeof u.mobile === 'string' ? u.mobile : undefined) ??
      (typeof u.mobileNumber === 'string' ? u.mobileNumber : undefined),
    name: fullName || (typeof u.fullName === 'string' ? u.fullName : undefined),
    first_name: firstName || undefined,
    last_name: lastName || undefined,
    membership_number: typeof u.membership_number === 'string' ? u.membership_number : undefined,
    address_line1: addressLine1 || undefined,
    address_line2: addressLine2 || undefined,
    city: city || undefined,
    postcode: postcode || undefined,
    country: country || undefined,
    created_at: typeof u.created_at === 'string' ? u.created_at : undefined,
  }

  const compactAddress = [addressLine1, addressLine2, city, postcode, country]
    .filter(Boolean)
    .join(', ')
    .trim()
  if (compactAddress) mapped.address = compactAddress

  return mapped
}

async function requestWithFallback<T>(
  paths: string[],
  init: RequestInit,
  parse: (res: Response) => Promise<T>
): Promise<T> {
  const candidates = dedupePaths(paths)
  let lastError: unknown = null

  for (const path of candidates) {
    let res: Response
    try {
      res = await fetch(buildUrl(path), init)
    } catch {
      continue
    }

    if (res.ok) return parse(res)

    const message = (await readErrorMessage(res)) || ''
    if (res.status === 404 || res.status === 405) {
      lastError = new AuthApiError(res.status, 'AUTH_UNAVAILABLE', message || 'Endpoint not found')
      continue
    }

    if (res.status === 401 || res.status === 403) {
      throw new AuthApiError(res.status, 'INVALID_CREDENTIALS', 'INVALID_CREDENTIALS')
    }
    if (res.status === 409) {
      throw new AuthApiError(res.status, 'CONFLICT', message || 'Conflict')
    }
    if (res.status === 400) {
      throw new AuthApiError(res.status, 'VALIDATION_ERROR', message || 'Validation failed')
    }
    throw new AuthApiError(res.status, 'AUTH_UNAVAILABLE', message || 'Authentication service unavailable')
  }

  if (lastError instanceof Error) throw lastError
  throw new AuthApiError(503, 'AUTH_UNAVAILABLE', 'Authentication service unavailable')
}

export async function signup(payload: SignupPayload): Promise<LoginResponse> {
  const body = {
    fullName: payload.fullName.trim(),
    full_name: payload.fullName.trim(),
    mobileNumber: payload.mobileNumber.trim(),
    mobile: payload.mobileNumber.trim(),
    phone: payload.mobileNumber.trim(),
    email: payload.email?.trim() || undefined,
    address: payload.address?.trim() || undefined,
    password: payload.password,
    confirmPassword: payload.confirmPassword,
  }

  const paths = [config.authSignUpPath, '/api/v1/auth/signup']
  return requestWithFallback(
    paths,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    },
    async (res) => {
      const data = (await res.json()) as { token?: string; user?: unknown }
      return { token: data.token ?? '', user: toAuthUser(data.user) }
    }
  )
}

export async function login(emailOrPhone: string, password: string): Promise<LoginResponse> {
  const payload = {
    email: emailOrPhone.trim(),
    login: emailOrPhone.trim(),
    username: emailOrPhone.trim(),
    mobile: emailOrPhone.trim(),
    phone: emailOrPhone.trim(),
    password,
  }

  const paths = [config.authLoginPath, '/api/v1/auth/login']
  return requestWithFallback(
    paths,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    },
    async (res) => {
      const data = (await res.json()) as { token?: string; user?: unknown }
      return { token: data.token ?? '', user: toAuthUser(data.user) }
    }
  )
}

export async function getMe(token: string): Promise<AuthUser> {
  const paths = [config.authMePath, '/auth/me']
  return requestWithFallback(
    paths,
    {
      method: 'GET',
      headers: { Authorization: `Bearer ${token}` },
    },
    async (res) => {
      const data = (await res.json()) as { user?: unknown } | unknown
      const userData = typeof data === 'object' && data && 'user' in data ? (data as { user?: unknown }).user : data
      return toAuthUser(userData)
    }
  )
}
