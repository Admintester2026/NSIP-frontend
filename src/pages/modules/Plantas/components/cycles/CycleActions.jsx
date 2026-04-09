import { useState } from 'react';
import styles from '../../styles/IndexCyclesStyles';

export default function CycleActions({ onClearAll, hasCycles, isDeleting = false }) {
  const [showConfirm, setShowConfirm] = useState(false);

  if (!hasCycles) return null;

  const handleConfirmClear = () => {
    setShowConfirm(false);
    if (onClearAll && typeof onClearAll === 'function') {
      onClearAll();
    }
  };

  return (
    <div className={styles.actionsBar}>
      <button
        className={styles.actionButton}
        onClick={() => setShowConfirm(true)}
        disabled={isDeleting}
      >
        <span className={styles.actionIcon}>🧹</span>
        {isDeleting ? 'Eliminando...' : 'Limpiar Todos los Ciclos'}
      </button>

      {showConfirm && (
        <div className={styles.confirmDialog}>
          <p>⚠️ ¿Estás seguro de eliminar TODOS los ciclos?</p>
          <p className={styles.confirmWarning}>Esta acción no se puede deshacer.</p>
          <div className={styles.confirmActions}>
            <button
              className={styles.confirmButton}
              onClick={handleConfirmClear}
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