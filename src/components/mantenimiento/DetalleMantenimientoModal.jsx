// FRONTEND/src/components/mantenimiento/DetalleMantenimientoModal.jsx
import { useState, useEffect } from 'react';
import { mantenimientoAPI } from '../../api/mantenimiento';
import styles from './DetalleMantenimientoModal.module.css';

const getApiBase = () => {
  if (typeof import.meta !== 'undefined' && import.meta.env?.VITE_API_URL) {
    return import.meta.env.VITE_API_URL;
  }
  if (typeof window !== 'undefined' && window.VITE_API_URL) {
    return window.VITE_API_URL;
  }
  return '';
};

export default function DetalleMantenimientoModal({ isOpen, onClose, mantenimiento, equipoNombre, onEdit }) {
  const [evidencias, setEvidencias] = useState([]);
  const [loadingEvidencias, setLoadingEvidencias] = useState(false);
  const [versiones, setVersiones] = useState([]);
  const [cargandoVersiones, setCargandoVersiones] = useState(false);
  const [mostrarHistorial, setMostrarHistorial] = useState(false);
  const [modoEdicion, setModoEdicion] = useState(false);
  const [formData, setFormData] = useState({
    tecnico: '',
    notas_completado: '',
    duracion: '',
    materiales_usados: '',
    costo_materiales: ''
  });
  const [editando, setEditando] = useState(false);
  const [editError, setEditError] = useState('');

  useEffect(() => {
    if (isOpen && mantenimiento?.id) {
      cargarEvidencias();
      cargarVersiones();
      // Resetear modo edición
      setModoEdicion(false);
      setFormData({
        tecnico: mantenimiento?.completado_por || '',
        notas_completado: mantenimiento?.notas_completado || '',
        duracion: mantenimiento?.duracion || '',
        materiales_usados: mantenimiento?.materiales_usados || '',
        costo_materiales: mantenimiento?.costo_materiales || ''
      });
    }
  }, [isOpen, mantenimiento]);

  const cargarEvidencias = async () => {
    setLoadingEvidencias(true);
    try {
      const API_BASE = getApiBase();
      const response = await fetch(`${API_BASE}/mantenimiento/evidencias/${mantenimiento.id}`);
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        const data = await response.json();
        if (data.ok) setEvidencias(data.datos || []);
      }
    } catch (err) {
      console.error('Error cargando evidencias:', err);
    } finally {
      setLoadingEvidencias(false);
    }
  };

  const cargarVersiones = async () => {
    setCargandoVersiones(true);
    try {
      const data = await mantenimientoAPI.getHistorialVersiones(mantenimiento.id);
      setVersiones(data || []);
    } catch (err) {
      console.error('Error cargando versiones:', err);
    } finally {
      setCargandoVersiones(false);
    }
  };

  const handleEditChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleGuardarEdicion = async () => {
    setEditando(true);
    setEditError('');
    try {
      if (!formData.tecnico.trim()) throw new Error('El técnico es requerido');
      if (!formData.notas_completado.trim()) throw new Error('Las notas son requeridas');

      await mantenimientoAPI.editarMantenimientoCompletado(mantenimiento.id, {
        notas_completado: formData.notas_completado,
        tecnico: formData.tecnico,
        duracion: formData.duracion,
        materiales_usados: formData.materiales_usados,
        costo_materiales: formData.costo_materiales
      });
      
      setModoEdicion(false);
      if (onEdit) onEdit();
      // Recargar versiones después de editar
      await cargarVersiones();
    } catch (err) {
      setEditError(err.message);
    } finally {
      setEditando(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'No definida';
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return 'Fecha inválida';
    return date.toLocaleDateString('es-MX', { 
      day: '2-digit', 
      month: 'long', 
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (!isOpen) return null;

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <h2>📋 Detalle del Mantenimiento</h2>
          <button className={styles.modalClose} onClick={onClose}>✕</button>
        </div>

        <div className={styles.modalBody}>
          {/* Información básica */}
          <div className={styles.infoSection}>
            <div className={styles.infoRow}>
              <span className={styles.infoLabel}>Título:</span>
              <span className={styles.infoValue}>{mantenimiento?.titulo}</span>
            </div>
            <div className={styles.infoRow}>
              <span className={styles.infoLabel}>Equipo:</span>
              <span className={styles.infoValue}>{equipoNombre}</span>
            </div>
            <div className={styles.infoRow}>
              <span className={styles.infoLabel}>Tipo:</span>
              <span className={styles.infoValue}>{mantenimiento?.tipo || 'No especificado'}</span>
            </div>
            <div className={styles.infoRow}>
              <span className={styles.infoLabel}>Prioridad:</span>
              <span className={`${styles.prioridadBadge} ${
                mantenimiento?.prioridad === 'urgente' ? styles.urgente :
                mantenimiento?.prioridad === 'alta' ? styles.alta :
                mantenimiento?.prioridad === 'media' ? styles.media : styles.baja
              }`}>
                {mantenimiento?.prioridad || 'No especificada'}
              </span>
            </div>
          </div>

          {/* Fechas */}
          <div className={styles.infoSection}>
            <h4 className={styles.sectionSubtitle}>📅 Fechas</h4>
            <div className={styles.infoRow}>
              <span className={styles.infoLabel}>Programado:</span>
              <span className={styles.infoValue}>{formatDate(mantenimiento?.fecha_inicio)}</span>
            </div>
            {mantenimiento?.fecha_fin && (
              <div className={styles.infoRow}>
                <span className={styles.infoLabel}>Fin programado:</span>
                <span className={styles.infoValue}>{formatDate(mantenimiento?.fecha_fin)}</span>
              </div>
            )}
            <div className={styles.infoRow}>
              <span className={styles.infoLabel}>Completado:</span>
              <span className={styles.infoValue}>{formatDate(mantenimiento?.fecha_completado)}</span>
            </div>
          </div>

          {/* Ejecución - MODO EDICIÓN */}
          <div className={styles.infoSection}>
            <div className={styles.sectionHeader}>
              <h4 className={styles.sectionSubtitle}>👤 Ejecución</h4>
              {!modoEdicion && (
                <button className={styles.editarButton} onClick={() => setModoEdicion(true)}>
                  ✏️ Editar
                </button>
              )}
            </div>
            
            {modoEdicion ? (
              <>
                {editError && <div className={styles.editError}>{editError}</div>}
                <div className={styles.formGroup}>
                  <label>Técnico *</label>
                  <input type="text" name="tecnico" value={formData.tecnico} onChange={handleEditChange} />
                </div>
                <div className={styles.formGroup}>
                  <label>Notas / Trabajo *</label>
                  <textarea name="notas_completado" value={formData.notas_completado} onChange={handleEditChange} rows="3" />
                </div>
                <div className={styles.row}>
                  <div className={styles.formGroup}>
                    <label>Duración (min)</label>
                    <input type="number" name="duracion" value={formData.duracion} onChange={handleEditChange} />
                  </div>
                  <div className={styles.formGroup}>
                    <label>Costo materiales</label>
                    <input type="number" name="costo_materiales" value={formData.costo_materiales} onChange={handleEditChange} step="0.01" />
                  </div>
                </div>
                <div className={styles.formGroup}>
                  <label>Materiales usados</label>
                  <textarea name="materiales_usados" value={formData.materiales_usados} onChange={handleEditChange} rows="2" />
                </div>
                <div className={styles.editActions}>
                  <button className={styles.cancelEditBtn} onClick={() => setModoEdicion(false)}>Cancelar</button>
                  <button className={styles.saveEditBtn} onClick={handleGuardarEdicion} disabled={editando}>
                    {editando ? 'Guardando...' : 'Guardar cambios'}
                  </button>
                </div>
              </>
            ) : (
              <>
                <div className={styles.infoRow}>
                  <span className={styles.infoLabel}>Técnico:</span>
                  <span className={styles.infoValue}>{mantenimiento?.completado_por || 'No registrado'}</span>
                </div>
                {mantenimiento?.duracion && (
                  <div className={styles.infoRow}>
                    <span className={styles.infoLabel}>Duración:</span>
                    <span className={styles.infoValue}>{mantenimiento.duracion} minutos</span>
                  </div>
                )}
              </>
            )}
          </div>

          {/* Materiales y costo - solo en modo vista */}
          {!modoEdicion && (mantenimiento?.materiales_usados || mantenimiento?.costo_materiales) && (
            <div className={styles.infoSection}>
              <h4 className={styles.sectionSubtitle}>🔧 Materiales y Costos</h4>
              {mantenimiento?.materiales_usados && (
                <div className={styles.infoRow}>
                  <span className={styles.infoLabel}>Materiales usados:</span>
                  <span className={styles.infoValue}>{mantenimiento.materiales_usados}</span>
                </div>
              )}
              {mantenimiento?.costo_materiales && (
                <div className={styles.infoRow}>
                  <span className={styles.infoLabel}>Costo de materiales:</span>
                  <span className={styles.infoValue}>${mantenimiento.costo_materiales.toFixed(2)}</span>
                </div>
              )}
            </div>
          )}

          {/* Notas - solo en modo vista */}
          {!modoEdicion && mantenimiento?.notas_completado && (
            <div className={styles.infoSection}>
              <h4 className={styles.sectionSubtitle}>📝 Notas del trabajo</h4>
              <div className={styles.notasBox}>{mantenimiento.notas_completado}</div>
            </div>
          )}

          {/* Evidencias */}
          <div className={styles.infoSection}>
            <h4 className={styles.sectionSubtitle}>📸 Evidencias</h4>
            {loadingEvidencias ? (
              <p className={styles.loadingText}>Cargando evidencias...</p>
            ) : evidencias.length > 0 ? (
              <div className={styles.evidenciasGrid}>
                {evidencias.map((ev, idx) => (
                  <div key={idx} className={styles.evidenciaItem}>
                    {ev.url?.match(/\.(mp4|webm)$/i) ? (
                      <video src={ev.url} className={styles.evidenciaVideo} controls />
                    ) : (
                      <img src={ev.url} alt={`Evidencia ${idx + 1}`} className={styles.evidenciaImg} />
                    )}
                    <a href={ev.url} target="_blank" rel="noopener noreferrer" className={styles.evidenciaLink}>Ver completo</a>
                  </div>
                ))}
              </div>
            ) : (
              <p className={styles.emptyMessage}>No hay evidencias adjuntas</p>
            )}
          </div>

          {/* Historial de versiones anteriores */}
          <div className={styles.infoSection}>
            <div className={styles.sectionHeader}>
              <h4 className={styles.sectionSubtitle}>📜 Versiones anteriores ({versiones.length})</h4>
              <button className={styles.toggleHistorialBtn} onClick={() => setMostrarHistorial(!mostrarHistorial)}>
                {mostrarHistorial ? '▲ Ocultar' : '▼ Mostrar'}
              </button>
            </div>
            
            {mostrarHistorial && (
              <div className={styles.historialContainer}>
                {cargandoVersiones ? (
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
                        {v.notas_completado && <p><strong>Notas:</strong> {v.notas_completado}</p>}
                        {v.materiales_usados && <p><strong>Materiales:</strong> {v.materiales_usados}</p>}
                        {v.costo_materiales && <p><strong>Costo:</strong> ${Number(v.costo_materiales).toFixed(2)}</p>}
                        {v.duracion && <p><strong>Duración:</strong> {v.duracion} minutos</p>}
                      </div>
                    </div>
                  ))
                ) : (
                  <p className={styles.emptyMessage}>No hay versiones anteriores</p>
                )}
              </div>
            )}
          </div>
        </div>

        <div className={styles.modalFooter}>
          <button className={styles.closeButton} onClick={onClose}>Cerrar</button>
        </div>
      </div>
    </div>
  );
}