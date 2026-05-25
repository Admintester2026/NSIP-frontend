// FRONTEND/src/components/mantenimiento/EditarMantenimientoModal.jsx
import { useState, useEffect, useRef } from 'react';
import { mantenimientoAPI } from '../../api/mantenimiento';
import styles from './EditarMantenimientoModal.module.css';

const getBackendBase = () => {
  return 'http://192.168.3.65:3000';
};

const getApiBase = () => {
  return `${getBackendBase()}/api`;
};

export default function EditarMantenimientoModal({ isOpen, onClose, onSuccess, mantenimiento, equipoNombre }) {
  const [formData, setFormData] = useState({
    tecnico: '',
    notas_completado: '',
    duracion: '',
    materiales_usados: '',
    costo_materiales: '',
    observaciones: ''
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

  useEffect(() => {
    if (isOpen && mantenimiento) {
      setFormData({
        tecnico: mantenimiento.completado_por || '',
        notas_completado: mantenimiento.notas_completado || '',
        duracion: mantenimiento.duracion || '',
        materiales_usados: mantenimiento.materiales_usados || '',
        costo_materiales: mantenimiento.costo_materiales || '',
        observaciones: ''
      });
      cargarHistorial();
      setNuevasEvidencias([]);
      setPreviewUrls([]);
      setUploadProgress(0);
    }
  }, [isOpen, mantenimiento]);

  const cargarHistorial = async () => {
    setCargandoHistorial(true);
    try {
      const data = await mantenimientoAPI.getHistorialVersiones(mantenimiento.id);
      setVersiones(data || []);
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
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'video/mp4'];
    const validFiles = files.filter(file => allowedTypes.includes(file.type));
    
    if (validFiles.length !== files.length) {
      setError('Algunos archivos no son válidos. Solo JPG, PNG, GIF y MP4.');
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
      formDataFile.append('tipo', 'evidencia');
      formDataFile.append('entidad_id', mantenimiento.id);
      
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
      if (!formData.tecnico.trim()) {
        throw new Error('El nombre del técnico es requerido');
      }
      if (!formData.notas_completado.trim()) {
        throw new Error('Las notas de trabajo son requeridas');
      }

      let nuevasUrls = [];
      if (nuevasEvidencias.length > 0) {
        setSubiendoEvidencias(true);
        nuevasUrls = await uploadNewEvidencias();
      }

      await mantenimientoAPI.editarMantenimientoCompletado(mantenimiento.id, {
        notas_completado: formData.notas_completado,
        tecnico: formData.tecnico,
        duracion: formData.duracion,
        materiales_usados: formData.materiales_usados,
        costo_materiales: formData.costo_materiales,
        observaciones: formData.observaciones,
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
          <h2>✏️ Editar Mantenimiento Completado</h2>
          <button className={styles.modalClose} onClick={onClose}>✕</button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className={styles.modalBody}>
            {error && <div className={styles.errorMessage}>⚠️ {error}</div>}

            <div className={styles.infoBox}>
              <div className={styles.infoRow}>
                <span className={styles.infoLabel}>Mantenimiento:</span>
                <span className={styles.infoValue}>{mantenimiento?.titulo}</span>
              </div>
              <div className={styles.infoRow}>
                <span className={styles.infoLabel}>Equipo:</span>
                <span className={styles.infoValue}>{equipoNombre}</span>
              </div>
              <div className={styles.infoRow}>
                <span className={styles.infoLabel}>Completado:</span>
                <span className={styles.infoValue}>{new Date(mantenimiento?.fecha_completado).toLocaleDateString()}</span>
              </div>
            </div>

            <div className={styles.formGroup}>
              <label>👤 Técnico responsable *</label>
              <input 
                type="text" 
                name="tecnico" 
                value={formData.tecnico} 
                onChange={handleChange} 
                placeholder="Nombre del técnico"
                required 
              />
            </div>

            <div className={styles.formGroup}>
              <label>📝 Notas / Trabajo realizado *</label>
              <textarea 
                name="notas_completado" 
                value={formData.notas_completado} 
                onChange={handleChange} 
                rows="4" 
                placeholder="Describa detalladamente lo que se hizo..."
                required 
              />
            </div>

            <div className={styles.row}>
              <div className={styles.formGroup}>
                <label>⏱️ Duración (minutos)</label>
                <input 
                  type="number" 
                  name="duracion" 
                  value={formData.duracion} 
                  onChange={handleChange} 
                  placeholder="Minutos"
                  step="5"
                />
              </div>
              <div className={styles.formGroup}>
                <label>💰 Costo de materiales</label>
                <input 
                  type="number" 
                  name="costo_materiales" 
                  value={formData.costo_materiales} 
                  onChange={handleChange} 
                  placeholder="$0.00"
                  step="0.01"
                />
              </div>
            </div>

            <div className={styles.formGroup}>
              <label>🔧 Materiales usados</label>
              <textarea 
                name="materiales_usados" 
                value={formData.materiales_usados} 
                onChange={handleChange} 
                rows="2" 
                placeholder="Piezas reemplazadas, lubricantes, herramientas especiales..."
              />
            </div>

            <div className={styles.formGroup}>
              <label>📸 Añadir más evidencias (Fotos / Videos)</label>
              <div className={styles.fileInputArea}>
                <button type="button" className={styles.fileButton} onClick={() => fileInputRef.current?.click()}>
                  📷 Seleccionar archivos adicionales
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/gif,video/mp4"
                  onChange={handleFilesChange}
                  multiple
                  className={styles.hiddenInput}
                />
                <span className={styles.fileHint}>Añade más imágenes o videos (no se borrarán los existentes)</span>
              </div>
              
              {previewUrls.length > 0 && (
                <div className={styles.previewGrid}>
                  {previewUrls.map((url, idx) => (
                    <div key={idx} className={styles.previewItem}>
                      {url.match(/\.(mp4|webm)$/i) ? (
                        <video src={url} className={styles.previewVideo} controls />
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
                        {v.notas_completado && <p><strong>Notas:</strong> {v.notas_completado}</p>}
                        {v.materiales_usados && <p><strong>Materiales:</strong> {v.materiales_usados}</p>}
                        {v.costo_materiales && <p><strong>Costo:</strong> ${Number(v.costo_materiales).toFixed(2)}</p>}
                        {v.duracion && <p><strong>Duración:</strong> {v.duracion} minutos</p>}
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