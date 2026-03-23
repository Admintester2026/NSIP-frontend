import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { voltajeAPI } from '../../../api/voltaje';
import { usePolling } from '../../../hooks/useAsync';
import { formatDateTime, formatDateOnly, formatTimeOnly } from '../../../utils/dateUtils';
import styles from './VoltajeHistorico.module.css';

export default function VoltajeHistorico() {
  const [historico, setHistorico] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [dateFilter, setDateFilter] = useState('');
  const [limit, setLimit] = useState(100);
  const [sortConfig, setSortConfig] = useState({ key: 'FECHA', direction: 'desc' });
  const [stats, setStats] = useState({
    total: 0,
    promedioVR: 0,
    promedioVS: 0,
    promedioVT: 0,
    maxVR: 0,
    minVR: 999
  });

  // Obtener histórico con límite variable
  const fetchHistorico = useCallback(() => voltajeAPI.getHistorico(limit), [limit]);
  const { data, loading, error } = usePolling(fetchHistorico, 30000);

  useEffect(() => {
    if (data) {
      setHistorico(data);
      calculateStats(data);
    }
  }, [data]);

  // Aplicar filtros CADA VEZ que cambien searchTerm, dateFilter o historico
  useEffect(() => {
    applyFilters(historico, searchTerm, dateFilter);
  }, [historico, searchTerm, dateFilter]);

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
    if (!data || data.length === 0) {
      setFilteredData([]);
      return;
    }

    let filtered = [...data];

    // Filtro por texto (búsqueda libre)
    if (search && search.trim() !== '') {
      filtered = filtered.filter(item => 
        formatDateTime(item.FECHA).toLowerCase().includes(search.toLowerCase())
      );
    }

    // Filtro por fecha específica (input date en formato YYYY-MM-DD)
    if (date && date.trim() !== '') {
      filtered = filtered.filter(item => {
        const itemDate = formatDateOnly(item.FECHA); // YYYY/MM/DD
        const inputDate = date.replace(/-/g, '/');
        return itemDate === inputDate;
      });
    }

    setFilteredData(filtered);
  };

  // Manejar cambio de límite
  const handleLimitChange = (newLimit) => {
    setLimit(newLimit);
  };

  // Manejar búsqueda
  const handleSearch = (e) => {
    const term = e.target.value;
    setSearchTerm(term);
  };

  // Manejar filtro por fecha
  const handleDateFilter = (e) => {
    const date = e.target.value;
    setDateFilter(date);
  };

  // Limpiar filtros
  const clearFilters = () => {
    setSearchTerm('');
    setDateFilter('');
  };

  // Ordenar datos (CORREGIDO - sin new Date)
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
        // Ordenar como strings en lugar de usar new Date
        aVal = a[key];
        bVal = b[key];
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
          <p className={styles.subtitle}>Total en BD: {stats.total} registros</p>
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

      {/* BARRA DE FILTROS */}
      <div className={styles.filtersBar}>
        {/* Selector de límite */}
        <div className={styles.limitSelector}>
          <span className={styles.limitLabel}>Mostrar:</span>
          <button 
            className={`${styles.limitButton} ${limit === 20 ? styles.active : ''}`}
            onClick={() => handleLimitChange(20)}
          >
            20
          </button>
          <button 
            className={`${styles.limitButton} ${limit === 50 ? styles.active : ''}`}
            onClick={() => handleLimitChange(50)}
          >
            50
          </button>
          <button 
            className={`${styles.limitButton} ${limit === 100 ? styles.active : ''}`}
            onClick={() => handleLimitChange(100)}
          >
            100
          </button>
          <button 
            className={`${styles.limitButton} ${limit === 500 ? styles.active : ''}`}
            onClick={() => handleLimitChange(500)}
          >
            500
          </button>
          <button 
            className={`${styles.limitButton} ${limit === 1000 ? styles.active : ''}`}
            onClick={() => handleLimitChange(1000)}
          >
            1000
          </button>
        </div>

        {/* Buscador por fecha */}
        <div className={styles.searchBox}>
          <input
            type="text"
            placeholder="Buscar fecha (YYYY/MM/DD)..."
            value={searchTerm}
            onChange={handleSearch}
            className={styles.searchInput}
          />
          <span className={styles.searchIcon}>🔍</span>
        </div>

        {/* Filtro por fecha con calendario */}
        <div className={styles.dateFilter}>
          <input
            type="date"
            value={dateFilter}
            onChange={handleDateFilter}
            className={styles.dateInput}
          />
        </div>

        {/* Botón limpiar */}
        {(searchTerm || dateFilter) && (
          <button onClick={clearFilters} className={styles.clearButton}>
            ✕ Limpiar filtros
          </button>
        )}
      </div>

      {/* Información de filtros */}
      {(searchTerm || dateFilter) && (
        <div className={styles.filterInfo}>
          <span className={styles.filterBadge}>
            {filteredData.length} resultados encontrados
          </span>
        </div>
      )}

      {/* Tabla de histórico CON SCROLL */}
      <div className={styles.tableSection}>
        <div className={styles.tableHeader}>
          <h2 className={styles.tableTitle}>Registros históricos</h2>
          <span className={styles.tableCount}>
            Mostrando {filteredData.length} de {limit} registros cargados (total BD: {stats.total})
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