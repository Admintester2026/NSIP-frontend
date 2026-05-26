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

export default function DetalleIncidenciaModal({ isOpen, onClose, incidencia, equipoNombre, equipoId, onEdit }) {
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
    if (incidencia) {
      console.log('📌 [DetalleIncidencia] incidencia PROP actualizada:', incidencia.id);
      setIncidenciaActual(incidencia);
    }
  }, [incidencia]);

  useEffect(() => {
    if (isOpen && incidencia?.id) {
      console.log('🎬 [DetalleIncidencia] Modal abierto con incidencia ID:', incidencia.id);
      setVistaPreviaVersion(null);
      setMostrarSidebar(false);
      setIncidenciaActual(incidencia);
      recargarIncidenciaCompleta();
    }
  }, [isOpen, incidencia?.id]);

  const recargarIncidenciaCompleta = async () => {
    const idActual = incidenciaActual?.id || incidencia?.id;
    if (!idActual || !equipoId) {
      console.log('⚠️ [DetalleIncidencia] Faltan IDs:', { idActual, equipoId });
      return;
    }
    
    console.log('🔄 [DetalleIncidencia] Recargando datos de incidencia ID:', idActual, 'Equipo ID:', equipoId);
    setRecargando(true);
    try {
      await cargarIncidenciaDesdeBackend(idActual, equipoId);
      await cargarEvidencias(idActual);
      await cargarVersiones(idActual);
    } catch (err) {
      console.error('❌ Error recargando incidencia:', err);
    } finally {
      setRecargando(false);
    }
  };

  const cargarIncidenciaDesdeBackend = async (idActual, equipoIdActual) => {
    console.log('🔍 [DetalleIncidencia] Buscando incidencia ID:', idActual, 'en equipo:', equipoIdActual);
    try {
      const API_BASE = getApiBase();
      const response = await fetch(`${API_BASE}/mantenimiento/incidencias/equipo/${equipoIdActual}`);
      const data = await response.json();
      console.log('📡 [DetalleIncidencia] Respuesta del backend:', data);
      
      if (data.ok && data.datos) {
        const encontrada = data.datos.find(i => i.id === idActual);
        if (encontrada) {
          console.log('✅ [DetalleIncidencia] Incidencia encontrada:', encontrada);
          setIncidenciaActual(encontrada);
        } else {
          console.log('⚠️ [DetalleIncidencia] No se encontró la incidencia');
        }
      }
    } catch (err) {
      console.error('❌ Error cargando incidencia:', err);
    }
  };

  const cargarEvidencias = async (idActual) => {
    if (!idActual) return;
    
    console.log('📸 [DetalleIncidencia] Cargando evidencias para ID:', idActual);
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
          console.log('✅ [DetalleIncidencia] Evidencias cargadas:', evidenciasConUrlAbsoluta.length);
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
    
    console.log('📜 [DetalleIncidencia] Cargando versiones para ID:', idActual);
    setCargandoVersiones(true);
    try {
      const data = await mantenimientoAPI.getHistorialVersionesIncidencia(idActual);
      console.log('📜 [DetalleIncidencia] Versiones recibidas:', data?.length || 0);
      setVersiones(data || []);
    } catch (err) {
      console.error('❌ Error cargando versiones:', err);
      setVersiones([]);
    } finally {
      setCargandoVersiones(false);
    }
  };

  const verVersionAnterior = (version) => {
    console.log('👁️ [DetalleIncidencia] Viendo versión:', version.version);
    setVistaPreviaVersion(version);
    setMostrarSidebar(false);
  };

  const cerrarVistaPrevia = () => {
    console.log('👁️ [DetalleIncidencia] Cerrando vista previa');
    setVistaPreviaVersion(null);
  };

  const handleEditSuccess = async () => {
    console.log('🔵🔵🔵 [DetalleIncidencia] handleEditSuccess - INICIADO 🔵🔵🔵');
    
    if (onEdit) {
      console.log('📞 Llamando a onEdit del padre...');
      await onEdit();
    }
    
    console.log('🔄 Recargando todos los datos...');
    await recargarIncidenciaCompleta();
    setRefreshKey(prev => prev + 1);
    
    console.log('🔵🔵🔵 [DetalleIncidencia] handleEditSuccess - FINALIZADO 🔵🔵🔵');
  };

  // Resto del componente igual...
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

  console.log('🎨 [DetalleIncidencia] Renderizando con datos:', { 
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
                ) : versiones.length > 1 ? (
                  [...versiones].sort((a, b) => b.version - a.version).map((v, idx) => (
                    v.version !== versiones[0]?.version && (
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