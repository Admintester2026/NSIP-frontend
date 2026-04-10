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

// Validar si una fecha es válida
function esFechaValida(fechaStr) {
  if (!fechaStr) return false;
  
  // Detectar fechas inválidas como 2000-00-00
  const match = fechaStr.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (match) {
    const año = parseInt(match[1]);
    const mes = parseInt(match[2]);
    const dia = parseInt(match[3]);
    
    // Mes 0 o día 0 son inválidos
    if (mes === 0 || dia === 0) return false;
    
    // Año debe ser razonable (entre 2020 y 2030)
    if (año < 2020 || año > 2030) return false;
  }
  
  try {
    const fecha = new Date(fechaStr);
    return !isNaN(fecha.getTime());
  } catch {
    return false;
  }
}

// Formatear fecha de forma segura
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

// ==========================================
// FUNCIÓN CORREGIDA - FILTRA POR PERÍODO ACTUAL
// ==========================================
function filtrarPorPeriodo(data, periodo) {
  if (!data || data.length === 0) return [];
  
  // Filtrar datos con fechas inválidas primero
  const datosValidos = data.filter(item => {
    if (!item?.FECHA) return false;
    return esFechaValida(item.FECHA);
  });
  
  if (datosValidos.length === 0) return [];
  
  const ahora = new Date();
  const hoy = new Date(Date.UTC(ahora.getUTCFullYear(), ahora.getUTCMonth(), ahora.getUTCDate()));
  
  return datosValidos.filter(item => {
    let fechaItem;
    try {
      fechaItem = new Date(item.FECHA);
      if (isNaN(fechaItem.getTime())) return false;
    } catch {
      return false;
    }
    
    switch(periodo) {
      case 'dia':
        return fechaItem.getUTCFullYear() === hoy.getUTCFullYear() &&
               fechaItem.getUTCMonth() === hoy.getUTCMonth() &&
               fechaItem.getUTCDate() === hoy.getUTCDate();
      
      case 'semana': {
        // Calcular inicio de semana (Lunes)
        const inicioSemana = new Date(hoy);
        if (hoy.getUTCDay() === 0) {
          inicioSemana.setUTCDate(hoy.getUTCDate() - 6);
        } else {
          inicioSemana.setUTCDate(hoy.getUTCDate() - (hoy.getUTCDay() - 1));
        }
        inicioSemana.setUTCHours(0, 0, 0, 0);
        
        // Calcular fin de semana (Domingo)
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
  const [historicoFiltrado, setHistoricoFiltrado] = useState([]);
  const [ultimoRegistro, setUltimoRegistro] = useState(null);
  const [periodo, setPeriodo] = useState('dia');
  const [limite, setLimite] = useState(20);
  const [loading, setLoading] = useState({
    stats: true,
    historico: true,
    ultimo: true
  });

  const fetchStats = useCallback(() => arduinoAPI.getStats(), []);
  const { data: stats, error: statsError } = usePolling(fetchStats, 60000);

  useEffect(() => {
    if (stats) {
      setStatsData(stats);
      setLoading(prev => ({ ...prev, stats: false }));
    }
  }, [stats]);

  const fetchHistorico = useCallback(() => arduinoAPI.getHistorico(), []);
  const { data: historico, error: historicoError } = usePolling(fetchHistorico, 30000);

  useEffect(() => {
    if (historico) {
      // Filtrar datos con fechas inválidas al cargar
      const datosValidos = historico.filter(item => {
        if (!item?.FECHA) return false;
        return esFechaValida(item.FECHA);
      });
      setHistoricoData(datosValidos);
      setLoading(prev => ({ ...prev, historico: false }));
    }
  }, [historico]);

  useEffect(() => {
    if (historicoData.length > 0) {
      const filtrados = filtrarPorPeriodo(historicoData, periodo);
      setHistoricoFiltrado(filtrados);
    } else {
      setHistoricoFiltrado([]);
    }
  }, [historicoData, periodo]);

  const fetchUltimo = useCallback(() => arduinoAPI.getUltimo(), []);
  const { data: ultimo, error: ultimoError } = usePolling(fetchUltimo, 10000);

  useEffect(() => {
    if (ultimo?.datos) {
      // Validar que la fecha del último registro sea válida
      if (esFechaValida(ultimo.datos.FECHA)) {
        setUltimoRegistro(ultimo.datos);
      } else {
        console.warn('Último registro con fecha inválida:', ultimo.datos.FECHA);
        setUltimoRegistro(null);
      }
      setLoading(prev => ({ ...prev, ultimo: false }));
    }
  }, [ultimo]);

  // Calcular mensaje de estado de datos
  const totalRegistros = historicoData.length;
  const registrosFiltrados = historicoFiltrado.length;
  
  const hayDatos = totalRegistros > 0;
  const hayDatosFiltrados = registrosFiltrados > 0;

  if (loading.stats && loading.historico && loading.ultimo) {
    return (
      <div className={styles.loading}>
        <div className={styles.spinner} />
        <p>Cargando estadísticas...</p>
      </div>
    );
  }

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

      {/* Advertencia si hay datos inválidos */}
      {!hayDatos && (
        <div className={styles.warningCard}>
          <span className={styles.warningIcon}>⚠️</span>
          <div>
            <h4>No hay datos disponibles</h4>
            <p>Esperando la primera sincronización de datos del Arduino...</p>
          </div>
        </div>
      )}

      {hayDatos && (
        <>
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

          <div className={styles.periodSelectorContainer}>
            <span className={styles.selectorLabel}>Período:</span>
            <div className={styles.periodSelector}>
              <button
                className={`${styles.periodButton} ${periodo === 'dia' ? styles.active : ''}`}
                onClick={() => setPeriodo('dia')}
              >
                Día
              </button>
              <button
                className={`${styles.periodButton} ${periodo === 'semana' ? styles.active : ''}`}
                onClick={() => setPeriodo('semana')}
              >
                Semana
              </button>
              <button
                className={`${styles.periodButton} ${periodo === 'mes' ? styles.active : ''}`}
                onClick={() => setPeriodo('mes')}
              >
                Mes
              </button>
            </div>
          </div>

          {/* Mostrar contador de registros */}
          <div className={styles.recordCountInfo}>
            <span>📊 Mostrando {registrosFiltrados} de {totalRegistros} registros</span>
            {!hayDatosFiltrados && registrosFiltrados === 0 && totalRegistros > 0 && (
              <span className={styles.warningText}> (No hay datos en el período seleccionado)</span>
            )}
          </div>

          <div className={styles.chartsGrid}>
            <div className={styles.chartCard}>
              <h3 className={styles.chartTitle}>
                <span className={styles.chartIcon}>📈</span>
                Evolución de Luz 
                {periodo === 'dia' ? ' (Hoy - Valores por hora)' : 
                 periodo === 'semana' ? ' (Promedio por día de la semana)' : 
                 ' (Promedio por semana del mes)'}
              </h3>
              {hayDatosFiltrados ? (
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

          <div className={styles.limitSelectorContainer}>
            <span className={styles.selectorLabel}>Mostrar:</span>
            <div className={styles.limitSelector}>
              <button
                className={`${styles.limitButton} ${limite === 20 ? styles.active : ''}`}
                onClick={() => setLimite(20)}
              >
                20
              </button>
              <button
                className={`${styles.limitButton} ${limite === 50 ? styles.active : ''}`}
                onClick={() => setLimite(50)}
              >
                50
              </button>
              <button
                className={`${styles.limitButton} ${limite === 100 ? styles.active : ''}`}
                onClick={() => setLimite(100)}
              >
                100
              </button>
            </div>
          </div>

          <div className={styles.tablesGrid}>
            <div className={styles.tableColumn}>
              <RelayStatsTable stats={statsData} />
            </div>
            <div className={styles.tableColumn}>
              <HistoricoTable historico={historicoFiltrado} limit={limite} />
            </div>
          </div>

          <SearchSection />
        </>
      )}

      {(statsError || historicoError || ultimoError) && (
        <div className={styles.error}>
          <p>⚠️ Algunos datos no pudieron cargarse. Reintentando...</p>
        </div>
      )}
    </div>
  );
}