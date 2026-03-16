import { useState, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { useLocale } from '../context/LocaleContext'
import { variantHasValidColor } from '../api/products'
import type { Product } from '../types'
import styles from './ProductCard.module.css'

interface ProductCardProps {
  product: Product
  onImageError?: (productId: string) => void
  /** Smaller card for similar-products sections */
  compact?: boolean
}

export default function ProductCard({ product, onImageError, compact }: ProductCardProps) {
  const { t } = useLocale()
  const [imageLoaded, setImageLoaded] = useState(false)
  const [imageError, setImageError] = useState(false)

  const handleError = () => {
    setImageError(true)
    onImageError?.(product.id)
  }

  const displayPrice = product.salePrice ?? product.price
  const hasSale = product.onSale && product.salePrice != null

  /** Only show colors for variants with valid SKU-Color (avoid extra/duplicate swatches) */
  const displayColors = useMemo(() => {
    if (!product.variants?.length) return product.colors
    return product.colors.filter((_, i) => variantHasValidColor(product.variants![i]))
  }, [product.colors, product.variants])

  if (imageError) return null

  if (!imageLoaded) {
return (
    <div className={`${styles.card} ${compact ? styles.cardCompact : ''}`} aria-hidden>
        <div className={styles.imageWrap}>
          <div className={styles.imagePlaceholder} />
          <img
            src={product.image}
            alt=""
            className={styles.imageHidden}
            onLoad={() => setImageLoaded(true)}
            onError={handleError}
          />
        </div>
        <div className={styles.body}>
          <div className={styles.skeletonLine} />
          <div className={styles.skeletonLineShort} />
          <div className={styles.skeletonLine} />
        </div>
      </div>
    )
  }

  return (
    <Link to={`/shop/${product.slug}`} className={`${styles.card} ${compact ? styles.cardCompact : ''}`}>
      <div className={styles.imageWrap}>
        <img src={product.image} alt={product.name} className={styles.image} />
        {product.onSale && <span className={styles.saleBadge}>{t('sale')}</span>}
      </div>
      <div className={styles.body}>
        <h3 className={styles.name}>{product.name}</h3>
        <p className={styles.sku}>SKU: {product.sku}</p>
        <div className={styles.colors}>
          {displayColors.map((c, i) => (
            <span
              key={`${c.name}-${i}`}
              className={styles.colorDot}
              style={{ background: c.hex }}
              title={c.name}
            />
          ))}
        </div>
        <p className={styles.sizes}>{t('sizesLabel')}: {product.sizes.join(', ')}</p>
        <div className={styles.priceRow}>
          {hasSale && (
            <span className={styles.priceOriginal}>₼{product.price.toFixed(2)}</span>
          )}
          <span className={hasSale ? styles.priceSale : styles.price}>
            ₼{displayPrice.toFixed(2)}
          </span>
        </div>
      </div>
    </Link>
  )
}
