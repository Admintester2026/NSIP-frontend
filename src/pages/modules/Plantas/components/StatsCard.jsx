import styles from "../styles/index";

export default function StatsCard({ title, value, unit, icon, color }) {
  return (
    <div className={styles.statCard}>
      <div className={styles.statIcon} style={{ color }}>{icon}</div>
      <div className={styles.statContent}>
        <span className={styles.statLabel}>{title}</span>
        <div className={styles.statValue}>
          {value} <span className={styles.statUnit}>{unit}</span>
        </div>
      </div>
    </div>
  );
}