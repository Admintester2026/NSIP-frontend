// FRONTEND/src/components/mantenimiento/EditarIncidenciaModal.jsx
import { useState, useEffect, useRef } from 'react';
import { mantenimientoAPI } from '../../api/mantenimiento';
import styles from './EditarIncidenciaModal.module.css';

const getBackendBase = () => {
  return 'http://192.168.3.65:3000';
};

const getApiBase = () => {
  return `${getBackendBase()}/api`;
};

export default function EditarIncidenciaModal({ isOpen, onClose, onSuccess, incidencia, equipoNombre }) {
  const [formData, setFormData] = useState({
    titulo: '',
    descripcion: '',
    gravedad: 'media',
    solucion: '',
    costo_estimado: '',
    estado: 'reportado'
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [versiones, setVersiones] = useState([]);
  const [mostrarHistorial, setMostrarHistorial] = useState(false);
  const [cargandoHistorial, setCargandoHistorial] = useState(false);
  
  const [nuevasEvidencias, setNuevasEvidencias] = useState([]);
  const [previewUrls, setPreviewUrls] = useState([]);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [subiendoEvidencias, setSubiendoEvidencias] = useState(false);
  const fileInputRef = useRef(null);

  const gravedades = [
    { value: 'critica', label: '🔥 Crítica' },
    { value: 'alta', label: '⚠️ Alta' },
    { value: 'media', label: '📋 Media' },
    { value: 'baja', label: '✅ Baja' }
  ];

  const estados = [
    { value: 'reportado', label: '📝 Reportado' },
    { value: 'en_proceso', label: '🔧 En proceso' },
    { value: 'resuelto', label: '✅ Resuelto' },
    { value: 'cerrado', label: '🔒 Cerrado' }
  ];

  useEffect(() => {
    if (isOpen && incidencia) {
      setFormData({
        titulo: incidencia.titulo || '',
        descripcion: incidencia.descripcion || '',
        gravedad: incidencia.gravedad || 'media',
        solucion: incidencia.solucion || '',
        costo_estimado: incidencia.costo_estimado || '',
        estado: incidencia.estado || 'reportado'
      });
      cargarHistorial();
      setNuevasEvidencias([]);
      setPreviewUrls([]);
      setUploadProgress(0);
    }
  }, [isOpen, incidencia]);

  const cargarHistorial = async () => {
    setCargandoHistorial(true);
    try {
      const data = await mantenimientoAPI.getHistorialVersionesIncidencia(incidencia.id);
      setVersiones(data || []);
    } catch (err) {
      console.error('Error cargando historial:', err);
      setVersiones([]);
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
    
    setNuevasEvidencias(prev => [...prev, ...validFiles]);
    
    const newPreviewUrls = validFiles.map(file => URL.createObjectURL(file));
    setPreviewUrls(prev => [...prev, ...newPreviewUrls]);
  };

  const removeNewFile = (index) => {
    setNuevasEvidencias(prev => prev.filter((_, i) => i !== index));
    URL.revokeObjectURL(previewUrls[index]);
    setPreviewUrls(prev => prev.filter((_, i) => i !== index));
  };

  const uploadNewEvidencias = async () => {
    if (nuevasEvidencias.length === 0) return [];
    
    const API_BASE = getApiBase();
    const uploadedUrls = [];
    
    for (let i = 0; i < nuevasEvidencias.length; i++) {
      const file = nuevasEvidencias[i];
      const formDataFile = new FormData();
      formDataFile.append('archivo', file);
      formDataFile.append('tipo', 'incidencia');
      formDataFile.append('entidad_id', incidencia.id);
      
      try {
        setUploadProgress(Math.round(((i + 1) / nuevasEvidencias.length) * 100));
        const response = await fetch(`${API_BASE}/mantenimiento/upload`, {
          method: 'POST',
          body: formDataFile
        });
        const data = await response.json();
        if (data.ok) {
          uploadedUrls.push(data.url);
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
      if (!formData.titulo.trim()) {
        throw new Error('El título es requerido');
      }
      if (!formData.descripcion.trim()) {
        throw new Error('La descripción es requerida');
      }

      let nuevasUrls = [];
      if (nuevasEvidencias.length > 0) {
        setSubiendoEvidencias(true);
        nuevasUrls = await uploadNewEvidencias();
      }

      await mantenimientoAPI.updateIncidencia(incidencia.id, {
        titulo: formData.titulo,
        descripcion: formData.descripcion,
        gravedad: formData.gravedad,
        solucion: formData.solucion,
        costo_estimado: formData.costo_estimado,
        estado: formData.estado,
        nuevas_evidencias_urls: nuevasUrls
      });

      previewUrls.forEach(url => URL.revokeObjectURL(url));
      
      // IMPORTANTE: Llamar a onSuccess ANTES de cerrar el modal
      if (onSuccess) {
        await onSuccess();
      }
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
      setSubiendoEvidencias(false);
      setUploadProgress(0);
    }
  };

  if (!isOpen) return null;

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <h2>✏️ Editar Incidencia</h2>
          <button className={styles.modalClose} onClick={onClose}>✕</button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className={styles.modalBody}>
            {error && <div className={styles.errorMessage}>⚠️ {error}</div>}

            <div className={styles.infoBox}>
              <div className={styles.infoRow}>
                <span className={styles.infoLabel}>Incidencia ID:</span>
                <span className={styles.infoValue}>#{incidencia?.id}</span>
              </div>
              <div className={styles.infoRow}>
                <span className={styles.infoLabel}>Equipo:</span>
                <span className={styles.infoValue}>{equipoNombre}</span>
              </div>
              <div className={styles.infoRow}>
                <span className={styles.infoLabel}>Reportado:</span>
                <span className={styles.infoValue}>{new Date(incidencia?.fecha_reporte).toLocaleDateString()}</span>
              </div>
            </div>

            <div className={styles.formGroup}>
              <label>📝 Título *</label>
              <input 
                type="text" 
                name="titulo" 
                value={formData.titulo} 
                onChange={handleChange} 
                placeholder="Título de la incidencia"
                required 
              />
            </div>

            <div className={styles.formGroup}>
              <label>📄 Descripción *</label>
              <textarea 
                name="descripcion" 
                value={formData.descripcion} 
                onChange={handleChange} 
                rows="3" 
                placeholder="Descripción detallada del problema..."
                required 
              />
            </div>

            <div className={styles.row}>
              <div className={styles.formGroup}>
                <label>⚠️ Gravedad</label>
                <select name="gravedad" value={formData.gravedad} onChange={handleChange}>
                  {gravedades.map(g => <option key={g.value} value={g.value}>{g.label}</option>)}
                </select>
              </div>
              <div className={styles.formGroup}>
                <label>📊 Estado</label>
                <select name="estado" value={formData.estado} onChange={handleChange}>
                  {estados.map(e => <option key={e.value} value={e.value}>{e.label}</option>)}
                </select>
              </div>
            </div>

            <div className={styles.formGroup}>
              <label>💡 Solución aplicada</label>
              <textarea 
                name="solucion" 
                value={formData.solucion} 
                onChange={handleChange} 
                rows="2" 
                placeholder="Describa cómo se resolvió la incidencia..."
              />
            </div>

            <div className={styles.formGroup}>
              <label>💰 Costo estimado</label>
              <input 
                type="number" 
                name="costo_estimado" 
                value={formData.costo_estimado} 
                onChange={handleChange} 
                placeholder="$0.00"
                step="0.01"
              />
            </div>

            <div className={styles.formGroup}>
              <label>📸 Añadir más evidencias (Fotos / Documentos)</label>
              <div className={styles.fileInputArea}>
                <button type="button" className={styles.fileButton} onClick={() => fileInputRef.current?.click()}>
                  📷 Seleccionar archivos adicionales
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/gif,application/pdf"
                  onChange={handleFilesChange}
                  multiple
                  className={styles.hiddenInput}
                />
                <span className={styles.fileHint}>Añade más imágenes o documentos (no se borrarán los existentes)</span>
              </div>
              
              {previewUrls.length > 0 && (
                <div className={styles.previewGrid}>
                  {previewUrls.map((url, idx) => (
                    <div key={idx} className={styles.previewItem}>
                      {url.match(/\.pdf$/i) ? (
                        <div className={styles.pdfPreview}>📄 PDF</div>
                      ) : (
                        <img src={url} alt={`Nueva evidencia ${idx + 1}`} className={styles.previewImage} />
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
                <span className={styles.progressText}>Subiendo nuevas evidencias... {uploadProgress}%</span>
              </div>
            )}

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
                        {v.solucion && <p><strong>Solución:</strong> {v.solucion}</p>}
                        {v.estado && <p><strong>Estado:</strong> {v.estado}</p>}
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
            <button type="submit" className={styles.submitButton} disabled={loading || subiendoEvidencias}>
              {loading ? 'Guardando...' : subiendoEvidencias ? 'Subiendo evidencias...' : '💾 Guardar cambios'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}