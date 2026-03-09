import { useCallback, useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { arduinoAPI } from '../../../api/arduino';
import { usePolling, useMutation } from '../../../hooks/useAsync';
import { useMode } from '../../../context/ModeContext';
import styles from './styles/StyleDashboard/DashIndex';

const RELAY_LABELS = [
  'Anaquel 1', 'Anaquel 2', 'Anaquel 3', 'Anaquel 4',
  'Anaquel 5', 'Anaquel 6', 'Anaquel 7', 'Anaquel 8',
];

function formatTime(isoString) {
  if (!isoString) return '--:--:--';
  const fecha = new Date(isoString);
  const horas = fecha.getUTCHours().toString().padStart(2, '0');
  const minutos = fecha.getUTCMinutes().toString().padStart(2, '0');
  const segundos = fecha.getUTCSeconds().toString().padStart(2, '0');
  return `${horas}:${minutos}:${segundos}`;
}

function formatDate(isoString) {
  if (!isoString) return '----/--/--';
  const fecha = new Date(isoString);
  const año = fecha.getUTCFullYear();
  const mes = (fecha.getUTCMonth() + 1).toString().padStart(2, '0');
  const dia = fecha.getUTCDate().toString().padStart(2, '0');
  return `${año}/${mes}/${dia}`;
}

// ─── Componentes internos ─────────────────────────────────────────────────

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

function LightMeter({ lux }) {
  const pct = Math.min(Math.max((lux / 5000) * 100, 0), 100);
  const color = lux > 1000 ? 'var(--green)' : lux > 300 ? 'var(--amber)' : 'var(--text-muted)';
  
  return (
    <div className={styles.lightMeter}>
      <div className={styles.lightHeader}>
        <span className={styles.lightTitle}>Sensor BH1750</span>
        <span className={styles.lightValue} style={{ color }}>
          {lux?.toFixed(1) ?? '--'} <span className={styles.lightUnit}>lux</span>
        </span>
      </div>
      <div className={styles.lightTrack}>
        <div 
          className={styles.lightFill} 
          style={{ width: `${pct}%`, backgroundColor: color }} 
        />
      </div>
      <div className={styles.lightScale}>
        <span>0</span>
        <span>1000</span>
        <span>2500</span>
        <span>5000+</span>
      </div>
    </div>
  );
}

// ==========================================
// BARRA DE CONFIRMACIÓN MEJORADA - VERSIÓN 2.0
// ==========================================
function ConfirmationBar({ lastAction }) {
  const defaultMessage = '⚪ Sistema listo - Esperando acciones...';
  
  const getStatusColor = () => {
    if (!lastAction || lastAction.status === 'idle') return 'var(--text-muted)';
    switch(lastAction.status) {
      case 'success': return 'var(--green)';
      case 'error': return 'var(--red)';
      case 'pending': return '#FFA500';
      default: return 'var(--text-muted)';
    }
  };

  const getStatusIcon = () => {
    if (!lastAction || lastAction.status === 'idle') return '⚪';
    switch(lastAction.status) {
      case 'success': return '✅';
      case 'error': return '❌';
      case 'pending': return '⏳';
      default: return '⚪';
    }
  };

  // Calcular tiempo transcurrido para acciones pendientes
  const getElapsedTime = () => {
    if (!lastAction || lastAction.status !== 'pending' || !lastAction.timestamp) return '';
    const elapsed = Date.now() - lastAction.timestamp;
    if (elapsed < 1000) return `${elapsed}ms`;
    return `${(elapsed/1000).toFixed(1)}s`;
  };

  const getMessage = () => {
    if (!lastAction) return defaultMessage;
    return lastAction.message;
  };

  return (
    <div className={styles.confirmationBar} style={{ borderLeftColor: getStatusColor() }}>
      <span className={styles.confirmationIcon}>{getStatusIcon()}</span>
      <span className={styles.confirmationText}>
        {getMessage()}
        {lastAction?.responseTime && (
          <span className={styles.responseTime}> ({lastAction.responseTime}ms)</span>
        )}
      </span>
      <span className={styles.confirmationTime}>
        {new Date().toLocaleTimeString()}
        {lastAction?.status === 'pending' && (
          <span className={styles.elapsedTime}> ⏱️ {getElapsedTime()}</span>
        )}
      </span>
    </div>
  );
}

function ModeControl({ mode, onSwitchToAuto, onSwitchToManual, loading }) {
  const isAuto = mode === 'auto' || mode === 'automatic';
  const isManual = mode === 'manual';
  
  return (
    <div className={styles.modeControl}>
      <span className={styles.modeLabel}>⚡ Modo de Operación</span>
      <div className={styles.modeButtons}>
        <button
          className={`${styles.modeButton} ${isAuto ? styles.modeAutoActive : ''}`}
          onClick={onSwitchToAuto}
          disabled={loading}
        >
          <span className={styles.modeIcon}>🤖</span>
          <span>Automático</span>
        </button>
        <button
          className={`${styles.modeButton} ${isManual ? styles.modeManualActive : ''}`}
          onClick={onSwitchToManual}
          disabled={loading}
        >
          <span className={styles.modeIcon}>👆</span>
          <span>Manual</span>
        </button>
      </div>
      <div className={`${styles.modeStatus} ${isManual ? styles.modeStatusManual : ''}`}>
        {isAuto ? (
          <>✨ Modo automático activado - Ciclos encendidos</>
        ) : (
          <>👆 Control manual activado - Ciclos desactivados</>
        )}
      </div>
    </div>
  );
}

// RelayCard
function RelayCard({ index, label, isOn, onToggle, disabled }) {
  return (
    <div className={`${styles.relayCard} ${isOn ? styles.relayOn : ''}`}>
      <div className={styles.relayHeader}>
        <span className={styles.relayIndex}>R{index + 1}</span>
        <span className={`${styles.relayStatus} ${isOn ? styles.relayStatusOn : ''}`}>
          {isOn ? 'ON' : 'OFF'}
        </span>
      </div>
      <div className={styles.relayLabel}>{label}</div>
      <button
        className={`${styles.relayToggle} ${isOn ? styles.relayToggleOn : ''}`}
        onClick={() => onToggle(index, isOn ? 'off' : 'on')}
        disabled={disabled}
        aria-label={`${isOn ? 'Apagar' : 'Encender'} ${label}`}
      >
        <span className={styles.relayThumb} />
      </button>
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

// ─── Componente principal ─────────────────────────────────────────────────

export default function Dashboard() {
  const { mode, switchToAuto, switchToManual, loading: modeLoading, fetchMode } = useMode();
  
  const [relayState, setRelayState] = useState(null);
  const [sdInfo, setSdInfo] = useState({ ok: true, fails: 0 });
  const [lastAction, setLastAction] = useState({ 
    status: 'idle', 
    message: '⚪ Sistema listo - Esperando acciones...',
    timestamp: Date.now()
  });
  
  // Polling de datos
  const fetchStatus = useCallback(() => arduinoAPI.getStatus(), []);
  const { data: arduinoData, error: arduinoError, loading: arduinoLoading } = usePolling(fetchStatus, 8000);

  const fetchUltimo = useCallback(() => arduinoAPI.getUltimo(), []);
  const { data: sqlData } = usePolling(fetchUltimo, 30000);

  // Efecto para actualizar estados
  useEffect(() => {
    if (arduinoData) {
      if (arduinoData.relays) {
        const states = arduinoData.relays.map(r => r.state);
        setRelayState(states);
      }
      
      setSdInfo({
        ok: arduinoData.sd_ok,
        fails: arduinoData.sd_fails || 0
      });
    }
  }, [arduinoData]);

  // Fallback a SQL
  const displayRelays = relayState ?? (sqlData?.datos
    ? [0,1,2,3,4,5,6,7].map(i => sqlData.datos[`RELE${i}`] === 'ON')
    : Array(8).fill(false));

  // ==========================================
  // MUTACIONES CON RESPUESTA INMEDIATA (MEJORADAS)
  // ==========================================
  
  // Cambiar modo MANUAL
  const handleManualClick = () => {
    switchToManual();
    const actionId = Date.now();
    
    setLastAction({
      status: 'pending',
      message: '⏳ Cambiando a modo manual...',
      timestamp: actionId
    });
    
    fetch(`${import.meta.env.VITE_API_URL}/arduino-plantas/mode`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ mode: 'manual' })
    })
    .then(response => response.json())
    .then(data => {
      console.log('✅ Modo manual confirmado:', data);
      const responseTime = Date.now() - actionId;
      setLastAction({
        status: 'success',
        message: `✅ Modo manual activado (${responseTime}ms)`,
        responseTime,
        timestamp: Date.now()
      });
      setTimeout(() => fetchMode(), 500);
    })
    .catch(error => {
      console.error('❌ Error cambiando a manual:', error);
      setLastAction({
        status: 'error',
        message: '❌ Error al cambiar a modo manual',
        timestamp: Date.now()
      });
    });
  };

  // Cambiar modo AUTO
  const handleAutoClick = () => {
    switchToAuto();
    const actionId = Date.now();
    
    setLastAction({
      status: 'pending',
      message: '⏳ Cambiando a modo automático...',
      timestamp: actionId
    });
    
    fetch(`${import.meta.env.VITE_API_URL}/arduino-plantas/mode`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ mode: 'auto' })
    })
    .then(response => response.json())
    .then(data => {
      console.log('✅ Modo auto confirmado:', data);
      const responseTime = Date.now() - actionId;
      setLastAction({
        status: 'success',
        message: `✅ Modo automático activado - Ciclos encendidos (${responseTime}ms)`,
        responseTime,
        timestamp: Date.now()
      });
      setTimeout(() => fetchMode(), 500);
    })
    .catch(error => {
      console.error('❌ Error cambiando a auto:', error);
      setLastAction({
        status: 'error',
        message: '❌ Error al cambiar a modo automático',
        timestamp: Date.now()
      });
    });
  };

  // Control de relé - VERSIÓN MEJORADA PARA INTERNET
  const handleToggle = (index, action) => {
    const newState = action === 'on';
    const relayNum = index + 1;
    const relayName = RELAY_LABELS[index];
    const actionId = Date.now();
    
    console.log(`🔍 [Dashboard] handleToggle: relé ${relayNum} -> ${newState ? 'ON' : 'OFF'}`);
    
    // Actualización visual INMEDIATA
    setRelayState(prev => {
      if (!prev) return prev;
      const next = [...prev];
      next[index] = newState;
      return next;
    });

    setLastAction({
      status: 'pending',
      message: `⏳ ${relayName}: ${newState ? 'Encendiendo' : 'Apagando'}...`,
      timestamp: actionId
    });

    fetch(`${import.meta.env.VITE_API_URL}/arduino-plantas/relay`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ relay: relayNum, state: newState })
    })
    .then(response => response.json())
    .then(data => {
      console.log('✅ Relé confirmado:', data);
      const responseTime = Date.now() - actionId;
      setLastAction({
        status: 'success',
        message: `✅ ${relayName}: ${newState ? 'Encendido' : 'Apagado'} (${responseTime}ms)`,
        responseTime,
        timestamp: Date.now()
      });
    })
    .catch(error => {
      console.error('❌ Error en relé:', error);
      setLastAction({
        status: 'error',
        message: `❌ ${relayName}: Error de conexión - reintentando...`,
        timestamp: Date.now()
      });
      
      // Reintentar después de 2 segundos
      setTimeout(() => {
        fetch(`${import.meta.env.VITE_API_URL}/arduino-plantas/relay`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ relay: relayNum, state: newState })
        })
        .then(response => response.json())
        .then(data => {
          const retryTime = Date.now() - actionId;
          setLastAction({
            status: 'success',
            message: `✅ ${relayName}: ${newState ? 'Encendido' : 'Apagado'} (reintento: ${retryTime}ms)`,
            responseTime: retryTime,
            timestamp: Date.now()
          });
        })
        .catch(() => {
          setLastAction({
            status: 'error',
            message: `❌ ${relayName}: Error permanente - revisa conexión`,
            timestamp: Date.now()
          });
          
          // Revertir el estado visual
          setTimeout(() => {
            setRelayState(prev => {
              if (!prev) return prev;
              const next = [...prev];
              next[index] = !newState;
              return next;
            });
          }, 2000);
        });
      }, 2000);
    });
  };

  const activeCount = displayRelays ? displayRelays.filter(Boolean).length : 0;
  const luxValue = arduinoData?.lux ?? sqlData?.datos?.LUZ ?? 0;
  const lastUpdated = sqlData?.datos?.FECHA;

  return (
    <div className={styles.dashboard}>
      {/* Cabecera */}
      <div className={styles.header}>
        <div className={styles.titleSection}>
          <h1 className={styles.title}>Control de Luminarias</h1>
          <p className={styles.subtitle}>Sistema de 8 relés con sensor BH1750</p>
        </div>
        <div className={styles.actions}>
          <Link to="/modulos/luminarias/ciclos" className={styles.actionButton}>
            <span className={styles.actionIcon}>🔄</span>
            Gestionar Ciclos
          </Link>
          <Link to="/modulos/luminarias/estadisticas" className={styles.actionButton}>
            <span className={styles.actionIcon}>📊</span>
            Ver Estadísticas
          </Link>
          <Link to="/modulos/luminarias/comparativa" className={styles.actionButton}>
            <span className={styles.actionIcon}>📈</span>
            Comparativa
          </Link>
        </div>
      </div>

      {/* Barra de estado */}
      <div className={styles.statusBar}>
        <ConnectionBadge 
          connected={!arduinoError && !arduinoLoading} 
          label="Arduino 192.168.3.241"
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

      {/* Barra de confirmación mejorada */}
      <ConfirmationBar lastAction={lastAction} />

      {/* Banner de modo manual */}
      {mode === 'manual' && (
        <div className={styles.manualModeBanner}>
          <div className={styles.manualModeIcon}>⚠️</div>
          <div className={styles.manualModeContent}>
            <strong>⚠️ Modo Manual Activado</strong>
            <p>Los ciclos automáticos están desactivados. Los relés solo responden a control manual.</p>
          </div>
          <button
            className={styles.autoModeButton}
            onClick={handleAutoClick}
            disabled={modeLoading}
          >
            {modeLoading ? 'Cambiando...' : 'Cambiar a Automático'}
          </button>
        </div>
      )}

      {/* Panel principal */}
      <div className={styles.mainPanel}>
        <div className={styles.statsPanel}>
          <div className={styles.statCard}>
            <span className={styles.statLabel}>Relés activos</span>
            <span className={styles.statValue}>
              {activeCount} <span className={styles.statUnit}>/ 8</span>
            </span>
            <div className={styles.statProgress}>
              <div 
                className={styles.statProgressFill}
                style={{ width: `${(activeCount / 8) * 100}%` }}
              />
            </div>
          </div>
          
          <LightMeter lux={luxValue} />
          
          <ModeControl 
            mode={mode}
            onSwitchToAuto={handleAutoClick}
            onSwitchToManual={handleManualClick}
            loading={modeLoading}
          />
        </div>

        {/* Grid de relés */}
        <div className={styles.relaySection}>
          <div className={styles.relayHeader}>
            <h2 className={styles.relayTitle}>Control de Relés</h2>
            <span className={styles.relayHint}>Click para encender/apagar</span>
          </div>
          <div className={styles.relayGrid}>
            {displayRelays.map((isOn, i) => (
              <RelayCard
                key={i}
                index={i}
                label={RELAY_LABELS[i]}
                isOn={isOn}
                onToggle={handleToggle}
                disabled={false}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}