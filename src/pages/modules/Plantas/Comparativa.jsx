// src/pages/modules/Plantas/Comparativa.jsx
import { useState, useEffect, useCallback, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { arduinoAPI } from '../../../api/arduino';
import { usePolling } from '../../../hooks/useAsync';
import LightChart from '../../../components/charts/LightChart';
import HistoricoTable from './components/HistoricoTable';
import styles from './Comparativa.module.css';

// ==========================================
// CONSTANTES Y UTILIDADES
// ==========================================
const ZONA_HORARIA = -6; // GMT-6 (México)
const MS_POR_HORA = 60 * 60 * 1000;

// Función de formato segura (con validación de fecha)
const formatDateTime = (isoString) => {
  if (!isoString) return '--/--/---- --:--';
  
  let fecha;
  try {
    fecha = new Date(isoString);
    // Verificar si la fecha es válida
    if (isNaN(fecha.getTime())) {
      return '--/--/---- --:--';
    }
  } catch (error) {
    console.error('Error parsing date:', isoString);
    return '--/--/---- --:--';
  }
  
  const año = fecha.getUTCFullYear();
  const mes = (fecha.getUTCMonth() + 1).toString().padStart(2, '0');
  const dia = fecha.getUTCDate().toString().padStart(2, '0');
  const horas = fecha.getUTCHours().toString().padStart(2, '0');
  const minutos = fecha.getUTCMinutes().toString().padStart(2, '0');
  const segundos = fecha.getUTCSeconds().toString().padStart(2, '0');
  return `${año}/${mes}/${dia} ${horas}:${minutos}:${segundos}`;
};

// Función para convertir UTC a hora local (segura)
const convertirUtcALocal = (timestamp) => {
  if (!timestamp) {
    console.warn('Timestamp vacío en convertirUtcALocal');
    return new Date();
  }
  
  try {
    const fechaUTC = new Date(timestamp);
    if (isNaN(fechaUTC.getTime())) {
      console.warn('Fecha inválida en convertirUtcALocal:', timestamp);
      return new Date();
    }
    return new Date(fechaUTC.getTime() + (ZONA_HORARIA * MS_POR_HORA));
  } catch (error) {
    console.error('Error en convertirUtcALocal:', error);
    return new Date();
  }
};

// ==========================================
// FILTROS CORREGIDOS
// ==========================================
const filtrarPorPeriodo = (data, periodo) => {
  if (!data?.length) return [];
  
  const ahora = new Date();
  const hoy = new Date(Date.UTC(ahora.getUTCFullYear(), ahora.getUTCMonth(), ahora.getUTCDate()));
  
  return data.filter(item => {
    // Validar que item.FECHA existe y es válido
    if (!item?.FECHA) return false;
    
    let fechaItem;
    try {
      fechaItem = new Date(item.FECHA);
      if (isNaN(fechaItem.getTime())) return false;
    } catch (error) {
      console.error('Error parseando fecha en filtro:', item.FECHA);
      return false;
    }
    
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
};

// ==========================================
// COMPONENTE DE TABLA ARDUINO
// ==========================================
const ArduinoStatusTable = ({ arduinoData }) => {
  if (!arduinoData) return null;

  return (
    <div className={styles.tableSection}>
      <h3 className={styles.sectionTitle}>
        <span className={styles.sectionIcon}>🔌</span>
        Estado Actual del Arduino
      </h3>
      <div className={styles.tableContainer}>
        <table className={styles.dataTable}>
          <thead>
            <tr>
              <th>Relé</th>
              <th>Estado</th>
              <th>Modo</th>
              <th>Luz</th>
              <th>SD</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td colSpan="5" style={{ padding: '0.5rem', background: 'var(--bg-raised)' }}>
                <div className={styles.relayGrid}>
                  {arduinoData.relays?.map((relay) => (
                    <div 
                      key={`relay-${relay.id}`} 
                      className={`${styles.relayItem} ${relay.state ? styles.on : ''}`}
                    >
                      <div className={styles.relayNumber}>R{relay.id}</div>
                      <div className={`${styles.relayState} ${relay.state ? styles.on : styles.off}`}>
                        {relay.state ? 'ON' : 'OFF'}
                      </div>
                    </div>
                  ))}
                </div>
              </td>
            </tr>
            <tr>
              <td colSpan="2"><strong>Luz:</strong> {arduinoData.lux?.toFixed(1)} lux</td>
              <td colSpan="2"><strong>Modo:</strong> {arduinoData.mode === 'auto' ? 'Automático' : 'Manual'}</td>
              <td><strong>SD:</strong> {arduinoData.sd_ok ? '✅ OK' : '❌ Error'} ({arduinoData.sd_fails || 0})</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
};

// ==========================================
// COMPONENTE PRINCIPAL
// ==========================================
export default function Comparativa() {
  const [historicoData, setHistoricoData] = useState([]);
  const [arduinoData, setArduinoData] = useState(null);
  const [ultimoSQL, setUltimoSQL] = useState(null);
  const [historicoArduino, setHistoricoArduino] = useState([]);
  const [periodo, setPeriodo] = useState('dia');

  // ==========================================
  // POLLING DE DATOS
  // ==========================================
  const fetchHistorico = useCallback(() => arduinoAPI.getHistorico(), []);
  const { data: historico } = usePolling(fetchHistorico, 30000);

  const fetchStatus = useCallback(() => arduinoAPI.getStatus(), []);
  const { data: status } = usePolling(fetchStatus, 8000);

  const fetchUltimo = useCallback(() => arduinoAPI.getUltimo(), []);
  const { data: ultimo } = usePolling(fetchUltimo, 10000);

  // ==========================================
  // EFECTOS PARA ACTUALIZAR DATOS
  // ==========================================
  useEffect(() => {
    if (historico) setHistoricoData(historico);
  }, [historico]);

  useEffect(() => {
    if (status) {
      setArduinoData(status);
      const timestamp = status.timestamp || new Date().toISOString();
      // Validar timestamp antes de usar
      let fechaLocal;
      try {
        fechaLocal = convertirUtcALocal(timestamp);
      } catch (error) {
        console.error('Error convirtiendo timestamp:', timestamp);
        fechaLocal = new Date();
      }
      
      setHistoricoArduino(prev => {
        const newItem = { FECHA: fechaLocal.toISOString(), LUZ: status.lux };
        return [newItem, ...prev].slice(0, 20);
      });
    }
  }, [status]);

  useEffect(() => {
    if (ultimo) {
      const datos = ultimo.datos || ultimo.data?.datos || 
                    (Array.isArray(ultimo) ? ultimo[0] : ultimo);
      setUltimoSQL(datos);
    }
  }, [ultimo]);

  // ==========================================
  // DATOS FILTRADOS CON useMemo
  // ==========================================
  const historicoFiltrado = useMemo(() => 
    filtrarPorPeriodo(historicoData, periodo), 
    [historicoData, periodo]
  );

  const historicoArduinoFiltrado = useMemo(() => 
    filtrarPorPeriodo(historicoArduino, periodo), 
    [historicoArduino, periodo]
  );

  // ==========================================
  // CÁLCULOS
  // ==========================================
  const diferencia = useMemo(() => {
    if (!arduinoData || !ultimoSQL) return null;
    const difLux = Math.abs(arduinoData.lux - (ultimoSQL.LUZ || 0)).toFixed(1);
    return { difLux, estadoOK: difLux < 50 };
  }, [arduinoData, ultimoSQL]);

  // ==========================================
  // RENDER
  // ==========================================
  return (
    <div className={styles.comparativa}>
      {/* Header */}
      <div className={styles.header}>
        <div className={styles.titleSection}>
          <h1 className={styles.title}>Comparativa Arduino vs SQL</h1>
          <p className={styles.subtitle}>Verificación de sincronización de datos</p>
        </div>
        <Link to="/modulos/luminarias" className={styles.backButton}>
          <span>←</span> Volver al Dashboard
        </Link>
      </div>

      {/* Status Cards */}
      <div className={styles.statusCards}>
        {/* Arduino Card */}
        <div className={`${styles.statusCard} ${arduinoData ? styles.online : styles.offline}`}>
          <div className={styles.statusIcon}>🔌</div>
          <div className={styles.statusContent}>
            <span className={styles.statusLabel}>Arduino (Tiempo Real)</span>
            <span className={styles.statusValue}>
              {arduinoData ? 'Conectado' : 'Desconectado'}
            </span>
            {arduinoData && (
              <>
                <span className={styles.statusDetail}>
                  Luz: <strong>{arduinoData.lux?.toFixed(1)} lux</strong>
                </span>
                <span className={styles.statusDetail}>
                  Modo: {arduinoData.mode === 'auto' ? 'Automático' : 'Manual'}
                </span>
                <span className={styles.statusDetail}>
                  SD: {arduinoData.sd_ok ? '✅ OK' : '❌ Error'} ({arduinoData.sd_fails || 0} fallos)
                </span>
              </>
            )}
          </div>
        </div>

        {/* SQL Card */}
        <div className={`${styles.statusCard} ${ultimoSQL ? styles.online : styles.offline}`}>
          <div className={styles.statusIcon}>🗄️</div>
          <div className={styles.statusContent}>
            <span className={styles.statusLabel}>SQL Server (Último Registro)</span>
            <span className={styles.statusValue}>
              {ultimoSQL ? 'Datos disponibles' : 'Sin datos'}
            </span>
            {ultimoSQL ? (
              <>
                <span className={styles.statusDetail}>
                  Luz: <strong>{ultimoSQL.LUZ?.toFixed(1)} lux</strong>
                </span>
                <span className={styles.statusDetail}>
                  Fecha: {formatDateTime(ultimoSQL.FECHA)}
                </span>
                <span className={styles.statusDetail}>
                  Relés: {ultimoSQL.RELE0} {ultimoSQL.RELE1} {ultimoSQL.RELE2} {ultimoSQL.RELE3} ...
                </span>
              </>
            ) : (
              <span className={styles.statusDetail}>Esperando primer registro...</span>
            )}
          </div>
        </div>
      </div>

      {/* Diferencia */}
      {diferencia && (
        <div className={`${styles.comparacionCard} ${diferencia.estadoOK ? styles.ok : styles.warning}`}>
          <div className={styles.comparacionIcon}>
            {diferencia.estadoOK ? '✅' : '⚠️'}
          </div>
          <div className={styles.comparacionContent}>
            <h3 className={styles.comparacionTitle}>
              {diferencia.estadoOK ? 'Sincronización Correcta' : 'Discrepancia Detectada'}
            </h3>
            <p className={styles.comparacionText}>
              Diferencia de luz: <strong>{diferencia.difLux} lux</strong>
              {!diferencia.estadoOK && ' (fuera del rango esperado)'}
            </p>
            <p className={styles.comparacionHint}>
              {diferencia.estadoOK 
                ? 'Los datos del Arduino coinciden con los registros en SQL.'
                : 'Puede haber un retraso en la sincronización o un error de lectura.'}
            </p>
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

      {/* Grid principal */}
      <div className={styles.comparativaGrid}>
        {/* Columna Arduino */}
        <div className={styles.columnaArduino}>
          <div className={styles.chartSection}>
            <h2 className={styles.sectionTitle}>
              <span className={styles.sectionIcon}>🔌</span>
              Arduino 
              {periodo === 'dia' ? ' (Hoy)' : 
               periodo === 'semana' ? ' (Semana actual)' : 
               ' (Mes actual)'}
            </h2>
            <div className={styles.chartCard}>
              <LightChart data={historicoArduinoFiltrado} periodo={periodo} />
            </div>
          </div>
          <ArduinoStatusTable arduinoData={arduinoData} />
        </div>

        {/* Columna SQL */}
        <div className={styles.columnaSQL}>
          <div className={styles.chartSection}>
            <h2 className={styles.sectionTitle}>
              <span className={styles.sectionIcon}>🗄️</span>
              SQL Server
              {periodo === 'dia' ? ' (Hoy)' : 
               periodo === 'semana' ? ' (Semana actual)' : 
               ' (Mes actual)'}
            </h2>
            <div className={styles.chartCard}>
              <LightChart data={historicoFiltrado} periodo={periodo} />
            </div>
          </div>
          <HistoricoTable historico={historicoData} limit={20} />
        </div>
      </div>
    </div>
  );
}