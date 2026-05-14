// FRONTEND/src/components/mantenimiento/DetalleMantenimientoModal.jsx
import { useState, useEffect } from 'react';
import styles from './DetalleMantenimientoModal.module.css';

export default function DetalleMantenimientoModal({ isOpen, onClose, mantenimiento, equipoNombre }) {
  const [evidencias, setEvidencias] = useState([]);
  const [loadingEvidencias, setLoadingEvidencias] = useState(false);

  useEffect(() => {
    if (isOpen && mantenimiento?.id) {
      cargarEvidencias();
    }
  }, [isOpen, mantenimiento]);

  const cargarEvidencias = async () => {
    setLoadingEvidencias(true);
    try {
      const response = await fetch(`/api/mantenimiento/evidencias/${mantenimiento.id}`);
      const data = await response.json();
      if (data.ok) {
        setEvidencias(data.datos || []);
      }
    } catch (err) {
      console.error('Error cargando evidencias:', err);
    } finally {
      setLoadingEvidencias(false);
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

          {/* Ejecución */}
          <div className={styles.infoSection}>
            <h4 className={styles.sectionSubtitle}>👤 Ejecución</h4>
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
          </div>

          {/* Materiales y costo */}
          {(mantenimiento?.materiales_usados || mantenimiento?.costo_materiales) && (
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

          {/* Notas */}
          {mantenimiento?.notas_completado && (
            <div className={styles.infoSection}>
              <h4 className={styles.sectionSubtitle}>📝 Notas del trabajo</h4>
              <div className={styles.notasBox}>
                {mantenimiento.notas_completado}
              </div>
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
                    {ev.url.match(/\.(mp4|webm)$/i) ? (
                      <video src={ev.url} className={styles.evidenciaVideo} controls />
                    ) : (
                      <img src={ev.url} alt={`Evidencia ${idx + 1}`} className={styles.evidenciaImg} />
                    )}
                    <a href={ev.url} target="_blank" rel="noopener noreferrer" className={styles.evidenciaLink}>
                      Ver completo
                    </a>
                  </div>
                ))}
              </div>
            ) : (
              <p className={styles.emptyMessage}>No hay evidencias adjuntas</p>
            )}
          </div>
        </div>

        <div className={styles.modalFooter}>
          <button className={styles.closeButton} onClick={onClose}>
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
}