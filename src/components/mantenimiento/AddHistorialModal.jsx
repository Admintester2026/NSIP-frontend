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
  const [touched, setTouched] = useState({
    campo_modificado: false,
    descripcion: false
  });

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

  const handleBlur = (field) => {
    setTouched(prev => ({ ...prev, [field]: true }));
  };

  const validateForm = () => {
    const errors = [];
    if (!formData.campo_modificado) errors.push('Selecciona el tipo de cambio');
    if (!formData.valor_nuevo && !formData.descripcion) {
      errors.push('Ingresa una descripción o valor nuevo');
    }
    
    if (errors.length > 0) {
      setError(errors.join('. '));
      return false;
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setLoading(true);
    setError('');

    try {
      await mantenimientoAPI.registrarCambio(equipoId, formData);

      setFormData({
        campo_modificado: '',
        valor_anterior: '',
        valor_nuevo: '',
        descripcion: ''
      });
      setTouched({ campo_modificado: false, descripcion: false });

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
              <select 
                name="campo_modificado" 
                value={formData.campo_modificado} 
                onChange={handleChange}
                onBlur={() => handleBlur('campo_modificado')}
                className={touched.campo_modificado && !formData.campo_modificado ? styles.inputError : ''}
              >
                <option value="">Seleccionar...</option>
                {campos.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
              </select>
              {touched.campo_modificado && !formData.campo_modificado && <span className={styles.errorText}>El tipo de cambio es requerido</span>}
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
                onBlur={() => handleBlur('descripcion')}
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