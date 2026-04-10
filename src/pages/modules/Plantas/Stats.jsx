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

function formatDateTimeLocal(isoString) {
  if (!isoString) return '--/--/---- --:--';
  try {
    const fecha = new Date(isoString);
    const año = fecha.getFullYear();
    const mes = (fecha.getMonth() + 1).toString().padStart(2, '0');
    const dia = fecha.getDate().toString().padStart(2, '0');
    const horas = fecha.getHours().toString().padStart(2, '0');
    const minutos = fecha.getMinutes().toString().padStart(2, '0');
    const segundos = fecha.getSeconds().toString().padStart(2, '0');
    return `${año}/${mes}/${dia} ${horas}:${minutos}:${segundos}`;
  } catch {
    return '--/--/---- --:--';
  }
}

function esMismoDia(fecha1, fecha2) {
  return fecha1.getFullYear() === fecha2.getFullYear() &&
         fecha1.getMonth() === fecha2.getMonth() &&
         fecha1.getDate() === fecha2.getDate();
}

function estaEnSemana(fecha, inicioSemana, finSemana) {
  return fecha >= inicioSemana && fecha <= finSemana;
}

function esMismoMes(fecha1, fecha2) {
  return fecha1.getFullYear() === fecha2.getFullYear() &&
         fecha1.getMonth() === fecha2.getMonth();
}

function filtrarPorPeriodo(data, periodo) {
  if (!data || data.length === 0) return [];
  
  const ahora = new Date();
  const hoy = new Date(ahora.getFullYear(), ahora.getMonth(), ahora.getDate());
  
  const diaSemana = ahora.getDay();
  let inicioSemana = new Date(ahora);
  if (diaSemana === 0) {
    inicioSemana.setDate(ahora.getDate() - 6);
  } else {
    inicioSemana.setDate(ahora.getDate() - (diaSemana - 1));
  }
  inicioSemana.setHours(0, 0, 0, 0);
  
  let finSemana = new Date(inicioSemana);
  finSemana.setDate(inicioSemana.getDate() + 6);
  finSemana.setHours(23, 59, 59, 999);
  
  const resultados = data.filter(item => {
    if (!item?.FECHA) return false;
    const fecha = new Date(item.FECHA);
    if (isNaN(fecha.getTime())) return false;
    
    switch(periodo) {
      case 'dia':
        return esMismoDia(fecha, hoy);
      case 'semana':
        return estaEnSemana(fecha, inicioSemana, finSemana);
      case 'mes':
        return esMismoMes(fecha, hoy);
      default:
        return true;
    }
  });
  
  return resultados;
}

export default function Stats() {
  const [statsData, setStatsData] = useState(null);
  const [historicoData, setHistoricoData] = useState([]);
  const [periodo, setPeriodo] = useState('dia');
  const [limite, setLimite] = useState(20);
  const [ultimoRegistro, setUltimoRegistro] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchStats = useCallback(() => arduinoAPI.getStats(), []);
  const { data: stats } = usePolling(fetchStats, 60000);

  const fetchHistorico = useCallback(() => arduinoAPI.getHistorico(), []);
  const { data: historico } = usePolling(fetchHistorico, 30000);

  const fetchUltimo = useCallback(() => arduinoAPI.getUltimo(), []);
  const { data: ultimo } = usePolling(fetchUltimo, 10000);

  useEffect(() => {
    if (stats) setStatsData(stats);
  }, [stats]);

  useEffect(() => {
    if (historico && Array.isArray(historico)) {
      console.log(`📊 Stats: ${historico.length} registros totales en BD`);
      setHistoricoData(historico);
    }
  }, [historico]);

  useEffect(() => {
    if (ultimo?.datos) setUltimoRegistro(ultimo.datos);
  }, [ultimo]);

  const historicoFiltrado = useMemo(() => {
    if (historicoData.length === 0) return [];
    return filtrarPorPeriodo(historicoData, periodo);
  }, [historicoData, periodo]);

  useEffect(() => {
    if (historico !== undefined && stats !== undefined) setLoading(false);
  }, [historico, stats]);

  if (loading) {
    return (
      <div className={styles.loading}>
        <div className={styles.spinner} />
        <p>Cargando estadísticas...</p>
      </div>
    );
  }

  console.log('📊 Stats - Pasando a HistoricoTable:', historicoData.length, 'registros');
  console.log('📊 Primeros 5 registros que recibe la tabla:');
  historicoData.slice(0, 5).forEach((r, i) => {
    console.log(`  ${i+1}. ${r.FECHA} - ${r.LUZ}`);
  });
  console.log('📊 Últimos 5 registros (para ver el orden):');
  historicoData.slice(-5).forEach((r, i) => {
    console.log(`  ${i+1}. ${r.FECHA} - ${r.LUZ}`);
  });

  return (
    <div className={styles.stats}>
      <div className={styles.header}>
        <div className={styles.titleSection}>
          <h1 className={styles.title}>Estadísticas y Análisis</h1>
          <p className={styles.subtitle}>Datos desde SQL Server</p>
        </div>
        <Link to="/modulos/luminarias" className={styles.backButton}>
          <span>←</span> Volver al Dashboard
        </Link>
      </div>

      <div className={styles.dataInfo}>
        <span className={styles.dataInfoBadge}>📊 Total en BD: {historicoData.length} registros</span>
        <span className={styles.dataInfoBadge}>
          📅 {periodo === 'dia' ? 'Hoy' : periodo === 'semana' ? 'Esta semana' : 'Este mes'}: {historicoFiltrado.length} registros
        </span>
      </div>

      <StatsSummary historicoData={historicoFiltrado} statsData={statsData} />

      {ultimoRegistro && (
        <div className={styles.lastRecord}>
          <h3 className={styles.sectionTitle}>🕐 Último Registro</h3>
          <div className={styles.lastRecordGrid}>
            <div className={styles.lastRecordItem}>
              <span>Fecha:</span>
              <strong>{formatDateTimeLocal(ultimoRegistro.FECHA)}</strong>
            </div>
            <div className={styles.lastRecordItem}>
              <span>Luz:</span>
              <strong>{ultimoRegistro.LUZ?.toFixed(1)} lux</strong>
            </div>
          </div>
        </div>
      )}

      <div className={styles.periodSelectorContainer}>
        <span className={styles.selectorLabel}>Período:</span>
        <div className={styles.periodSelector}>
          {['dia', 'semana', 'mes'].map(p => (
            <button key={p} className={`${styles.periodButton} ${periodo === p ? styles.active : ''}`} onClick={() => setPeriodo(p)}>
              {p === 'dia' ? 'Día' : p === 'semana' ? 'Semana' : 'Mes'}
            </button>
          ))}
        </div>
      </div>

      <div className={styles.chartsGrid}>
        <div className={styles.chartCard}>
          <h3 className={styles.chartTitle}>📈 Evolución de Luz</h3>
          <LightChart data={historicoFiltrado} periodo={periodo} />
        </div>
        <div className={styles.chartCard}>
          <h3 className={styles.chartTitle}>📊 Uso de Relés</h3>
          <RelayUsageChart stats={statsData} />
        </div>
      </div>

      <div className={styles.limitSelectorContainer}>
        <span className={styles.selectorLabel}>Mostrar:</span>
        <div className={styles.limitSelector}>
          {[20, 50, 100].map(lim => (
            <button key={lim} className={`${styles.limitButton} ${limite === lim ? styles.active : ''}`} onClick={() => setLimite(lim)}>
              {lim}
            </button>
          ))}
        </div>
      </div>

      <div className={styles.tablesGrid}>
        <div className={styles.tableColumn}>
          <RelayStatsTable stats={statsData} />
        </div>
        <div className={styles.tableColumn}>
          {/* IMPORTANTE: Usar historicoData (todos los registros) no historicoFiltrado */}
          <HistoricoTable historico={historicoData} limit={limite} />
        </div>
      </div>

      <SearchSection />
    </div>
  );
}