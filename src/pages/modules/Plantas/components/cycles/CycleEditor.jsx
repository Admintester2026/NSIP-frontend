// src/pages/modules/Plantas/components/cycles/CycleEditor.jsx
import { useState, useEffect } from 'react';
import styles from '../../styles/IndexCyclesStyles';

const HOURS = Array.from({ length: 24 }, (_, i) => i);
const MINUTES = [0, 15, 30, 45];

export default function CycleEditor({ 
  relayId, 
  cycleNumber, 
  initialData, 
  onSave, 
  onCancel,
  onApplyToAll 
}) {
  const [startHour, setStartHour] = useState(initialData?.startHour || 8);
  const [startMin, setStartMin] = useState(initialData?.startMin || 0);
  const [endHour, setEndHour] = useState(initialData?.endHour || 18);
  const [endMin, setEndMin] = useState(initialData?.endMin || 0);
  const [enabled, setEnabled] = useState(initialData?.enabled || false);
  const [inputMode, setInputMode] = useState('select');
  const [startTime, setStartTime] = useState(
    `${(initialData?.startHour || 8).toString().padStart(2, '0')}:${(initialData?.startMin || 0).toString().padStart(2, '0')}`
  );
  const [endTime, setEndTime] = useState(
    `${(initialData?.endHour || 18).toString().padStart(2, '0')}:${(initialData?.endMin || 0).toString().padStart(2, '0')}`
  );

  useEffect(() => {
    if (inputMode === 'manual') {
      setStartTime(`${startHour.toString().padStart(2, '0')}:${startMin.toString().padStart(2, '0')}`);
      setEndTime(`${endHour.toString().padStart(2, '0')}:${endMin.toString().padStart(2, '0')}`);
    }
  }, [inputMode, startHour, startMin, endHour, endMin]);

  const handleManualTimeChange = (setter, setTime) => (e) => {
    const value = e.target.value;
    setTime(value);
    
    const match = value.match(/^(\d{1,2}):(\d{1,2})$/);
    if (match) {
      let hour = parseInt(match[1]);
      let min = parseInt(match[2]);
      
      if (hour >= 0 && hour <= 23 && min >= 0 && min <= 59) {
        setter({ hour, min });
      }
    }
  };

  const handleSave = () => {
    if (!onSave || typeof onSave !== 'function') {
      console.error('❌ onSave no es una función válida');
      return;
    }
    
    const dataToSend = {
      relay: relayId,
      cycle: cycleNumber,
      start_h: startHour,
      start_m: startMin,
      end_h: endHour,
      end_m: endMin,
      enabled: enabled
    };
    
    console.log('🔍 CycleEditor enviando:', dataToSend);
    onSave(dataToSend);
  };

  const handleApplyToAll = () => {
    if (!onApplyToAll || typeof onApplyToAll !== 'function') {
      console.error('❌ onApplyToAll no es una función válida');
      return;
    }
    
    onApplyToAll(relayId, cycleNumber, {
      start_h: startHour,
      start_m: startMin,
      end_h: endHour,
      end_m: endMin,
      enabled
    });
  };

  return (
    <div className={styles.cycleEditor}>
      <div className={styles.editorHeader}>
        <h4 className={styles.editorTitle}>
          Ciclo {cycleNumber + 1} - Anaquel {relayId}
        </h4>
        <div className={styles.modeSelector}>
          <button
            className={`${styles.modeButton} ${inputMode === 'select' ? styles.active : ''}`}
            onClick={() => setInputMode('select')}
          >
            Selector
          </button>
          <button
            className={`${styles.modeButton} ${inputMode === 'manual' ? styles.active : ''}`}
            onClick={() => setInputMode('manual')}
          >
            Manual
          </button>
        </div>
      </div>
      
      <div className={styles.editorRow}>
        <label className={styles.editorLabel}>
          <input
            type="checkbox"
            checked={enabled}
            onChange={(e) => setEnabled(e.target.checked)}
            className={styles.editorCheckbox}
          />
          <span>Habilitar este ciclo</span>
        </label>
      </div>

      {inputMode === 'select' ? (
        <>
          <div className={styles.editorRow}>
            <div className={styles.timeSelector}>
              <span className={styles.timeLabel}>Inicio:</span>
              <select 
                value={startHour} 
                onChange={(e) => setStartHour(parseInt(e.target.value))}
                className={styles.timeSelect}
                disabled={!enabled}
              >
                {HOURS.map(h => (
                  <option key={h} value={h}>{h.toString().padStart(2, '0')}</option>
                ))}
              </select>
              <span className={styles.timeSeparator}>:</span>
              <select 
                value={startMin} 
                onChange={(e) => setStartMin(parseInt(e.target.value))}
                className={styles.timeSelect}
                disabled={!enabled}
              >
                {MINUTES.map(m => (
                  <option key={m} value={m}>{m.toString().padStart(2, '0')}</option>
                ))}
              </select>
            </div>
          </div>

          <div className={styles.editorRow}>
            <div className={styles.timeSelector}>
              <span className={styles.timeLabel}>Fin:</span>
              <select 
                value={endHour} 
                onChange={(e) => setEndHour(parseInt(e.target.value))}
                className={styles.timeSelect}
                disabled={!enabled}
              >
                {HOURS.map(h => (
                  <option key={h} value={h}>{h.toString().padStart(2, '0')}</option>
                ))}
              </select>
              <span className={styles.timeSeparator}>:</span>
              <select 
                value={endMin} 
                onChange={(e) => setEndMin(parseInt(e.target.value))}
                className={styles.timeSelect}
                disabled={!enabled}
              >
                {MINUTES.map(m => (
                  <option key={m} value={m}>{m.toString().padStart(2, '0')}</option>
                ))}
              </select>
            </div>
          </div>
        </>
      ) : (
        <>
          <div className={styles.editorRow}>
            <div className={styles.timeInputGroup}>
              <span className={styles.timeLabel}>Inicio:</span>
              <input
                type="text"
                value={startTime}
                onChange={handleManualTimeChange(
                  ({ hour, min }) => { setStartHour(hour); setStartMin(min); },
                  setStartTime
                )}
                placeholder="HH:MM"
                className={styles.timeInput}
                disabled={!enabled}
              />
            </div>
          </div>

          <div className={styles.editorRow}>
            <div className={styles.timeInputGroup}>
              <span className={styles.timeLabel}>Fin:</span>
              <input
                type="text"
                value={endTime}
                onChange={handleManualTimeChange(
                  ({ hour, min }) => { setEndHour(hour); setEndMin(min); },
                  setEndTime
                )}
                placeholder="HH:MM"
                className={styles.timeInput}
                disabled={!enabled}
              />
            </div>
          </div>
        </>
      )}

      <div className={styles.editorActions}>
        <button onClick={handleSave} className={styles.saveButton}>
          Guardar Ciclo
        </button>
        <button 
          onClick={handleApplyToAll} 
          className={styles.applyAllButton}
          disabled={!enabled}
        >
          Aplicar a Todos
        </button>
        <button onClick={onCancel} className={styles.cancelButton}>
          Cancelar
        </button>
      </div>
    </div>
  );
}