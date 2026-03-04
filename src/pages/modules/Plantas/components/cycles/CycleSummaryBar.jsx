import styles from '../../styles/IndexCyclesStyles';

export default function CycleSummaryBar({ cyclesData }) {
  if (!cyclesData?.relays) return null;

  const totalCycles = cyclesData.relays.reduce((acc, relay) => 
    acc + relay.cycles.filter(c => c.enabled).length, 0
  );

  const activeRelays = cyclesData.relays.filter(relay => 
    relay.cycles.some(c => c.enabled)
  ).length;

  return (
    <div className={styles.summaryBar}>
      <div className={styles.summaryItem}>
        <span className={styles.summaryLabel}>Total Ciclos Activos</span>
        <span className={styles.summaryValue}>{totalCycles}</span>
      </div>
      <div className={styles.summaryItem}>
        <span className={styles.summaryLabel}>Relés con Ciclos</span>
        <span className={styles.summaryValue}>{activeRelays} / 8</span>
      </div>
      <div className={styles.summaryItem}>
        <span className={styles.summaryLabel}>Última Actualización</span>
        <span className={styles.summaryValue}>
          {new Date().toLocaleTimeString()}
        </span>
      </div>
    </div>
  );
}