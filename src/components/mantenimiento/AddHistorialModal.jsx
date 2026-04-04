import { useState } from 'react';
import { mantenimientoAPI } from '../../api/mantenimiento';
import styles from './AddHistorialModal.module.css';

export default function AddHistorialModal({ isOpen, onClose, onSuccess, equipoId }) {
  const [formData, setFormData] = useState({
    campo_modificado: '',
    valor_anterior: '',
    valor_nuevo: '',
    descripcion: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const campos = [
    { value: 'pieza_reemplazada', label: '🔧 Pieza Reemplazada' },
    { value: 'configuracion', label: '⚙️ Configuración' },
    { value: 'calibracion', label: '📏 Calibración' },
    { value: 'reparacion', label: '🛠️ Reparación' },
    { value: 'actualizacion', label: '🔄 Actualización' },
    { value: 'observacion', label: '📝 Observación' }
  ];

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      if (!formData.campo_modificado) {
        throw new Error('Selecciona el tipo de cambio');
      }
      if (!formData.valor_nuevo && !formData.descripcion) {
        throw new Error('Ingresa una descripción o valor nuevo');
      }

      await mantenimientoAPI.registrarCambio(equipoId, formData);

      setFormData({
        campo_modificado: '',
        valor_anterior: '',
        valor_nuevo: '',
        descripcion: ''
      });

      if (onSuccess) onSuccess();
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <h2>📜 Registrar Cambio / Pieza</h2>
          <button className={styles.modalClose} onClick={onClose}>✕</button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className={styles.modalBody}>
            {error && <div className={styles.errorMessage}>⚠️ {error}</div>}

            <div className={styles.formGroup}>
              <label>Tipo de Cambio *</label>
              <select name="campo_modificado" value={formData.campo_modificado} onChange={handleChange} required>
                <option value="">Seleccionar...</option>
                {campos.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
              </select>
            </div>

            <div className={styles.row}>
              <div className={styles.formGroup}>
                <label>Valor Anterior</label>
                <input
                  type="text"
                  name="valor_anterior"
                  value={formData.valor_anterior}
                  onChange={handleChange}
                  placeholder="Valor anterior / pieza vieja"
                />
              </div>
              <div className={styles.formGroup}>
                <label>Valor Nuevo</label>
                <input
                  type="text"
                  name="valor_nuevo"
                  value={formData.valor_nuevo}
                  onChange={handleChange}
                  placeholder="Valor nuevo / pieza nueva"
                />
              </div>
            </div>

            <div className={styles.formGroup}>
              <label>Descripción / Observaciones</label>
              <textarea
                name="descripcion"
                value={formData.descripcion}
                onChange={handleChange}
                rows="3"
                placeholder="Detalles del cambio realizado..."
              />
            </div>
          </div>

          <div className={styles.modalFooter}>
            <button type="button" className={styles.cancelButton} onClick={onClose}>Cancelar</button>
            <button type="submit" className={styles.submitButton} disabled={loading}>
              {loading ? 'Guardando...' : 'Registrar Cambio'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}