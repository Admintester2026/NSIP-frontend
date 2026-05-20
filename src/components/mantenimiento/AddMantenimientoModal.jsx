import { useState } from 'react';
import { mantenimientoAPI } from '../../api/mantenimiento';
import styles from './AddMantenimientoModal.module.css';

export default function AddMantenimientoModal({ isOpen, onClose, onSuccess, equipoId }) {
  const [formData, setFormData] = useState({
    titulo: '',
    descripcion: '',
    fecha_inicio: '',
    fecha_fin: '',
    tipo: 'preventivo',
    prioridad: 'media',
    recurrencia: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [touched, setTouched] = useState({
    titulo: false,
    fecha_inicio: false,
    tipo: false
  });

  const tipos = [
    { value: 'preventivo', label: '🔧 Preventivo' },
    { value: 'correctivo', label: '⚠️ Correctivo' },
    { value: 'rutina', label: '📋 Rutina' },
    { value: 'emergencia', label: '🚨 Emergencia' }
  ];

  const prioridades = [
    { value: 'urgente', label: '🚨 Urgente' },
    { value: 'alta', label: '⚠️ Alta' },
    { value: 'media', label: '📋 Media' },
    { value: 'baja', label: '✅ Baja' }
  ];

  const recurrencias = [
    { value: '', label: 'Sin recurrencia' },
    { value: 'diario', label: '📅 Diario' },
    { value: 'semanal', label: '📅 Semanal' },
    { value: 'mensual', label: '📅 Mensual' },
    { value: 'anual', label: '📅 Anual' }
  ];

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleBlur = (field) => {
    setTouched(prev => ({ ...prev, [field]: true }));
  };

  // Función para crear fecha local (año, mes, día) SIN zona horaria
  const crearFechaLocal = (year, month, day) => {
    return new Date(year, month - 1, day); // month -1 porque JS usa 0-11
  };

  const validateForm = () => {
    const errors = [];
    
    // Validar título
    if (!formData.titulo.trim()) {
      errors.push('El título es requerido');
      setTouched(prev => ({ ...prev, titulo: true }));
    }
    
    // Validar fecha de inicio
    if (!formData.fecha_inicio) {
      errors.push('La fecha de inicio es requerida');
      setTouched(prev => ({ ...prev, fecha_inicio: true }));
    } else {
      // Crear fecha usando año, mes, día (NO string ISO)
      const [year, month, day] = formData.fecha_inicio.split('-').map(Number);
      const fechaSeleccionada = crearFechaLocal(year, month, day);
      
      // Crear fecha de hoy con año, mes, día
      const hoy = new Date();
      const fechaHoy = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate());
      
      if (fechaSeleccionada < fechaHoy) {
        errors.push('No se puede programar un mantenimiento en una fecha pasada');
      }
    }
    
    // Validar tipo
    if (!formData.tipo) {
      errors.push('El tipo de mantenimiento es requerido');
      setTouched(prev => ({ ...prev, tipo: true }));
    }
    
    // Validar que fecha_fin no sea anterior a fecha_inicio
    if (formData.fecha_inicio && formData.fecha_fin) {
      const [yearIni, monthIni, dayIni] = formData.fecha_inicio.split('-').map(Number);
      const [yearFin, monthFin, dayFin] = formData.fecha_fin.split('-').map(Number);
      const inicio = crearFechaLocal(yearIni, monthIni, dayIni);
      const fin = crearFechaLocal(yearFin, monthFin, dayFin);
      
      if (fin < inicio) {
        errors.push('La fecha de fin no puede ser anterior a la fecha de inicio');
      }
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

    try {
      await mantenimientoAPI.createMantenimiento({
        equipo_id: equipoId,
        ...formData
      });

      setFormData({
        titulo: '',
        descripcion: '',
        fecha_inicio: '',
        fecha_fin: '',
        tipo: 'preventivo',
        prioridad: 'media',
        recurrencia: ''
      });
      setTouched({ titulo: false, fecha_inicio: false, tipo: false });

      if (onSuccess) onSuccess();
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  // Obtener fecha mínima (hoy) para el input date en formato YYYY-MM-DD
  const hoy = new Date();
  const hoyStr = `${hoy.getFullYear()}-${String(hoy.getMonth() + 1).padStart(2, '0')}-${String(hoy.getDate()).padStart(2, '0')}`;

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <h2>🔧 Programar Mantenimiento</h2>
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
                placeholder="Ej: Lubricación de rodamientos"
                className={touched.titulo && !formData.titulo.trim() ? styles.inputError : ''}
                required
              />
              {touched.titulo && !formData.titulo.trim() && <span className={styles.errorText}>El título es requerido</span>}
            </div>

            <div className={styles.formGroup}>
              <label>Descripción</label>
              <textarea
                name="descripcion"
                value={formData.descripcion}
                onChange={handleChange}
                rows="3"
                placeholder="Detalles del mantenimiento..."
              />
            </div>

            <div className={styles.row}>
              <div className={styles.formGroup}>
                <label>Fecha Inicio *</label>
                <input
                  type="date"
                  name="fecha_inicio"
                  value={formData.fecha_inicio}
                  onChange={handleChange}
                  onBlur={() => handleBlur('fecha_inicio')}
                  min={hoyStr}
                  required
                  className={touched.fecha_inicio && !formData.fecha_inicio ? styles.inputError : ''}
                />
                {touched.fecha_inicio && !formData.fecha_inicio && <span className={styles.errorText}>La fecha de inicio es requerida</span>}
              </div>
              <div className={styles.formGroup}>
                <label>Fecha Fin</label>
                <input
                  type="date"
                  name="fecha_fin"
                  value={formData.fecha_fin}
                  onChange={handleChange}
                  min={formData.fecha_inicio || hoyStr}
                />
              </div>
            </div>

            <div className={styles.row}>
              <div className={styles.formGroup}>
                <label>Tipo *</label>
                <select 
                  name="tipo" 
                  value={formData.tipo} 
                  onChange={handleChange} 
                  onBlur={() => handleBlur('tipo')}
                  required
                >
                  {tipos.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                </select>
              </div>
              <div className={styles.formGroup}>
                <label>Prioridad</label>
                <select name="prioridad" value={formData.prioridad} onChange={handleChange}>
                  {prioridades.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
                </select>
              </div>
            </div>

            <div className={styles.formGroup}>
              <label>Recurrencia</label>
              <select name="recurrencia" value={formData.recurrencia} onChange={handleChange}>
                {recurrencias.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
              </select>
            </div>
          </div>

          <div className={styles.modalFooter}>
            <button type="button" className={styles.cancelButton} onClick={onClose}>Cancelar</button>
            <button type="submit" className={styles.submitButton} disabled={loading}>
              {loading ? 'Guardando...' : 'Programar Mantenimiento'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}