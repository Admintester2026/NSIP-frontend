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

  // LOG: Cuando se abre el modal
  useEffect(() => {
    console.log('🔴🔴🔴 DETALLE INCIDENCIA - MODAL ABIERTO 🔴🔴🔴');
    console.log('📌 incidencia recibida (prop):', incidencia);
    console.log('📌 incidencia.id:', incidencia?.id);
  }, [isOpen]);

  // LOG: Cuando cambia la incidencia
  useEffect(() => {
    console.log('🟡🟡🟡 DETALLE INCIDENCIA - incidencia PROP CAMBIÓ 🟡🟡🟡');
    console.log('📌 nueva incidencia:', incidencia);
  }, [incidencia]);

  // LOG: Cuando cambia incidenciaActual
  useEffect(() => {
    console.log('🟢🟢🟢 DETALLE INCIDENCIA - incidenciaActual CAMBIÓ 🟢🟢🟢');
    console.log('📌 incidenciaActual:', incidenciaActual);
  }, [incidenciaActual]);

  const cargarIncidenciaActualizada = async () => {
    const idActual = incidencia?.id;
    console.log('🔍🔍🔍 CARGANDO INCIDENCIA ACTUALIZADA 🔍🔍🔍');
    console.log('📌 ID a buscar:', idActual);
    
    if (!idActual) return null;
    
    try {
      const API_BASE = getApiBase();
      const url = `${API_BASE}/mantenimiento/incidencias/equipo/${idActual}`;
      console.log('📡 Fetching URL:', url);
      
      const response = await fetch(url);
      const data = await response.json();
      console.log('📡 Respuesta completa:', data);
      
      if (data.ok && data.datos && data.datos.length > 0) {
        const incidenciaEncontrada = data.datos.find(i => i.id === idActual);
        console.log('📌 Incidencia encontrada en la lista:', incidenciaEncontrada);
        
        if (incidenciaEncontrada) {
          console.log('✅ Actualizando incidenciaActual con:', incidenciaEncontrada);
          setIncidenciaActual(incidenciaEncontrada);
          return incidenciaEncontrada;
        }
      }
      console.log('⚠️ No se encontró la incidencia, usando la original');
      return incidencia;
    } catch (err) {
      console.error('❌ Error cargando incidencia actualizada:', err);
      return incidencia;
    }
  };

  const recargarDatosIncidencia = async () => {
    console.log('🔄🔄🔄 RECARGANDO DATOS DE INCIDENCIA 🔄🔄🔄');
    setRecargando(true);
    try {
      console.log('📌 Paso 1: Cargar incidencia actualizada');
      const incidenciaActualizada = await cargarIncidenciaActualizada();
      console.log('📌 incidenciaActualizada obtenida:', incidenciaActualizada);
      
      console.log('📌 Paso 2: Cargar versiones');
      await cargarVersiones();
      
      console.log('📌 Paso 3: Cargar evidencias');
      await cargarEvidencias();
      
      console.log('✅ Recarga completada');
    } catch (err) {
      console.error('❌ Error recargando datos:', err);
    } finally {
      setRecargando(false);
    }
  };

  useEffect(() => {
    if (isOpen && incidencia?.id) {
      console.log('🎬🎬🎬 useEffect INIT - Modal abierto con incidencia ID:', incidencia.id);
      setVistaPreviaVersion(null);
      setMostrarSidebar(false);
      setIncidenciaActual(incidencia);
      cargarEvidencias();
      cargarVersiones();
    }
  }, [isOpen, incidencia?.id]);

  useEffect(() => {
    if (incidencia) {
      console.log('📌 Actualizando incidenciaActual porque cambió la prop incidencia');
      setIncidenciaActual(incidencia);
    }
  }, [incidencia]);

  const cargarEvidencias = async () => {
    const idActual = incidencia?.id || incidenciaActual?.id;
    console.log('📸📸📸 CARGANDO EVIDENCIAS para incidencia ID:', idActual);
    
    if (!idActual) return;
    
    setLoadingEvidencias(true);
    try {
      const API_BASE = getApiBase();
      const url = `${API_BASE}/mantenimiento/evidencias/incidencia/${idActual}`;
      console.log('📡 Fetching evidencias desde:', url);
      
      const response = await fetch(url);
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        const data = await response.json();
        console.log('📡 Respuesta evidencias:', data);
        if (data.ok) {
          const backendBase = getBackendBase();
          const evidenciasConUrlAbsoluta = (data.datos || []).map(ev => ({
            ...ev,
            url: ev.url.startsWith('http') ? ev.url : `${backendBase}${ev.url}`
          }));
          console.log('✅ Evidencias cargadas:', evidenciasConUrlAbsoluta.length);
          setEvidencias(evidenciasConUrlAbsoluta);
        }
      }
    } catch (err) {
      console.error('❌ Error cargando evidencias:', err);
    } finally {
      setLoadingEvidencias(false);
    }
  };

  const cargarVersiones = async () => {
    const idActual = incidencia?.id || incidenciaActual?.id;
    console.log('📜📜📜 CARGANDO VERSIONES para incidencia ID:', idActual);
    
    if (!idActual) return;
    
    setCargandoVersiones(true);
    try {
      const data = await mantenimientoAPI.getHistorialVersionesIncidencia(idActual);
      console.log('📜 Versiones obtenidas:', data);
      console.log('📜 Cantidad de versiones:', data?.length || 0);
      setVersiones(data || []);
    } catch (err) {
      console.error('❌ Error cargando versiones:', err);
    } finally {
      setCargandoVersiones(false);
    }
  };

  const verVersionAnterior = (version) => {
    console.log('👁️ Viendo versión anterior:', version);
    setVistaPreviaVersion(version);
    setMostrarSidebar(false);
  };

  const cerrarVistaPrevia = () => {
    console.log('👁️ Cerrando vista previa');
    setVistaPreviaVersion(null);
  };

  const handleEditSuccess = async () => {
    console.log('🔵🔵🔵 HANDLE EDIT SUCCESS - INICIANDO 🔵🔵🔵');
    console.log('📌 incidencia actual antes de recargar:', incidenciaActual);
    
    const incidenciaActualizada = await cargarIncidenciaActualizada();
    console.log('📌 incidenciaActualizada después de cargar:', incidenciaActualizada);
    
    if (incidenciaActualizada) {
      setIncidenciaActual(incidenciaActualizada);
      console.log('✅ incidenciaActual actualizada');
    }
    
    await recargarDatosIncidencia();
    console.log('📌 onEdit será llamado');
    if (onEdit) onEdit();
    console.log('🔵🔵🔵 HANDLE EDIT SUCCESS - FINALIZADO 🔵🔵🔵');
  };

  // Resto del componente (render) igual...
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

  console.log('🎨🎨🎨 RENDERIZANDO MODAL con datosMostrar:', datosMostrar);

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
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        onSuccess={handleEditSuccess}
        incidencia={datosMostrar}
        equipoNombre={equipoNombre}
      />
    </>
  );
}