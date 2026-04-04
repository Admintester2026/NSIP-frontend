import { useState } from 'react';
import { mantenimientoAPI } from '../../api/mantenimiento';
import styles from './AddMantenimientoModal.module.css';

export default function AddMantenimientoModal({ isOpen, onClose, onSuccess, equipoId }) {
  const [formData, setFormData] = useState({
    titulo: '',
    descripcion: '',
    fecha_inicio: '',
    fecha_fin: '',
    tipo: 'preventivo',
    prioridad: 'media',
    recurrencia: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const tipos = [
    { value: 'preventivo', label: '🔧 Preventivo' },
    { value: 'correctivo', label: '⚠️ Correctivo' },
    { value: 'rutina', label: '📋 Rutina' },
    { value: 'emergencia', label: '🚨 Emergencia' }
  ];

  const prioridades = [
    { value: 'urgente', label: '🚨 Urgente' },
    { value: 'alta', label: '⚠️ Alta' },
    { value: 'media', label: '📋 Media' },
    { value: 'baja', label: '✅ Baja' }
  ];

  const recurrencias = [
    { value: '', label: 'Sin recurrencia' },
    { value: 'diario', label: '📅 Diario' },
    { value: 'semanal', label: '📅 Semanal' },
    { value: 'mensual', label: '📅 Mensual' },
    { value: 'anual', label: '📅 Anual' }
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
      if (!formData.titulo.trim()) {
        throw new Error('El título es requerido');
      }
      if (!formData.fecha_inicio) {
        throw new Error('La fecha de inicio es requerida');
      }

      await mantenimientoAPI.createMantenimiento({
        equipo_id: equipoId,
        ...formData
      });

      setFormData({
        titulo: '',
        descripcion: '',
        fecha_inicio: '',
        fecha_fin: '',
        tipo: 'preventivo',
        prioridad: 'media',
        recurrencia: ''
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
          <h2>🔧 Programar Mantenimiento</h2>
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
                placeholder="Ej: Lubricación de rodamientos"
                required
              />
            </div>

            <div className={styles.formGroup}>
              <label>Descripción</label>
              <textarea
                name="descripcion"
                value={formData.descripcion}
                onChange={handleChange}
                rows="3"
                placeholder="Detalles del mantenimiento..."
              />
            </div>

            <div className={styles.row}>
              <div className={styles.formGroup}>
                <label>Fecha Inicio *</label>
                <input
                  type="date"
                  name="fecha_inicio"
                  value={formData.fecha_inicio}
                  onChange={handleChange}
                  required
                />
              </div>
              <div className={styles.formGroup}>
                <label>Fecha Fin</label>
                <input
                  type="date"
                  name="fecha_fin"
                  value={formData.fecha_fin}
                  onChange={handleChange}
                />
              </div>
            </div>

            <div className={styles.row}>
              <div className={styles.formGroup}>
                <label>Tipo</label>
                <select name="tipo" value={formData.tipo} onChange={handleChange}>
                  {tipos.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                </select>
              </div>
              <div className={styles.formGroup}>
                <label>Prioridad</label>
                <select name="prioridad" value={formData.prioridad} onChange={handleChange}>
                  {prioridades.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
                </select>
              </div>
            </div>

            <div className={styles.formGroup}>
              <label>Recurrencia</label>
              <select name="recurrencia" value={formData.recurrencia} onChange={handleChange}>
                {recurrencias.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
              </select>
            </div>
          </div>

          <div className={styles.modalFooter}>
            <button type="button" className={styles.cancelButton} onClick={onClose}>Cancelar</button>
            <button type="submit" className={styles.submitButton} disabled={loading}>
              {loading ? 'Guardando...' : 'Programar Mantenimiento'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}