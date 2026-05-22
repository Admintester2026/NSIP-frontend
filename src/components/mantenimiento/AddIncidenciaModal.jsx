// FRONTEND/src/components/mantenimiento/AddIncidenciaModal.jsx
import { useState, useRef } from 'react';
import { mantenimientoAPI } from '../../api/mantenimiento';
import styles from './AddIncidenciaModal.module.css';

export default function AddIncidenciaModal({ isOpen, onClose, onSuccess, equipoId }) {
  const [formData, setFormData] = useState({
    titulo: '',
    descripcion: '',
    gravedad: 'media',
    evidencias: []
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [uploadProgress, setUploadProgress] = useState(0);
  const [touched, setTouched] = useState({
    titulo: false,
    descripcion: false
  });
  const fileInputRef = useRef(null);
  const [previewUrls, setPreviewUrls] = useState([]);

  const gravedades = [
    { value: 'critica', label: '🔥 Crítica' },
    { value: 'alta', label: '⚠️ Alta' },
    { value: 'media', label: '📋 Media' },
    { value: 'baja', label: '✅ Baja' }
  ];

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleBlur = (field) => {
    setTouched(prev => ({ ...prev, [field]: true }));
  };

  const handleFilesChange = (e) => {
    const files = Array.from(e.target.files);
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'application/pdf'];
    const validFiles = files.filter(file => allowedTypes.includes(file.type));
    
    if (validFiles.length !== files.length) {
      setError('Algunos archivos no son válidos. Solo JPG, PNG, GIF y PDF.');
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

  // Función para subir archivos con el ID correcto (después de crear la incidencia)
  const uploadFiles = async (incidenciaId) => {
    if (formData.evidencias.length === 0) return [];
    
    const API_BASE = import.meta.env.VITE_API_URL;
    const uploadedUrls = [];
    
    for (let i = 0; i < formData.evidencias.length; i++) {
      const file = formData.evidencias[i];
      const formDataFile = new FormData();
      formDataFile.append('archivo', file);
      formDataFile.append('tipo', 'incidencia');
      formDataFile.append('entidad_id', incidenciaId); // ← AHORA USA EL ID REAL DE LA INCIDENCIA
      
      try {
        setUploadProgress(Math.round(((i + 1) / formData.evidencias.length) * 50)); // 50% para subidas
        const response = await fetch(`${API_BASE}/mantenimiento/upload`, {
          method: 'POST',
          body: formDataFile
        });
        const data = await response.json();
        if (data.ok) {
          uploadedUrls.push(data.url);
          console.log('✅ Archivo subido con ID:', incidenciaId, data.url);
        }
      } catch (err) {
        console.error(`Error subiendo archivo ${i}:`, err);
      }
    }
    return uploadedUrls;
  };

  const validateForm = () => {
    const errors = [];
    if (!formData.titulo.trim()) {
      errors.push('El título es requerido');
      setTouched(prev => ({ ...prev, titulo: true }));
    }
    if (!formData.descripcion.trim()) {
      errors.push('La descripción es requerida');
      setTouched(prev => ({ ...prev, descripcion: true }));
    }
    
    if (errors.length > 0) {
      setError(errors.join('. '));
      return false;
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;
    
    setLoading(true);
    setError('');
    setUploadProgress(10);

    try {
      // PASO 1: Crear la incidencia primero (sin evidencias)
      setUploadProgress(20);
      const response = await mantenimientoAPI.createIncidencia({
        equipo_id: equipoId,
        titulo: formData.titulo,
        descripcion: formData.descripcion,
        gravedad: formData.gravedad
      });
      
      // Obtener el ID de la incidencia recién creada
      const incidenciaId = response.id;
      console.log('📝 Incidencia creada con ID:', incidenciaId);
      
      // PASO 2: Subir las evidencias usando el ID real
      setUploadProgress(30);
      const evidenciasUrls = await uploadFiles(incidenciaId);
      
      // PASO 3: Actualizar la incidencia con las URLs de evidencias (opcional)
      if (evidenciasUrls.length > 0) {
        setUploadProgress(90);
        // Si tu API soporta actualizar evidencias, hazlo aquí
        // await mantenimientoAPI.updateIncidenciaEvidencias(incidenciaId, { evidencias_urls: evidenciasUrls });
        console.log('📸 Evidencias subidas:', evidenciasUrls.length);
      }
      
      setUploadProgress(100);

      // Limpiar formulario
      setFormData({
        titulo: '',
        descripcion: '',
        gravedad: 'media',
        evidencias: []
      });
      setTouched({ titulo: false, descripcion: false });
      setPreviewUrls([]);

      if (onSuccess) onSuccess();
      onClose();
    } catch (err) {
      console.error('Error:', err);
      setError(err.message || 'Error al crear la incidencia');
    } finally {
      setLoading(false);
      setTimeout(() => setUploadProgress(0), 1000);
    }
  };

  if (!isOpen) return null;

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <h2>⚠️ Reportar Incidencia / Daño</h2>
          <button className={styles.modalClose} onClick={onClose}>✕</button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className={styles.modalBody}>
            {error && <div className={styles.errorMessage}>⚠️ {error}</div>}

            <div className={styles.formGroup}>
              <label>Título *</label>
              <input
                type="text"
                name="titulo"
                value={formData.titulo}
                onChange={handleChange}
                onBlur={() => handleBlur('titulo')}
                placeholder="Ej: Sobrecalentamiento del motor"
                className={touched.titulo && !formData.titulo.trim() ? styles.inputError : ''}
                required
              />
              {touched.titulo && !formData.titulo.trim() && <span className={styles.errorText}>El título es requerido</span>}
            </div>

            <div className={styles.formGroup}>
              <label>Descripción *</label>
              <textarea
                name="descripcion"
                value={formData.descripcion}
                onChange={handleChange}
                onBlur={() => handleBlur('descripcion')}
                rows="3"
                placeholder="Describe detalladamente el problema..."
                className={touched.descripcion && !formData.descripcion.trim() ? styles.inputError : ''}
                required
              />
              {touched.descripcion && !formData.descripcion.trim() && <span className={styles.errorText}>La descripción es requerida</span>}
            </div>

            <div className={styles.formGroup}>
              <label>Gravedad</label>
              <select name="gravedad" value={formData.gravedad} onChange={handleChange}>
                {gravedades.map(g => <option key={g.value} value={g.value}>{g.label}</option>)}
              </select>
            </div>

            <div className={styles.formGroup}>
              <label>📸 Evidencias (Fotos / Documentos)</label>
              <div className={styles.fileInputArea}>
                <button type="button" className={styles.fileButton} onClick={() => fileInputRef.current?.click()}>
                  📷 Seleccionar archivos
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/gif,application/pdf"
                  onChange={handleFilesChange}
                  multiple
                  className={styles.hiddenInput}
                />
                <span className={styles.fileHint}>JPG, PNG, GIF, PDF (máx. 50MB por archivo)</span>
              </div>
              
              {previewUrls.length > 0 && (
                <div className={styles.previewGrid}>
                  {previewUrls.map((url, idx) => (
                    <div key={idx} className={styles.previewItem}>
                      {url.match(/\.pdf$/i) ? (
                        <div className={styles.pdfPreview}>📄 PDF</div>
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
                  {uploadProgress < 30 ? 'Creando incidencia...' : uploadProgress < 90 ? 'Subiendo evidencias...' : 'Finalizando...'} {uploadProgress}%
                </span>
              </div>
            )}
          </div>

          <div className={styles.modalFooter}>
            <button type="button" className={styles.cancelButton} onClick={onClose}>Cancelar</button>
            <button type="submit" className={styles.submitButton} disabled={loading}>
              {loading ? 'Guardando...' : 'Reportar Incidencia'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}