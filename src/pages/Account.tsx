import { Link, useNavigate } from 'react-router-dom'
import { useLocale } from '../context/LocaleContext'
import { useAuth } from '../context/AuthContext'
import styles from './Account.module.css'

export default function Account() {
  const { t, locale, setLocale } = useLocale()
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const displayName = typeof user?.name === 'string' && user.name.trim()
    ? user.name
    : [user?.first_name, user?.last_name].filter(Boolean).join(' ').trim() || t('notProvided')
  const displayEmail = typeof user?.email === 'string' && user.email.trim() ? user.email : t('notProvided')
  const displayPhone = typeof user?.phone === 'string' && user.phone.trim() ? user.phone : t('notProvided')
  const userAddress = typeof user?.address === 'string' && user.address.trim() ? user.address : ''
  const joinedDate = typeof user?.created_at === 'string' && user.created_at
    ? new Date(user.created_at).toLocaleDateString(locale === 'az' ? 'az-AZ' : 'en-GB')
    : t('notProvided')
  const membershipNumber = typeof user?.membership_number === 'string' && user.membership_number
    ? user.membership_number
    : t('notProvided')
  const memberCode = typeof user?.id === 'string' || typeof user?.id === 'number'
    ? `ID-${user.id}`
    : t('notProvided')

  const recentOrders = [
    { id: 'VR-009841', date: '2026-02-21', total: '$129.00', status: t('orderStatusDelivered') },
    { id: 'VR-009764', date: '2026-01-14', total: '$84.00', status: t('orderStatusInTransit') },
    { id: 'VR-009702', date: '2025-12-28', total: '$59.00', status: t('orderStatusProcessing') },
  ]

  function handleSignOut() {
    logout()
    navigate('/')
  }

  return (
    <div className="container">
      <div className={styles.wrap}>
        <h1 className={styles.title}>{t('myAccount')}</h1>
        <p className={styles.welcome}>{t('welcome')}</p>

        <section className={styles.cardGrid}>
          <article className={styles.card}>
            <h2 className={styles.sectionTitle}>{t('membershipNumber')}</h2>
            <p className={styles.value}>{membershipNumber}</p>
          </article>
          <article className={styles.card}>
            <h2 className={styles.sectionTitle}>{t('memberCode')}</h2>
            <p className={styles.value}>{memberCode}</p>
          </article>
          <article className={styles.card}>
            <h2 className={styles.sectionTitle}>{t('memberSince')}</h2>
            <p className={styles.value}>{joinedDate}</p>
          </article>
          <article className={styles.card}>
            <h2 className={styles.sectionTitle}>{t('credits')}</h2>
            <p className={styles.value}>0</p>
          </article>
        </section>

        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>{t('profile')}</h2>
          <div className={styles.infoGrid}>
            <div>
              <p className={styles.label}>{t('nameLabel')}</p>
              <p className={styles.text}>{displayName}</p>
            </div>
            <div>
              <p className={styles.label}>{t('email')}</p>
              <p className={styles.text}>{displayEmail}</p>
            </div>
            <div>
              <p className={styles.label}>{t('mobileLabel')}</p>
              <p className={styles.text}>{displayPhone}</p>
            </div>
            <div>
              <p className={styles.label}>{t('address')}</p>
              <p className={styles.text}>{userAddress || t('notProvided')}</p>
            </div>
          </div>
        </section>

        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>{t('settings')}</h2>
          <div className={styles.settingRow}>
            <span className={styles.settingLabel}>{t('language')}</span>
            <div className={styles.langOptions}>
              <button
                type="button"
                className={locale === 'az' ? styles.langOptionActive : styles.langOption}
                onClick={() => setLocale('az')}
              >
                {t('azerbaijani')}
              </button>
              <button
                type="button"
                className={locale === 'en' ? styles.langOptionActive : styles.langOption}
                onClick={() => setLocale('en')}
              >
                {t('english')}
              </button>
            </div>
          </div>
          <div className={styles.infoGrid}>
            <div>
              <p className={styles.label}>{t('marketingEmails')}</p>
              <p className={styles.text}>{t('enabled')}</p>
            </div>
            <div>
              <p className={styles.label}>{t('smsUpdates')}</p>
              <p className={styles.text}>{t('enabled')}</p>
            </div>
          </div>
        </section>

        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>{t('security')}</h2>
          <div className={styles.infoGrid}>
            <div>
              <p className={styles.label}>{t('passwordStatus')}</p>
              <p className={styles.text}>{t('passwordSet')}</p>
            </div>
            <div>
              <p className={styles.label}>{t('twoFactorAuth')}</p>
              <p className={styles.text}>{t('disabled')}</p>
            </div>
          </div>
        </section>

        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>{t('orderHistory')}</h2>
          <div className={styles.orderList}>
            {recentOrders.map((order) => (
              <div key={order.id} className={styles.orderRow}>
                <div>
                  <p className={styles.orderId}>{order.id}</p>
                  <p className={styles.orderMeta}>{new Date(order.date).toLocaleDateString(locale === 'az' ? 'az-AZ' : 'en-GB')}</p>
                </div>
                <div className={styles.orderRight}>
                  <p className={styles.orderTotal}>{order.total}</p>
                  <p className={styles.orderMeta}>{order.status}</p>
                </div>
              </div>
            ))}
          </div>
          <Link to="/shop" className={styles.link}>{t('continueShopping')}</Link>
        </section>

        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>{t('addresses')}</h2>
          <p className={styles.placeholder}>{userAddress || t('noAddressSaved')}</p>
        </section>

        <section className={styles.section}>
          <button type="button" className={styles.signOutBtn} onClick={handleSignOut}>
            {t('signOut')}
          </button>
        </section>
      </div>
    </div>
  )
}
