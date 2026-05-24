// FRONTEND/src/components/mantenimiento/EditarHistorialModal.jsx
import { useState, useEffect, useRef } from 'react';
import { mantenimientoAPI } from '../../api/mantenimiento';
import styles from './EditarHistorialModal.module.css';

// Función para obtener la base del backend
const getBackendBase = () => {
  return 'http://192.168.3.65:3000';
};

const getApiBase = () => {
  return `${getBackendBase()}/api`;
};

export default function EditarHistorialModal({ isOpen, onClose, onSuccess, historialItem, equipoNombre }) {
  const [formData, setFormData] = useState({
    campo_modificado: '',
    valor_anterior: '',
    valor_nuevo: '',
    descripcion: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [versiones, setVersiones] = useState([]);
  const [mostrarHistorial, setMostrarHistorial] = useState(false);
  const [cargandoHistorial, setCargandoHistorial] = useState(false);
  
  // Estados para nuevas facturas
  const [nuevasFacturas, setNuevasFacturas] = useState([]);
  const [previewUrls, setPreviewUrls] = useState([]);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [subiendoFacturas, setSubiendoFacturas] = useState(false);
  const fileInputRef = useRef(null);

  const campos = [
    { value: 'pieza_reemplazada', label: '🔧 Pieza Reemplazada' },
    { value: 'configuracion', label: '⚙️ Configuración' },
    { value: 'calibracion', label: '📏 Calibración' },
    { value: 'reparacion', label: '🛠️ Reparación' },
    { value: 'actualizacion', label: '🔄 Actualización' },
    { value: 'observacion', label: '📝 Observación' },
    { value: 'factura', label: '🧾 Factura / Comprobante' }
  ];

  useEffect(() => {
    if (isOpen && historialItem) {
      setFormData({
        campo_modificado: historialItem.campo_modificado || '',
        valor_anterior: historialItem.valor_anterior || '',
        valor_nuevo: historialItem.valor_nuevo || '',
        descripcion: historialItem.descripcion || ''
      });
      cargarHistorial();
      // Resetear nuevas facturas
      setNuevasFacturas([]);
      setPreviewUrls([]);
      setUploadProgress(0);
    }
  }, [isOpen, historialItem]);

  const cargarHistorial = async () => {
    setCargandoHistorial(true);
    try {
      // Si tienes API para historial de cambios
      setVersiones([]); // Placeholder
    } catch (err) {
      console.error('Error cargando historial:', err);
    } finally {
      setCargandoHistorial(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleFilesChange = (e) => {
    const files = Array.from(e.target.files);
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'application/pdf'];
    const validFiles = files.filter(file => allowedTypes.includes(file.type));
    
    if (validFiles.length !== files.length) {
      setError('Algunos archivos no son válidos. Solo JPG, PNG, GIF y PDF.');
    }
    
    setNuevasFacturas(prev => [...prev, ...validFiles]);
    
    const newPreviewUrls = validFiles.map(file => URL.createObjectURL(file));
    setPreviewUrls(prev => [...prev, ...newPreviewUrls]);
  };

  const removeNewFile = (index) => {
    setNuevasFacturas(prev => prev.filter((_, i) => i !== index));
    URL.revokeObjectURL(previewUrls[index]);
    setPreviewUrls(prev => prev.filter((_, i) => i !== index));
  };

  // Subir nuevas facturas al backend
  const uploadNewFacturas = async () => {
    if (nuevasFacturas.length === 0) return [];
    
    const API_BASE = getApiBase();
    const uploadedUrls = [];
    
    for (let i = 0; i < nuevasFacturas.length; i++) {
      const file = nuevasFacturas[i];
      const formDataFile = new FormData();
      formDataFile.append('archivo', file);
      formDataFile.append('tipo', 'factura');
      formDataFile.append('entidad_id', historialItem.id);
      
      try {
        setUploadProgress(Math.round(((i + 1) / nuevasFacturas.length) * 100));
        const response = await fetch(`${API_BASE}/mantenimiento/upload`, {
          method: 'POST',
          body: formDataFile
        });
        const data = await response.json();
        if (data.ok) {
          uploadedUrls.push(data.url);
          console.log('✅ Nueva factura subida:', data.url);
        }
      } catch (err) {
        console.error(`Error subiendo archivo ${i}:`, err);
      }
    }
    return uploadedUrls;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      if (!formData.campo_modificado) {
        throw new Error('Selecciona el tipo de cambio');
      }

      // Subir nuevas facturas si hay
      let nuevasUrls = [];
      if (nuevasFacturas.length > 0) {
        setSubiendoFacturas(true);
        nuevasUrls = await uploadNewFacturas();
        console.log(`📎 Subidas ${nuevasUrls.length} nuevas facturas`);
      }

      // Actualizar el historial
      await mantenimientoAPI.updateHistorial(historialItem.id, {
        campo_modificado: formData.campo_modificado,
        valor_anterior: formData.valor_anterior,
        valor_nuevo: formData.valor_nuevo,
        descripcion: formData.descripcion,
        nuevas_facturas_urls: nuevasUrls
      });

      // Limpiar previews
      previewUrls.forEach(url => URL.revokeObjectURL(url));
      
      if (onSuccess) onSuccess();
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
      setSubiendoFacturas(false);
      setUploadProgress(0);
    }
  };

  if (!isOpen) return null;

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <h2>✏️ Editar Registro de Cambio</h2>
          <button className={styles.modalClose} onClick={onClose}>✕</button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className={styles.modalBody}>
            {error && <div className={styles.errorMessage}>⚠️ {error}</div>}

            <div className={styles.infoBox}>
              <div className={styles.infoRow}>
                <span className={styles.infoLabel}>Registro ID:</span>
                <span className={styles.infoValue}>#{historialItem?.id}</span>
              </div>
              <div className={styles.infoRow}>
                <span className={styles.infoLabel}>Equipo:</span>
                <span className={styles.infoValue}>{equipoNombre}</span>
              </div>
              <div className={styles.infoRow}>
                <span className={styles.infoLabel}>Fecha:</span>
                <span className={styles.infoValue}>{new Date(historialItem?.fecha).toLocaleDateString()}</span>
              </div>
            </div>

            <div className={styles.formGroup}>
              <label>Tipo de Cambio *</label>
              <select 
                name="campo_modificado" 
                value={formData.campo_modificado} 
                onChange={handleChange}
                required
              >
                <option value="">Seleccionar...</option>
                {campos.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
              </select>
            </div>

            <div className={styles.row}>
              <div className={styles.formGroup}>
                <label>Valor Anterior</label>
                <input
                  type="text"
                  name="valor_anterior"
                  value={formData.valor_anterior}
                  onChange={handleChange}
                  placeholder="Valor anterior / pieza vieja"
                />
              </div>
              <div className={styles.formGroup}>
                <label>Valor Nuevo</label>
                <input
                  type="text"
                  name="valor_nuevo"
                  value={formData.valor_nuevo}
                  onChange={handleChange}
                  placeholder="Valor nuevo / pieza nueva"
                />
              </div>
            </div>

            <div className={styles.formGroup}>
              <label>Descripción / Observaciones</label>
              <textarea
                name="descripcion"
                value={formData.descripcion}
                onChange={handleChange}
                rows="3"
                placeholder="Detalles del cambio realizado..."
              />
            </div>

            {/* Sección para añadir nuevas facturas */}
            <div className={styles.formGroup}>
              <label>🧾 Añadir más facturas / Comprobantes</label>
              <div className={styles.fileInputArea}>
                <button type="button" className={styles.fileButton} onClick={() => fileInputRef.current?.click()}>
                  📎 Seleccionar archivos adicionales
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/gif,application/pdf"
                  onChange={handleFilesChange}
                  multiple
                  className={styles.hiddenInput}
                />
                <span className={styles.fileHint}>Añade más facturas o comprobantes (no se borrarán los existentes)</span>
              </div>
              
              {previewUrls.length > 0 && (
                <div className={styles.previewGrid}>
                  {previewUrls.map((url, idx) => (
                    <div key={idx} className={styles.previewItem}>
                      {url.match(/\.pdf$/i) ? (
                        <div className={styles.pdfPreview}>📄 PDF</div>
                      ) : (
                        <img src={url} alt={`Nueva factura ${idx + 1}`} className={styles.previewImage} />
                      )}
                      <button type="button" className={styles.removePreview} onClick={() => removeNewFile(idx)}>✕</button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {uploadProgress > 0 && (
              <div className={styles.progressBar}>
                <div className={styles.progressFill} style={{ width: `${uploadProgress}%` }} />
                <span className={styles.progressText}>Subiendo nuevos archivos... {uploadProgress}%</span>
              </div>
            )}

            {/* Historial de versiones */}
            <button 
              type="button" 
              className={styles.historialButton} 
              onClick={() => setMostrarHistorial(!mostrarHistorial)}
            >
              📜 Ver historial de cambios ({versiones.length})
            </button>

            {mostrarHistorial && (
              <div className={styles.historialContainer}>
                {cargandoHistorial ? (
                  <p className={styles.loadingText}>Cargando historial...</p>
                ) : versiones.length > 0 ? (
                  versiones.map((v, idx) => (
                    <div key={idx} className={styles.versionItem}>
                      <div className={styles.versionHeader}>
                        <span className={styles.versionBadge}>Versión {v.version}</span>
                        <span className={styles.versionDate}>{new Date(v.fecha_modificacion).toLocaleString()}</span>
                        <span className={styles.versionUser}>👤 {v.modificado_por || 'sistema'}</span>
                      </div>
                      <div className={styles.versionContent}>
                        {v.descripcion && <p><strong>Descripción:</strong> {v.descripcion}</p>}
                        {v.valor_anterior && <p><strong>Valor anterior:</strong> {v.valor_anterior}</p>}
                        {v.valor_nuevo && <p><strong>Valor nuevo:</strong> {v.valor_nuevo}</p>}
                      </div>
                    </div>
                  ))
                ) : (
                  <p className={styles.emptyMessage}>No hay versiones anteriores registradas</p>
                )}
              </div>
            )}
          </div>

          <div className={styles.modalFooter}>
            <button type="button" className={styles.cancelButton} onClick={onClose}>
              Cancelar
            </button>
            <button type="submit" className={styles.submitButton} disabled={loading || subiendoFacturas}>
              {loading ? 'Guardando...' : subiendoFacturas ? 'Subiendo archivos...' : '💾 Guardar cambios'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}