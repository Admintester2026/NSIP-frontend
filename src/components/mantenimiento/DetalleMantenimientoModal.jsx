// FRONTEND/src/components/mantenimiento/DetalleMantenimientoModal.jsx
import { useState, useEffect } from 'react';
import { mantenimientoAPI } from '../../api/mantenimiento';
import ImageGallery from './ImageGallery';
import EditarMantenimientoModal from './EditarMantenimientoModal';
import styles from './DetalleMantenimientoModal.module.css';

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
  const [showEditModal, setShowEditModal] = useState(false);
  const [mantenimientoActual, setMantenimientoActual] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    if (mantenimiento) {
      console.log('📌 [DetalleMantenimiento] mantenimiento PROP actualizada:', mantenimiento.id);
      setMantenimientoActual(mantenimiento);
    }
  }, [mantenimiento]);

  useEffect(() => {
    if (isOpen && mantenimiento?.id) {
      console.log('🎬 [DetalleMantenimiento] Modal abierto con mantenimiento ID:', mantenimiento.id);
      setVistaPreviaVersion(null);
      setMostrarSidebar(false);
      setMantenimientoActual(mantenimiento);
      recargarMantenimientoCompleto();
    }
  }, [isOpen, mantenimiento?.id]);

  const recargarMantenimientoCompleto = async () => {
    const idActual = mantenimientoActual?.id || mantenimiento?.id;
    if (!idActual) return;
    
    console.log('🔄 [DetalleMantenimiento] Recargando datos del mantenimiento ID:', idActual);
    setRecargando(true);
    try {
      const API_BASE = getApiBase();
      const response = await fetch(`${API_BASE}/mantenimiento/mantenimientos/equipo/${idActual}`);
      const data = await response.json();
      console.log('📡 [DetalleMantenimiento] Respuesta del backend:', data);
      
      if (data.ok && data.datos) {
        const encontrado = data.datos.find(m => m.id === idActual);
        if (encontrado) {
          console.log('✅ [DetalleMantenimiento] Mantenimiento encontrado:', encontrado);
          setMantenimientoActual(encontrado);
        }
      }
      
      await cargarEvidencias(idActual);
      await cargarVersiones(idActual);
      
    } catch (err) {
      console.error('❌ Error recargando mantenimiento:', err);
    } finally {
      setRecargando(false);
    }
  };

  const cargarEvidencias = async (idActual) => {
    if (!idActual) return;
    
    console.log('📸 [DetalleMantenimiento] Cargando evidencias...');
    setLoadingEvidencias(true);
    try {
      const API_BASE = getApiBase();
      const response = await fetch(`${API_BASE}/mantenimiento/evidencias/mantenimiento/${idActual}`);
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        const data = await response.json();
        if (data.ok) {
          const backendBase = getBackendBase();
          const evidenciasConUrlAbsoluta = (data.datos || []).map(ev => ({
            ...ev,
            url: ev.url.startsWith('http') ? ev.url : `${backendBase}${ev.url}`
          }));
          console.log('✅ [DetalleMantenimiento] Evidencias cargadas:', evidenciasConUrlAbsoluta.length);
          setEvidencias(evidenciasConUrlAbsoluta);
        }
      }
    } catch (err) {
      console.error('Error cargando evidencias:', err);
    } finally {
      setLoadingEvidencias(false);
    }
  };

  const cargarVersiones = async (idActual) => {
    if (!idActual) return;
    
    console.log('📜 [DetalleMantenimiento] Cargando versiones...');
    setCargandoVersiones(true);
    try {
      const data = await mantenimientoAPI.getHistorialVersiones(idActual);
      console.log('✅ [DetalleMantenimiento] Versiones cargadas:', data?.length || 0);
      setVersiones(data || []);
    } catch (err) {
      console.error('Error cargando versiones:', err);
    } finally {
      setCargandoVersiones(false);
    }
  };

  const verVersionAnterior = (version) => {
    console.log('👁️ [DetalleMantenimiento] Viendo versión:', version.version);
    setVistaPreviaVersion(version);
    setMostrarSidebar(false);
  };

  const cerrarVistaPrevia = () => {
    console.log('👁️ [DetalleMantenimiento] Cerrando vista previa');
    setVistaPreviaVersion(null);
  };

  const handleEditSuccess = async () => {
    console.log('🔵🔵🔵 [DetalleMantenimiento] handleEditSuccess - INICIADO 🔵🔵🔵');
    
    if (onEdit) {
      console.log('📞 Llamando a onEdit del padre...');
      await onEdit();
    }
    
    console.log('🔄 Recargando todos los datos...');
    await recargarMantenimientoCompleto();
    setRefreshKey(prev => prev + 1);
    
    console.log('🔵🔵🔵 [DetalleMantenimiento] handleEditSuccess - FINALIZADO 🔵🔵🔵');
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

  if (!mantenimientoActual && !mantenimiento) {
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

  const datosMostrar = mantenimientoActual || mantenimiento;
  const mostrarDatos = vistaPreviaVersion || datosMostrar;
  const esVistaPrevia = vistaPreviaVersion !== null;

  console.log('🎨 [DetalleMantenimiento] Renderizando con datos:', { 
    id: datosMostrar?.id, 
    titulo: datosMostrar?.titulo,
    versionesCount: versiones.length 
  });

  return (
    <>
      <div className={styles.modalOverlay} onClick={onClose}>
        <div className={`${styles.modal} ${mostrarSidebar ? styles.withSidebar : ''}`} onClick={(e) => e.stopPropagation()}>
          {mostrarSidebar && (
            <div className={styles.sidebar}>
              <div className={styles.sidebarHeader}>
                <h3>📜 Versiones anteriores ({versiones.length})</h3>
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
                <div className={styles.sectionHeader}>
                  <h4 className={styles.sectionSubtitle}>📋 Información general</h4>
                  {!esVistaPrevia && (
                    <button className={styles.editarButton} onClick={() => setShowEditModal(true)}>
                      ✏️ Editar
                    </button>
                  )}
                </div>
                <div className={styles.infoRow}><span className={styles.infoLabel}>Título:</span><span className={styles.infoValue}>{mostrarDatos.titulo}</span></div>
                <div className={styles.infoRow}><span className={styles.infoLabel}>Equipo:</span><span className={styles.infoValue}>{equipoNombre}</span></div>
                <div className={styles.infoRow}><span className={styles.infoLabel}>Tipo:</span><span className={styles.infoValue}>{mostrarDatos.tipo || 'No especificado'}</span></div>
                <div className={styles.infoRow}>
                  <span className={styles.infoLabel}>Prioridad:</span>
                  <span className={`${styles.prioridadBadge} ${
                    mostrarDatos.prioridad === 'urgente' ? styles.urgente :
                    mostrarDatos.prioridad === 'alta' ? styles.alta :
                    mostrarDatos.prioridad === 'media' ? styles.media : styles.baja
                  }`}>{mostrarDatos.prioridad || 'No especificada'}</span>
                </div>
              </div>

              <div className={styles.infoSection}>
                <h4 className={styles.sectionSubtitle}>📅 Fechas</h4>
                <div className={styles.infoRow}><span className={styles.infoLabel}>Programado:</span><span className={styles.infoValue}>{formatDate(mostrarDatos.fecha_inicio)}</span></div>
                {mostrarDatos.fecha_fin && <div className={styles.infoRow}><span className={styles.infoLabel}>Fin programado:</span><span className={styles.infoValue}>{formatDate(mostrarDatos.fecha_fin)}</span></div>}
                <div className={styles.infoRow}><span className={styles.infoLabel}>Completado:</span><span className={styles.infoValue}>{formatDate(mostrarDatos.fecha_completado)}</span></div>
              </div>

              <div className={styles.infoSection}>
                <h4 className={styles.sectionSubtitle}>👤 Ejecución</h4>
                <div className={styles.infoRow}><span className={styles.infoLabel}>Técnico:</span><span className={styles.infoValue}>{mostrarDatos.completado_por || mostrarDatos.tecnico || 'No registrado'}</span></div>
                {mostrarDatos.duracion && <div className={styles.infoRow}><span className={styles.infoLabel}>Duración:</span><span className={styles.infoValue}>{mostrarDatos.duracion} minutos</span></div>}
              </div>

              {(mostrarDatos.materiales_usados || mostrarDatos.costo_materiales) && (
                <div className={styles.infoSection}>
                  <h4 className={styles.sectionSubtitle}>🔧 Materiales y Costos</h4>
                  {mostrarDatos.materiales_usados && <div className={styles.infoRow}><span className={styles.infoLabel}>Materiales usados:</span><span className={styles.infoValue}>{mostrarDatos.materiales_usados}</span></div>}
                  {mostrarDatos.costo_materiales && <div className={styles.infoRow}><span className={styles.infoLabel}>Costo de materiales:</span><span className={styles.infoValue}>${Number(mostrarDatos.costo_materiales).toFixed(2)}</span></div>}
                </div>
              )}

              {mostrarDatos.notas_completado && (
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

      <EditarMantenimientoModal
        key={refreshKey}
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        onSuccess={handleEditSuccess}
        mantenimiento={datosMostrar}
        equipoNombre={equipoNombre}
      />
    </>
  );
}