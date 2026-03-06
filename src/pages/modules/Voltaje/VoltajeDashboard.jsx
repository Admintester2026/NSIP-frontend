import { useCallback, useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { voltajeAPI } from '../../../api/voltaje';
import { usePolling } from '../../../hooks/useAsync';
import VoltageCard from '../../../components/charts/Sensorvoltaje/VoltageCard';
import styles from './VoltajeDashboard.module.css';

function formatTime(isoString) {
  if (!isoString) return '--:--:--';
  const fecha = new Date(isoString);
  const horas = fecha.getHours().toString().padStart(2, '0');
  const minutos = fecha.getMinutes().toString().padStart(2, '0');
  const segundos = fecha.getSeconds().toString().padStart(2, '0');
  return `${horas}:${minutos}:${segundos}`;
}

function formatDate(isoString) {
  if (!isoString) return '----/--/--';
  const fecha = new Date(isoString);
  const año = fecha.getFullYear();
  const mes = (fecha.getMonth() + 1).toString().padStart(2, '0');
  const dia = fecha.getDate().toString().padStart(2, '0');
  return `${año}/${mes}/${dia}`;
}

function ConnectionBadge({ connected, label }) {
  const statusClass = connected ? styles.badgeOnline : styles.badgeOffline;
  const statusText = connected ? 'CONECTADO' : 'DESCONECTADO';
  
  return (
    <div className={`${styles.badge} ${statusClass}`}>
      <span className={styles.badgeDot} />
      <span className={styles.badgeLabel}>{label}</span>
      <span className={styles.badgeStatus}>{statusText}</span>
    </div>
  );
}

function SDStatus({ sdOK, sdFails }) {
  return (
    <div className={`${styles.sdBadge} ${sdOK ? styles.sdOK : styles.sdError}`}>
      <span className={styles.sdIcon}>💾</span>
      <span className={styles.sdText}>
        Tarjeta SD: {sdOK ? 'OK' : 'FALLO'}
        {sdFails > 0 && <span className={styles.sdFails}> ({sdFails} errores)</span>}
      </span>
    </div>
  );
}

export default function VoltajeDashboard() {
  const [arduinoData, setArduinoData] = useState(null);
  const [sqlData, setSqlData] = useState(null);
  const [lastUpdate, setLastUpdate] = useState(null);
  
  // Polling de datos del Arduino
  const fetchStatus = useCallback(() => voltajeAPI.getStatus(), []);
  const { data: status, error: arduinoError, loading: arduinoLoading } = usePolling(fetchStatus, 5000);

  // Polling de último registro SQL
  const fetchUltimo = useCallback(() => voltajeAPI.getUltimo(), []);
  const { data: ultimo } = usePolling(fetchUltimo, 10000);

  useEffect(() => {
    if (status) {
      setArduinoData(status);
      setLastUpdate(new Date());
    }
  }, [status]);

  useEffect(() => {
    if (ultimo) setSqlData(ultimo);
  }, [ultimo]);

  const fases = ['R', 'S', 'T'];
  const valores = {
    vR: arduinoData?.vR ?? sqlData?.V_R ?? 0,
    vS: arduinoData?.vS ?? sqlData?.V_S ?? 0,
    vT: arduinoData?.vT ?? sqlData?.V_T ?? 0
  };

  const sdInfo = {
    ok: arduinoData?.sd_ok ?? sqlData?.SD_STATUS === 'OK',
    fails: arduinoData?.sd_fails ?? 0
  };

  const lastUpdated = sqlData?.FECHA || (lastUpdate ? lastUpdate.toISOString() : null);

  const promedio = ((valores.vR + valores.vS + valores.vT) / 3).toFixed(1);

  return (
    <div className={styles.dashboard}>
      {/* Cabecera */}
      <div className={styles.header}>
        <div className={styles.titleSection}>
          <h1 className={styles.title}>Control de Voltaje</h1>
          <p className={styles.subtitle}>Monitoreo de 3 fases con ZMPT101B</p>
        </div>
        <div className={styles.actions}>
          <Link to="/modulos/voltaje/estadisticas" className={styles.actionButton}>
            <span className={styles.actionIcon}>📊</span>
            Estadísticas
          </Link>
          <Link to="/modulos/voltaje/historico" className={styles.actionButton}>
            <span className={styles.actionIcon}>📈</span>
            Histórico
          </Link>
        </div>
      </div>

      {/* Barra de estado */}
      <div className={styles.statusBar}>
        <ConnectionBadge 
          connected={!arduinoError && !arduinoLoading} 
          label="Arduino 192.168.3.50"
        />
        <ConnectionBadge 
          connected={!!sqlData} 
          label="SQL Server"
        />
        <SDStatus sdOK={sdInfo.ok} sdFails={sdInfo.fails} />
        {lastUpdated && (
          <div className={styles.lastUpdate}>
            <span className={styles.lastUpdateIcon}>📝</span>
            <span className={styles.lastUpdateText}>
              Último registro: {formatDate(lastUpdated)} {formatTime(lastUpdated)}
            </span>
          </div>
        )}
        {arduinoError && (
          <div className={styles.warning}>
            ⚠️ Arduino sin respuesta - Mostrando datos de BD
          </div>
        )}
      </div>

      {/* Panel principal */}
      <div className={styles.mainPanel}>
        <div className={styles.statsPanel}>
          <div className={styles.statCard}>
            <span className={styles.statLabel}>Promedio trifásico</span>
            <span className={styles.statValue}>
              {promedio} <span className={styles.statUnit}>V</span>
            </span>
            <div className={styles.statProgress}>
              <div 
                className={styles.statProgressFill}
                style={{ width: `${(promedio / 140) * 100}%` }}
              />
            </div>
          </div>
          
          <div className={styles.infoCard}>
            <h3 className={styles.infoTitle}>Rangos normales</h3>
            <div className={styles.infoGrid}>
              <div className={styles.infoItem}>
                <span className={styles.infoLabel}>Mínimo</span>
                <span className={styles.infoValue}>110 V</span>
              </div>
              <div className={styles.infoItem}>
                <span className={styles.infoLabel}>Máximo</span>
                <span className={styles.infoValue}>130 V</span>
              </div>
              <div className={styles.infoItem}>
                <span className={styles.infoLabel}>Crítico</span>
                <span className={styles.infoValue}>&lt;105 o &gt;135</span>
              </div>
            </div>
          </div>

          <div className={styles.infoCard}>
            <h3 className={styles.infoTitle}>Estado del sistema</h3>
            <div className={styles.statusList}>
              <div className={styles.statusItem}>
                <span className={styles.statusLabel}>Sensor R:</span>
                <span className={styles.statusValue} style={{ color: valores.vR > 0 ? 'var(--green)' : 'var(--text-muted)' }}>
                  {valores.vR > 0 ? '✅ Activo' : '⚪ Sin lectura'}
                </span>
              </div>
              <div className={styles.statusItem}>
                <span className={styles.statusLabel}>Sensor S:</span>
                <span className={styles.statusValue} style={{ color: valores.vS > 0 ? 'var(--green)' : 'var(--text-muted)' }}>
                  {valores.vS > 0 ? '✅ Activo' : '⚪ Sin lectura'}
                </span>
              </div>
              <div className={styles.statusItem}>
                <span className={styles.statusLabel}>Sensor T:</span>
                <span className={styles.statusValue} style={{ color: valores.vT > 0 ? 'var(--green)' : 'var(--text-muted)' }}>
                  {valores.vT > 0 ? '✅ Activo' : '⚪ Sin lectura'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Grid de voltajes */}
        <div className={styles.voltageSection}>
          <div className={styles.voltageHeader}>
            <h2 className={styles.voltageTitle}>Lecturas en tiempo real</h2>
            <span className={styles.voltageHint}>
              {arduinoData ? '🔴 Datos del Arduino' : '📚 Datos de BD'}
            </span>
          </div>
          <div className={styles.voltageGrid}>
            {fases.map((fase, i) => {
              const key = `v${fase}`;
              const valor = valores[key.toLowerCase()] || 0;
              return (
                <VoltageCard
                  key={fase}
                  index={i}
                  label={fase}
                  value={valor}
                />
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}