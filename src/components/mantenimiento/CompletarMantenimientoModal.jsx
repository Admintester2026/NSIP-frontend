// FRONTEND/src/components/mantenimiento/CompletarMantenimientoModal.jsx
import { useState, useRef } from 'react';
import { mantenimientoAPI } from '../../api/mantenimiento';
import styles from './CompletarMantenimientoModal.module.css';

export default function CompletarMantenimientoModal({ isOpen, onClose, onSuccess, mantenimiento, equipoNombre }) {
  const [formData, setFormData] = useState({
    tecnico: '',
    notas_completado: '',
    duracion_horas: '',
    duracion_minutos: '',
    materiales_usados: '',
    costo_materiales: '',
    evidencias: []
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [uploadProgress, setUploadProgress] = useState(0);
  const [touched, setTouched] = useState({
    tecnico: false,
    notas_completado: false,
    duracion_horas: false,
    duracion_minutos: false,
    costo_materiales: false
  });
  const fileInputRef = useRef(null);
  const [previewUrls, setPreviewUrls] = useState([]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleBlur = (field) => {
    setTouched(prev => ({ ...prev, [field]: true }));
  };

  const handleFilesChange = (e) => {
    const files = Array.from(e.target.files);
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'video/mp4'];
    const validFiles = files.filter(file => allowedTypes.includes(file.type));
    
    if (validFiles.length !== files.length) {
      setError('Algunos archivos no son válidos. Solo JPG, PNG, GIF y MP4.');
    }
    
    setFormData(prev => ({ ...prev, evidencias: [...prev.evidencias, ...validFiles] }));
    
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
    
    const API_BASE = import.meta.env.VITE_API_URL;
    const uploadedUrls = [];
    
    for (let i = 0; i < formData.evidencias.length; i++) {
      const file = formData.evidencias[i];
      const formDataFile = new FormData();
      formDataFile.append('archivo', file);
      formDataFile.append('tipo', 'evidencia');
      formDataFile.append('entidad_id', mantenimiento.id);
      
      try {
        setUploadProgress(Math.round(((i + 1) / formData.evidencias.length) * 50));
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
    setUploadProgress(100);
    return uploadedUrls;
  };

  const validateForm = () => {
    const errors = [];
    
    if (!formData.tecnico.trim()) {
      errors.push('El nombre del técnico es requerido');
      setTouched(prev => ({ ...prev, tecnico: true }));
    }
    if (!formData.notas_completado.trim()) {
      errors.push('Las notas de trabajo son requeridas');
      setTouched(prev => ({ ...prev, notas_completado: true }));
    }
    
    const tieneHoras = formData.duracion_horas && parseInt(formData.duracion_horas) > 0;
    const tieneMinutos = formData.duracion_minutos && parseInt(formData.duracion_minutos) > 0;
    if (!tieneHoras && !tieneMinutos) {
      errors.push('La duración es requerida (ingrese horas o minutos)');
      setTouched(prev => ({ ...prev, duracion_horas: true, duracion_minutos: true }));
    }
    
    if (!formData.costo_materiales || parseFloat(formData.costo_materiales) <= 0) {
      errors.push('El costo de materiales es requerido y debe ser mayor a 0');
      setTouched(prev => ({ ...prev, costo_materiales: true }));
    }
    
    if (errors.length > 0) {
      setError(errors.join('. '));
      return false;
    }
    return true;
  };

  const calcularDuracionMinutos = () => {
    const horas = parseInt(formData.duracion_horas) || 0;
    const minutos = parseInt(formData.duracion_minutos) || 0;
    return (horas * 60) + minutos;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setLoading(true);
    setError('');
    setUploadProgress(10);

    try {
      setUploadProgress(20);
      const evidenciasUrls = await uploadFiles();
      const duracionTotalMinutos = calcularDuracionMinutos();
      
      setUploadProgress(80);
      const response = await fetch(`${import.meta.env.VITE_API_URL}/mantenimiento/mantenimientos/${mantenimiento.id}/completar`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          notas_completado: formData.notas_completado,
          tecnico: formData.tecnico,
          duracion: duracionTotalMinutos,
          materiales_usados: formData.materiales_usados || null,
          costo_materiales: parseFloat(formData.costo_materiales),
          evidencias_urls: evidenciasUrls
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error al completar el mantenimiento');
      }

      setUploadProgress(100);
      previewUrls.forEach(url => URL.revokeObjectURL(url));
      
      if (onSuccess) {
        await onSuccess();
      }
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
      setTimeout(() => setUploadProgress(0), 500);
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
                <span className={styles.infoLabel}>ID:</span>
                <span className={styles.infoValue}>{mantenimiento?.id}</span>
              </div>
            </div>

            <div className={styles.formGroup}>
              <label>👤 Técnico responsable *</label>
              <input
                type="text"
                name="tecnico"
                value={formData.tecnico}
                onChange={handleChange}
                onBlur={() => handleBlur('tecnico')}
                placeholder="Nombre del técnico que realizó el trabajo"
                required
                className={touched.tecnico && !formData.tecnico.trim() ? styles.inputError : ''}
              />
              {touched.tecnico && !formData.tecnico.trim() && <span className={styles.errorText}>El técnico es requerido</span>}
            </div>

            <div className={styles.formGroup}>
              <label>📝 Notas / Trabajo realizado *</label>
              <textarea
                name="notas_completado"
                value={formData.notas_completado}
                onChange={handleChange}
                onBlur={() => handleBlur('notas_completado')}
                rows="4"
                placeholder="Describa detalladamente lo que se hizo..."
                required
                className={touched.notas_completado && !formData.notas_completado.trim() ? styles.inputError : ''}
              />
              {touched.notas_completado && !formData.notas_completado.trim() && <span className={styles.errorText}>Las notas son requeridas</span>}
            </div>

            <div className={styles.formGroup}>
              <label>⏱️ Duración *</label>
              <div className={styles.row}>
                <div className={styles.formGroup}>
                  <input
                    type="number"
                    name="duracion_horas"
                    value={formData.duracion_horas}
                    onChange={handleChange}
                    onBlur={() => handleBlur('duracion_horas')}
                    placeholder="Horas"
                    min="0"
                    step="1"
                    className={(touched.duracion_horas || touched.duracion_minutos) && !formData.duracion_horas && !formData.duracion_minutos ? styles.inputError : ''}
                  />
                </div>
                <div className={styles.formGroup}>
                  <input
                    type="number"
                    name="duracion_minutos"
                    value={formData.duracion_minutos}
                    onChange={handleChange}
                    onBlur={() => handleBlur('duracion_minutos')}
                    placeholder="Minutos"
                    min="0"
                    max="59"
                    step="1"
                    className={(touched.duracion_horas || touched.duracion_minutos) && !formData.duracion_horas && !formData.duracion_minutos ? styles.inputError : ''}
                  />
                </div>
              </div>
              {(touched.duracion_horas || touched.duracion_minutos) && !formData.duracion_horas && !formData.duracion_minutos && (
                <span className={styles.errorText}>La duración es requerida</span>
              )}
              <small className={styles.fieldHint}>Ingrese horas o minutos (ej: 2 horas 30 minutos)</small>
            </div>

            <div className={styles.formGroup}>
              <label>💰 Costo de materiales *</label>
              <input
                type="number"
                name="costo_materiales"
                value={formData.costo_materiales}
                onChange={handleChange}
                onBlur={() => handleBlur('costo_materiales')}
                placeholder="$0.00"
                step="0.01"
                min="0"
                required
                className={touched.costo_materiales && (!formData.costo_materiales || parseFloat(formData.costo_materiales) <= 0) ? styles.inputError : ''}
              />
              {touched.costo_materiales && (!formData.costo_materiales || parseFloat(formData.costo_materiales) <= 0) && (
                <span className={styles.errorText}>El costo de materiales es requerido y debe ser mayor a 0</span>
              )}
            </div>

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

            <div className={styles.formGroup}>
              <label>📸 Evidencias (Fotos / Videos)</label>
              <div className={styles.fileInputArea}>
                <button type="button" className={styles.fileButton} onClick={() => fileInputRef.current?.click()}>
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
                <span className={styles.fileHint}>JPG, PNG, GIF, MP4 (máx. 50MB por archivo)</span>
              </div>
              
              {previewUrls.length > 0 && (
                <div className={styles.previewGrid}>
                  {previewUrls.map((url, idx) => (
                    <div key={idx} className={styles.previewItem}>
                      {url.match(/\.(mp4|webm)$/i) ? (
                        <video src={url} className={styles.previewVideo} controls />
                      ) : (
                        <img src={url} alt={`Evidencia ${idx + 1}`} className={styles.previewImage} />
                      )}
                      <button type="button" className={styles.removePreview} onClick={() => removeFile(idx)}>✕</button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {uploadProgress > 0 && (
              <div className={styles.progressBar}>
                <div className={styles.progressFill} style={{ width: `${uploadProgress}%` }} />
                <span className={styles.progressText}>
                  {uploadProgress < 50 ? 'Subiendo evidencias...' : 'Completando mantenimiento...'} {uploadProgress}%
                </span>
              </div>
            )}
          </div>

          <div className={styles.modalFooter}>
            <button type="button" className={styles.cancelButton} onClick={onClose}>Cancelar</button>
            <button type="submit" className={styles.submitButton} disabled={loading}>
              {loading ? 'Completando...' : '✅ Marcar como Completado'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}