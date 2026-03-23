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

// Alias para mantener compatibilidad con nombres existentes
export const formatDateOnly = formatDate;
export const formatTimeOnly = formatTime;