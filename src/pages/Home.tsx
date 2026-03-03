import { useState, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { useProducts } from '../context/ProductsContext'
import { articles } from '../data'
import ProductCard from '../components/ProductCard'
import styles from './Home.module.css'
import vortonLogo from '../../Assets_2/Vorton_Logo.png'

export default function Home() {
  const { products, loading, error } = useProducts()
  const [failedImageIds, setFailedImageIds] = useState<Set<string>>(new Set())

  const onImageError = useCallback((productId: string) => {
    setFailedImageIds((prev) => new Set(prev).add(productId))
  }, [])

  const newCollectionProducts = products.filter((p) => p.isNew && !failedImageIds.has(p.id))
  const onSaleProducts = products.filter((p) => p.onSale && !failedImageIds.has(p.id))

  return (
    <>
      <section className={styles.hero}>
        <div className={styles.heroOverlay} />
        <div className={styles.heroContent}>
          <h1 className={styles.heroTitle}>Vorton</h1>
          <p className={styles.heroTagline}>Discover Your Style</p>
        </div>
        <div className={styles.heroLogo}>
          <img src={vortonLogo} alt="Vorton" className={styles.heroLogoImg} />
        </div>
      </section>

      {error && (
        <div className="container" style={{ paddingTop: 24 }}>
          <p style={{ color: 'var(--sale)' }}>{error}</p>
        </div>
      )}

      <section className={styles.section}>
        <div className="container">
          <h2 className="section-title">New collection</h2>
          {loading ? (
            <p className={styles.empty}>Loading…</p>
          ) : newCollectionProducts.length > 0 ? (
            <div className={styles.productGrid}>
              {newCollectionProducts.slice(0, 4).map((p) => (
                <ProductCard key={p.id} product={p} onImageError={onImageError} />
              ))}
            </div>
          ) : (
            <p className={styles.empty}>No products yet.</p>
          )}
        </div>
      </section>

      <section className={styles.section}>
        <div className="container">
          <h2 className="section-title">On Sale</h2>
          {loading ? (
            <p className={styles.empty}>Loading…</p>
          ) : onSaleProducts.length > 0 ? (
            <div className={styles.productGrid}>
              {onSaleProducts.slice(0, 4).map((p) => (
                <ProductCard key={p.id} product={p} onImageError={onImageError} />
              ))}
            </div>
          ) : (
            <p className={styles.empty}>No items on sale right now.</p>
          )}
        </div>
      </section>

      <section className={styles.vortonLine}>
        <div className={styles.vortonLineInner}>
          <span>Vorton</span>
          <span className={styles.sep}>—</span>
          <span>Vorton</span>
          <span className={styles.sep}>—</span>
          <span>Vorton</span>
          <span className={styles.sep}>—</span>
          <span>Vorton</span>
          <span className={styles.sep}>—</span>
          <span>Vorton</span>
        </div>
      </section>

      <section className={styles.section}>
        <div className="container">
          <h2 className="section-title">Media</h2>
          <div className={styles.videoGrid}>
            <div className={styles.videoCard}>
              <video
                className={styles.video}
                src="https://www.w3schools.com/html/mov_bbb.mp4"
                controls
                muted
                loop
                playsInline
                poster="https://www.w3schools.com/html/pic_trulli.jpg"
              >
                Your browser does not support the video tag.
              </video>
            </div>
            <div className={styles.videoCard}>
              <video
                className={styles.video}
                src="https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4"
                controls
                muted
                loop
                playsInline
              >
                Your browser does not support the video tag.
              </video>
            </div>
          </div>
        </div>
      </section>

      <section className={styles.section}>
        <div className="container">
          <h2 className="section-title">Articles</h2>
          <div className={styles.articleGrid}>
            {articles.map((a) => (
              <a href="#" key={a.id} className={styles.articleCard}>
                <div className={styles.articleImage}>
                  <img src={a.image} alt={a.title} />
                </div>
                <div className={styles.articleBody}>
                  <h3 className={styles.articleTitle}>{a.title}</h3>
                  <p className={styles.articleExcerpt}>{a.excerpt}</p>
                  <span className={styles.articleDate}>{a.date}</span>
                </div>
              </a>
            ))}
          </div>
        </div>
      </section>
    </>
  )
}
