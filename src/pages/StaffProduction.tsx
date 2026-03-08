import styles from './Orders.module.css'

export default function StaffProduction() {
  return (
    <>
      <h1 className={styles.title}>Production</h1>
      <p className={styles.subtitle}>
        Production and fulfilment. This section can be extended with workflows, tasks, or integrations.
      </p>
      <p style={{ color: 'var(--text-secondary)' }}>
        Coming soon.
      </p>
    </>
  )
}
