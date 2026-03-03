import { Link } from 'react-router-dom'
import { useLocale } from '../context/LocaleContext'
import styles from './SignIn.module.css'

export default function SignIn() {
  const { t } = useLocale()
  return (
    <div className="container">
      <div className={styles.wrap}>
        <h1 className={styles.title}>{t('signInTitle')}</h1>
        <form className={styles.form} onSubmit={(e) => e.preventDefault()}>
          <label className={styles.label}>
            {t('emailLabel')}
            <input type="email" className={styles.input} placeholder="you@example.com" required />
          </label>
          <label className={styles.label}>
            {t('passwordLabel')}
            <input type="password" className={styles.input} placeholder="••••••••" required />
          </label>
          <button type="submit" className={styles.submit}>
            {t('signInTitle')}
          </button>
        </form>
        <p className={styles.footer}>
          {t('dontHaveAccount')} <Link to="/account">{t('createAccount')}</Link>
        </p>
      </div>
    </div>
  )
}
