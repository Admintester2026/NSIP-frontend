export function formatDateTime(isoString) {
  if (!isoString) return '--/--/---- --:--:--';
  
  // Formato ISO con T (2026-03-19T10:38:05Z)
  if (isoString.includes('T')) {
    const [date, time] = isoString.split('T');
    const cleanTime = time.split('.')[0].slice(0, 8);
    return `${date.replace(/-/g, '/')} ${cleanTime}`;
  }
  
  // Formato SQL (2026-03-19 10:38:05)
  const match = isoString.match(/(\d{4})-(\d{2})-(\d{2}) (\d{2}):(\d{2}):(\d{2})/);
  if (match) {
    return `${match[1]}/${match[2]}/${match[3]} ${match[4]}:${match[5]}:${match[6]}`;
  }
  
  return isoString;
}

/**
 * Formatea solo la fecha (YYYY/MM/DD)
 * @param {string} isoString - Fecha en formato ISO o SQL
 * @returns {string} Fecha formateada como YYYY/MM/DD
 */
export function formatDate(isoString) {
  if (!isoString) return '--/--/----';
  
  // Formato ISO con T
  if (isoString.includes('T')) {
    return isoString.split('T')[0].replace(/-/g, '/');
  }
  
  // Formato SQL
  const match = isoString.match(/(\d{4})-(\d{2})-(\d{2})/);
  if (match) {
    return `${match[1]}/${match[2]}/${match[3]}`;
  }
  
  return '--/--/----';
}

/**
 * Formatea solo la hora (HH:MM:SS)
 * @param {string} isoString - Fecha en formato ISO o SQL
 * @returns {string} Hora formateada como HH:MM:SS
 */
export function formatTime(isoString) {
  if (!isoString) return '--:--:--';
  
  // Formato ISO con T
  if (isoString.includes('T')) {
    return isoString.split('T')[1].split('.')[0].slice(0, 8);
  }
  
  // Formato SQL
  const match = isoString.match(/(\d{2}):(\d{2}):(\d{2})/);
  if (match) {
    return `${match[1]}:${match[2]}:${match[3]}`;
  }
  
  return '--:--:--';
}

/**
 * Convierte una fecha a formato YYYY-MM-DD (formato SQL)
 * @param {string|Date} fecha - Fecha en cualquier formato
 * @returns {string} Fecha en formato YYYY-MM-DD
 */
export function toSQLDate(fecha) {
  if (!fecha) return '';
  
  let año, mes, dia;
  
  if (fecha instanceof Date) {
    año = fecha.getFullYear();
    mes = String(fecha.getMonth() + 1).padStart(2, '0');
    dia = String(fecha.getDate()).padStart(2, '0');
    return `${año}-${mes}-${dia}`;
  }
  
  if (typeof fecha === 'string') {
    // Formato SQL: "2026-03-05 10:30:00"
    const sqlMatch = fecha.match(/(\d{4})-(\d{2})-(\d{2})/);
    if (sqlMatch) {
      return `${sqlMatch[1]}-${sqlMatch[2]}-${sqlMatch[3]}`;
    }
    
    // Formato con barras: "2026/03/05"
    const barMatch = fecha.match(/(\d{4})\/(\d{2})\/(\d{2})/);
    if (barMatch) {
      return `${barMatch[1]}-${barMatch[2]}-${barMatch[3]}`;
    }
  }
  
  return '';
}

/**
 * Convierte una fecha de calendario (input type date) a formato YYYY-MM-DD
 * @param {string} dateInput - Fecha del input type date (YYYY-MM-DD)
 * @returns {string} Misma fecha en formato YYYY-MM-DD
 */
export function parseDateInput(dateInput) {
  if (!dateInput) return '';
  // El input type date ya devuelve YYYY-MM-DD
  return dateInput;
}

/**
 * Formatea una fecha para mostrar en la UI (DD/MM/YYYY)
 * @param {string} sqlDate - Fecha en formato YYYY-MM-DD
 * @returns {string} Fecha formateada como DD/MM/YYYY
 */
export function formatDisplayDate(sqlDate) {
  if (!sqlDate) return '';
  const match = sqlDate.match(/(\d{4})-(\d{2})-(\d{2})/);
  if (match) {
    return `${match[3]}/${match[2]}/${match[1]}`;
  }
  return sqlDate;
}

// Alias para mantener compatibilidad
export const formatDateOnly = formatDate;
export const formatTimeOnly = formatTime;