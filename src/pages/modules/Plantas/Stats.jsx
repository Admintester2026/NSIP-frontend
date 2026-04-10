import styles from "../styles/index";

const ZONA_HORARIA = -6;
const MS_POR_HORA = 60 * 60 * 1000;

function convertirUtcALocal(utcDateString) {
  const fechaUTC = new Date(utcDateString);
  return new Date(fechaUTC.getTime() + (ZONA_HORARIA * MS_POR_HORA));
}

function esFechaValida(fechaStr) {
  if (!fechaStr) return false;
  
  const match = fechaStr.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (match) {
    const mes = parseInt(match[2]);
    const dia = parseInt(match[3]);
    if (mes === 0 || dia === 0) return false;
  }
  
  try {
    const fecha = new Date(fechaStr);
    return !isNaN(fecha.getTime());
  } catch {
    return false;
  }
}

function formatDateTimeLocal(isoString) {
  if (!isoString) return '--/--/---- --:--';
  if (!esFechaValida(isoString)) return '--/--/---- --:--';
  
  try {
    const fecha = convertirUtcALocal(isoString);
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

  const mostrarRegistros = historico.slice(0, limit);

  return (
    <div className={styles.tableContainer}>
      <h3 className={styles.tableTitle}>Últimos {limit} Registros</h3>
      <div className={styles.historicoTable}>
        <table className={styles.dataTable}>
          <thead>
            <tr>
              <th>Fecha/Hora (Local)</th>
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
    </div>
  );
}