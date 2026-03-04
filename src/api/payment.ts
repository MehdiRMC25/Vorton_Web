import { config } from '../config'

/** Backend must allow CORS for your frontend origin (e.g. http://localhost:5173, https://vorton.uk). */

export type CreatePaymentRequest = {
  amount: number
  currency: string
  reference: string
  returnUrl: string
}

export type CreatePaymentResponse = {
  paymentId: string
  bankOrderId: string
  bankOrderSecret: string
  status: string
  amount: number
  currency: string
  reference: string
  redirectUrl: string
  paymentUrl: string
  createdAt: string
}

const PAYMENT_TIMEOUT_MS = 120_000 // Render free tier cold start can take 1–2 min; retry is usually fast

export async function createPayment(body: CreatePaymentRequest): Promise<CreatePaymentResponse> {
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), PAYMENT_TIMEOUT_MS)

  try {
    const url = `${config.paymentApiUrl}${config.paymentCreatePath.startsWith('/') ? '' : '/'}${config.paymentCreatePath}`
  const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      signal: controller.signal,
    })
    if (!res.ok) {
      const err = await res.text()
      throw new Error(err || `Payment API error ${res.status}`)
    }
    return res.json()
  } catch (e) {
    if (e instanceof Error) {
      if (e.name === 'AbortError') {
        throw new Error('PAYMENT_TIMEOUT')
      }
      if (e.message.includes('Failed to fetch') || e.message.includes('NetworkError')) {
        throw new Error('PAYMENT_CORS_OR_NETWORK')
      }
    }
    throw e
  } finally {
    clearTimeout(timeoutId)
  }
}
