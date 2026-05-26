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

export default function DetalleHistorialModal({ isOpen, onClose, historialItem, equipoNombre, equipoId, onEdit }) {
  const [facturas, setFacturas] = useState([]);
  const [loadingFacturas, setLoadingFacturas] = useState(false);
  const [versiones, setVersiones] = useState([]);
  const [cargandoVersiones, setCargandoVersiones] = useState(false);
  const [mostrarSidebar, setMostrarSidebar] = useState(false);
  const [vistaPreviaVersion, setVistaPreviaVersion] = useState(null);
  const [recargando, setRecargando] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [historialActual, setHistorialActual] = useState(null);

  // Limpiar estado cuando se cierra el modal
  useEffect(() => {
    if (!isOpen) {
      setHistorialActual(null);
      setVersiones([]);
      setShowEditModal(false);
    }
  }, [isOpen]);

  useEffect(() => {
    if (historialItem) {
      setHistorialActual(historialItem);
    }
  }, [historialItem]);

  useEffect(() => {
    if (isOpen && historialItem?.id) {
      setVistaPreviaVersion(null);
      setMostrarSidebar(false);
      setHistorialActual(historialItem);
      recargarHistorialCompleto();
    }
  }, [isOpen, historialItem?.id]);

  const recargarHistorialCompleto = async () => {
    const idActual = historialActual?.id || historialItem?.id;
    if (!idActual || !equipoId) return;
    
    setRecargando(true);
    try {
      await cargarHistorialDesdeBackend(idActual, equipoId);
      await cargarFacturas(idActual);
      await cargarVersiones(idActual, equipoId);
    } catch (err) {
      console.error('Error recargando historial:', err);
    } finally {
      setRecargando(false);
    }
  };

  const cargarHistorialDesdeBackend = async (idActual, equipoIdActual) => {
    try {
      const API_BASE = getApiBase();
      const response = await fetch(`${API_BASE}/mantenimiento/equipos/${equipoIdActual}/historial`);
      const data = await response.json();
      if (data.ok && data.datos) {
        const encontrado = data.datos.find(h => h.id === idActual);
        if (encontrado) {
          setHistorialActual(encontrado);
        }
      }
    } catch (err) {
      console.error('Error cargando historial:', err);
    }
  };

  const cargarFacturas = async (idActual) => {
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

  // FUNCIÓN CORREGIDA: Carga versiones acumuladas
  const cargarVersiones = async (idActual, equipoIdActual) => {
    if (!idActual || !equipoIdActual) return;
    
    setCargandoVersiones(true);
    try {
      const API_BASE = getApiBase();
      // Obtener TODO el historial del equipo
      const response = await fetch(`${API_BASE}/mantenimiento/equipos/${equipoIdActual}/historial`);
      const data = await response.json();
      
      console.log('📜 [Historial] Datos completos del equipo:', data);
      
      if (data.ok && data.datos && data.datos.length > 0) {
        // Obtener el campo_modificado del historial actual
        const campoActual = historialActual?.campo_modificado || historialItem?.campo_modificado;
        
        // Filtrar SOLO los registros del mismo campo_modificado
        const registrosDelMismoCampo = data.datos.filter(h => 
          h.campo_modificado === campoActual
        );
        
        console.log('📜 [Historial] Registros del mismo campo:', registrosDelMismoCampo);
        console.log('📜 [Historial] Campo actual:', campoActual);
        
        if (registrosDelMismoCampo.length > 0) {
          // Ordenar por fecha (más reciente primero)
          const ordenados = [...registrosDelMismoCampo].sort((a, b) => 
            new Date(b.fecha) - new Date(a.fecha)
          );
          
          // Crear versiones (la primera es la actual, el resto son anteriores)
          const versionesGeneradas = ordenados.map((h, index) => ({
            version: index + 1,
            id: h.id,
            campo_modificado: h.campo_modificado,
            valor_anterior: h.valor_anterior,
            valor_nuevo: h.valor_nuevo,
            descripcion: h.descripcion,
            fecha_modificacion: h.fecha,
            modificado_por: h.usuario || 'sistema'
          }));
          
          console.log('📜 [Historial] Versiones generadas:', versionesGeneradas.length);
          setVersiones(versionesGeneradas);
          return;
        }
      }
      
      // Fallback: si no hay múltiples registros, mostrar solo la versión actual
      const datos = historialActual || historialItem;
      if (datos?.campo_modificado) {
        setVersiones([{
          version: 1,
          campo_modificado: datos.campo_modificado,
          valor_anterior: datos.valor_anterior,
          valor_nuevo: datos.valor_nuevo,
          descripcion: datos.descripcion,
          fecha_modificacion: datos.fecha || new Date().toISOString(),
          modificado_por: datos.usuario || 'sistema'
        }]);
      } else {
        setVersiones([]);
      }
    } catch (err) {
      console.error('Error cargando versiones:', err);
      setVersiones([]);
    } finally {
      setCargandoVersiones(false);
    }
  };

  const verVersionAnterior = (version) => {
    console.log('👁️ [Historial] Viendo versión:', version);
    setVistaPreviaVersion(version);
    setMostrarSidebar(false);
  };

  const cerrarVistaPrevia = () => {
    setVistaPreviaVersion(null);
  };

  const handleEditSuccess = async () => {
    if (onEdit) {
      await onEdit();
    }
    await recargarHistorialCompleto();
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

  // Mostrar el botón de historial si hay más de 1 versión
  const mostrarBotonHistorial = versiones.length > 1;

  return (
    <>
      <div className={styles.modalOverlay} onClick={onClose}>
        <div className={`${styles.modal} ${mostrarSidebar ? styles.withSidebar : ''}`} onClick={(e) => e.stopPropagation()}>
          {mostrarSidebar && (
            <div className={styles.sidebar}>
              <div className={styles.sidebarHeader}>
                <h3>📜 Versiones anteriores ({versiones.length - 1})</h3>
                <button className={styles.sidebarClose} onClick={() => setMostrarSidebar(false)}>✕</button>
              </div>
              <div className={styles.sidebarContent}>
                {cargandoVersiones ? (
                  <p className={styles.loadingText}>Cargando...</p>
                ) : versiones.length > 1 ? (
                  // Mostrar todas las versiones EXCEPTO la primera (actual)
                  [...versiones].slice(1).map((v, idx) => (
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
                {mostrarBotonHistorial && !esVistaPrevia && (
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
        key={historialActual?.id}
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        onSuccess={handleEditSuccess}
        historialItem={datosMostrar}
        equipoNombre={equipoNombre}
      />
    </>
  );
}