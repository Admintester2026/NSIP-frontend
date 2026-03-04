import { useState } from 'react';
import { arduinoAPI } from '../../../../api/arduino';
import styles from '../styles/index';

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

export default function SearchSection() {
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searchPerformed, setSearchPerformed] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSearch = async () => {
    if (!searchTerm.trim()) {
      setSearchResults([]);
      setSearchPerformed(false);
      return;
    }

    setLoading(true);
    try {
      const results = await arduinoAPI.buscarRegistros(searchTerm);
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
          placeholder="Buscar por fecha (ej: 2026/02/26 o 2026/02)..."
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
                      <td className={row.RELE0 === 'ON' ? styles.relayOn : styles.relayOff}>{row.RELE0}</td>
                      <td className={row.RELE1 === 'ON' ? styles.relayOn : styles.relayOff}>{row.RELE1}</td>
                      <td className={row.RELE2 === 'ON' ? styles.relayOn : styles.relayOff}>{row.RELE2}</td>
                      <td className={row.RELE3 === 'ON' ? styles.relayOn : styles.relayOff}>{row.RELE3}</td>
                      <td className={row.RELE4 === 'ON' ? styles.relayOn : styles.relayOff}>{row.RELE4}</td>
                      <td className={row.RELE5 === 'ON' ? styles.relayOn : styles.relayOff}>{row.RELE5}</td>
                      <td className={row.RELE6 === 'ON' ? styles.relayOn : styles.relayOff}>{row.RELE6}</td>
                      <td className={row.RELE7 === 'ON' ? styles.relayOn : styles.relayOff}>{row.RELE7}</td>
                      <td className={styles.luxValue}>{row.LUZ?.toFixed(1)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className={styles.noResults}>
              No se encontraron registros para "{searchTerm}"
            </div>
          )}
        </div>
      )}
    </div>
  );
}