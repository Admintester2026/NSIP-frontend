// FRONTEND/src/components/mantenimiento/DetalleHistorialModal.jsx
import { useState, useEffect } from 'react';
import { mantenimientoAPI } from '../../api/mantenimiento';
import ImageGallery from './ImageGallery';
import EditarHistorialModal from './EditarHistorialModal';
import styles from './DetalleHistorialModal.module.css';

const getBackendBase = () => {
  return 'http://192.168.3.65:3000';
};

const getApiBase = () => {
  return `${getBackendBase()}/api`;
};

export default function DetalleHistorialModal({ isOpen, onClose, historialItem, equipoNombre, onEdit, equipoId }) {
  const [facturas, setFacturas] = useState([]);
  const [loadingFacturas, setLoadingFacturas] = useState(false);
  const [versiones, setVersiones] = useState([]);
  const [cargandoVersiones, setCargandoVersiones] = useState(false);
  const [mostrarSidebar, setMostrarSidebar] = useState(false);
  const [vistaPreviaVersion, setVistaPreviaVersion] = useState(null);
  const [recargando, setRecargando] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [historialActual, setHistorialActual] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    if (historialItem) {
      console.log('📌 [DetalleHistorial] historialItem PROP actualizada:', historialItem.id);
      setHistorialActual(historialItem);
    }
  }, [historialItem]);

  useEffect(() => {
    if (isOpen && historialItem?.id) {
      console.log('🎬 [DetalleHistorial] Modal abierto con historial ID:', historialItem.id);
      setVistaPreviaVersion(null);
      setMostrarSidebar(false);
      setHistorialActual(historialItem);
      cargarTodo();
    }
  }, [isOpen, historialItem?.id]);

  const cargarTodo = async () => {
    console.log('🔄 [DetalleHistorial] Iniciando carga completa...');
    await cargarHistorialDesdeBackend();
    await cargarFacturas();
    await cargarVersiones();
  };

  const cargarHistorialDesdeBackend = async () => {
    const idActual = historialActual?.id || historialItem?.id;
    const equipoIdActual = equipoId || historialItem?.equipo_id;
    if (!idActual || !equipoIdActual) return;
    
    console.log('🔍 [DetalleHistorial] Recargando historial ID:', idActual, 'Equipo ID:', equipoIdActual);
    try {
      const API_BASE = getApiBase();
      const response = await fetch(`${API_BASE}/mantenimiento/equipos/${equipoIdActual}/historial`);
      const data = await response.json();
      console.log('📡 [DetalleHistorial] Respuesta del backend:', data);
      
      if (data.ok && data.datos) {
        const encontrado = data.datos.find(h => h.id === idActual);
        if (encontrado) {
          console.log('✅ [DetalleHistorial] Historial encontrado:', encontrado);
          setHistorialActual(encontrado);
        } else {
          console.log('⚠️ [DetalleHistorial] No se encontró el historial');
        }
      }
    } catch (err) {
      console.error('❌ [DetalleHistorial] Error cargando historial:', err);
    }
  };

  const cargarFacturas = async () => {
    const idActual = historialActual?.id || historialItem?.id;
    if (!idActual) return;
    
    console.log('📸 [DetalleHistorial] Cargando facturas para ID:', idActual);
    setLoadingFacturas(true);
    try {
      const API_BASE = getApiBase();
      const response = await fetch(`${API_BASE}/mantenimiento/evidencias/historial/${idActual}`);
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        const data = await response.json();
        if (data.ok) {
          const backendBase = getBackendBase();
          const facturasConUrlAbsoluta = (data.datos || []).map(fact => ({
            ...fact,
            url: fact.url.startsWith('http') ? fact.url : `${backendBase}${fact.url}`
          }));
          console.log('✅ [DetalleHistorial] Facturas cargadas:', facturasConUrlAbsoluta.length);
          setFacturas(facturasConUrlAbsoluta);
        }
      }
    } catch (err) {
      console.error('❌ Error cargando facturas:', err);
    } finally {
      setLoadingFacturas(false);
    }
  };

  const cargarVersiones = async () => {
    const idActual = historialActual?.id || historialItem?.id;
    if (!idActual) return;
    
    console.log('📜 [DetalleHistorial] Cargando versiones para historial ID:', idActual);
    setCargandoVersiones(true);
    try {
      // Para historial de equipos, las versiones son los propios registros
      // Cada vez que se edita, se crea un NUEVO registro en historial_equipos
      // Por ahora, mostramos el registro actual como única versión
      // En el futuro, si quieres versionado, necesitarías una tabla historial_equipos_historial
      
      const versionesSimuladas = [];
      const datos = historialActual || historialItem;
      
      if (datos?.campo_modificado) {
        versionesSimuladas.push({
          version: 1,
          campo_modificado: datos.campo_modificado,
          valor_anterior: datos.valor_anterior,
          valor_nuevo: datos.valor_nuevo,
          descripcion: datos.descripcion,
          fecha_modificacion: datos.fecha || new Date().toISOString(),
          modificado_por: datos.usuario || 'sistema'
        });
      }
      
      console.log('📜 [DetalleHistorial] Versiones generadas:', versionesSimuladas.length);
      setVersiones(versionesSimuladas);
    } catch (err) {
      console.error('❌ Error cargando versiones:', err);
    } finally {
      setCargandoVersiones(false);
    }
  };

  const verVersionAnterior = (version) => {
    console.log('👁️ [DetalleHistorial] Viendo versión:', version.version);
    setVistaPreviaVersion(version);
    setMostrarSidebar(false);
  };

  const cerrarVistaPrevia = () => {
    console.log('👁️ [DetalleHistorial] Cerrando vista previa');
    setVistaPreviaVersion(null);
  };

  const handleEditSuccess = async () => {
    console.log('🔵🔵🔵 [DetalleHistorial] handleEditSuccess - INICIADO 🔵🔵🔵');
    
    if (onEdit) {
      console.log('📞 [DetalleHistorial] Llamando a onEdit del padre...');
      await onEdit();
    }
    
    console.log('🔄 [DetalleHistorial] Recargando todos los datos...');
    await cargarHistorialDesdeBackend();
    await cargarFacturas();
    await cargarVersiones();
    
    setRefreshKey(prev => prev + 1);
    console.log('🔵🔵🔵 [DetalleHistorial] handleEditSuccess - FINALIZADO 🔵🔵🔵');
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

  const getCampoModificadoTexto = (campo) => {
    const campos = {
      'pieza_reemplazada': '🔧 Pieza Reemplazada',
      'configuracion': '⚙️ Configuración',
      'calibracion': '📏 Calibración',
      'reparacion': '🛠️ Reparación',
      'actualizacion': '🔄 Actualización',
      'observacion': '📝 Observación',
      'factura': '🧾 Factura / Comprobante'
    };
    return campos[campo] || campo;
  };

  if (!isOpen) return null;

  if (!historialActual && !historialItem) {
    return (
      <div className={styles.modalOverlay} onClick={onClose}>
        <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
          <div className={styles.modalHeader}>
            <h2>Cargando...</h2>
            <button className={styles.modalClose} onClick={onClose}>✕</button>
          </div>
          <div className={styles.modalBody}>
            <p className={styles.loadingText}>Cargando información del registro...</p>
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

  const datosMostrar = historialActual || historialItem;
  const mostrarDatos = vistaPreviaVersion || datosMostrar;
  const esVistaPrevia = vistaPreviaVersion !== null;

  console.log('🎨 [DetalleHistorial] Renderizando con datos:', { 
    id: datosMostrar?.id, 
    campo: datosMostrar?.campo_modificado,
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
                  versiones.map((v, idx) => (
                    v.version !== 1 && (
                      <div key={idx} className={styles.versionItemSidebar} onClick={() => verVersionAnterior(v)}>
                        <div className={styles.versionHeaderSidebar}>
                          <span className={styles.versionBadgeSidebar}>Versión {v.version}</span>
                          <span className={styles.versionDateSidebar}>{formatDateShort(v.fecha_modificacion)}</span>
                        </div>
                        <div className={styles.versionPreviewSidebar}>
                          {v.descripcion?.substring(0, 60) || v.campo_modificado?.substring(0, 60)}...
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
                    '📜 Detalle de Cambio Registrado'
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
                  <h4 className={styles.sectionSubtitle}>📋 Información del cambio</h4>
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
                  <span className={styles.infoLabel}>Tipo de cambio:</span>
                  <span className={styles.infoValue}>{getCampoModificadoTexto(mostrarDatos.campo_modificado)}</span>
                </div>
                <div className={styles.infoRow}>
                  <span className={styles.infoLabel}>Equipo:</span>
                  <span className={styles.infoValue}>{equipoNombre}</span>
                </div>
                {mostrarDatos.usuario && (
                  <div className={styles.infoRow}>
                    <span className={styles.infoLabel}>Registrado por:</span>
                    <span className={styles.infoValue}>{mostrarDatos.usuario}</span>
                  </div>
                )}
              </div>

              <div className={styles.infoSection}>
                <h4 className={styles.sectionSubtitle}>📅 Fecha del cambio</h4>
                <div className={styles.infoRow}>
                  <span className={styles.infoValue}>{formatDate(mostrarDatos.fecha)}</span>
                </div>
              </div>

              {(mostrarDatos.valor_anterior || mostrarDatos.valor_nuevo) && (
                <div className={styles.infoSection}>
                  <h4 className={styles.sectionSubtitle}>🔄 Valores del cambio</h4>
                  {mostrarDatos.valor_anterior && (
                    <div className={styles.infoRow}>
                      <span className={styles.infoLabel}>Valor anterior:</span>
                      <span className={styles.valorAnterior}>{mostrarDatos.valor_anterior}</span>
                    </div>
                  )}
                  {mostrarDatos.valor_nuevo && (
                    <div className={styles.infoRow}>
                      <span className={styles.infoLabel}>Valor nuevo:</span>
                      <span className={styles.valorNuevo}>{mostrarDatos.valor_nuevo}</span>
                    </div>
                  )}
                </div>
              )}

              {mostrarDatos.descripcion && (
                <div className={styles.infoSection}>
                  <h4 className={styles.sectionSubtitle}>📝 Descripción</h4>
                  <div className={styles.descripcionBox}>{mostrarDatos.descripcion}</div>
                </div>
              )}

              <div className={styles.infoSection}>
                <h4 className={styles.sectionSubtitle}>🧾 Facturas / Comprobantes</h4>
                {loadingFacturas ? (
                  <p className={styles.loadingText}>Cargando documentos...</p>
                ) : facturas.length > 0 ? (
                  <ImageGallery images={facturas} title="Facturas y comprobantes" />
                ) : (
                  <p className={styles.emptyMessage}>No hay facturas o comprobantes adjuntos</p>
                )}
              </div>
            </div>

            <div className={styles.modalFooter}>
              <button className={styles.closeButton} onClick={onClose}>Cerrar</button>
            </div>
          </div>
        </div>
      </div>

      <EditarHistorialModal
        key={refreshKey}
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        onSuccess={handleEditSuccess}
        historialItem={datosMostrar}
        equipoNombre={equipoNombre}
      />
    </>
  );
}