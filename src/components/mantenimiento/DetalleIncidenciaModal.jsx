// FRONTEND/src/components/mantenimiento/DetalleIncidenciaModal.jsx
import { useState, useEffect } from 'react';
import { mantenimientoAPI } from '../../api/mantenimiento';
import ImageGallery from './ImageGallery';
import EditarIncidenciaModal from './EditarIncidenciaModal';
import styles from './DetalleIncidenciaModal.module.css';

const getBackendBase = () => {
  return 'http://192.168.3.65:3000';
};

const getApiBase = () => {
  return `${getBackendBase()}/api`;
};

export default function DetalleIncidenciaModal({ isOpen, onClose, incidencia, equipoNombre, onEdit }) {
  const [evidencias, setEvidencias] = useState([]);
  const [loadingEvidencias, setLoadingEvidencias] = useState(false);
  const [versiones, setVersiones] = useState([]);
  const [cargandoVersiones, setCargandoVersiones] = useState(false);
  const [mostrarSidebar, setMostrarSidebar] = useState(false);
  const [vistaPreviaVersion, setVistaPreviaVersion] = useState(null);
  const [recargando, setRecargando] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [incidenciaActual, setIncidenciaActual] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    if (isOpen && incidencia?.id) {
      console.log('🎬 DetalleIncidenciaModal - Abriendo con incidencia:', incidencia.id);
      setVistaPreviaVersion(null);
      setMostrarSidebar(false);
      setIncidenciaActual(incidencia);
      cargarEvidencias();
      cargarVersiones();
    }
  }, [isOpen, incidencia?.id]);

  useEffect(() => {
    if (incidencia) {
      setIncidenciaActual(incidencia);
      setRefreshKey(prev => prev + 1);
    }
  }, [incidencia]);

  const cargarEvidencias = async () => {
    const idActual = incidencia?.id || incidenciaActual?.id;
    if (!idActual) return;
    
    setLoadingEvidencias(true);
    try {
      const API_BASE = getApiBase();
      const response = await fetch(`${API_BASE}/mantenimiento/evidencias/incidencia/${idActual}`);
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        const data = await response.json();
        if (data.ok) {
          const backendBase = getBackendBase();
          const evidenciasConUrlAbsoluta = (data.datos || []).map(ev => ({
            ...ev,
            url: ev.url.startsWith('http') ? ev.url : `${backendBase}${ev.url}`
          }));
          setEvidencias(evidenciasConUrlAbsoluta);
        }
      }
    } catch (err) {
      console.error('Error cargando evidencias:', err);
    } finally {
      setLoadingEvidencias(false);
    }
  };

  const cargarVersiones = async () => {
    const idActual = incidencia?.id || incidenciaActual?.id;
    if (!idActual) return;
    
    setCargandoVersiones(true);
    try {
      const data = await mantenimientoAPI.getHistorialVersionesIncidencia(idActual);
      setVersiones(data || []);
    } catch (err) {
      console.error('Error cargando versiones:', err);
      setVersiones([]);
    } finally {
      setCargandoVersiones(false);
    }
  };

  const verVersionAnterior = (version) => {
    setVistaPreviaVersion(version);
    setMostrarSidebar(false);
  };

  const cerrarVistaPrevia = () => {
    setVistaPreviaVersion(null);
  };

  const handleEditSuccess = async () => {
    console.log('🔵 DetalleIncidenciaModal - EditSuccess, recargando...');
    if (onEdit) {
      await onEdit();
    }
    // Recargar los datos después de editar
    await cargarEvidencias();
    await cargarVersiones();
    // Forzar actualización de la incidencia actual
    setRefreshKey(prev => prev + 1);
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

  const formatDateShort = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return '';
    return date.toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' });
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
    switch (estado) {
      case 'resuelto': return styles.estadoResuelto;
      case 'en_proceso': return styles.estadoEnProceso;
      case 'cerrado': return styles.estadoCerrado;
      default: return styles.estadoPendiente;
    }
  };

  const getEstadoTexto = (estado) => {
    switch (estado) {
      case 'resuelto': return '✅ Resuelto';
      case 'en_proceso': return '🔧 En proceso';
      case 'cerrado': return '🔒 Cerrado';
      default: return '🟡 Reportado';
    }
  };

  if (!isOpen) return null;

  if (!incidenciaActual && !incidencia) {
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

  if (recargando) {
    return (
      <div className={styles.modalOverlay} onClick={onClose}>
        <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
          <div className={styles.modalHeader}>
            <h2>Actualizando...</h2>
            <button className={styles.modalClose} onClick={onClose}>✕</button>
          </div>
          <div className={styles.modalBody}>
            <p className={styles.loadingText}>Actualizando información...</p>
          </div>
        </div>
      </div>
    );
  }

  const datosMostrar = incidenciaActual || incidencia;
  const mostrarDatos = vistaPreviaVersion || datosMostrar;
  const esVistaPrevia = vistaPreviaVersion !== null;

  return (
    <>
      <div className={styles.modalOverlay} onClick={onClose}>
        <div className={`${styles.modal} ${mostrarSidebar ? styles.withSidebar : ''}`} onClick={(e) => e.stopPropagation()}>
          {mostrarSidebar && (
            <div className={styles.sidebar}>
              <div className={styles.sidebarHeader}>
                <h3>📜 Versiones anteriores</h3>
                <button className={styles.sidebarClose} onClick={() => setMostrarSidebar(false)}>✕</button>
              </div>
              <div className={styles.sidebarContent}>
                {cargandoVersiones ? (
                  <p className={styles.loadingText}>Cargando...</p>
                ) : versiones.length > 1 ? (
                  [...versiones].sort((a, b) => b.version - a.version).map((v, idx) => (
                    v.version !== 1 && (
                      <div key={idx} className={styles.versionItemSidebar} onClick={() => verVersionAnterior(v)}>
                        <div className={styles.versionHeaderSidebar}>
                          <span className={styles.versionBadgeSidebar}>Versión {v.version}</span>
                          <span className={styles.versionDateSidebar}>{formatDateShort(v.fecha_modificacion)}</span>
                        </div>
                        <div className={styles.versionPreviewSidebar}>
                          {v.descripcion?.substring(0, 60) || v.titulo?.substring(0, 60)}...
                        </div>
                        <div className={styles.versionUserSidebar}>👤 {v.modificado_por || 'sistema'}</div>
                      </div>
                    )
                  ))
                ) : (
                  <p className={styles.emptyMessage}>No hay versiones anteriores</p>
                )}
              </div>
            </div>
          )}

          <div className={styles.modalMain}>
            <div className={styles.modalHeader}>
              <div className={styles.headerLeft}>
                <h2>
                  {esVistaPrevia ? (
                    <span className={styles.versionPreviewBadge}>🔍 Vista previa - Versión {vistaPreviaVersion.version}</span>
                  ) : (
                    '⚠️ Detalle de Incidencia'
                  )}
                </h2>
                {versiones.length > 1 && !esVistaPrevia && (
                  <button className={styles.historyButton} onClick={() => setMostrarSidebar(true)} title="Ver historial de versiones">
                    ⏱️ {versiones.length - 1}
                  </button>
                )}
                {esVistaPrevia && (
                  <button className={styles.backToCurrentBtn} onClick={cerrarVistaPrevia}>← Volver a versión actual</button>
                )}
              </div>
              <button className={styles.modalClose} onClick={onClose}>✕</button>
            </div>

            <div className={styles.modalBody}>
              <div className={styles.infoSection}>
                <div className={styles.sectionHeader}>
                  <h4 className={styles.sectionSubtitle}>📋 Información general</h4>
                  {!esVistaPrevia && (
                    <button className={styles.editarButton} onClick={() => setShowEditModal(true)}>
                      ✏️ Editar
                    </button>
                  )}
                </div>
                <div className={styles.infoRow}>
                  <span className={styles.infoLabel}>ID:</span>
                  <span className={styles.infoValue}>#{datosMostrar.id}</span>
                </div>
                <div className={styles.infoRow}>
                  <span className={styles.infoLabel}>Título:</span>
                  <span className={styles.infoValue}>{mostrarDatos.titulo}</span>
                </div>
                <div className={styles.infoRow}>
                  <span className={styles.infoLabel}>Equipo:</span>
                  <span className={styles.infoValue}>{equipoNombre}</span>
                </div>
                <div className={styles.infoRow}>
                  <span className={styles.infoLabel}>Gravedad:</span>
                  <span className={`${styles.gravedadBadge} ${getGravedadClass(mostrarDatos.gravedad)}`}>
                    {getGravedadTexto(mostrarDatos.gravedad)}
                  </span>
                </div>
                <div className={styles.infoRow}>
                  <span className={styles.infoLabel}>Estado:</span>
                  <span className={`${styles.estadoBadge} ${getEstadoClass(mostrarDatos.estado)}`}>
                    {getEstadoTexto(mostrarDatos.estado)}
                  </span>
                </div>
                {mostrarDatos.reportado_por && (
                  <div className={styles.infoRow}>
                    <span className={styles.infoLabel}>Reportado por:</span>
                    <span className={styles.infoValue}>{mostrarDatos.reportado_por}</span>
                  </div>
                )}
                {esVistaPrevia && mostrarDatos.modificado_por && (
                  <div className={styles.infoRow}>
                    <span className={styles.infoLabel}>Modificado por:</span>
                    <span className={styles.infoValue}>{mostrarDatos.modificado_por}</span>
                  </div>
                )}
              </div>

              <div className={styles.infoSection}>
                <h4 className={styles.sectionSubtitle}>📅 Fechas</h4>
                <div className={styles.infoRow}>
                  <span className={styles.infoLabel}>Reportado:</span>
                  <span className={styles.infoValue}>{formatDate(mostrarDatos.fecha_reporte)}</span>
                </div>
                {mostrarDatos.fecha_solucion && (
                  <div className={styles.infoRow}>
                    <span className={styles.infoLabel}>Solucionado:</span>
                    <span className={styles.infoValue}>{formatDate(mostrarDatos.fecha_solucion)}</span>
                  </div>
                )}
                {esVistaPrevia && mostrarDatos.fecha_modificacion && (
                  <div className={styles.infoRow}>
                    <span className={styles.infoLabel}>Fecha modificación:</span>
                    <span className={styles.infoValue}>{formatDate(mostrarDatos.fecha_modificacion)}</span>
                  </div>
                )}
              </div>

              <div className={styles.infoSection}>
                <h4 className={styles.sectionSubtitle}>📝 Descripción del problema</h4>
                <div className={styles.descripcionBox}>{mostrarDatos.descripcion}</div>
              </div>

              {mostrarDatos.solucion && (
                <div className={styles.infoSection}>
                  <h4 className={styles.sectionSubtitle}>💡 Solución aplicada</h4>
                  <div className={styles.solucionBox}>{mostrarDatos.solucion}</div>
                </div>
              )}

              {mostrarDatos.costo_estimado && (
                <div className={styles.infoSection}>
                  <h4 className={styles.sectionSubtitle}>💰 Costo estimado</h4>
                  <div className={styles.infoRow}>
                    <span className={styles.infoValue}>${Number(mostrarDatos.costo_estimado).toFixed(2)}</span>
                  </div>
                </div>
              )}

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
      </div>

      <EditarIncidenciaModal
        key={refreshKey}
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        onSuccess={handleEditSuccess}
        incidencia={datosMostrar}
        equipoNombre={equipoNombre}
      />
    </>
  );
}