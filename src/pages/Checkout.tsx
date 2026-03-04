import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useCart } from '../context/CartContext'
import { useLocale } from '../context/LocaleContext'
import { createPayment } from '../api/payment'
import type { CartItem } from '../types'
import styles from './Checkout.module.css'

function getItemPrice(item: CartItem): number {
  const v = item.product.variants?.[item.variantIndex]
  if (v) return v.discountedPrice ?? v.price
  return item.product.salePrice ?? item.product.price
}

export default function Checkout() {
  const { t } = useLocale()
  const { items } = useCart()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const subtotal = items.reduce((sum, i) => sum + getItemPrice(i) * i.quantity, 0)

  if (items.length === 0) {
    return (
      <div className="container">
        <h1 className={styles.title}>{t('checkout')}</h1>
        <div className={styles.empty}>
          <p>{t('yourCartEmpty')}</p>
          <Link to="/shop" className="btn btn-primary">
            {t('continueShopping')}
          </Link>
        </div>
      </div>
    )
  }

  async function handleProceedToPayment() {
    setError(null)
    setLoading(true)
    try {
      const returnUrl = `${window.location.origin}/payment/done`
      const res = await createPayment({
        amount: Math.round(subtotal * 100) / 100,
        currency: 'AZN',
        reference: `order-${Date.now()}`,
        returnUrl,
      })
      const url = res.redirectUrl || res.paymentUrl
      if (url) window.location.href = url
      else throw new Error('No payment URL returned')
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Payment failed'
      setError(
        msg === 'PAYMENT_TIMEOUT'
          ? t('paymentTimeoutMessage')
          : msg === 'PAYMENT_CORS_OR_NETWORK'
            ? t('paymentCorsError')
            : msg
      )
      setLoading(false)
    }
  }

  return (
    <div className="container">
      <h1 className={styles.title}>{t('checkout')}</h1>
      <div className={styles.wrap}>
        <div className={styles.summaryCard}>
          <h2 className={styles.summaryTitle}>{t('orderSummary')}</h2>
          <ul className={styles.itemList}>
            {items.map((item) => {
              const price = getItemPrice(item)
              const lineTotal = price * item.quantity
              return (
                <li key={`${item.product.id}-${item.variantIndex}-${item.size}`}>
                  <span>{item.product.name} × {item.quantity}</span>
                  <span>₼{lineTotal.toFixed(2)}</span>
                </li>
              )
            })}
          </ul>
          <p className={styles.totalRow}>
            <span>{t('subtotal')}</span>
            <span>₼{subtotal.toFixed(2)}</span>
          </p>
          <p className={styles.note}>{t('shippingNote')}</p>
          {error && <p className={styles.error}>{error}</p>}
          <button
            type="button"
            className="btn btn-primary"
            style={{ width: '100%', marginTop: 16 }}
            onClick={handleProceedToPayment}
            disabled={loading}
          >
            {loading ? t('loading') : t('proceedToPayment')}
          </button>
          {loading && (
            <p className={styles.loadingHint}>{t('paymentLoadingHint')}</p>
          )}
          <Link to="/cart" className={styles.backLink}>
            ← {t('cart')}
          </Link>
        </div>
      </div>
    </div>
  )
}
