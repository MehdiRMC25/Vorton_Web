import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useLocale } from '../context/LocaleContext'
import { getOrdersStats } from '../api/orders'
import { useState, useEffect } from 'react'
import type { OrderStatsItem, OrderStatus } from '../api/orders'
import type { UserRole } from '../api/auth'
import styles from './Orders.module.css'

const STATUS_KEYS: Record<OrderStatus, string> = {
  NEW: 'statusNew',
  PROCESSING: 'statusProcessing',
  DISPATCHED: 'statusDispatched',
  DELIVERED: 'statusDelivered',
}

export default function StaffDashboard() {
  const { t } = useLocale()
  const { user, token } = useAuth()
  const [stats, setStats] = useState<OrderStatsItem[]>([])
  const role: UserRole = (user?.role as UserRole) ?? 'customer'
  const isManager = role === 'manager'

  useEffect(() => {
    if (!token || !isManager) return
    getOrdersStats(token)
      .then(setStats)
      .catch(() => setStats([]))
  }, [token, isManager])

  return (
    <>
      <h1 className={styles.title}>Dashboard</h1>
      <p className={styles.subtitle}>
        Internal operations. Use the nav to open Orders or Production.
      </p>

      {isManager && stats.length > 0 && (
        <div className={styles.statsRow} style={{ marginBottom: 24 }}>
          {stats.map((s) => (
            <div key={s.status} className={styles.statCard}>
              <div className={styles.statLabel}>{t(STATUS_KEYS[s.status])}</div>
              <div className={styles.statValue}>{s.count}</div>
            </div>
          ))}
        </div>
      )}

      <p>
        <Link to="/staff/orders" className={styles.link}>
          → Open Orders
        </Link>
        {' · '}
        <Link to="/staff/production" className={styles.link}>
          → Production
        </Link>
      </p>
    </>
  )
}
