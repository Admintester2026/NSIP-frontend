// src/pages/modules/Plantas/components/SearchSection.jsx
import { useState } from 'react';
import { arduinoAPI } from '../../../../api/arduino';
import styles from '../styles/index';

// ==========================================
// FUNCIÓN PARA FORMATEAR FECHA LOCAL (ya viene del backend)
// ==========================================
function formatDateTime(dateString) {
  if (!dateString) return '--/--/---- --:--';
  
  const match = dateString.match(/^(\d{4})-(\d{2})-(\d{2})\s+(\d{2}):(\d{2}):(\d{2})/);
  
  if (match) {
    const año = match[1];
    const mes = match[2];
    const dia = match[3];
    const horas = match[4];
    const minutos = match[5];
    const segundos = match[6];
    return `${año}/${mes}/${dia} ${horas}:${minutos}:${segundos}`;
  }
  
  try {
    const fecha = new Date(dateString);
    const año = fecha.getFullYear();
    const mes = (fecha.getMonth() + 1).toString().padStart(2, '0');
    const dia = fecha.getDate().toString().padStart(2, '0');
    const horas = fecha.getHours().toString().padStart(2, '0');
    const minutos = fecha.getMinutes().toString().padStart(2, '0');
    const segundos = fecha.getSeconds().toString().padStart(2, '0');
    return `${año}/${mes}/${dia} ${horas}:${minutos}:${segundos}`;
  } catch {
    return dateString;
  }
}

// ==========================================
// FUNCIÓN PARA CONVERTIR BÚSQUEDA AMIGABLE A FORMATO SQL
// ==========================================
function convertirBusquedaAFechaSQL(termino) {
  if (!termino || termino.trim() === '') return termino;
  
  let busqueda = termino.trim();
  
  // Detectar formato dd/mm/yyyy (ej: 10/04/2026)
  let match = busqueda.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (match) {
    const dia = match[1].padStart(2, '0');
    const mes = match[2].padStart(2, '0');
    const año = match[3];
    return `${año}-${mes}-${dia}`;
  }
  
  // Detectar formato dd/mm (ej: 10/04) - asume año actual
  match = busqueda.match(/^(\d{1,2})\/(\d{1,2})$/);
  if (match) {
    const dia = match[1].padStart(2, '0');
    const mes = match[2].padStart(2, '0');
    const año = new Date().getFullYear();
    return `${año}-${mes}-${dia}`;
  }
  
  // Detectar formato dd/mm/yy (ej: 10/04/26) - convierte 26 a 2026
  match = busqueda.match(/^(\d{1,2})\/(\d{1,2})\/(\d{2})$/);
  if (match) {
    const dia = match[1].padStart(2, '0');
    const mes = match[2].padStart(2, '0');
    let año = parseInt(match[3]);
    año = año < 50 ? 2000 + año : 1900 + año;
    return `${año}-${mes}-${dia}`;
  }
  
  // Si no coincide con ningún formato, devolver el término original
  return busqueda;
}

// ==========================================
// FUNCIÓN PARA VALIDAR SI ES UNA FECHA
// ==========================================
function esFormatoFecha(termino) {
  return /^(\d{1,2})\/(\d{1,2})(\/(\d{2,4}))?$/.test(termino.trim());
}

export default function SearchSection() {
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searchPerformed, setSearchPerformed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [originalTerm, setOriginalTerm] = useState('');

  const handleSearch = async () => {
    if (!searchTerm.trim()) {
      setSearchResults([]);
      setSearchPerformed(false);
      return;
    }

    setLoading(true);
    // Guardar el término original para mostrarlo
    setOriginalTerm(searchTerm);
    
    // Convertir la búsqueda a formato SQL si es una fecha
    let terminoParaBuscar = searchTerm;
    if (esFormatoFecha(searchTerm)) {
      terminoParaBuscar = convertirBusquedaAFechaSQL(searchTerm);
      console.log(`🔍 Conversión: "${searchTerm}" → "${terminoParaBuscar}"`);
    }
    
    try {
      const results = await arduinoAPI.buscarRegistros(terminoParaBuscar);
      setSearchResults(results);
      setSearchPerformed(true);
    } catch (error) {
      console.error('Error en búsqueda:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  const clearSearch = () => {
    setSearchTerm('');
    setSearchResults([]);
    setSearchPerformed(false);
    setOriginalTerm('');
  };

  // Mostrar ejemplos según lo que el usuario está escribiendo
  const getPlaceholder = () => {
    if (searchTerm && searchTerm.includes('/')) {
      return "Ej: 10/04/2026, 10/04, o 10/04/26";
    }
    return "Buscar por fecha (ej: 10/04/2026) o por año (2026)...";
  };

  return (
    <div className={styles.searchSection}>
      <h3 className={styles.sectionTitle}>
        <span className={styles.sectionIcon}>🔍</span>
        Buscar Registros Específicos
      </h3>
      
      <div className={styles.searchContainer}>
        <input
          type="text"
          className={styles.searchInput}
          placeholder={getPlaceholder()}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          onKeyPress={handleKeyPress}
        />
        <button 
          className={styles.searchButton} 
          onClick={handleSearch}
          disabled={loading}
        >
          {loading ? 'Buscando...' : 'Buscar'}
        </button>
        {searchPerformed && (
          <button className={styles.clearButton} onClick={clearSearch}>
            Limpiar
          </button>
        )}
      </div>

      {searchPerformed && (
        <div className={styles.searchResults}>
          <div className={styles.searchResultsHeader}>
            <span className={styles.searchResultsCount}>
              {searchResults.length} resultados encontrados
              {originalTerm && originalTerm !== searchTerm && (
                <span className={styles.convertedHint}>
                  {" "}(buscaste "{originalTerm}" → convertido a "{convertirBusquedaAFechaSQL(originalTerm)}")
                </span>
              )}
            </span>
          </div>
          
          {searchResults.length > 0 ? (
            <div className={styles.searchResultsTable}>
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
                    <th>Luz</th>
                  </tr>
                </thead>
                <tbody>
                  {searchResults.map((row, idx) => (
                    <tr key={idx}>
                      <td>{formatDateTime(row.FECHA)}</td>
                      <td className={row.RELE0 === 'ON' ? styles.relayOn : styles.relayOff}>{row.RELE0 || 'OFF'}</td>
                      <td className={row.RELE1 === 'ON' ? styles.relayOn : styles.relayOff}>{row.RELE1 || 'OFF'}</td>
                      <td className={row.RELE2 === 'ON' ? styles.relayOn : styles.relayOff}>{row.RELE2 || 'OFF'}</td>
                      <td className={row.RELE3 === 'ON' ? styles.relayOn : styles.relayOff}>{row.RELE3 || 'OFF'}</td>
                      <td className={row.RELE4 === 'ON' ? styles.relayOn : styles.relayOff}>{row.RELE4 || 'OFF'}</td>
                      <td className={row.RELE5 === 'ON' ? styles.relayOn : styles.relayOff}>{row.RELE5 || 'OFF'}</td>
                      <td className={row.RELE6 === 'ON' ? styles.relayOn : styles.relayOff}>{row.RELE6 || 'OFF'}</td>
                      <td className={row.RELE7 === 'ON' ? styles.relayOn : styles.relayOff}>{row.RELE7 || 'OFF'}</td>
                      <td className={styles.luxValue}>{row.LUZ ? row.LUZ.toFixed(1) : '--'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className={styles.noResults}>
              No se encontraron registros para "{originalTerm}"
            </div>
          )}
        </div>
      )}
    </div>
  );
}