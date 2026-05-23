// FRONTEND/src/components/mantenimiento/DetalleHistorialModal.jsx
import { useState, useEffect } from 'react';
import ImageGallery from './ImageGallery';
import styles from './DetalleHistorialModal.module.css';

// Función para obtener la base del backend (SIN /api al final)
const getBackendBase = () => {
  return 'http://192.168.3.65:3000';
};

const getApiBase = () => {
  return `${getBackendBase()}/api`;
};

export default function DetalleHistorialModal({ isOpen, onClose, historialItem, equipoNombre }) {
  const [facturas, setFacturas] = useState([]);
  const [loadingFacturas, setLoadingFacturas] = useState(false);

  useEffect(() => {
    if (isOpen && historialItem?.id) {
      cargarFacturas();
    }
  }, [isOpen, historialItem]);

  const cargarFacturas = async () => {
    setLoadingFacturas(true);
    try {
      const API_BASE = getApiBase();
      console.log('🔍 Cargando facturas para historial:', historialItem.id);
      
      const response = await fetch(`${API_BASE}/mantenimiento/evidencias/historial/${historialItem.id}`);
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        const data = await response.json();
        console.log('📸 Respuesta del servidor:', data);
        if (data.ok) {
          // Obtener la base del backend (sin /api)
          const backendBase = getBackendBase();
          // Convertir URLs relativas a absolutas
          const facturasConUrlAbsoluta = (data.datos || []).map(fact => ({
            ...fact,
            url: fact.url.startsWith('http') ? fact.url : `${backendBase}${fact.url}`
          }));
          console.log('✅ URLs convertidas:', facturasConUrlAbsoluta);
          setFacturas(facturasConUrlAbsoluta);
        }
      }
    } catch (err) {
      console.error('Error cargando facturas:', err);
    } finally {
      setLoadingFacturas(false);
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

  if (!historialItem) {
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

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <h2>📜 Detalle de Cambio Registrado</h2>
          <button className={styles.modalClose} onClick={onClose}>✕</button>
        </div>

        <div className={styles.modalBody}>
          <div className={styles.infoSection}>
            <div className={styles.infoRow}><span className={styles.infoLabel}>Tipo de cambio:</span><span className={styles.infoValue}>{getCampoModificadoTexto(historialItem.campo_modificado)}</span></div>
            <div className={styles.infoRow}><span className={styles.infoLabel}>Equipo:</span><span className={styles.infoValue}>{equipoNombre}</span></div>
            {historialItem.usuario && <div className={styles.infoRow}><span className={styles.infoLabel}>Registrado por:</span><span className={styles.infoValue}>{historialItem.usuario}</span></div>}
          </div>

          <div className={styles.infoSection}>
            <h4 className={styles.sectionSubtitle}>📅 Fecha del cambio</h4>
            <div className={styles.infoRow}><span className={styles.infoValue}>{formatDate(historialItem.fecha)}</span></div>
          </div>

          {(historialItem.valor_anterior || historialItem.valor_nuevo) && (
            <div className={styles.infoSection}>
              <h4 className={styles.sectionSubtitle}>🔄 Valores del cambio</h4>
              {historialItem.valor_anterior && <div className={styles.infoRow}><span className={styles.infoLabel}>Valor anterior:</span><span className={styles.valorAnterior}>{historialItem.valor_anterior}</span></div>}
              {historialItem.valor_nuevo && <div className={styles.infoRow}><span className={styles.infoLabel}>Valor nuevo:</span><span className={styles.valorNuevo}>{historialItem.valor_nuevo}</span></div>}
            </div>
          )}

          {historialItem.descripcion && (
            <div className={styles.infoSection}>
              <h4 className={styles.sectionSubtitle}>📝 Descripción</h4>
              <div className={styles.descripcionBox}>{historialItem.descripcion}</div>
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
  );
}