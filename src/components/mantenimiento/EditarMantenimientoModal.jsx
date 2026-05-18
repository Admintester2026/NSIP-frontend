import { useState, useEffect } from 'react';
import { mantenimientoAPI } from '../../api/mantenimiento';
import styles from './EditarMantenimientoModal.module.css';

export default function EditarMantenimientoModal({ isOpen, onClose, onSuccess, mantenimiento, equipoNombre }) {
  const [formData, setFormData] = useState({
    tecnico: '',
    notas_completado: '',
    duracion: '',
    materiales_usados: '',
    costo_materiales: '',
    observaciones: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [versiones, setVersiones] = useState([]);
  const [mostrarHistorial, setMostrarHistorial] = useState(false);
  const [cargandoHistorial, setCargandoHistorial] = useState(false);

  useEffect(() => {
    if (isOpen && mantenimiento) {
      setFormData({
        tecnico: mantenimiento.completado_por || '',
        notas_completado: mantenimiento.notas_completado || '',
        duracion: mantenimiento.duracion || '',
        materiales_usados: mantenimiento.materiales_usados || '',
        costo_materiales: mantenimiento.costo_materiales || '',
        observaciones: ''
      });
      cargarHistorial();
    }
  }, [isOpen, mantenimiento]);

  const cargarHistorial = async () => {
    setCargandoHistorial(true);
    try {
      const data = await mantenimientoAPI.getHistorialVersiones(mantenimiento.id);
      setVersiones(data || []);
    } catch (err) {
      console.error('Error cargando historial:', err);
    } finally {
      setCargandoHistorial(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      if (!formData.tecnico.trim()) {
        throw new Error('El nombre del técnico es requerido');
      }
      if (!formData.notas_completado.trim()) {
        throw new Error('Las notas de trabajo son requeridas');
      }

      await mantenimientoAPI.editarMantenimientoCompletado(mantenimiento.id, {
        notas_completado: formData.notas_completado,
        tecnico: formData.tecnico,
        duracion: formData.duracion,
        materiales_usados: formData.materiales_usados,
        costo_materiales: formData.costo_materiales,
        observaciones: formData.observaciones
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
          <h2>✏️ Editar Mantenimiento Completado</h2>
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
                <span className={styles.infoLabel}>Equipo:</span>
                <span className={styles.infoValue}>{equipoNombre}</span>
              </div>
              <div className={styles.infoRow}>
                <span className={styles.infoLabel}>Completado:</span>
                <span className={styles.infoValue}>{new Date(mantenimiento?.fecha_completado).toLocaleDateString()}</span>
              </div>
            </div>

            <div className={styles.formGroup}>
              <label>👤 Técnico responsable *</label>
              <input 
                type="text" 
                name="tecnico" 
                value={formData.tecnico} 
                onChange={handleChange} 
                placeholder="Nombre del técnico"
                required 
              />
            </div>

            <div className={styles.formGroup}>
              <label>📝 Notas / Trabajo realizado *</label>
              <textarea 
                name="notas_completado" 
                value={formData.notas_completado} 
                onChange={handleChange} 
                rows="4" 
                placeholder="Describa detalladamente lo que se hizo..."
                required 
              />
            </div>

            <div className={styles.row}>
              <div className={styles.formGroup}>
                <label>⏱️ Duración (minutos)</label>
                <input 
                  type="number" 
                  name="duracion" 
                  value={formData.duracion} 
                  onChange={handleChange} 
                  placeholder="Minutos"
                  step="5"
                />
              </div>
              <div className={styles.formGroup}>
                <label>💰 Costo de materiales</label>
                <input 
                  type="number" 
                  name="costo_materiales" 
                  value={formData.costo_materiales} 
                  onChange={handleChange} 
                  placeholder="$0.00"
                  step="0.01"
                />
              </div>
            </div>

            <div className={styles.formGroup}>
              <label>🔧 Materiales usados</label>
              <textarea 
                name="materiales_usados" 
                value={formData.materiales_usados} 
                onChange={handleChange} 
                rows="2" 
                placeholder="Piezas reemplazadas, lubricantes, herramientas especiales..."
              />
            </div>

            {/* Historial de versiones */}
            <button 
              type="button" 
              className={styles.historialButton} 
              onClick={() => setMostrarHistorial(!mostrarHistorial)}
            >
              📜 Ver historial de cambios ({versiones.length})
            </button>

            {mostrarHistorial && (
              <div className={styles.historialContainer}>
                {cargandoHistorial ? (
                  <p className={styles.loadingText}>Cargando historial...</p>
                ) : versiones.length > 0 ? (
                  versiones.map((v, idx) => (
                    <div key={idx} className={styles.versionItem}>
                      <div className={styles.versionHeader}>
                        <span className={styles.versionBadge}>Versión {v.version}</span>
                        <span className={styles.versionDate}>{new Date(v.fecha_modificacion).toLocaleString()}</span>
                        <span className={styles.versionUser}>👤 {v.modificado_por || 'sistema'}</span>
                      </div>
                      <div className={styles.versionContent}>
                        {v.notas_completado && (
                          <p><strong>Notas:</strong> {v.notas_completado}</p>
                        )}
                        {v.materiales_usados && (
                          <p><strong>Materiales:</strong> {v.materiales_usados}</p>
                        )}
                        {v.costo_materiales && (
                          <p><strong>Costo:</strong> ${Number(v.costo_materiales).toFixed(2)}</p>
                        )}
                        {v.duracion && (
                          <p><strong>Duración:</strong> {v.duracion} minutos</p>
                        )}
                      </div>
                    </div>
                  ))
                ) : (
                  <p className={styles.emptyMessage}>No hay versiones anteriores registradas</p>
                )}
              </div>
            )}
          </div>

          <div className={styles.modalFooter}>
            <button type="button" className={styles.cancelButton} onClick={onClose}>
              Cancelar
            </button>
            <button type="submit" className={styles.submitButton} disabled={loading}>
              {loading ? 'Guardando...' : '💾 Guardar cambios'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}