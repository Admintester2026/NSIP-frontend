import { useState } from 'react';
import { mantenimientoAPI } from '../../api/mantenimiento';
import styles from './ReprogramarModal.module.css';

export default function ReprogramarModal({ isOpen, onClose, onSuccess, mantenimiento }) {
  const [nuevaFecha, setNuevaFecha] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!nuevaFecha) {
      setError('Selecciona una nueva fecha');
      return;
    }

    setLoading(true);
    try {
      await mantenimientoAPI.updateMantenimiento(mantenimiento.id, {
        fecha_inicio: nuevaFecha,
        fecha_fin: nuevaFecha
      });
      if (onSuccess) onSuccess();
      onClose();
    } catch (err) {
      console.error('Error reprogramando:', err);
      setError('Error al reprogramar el mantenimiento');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  // Fecha mínima: hoy
  const hoy = new Date().toISOString().split('T')[0];

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <h2>📅 Reprogramar Mantenimiento</h2>
          <button className={styles.modalClose} onClick={onClose}>✕</button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className={styles.modalBody}>
            {error && <div className={styles.errorMessage}>⚠️ {error}</div>}
            
            <div className={styles.infoBox}>
              <div className={styles.infoRow}>
                <span className={styles.infoLabel}>Mantenimiento:</span>
                <span className={styles.infoValue}>{mantenimiento?.titulo}</span>
              </div>
              <div className={styles.infoRow}>
                <span className={styles.infoLabel}>Fecha actual:</span>
                <span className={styles.infoValue}>{new Date(mantenimiento?.fecha_inicio).toLocaleDateString()}</span>
              </div>
            </div>

            <div className={styles.formGroup}>
              <label>Nueva fecha de inicio *</label>
              <input
                type="date"
                value={nuevaFecha}
                onChange={(e) => setNuevaFecha(e.target.value)}
                min={hoy}
                required
              />
              <small className={styles.fieldHint}>Puedes adelantar o atrasar el mantenimiento según necesites</small>
            </div>
          </div>

          <div className={styles.modalFooter}>
            <button type="button" className={styles.cancelButton} onClick={onClose}>
              Cancelar
            </button>
            <button type="submit" className={styles.submitButton} disabled={loading}>
              {loading ? 'Reprogramando...' : '📅 Reprogramar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}