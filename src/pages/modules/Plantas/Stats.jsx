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
// CONFIGURACIÓN DE ZONA HORARIA
// ==========================================
const ZONA_HORARIA = -6;
const MS_POR_HORA = 60 * 60 * 1000;

// ==========================================
// FUNCIONES DE VALIDACIÓN Y CONVERSIÓN
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

// Convertir UTC a Local (GMT-6)
function convertirUtcALocal(utcDateString) {
  const fechaUTC = new Date(utcDateString);
  return new Date(fechaUTC.getTime() + (ZONA_HORARIA * MS_POR_HORA));
}

function formatDateTime(isoString) {
  if (!isoString) return '--/--/---- --:--';
  if (!esFechaValida(isoString)) return '--/--/---- --:--';
  try {
    const fecha = convertirUtcALocal(isoString);
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
// FUNCIÓN PARA FILTRAR POR PERÍODO (usando hora local)
// ==========================================
function filtrarPorPeriodo(data, periodo) {
  if (!data || data.length === 0) return [];
  
  // Obtener fecha actual en LOCAL
  const ahoraLocal = new Date();
  const añoActual = ahoraLocal.getFullYear();
  const mesActual = ahoraLocal.getMonth();
  const diaActual = ahoraLocal.getDate();
  
  // Calcular inicio de semana (Lunes) en LOCAL
  const diaSemanaActual = ahoraLocal.getDay();
  let inicioSemana = new Date(ahoraLocal);
  if (diaSemanaActual === 0) {
    inicioSemana.setDate(ahoraLocal.getDate() - 6);
  } else {
    inicioSemana.setDate(ahoraLocal.getDate() - (diaSemanaActual - 1));
  }
  inicioSemana.setHours(0, 0, 0, 0);
  
  // Calcular fin de semana (Domingo) en LOCAL
  let finSemana = new Date(inicioSemana);
  finSemana.setDate(inicioSemana.getDate() + 6);
  finSemana.setHours(23, 59, 59, 999);
  
  console.log(`📅 Filtrando - Período: ${periodo}`);
  console.log(`📅 Fecha actual local: ${ahoraLocal.toLocaleString()}`);
  console.log(`📅 Semana: ${inicioSemana.toLocaleDateString()} - ${finSemana.toLocaleDateString()}`);
  
  const resultados = data.filter(item => {
    if (!item?.FECHA) return false;
    if (!esFechaValida(item.FECHA)) return false;
    
    // Convertir la fecha del registro a LOCAL
    const fechaLocal = convertirUtcALocal(item.FECHA);
    
    switch(periodo) {
      case 'dia':
        return fechaLocal.getFullYear() === añoActual &&
               fechaLocal.getMonth() === mesActual &&
               fechaLocal.getDate() === diaActual;
      case 'semana':
        return fechaLocal >= inicioSemana && fechaLocal <= finSemana;
      case 'mes':
        return fechaLocal.getFullYear() === añoActual &&
               fechaLocal.getMonth() === mesActual;
      default:
        return true;
    }
  });
  
  console.log(`📊 Registros encontrados para ${periodo}: ${resultados.length}`);
  return resultados;
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

  const historicoFiltrado = useMemo(() => {
    if (historicoData.length === 0) return [];
    return filtrarPorPeriodo(historicoData, periodo);
  }, [historicoData, periodo]);

  useEffect(() => {
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

      <div className={styles.dataInfo}>
        <span className={styles.dataInfoBadge}>📊 Total registros: {totalRegistros}</span>
        <span className={styles.dataInfoBadge}>
          📅 Período: {periodo === 'dia' ? 'Hoy' : periodo === 'semana' ? 'Esta semana' : 'Este mes'}
        </span>
        <span className={styles.dataInfoBadge}>🔍 Mostrando: {registrosFiltrados} registros</span>
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
              <span className={styles.lastRecordValue}>{formatDateTime(ultimoRegistro.FECHA)}</span>
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

      <div className={styles.chartsGrid}>
        <div className={styles.chartCard}>
          <h3 className={styles.chartTitle}>
            <span className={styles.chartIcon}>📈</span>
            Evolución de Luz 
            {periodo === 'dia' ? ' (Hoy)' : periodo === 'semana' ? ' (Esta semana)' : ' (Este mes)'}
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