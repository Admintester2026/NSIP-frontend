import { useState } from 'react';
import styles from '../../styles/IndexCyclesStyles';

const RELAY_LABELS = [
  'Anaquel 1', 'Anaquel 2', 'Anaquel 3', 'Anaquel 4',
  'Anaquel 5', 'Anaquel 6', 'Anaquel 7', 'Anaquel 8',
];

export default function CycleCard({ relayId, cycles, onEdit, onApplyToAll }) {
  const [showAllCycles, setShowAllCycles] = useState(false);
  const cyclesArray = Array.isArray(cycles) ? cycles : [];
  const activeCycles = cyclesArray.filter(c => c && c.enabled);
  const totalActive = activeCycles.length;
  const totalCycles = cyclesArray.length;
  
  // Encontrar el próximo ciclo activo (el más cercano)
  const getNextCycle = () => {
    if (activeCycles.length === 0) return null;
    const now = new Date();
    const currentHour = now.getHours();
    const currentMin = now.getMinutes();
    const currentTotal = currentHour * 60 + currentMin;
    
    let nextCycle = null;
    let minDiff = Infinity;
    
    activeCycles.forEach(cycle => {
      const [startH, startM] = cycle.start.split(':').map(Number);
      const startTotal = startH * 60 + startM;
      let diff = startTotal - currentTotal;
      if (diff < 0) diff += 24 * 60; // Si ya pasó, considerar próximo día
      
      if (diff < minDiff) {
        minDiff = diff;
        nextCycle = cycle;
      }
    });
    
    return nextCycle;
  };

  const nextCycle = getNextCycle();
  const displayCycles = showAllCycles ? cyclesArray : cyclesArray.slice(0, 4);

  return (
    <div className={styles.compactCard}>
      <div className={styles.compactHeader}>
        <div>
          <h4 className={styles.compactTitle}>R{relayId} - {RELAY_LABELS[relayId - 1]}</h4>
          <div className={styles.compactStats}>
            <span>{totalActive}/{totalCycles}</span>
            <span className={`${styles.statusDot} ${
              totalActive === 0 ? styles.statusInactive :
              totalActive === totalCycles ? styles.statusFull :
              styles.statusPartial
            }`}>
              {totalActive === 0 ? '⚪' : 
               totalActive === totalCycles ? '🟢' : '🟡'}
            </span>
          </div>
        </div>
        <button
          className={styles.compactApplyButton}
          onClick={() => onApplyToAll(relayId)}
          title="Aplicar a todos los relés"
        >
          📋
        </button>
      </div>

      <div className={styles.compactGrid}>
        {displayCycles.map((cycle, idx) => (
          <div
            key={`${relayId}-${idx}`}
            className={`${styles.compactItem} ${cycle?.enabled ? styles.active : ''}`}
            onClick={() => onEdit(relayId, idx, cycle || { start: '00:00', end: '00:00', enabled: false })}
          >
            <span className={styles.compactNumber}>C{idx + 1}</span>
            {cycle?.enabled ? (
              <span className={styles.compactTime}>{cycle.start}</span>
            ) : (
              <span className={styles.compactDisabled}>⏸️</span>
            )}
          </div>
        ))}
      </div>

      {cyclesArray.length > 4 && (
        <button 
          className={styles.showMoreCompact}
          onClick={() => setShowAllCycles(!showAllCycles)}
        >
          {showAllCycles ? '▲' : '▼'} {showAllCycles ? 'Ver menos' : 'Ver más'}
        </button>
      )}

      {nextCycle && (
        <div className={styles.compactFooter}>
          <span className={styles.nextCycle}>
            Próximo: {nextCycle.start}
          </span>
        </div>
      )}
    </div>
  );
}