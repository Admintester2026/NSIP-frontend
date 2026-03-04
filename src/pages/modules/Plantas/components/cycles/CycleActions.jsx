import { useState } from 'react';
import styles from '../../styles/IndexCyclesStyles';

export default function CycleActions({ onClearAll, hasCycles }) {
  const [showConfirm, setShowConfirm] = useState(false);

  if (!hasCycles) return null;

  return (
    <div className={styles.actionsBar}>
      <button
        className={styles.actionButton}
        onClick={() => setShowConfirm(true)}
      >
        <span className={styles.actionIcon}>🧹</span>
        Limpiar Todos los Ciclos
      </button>

      {showConfirm && (
        <div className={styles.confirmDialog}>
          <p>¿Estás seguro de eliminar TODOS los ciclos?</p>
          <div className={styles.confirmActions}>
            <button
              className={styles.confirmButton}
              onClick={() => {
                onClearAll();
                setShowConfirm(false);
              }}
            >
              Sí, eliminar todo
            </button>
            <button
              className={styles.cancelButton}
              onClick={() => setShowConfirm(false)}
            >
              Cancelar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}