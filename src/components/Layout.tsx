import { Link, useLocation } from 'react-router-dom'
import { useCart } from '../context/CartContext'
import { useLocale } from '../context/LocaleContext'
import styles from './Layout.module.css'
import vortonLogo from '../../Assets_2/Vorton_Logo.png'

export default function Layout({ children }: { children: React.ReactNode }) {
  const { totalItems } = useCart()
  const { locale, setLocale, t } = useLocale()
  const location = useLocation()
  const isHome = location.pathname === '/'

  return (
    <div className={styles.layout}>
      <header className={styles.header}>
        <div className={styles.headerInner}>
          <Link to="/" className={styles.logo}>
            <img src={vortonLogo} alt="Vorton" className={styles.logoIcon} />
            <span>Vorton</span>
          </Link>
          <div className={styles.navWrap}>
          <nav className={styles.nav}>
            <Link to="/" className={location.pathname === '/' ? styles.navActive : ''}>
              {t('home')}
            </Link>
            <Link to="/about" className={location.pathname === '/about' ? styles.navActive : ''}>
              {t('aboutUs')}
            </Link>
            <Link to="/shop" className={location.pathname.startsWith('/shop') ? styles.navActive : ''}>
              {t('shop')}
            </Link>
            <Link to="/cart" className={styles.cartLink + (location.pathname === '/cart' ? ' ' + styles.navActive : '')}>
              {t('cart')}
              {totalItems > 0 && <span className={styles.cartBadge}>{totalItems}</span>}
            </Link>
            <Link to="/signin" className={location.pathname === '/signin' ? styles.navActive : ''}>
              {t('signIn')}
            </Link>
            <Link to="/contact" className={location.pathname === '/contact' ? styles.navActive : ''}>
              {t('contact')}
            </Link>
            <button
              type="button"
              className={locale === 'en' ? `${styles.langBtn} ${styles.langBtnActive}` : styles.langBtn}
              onClick={() => setLocale(locale === 'az' ? 'en' : 'az')}
              title={t('changeLanguage')}
            >
              {locale === 'az' ? t('english') : t('azerbaijani')}
            </button>
          </nav>
          </div>
        </div>
      </header>
      <main className={isHome ? '' : styles.mainPadded}>{children}</main>
    </div>
  )
}
