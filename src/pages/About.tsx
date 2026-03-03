import { useLocale } from '../context/LocaleContext'
import styles from './About.module.css'

export default function About() {
  const { t } = useLocale()
  return (
    <div className="container">
      <div className={styles.wrap}>
        <h1 className={styles.title}>{t('aboutVorton')}</h1>
        <div className={styles.content}>
          <p className={styles.lead}>
            {t('aboutLead')}
          </p>
          <p>
            {t('aboutP2')}
          </p>
          <p>
            {t('aboutP3')}
          </p>
          <div className={styles.contact}>
            <h2>{t('getInTouch')}</h2>
            <p>{t('questionsFeedback')}</p>
            <p className={styles.email}>hello@vortonfashion.com</p>
          </div>
        </div>
      </div>
    </div>
  )
}
