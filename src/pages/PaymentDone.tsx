import { Link, useSearchParams } from 'react-router-dom'
import { useLocale } from '../context/LocaleContext'
import { useCart } from '../context/CartContext'
import { useEffect } from 'react'
import styles from './PaymentDone.module.css'

const SUCCESS_STATUSES = ['FullyPaid', 'Paid', 'Success']
const CANCELLED_STATUSES = ['Cancelled', 'Canceled', 'Rejected']

export default function PaymentDone() {
  const { t } = useLocale()
  const { clearCart } = useCart()
  const [searchParams] = useSearchParams()
  const status = (searchParams.get('STATUS') ?? '').trim()

  const isSuccess = SUCCESS_STATUSES.includes(status)
  const isCancelled = CANCELLED_STATUSES.includes(status)
  const isFailed = status && !isSuccess && !isCancelled

  useEffect(() => {
    if (isSuccess) clearCart()
  }, [isSuccess, clearCart])

  const title = isSuccess
    ? t('paymentSuccess')
    : isCancelled
      ? t('paymentCancelled')
      : isFailed
        ? t('paymentFailed')
        : t('paymentSuccess')
  const message = isSuccess
    ? t('paymentSuccessMessage')
    : isCancelled
      ? t('paymentCancelledMessage')
      : isFailed
        ? t('paymentFailedMessage')
        : t('paymentSuccessMessage')

  return (
    <div className="container">
      <div className={styles.card}>
        <h1 className={styles.title}>{title}</h1>
        <p className={styles.message}>{message}</p>
        <Link to="/shop" className="btn btn-primary">
          {t('backToShop')}
        </Link>
      </div>
    </div>
  )
}
