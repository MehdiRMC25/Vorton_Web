import { useState, useEffect, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useLocale } from '../context/LocaleContext'
import {
  getOrders,
  getOrdersStats,
  type Order,
  type OrderStatsItem,
  type OrderStatus,
} from '../api/orders'
import { DEMO_ORDERS, DEMO_STATS } from '../data/demoOrders'
import { useOrdersSocket } from '../hooks/useOrdersSocket'
import type { UserRole } from '../api/auth'
import styles from './Orders.module.css'

const STATUS_OPTIONS: OrderStatus[] = ['NEW', 'PROCESSING', 'DISPATCHED', 'DELIVERED']

const STATUS_KEYS: Record<OrderStatus, string> = {
  NEW: 'statusNew',
  PROCESSING: 'statusProcessing',
  DISPATCHED: 'statusDispatched',
  DELIVERED: 'statusDelivered',
}

function statusClass(s: OrderStatus): string {
  return styles[`status${s.charAt(0) + s.slice(1).toLowerCase()}`] ?? ''
}

export default function StaffOrders() {
  const { t, locale } = useLocale()
  const { user, token } = useAuth()
  const [orders, setOrders] = useState<Order[]>([])
  const [stats, setStats] = useState<OrderStatsItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [statusFilter, setStatusFilter] = useState<OrderStatus | 'ALL'>('ALL')

  const role: UserRole = (user?.role as UserRole) ?? 'customer'
  const isManager = role === 'manager'

  const fetchOrders = useCallback(async () => {
    if (!token) return
    setError(null)
    try {
      const list = await getOrders(token)
      setOrders(list.length > 0 ? list : DEMO_ORDERS)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load orders')
      setOrders(DEMO_ORDERS)
    } finally {
      setLoading(false)
    }
  }, [token])

  const fetchStats = useCallback(async () => {
    if (!token || !isManager) return
    try {
      const data = await getOrdersStats(token)
      setStats(data.length > 0 ? data : DEMO_STATS)
    } catch {
      setStats(DEMO_STATS)
    }
  }, [token, isManager])

  useEffect(() => {
    setLoading(true)
    fetchOrders()
  }, [fetchOrders])

  useEffect(() => {
    fetchStats()
  }, [fetchStats])

  useOrdersSocket(fetchOrders)

  const filteredOrders =
    statusFilter === 'ALL'
      ? orders
      : orders.filter((o) => o.status === statusFilter)

  const dateFormat = locale === 'az' ? 'az-AZ' : 'en-GB'
  const formatDate = (d: string) => {
    try {
      return new Date(d).toLocaleDateString(dateFormat, {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      })
    } catch {
      return d
    }
  }

  return (
    <>
      <h1 className={styles.title}>{t('allOrders')}</h1>
      <p className={styles.subtitle}>
        View and manage orders. Status updates appear in real time.
        {orders.length > 0 && orders[0].id.startsWith('demo-') && (
          <span style={{ display: 'block', marginTop: 8, color: 'var(--text-muted)', fontSize: '0.9rem' }}>
            Showing demo data. Remove when backend has real orders.
          </span>
        )}
      </p>

      {isManager && stats.length > 0 && (
        <div className={styles.statsRow}>
          {stats.map((s) => (
            <div key={s.status} className={styles.statCard}>
              <div className={styles.statLabel}>{t(STATUS_KEYS[s.status])}</div>
              <div className={styles.statValue}>{s.count}</div>
            </div>
          ))}
        </div>
      )}

      <div className={styles.filterRow}>
        <span className={styles.filterLabel}>{t('orderStatus')}:</span>
        <select
          className={styles.filterSelect}
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as OrderStatus | 'ALL')}
        >
          <option value="ALL">All</option>
          {STATUS_OPTIONS.map((s) => (
            <option key={s} value={s}>
              {t(STATUS_KEYS[s])}
            </option>
          ))}
        </select>
      </div>

      {error && <p className={styles.error}>{error}</p>}
      {loading && <p className={styles.loading}>Loading…</p>}

      {!loading && !error && filteredOrders.length === 0 && (
        <p className={styles.loading}>No orders found.</p>
      )}

      {!loading && filteredOrders.length > 0 && (
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>{t('orderNumber')}</th>
                <th>Customer</th>
                <th>{t('orderStatus')}</th>
                <th>{t('orderColumn')}</th>
                <th>{t('deliveryColumn')}</th>
                <th>{t('orderTotal')}</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {filteredOrders.map((order) => (
                <tr key={order.id}>
                  <td>
                    <strong>{order.order_number}</strong>
                  </td>
                  <td>{order.customer_name}</td>
                  <td>
                    <span className={`${styles.statusBadge} ${statusClass(order.status)}`}>
                      {t(STATUS_KEYS[order.status])}
                    </span>
                  </td>
                  <td>{formatDate(order.order_date)}</td>
                  <td>
                    {order.status === 'DELIVERED' && order.delivery_due_date
                      ? formatDate(order.delivery_due_date)
                      : '—'}
                  </td>
                  <td>{order.total_price.toFixed(2)}</td>
                  <td>
                    <Link to={`/staff/orders/${order.id}`} className={styles.link}>
                      {t('orderDetails')}
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  )
}
