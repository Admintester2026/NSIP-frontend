import { useCallback, useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { voltajeAPI } from '../../../api/voltaje';
import { usePolling } from '../../../hooks/useAsync';
import styles from './VoltajeStats.module.css';

export default function VoltajeStats() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchStats = useCallback(() => voltajeAPI.getStats(), []);
  const { data, error } = usePolling(fetchStats, 30000);

  useEffect(() => {
    if (data) {
      setStats(data);
      setLoading(false);
    }
  }, [data]);

  if (loading) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.loadingSpinner}></div>
        <p>Cargando estadísticas...</p>
      </div>
    );
  }

  if (error || !stats) {
    return (
      <div className={styles.errorContainer}>
        <span className={styles.errorIcon}>❌</span>
        <h2>Error al cargar estadísticas</h2>
        <p>{error?.message || 'No hay datos disponibles'}</p>
        <Link to="/modulos/voltaje" className={styles.backButton}>
          ← Volver al Dashboard
        </Link>
      </div>
    );
  }

  const { general, hourly } = stats;

  return (
    <div className={styles.stats}>
      <div className={styles.header}>
        <div className={styles.titleSection}>
          <h1 className={styles.title}>Estadísticas de Voltaje</h1>
          <p className={styles.subtitle}>Últimos 7 días</p>
        </div>
        <Link to="/modulos/voltaje" className={styles.backButton}>
          ← Volver
        </Link>
      </div>

      {/* Tarjetas de resumen */}
      <div className={styles.summaryGrid}>
        <div className={styles.summaryCard}>
          <span className={styles.summaryLabel}>Total registros</span>
          <span className={styles.summaryValue}>{general?.TotalRegistros || 0}</span>
        </div>
        
        <div className={styles.summaryCard}>
          <span className={styles.summaryLabel}>Promedio R</span>
          <span className={styles.summaryValue}>
            {general?.PromedioVR?.toFixed(1) || 0} <small>V</small>
          </span>
        </div>
        
        <div className={styles.summaryCard}>
          <span className={styles.summaryLabel}>Promedio S</span>
          <span className={styles.summaryValue}>
            {general?.PromedioVS?.toFixed(1) || 0} <small>V</small>
          </span>
        </div>
        
        <div className={styles.summaryCard}>
          <span className={styles.summaryLabel}>Promedio T</span>
          <span className={styles.summaryValue}>
            {general?.PromedioVT?.toFixed(1) || 0} <small>V</small>
          </span>
        </div>
      </div>

      {/* Rangos por fase */}
      <div className={styles.rangesGrid}>
        <div className={styles.rangeCard}>
          <h3 className={styles.rangeTitle}>Fase R</h3>
          <div className={styles.rangeRow}>
            <span>Máximo:</span>
            <span className={styles.rangeValue}>{general?.MaxVR?.toFixed(1)} V</span>
          </div>
          <div className={styles.rangeRow}>
            <span>Mínimo:</span>
            <span className={styles.rangeValue}>{general?.MinVR?.toFixed(1)} V</span>
          </div>
        </div>

        <div className={styles.rangeCard}>
          <h3 className={styles.rangeTitle}>Fase S</h3>
          <div className={styles.rangeRow}>
            <span>Máximo:</span>
            <span className={styles.rangeValue}>{general?.MaxVS?.toFixed(1)} V</span>
          </div>
          <div className={styles.rangeRow}>
            <span>Mínimo:</span>
            <span className={styles.rangeValue}>{general?.MinVS?.toFixed(1)} V</span>
          </div>
        </div>

        <div className={styles.rangeCard}>
          <h3 className={styles.rangeTitle}>Fase T</h3>
          <div className={styles.rangeRow}>
            <span>Máximo:</span>
            <span className={styles.rangeValue}>{general?.MaxVT?.toFixed(1)} V</span>
          </div>
          <div className={styles.rangeRow}>
            <span>Mínimo:</span>
            <span className={styles.rangeValue}>{general?.MinVT?.toFixed(1)} V</span>
          </div>
        </div>
      </div>

      {/* Tabla horaria */}
      <div className={styles.hourlySection}>
        <h2 className={styles.sectionTitle}>Promedios por hora (últimas 24h)</h2>
        <div className={styles.tableContainer}>
          <table className={styles.hourlyTable}>
            <thead>
              <tr>
                <th>Hora</th>
                <th>Fase R (V)</th>
                <th>Fase S (V)</th>
                <th>Fase T (V)</th>
              </tr>
            </thead>
            <tbody>
              {hourly?.map((row, index) => (
                <tr key={index}>
                  <td>{row.Hora}:00</td>
                  <td>{row.PromedioVR?.toFixed(1) || 0}</td>
                  <td>{row.PromedioVS?.toFixed(1) || 0}</td>
                  <td>{row.PromedioVT?.toFixed(1) || 0}</td>
                </tr>
              ))}
              {(!hourly || hourly.length === 0) && (
                <tr>
                  <td colSpan="4" className={styles.noData}>
                    No hay datos en las últimas 24 horas
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