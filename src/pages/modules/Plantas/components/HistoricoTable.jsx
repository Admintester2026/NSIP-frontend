// src/pages/modules/Plantas/components/HistoricoTable.jsx
import styles from "../styles/index";

// Función para validar fecha
function esFechaValida(fechaStr) {
  if (!fechaStr) return false;
  
  // Detectar fechas inválidas como 2000-00-00
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

function formatDateTime(isoString) {
  if (!isoString) return '--/--/---- --:--';
  if (!esFechaValida(isoString)) return '--/--/---- --:--';
  
  try {
    const fecha = new Date(isoString);
    if (isNaN(fecha.getTime())) return '--/--/---- --:--';
    
    const año = fecha.getUTCFullYear();
    const mes = (fecha.getUTCMonth() + 1).toString().padStart(2, '0');
    const dia = fecha.getUTCDate().toString().padStart(2, '0');
    const horas = fecha.getUTCHours().toString().padStart(2, '0');
    const minutos = fecha.getUTCMinutes().toString().padStart(2, '0');
    const segundos = fecha.getUTCSeconds().toString().padStart(2, '0');
    return `${año}/${mes}/${dia} ${horas}:${minutos}:${segundos}`;
  } catch {
    return '--/--/---- --:--';
  }
}

function isValidLuz(value) {
  return value !== undefined && value !== null && !isNaN(value) && isFinite(value);
}

export default function HistoricoTable({ historico, limit = 20 }) {
  // Validar que historico existe y es un array
  const datosValidos = Array.isArray(historico) ? historico : [];
  
  if (datosValidos.length === 0) {
    return (
      <div className={styles.emptyState}>
        <span className={styles.emptyIcon}>📭</span>
        <p>No hay datos históricos disponibles</p>
        <p className={styles.emptyHint}>Esperando la primera sincronización de datos...</p>
      </div>
    );
  }

  // Filtrar registros con fechas válidas
  const registrosValidos = datosValidos.filter(row => {
    if (!row?.FECHA) return false;
    return esFechaValida(row.FECHA);
  });

  if (registrosValidos.length === 0) {
    return (
      <div className={styles.emptyState}>
        <span className={styles.emptyIcon}>⚠️</span>
        <p>No hay registros con fechas válidas</p>
        <p className={styles.emptyHint}>Los datos pueden tener fechas corruptas. Esperando sincronización...</p>
      </div>
    );
  }

  // Tomar los últimos 'limit' registros
  const mostrarRegistros = registrosValidos.slice(0, limit);

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
                <td className={styles.fechaCell}>{formatDateTime(row.FECHA)}</td>
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
                  {isValidLuz(row.LUZ) ? row.LUZ.toFixed(1) : '--'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {registrosValidos.length > limit && (
        <div className={styles.tableFooter}>
          Mostrando {limit} de {registrosValidos.length} registros
        </div>
      )}
    </div>
  );
}