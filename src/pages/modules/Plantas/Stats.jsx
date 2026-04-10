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
// FUNCIONES DE VALIDACIÓN (SIN conversión)
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

function formatDateTimeLocal(isoString) {
  if (!isoString) return '--/--/---- --:--';
  if (!esFechaValida(isoString)) return '--/--/---- --:--';
  
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

// ==========================================
// FUNCIÓN PARA FILTRAR POR PERÍODO (SIN conversión)
// ==========================================
function filtrarPorPeriodo(data, periodo) {
  if (!data || data.length === 0) return [];
  
  const ahoraLocal = new Date();
  const añoActual = ahoraLocal.getFullYear();
  const mesActual = ahoraLocal.getMonth();
  const diaActual = ahoraLocal.getDate();
  
  // Inicio de semana (Lunes)
  const diaSemanaActual = ahoraLocal.getDay();
  let inicioSemana = new Date(ahoraLocal);
  if (diaSemanaActual === 0) {
    inicioSemana.setDate(ahoraLocal.getDate() - 6);
  } else {
    inicioSemana.setDate(ahoraLocal.getDate() - (diaSemanaActual - 1));
  }
  inicioSemana.setHours(0, 0, 0, 0);
  
  // Fin de semana (Domingo)
  let finSemana = new Date(inicioSemana);
  finSemana.setDate(inicioSemana.getDate() + 6);
  finSemana.setHours(23, 59, 59, 999);
  
  console.log(`📅 Filtrando ${periodo} - Hoy: ${ahoraLocal.toLocaleString()}`);
  
  return data.filter(item => {
    if (!item?.FECHA) return false;
    if (!esFechaValida(item.FECHA)) return false;
    
    const fechaItem = new Date(item.FECHA);
    
    switch(periodo) {
      case 'dia':
        return fechaItem.getFullYear() === añoActual &&
               fechaItem.getMonth() === mesActual &&
               fechaItem.getDate() === diaActual;
      case 'semana':
        return fechaItem >= inicioSemana && fechaItem <= finSemana;
      case 'mes':
        return fechaItem.getFullYear() === añoActual &&
               fechaItem.getMonth() === mesActual;
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
      const datosValidos = historico.filter(item => esFechaValida(item?.FECHA));
      console.log(`📊 Stats: ${historico.length} registros, ${datosValidos.length} válidos`);
      setHistoricoData(datosValidos);
    }
  }, [historico]);

  useEffect(() => {
    if (ultimo?.datos && esFechaValida(ultimo.datos.FECHA)) {
      setUltimoRegistro(ultimo.datos);
    }
  }, [ultimo]);

  const historicoFiltrado = useMemo(() => {
    if (historicoData.length === 0) return [];
    const filtrados = filtrarPorPeriodo(historicoData, periodo);
    console.log(`📊 Período ${periodo}: ${filtrados.length} registros filtrados`);
    return filtrados;
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

      <div className={styles.dataInfo}>
        <span className={styles.dataInfoBadge}>📊 Total: {historicoData.length} registros</span>
        <span className={styles.dataInfoBadge}>
          📅 {periodo === 'dia' ? 'Hoy' : periodo === 'semana' ? 'Esta semana' : 'Este mes'}: {historicoFiltrado.length}
        </span>
      </div>

      <StatsSummary historicoData={historicoFiltrado} statsData={statsData} />

      {ultimoRegistro && (
        <div className={styles.lastRecord}>
          <h3 className={styles.sectionTitle}>🕐 Último Registro</h3>
          <div className={styles.lastRecordGrid}>
            <div className={styles.lastRecordItem}>
              <span className={styles.lastRecordLabel}>Fecha:</span>
              <span className={styles.lastRecordValue}>{formatDateTimeLocal(ultimoRegistro.FECHA)}</span>
            </div>
            <div className={styles.lastRecordItem}>
              <span className={styles.lastRecordLabel}>Luz:</span>
              <span className={styles.lastRecordValue}>{ultimoRegistro.LUZ?.toFixed(1)} lux</span>
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
          <h3 className={styles.chartTitle}>📈 Evolución de Luz {periodo === 'dia' ? '(Hoy)' : periodo === 'semana' ? '(Esta semana)' : '(Este mes)'}</h3>
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
          <HistoricoTable historico={historicoFiltrado.length > 0 ? historicoFiltrado : historicoData} limit={limite} />
        </div>
      </div>

      <SearchSection />
    </div>
  );
}