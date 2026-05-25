// FRONTEND/src/components/mantenimiento/DetalleHistorialModal.jsx
import { useState, useEffect } from 'react';
import { mantenimientoAPI } from '../../api/mantenimiento';
import ImageGallery from './ImageGallery';
import EditarHistorialModal from './EditarHistorialModal';
import styles from './DetalleHistorialModal.module.css';

// Función para obtener la base del backend
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

  // Cargar el historial actualizado desde el backend
  const cargarHistorialActualizado = async () => {
    if (!historialItem?.id && !historialActual?.id) return null;
    const idActual = historialItem?.id || historialActual?.id;
    const equipoIdActual = equipoId || historialItem?.equipo_id;
    
    if (!idActual || !equipoIdActual) return null;
    
    try {
      const API_BASE = getApiBase();
      const response = await fetch(`${API_BASE}/mantenimiento/equipos/${equipoIdActual}/historial`);
      const data = await response.json();
      if (data.ok && data.datos) {
        const encontrado = data.datos.find(h => h.id === idActual);
        if (encontrado) {
          setHistorialActual(encontrado);
          setRefreshKey(prev => prev + 1);
          return encontrado;
        }
      }
      return historialActual || historialItem;
    } catch (err) {
      console.error('Error cargando historial actualizado:', err);
      return historialActual || historialItem;
    }
  };

  const recargarDatosHistorial = async () => {
    if (!historialItem?.id && !historialActual?.id) return;
    
    setRecargando(true);
    try {
      await cargarHistorialActualizado();
      await cargarVersiones();
      await cargarFacturas();
    } catch (err) {
      console.error('Error recargando datos:', err);
    } finally {
      setRecargando(false);
    }
  };

  useEffect(() => {
    if (isOpen && historialItem?.id) {
      setVistaPreviaVersion(null);
      setMostrarSidebar(false);
      setHistorialActual(historialItem);
      cargarFacturas();
      cargarVersiones();
    }
  }, [isOpen, historialItem?.id]);

  useEffect(() => {
    if (historialItem) {
      setHistorialActual(historialItem);
    }
  }, [historialItem]);

  const cargarFacturas = async () => {
    const idActual = historialItem?.id || historialActual?.id;
    if (!idActual) return;
    
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
          setFacturas(facturasConUrlAbsoluta);
        }
      }
    } catch (err) {
      console.error('Error cargando facturas:', err);
    } finally {
      setLoadingFacturas(false);
    }
  };

  const cargarVersiones = async () => {
    const idActual = historialItem?.id || historialActual?.id;
    if (!idActual) return;
    
    setCargandoVersiones(true);
    try {
      // Intentar obtener versiones del historial desde el backend
      // Por ahora, generamos versiones simuladas basadas en los datos actuales
      const versionesSimuladas = [];
      
      if (historialActual || historialItem) {
        const datos = historialActual || historialItem;
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
      
      setVersiones(versionesSimuladas);
    } catch (err) {
      console.error('Error cargando versiones:', err);
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
    // Recargar el historial actualizado desde el backend
    const historialActualizado = await cargarHistorialActualizado();
    if (historialActualizado) {
      setHistorialActual(historialActualizado);
    }
    await recargarDatosHistorial();
    // Notificar al padre que recargue los datos
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

      {/* Modal de edición */}
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