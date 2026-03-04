import { useState } from 'react';
import styles from "../../styles/IndexCyclesStyles";

export default function GlobalCycleEditor({ onSaveGlobal }) {
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [selectedCycle, setSelectedCycle] = useState(null);

  const cycles = [1, 2, 3, 4, 5, 6];

  // Función para manejar toggle de selección
  const toggleCycle = (num) => {
    if (selectedCycle === num) {
      setSelectedCycle(null); // Deseleccionar si ya estaba seleccionado
    } else {
      setSelectedCycle(num); // Seleccionar nuevo
    }
  };

  const handleSaveGlobal = () => {
    if (!startTime || !endTime || selectedCycle === null) {
      alert('Por favor completa todos los campos y selecciona un ciclo');
      return;
    }

    const [startH, startM] = startTime.split(':').map(Number);
    const [endH, endM] = endTime.split(':').map(Number);

    // Validar horas
    if (startH < 0 || startH > 23 || startM < 0 || startM > 59 ||
        endH < 0 || endH > 23 || endM < 0 || endM > 59) {
      alert('Horas inválidas');
      return;
    }

    console.log('🎯 Enviando configuración global:', {
      cycle: selectedCycle - 1,
      start_h: startH,
      start_m: startM,
      end_h: endH,
      end_m: endM,
      enabled: true
    });

    onSaveGlobal({
      cycle: selectedCycle - 1,
      start_h: startH,
      start_m: startM,
      end_h: endH,
      end_m: endM,
      enabled: true
    });

    // Limpiar formulario
    setStartTime('');
    setEndTime('');
    setSelectedCycle(null);
  };

  return (
    <div className={styles.globalEditor}>
      <h3 className={styles.sectionTitle}>⚡ Configuración Rápida</h3>
      <div className={styles.timeInputs}>
        <div className={styles.inputGroup}>
          <label>Inicio:</label>
          <input
            type="time"
            value={startTime}
            onChange={(e) => setStartTime(e.target.value)}
            className={styles.timeInput}
            step="60"
          />
        </div>
        <div className={styles.inputGroup}>
          <label>Fin:</label>
          <input
            type="time"
            value={endTime}
            onChange={(e) => setEndTime(e.target.value)}
            className={styles.timeInput}
            step="60"
          />
        </div>
      </div>

      <div className={styles.cycleButtons}>
        {cycles.map(num => (
          <button
            key={num}
            className={`${styles.cycleButton} ${selectedCycle === num ? styles.selected : ''}`}
            onClick={() => toggleCycle(num)}
          >
            C{num}
          </button>
        ))}
        <button
          className={`${styles.cycleButton} ${styles.globalButton}`}
          onClick={handleSaveGlobal}
        >
          Aplicar a Todos
        </button>
      </div>
      
      {selectedCycle && (
        <div className={styles.selectedHint}>
          Ciclo C{selectedCycle} seleccionado
        </div>
      )}
    </div>
  );
}