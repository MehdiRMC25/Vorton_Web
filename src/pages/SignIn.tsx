import { Link } from 'react-router-dom'
import styles from './SignIn.module.css'

export default function SignIn() {
  return (
    <div className="container">
      <div className={styles.wrap}>
        <h1 className={styles.title}>Sign in</h1>
        <form className={styles.form} onSubmit={(e) => e.preventDefault()}>
          <label className={styles.label}>
            Email
            <input type="email" className={styles.input} placeholder="you@example.com" required />
          </label>
          <label className={styles.label}>
            Password
            <input type="password" className={styles.input} placeholder="••••••••" required />
          </label>
          <button type="submit" className={styles.submit}>
            Sign in
          </button>
        </form>
        <p className={styles.footer}>
          Don&apos;t have an account? <Link to="/account">Create account</Link>
        </p>
      </div>
    </div>
  )
}
