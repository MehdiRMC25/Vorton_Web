import { useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { useLocale } from '../context/LocaleContext'
import { useAuth } from '../context/AuthContext'
import { AuthApiError } from '../api/auth'
import styles from './SignIn.module.css'

export default function SignIn() {
  const { t } = useLocale()
  const { login, loading, error, clearError } = useAuth()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const returnTo = searchParams.get('returnTo') || '/account'

  const [emailOrPhone, setEmailOrPhone] = useState('')
  const [password, setPassword] = useState('')
  const [localError, setLocalError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    clearError()
    setLocalError(null)
    try {
      await login(emailOrPhone, password)
      navigate(returnTo, { replace: true })
    } catch (e) {
      if (e instanceof AuthApiError && e.code === 'INVALID_CREDENTIALS') {
        setLocalError(t('invalidCredentialsSignUp'))
        return
      }
      if (e instanceof Error && e.message) {
        setLocalError(e.message)
        return
      }
      setLocalError(t('signInUnavailable'))
    }
  }

  return (
    <div className="container">
      <div className={styles.wrap}>
        <h1 className={styles.title}>{t('signInTitle')}</h1>
        <form className={styles.form} onSubmit={handleSubmit}>
          <label className={styles.label}>
            {t('emailOrPhoneLabel')}
            <input
              type="text"
              inputMode="email"
              autoComplete="username"
              className={styles.input}
              placeholder={t('emailOrPhonePlaceholder')}
              value={emailOrPhone}
              onChange={(e) => setEmailOrPhone(e.target.value)}
              required
            />
          </label>
          <label className={styles.label}>
            {t('passwordLabel')}
            <input
              type="password"
              autoComplete="current-password"
              className={styles.input}
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </label>
          {(localError || error) && (
            <p className={styles.error}>
              {localError || error}
            </p>
          )}
          <button type="submit" className={styles.submit} disabled={loading}>
            {loading ? t('signingIn') : t('signInTitle')}
          </button>
        </form>
        <p className={styles.footer}>
          {t('dontHaveAccount')} <Link to="/signup">{t('createAccount')}</Link>
        </p>
      </div>
    </div>
  )
}
