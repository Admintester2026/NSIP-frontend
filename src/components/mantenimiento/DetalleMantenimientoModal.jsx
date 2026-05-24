// FRONTEND/src/components/mantenimiento/DetalleMantenimientoModal.jsx
import { useState, useEffect } from 'react';
import { mantenimientoAPI } from '../../api/mantenimiento';
import ImageGallery from './ImageGallery';
import EditarMantenimientoModal from './EditarMantenimientoModal'; // ← IMPORTAR EL MODAL DE EDICIÓN
import styles from './DetalleMantenimientoModal.module.css';

// Función para obtener la base del backend (SIN /api al final)
const getBackendBase = () => {
  return 'http://192.168.3.65:3000';
};

const getApiBase = () => {
  return `${getBackendBase()}/api`;
};

export default function DetalleMantenimientoModal({ isOpen, onClose, mantenimiento, equipoNombre, onEdit }) {
  const [evidencias, setEvidencias] = useState([]);
  const [loadingEvidencias, setLoadingEvidencias] = useState(false);
  const [versiones, setVersiones] = useState([]);
  const [cargandoVersiones, setCargandoVersiones] = useState(false);
  const [mostrarSidebar, setMostrarSidebar] = useState(false);
  const [vistaPreviaVersion, setVistaPreviaVersion] = useState(null);
  const [recargando, setRecargando] = useState(false);
  
  // Estado para el modal de edición
  const [showEditModal, setShowEditModal] = useState(false); // ← NUEVO

  const recargarDatosMantenimiento = async () => {
    if (!mantenimiento?.id) return;
    
    setRecargando(true);
    try {
      const mantenimientoActualizadoList = await mantenimientoAPI.getMantenimientosByEquipo(mantenimiento.id);
      const mantenimientoEncontrado = mantenimientoActualizadoList.find(m => m.id === mantenimiento.id);
      
      if (mantenimientoEncontrado) {
        Object.assign(mantenimiento, mantenimientoEncontrado);
      }
      await cargarVersiones();
      await cargarEvidencias(); // Recargar evidencias también
    } catch (err) {
      console.error('Error recargando datos:', err);
    } finally {
      setRecargando(false);
    }
  };

  useEffect(() => {
    if (isOpen && mantenimiento?.id) {
      setVistaPreviaVersion(null);
      setMostrarSidebar(false);
      
      cargarEvidencias();
      cargarVersiones();
    }
  }, [isOpen, mantenimiento?.id]);

  const cargarEvidencias = async () => {
    setLoadingEvidencias(true);
    try {
      const API_BASE = getApiBase();
      const response = await fetch(`${API_BASE}/mantenimiento/evidencias/mantenimiento/${mantenimiento.id}`);
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
    if (!mantenimiento?.id) return;
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

  const verVersionAnterior = (version) => {
    setVistaPreviaVersion({
      ...version,
      tecnico: version.completado_por || '',
      notas_completado: version.notas_completado || '',
      duracion: version.duracion || '',
      materiales_usados: version.materiales_usados || '',
      costo_materiales: version.costo_materiales || ''
    });
    setMostrarSidebar(false);
  };

  const cerrarVistaPrevia = () => {
    setVistaPreviaVersion(null);
  };

  // Manejador cuando se edita exitosamente
  const handleEditSuccess = async () => {
    await recargarDatosMantenimiento();
    if (onEdit) onEdit();
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

  if (!isOpen) return null;

  if (!mantenimiento) {
    return (
      <div className={styles.modalOverlay} onClick={onClose}>
        <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
          <div className={styles.modalHeader}>
            <h2>Cargando...</h2>
            <button className={styles.modalClose} onClick={onClose}>✕</button>
          </div>
          <div className={styles.modalBody}>
            <p className={styles.loadingText}>Cargando información del mantenimiento...</p>
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

  const mostrarDatos = vistaPreviaVersion || mantenimiento;
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
                ) : versiones.length > 0 ? (
                  versiones.map((v, idx) => (
                    <div key={idx} className={styles.versionItemSidebar} onClick={() => verVersionAnterior(v)}>
                      <div className={styles.versionHeaderSidebar}>
                        <span className={styles.versionBadgeSidebar}>Versión {v.version}</span>
                        <span className={styles.versionDateSidebar}>{formatDateShort(v.fecha_modificacion)}</span>
                      </div>
                      <div className={styles.versionPreviewSidebar}>{v.notas_completado?.substring(0, 60)}...</div>
                      <div className={styles.versionUserSidebar}>👤 {v.modificado_por || 'sistema'}</div>
                    </div>
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
                    '📋 Detalle del Mantenimiento'
                  )}
                </h2>
                {versiones.length > 0 && !esVistaPrevia && (
                  <button className={styles.historyButton} onClick={() => setMostrarSidebar(true)} title="Ver historial de versiones">
                    ⏱️ {versiones.length}
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
                <div className={styles.infoRow}><span className={styles.infoLabel}>Título:</span><span className={styles.infoValue}>{mantenimiento.titulo}</span></div>
                <div className={styles.infoRow}><span className={styles.infoLabel}>Equipo:</span><span className={styles.infoValue}>{equipoNombre}</span></div>
                <div className={styles.infoRow}><span className={styles.infoLabel}>Tipo:</span><span className={styles.infoValue}>{mantenimiento.tipo || 'No especificado'}</span></div>
                <div className={styles.infoRow}>
                  <span className={styles.infoLabel}>Prioridad:</span>
                  <span className={`${styles.prioridadBadge} ${
                    mantenimiento.prioridad === 'urgente' ? styles.urgente :
                    mantenimiento.prioridad === 'alta' ? styles.alta :
                    mantenimiento.prioridad === 'media' ? styles.media : styles.baja
                  }`}>{mantenimiento.prioridad || 'No especificada'}</span>
                </div>
              </div>

              <div className={styles.infoSection}>
                <h4 className={styles.sectionSubtitle}>📅 Fechas</h4>
                <div className={styles.infoRow}><span className={styles.infoLabel}>Programado:</span><span className={styles.infoValue}>{formatDate(mantenimiento.fecha_inicio)}</span></div>
                {mantenimiento.fecha_fin && <div className={styles.infoRow}><span className={styles.infoLabel}>Fin programado:</span><span className={styles.infoValue}>{formatDate(mantenimiento.fecha_fin)}</span></div>}
                <div className={styles.infoRow}><span className={styles.infoLabel}>Completado original:</span><span className={styles.infoValue}>{formatDate(mantenimiento.fecha_completado)}</span></div>
                {vistaPreviaVersion?.fecha_modificacion && <div className={styles.infoRow}><span className={styles.infoLabel}>Modificado:</span><span className={styles.infoValue}>{formatDate(vistaPreviaVersion.fecha_modificacion)}</span></div>}
              </div>

              <div className={styles.infoSection}>
                <div className={styles.sectionHeader}>
                  <h4 className={styles.sectionSubtitle}>👤 Ejecución</h4>
                  {!esVistaPrevia && (
                    <button className={styles.editarButton} onClick={() => setShowEditModal(true)}>
                      ✏️ Editar
                    </button>
                  )}
                </div>
                
                <div className={styles.infoRow}><span className={styles.infoLabel}>Técnico:</span><span className={styles.infoValue}>{mostrarDatos?.completado_por || mostrarDatos?.tecnico || 'No registrado'}</span></div>
                {mostrarDatos?.duracion && <div className={styles.infoRow}><span className={styles.infoLabel}>Duración:</span><span className={styles.infoValue}>{mostrarDatos.duracion} minutos</span></div>}
              </div>

              {(mostrarDatos?.materiales_usados || mostrarDatos?.costo_materiales) && (
                <div className={styles.infoSection}>
                  <h4 className={styles.sectionSubtitle}>🔧 Materiales y Costos</h4>
                  {mostrarDatos.materiales_usados && <div className={styles.infoRow}><span className={styles.infoLabel}>Materiales usados:</span><span className={styles.infoValue}>{mostrarDatos.materiales_usados}</span></div>}
                  {mostrarDatos.costo_materiales && <div className={styles.infoRow}><span className={styles.infoLabel}>Costo de materiales:</span><span className={styles.infoValue}>${Number(mostrarDatos.costo_materiales).toFixed(2)}</span></div>}
                </div>
              )}

              {mostrarDatos?.notas_completado && (
                <div className={styles.infoSection}>
                  <h4 className={styles.sectionSubtitle}>📝 Notas del trabajo</h4>
                  <div className={styles.notasBox}>{mostrarDatos.notas_completado}</div>
                </div>
              )}

              <div className={styles.infoSection}>
                <h4 className={styles.sectionSubtitle}>📸 Evidencias</h4>
                {loadingEvidencias ? (
                  <p className={styles.loadingText}>Cargando evidencias...</p>
                ) : evidencias.length > 0 ? (
                  <ImageGallery images={evidencias} title="Evidencias del mantenimiento" />
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

      {/* Modal de edición con subida de imágenes */}
      <EditarMantenimientoModal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        onSuccess={handleEditSuccess}
        mantenimiento={mantenimiento}
        equipoNombre={equipoNombre}
      />
    </>
  );
}