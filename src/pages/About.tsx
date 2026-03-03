import styles from './About.module.css'

export default function About() {
  return (
    <div className="container">
      <div className={styles.wrap}>
        <h1 className={styles.title}>About Vorton</h1>
        <div className={styles.content}>
          <p className={styles.lead}>
            We believe in quality, style, and comfort. Vorton brings you curated
            collection for every occasion.
          </p>
          <p>
            From everyday essentials to statement pieces, our designs blend modern aesthetics
            with timeless appeal. We focus on durable materials and thoughtful construction
            so your wardrobe works as hard as you do.
          </p>
          <p>
            Whether you're browsing our new collection or hunting for discounted favorites,
            we're here to help you discover your style.
          </p>
          <div className={styles.contact}>
            <h2>Get in touch</h2>
            <p>Questions or feedback? We'd love to hear from you.</p>
            <p className={styles.email}>hello@vortonfashion.com</p>
          </div>
        </div>
      </div>
    </div>
  )
}
