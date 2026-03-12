import { useState, useCallback, useMemo, useEffect } from 'react'
import { useSearchParams, useLocation } from 'react-router-dom'
import { useProducts } from '../context/ProductsContext'
import { useLocale } from '../context/LocaleContext'
import ProductCard from '../components/ProductCard'
import ScrollSelect from '../components/ScrollSelect'
import type { Product } from '../types'
import styles from './Shop.module.css'

function getUniqueColors(products: Product[]): string[] {
  const set = new Set<string>()
  for (const p of products) {
    for (const c of p.colors) {
      if (c.name?.trim()) set.add(c.name.trim())
    }
  }
  return Array.from(set).sort((a, b) => a.localeCompare(b))
}

function getUniqueSizes(products: Product[]): string[] {
  const set = new Set<string>()
  for (const p of products) {
    for (const s of p.sizes) {
      if (String(s).trim()) set.add(String(s).trim())
    }
  }
  return Array.from(set).sort((a, b) => a.localeCompare(b))
}

function productHasColor(p: Product, color: string): boolean {
  return p.colors.some((c) => c.name.trim().toLowerCase() === color.toLowerCase())
}

function productHasSize(p: Product, size: string): boolean {
  return p.sizes.some((s) => String(s).trim().toLowerCase() === size.toLowerCase())
}

export default function Shop() {
  const { t } = useLocale()
  const location = useLocation()
  const [searchParams, setSearchParams] = useSearchParams()
  const category = (searchParams.get('category') as 'men' | 'women' | null) || null
  const { products, loading, error } = useProducts()
  const [failedImageIds, setFailedImageIds] = useState<Set<string>>(new Set())
  const [selectedColor, setSelectedColor] = useState<string>('')
  const [selectedSize, setSelectedSize] = useState<string>('')

  useEffect(() => {
    const state = location.state as { selectedColor?: string; selectedSize?: string } | null
    if (state?.selectedColor) setSelectedColor(state.selectedColor)
    if (state?.selectedSize) setSelectedSize(state.selectedSize)
  }, [location.state])

  const onImageError = useCallback((productId: string) => {
    setFailedImageIds((prev) => new Set(prev).add(productId))
  }, [])

  const setCategory = useCallback(
    (value: string) => {
      const next = new URLSearchParams(searchParams)
      if (value === 'men' || value === 'women') {
        next.set('category', value)
      } else {
        next.delete('category')
      }
      setSearchParams(next, { replace: true })
    },
    [searchParams, setSearchParams]
  )

  const byCategory = useMemo(() => {
    let list = products.filter((p) => !failedImageIds.has(p.id))
    if (category === 'men' || category === 'women') {
      list = list.filter((p) => p.category === category)
    }
    return list
  }, [products, category, failedImageIds])

  const filterOptions = useMemo(() => ({
    colors: getUniqueColors(byCategory),
    sizes: getUniqueSizes(byCategory),
  }), [byCategory])

  const filtered = useMemo(() => {
    let list = byCategory
    if (selectedColor) {
      list = list.filter((p) => productHasColor(p, selectedColor))
    }
    if (selectedSize) {
      list = list.filter((p) => productHasSize(p, selectedSize))
    }
    return list
  }, [byCategory, selectedColor, selectedSize])

  return (
    <div className={styles.layout}>
      <aside className={styles.sidebar}>
        <div className={styles.sidebarBrand}>
          <span className={styles.sidebarTitle}>Vorton</span>
          <span className={styles.sidebarTagline}>{t('discoverYourStyle')}</span>
        </div>

        <div className={styles.filterBlock}>
          <label className={styles.filterLabel} htmlFor="shop-gender">{t('gender')}</label>
          <select
            id="shop-gender"
            className={styles.select}
            value={category ?? ''}
            onChange={(e) => setCategory(e.target.value)}
          >
            <option value="">{t('all')}</option>
            <option value="men">{t('men')}</option>
            <option value="women">{t('women')}</option>
          </select>
        </div>

        <div className={styles.filterBlock}>
          <ScrollSelect
            id="shop-color"
            label={t('color')}
            value={selectedColor}
            options={filterOptions.colors.map((c) => ({ value: c, label: c }))}
            placeholder={t('allColors')}
            onChange={setSelectedColor}
            disabled={loading}
          />
        </div>

        <div className={styles.filterBlock}>
          <ScrollSelect
            id="shop-size"
            label={t('size')}
            value={selectedSize}
            options={filterOptions.sizes.map((s) => ({ value: s, label: s }))}
            placeholder={t('allSizes')}
            onChange={setSelectedSize}
            disabled={loading}
          />
        </div>
      </aside>

      <div className={styles.main}>
        <div className={styles.header}>
          <h1 className={styles.title}>
            {category === 'men' ? t('mensCollection') : category === 'women' ? t('womensCollection') : t('shop')}
          </h1>
        </div>
        {error && <p style={{ color: 'var(--sale)', marginBottom: 16 }}>{error}</p>}
        {loading ? (
          <p className={styles.empty}>{t('loadingProducts')}</p>
        ) : filtered.length === 0 ? (
          <p className={styles.empty}>{t('noProductsMatch')}</p>
        ) : (
          <div className={styles.grid}>
            {filtered.map((p) => (
              <ProductCard key={p.id} product={p} onImageError={onImageError} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
