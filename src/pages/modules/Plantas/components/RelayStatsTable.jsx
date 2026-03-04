import styles from "../styles/index";

export default function RelayStatsTable({ stats }) {
  if (!stats?.data?.relays) return null;

  return (
    <div className={styles.tableContainer}>
      <h3 className={styles.tableTitle}>Estadísticas por Relé</h3>
      <table className={styles.statsTable}>
        <thead>
          <tr>
            <th>Relé</th>
            <th>Anaquel</th>
            <th>Horas Encendido</th>
            <th>Horas Apagado</th>
            <th>Uso %</th>
            <th>Estado</th>
          </tr>
        </thead>
        <tbody>
          {stats.data.relays.map((relay) => (
            <tr key={relay.id}>
              <td className={styles.relayId}>R{relay.id}</td>
              <td>Anaquel {relay.id}</td>
              <td className={styles.hoursOn}>{relay.hours_on.toFixed(1)} h</td>
              <td className={styles.hoursOff}>{relay.hours_off.toFixed(1)} h</td>
              <td>
                <div className={styles.progressCell}>
                  <div 
                    className={styles.progressBar}
                    style={{ width: `${relay.percent}%` }}
                  />
                  <span>{relay.percent}%</span>
                </div>
              </td>
              <td>
                <span className={`${styles.statusDot} ${relay.percent > 50 ? styles.statusHigh : styles.statusLow}`} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}