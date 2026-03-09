import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import Layout from './components/Layout'
import StaffLayout from './components/StaffLayout'
import StaffProtectedRoute from './components/StaffProtectedRoute'
import Home from './pages/Home'
import Shop from './pages/Shop'
import ProductDetail from './pages/ProductDetail'
import Cart from './pages/Cart'
import Checkout from './pages/Checkout'
import PaymentDone from './pages/PaymentDone'
import About from './pages/About'
import SignIn from './pages/SignIn'
import SignUp from './pages/SignUp'
import Account from './pages/Account'
import Orders from './pages/Orders'
import OrderDetail from './pages/OrderDetail'
import Contact from './pages/Contact'
import StaffLogin from './pages/StaffLogin'
import StaffDashboard from './pages/StaffDashboard'
import StaffOrders from './pages/StaffOrders'
import StaffOrderDetail from './pages/StaffOrderDetail'
import StaffProduction from './pages/StaffProduction'
import StaffSales from './pages/StaffSales'
import { CartProvider } from './context/CartContext'
import { ProductsProvider } from './context/ProductsContext'
import { LocaleProvider } from './context/LocaleContext'
import { AuthProvider } from './context/AuthContext'
import ProtectedRoute from './components/ProtectedRoute'

function App() {
  return (
    <AuthProvider>
      <LocaleProvider>
        <ProductsProvider>
          <CartProvider>
            <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
              <Routes>
                <Route path="staff">
                  <Route path="login" element={<StaffLogin />} />
                  <Route element={<StaffProtectedRoute />}>
                    <Route index element={<Navigate to="/staff/dashboard" replace />} />
                    <Route element={<StaffLayout />}>
                      <Route path="dashboard" element={<StaffDashboard />} />
                      <Route path="orders" element={<StaffOrders />} />
                      <Route path="orders/:id" element={<StaffOrderDetail />} />
                      <Route path="sales" element={<StaffSales />} />
                      <Route path="production" element={<StaffProduction />} />
                    </Route>
                  </Route>
                </Route>
                <Route path="*" element={<Layout />}>
                  <Route index element={<Home />} />
                  <Route path="shop" element={<Shop />} />
                  <Route path="shop/:slug" element={<ProductDetail />} />
                  <Route path="cart" element={<Cart />} />
                  <Route path="checkout" element={<Checkout />} />
                  <Route path="payment/done" element={<PaymentDone />} />
                  <Route path="about" element={<About />} />
                  <Route path="signin" element={<SignIn />} />
                  <Route path="signup" element={<SignUp />} />
                  <Route path="account" element={<ProtectedRoute><Account /></ProtectedRoute>} />
                  <Route path="orders" element={<ProtectedRoute><Orders /></ProtectedRoute>} />
                  <Route path="orders/:id" element={<ProtectedRoute><OrderDetail /></ProtectedRoute>} />
                  <Route path="contact" element={<Contact />} />
                </Route>
              </Routes>
            </BrowserRouter>
          </CartProvider>
        </ProductsProvider>
      </LocaleProvider>
    </AuthProvider>
  )
}

export default App
