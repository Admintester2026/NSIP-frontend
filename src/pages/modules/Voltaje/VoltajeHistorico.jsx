import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { voltajeAPI } from '../../../api/voltaje';
import { usePolling } from '../../../hooks/useAsync';
import styles from './VoltajeHistorico.module.css';

function formatDateTime(isoString) {
  if (!isoString) return '--/--/---- --:--:--';
  const fecha = new Date(isoString);
  const año = fecha.getFullYear();
  const mes = (fecha.getMonth() + 1).toString().padStart(2, '0');
  const dia = fecha.getDate().toString().padStart(2, '0');
  const horas = fecha.getHours().toString().padStart(2, '0');
  const minutos = fecha.getMinutes().toString().padStart(2, '0');
  const segundos = fecha.getSeconds().toString().padStart(2, '0');
  return `${año}/${mes}/${dia} ${horas}:${minutos}:${segundos}`;
}

function formatDateOnly(isoString) {
  if (!isoString) return '--/--/----';
  const fecha = new Date(isoString);
  const año = fecha.getFullYear();
  const mes = (fecha.getMonth() + 1).toString().padStart(2, '0');
  const dia = fecha.getDate().toString().padStart(2, '0');
  return `${año}/${mes}/${dia}`;
}

function formatTimeOnly(isoString) {
  if (!isoString) return '--:--:--';
  const fecha = new Date(isoString);
  const horas = fecha.getHours().toString().padStart(2, '0');
  const minutos = fecha.getMinutes().toString().padStart(2, '0');
  const segundos = fecha.getSeconds().toString().padStart(2, '0');
  return `${horas}:${minutos}:${segundos}`;
}

export default function VoltajeHistorico() {
  const [historico, setHistorico] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [dateFilter, setDateFilter] = useState('');
  const [sortConfig, setSortConfig] = useState({ key: 'FECHA', direction: 'desc' });
  const [stats, setStats] = useState({
    total: 0,
    promedioVR: 0,
    promedioVS: 0,
    promedioVT: 0,
    maxVR: 0,
    minVR: 999
  });

  // Obtener histórico
  const fetchHistorico = useCallback(() => voltajeAPI.getHistorico(500), []);
  const { data, loading, error } = usePolling(fetchHistorico, 30000);

  useEffect(() => {
    if (data) {
      setHistorico(data);
      applyFilters(data, searchTerm, dateFilter);
      calculateStats(data);
    }
  }, [data]);

  // Calcular estadísticas
  const calculateStats = (data) => {
    if (!data || data.length === 0) return;

    const total = data.length;
    let sumVR = 0, sumVS = 0, sumVT = 0;
    let maxVR = 0, maxVS = 0, maxVT = 0;
    let minVR = 999, minVS = 999, minVT = 999;

    data.forEach(item => {
      sumVR += item.V_R || 0;
      sumVS += item.V_S || 0;
      sumVT += item.V_T || 0;

      maxVR = Math.max(maxVR, item.V_R || 0);
      maxVS = Math.max(maxVS, item.V_S || 0);
      maxVT = Math.max(maxVT, item.V_T || 0);

      if (item.V_R > 0) minVR = Math.min(minVR, item.V_R);
      if (item.V_S > 0) minVS = Math.min(minVS, item.V_S);
      if (item.V_T > 0) minVT = Math.min(minVT, item.V_T);
    });

    setStats({
      total,
      promedioVR: (sumVR / total).toFixed(1),
      promedioVS: (sumVS / total).toFixed(1),
      promedioVT: (sumVT / total).toFixed(1),
      maxVR: maxVR.toFixed(1),
      maxVS: maxVS.toFixed(1),
      maxVT: maxVT.toFixed(1),
      minVR: minVR === 999 ? 0 : minVR.toFixed(1),
      minVS: minVS === 999 ? 0 : minVS.toFixed(1),
      minVT: minVT === 999 ? 0 : minVT.toFixed(1)
    });
  };

  // Aplicar filtros
  const applyFilters = (data, search, date) => {
    let filtered = [...data];

    // Filtro por texto (fecha)
    if (search.trim() !== '') {
      filtered = filtered.filter(item => 
        formatDateTime(item.FECHA).toLowerCase().includes(search.toLowerCase())
      );
    }

    // Filtro por fecha específica
    if (date) {
      filtered = filtered.filter(item => {
        const itemDate = formatDateOnly(item.FECHA);
        return itemDate === date;
      });
    }

    setFilteredData(filtered);
  };

  // Manejar búsqueda
  const handleSearch = (e) => {
    const term = e.target.value;
    setSearchTerm(term);
    applyFilters(historico, term, dateFilter);
  };

  // Manejar filtro por fecha
  const handleDateFilter = (e) => {
    const date = e.target.value;
    setDateFilter(date);
    applyFilters(historico, searchTerm, date);
  };

  // Limpiar filtros
  const clearFilters = () => {
    setSearchTerm('');
    setDateFilter('');
    setFilteredData(historico);
  };

  // Ordenar datos
  const requestSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });

    const sorted = [...filteredData].sort((a, b) => {
      let aVal = a[key] || 0;
      let bVal = b[key] || 0;
      
      if (key === 'FECHA') {
        aVal = new Date(a[key]).getTime();
        bVal = new Date(b[key]).getTime();
      }
      
      if (aVal < bVal) return direction === 'asc' ? -1 : 1;
      if (aVal > bVal) return direction === 'asc' ? 1 : -1;
      return 0;
    });
    
    setFilteredData(sorted);
  };

  const getSortIcon = (key) => {
    if (sortConfig.key !== key) return '↕️';
    return sortConfig.direction === 'asc' ? '↑' : '↓';
  };

  if (loading && historico.length === 0) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.loadingSpinner}></div>
        <p>Cargando histórico...</p>
      </div>
    );
  }

  if (error && historico.length === 0) {
    return (
      <div className={styles.errorContainer}>
        <span className={styles.errorIcon}>❌</span>
        <h2>Error al cargar histórico</h2>
        <p>{error.message}</p>
        <Link to="/modulos/voltaje" className={styles.backButton}>
          ← Volver al Dashboard
        </Link>
      </div>
    );
  }

  return (
    <div className={styles.historico}>
      {/* Cabecera */}
      <div className={styles.header}>
        <div className={styles.titleSection}>
          <h1 className={styles.title}>Histórico de Voltaje</h1>
          <p className={styles.subtitle}>Últimos {historico.length} registros</p>
        </div>
        <Link to="/modulos/voltaje" className={styles.backButton}>
          ← Volver
        </Link>
      </div>

      {/* Tarjetas de resumen */}
      <div className={styles.statsGrid}>
        <div className={styles.statCard}>
          <span className={styles.statLabel}>Total registros</span>
          <span className={styles.statValue}>{stats.total}</span>
        </div>
        
        <div className={styles.statCard}>
          <span className={styles.statLabel}>Promedio R</span>
          <span className={styles.statValue}>{stats.promedioVR} <small>V</small></span>
        </div>
        
        <div className={styles.statCard}>
          <span className={styles.statLabel}>Promedio S</span>
          <span className={styles.statValue}>{stats.promedioVS} <small>V</small></span>
        </div>
        
        <div className={styles.statCard}>
          <span className={styles.statLabel}>Promedio T</span>
          <span className={styles.statValue}>{stats.promedioVT} <small>V</small></span>
        </div>

        <div className={styles.statCard}>
          <span className={styles.statLabel}>Máx R</span>
          <span className={styles.statValue}>{stats.maxVR} <small>V</small></span>
        </div>
        
        <div className={styles.statCard}>
          <span className={styles.statLabel}>Máx S</span>
          <span className={styles.statValue}>{stats.maxVS} <small>V</small></span>
        </div>
        
        <div className={styles.statCard}>
          <span className={styles.statLabel}>Máx T</span>
          <span className={styles.statValue}>{stats.maxVT} <small>V</small></span>
        </div>

        <div className={styles.statCard}>
          <span className={styles.statLabel}>Mín R</span>
          <span className={styles.statValue}>{stats.minVR} <small>V</small></span>
        </div>
      </div>

      {/* Filtros */}
      <div className={styles.filtersSection}>
        <div className={styles.searchBox}>
          <input
            type="text"
            placeholder="Buscar por fecha (YYYY/MM/DD)..."
            value={searchTerm}
            onChange={handleSearch}
            className={styles.searchInput}
          />
          <span className={styles.searchIcon}>🔍</span>
        </div>

        <div className={styles.dateFilter}>
          <input
            type="date"
            value={dateFilter}
            onChange={handleDateFilter}
            className={styles.dateInput}
          />
        </div>

        {(searchTerm || dateFilter) && (
          <button onClick={clearFilters} className={styles.clearButton}>
            ✕ Limpiar filtros
          </button>
        )}
      </div>

      {/* Tabla de histórico */}
      <div className={styles.tableSection}>
        <div className={styles.tableHeader}>
          <h2 className={styles.tableTitle}>Registros históricos</h2>
          <span className={styles.tableCount}>
            Mostrando {filteredData.length} de {historico.length} registros
          </span>
        </div>

        <div className={styles.tableContainer}>
          <table className={styles.historicoTable}>
            <thead>
              <tr>
                <th onClick={() => requestSort('FECHA')} className={styles.sortable}>
                  Fecha/Hora {getSortIcon('FECHA')}
                </th>
                <th onClick={() => requestSort('V_R')} className={styles.sortable}>
                  Fase R (V) {getSortIcon('V_R')}
                </th>
                <th onClick={() => requestSort('V_S')} className={styles.sortable}>
                  Fase S (V) {getSortIcon('V_S')}
                </th>
                <th onClick={() => requestSort('V_T')} className={styles.sortable}>
                  Fase T (V) {getSortIcon('V_T')}
                </th>
                <th>SD Status</th>
                <th>Notas</th>
              </tr>
            </thead>
            <tbody>
              {filteredData.length > 0 ? (
                filteredData.map((item, index) => (
                  <tr key={index} className={item.SD_STATUS === 'ERROR' ? styles.errorRow : ''}>
                    <td className={styles.dateCell}>
                      <div className={styles.dateTime}>
                        <span className={styles.date}>{formatDateOnly(item.FECHA)}</span>
                        <span className={styles.time}>{formatTimeOnly(item.FECHA)}</span>
                      </div>
                    </td>
                    <td className={styles.voltageCell}>
                      <span className={styles.voltageValue}>{item.V_R?.toFixed(1)}</span>
                      <span className={styles.voltageUnit}>V</span>
                    </td>
                    <td className={styles.voltageCell}>
                      <span className={styles.voltageValue}>{item.V_S?.toFixed(1)}</span>
                      <span className={styles.voltageUnit}>V</span>
                    </td>
                    <td className={styles.voltageCell}>
                      <span className={styles.voltageValue}>{item.V_T?.toFixed(1)}</span>
                      <span className={styles.voltageUnit}>V</span>
                    </td>
                    <td>
                      <span className={`${styles.sdStatus} ${item.SD_STATUS === 'OK' ? styles.sdOk : styles.sdError}`}>
                        {item.SD_STATUS || 'N/A'}
                      </span>
                    </td>
                    <td className={styles.notasCell}>
                      {item.NOTAS || '-'}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="6" className={styles.noData}>
                    No se encontraron registros con los filtros aplicados
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}