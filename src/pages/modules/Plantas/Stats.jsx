import { useState, useEffect, useCallback } from 'react';
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

// ==========================================
// FUNCIÓN CORREGIDA - FILTRA POR PERÍODO ACTUAL
// ==========================================
function filtrarPorPeriodo(data, periodo) {
  if (!data || data.length === 0) return [];
  
  const ahora = new Date();
  const hoy = new Date(Date.UTC(ahora.getUTCFullYear(), ahora.getUTCMonth(), ahora.getUTCDate()));
  
  return data.filter(item => {
    const fechaItem = new Date(item.FECHA);
    
    switch(periodo) {
      case 'dia':
        // Mismo día
        return fechaItem.getUTCFullYear() === hoy.getUTCFullYear() &&
               fechaItem.getUTCMonth() === hoy.getUTCMonth() &&
               fechaItem.getUTCDate() === hoy.getUTCDate();
      
      case 'semana':
        // Misma semana (Lunes a Domingo)
        const diaSemana = fechaItem.getUTCDay(); // 0 = Domingo, 1 = Lunes, ..., 6 = Sábado
        
        // Calcular inicio de semana (Lunes)
        const inicioSemana = new Date(hoy);
        // Si hoy es Domingo (0), restar 6 días para llegar al Lunes
        if (hoy.getUTCDay() === 0) {
          inicioSemana.setUTCDate(hoy.getUTCDate() - 6);
        } else {
          // Restar (día actual - 1) para llegar al Lunes
          inicioSemana.setUTCDate(hoy.getUTCDate() - (hoy.getUTCDay() - 1));
        }
        inicioSemana.setUTCHours(0, 0, 0, 0);
        
        // Calcular fin de semana (Domingo)
        const finSemana = new Date(inicioSemana);
        finSemana.setUTCDate(inicioSemana.getUTCDate() + 6);
        finSemana.setUTCHours(23, 59, 59, 999);
        
        return fechaItem >= inicioSemana && fechaItem <= finSemana;
      
      case 'mes':
        // Mismo mes
        return fechaItem.getUTCFullYear() === hoy.getUTCFullYear() &&
               fechaItem.getUTCMonth() === hoy.getUTCMonth();
      
      default:
        return true;
    }
  });
}

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
      setHistoricoData(historico);
      setLoading(prev => ({ ...prev, historico: false }));
    }
  }, [historico]);

  useEffect(() => {
    if (historicoData.length > 0) {
      const filtrados = filtrarPorPeriodo(historicoData, periodo);
      setHistoricoFiltrado(filtrados);
    }
  }, [historicoData, periodo]);

  const fetchUltimo = useCallback(() => arduinoAPI.getUltimo(), []);
  const { data: ultimo, error: ultimoError } = usePolling(fetchUltimo, 10000);

  useEffect(() => {
    if (ultimo?.datos) {
      setUltimoRegistro(ultimo.datos);
      setLoading(prev => ({ ...prev, ultimo: false }));
    }
  }, [ultimo]);

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

      <div className={styles.chartsGrid}>
        <div className={styles.chartCard}>
          <h3 className={styles.chartTitle}>
            <span className={styles.chartIcon}>📈</span>
            Evolución de Luz 
            {periodo === 'dia' ? ' (Hoy - Valores por hora)' : 
             periodo === 'semana' ? ' (Promedio por día de la semana)' : 
             ' (Promedio por semana del mes)'}
          </h3>
          <LightChart data={historicoFiltrado} periodo={periodo} />
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

      <SearchSection/>

      {(statsError || historicoError || ultimoError) && (
        <div className={styles.error}>
          <p>Algunos datos no pudieron cargarse. Reintentando...</p>
        </div>
      )}
    </div>
  );
}