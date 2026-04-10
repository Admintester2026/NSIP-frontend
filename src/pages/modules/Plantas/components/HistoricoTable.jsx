// src/pages/modules/Plantas/components/HistoricoTable.jsx
import styles from "../styles/index";

function formatDateTimeLocal(isoString) {
  if (!isoString) return '--/--/---- --:--';
  try {
    const fecha = new Date(isoString);
    const año = fecha.getFullYear();
    const mes = (fecha.getMonth() + 1).toString().padStart(2, '0');
    const dia = fecha.getDate().toString().padStart(2, '0');
    const horas = fecha.getHours().toString().padStart(2, '0');
    const minutos = fecha.getMinutes().toString().padStart(2, '0');
    const segundos = fecha.getSeconds().toString().padStart(2, '0');
    return `${año}/${mes}/${dia} ${horas}:${minutos}:${segundos}`;
  } catch {
    return '--/--/---- --:--';
  }
}

export default function HistoricoTable({ historico, limit = 20 }) {
  if (!historico || !Array.isArray(historico) || historico.length === 0) {
    return (
      <div className={styles.emptyState}>
        <span className={styles.emptyIcon}>📭</span>
        <p>No hay datos históricos disponibles</p>
      </div>
    );
  }

  // Mostrar los últimos 'limit' registros (los más recientes primero)
  const mostrarRegistros = historico.slice(0, limit);

  return (
    <div className={styles.tableContainer}>
      <h3 className={styles.tableTitle}>Últimos {limit} Registros</h3>
      <div className={styles.historicoTable}>
        <table className={styles.dataTable}>
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
            {mostrarRegistros.map((row, idx) => (
              <tr key={idx}>
                <td className={styles.fechaCell}>{formatDateTimeLocal(row.FECHA)}</td>
                <td className={row.RELE0 === 'ON' ? styles.relayOn : styles.relayOff}>
                  {row.RELE0 || 'OFF'}
                </td>
                <td className={row.RELE1 === 'ON' ? styles.relayOn : styles.relayOff}>
                  {row.RELE1 || 'OFF'}
                </td>
                <td className={row.RELE2 === 'ON' ? styles.relayOn : styles.relayOff}>
                  {row.RELE2 || 'OFF'}
                </td>
                <td className={row.RELE3 === 'ON' ? styles.relayOn : styles.relayOff}>
                  {row.RELE3 || 'OFF'}
                </td>
                <td className={row.RELE4 === 'ON' ? styles.relayOn : styles.relayOff}>
                  {row.RELE4 || 'OFF'}
                </td>
                <td className={row.RELE5 === 'ON' ? styles.relayOn : styles.relayOff}>
                  {row.RELE5 || 'OFF'}
                </td>
                <td className={row.RELE6 === 'ON' ? styles.relayOn : styles.relayOff}>
                  {row.RELE6 || 'OFF'}
                </td>
                <td className={row.RELE7 === 'ON' ? styles.relayOn : styles.relayOff}>
                  {row.RELE7 || 'OFF'}
                </td>
                <td className={styles.luxValue}>
                  {row.LUZ ? row.LUZ.toFixed(1) : '--'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {historico.length > limit && (
        <div className={styles.tableFooter}>
          Mostrando {limit} de {historico.length} registros
        </div>
      )}
    </div>
  );
}