import type { Order, OrderStatsItem } from '../api/orders'

/** Demo orders and stats for previewing the staff UI when the API has no data. Remove when backend has real orders. */
export const DEMO_ORDERS: Order[] = [
  {
    id: 'demo-1',
    order_number: 'VORT-2026-001',
    customer_id: 101,
    customer_name: 'Leyla Quliyeva',
    mobile: '+994 50 881 4731',
    membership_level: 'silver',
    address: 'Baku, Azerbaijan',
    items: [
      { name: 'Classic T-Shirt White', quantity: 2, price: 29.99 },
      { name: 'Sport Shorts Navy', quantity: 1, price: 34.99 },
    ],
    total_price: 94.97,
    status: 'NEW',
    order_date: '2026-03-08',
    delivery_due_date: '2026-03-15',
    created_at: '2026-03-08T10:30:00Z',
    updated_at: '2026-03-08T10:30:00Z',
  },
  {
    id: 'demo-2',
    order_number: 'VORT-2026-002',
    customer_id: 102,
    customer_name: 'Rashad Mammadov',
    mobile: '+994 55 123 4567',
    membership_level: 'gold',
    address: 'Sumgait',
    items: [
      { name: 'Hoodie Grey', quantity: 1, price: 59.99 },
    ],
    total_price: 59.99,
    status: 'PROCESSING',
    order_date: '2026-03-07',
    delivery_due_date: '2026-03-14',
    created_at: '2026-03-07T14:00:00Z',
    updated_at: '2026-03-08T09:00:00Z',
  },
  {
    id: 'demo-3',
    order_number: 'VORT-2026-003',
    customer_id: 103,
    customer_name: 'Aynur Huseynova',
    mobile: '+994 70 987 6543',
    membership_level: 'platinum',
    address: null,
    items: [
      { name: 'Joggers Black', quantity: 1, price: 44.99 },
      { name: 'Cap Blue', quantity: 2, price: 14.99 },
    ],
    total_price: 74.97,
    status: 'DISPATCHED',
    order_date: '2026-03-05',
    delivery_due_date: '2026-03-12',
    created_at: '2026-03-05T11:20:00Z',
    updated_at: '2026-03-07T16:45:00Z',
  },
  {
    id: 'demo-4',
    order_number: 'VORT-2026-004',
    customer_id: 104,
    customer_name: 'Elvin Aliyev',
    mobile: '+994 51 555 1234',
    membership_level: 'none',
    address: 'Ganja',
    items: [
      { name: 'Polo Shirt Green', quantity: 3, price: 39.99 },
    ],
    total_price: 119.97,
    status: 'DELIVERED',
    order_date: '2026-03-01',
    delivery_due_date: '2026-03-08',
    created_at: '2026-03-01T09:15:00Z',
    updated_at: '2026-03-06T18:00:00Z',
  },
]

export const DEMO_STATS: OrderStatsItem[] = [
  { status: 'NEW', count: 1 },
  { status: 'PROCESSING', count: 1 },
  { status: 'DISPATCHED', count: 1 },
  { status: 'DELIVERED', count: 1 },
]

export function getDemoOrderById(id: string): Order | undefined {
  if (id.startsWith('demo-')) {
    const found = DEMO_ORDERS.find((o) => o.id === id)
    if (found) {
      return {
        ...found,
        status_history: [
          { status: found.status, created_at: found.created_at },
          ...(found.status !== 'NEW' ? [{ status: 'NEW' as const, created_at: found.created_at }] : []),
        ].sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()),
      }
    }
  }
  return undefined
}
