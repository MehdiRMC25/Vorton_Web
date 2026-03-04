import { Link } from 'react-router-dom'
import { useLocale } from '../context/LocaleContext'
import { useCart } from '../context/CartContext'
import { useEffect } from 'react'
import styles from './PaymentDone.module.css'

export default function PaymentDone() {
  const { t } = useLocale()
  const { clearCart } = useCart()

  useEffect(() => {
    clearCart()
  }, [clearCart])

  return (
    <div className="container">
      <div className={styles.card}>
        <h1 className={styles.title}>{t('paymentSuccess')}</h1>
        <p className={styles.message}>{t('paymentSuccessMessage')}</p>
        <Link to="/shop" className="btn btn-primary">
          {t('backToShop')}
        </Link>
      </div>
    </div>
  )
}
