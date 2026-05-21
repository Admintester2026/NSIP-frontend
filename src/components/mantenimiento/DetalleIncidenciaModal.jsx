// FRONTEND/src/components/mantenimiento/DetalleIncidenciaModal.jsx
import { useState, useEffect } from 'react';
import ImageGallery from './ImageGallery';
import styles from './DetalleIncidenciaModal.module.css';

const getApiBase = () => {
  if (typeof import.meta !== 'undefined' && import.meta.env?.VITE_API_URL) {
    return import.meta.env.VITE_API_URL;
  }
  if (typeof window !== 'undefined' && window.VITE_API_URL) {
    return window.VITE_API_URL;
  }
  return '';
};

export default function DetalleIncidenciaModal({ isOpen, onClose, incidencia, equipoNombre }) {
  const [evidencias, setEvidencias] = useState([]);
  const [loadingEvidencias, setLoadingEvidencias] = useState(false);

  useEffect(() => {
    if (isOpen && incidencia?.id) {
      cargarEvidencias();
    }
  }, [isOpen, incidencia]);

  const cargarEvidencias = async () => {
    setLoadingEvidencias(true);
    try {
      const API_BASE = getApiBase();
      const response = await fetch(`${API_BASE}/mantenimiento/evidencias/incidencia/${incidencia.id}`);
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

  const formatDate = (dateString) => {
    if (!dateString) return 'No definida';
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return 'Fecha inválida';
    return date.toLocaleDateString('es-MX', { 
      day: '2-digit', month: 'long', year: 'numeric',
      hour: '2-digit', minute: '2-digit'
    });
  };

  const getGravedadClass = (gravedad) => {
    switch (gravedad) {
      case 'critica': return styles.gravedadCritica;
      case 'alta': return styles.gravedadAlta;
      case 'media': return styles.gravedadMedia;
      case 'baja': return styles.gravedadBaja;
      default: return '';
    }
  };

  const getGravedadTexto = (gravedad) => {
    switch (gravedad) {
      case 'critica': return '🔥 Crítica';
      case 'alta': return '⚠️ Alta';
      case 'media': return '📋 Media';
      case 'baja': return '✅ Baja';
      default: return gravedad;
    }
  };

  const getEstadoClass = (estado) => {
    return estado === 'resuelto' ? styles.estadoResuelto : styles.estadoPendiente;
  };

  const getEstadoTexto = (estado) => {
    return estado === 'resuelto' ? '✅ Resuelto' : '🟡 Pendiente';
  };

  if (!isOpen) return null;

  if (!incidencia) {
    return (
      <div className={styles.modalOverlay} onClick={onClose}>
        <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
          <div className={styles.modalHeader}>
            <h2>Cargando...</h2>
            <button className={styles.modalClose} onClick={onClose}>✕</button>
          </div>
          <div className={styles.modalBody}>
            <p className={styles.loadingText}>Cargando información de la incidencia...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <h2>⚠️ Detalle de Incidencia</h2>
          <button className={styles.modalClose} onClick={onClose}>✕</button>
        </div>

        <div className={styles.modalBody}>
          {/* Información básica */}
          <div className={styles.infoSection}>
            <div className={styles.infoRow}><span className={styles.infoLabel}>Título:</span><span className={styles.infoValue}>{incidencia.titulo}</span></div>
            <div className={styles.infoRow}><span className={styles.infoLabel}>Equipo:</span><span className={styles.infoValue}>{equipoNombre}</span></div>
            <div className={styles.infoRow}>
              <span className={styles.infoLabel}>Gravedad:</span>
              <span className={`${styles.gravedadBadge} ${getGravedadClass(incidencia.gravedad)}`}>{getGravedadTexto(incidencia.gravedad)}</span>
            </div>
            <div className={styles.infoRow}>
              <span className={styles.infoLabel}>Estado:</span>
              <span className={`${styles.estadoBadge} ${getEstadoClass(incidencia.estado)}`}>{getEstadoTexto(incidencia.estado)}</span>
            </div>
            {incidencia.reportado_por && <div className={styles.infoRow}><span className={styles.infoLabel}>Reportado por:</span><span className={styles.infoValue}>{incidencia.reportado_por}</span></div>}
          </div>

          {/* Fechas */}
          <div className={styles.infoSection}>
            <h4 className={styles.sectionSubtitle}>📅 Fechas</h4>
            <div className={styles.infoRow}><span className={styles.infoLabel}>Reportado:</span><span className={styles.infoValue}>{formatDate(incidencia.fecha_reporte)}</span></div>
            {incidencia.fecha_solucion && <div className={styles.infoRow}><span className={styles.infoLabel}>Solucionado:</span><span className={styles.infoValue}>{formatDate(incidencia.fecha_solucion)}</span></div>}
          </div>

          {/* Descripción */}
          <div className={styles.infoSection}>
            <h4 className={styles.sectionSubtitle}>📝 Descripción del problema</h4>
            <div className={styles.descripcionBox}>{incidencia.descripcion}</div>
          </div>

          {/* Solución */}
          {incidencia.solucion && (
            <div className={styles.infoSection}>
              <h4 className={styles.sectionSubtitle}>💡 Solución aplicada</h4>
              <div className={styles.solucionBox}>{incidencia.solucion}</div>
            </div>
          )}

          {/* Costo estimado */}
          {incidencia.costo_estimado && (
            <div className={styles.infoSection}>
              <h4 className={styles.sectionSubtitle}>💰 Costo estimado</h4>
              <div className={styles.infoRow}><span className={styles.infoValue}>${Number(incidencia.costo_estimado).toFixed(2)}</span></div>
            </div>
          )}

          {/* Evidencias - CON GALERÍA DE IMÁGENES */}
          <div className={styles.infoSection}>
            <h4 className={styles.sectionSubtitle}>📸 Evidencias / Documentos</h4>
            {loadingEvidencias ? (
              <p className={styles.loadingText}>Cargando evidencias...</p>
            ) : evidencias.length > 0 ? (
              <ImageGallery images={evidencias} title="Evidencias de la incidencia" />
            ) : (
              <p className={styles.emptyMessage}>No hay evidencias adjuntas</p>
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