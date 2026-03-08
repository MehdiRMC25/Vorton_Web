# Frontend prompt: Order Operations & Tracking Dashboard

Use this prompt in your **frontend** project (or with Cursor on the frontend codebase) to build a dashboard that connects to the existing payment/orders backend.

---

## Copy-paste prompt for Cursor / frontend

Build an **Order Operations and Tracking** dashboard that connects to our existing backend.

### Backend base URL
- **API base:** `VITE_API_URL` or `NEXT_PUBLIC_API_URL` (or similar) — e.g. `http://localhost:3000/api/v1` in development. The backend runs on a configurable port (default 3000).
- **Same origin for Socket.io:** The backend serves both REST and Socket.io on the **same port**. So if the API is `http://localhost:3000`, the Socket.io client should connect to `http://localhost:3000` (no separate path).

### Authentication
- **Login:** `POST {API_BASE}/auth/login`  
  Body: `{ "email" or "phone" or "mobile": "<value>", "password": "<value>" }`  
  Response: `{ "user": { id, role, first_name, last_name, email, phone, ... }, "token": "<jwt>" }`
- **Signup:** `POST {API_BASE}/auth/signup`  
  Body: signup fields as required by backend.  
  Response: `{ "user", "token" }` (same shape).
- **Current user:** `GET {API_BASE}/auth/me`  
  Header: `Authorization: Bearer <token>`  
  Response: `{ "user": { id, role, ... } }`
- **Send JWT on all order API calls:** `Authorization: Bearer <token>`
- **Roles:** `customer` | `employee` | `manager` (from `user.role`).

### Order API (all under `{API_BASE}/orders`)

| Method | Path | Who | Description |
|--------|------|-----|-------------|
| GET | `/orders` | employee, manager | List all orders. Response: `{ "orders": [ ... ] }` |
| GET | `/orders/stats` | manager | Status counts. Response: `{ "stats": [ { "status", "count" } ] }` |
| GET | `/orders/customer/:customerId` | customer (own id), employee, manager | Orders for that customer. Response: `{ "orders": [ ... ] }` |
| GET | `/orders/:id` | customer (own only), employee, manager | Single order full details (includes `status_history`). |
| POST | `/orders` | no auth | Create order (checkout). See body below. |
| PATCH | `/orders/:id/status` | employee, manager | Update status. Body: `{ "status": "PROCESSING" \| "DISPATCHED" \| "DELIVERED" }` |

**Order object shape (from API):**
```json
{
  "id": "uuid",
  "order_number": "string",
  "customer_id": number,
  "customer_name": "string",
  "mobile": "string",
  "membership_level": "silver|gold|platinum|none",
  "address": "string | null",
  "items": [ { "name", "quantity", "price", "product_id?", ... } ],
  "total_price": number,
  "status": "NEW|PROCESSING|DISPATCHED|DELIVERED",
  "order_date": "date",
  "delivery_due_date": "date | null",
  "created_at": "datetime",
  "updated_at": "datetime",
  "status_history": [ { "status", "created_at" } ]  // only on GET /orders/:id
}
```

**POST /orders body (create order at checkout):**
```json
{
  "customer_id": number,
  "customer_name": "string",
  "mobile": "string",
  "membership_level": "string (default: none)",
  "address": "string | null",
  "items": [ { "name": "string", "quantity": number, "price": number } ],
  "total_price": number,
  "delivery_due_date": "string | null (YYYY-MM-DD)"
}
```
Required: `customer_id`, `customer_name`, `mobile`, `total_price` (non-negative). `items` is an array (can be empty).

### Real-time (Socket.io)
- **Connect:** Same origin as the API, e.g. `io(API_ORIGIN)` where `API_ORIGIN` is `http://localhost:3000` (no `/api/v1`).
- **Events to listen for:**
  - `order_created` — payload: full order object (new order).
  - `order_status_updated` — payload: full order object (status changed).
- When these fire, update the dashboard list/detail view (e.g. refetch list, or merge the payload into local state) so employees and managers see live updates.

### Access control (UI)
- **Customer:** Only show “My orders”. Use `GET /orders/customer/{user.id}`. Can open single order only for their own orders. No “All orders” or “Stats” or status change controls.
- **Employee:** Show “All orders”, can open any order, can change status (PROCESSING → DISPATCHED → DELIVERED). No “Stats” section.
- **Manager:** Show “All orders”, stats (counts by status), and status change controls like employee.

### What to build
1. **Login / signup** (or reuse existing auth) and store JWT; send `Authorization: Bearer <token>` on every order request.
2. **Role-based layout:** After login, show different nav/views by `user.role` (customer vs employee vs manager).
3. **Customer view:** “My orders” list + order detail; optional simple “Track order” by order number or link from email.
4. **Employee / Manager view:** Full orders list (table or cards), filters by status, single-order detail, and status dropdown/buttons (PROCESSING, DISPATCHED, DELIVERED). Manager: add a stats section (e.g. counts per status).
5. **Real-time:** Connect Socket.io to the same backend origin; on `order_created` and `order_status_updated`, refresh or merge data so the list and open order update without reload.

### Environment
- Frontend needs at least:
  - `API_BASE` or `VITE_API_URL` / `NEXT_PUBLIC_API_URL` = `http://localhost:3000/api/v1`
  - `API_ORIGIN` or same for Socket.io = `http://localhost:3000`
- Backend CORS already allows configured origins (e.g. localhost); ensure the frontend origin is included in the backend’s `CORS_ORIGINS` env.

---

*Backend repo: payment_backend (Node.js + Express + PostgreSQL + JWT + Socket.io). Orders and auth are implemented; this prompt describes how to consume them from the frontend.*
