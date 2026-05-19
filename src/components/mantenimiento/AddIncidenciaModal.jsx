// src/components/mantenimiento/AddIncidenciaModal.jsx
import { useState } from 'react';
import { mantenimientoAPI } from '../../api/mantenimiento';
import styles from './AddIncidenciaModal.module.css';

export default function AddIncidenciaModal({ isOpen, onClose, onSuccess, equipoId }) {
  const [formData, setFormData] = useState({
    titulo: '',
    descripcion: '',
    gravedad: 'media'
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [touched, setTouched] = useState({
    titulo: false,
    descripcion: false
  });

  const gravedades = [
    { value: 'critica', label: '🔥 Crítica' },
    { value: 'alta', label: '⚠️ Alta' },
    { value: 'media', label: '📋 Media' },
    { value: 'baja', label: '✅ Baja' }
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
    if (!formData.titulo.trim()) errors.push('El título es requerido');
    if (!formData.descripcion.trim()) errors.push('La descripción es requerida');
    
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
      await mantenimientoAPI.createIncidencia({
        equipo_id: equipoId,
        ...formData
      });

      setFormData({
        titulo: '',
        descripcion: '',
        gravedad: 'media'
      });
      setTouched({ titulo: false, descripcion: false });

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
          <h2>⚠️ Reportar Incidencia / Daño</h2>
          <button className={styles.modalClose} onClick={onClose}>✕</button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className={styles.modalBody}>
            {error && <div className={styles.errorMessage}>⚠️ {error}</div>}

            <div className={styles.formGroup}>
              <label>Título *</label>
              <input
                type="text"
                name="titulo"
                value={formData.titulo}
                onChange={handleChange}
                onBlur={() => handleBlur('titulo')}
                placeholder="Ej: Sobrecalentamiento del motor"
                className={touched.titulo && !formData.titulo.trim() ? styles.inputError : ''}
              />
              {touched.titulo && !formData.titulo.trim() && <span className={styles.errorText}>El título es requerido</span>}
            </div>

            <div className={styles.formGroup}>
              <label>Descripción *</label>
              <textarea
                name="descripcion"
                value={formData.descripcion}
                onChange={handleChange}
                onBlur={() => handleBlur('descripcion')}
                rows="3"
                placeholder="Describe detalladamente el problema..."
                className={touched.descripcion && !formData.descripcion.trim() ? styles.inputError : ''}
              />
              {touched.descripcion && !formData.descripcion.trim() && <span className={styles.errorText}>La descripción es requerida</span>}
            </div>

            <div className={styles.formGroup}>
              <label>Gravedad</label>
              <select name="gravedad" value={formData.gravedad} onChange={handleChange}>
                {gravedades.map(g => <option key={g.value} value={g.value}>{g.label}</option>)}
              </select>
            </div>
          </div>

          <div className={styles.modalFooter}>
            <button type="button" className={styles.cancelButton} onClick={onClose}>Cancelar</button>
            <button type="submit" className={styles.submitButton} disabled={loading}>
              {loading ? 'Guardando...' : 'Reportar Incidencia'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}