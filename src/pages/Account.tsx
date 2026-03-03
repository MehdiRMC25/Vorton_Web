import { Link } from 'react-router-dom'
import { useLocale } from '../context/LocaleContext'
import styles from './Account.module.css'

// Mock member data – replace with real auth/API later
const MOCK_MEMBER = {
  membershipNumber: 'VRT-2024-08472',
  memberCode: 'VORTON-X7K9M2',
  memberSince: '2024-01-15',
  credits: 120,
}

export default function Account() {
  const { t, locale, setLocale } = useLocale()

  return (
    <div className="container">
      <div className={styles.wrap}>
        <h1 className={styles.title}>{t('myAccount')}</h1>
        <p className={styles.welcome}>{t('welcome')}</p>

        <section className={styles.card}>
          <h2 className={styles.sectionTitle}>{t('membershipNumber')}</h2>
          <p className={styles.value}>{MOCK_MEMBER.membershipNumber}</p>
        </section>

        <section className={styles.card}>
          <h2 className={styles.sectionTitle}>{t('memberCode')}</h2>
          <p className={styles.value}>{MOCK_MEMBER.memberCode}</p>
        </section>

        <section className={styles.card}>
          <h2 className={styles.sectionTitle}>{t('memberSince')}</h2>
          <p className={styles.value}>{MOCK_MEMBER.memberSince}</p>
        </section>

        <section className={styles.card}>
          <h2 className={styles.sectionTitle}>{t('credits')}</h2>
          <p className={styles.value}>{MOCK_MEMBER.credits}</p>
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
        </section>

        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>{t('profile')}</h2>
          <p className={styles.placeholder}>Name, email, and password can be updated here.</p>
        </section>

        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>{t('orderHistory')}</h2>
          <p className={styles.placeholder}>Your recent orders will appear here.</p>
          <Link to="/shop" className={styles.link}>{t('continueShopping')}</Link>
        </section>

        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>{t('addresses')}</h2>
          <p className={styles.placeholder}>Shipping and billing addresses.</p>
        </section>
      </div>
    </div>
  )
}
