import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useLocale } from '../context/LocaleContext'
import { useAuth } from '../context/AuthContext'
import { AuthApiError } from '../api/auth'
import styles from './SignIn.module.css'

export default function SignUp() {
  const { t } = useLocale()
  const { signup } = useAuth()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [name, setName] = useState('')
  const [mobile, setMobile] = useState('')
  const [email, setEmail] = useState('')
  const [address, setAddress] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setMessage(null)
    if (password && password !== confirmPassword) {
      setMessage({ type: 'error', text: t('passwordMismatch') })
      return
    }
    setLoading(true)
    try {
      await signup({
        name,
        phone: mobile,
        email,
        address,
        password,
        confirmPassword,
      })
      setMessage({ type: 'success', text: t('signUpSuccess') })
      navigate('/account', { replace: true })
    } catch (e) {
      if (e instanceof AuthApiError) {
        if (e.code === 'INVALID_CREDENTIALS') {
          setMessage({ type: 'error', text: t('invalidCredentialsSignUp') })
          return
        }
        if ((e.code === 'CONFLICT' || e.code === 'VALIDATION_ERROR') && e.message) {
          setMessage({ type: 'error', text: e.message })
          return
        }
      }
      if (e instanceof Error && e.message) {
        setMessage({ type: 'error', text: e.message })
        return
      }
      setMessage({ type: 'error', text: t('signUpUnavailable') })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container">
      <div className={styles.wrap}>
        <h1 className={styles.title}>{t('createAccount')}</h1>
        <form className={styles.form} onSubmit={handleSubmit}>
          <label className={styles.label}>
            {t('nameLabel')} *
            <input
              type="text"
              autoComplete="name"
              className={styles.input}
              placeholder={t('nameLabel')}
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </label>
          <label className={styles.label}>
            {t('mobileLabel')} *
            <input
              type="tel"
              autoComplete="tel"
              className={styles.input}
              placeholder="+994..."
              value={mobile}
              onChange={(e) => setMobile(e.target.value)}
              required
            />
          </label>
          <label className={styles.label}>
            {t('emailOptional')}
            <input
              type="email"
              autoComplete="email"
              className={styles.input}
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </label>
          <label className={styles.label}>
            {t('addressOptional')}
            <input
              type="text"
              autoComplete="street-address"
              className={styles.input}
              placeholder=""
              value={address}
              onChange={(e) => setAddress(e.target.value)}
            />
          </label>
          <label className={styles.label}>
            {t('passwordLabel')}
            <input
              type="password"
              autoComplete="new-password"
              className={styles.input}
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </label>
          <label className={styles.label}>
            {t('confirmPasswordLabel')}
            <input
              type="password"
              autoComplete="new-password"
              className={styles.input}
              placeholder="••••••••"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
            />
          </label>
          {message && (
            <p className={message.type === 'error' ? styles.error : styles.success}>
              {message.text}
            </p>
          )}
          <button type="submit" className={styles.submit} disabled={loading}>
            {loading ? t('signingUp') : t('signUpSubmit')}
          </button>
        </form>
        <p className={styles.footer}>
          {t('alreadyHaveAccount')} <Link to="/signin">{t('signIn')}</Link>
        </p>
      </div>
    </div>
  )
}
