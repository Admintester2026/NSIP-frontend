import styles from "../styles/index";

function formatDateTime(isoString) {
  if (!isoString) return '--/--/---- --:--';
  const fecha = new Date(isoString);
  const año = fecha.getUTCFullYear();
  const mes = (fecha.getUTCMonth() + 1).toString().padStart(2, '0');
  const dia = fecha.getUTCDate().toString().padStart(2, '0');
  const horas = fecha.getUTCHours().toString().padStart(2, '0');
  const minutos = fecha.getUTCMinutes().toString().padStart(2, '0');
  const segundos = fecha.getUTCSeconds().toString().padStart(2, '0');
  return `${año}/${mes}/${dia} ${horas}:${minutos}:${segundos}`;
}

export default function HistoricoTable({ historico, limit = 20 }) {
  if (!historico || historico.length === 0) {
    return (
      <div className={styles.emptyState}>
        <span className={styles.emptyIcon}>📭</span>
        <p>No hay datos históricos disponibles</p>
      </div>
    );
  }

  return (
    <div className={styles.tableContainer}>
      <h3 className={styles.tableTitle}>Últimos {limit} Registros</h3>
      <div className={styles.historicoTable}>
        <table>
          <thead>
            <tr>
              <th>Fecha/Hora</th>
              <th>R1</th>
              <th>R2</th>
              <th>R3</th>
              <th>R4</th>
              <th>R5</th>
              <th>R6</th>
              <th>R7</th>
              <th>R8</th>
              <th>Luz (lux)</th>
            </tr>
          </thead>
          <tbody>
            {historico.slice(0, limit).map((row, idx) => (
              <tr key={idx}>
                <td>{formatDateTime(row.FECHA)}</td>
                <td className={row.RELE0 === 'ON' ? styles.relayOn : styles.relayOff}>
                  {row.RELE0}
                </td>
                <td className={row.RELE1 === 'ON' ? styles.relayOn : styles.relayOff}>
                  {row.RELE1}
                </td>
                <td className={row.RELE2 === 'ON' ? styles.relayOn : styles.relayOff}>
                  {row.RELE2}
                </td>
                <td className={row.RELE3 === 'ON' ? styles.relayOn : styles.relayOff}>
                  {row.RELE3}
                </td>
                <td className={row.RELE4 === 'ON' ? styles.relayOn : styles.relayOff}>
                  {row.RELE4}
                </td>
                <td className={row.RELE5 === 'ON' ? styles.relayOn : styles.relayOff}>
                  {row.RELE5}
                </td>
                <td className={row.RELE6 === 'ON' ? styles.relayOn : styles.relayOff}>
                  {row.RELE6}
                </td>
                <td className={row.RELE7 === 'ON' ? styles.relayOn : styles.relayOff}>
                  {row.RELE7}
                </td>
                <td className={styles.luxValue}>{row.LUZ?.toFixed(1)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}