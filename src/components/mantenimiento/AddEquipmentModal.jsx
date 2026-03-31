import { useState, useEffect, useRef } from 'react';
import { mantenimientoAPI } from '../../../api/mantenimiento';
import styles from './AddEquipmentModal.module.css';

export default function AddEquipmentModal({ isOpen, onClose, onSuccess }) {
  const [formData, setFormData] = useState({
    nombre: '',
    ubicacion: '',
    descripcion: '',
    categorias: [],
    foto: null,
    ficha_tecnica: null,
    manual: null
  });
  
  const [categoriasDisponibles, setCategoriasDisponibles] = useState([]);
  const [sugerencias, setSugerencias] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [nombreSugerencias, setNombreSugerencias] = useState([]);
  
  const fotoInputRef = useRef(null);
  const fichaInputRef = useRef(null);
  const manualInputRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      cargarCategorias();
      cargarSugerenciasNombres();
    }
  }, [isOpen]);

  const cargarCategorias = async () => {
    try {
      const categorias = await mantenimientoAPI.getCategorias();
      setCategoriasDisponibles(categorias);
    } catch (err) {
      console.error('Error cargando categorías:', err);
    }
  };

  const cargarSugerenciasNombres = async () => {
    try {
      const equipos = await mantenimientoAPI.getEquipos();
      const nombresUnicos = [...new Set(equipos.map(e => e.nombre))];
      setNombreSugerencias(nombresUnicos);
    } catch (err) {
      console.error('Error cargando sugerencias:', err);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    if (name === 'nombre' && value.length > 2) {
      const sugerenciasFiltradas = nombreSugerencias.filter(
        nombre => nombre.toLowerCase().includes(value.toLowerCase())
      );
      setSugerencias(sugerenciasFiltradas.slice(0, 5));
    } else {
      setSugerencias([]);
    }
  };

  const handleCategoriaToggle = (categoriaId) => {
    setFormData(prev => {
      const categoriasSeleccionadas = [...prev.categorias];
      const index = categoriasSeleccionadas.indexOf(categoriaId);
      
      if (index === -1) {
        categoriasSeleccionadas.push(categoriaId);
      } else {
        categoriasSeleccionadas.splice(index, 1);
      }
      
      return { ...prev, categorias: categoriasSeleccionadas };
    });
  };

  const handleFileChange = (e, tipo) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setError(`El archivo es demasiado grande. Máximo 5MB`);
        return;
      }
      
      if (tipo === 'foto' && !file.type.startsWith('image/')) {
        setError('El archivo debe ser una imagen');
        return;
      }
      
      setFormData(prev => ({ ...prev, [tipo]: file }));
      setError('');
    }
  };

  const handleSugerenciaClick = (nombre) => {
    setFormData(prev => ({ ...prev, nombre }));
    setSugerencias([]);
  };

  const uploadFile = async (file, tipo) => {
    if (!file) return null;
    
    const formData = new FormData();
    formData.append('archivo', file);
    formData.append('tipo', tipo);
    
    try {
      const response = await fetch('/api/mantenimiento/upload', {
        method: 'POST',
        body: formData
      });
      const data = await response.json();
      return data.url;
    } catch (err) {
      console.error(`Error subiendo ${tipo}:`, err);
      return null;
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      if (!formData.nombre.trim()) {
        throw new Error('El nombre del equipo es requerido');
      }

      const fotoUrl = await uploadFile(formData.foto, 'foto');
      const fichaUrl = await uploadFile(formData.ficha_tecnica, 'ficha');
      const manualUrl = await uploadFile(formData.manual, 'manual');

      const equipoData = {
        nombre: formData.nombre.trim(),
        ubicacion: formData.ubicacion.trim() || null,
        descripcion: formData.descripcion.trim() || null,
        categorias: formData.categorias,
        foto_url: fotoUrl,
        ficha_tecnica_url: fichaUrl,
        manual_url: manualUrl
      };

      await mantenimientoAPI.createEquipo(equipoData);
      
      setFormData({
        nombre: '',
        ubicacion: '',
        descripcion: '',
        categorias: [],
        foto: null,
        ficha_tecnica: null,
        manual: null
      });
      
      if (onSuccess) onSuccess();
      onClose();
    } catch (err) {
      setError(err.message || 'Error al crear el equipo');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <h2>Agregar Nuevo Equipo</h2>
          <button className={styles.modalClose} onClick={onClose}>✕</button>
        </div>

        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.modalBody}>
            {error && (
              <div className={styles.errorMessage}>
                <span>⚠️</span> {error}
              </div>
            )}

            <div className={styles.formGroup}>
              <label className={styles.label}>
                Nombre del equipo <span className={styles.required}>*</span>
              </label>
              <input
                type="text"
                name="nombre"
                value={formData.nombre}
                onChange={handleInputChange}
                className={styles.input}
                placeholder="Ej: Centrífuga, Microscopio, Reactor..."
                autoComplete="off"
              />
              {sugerencias.length > 0 && (
                <div className={styles.sugerencias}>
                  {sugerencias.map((sug, idx) => (
                    <div
                      key={idx}
                      className={styles.sugerencia}
                      onClick={() => handleSugerenciaClick(sug)}
                    >
                      🔄 {sug}
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className={styles.formGroup}>
              <label className={styles.label}>Ubicación</label>
              <input
                type="text"
                name="ubicacion"
                value={formData.ubicacion}
                onChange={handleInputChange}
                className={styles.input}
                placeholder="Ej: Laboratorio 1, Planta Baja..."
              />
            </div>

            <div className={styles.formGroup}>
              <label className={styles.label}>Descripción</label>
              <textarea
                name="descripcion"
                value={formData.descripcion}
                onChange={handleInputChange}
                className={styles.textarea}
                rows="3"
                placeholder="Características, especificaciones, etc."
              />
            </div>

            <div className={styles.formGroup}>
              <label className={styles.label}>Categorías / Etiquetas</label>
              <div className={styles.categoriasGrid}>
                {categoriasDisponibles.map(cat => (
                  <button
                    key={cat.id}
                    type="button"
                    className={`${styles.categoriaTag} ${
                      formData.categorias.includes(cat.id) ? styles.selected : ''
                    }`}
                    onClick={() => handleCategoriaToggle(cat.id)}
                    style={{ borderColor: cat.color }}
                  >
                    <span 
                      className={styles.categoriaDot} 
                      style={{ backgroundColor: cat.color }}
                    />
                    {cat.nombre}
                  </button>
                ))}
              </div>
            </div>

            <div className={styles.formGroup}>
              <label className={styles.label}>Foto del equipo</label>
              <div className={styles.fileInput}>
                <button
                  type="button"
                  className={styles.fileButton}
                  onClick={() => fotoInputRef.current?.click()}
                >
                  📷 {formData.foto ? 'Cambiar foto' : 'Seleccionar foto'}
                </button>
                <input
                  ref={fotoInputRef}
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleFileChange(e, 'foto')}
                  className={styles.hiddenInput}
                />
                {formData.foto && (
                  <span className={styles.fileName}>{formData.foto.name}</span>
                )}
              </div>
            </div>

            <div className={styles.formGroup}>
              <label className={styles.label}>Ficha técnica (PDF)</label>
              <div className={styles.fileInput}>
                <button
                  type="button"
                  className={styles.fileButton}
                  onClick={() => fichaInputRef.current?.click()}
                >
                  📄 {formData.ficha_tecnica ? 'Cambiar archivo' : 'Subir ficha técnica'}
                </button>
                <input
                  ref={fichaInputRef}
                  type="file"
                  accept=".pdf,.doc,.docx"
                  onChange={(e) => handleFileChange(e, 'ficha_tecnica')}
                  className={styles.hiddenInput}
                />
                {formData.ficha_tecnica && (
                  <span className={styles.fileName}>{formData.ficha_tecnica.name}</span>
                )}
              </div>
            </div>

            <div className={styles.formGroup}>
              <label className={styles.label}>Manual de usuario (PDF)</label>
              <div className={styles.fileInput}>
                <button
                  type="button"
                  className={styles.fileButton}
                  onClick={() => manualInputRef.current?.click()}
                >
                  📘 {formData.manual ? 'Cambiar manual' : 'Subir manual'}
                </button>
                <input
                  ref={manualInputRef}
                  type="file"
                  accept=".pdf,.doc,.docx"
                  onChange={(e) => handleFileChange(e, 'manual')}
                  className={styles.hiddenInput}
                />
                {formData.manual && (
                  <span className={styles.fileName}>{formData.manual.name}</span>
                )}
              </div>
            </div>
          </div>

          <div className={styles.modalFooter}>
            <button type="button" className={styles.cancelButton} onClick={onClose}>
              Cancelar
            </button>
            <button type="submit" className={styles.submitButton} disabled={loading}>
              {loading ? 'Guardando...' : 'Agregar Equipo'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}