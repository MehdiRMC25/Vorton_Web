import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Layout from './components/Layout'
import Home from './pages/Home'
import Shop from './pages/Shop'
import ProductDetail from './pages/ProductDetail'
import Cart from './pages/Cart'
import About from './pages/About'
import SignIn from './pages/SignIn'
import Account from './pages/Account'
import Contact from './pages/Contact'
import { CartProvider } from './context/CartContext'
import { ProductsProvider } from './context/ProductsContext'
import { LocaleProvider } from './context/LocaleContext'

function App() {
  return (
    <LocaleProvider>
    <ProductsProvider>
      <CartProvider>
        <BrowserRouter>
        <Layout>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/shop" element={<Shop />} />
            <Route path="/shop/:slug" element={<ProductDetail />} />
            <Route path="/cart" element={<Cart />} />
            <Route path="/about" element={<About />} />
            <Route path="/signin" element={<SignIn />} />
            <Route path="/account" element={<Account />} />
            <Route path="/contact" element={<Contact />} />
          </Routes>
        </Layout>
      </BrowserRouter>
    </CartProvider>
    </ProductsProvider>
    </LocaleProvider>
  )
}

export default App
