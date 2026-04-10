// src/pages/modules/Plantas/Stats.jsx
import { useState, useEffect, useCallback, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { arduinoAPI } from '../../../api/arduino';
import { usePolling } from '../../../hooks/useAsync';
import LightChart from '../../../components/charts/LightChart';
import RelayUsageChart from '../../../components/charts/RelayUsageChart';
import StatsSummary from './components/StatsSummary';
import RelayStatsTable from './components/RelayStatsTable';
import HistoricoTable from './components/HistoricoTable';
import SearchSection from './components/SearchSection';
import styles from './styles/index';

// ==========================================
// FUNCIONES DE VALIDACIÓN DE FECHAS
// ==========================================

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

function formatDateTime(isoString) {
  if (!isoString) return '--/--/---- --:--';
  if (!esFechaValida(isoString)) return '--/--/---- --:--';
  
  try {
    const fecha = new Date(isoString);
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

// ==========================================
// FUNCIÓN PARA FILTRAR POR PERÍODO
// ==========================================
function filtrarPorPeriodo(data, periodo) {
  if (!data || data.length === 0) return [];
  
  const ahora = new Date();
  const hoy = new Date(Date.UTC(ahora.getUTCFullYear(), ahora.getUTCMonth(), ahora.getUTCDate()));
  
  return data.filter(item => {
    if (!item?.FECHA) return false;
    if (!esFechaValida(item.FECHA)) return false;
    
    const fechaItem = new Date(item.FECHA);
    if (isNaN(fechaItem.getTime())) return false;
    
    switch(periodo) {
      case 'dia':
        return fechaItem.getUTCFullYear() === hoy.getUTCFullYear() &&
               fechaItem.getUTCMonth() === hoy.getUTCMonth() &&
               fechaItem.getUTCDate() === hoy.getUTCDate();
      
      case 'semana': {
        const inicioSemana = new Date(hoy);
        if (hoy.getUTCDay() === 0) {
          inicioSemana.setUTCDate(hoy.getUTCDate() - 6);
        } else {
          inicioSemana.setUTCDate(hoy.getUTCDate() - (hoy.getUTCDay() - 1));
        }
        inicioSemana.setUTCHours(0, 0, 0, 0);
        
        const finSemana = new Date(inicioSemana);
        finSemana.setUTCDate(inicioSemana.getUTCDate() + 6);
        finSemana.setUTCHours(23, 59, 59, 999);
        
        return fechaItem >= inicioSemana && fechaItem <= finSemana;
      }
      
      case 'mes':
        return fechaItem.getUTCFullYear() === hoy.getUTCFullYear() &&
               fechaItem.getUTCMonth() === hoy.getUTCMonth();
      
      default:
        return true;
    }
  });
}

// ==========================================
// COMPONENTE PRINCIPAL
// ==========================================
export default function Stats() {
  const [statsData, setStatsData] = useState(null);
  const [historicoData, setHistoricoData] = useState([]);
  const [periodo, setPeriodo] = useState('dia');
  const [limite, setLimite] = useState(20);
  const [ultimoRegistro, setUltimoRegistro] = useState(null);
  const [loading, setLoading] = useState(true);

  // Fetch stats
  const fetchStats = useCallback(() => arduinoAPI.getStats(), []);
  const { data: stats } = usePolling(fetchStats, 60000);

  // Fetch historico
  const fetchHistorico = useCallback(() => arduinoAPI.getHistorico(), []);
  const { data: historico } = usePolling(fetchHistorico, 30000);

  // Fetch último registro
  const fetchUltimo = useCallback(() => arduinoAPI.getUltimo(), []);
  const { data: ultimo } = usePolling(fetchUltimo, 10000);

  useEffect(() => {
    if (stats) {
      setStatsData(stats);
    }
  }, [stats]);

  useEffect(() => {
    if (historico && Array.isArray(historico)) {
      // Filtrar solo registros con fechas válidas
      const datosValidos = historico.filter(item => {
        if (!item?.FECHA) return false;
        return esFechaValida(item.FECHA);
      });
      console.log(`📊 Stats: ${historico.length} registros totales, ${datosValidos.length} válidos`);
      setHistoricoData(datosValidos);
    }
  }, [historico]);

  useEffect(() => {
    if (ultimo?.datos && esFechaValida(ultimo.datos.FECHA)) {
      setUltimoRegistro(ultimo.datos);
    }
  }, [ultimo]);

  // Filtrar datos por período
  const historicoFiltrado = useMemo(() => {
    if (historicoData.length === 0) return [];
    return filtrarPorPeriodo(historicoData, periodo);
  }, [historicoData, periodo]);

  useEffect(() => {
    // Verificar si los datos han cargado
    if (historico !== undefined && stats !== undefined) {
      setLoading(false);
    }
  }, [historico, stats]);

  if (loading) {
    return (
      <div className={styles.loading}>
        <div className={styles.spinner} />
        <p>Cargando estadísticas...</p>
      </div>
    );
  }

  const totalRegistros = historicoData.length;
  const registrosFiltrados = historicoFiltrado.length;

  return (
    <div className={styles.stats}>
      <div className={styles.header}>
        <div className={styles.titleSection}>
          <h1 className={styles.title}>Estadísticas y Análisis</h1>
          <p className={styles.subtitle}>Datos en tiempo real desde SQL Server</p>
        </div>
        <Link to="/modulos/luminarias" className={styles.backButton}>
          <span>←</span> Volver al Dashboard
        </Link>
      </div>

      {/* Mostrar resumen de datos */}
      <div className={styles.dataInfo}>
        <span className={styles.dataInfoBadge}>
          📊 Total registros: {totalRegistros}
        </span>
        <span className={styles.dataInfoBadge}>
          📅 Período: {periodo === 'dia' ? 'Hoy' : periodo === 'semana' ? 'Esta semana' : 'Este mes'}
        </span>
        <span className={styles.dataInfoBadge}>
          🔍 Mostrando: {registrosFiltrados} registros
        </span>
      </div>

      <StatsSummary historicoData={historicoFiltrado} statsData={statsData} />

      {ultimoRegistro && (
        <div className={styles.lastRecord}>
          <h3 className={styles.sectionTitle}>
            <span className={styles.sectionIcon}>🕐</span>
            Último Registro
          </h3>
          <div className={styles.lastRecordGrid}>
            <div className={styles.lastRecordItem}>
              <span className={styles.lastRecordLabel}>Fecha:</span>
              <span className={styles.lastRecordValue}>
                {formatDateTime(ultimoRegistro.FECHA)}
              </span>
            </div>
            <div className={styles.lastRecordItem}>
              <span className={styles.lastRecordLabel}>Luz:</span>
              <span className={styles.lastRecordValue}>
                {ultimoRegistro.LUZ?.toFixed(1)} lux
              </span>
            </div>
            <div className={styles.lastRecordItem}>
              <span className={styles.lastRecordLabel}>Relés:</span>
              <span className={styles.lastRecordValue}>
                <div className={styles.relayStatusCompact}>
                  {[0,1,2,3,4,5,6,7].map(i => (
                    <span key={i} className={styles.relayStatusCompactItem}>
                      R{i+1}: <span className={ultimoRegistro[`RELE${i}`] === 'ON' ? styles.on : styles.off}>
                        {ultimoRegistro[`RELE${i}`]}
                      </span>
                    </span>
                  ))}
                </div>
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Selector de período */}
      <div className={styles.periodSelectorContainer}>
        <span className={styles.selectorLabel}>Período:</span>
        <div className={styles.periodSelector}>
          {['dia', 'semana', 'mes'].map(p => (
            <button
              key={p}
              className={`${styles.periodButton} ${periodo === p ? styles.active : ''}`}
              onClick={() => setPeriodo(p)}
            >
              {p === 'dia' ? 'Día' : p === 'semana' ? 'Semana' : 'Mes'}
            </button>
          ))}
        </div>
      </div>

      {/* Gráficas */}
      <div className={styles.chartsGrid}>
        <div className={styles.chartCard}>
          <h3 className={styles.chartTitle}>
            <span className={styles.chartIcon}>📈</span>
            Evolución de Luz 
            {periodo === 'dia' ? ' (Hoy)' : periodo === 'semana' ? ' (Esta semana)' : ' (Este mes)'}
          </h3>
          {historicoFiltrado.length > 0 ? (
            <LightChart data={historicoFiltrado} periodo={periodo} />
          ) : (
            <div className={styles.noDataMessage}>
              No hay datos para mostrar en este período
            </div>
          )}
        </div>

        <div className={styles.chartCard}>
          <h3 className={styles.chartTitle}>
            <span className={styles.chartIcon}>📊</span>
            Uso de Relés
          </h3>
          <RelayUsageChart stats={statsData} />
        </div>
      </div>

      {/* Selector de límite */}
      <div className={styles.limitSelectorContainer}>
        <span className={styles.selectorLabel}>Mostrar:</span>
        <div className={styles.limitSelector}>
          {[20, 50, 100].map(lim => (
            <button
              key={lim}
              className={`${styles.limitButton} ${limite === lim ? styles.active : ''}`}
              onClick={() => setLimite(lim)}
            >
              {lim}
            </button>
          ))}
        </div>
      </div>

      {/* Tablas */}
      <div className={styles.tablesGrid}>
        <div className={styles.tableColumn}>
          <RelayStatsTable stats={statsData} />
        </div>
        <div className={styles.tableColumn}>
          <HistoricoTable 
            historico={historicoFiltrado.length > 0 ? historicoFiltrado : historicoData} 
            limit={limite} 
          />
        </div>
      </div>

      <SearchSection />
    </div>
  );
}