// FRONTEND/src/components/mantenimiento/CompletarMantenimientoModal.jsx
import { useState, useRef } from 'react';
import { mantenimientoAPI } from '../../api/mantenimiento';
import styles from './CompletarMantenimientoModal.module.css';

export default function CompletarMantenimientoModal({ isOpen, onClose, onSuccess, mantenimiento, equipoNombre }) {
  const [formData, setFormData] = useState({
    tecnico: '',
    notas_completado: '',
    duracion: '',
    materiales_usados: '',
    costo_materiales: '',
    evidencias: []
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [uploadProgress, setUploadProgress] = useState(0);
  const fileInputRef = useRef(null);
  const [previewUrls, setPreviewUrls] = useState([]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleFilesChange = (e) => {
    const files = Array.from(e.target.files);
    
    // Validar tipos de archivo
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'video/mp4'];
    const validFiles = files.filter(file => allowedTypes.includes(file.type));
    
    if (validFiles.length !== files.length) {
      setError('Algunos archivos no son válidos. Solo JPG, PNG, GIF y MP4.');
    }
    
    setFormData(prev => ({ ...prev, evidencias: [...prev.evidencias, ...validFiles] }));
    
    // Crear URLs de preview
    const newPreviewUrls = validFiles.map(file => URL.createObjectURL(file));
    setPreviewUrls(prev => [...prev, ...newPreviewUrls]);
  };

  const removeFile = (index) => {
    setFormData(prev => ({
      ...prev,
      evidencias: prev.evidencias.filter((_, i) => i !== index)
    }));
    setPreviewUrls(prev => prev.filter((_, i) => i !== index));
  };

  const uploadFiles = async () => {
    if (formData.evidencias.length === 0) return [];
    
    const uploadedUrls = [];
    for (let i = 0; i < formData.evidencias.length; i++) {
      const file = formData.evidencias[i];
      const formDataFile = new FormData();
      formDataFile.append('archivo', file);
      formDataFile.append('tipo', 'evidencia');
      formDataFile.append('mantenimiento_id', mantenimiento.id);
      
      try {
        setUploadProgress(Math.round((i / formData.evidencias.length) * 100));
        const response = await fetch('/api/mantenimiento/upload-evidencia', {
          method: 'POST',
          body: formDataFile
        });
        const data = await response.json();
        uploadedUrls.push(data.url);
      } catch (err) {
        console.error(`Error subiendo archivo ${i}:`, err);
      }
    }
    setUploadProgress(100);
    return uploadedUrls;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setUploadProgress(0);

    try {
      if (!formData.tecnico.trim()) {
        throw new Error('El nombre del técnico es requerido');
      }
      if (!formData.notas_completado.trim()) {
        throw new Error('Las notas de trabajo son requeridas');
      }

      // Primero subir evidencias (si hay)
      const evidenciasUrls = await uploadFiles();

      // Completar mantenimiento
      await fetch(`${import.meta.env.VITE_API_URL}/mantenimiento/mantenimientos/${mantenimiento.id}/completar`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
        notas_completado: formData.notas_completado,
        tecnico: formData.tecnico,
        duracion: formData.duracion,
        materiales_usados: formData.materiales_usados,
        costo_materiales: formData.costo_materiales
    })
});

      // Limpiar previews
      previewUrls.forEach(url => URL.revokeObjectURL(url));
      
      if (onSuccess) onSuccess();
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
      setUploadProgress(0);
    }
  };

  if (!isOpen) return null;

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <h2>✅ Completar Mantenimiento</h2>
          <button className={styles.modalClose} onClick={onClose}>✕</button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className={styles.modalBody}>
            {error && <div className={styles.errorMessage}>⚠️ {error}</div>}

            {/* Info del mantenimiento */}
            <div className={styles.infoBox}>
              <div className={styles.infoRow}>
                <span className={styles.infoLabel}>Mantenimiento:</span>
                <span className={styles.infoValue}>{mantenimiento?.titulo}</span>
              </div>
              <div className={styles.infoRow}>
                <span className={styles.infoLabel}>Equipo:</span>
                <span className={styles.infoValue}>{equipoNombre}</span>
              </div>
            </div>

            {/* Técnico */}
            <div className={styles.formGroup}>
              <label>👤 Técnico responsable *</label>
              <input
                type="text"
                name="tecnico"
                value={formData.tecnico}
                onChange={handleChange}
                placeholder="Nombre del técnico que realizó el trabajo"
                required
                autoComplete="off"
              />
              <small className={styles.fieldHint}>Nombre de la persona que realizó el mantenimiento</small>
            </div>

            {/* Notas */}
            <div className={styles.formGroup}>
              <label>📝 Notas / Trabajo realizado *</label>
              <textarea
                name="notas_completado"
                value={formData.notas_completado}
                onChange={handleChange}
                rows="4"
                placeholder="Describa detalladamente lo que se hizo, piezas reemplazadas, ajustes, etc."
                required
              />
            </div>

            {/* Duración */}
            <div className={styles.row}>
              <div className={styles.formGroup}>
                <label>⏱️ Duración</label>
                <input
                  type="number"
                  name="duracion"
                  value={formData.duracion}
                  onChange={handleChange}
                  placeholder="Minutos"
                  step="5"
                />
                <small className={styles.fieldHint}>Tiempo total del trabajo (en minutos)</small>
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

            {/* Materiales usados */}
            <div className={styles.formGroup}>
              <label>🔧 Materiales usados</label>
              <textarea
                name="materiales_usados"
                value={formData.materiales_usados}
                onChange={handleChange}
                rows="2"
                placeholder="Piezas reemplazadas, lubricantes, herramientas especiales, etc."
              />
            </div>

            {/* Evidencias */}
            <div className={styles.formGroup}>
              <label>📸 Evidencias (Fotos / Videos)</label>
              <div className={styles.fileInputArea}>
                <button
                  type="button"
                  className={styles.fileButton}
                  onClick={() => fileInputRef.current?.click()}
                >
                  📷 Seleccionar archivos
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/gif,video/mp4"
                  onChange={handleFilesChange}
                  multiple
                  className={styles.hiddenInput}
                />
                <span className={styles.fileHint}>
                  JPG, PNG, GIF, MP4 (máx. 10MB por archivo)
                </span>
              </div>
              
              {/* Previews */}
              {previewUrls.length > 0 && (
                <div className={styles.previewGrid}>
                  {previewUrls.map((url, idx) => (
                    <div key={idx} className={styles.previewItem}>
                      {url.match(/\.(mp4|webm)$/i) ? (
                        <video src={url} className={styles.previewVideo} controls />
                      ) : (
                        <img src={url} alt={`Evidencia ${idx + 1}`} className={styles.previewImage} />
                      )}
                      <button
                        type="button"
                        className={styles.removePreview}
                        onClick={() => removeFile(idx)}
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Progress bar */}
            {uploadProgress > 0 && uploadProgress < 100 && (
              <div className={styles.progressBar}>
                <div 
                  className={styles.progressFill} 
                  style={{ width: `${uploadProgress}%` }}
                />
                <span className={styles.progressText}>Subiendo evidencias... {uploadProgress}%</span>
              </div>
            )}
          </div>

          <div className={styles.modalFooter}>
            <button type="button" className={styles.cancelButton} onClick={onClose}>
              Cancelar
            </button>
            <button type="submit" className={styles.submitButton} disabled={loading}>
              {loading ? 'Completando...' : '✅ Marcar como Completado'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}