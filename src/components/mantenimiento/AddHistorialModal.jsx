// FRONTEND/src/components/mantenimiento/AddHistorialModal.jsx
import { useState, useRef } from 'react';
import { mantenimientoAPI } from '../../api/mantenimiento';
import styles from './AddHistorialModal.module.css';

export default function AddHistorialModal({ isOpen, onClose, onSuccess, equipoId }) {
  const [formData, setFormData] = useState({
    campo_modificado: '',
    valor_anterior: '',
    valor_nuevo: '',
    descripcion: '',
    facturas: []
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [uploadProgress, setUploadProgress] = useState(0);
  const [touched, setTouched] = useState({
    campo_modificado: false,
    descripcion: false
  });
  const fileInputRef = useRef(null);
  const [previewUrls, setPreviewUrls] = useState([]);

  const campos = [
    { value: 'pieza_reemplazada', label: '🔧 Pieza Reemplazada' },
    { value: 'configuracion', label: '⚙️ Configuración' },
    { value: 'calibracion', label: '📏 Calibración' },
    { value: 'reparacion', label: '🛠️ Reparación' },
    { value: 'actualizacion', label: '🔄 Actualización' },
    { value: 'observacion', label: '📝 Observación' },
    { value: 'factura', label: '🧾 Factura / Comprobante' }
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
    
    setFormData(prev => ({ ...prev, facturas: [...prev.facturas, ...validFiles] }));
    
    const newPreviewUrls = validFiles.map(file => URL.createObjectURL(file));
    setPreviewUrls(prev => [...prev, ...newPreviewUrls]);
  };

  const removeFile = (index) => {
    setFormData(prev => ({
      ...prev,
      facturas: prev.facturas.filter((_, i) => i !== index)
    }));
    setPreviewUrls(prev => prev.filter((_, i) => i !== index));
  };

  // En la función uploadFiles
const uploadFiles = async () => {
  if (formData.facturas.length === 0) return [];
  
  const API_BASE = import.meta.env.VITE_API_URL;
  const uploadedUrls = [];
  
  for (let i = 0; i < formData.facturas.length; i++) {
    const file = formData.facturas[i];
    const formDataFile = new FormData();
    formDataFile.append('archivo', file);
    formDataFile.append('tipo', 'factura'); // ← CORRECTO: 'factura'
    formDataFile.append('entidad_id', equipoId);
    
    try {
      setUploadProgress(Math.round((i / formData.facturas.length) * 100));
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
    if (!formData.campo_modificado) {
      errors.push('Selecciona el tipo de cambio');
      setTouched(prev => ({ ...prev, campo_modificado: true }));
    }
    if (!formData.valor_nuevo && !formData.descripcion) {
      errors.push('Ingresa una descripción o valor nuevo');
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
    setUploadProgress(0);

    try {
      const facturasUrls = await uploadFiles();

      await mantenimientoAPI.registrarCambio(equipoId, {
        ...formData,
        facturas_urls: facturasUrls
      });

      setFormData({
        campo_modificado: '',
        valor_anterior: '',
        valor_nuevo: '',
        descripcion: '',
        facturas: []
      });
      setTouched({ campo_modificado: false, descripcion: false });
      setPreviewUrls([]);

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
          <h2>📜 Registrar Cambio / Pieza</h2>
          <button className={styles.modalClose} onClick={onClose}>✕</button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className={styles.modalBody}>
            {error && <div className={styles.errorMessage}>⚠️ {error}</div>}

            <div className={styles.formGroup}>
              <label>Tipo de Cambio *</label>
              <select 
                name="campo_modificado" 
                value={formData.campo_modificado} 
                onChange={handleChange}
                onBlur={() => handleBlur('campo_modificado')}
                className={touched.campo_modificado && !formData.campo_modificado ? styles.inputError : ''}
                required
              >
                <option value="">Seleccionar...</option>
                {campos.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
              </select>
              {touched.campo_modificado && !formData.campo_modificado && <span className={styles.errorText}>El tipo de cambio es requerido</span>}
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
                onBlur={() => handleBlur('descripcion')}
                rows="3"
                placeholder="Detalles del cambio realizado..."
              />
            </div>

            <div className={styles.formGroup}>
              <label>🧾 Facturas / Comprobantes</label>
              <div className={styles.fileInputArea}>
                <button type="button" className={styles.fileButton} onClick={() => fileInputRef.current?.click()}>
                  📎 Subir factura/comprobante
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
                        <img src={url} alt={`Factura ${idx + 1}`} className={styles.previewImage} />
                      )}
                      <button type="button" className={styles.removePreview} onClick={() => removeFile(idx)}>✕</button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {uploadProgress > 0 && uploadProgress < 100 && (
              <div className={styles.progressBar}>
                <div className={styles.progressFill} style={{ width: `${uploadProgress}%` }} />
                <span className={styles.progressText}>Subiendo archivos... {uploadProgress}%</span>
              </div>
            )}
          </div>

          <div className={styles.modalFooter}>
            <button type="button" className={styles.cancelButton} onClick={onClose}>Cancelar</button>
            <button type="submit" className={styles.submitButton} disabled={loading}>
              {loading ? 'Guardando...' : 'Registrar Cambio'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}