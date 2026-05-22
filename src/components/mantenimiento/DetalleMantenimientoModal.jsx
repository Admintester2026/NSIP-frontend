// FRONTEND/src/components/mantenimiento/DetalleMantenimientoModal.jsx
import { useState, useEffect } from 'react';
import { mantenimientoAPI } from '../../api/mantenimiento';
import ImageGallery from './ImageGallery';
import styles from './DetalleMantenimientoModal.module.css';

const getApiBase = () => {
  if (typeof import.meta !== 'undefined' && import.meta.env?.VITE_API_URL) {
    return import.meta.env.VITE_API_URL;
  }
  if (typeof window !== 'undefined' && window.VITE_API_URL) {
    return window.VITE_API_URL;
  }
  return '';
};

export default function DetalleMantenimientoModal({ isOpen, onClose, mantenimiento, equipoNombre, onEdit }) {
  const [evidencias, setEvidencias] = useState([]);
  const [loadingEvidencias, setLoadingEvidencias] = useState(false);
  const [versiones, setVersiones] = useState([]);
  const [cargandoVersiones, setCargandoVersiones] = useState(false);
  const [mostrarSidebar, setMostrarSidebar] = useState(false);
  const [modoEdicion, setModoEdicion] = useState(false);
  const [datosActuales, setDatosActuales] = useState({
    tecnico: '',
    notas_completado: '',
    duracion: '',
    materiales_usados: '',
    costo_materiales: ''
  });
  const [editando, setEditando] = useState(false);
  const [editError, setEditError] = useState('');
  const [vistaPreviaVersion, setVistaPreviaVersion] = useState(null);
  const [recargando, setRecargando] = useState(false);

  const recargarDatosMantenimiento = async () => {
    if (!mantenimiento?.id) return;
    
    setRecargando(true);
    try {
      const mantenimientoActualizadoList = await mantenimientoAPI.getMantenimientosByEquipo(mantenimiento.id);
      const mantenimientoEncontrado = mantenimientoActualizadoList.find(m => m.id === mantenimiento.id);
      
      if (mantenimientoEncontrado) {
        setDatosActuales({
          tecnico: mantenimientoEncontrado.completado_por || '',
          notas_completado: mantenimientoEncontrado.notas_completado || '',
          duracion: mantenimientoEncontrado.duracion || '',
          materiales_usados: mantenimientoEncontrado.materiales_usados || '',
          costo_materiales: mantenimientoEncontrado.costo_materiales || ''
        });
        Object.assign(mantenimiento, mantenimientoEncontrado);
      }
      await cargarVersiones();
    } catch (err) {
      console.error('Error recargando datos:', err);
    } finally {
      setRecargando(false);
    }
  };

  useEffect(() => {
    if (isOpen && mantenimiento?.id) {
      setModoEdicion(false);
      setVistaPreviaVersion(null);
      setMostrarSidebar(false);
      setEditError('');
      
      setDatosActuales({
        tecnico: mantenimiento.completado_por || '',
        notas_completado: mantenimiento.notas_completado || '',
        duracion: mantenimiento.duracion || '',
        materiales_usados: mantenimiento.materiales_usados || '',
        costo_materiales: mantenimiento.costo_materiales || ''
      });
      
      cargarEvidencias();
      cargarVersiones();
    }
  }, [isOpen, mantenimiento?.id]);

 const cargarEvidencias = async () => {
  setLoadingEvidencias(true);
  try {
    const API_BASE = getApiBase();
    console.log('🔍 Cargando evidencias para mantenimiento:', mantenimiento.id);
    console.log('🔍 API_BASE:', API_BASE);
    
    const response = await fetch(`${API_BASE}/mantenimiento/evidencias/mantenimiento/${mantenimiento.id}`);
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      const data = await response.json();
      console.log('📸 Respuesta del servidor:', data);
      if (data.ok) {
        console.log('✅ Evidencias encontradas:', data.datos);
        setEvidencias(data.datos || []);
      }
    }
  } catch (err) {
    console.error('Error cargando evidencias:', err);
  } finally {
    setLoadingEvidencias(false);
  }
};

  const cargarVersiones = async () => {
    if (!mantenimiento?.id) return;
    setCargandoVersiones(true);
    try {
      const data = await mantenimientoAPI.getHistorialVersiones(mantenimiento.id);
      setVersiones(data || []);
    } catch (err) {
      console.error('Error cargando versiones:', err);
    } finally {
      setCargandoVersiones(false);
    }
  };

  const handleEditChange = (e) => {
    const { name, value } = e.target;
    setDatosActuales(prev => ({ ...prev, [name]: value }));
  };

  const handleGuardarEdicion = async () => {
    if (!mantenimiento?.id) return;
    setEditando(true);
    setEditError('');
    try {
      if (!datosActuales.tecnico?.trim()) throw new Error('El técnico es requerido');
      if (!datosActuales.notas_completado?.trim()) throw new Error('Las notas son requeridas');

      await mantenimientoAPI.editarMantenimientoCompletado(mantenimiento.id, {
        notas_completado: datosActuales.notas_completado,
        tecnico: datosActuales.tecnico,
        duracion: datosActuales.duracion,
        materiales_usados: datosActuales.materiales_usados,
        costo_materiales: datosActuales.costo_materiales
      });
      
      setModoEdicion(false);
      await recargarDatosMantenimiento();
      if (onEdit) onEdit();
    } catch (err) {
      setEditError(err.message);
    } finally {
      setEditando(false);
    }
  };

  const verVersionAnterior = (version) => {
    setVistaPreviaVersion({
      ...version,
      tecnico: version.completado_por || '',
      notas_completado: version.notas_completado || '',
      duracion: version.duracion || '',
      materiales_usados: version.materiales_usados || '',
      costo_materiales: version.costo_materiales || ''
    });
    setMostrarSidebar(false);
  };

  const cerrarVistaPrevia = () => {
    setVistaPreviaVersion(null);
    setDatosActuales({
      tecnico: mantenimiento?.completado_por || '',
      notas_completado: mantenimiento?.notas_completado || '',
      duracion: mantenimiento?.duracion || '',
      materiales_usados: mantenimiento?.materiales_usados || '',
      costo_materiales: mantenimiento?.costo_materiales || ''
    });
    setModoEdicion(false);
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

  const formatDateShort = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return '';
    return date.toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' });
  };

  if (!isOpen) return null;

  if (!mantenimiento) {
    return (
      <div className={styles.modalOverlay} onClick={onClose}>
        <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
          <div className={styles.modalHeader}>
            <h2>Cargando...</h2>
            <button className={styles.modalClose} onClick={onClose}>✕</button>
          </div>
          <div className={styles.modalBody}>
            <p className={styles.loadingText}>Cargando información del mantenimiento...</p>
          </div>
        </div>
      </div>
    );
  }

  if (recargando) {
    return (
      <div className={styles.modalOverlay} onClick={onClose}>
        <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
          <div className={styles.modalHeader}>
            <h2>Actualizando...</h2>
            <button className={styles.modalClose} onClick={onClose}>✕</button>
          </div>
          <div className={styles.modalBody}>
            <p className={styles.loadingText}>Actualizando información...</p>
          </div>
        </div>
      </div>
    );
  }

  const mostrarDatos = vistaPreviaVersion || datosActuales;
  const esVistaPrevia = vistaPreviaVersion !== null;

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={`${styles.modal} ${mostrarSidebar ? styles.withSidebar : ''}`} onClick={(e) => e.stopPropagation()}>
        {mostrarSidebar && (
          <div className={styles.sidebar}>
            <div className={styles.sidebarHeader}>
              <h3>📜 Versiones anteriores</h3>
              <button className={styles.sidebarClose} onClick={() => setMostrarSidebar(false)}>✕</button>
            </div>
            <div className={styles.sidebarContent}>
              {cargandoVersiones ? (
                <p className={styles.loadingText}>Cargando...</p>
              ) : versiones.length > 0 ? (
                versiones.map((v, idx) => (
                  <div key={idx} className={styles.versionItemSidebar} onClick={() => verVersionAnterior(v)}>
                    <div className={styles.versionHeaderSidebar}>
                      <span className={styles.versionBadgeSidebar}>Versión {v.version}</span>
                      <span className={styles.versionDateSidebar}>{formatDateShort(v.fecha_modificacion)}</span>
                    </div>
                    <div className={styles.versionPreviewSidebar}>{v.notas_completado?.substring(0, 60)}...</div>
                    <div className={styles.versionUserSidebar}>👤 {v.modificado_por || 'sistema'}</div>
                  </div>
                ))
              ) : (
                <p className={styles.emptyMessage}>No hay versiones anteriores</p>
              )}
            </div>
          </div>
        )}

        <div className={styles.modalMain}>
          <div className={styles.modalHeader}>
            <div className={styles.headerLeft}>
              <h2>
                {esVistaPrevia ? (
                  <span className={styles.versionPreviewBadge}>🔍 Vista previa - Versión {vistaPreviaVersion.version}</span>
                ) : (
                  '📋 Detalle del Mantenimiento'
                )}
              </h2>
              {versiones.length > 0 && !esVistaPrevia && (
                <button className={styles.historyButton} onClick={() => setMostrarSidebar(true)} title="Ver historial de versiones">
                  ⏱️ {versiones.length}
                </button>
              )}
              {esVistaPrevia && (
                <button className={styles.backToCurrentBtn} onClick={cerrarVistaPrevia}>← Volver a versión actual</button>
              )}
            </div>
            <button className={styles.modalClose} onClick={onClose}>✕</button>
          </div>

          <div className={styles.modalBody}>
            {/* Información básica */}
            <div className={styles.infoSection}>
              <div className={styles.infoRow}><span className={styles.infoLabel}>Título:</span><span className={styles.infoValue}>{mantenimiento.titulo}</span></div>
              <div className={styles.infoRow}><span className={styles.infoLabel}>Equipo:</span><span className={styles.infoValue}>{equipoNombre}</span></div>
              <div className={styles.infoRow}><span className={styles.infoLabel}>Tipo:</span><span className={styles.infoValue}>{mantenimiento.tipo || 'No especificado'}</span></div>
              <div className={styles.infoRow}>
                <span className={styles.infoLabel}>Prioridad:</span>
                <span className={`${styles.prioridadBadge} ${
                  mantenimiento.prioridad === 'urgente' ? styles.urgente :
                  mantenimiento.prioridad === 'alta' ? styles.alta :
                  mantenimiento.prioridad === 'media' ? styles.media : styles.baja
                }`}>{mantenimiento.prioridad || 'No especificada'}</span>
              </div>
            </div>

            {/* Fechas */}
            <div className={styles.infoSection}>
              <h4 className={styles.sectionSubtitle}>📅 Fechas</h4>
              <div className={styles.infoRow}><span className={styles.infoLabel}>Programado:</span><span className={styles.infoValue}>{formatDate(mantenimiento.fecha_inicio)}</span></div>
              {mantenimiento.fecha_fin && <div className={styles.infoRow}><span className={styles.infoLabel}>Fin programado:</span><span className={styles.infoValue}>{formatDate(mantenimiento.fecha_fin)}</span></div>}
              <div className={styles.infoRow}><span className={styles.infoLabel}>Completado original:</span><span className={styles.infoValue}>{formatDate(mantenimiento.fecha_completado)}</span></div>
              {vistaPreviaVersion?.fecha_modificacion && <div className={styles.infoRow}><span className={styles.infoLabel}>Modificado:</span><span className={styles.infoValue}>{formatDate(vistaPreviaVersion.fecha_modificacion)}</span></div>}
            </div>

            {/* Ejecución */}
            <div className={styles.infoSection}>
              <div className={styles.sectionHeader}>
                <h4 className={styles.sectionSubtitle}>👤 Ejecución</h4>
                {!modoEdicion && !esVistaPrevia && <button className={styles.editarButton} onClick={() => setModoEdicion(true)}>✏️ Editar</button>}
              </div>
              
              {modoEdicion && !esVistaPrevia ? (
                <>
                  {editError && <div className={styles.editError}>{editError}</div>}
                  <div className={styles.formGroup}><label>Técnico *</label><input type="text" name="tecnico" value={mostrarDatos.tecnico || ''} onChange={handleEditChange} /></div>
                  <div className={styles.formGroup}><label>Notas / Trabajo *</label><textarea name="notas_completado" value={mostrarDatos.notas_completado || ''} onChange={handleEditChange} rows="3" /></div>
                  <div className={styles.row}>
                    <div className={styles.formGroup}><label>Duración (min)</label><input type="number" name="duracion" value={mostrarDatos.duracion || ''} onChange={handleEditChange} /></div>
                    <div className={styles.formGroup}><label>Costo materiales</label><input type="number" name="costo_materiales" value={mostrarDatos.costo_materiales || ''} onChange={handleEditChange} step="0.01" /></div>
                  </div>
                  <div className={styles.formGroup}><label>Materiales usados</label><textarea name="materiales_usados" value={mostrarDatos.materiales_usados || ''} onChange={handleEditChange} rows="2" /></div>
                  <div className={styles.editActions}>
                    <button className={styles.cancelEditBtn} onClick={() => setModoEdicion(false)}>Cancelar</button>
                    <button className={styles.saveEditBtn} onClick={handleGuardarEdicion} disabled={editando}>{editando ? 'Guardando...' : 'Guardar cambios'}</button>
                  </div>
                </>
              ) : (
                <>
                  <div className={styles.infoRow}><span className={styles.infoLabel}>Técnico:</span><span className={styles.infoValue}>{mostrarDatos?.tecnico || 'No registrado'}</span></div>
                  {mostrarDatos?.duracion && <div className={styles.infoRow}><span className={styles.infoLabel}>Duración:</span><span className={styles.infoValue}>{mostrarDatos.duracion} minutos</span></div>}
                </>
              )}
            </div>

            {/* Materiales y costo */}
            {(mostrarDatos?.materiales_usados || mostrarDatos?.costo_materiales) && (
              <div className={styles.infoSection}>
                <h4 className={styles.sectionSubtitle}>🔧 Materiales y Costos</h4>
                {mostrarDatos.materiales_usados && <div className={styles.infoRow}><span className={styles.infoLabel}>Materiales usados:</span><span className={styles.infoValue}>{mostrarDatos.materiales_usados}</span></div>}
                {mostrarDatos.costo_materiales && <div className={styles.infoRow}><span className={styles.infoLabel}>Costo de materiales:</span><span className={styles.infoValue}>${Number(mostrarDatos.costo_materiales).toFixed(2)}</span></div>}
              </div>
            )}

            {/* Notas */}
            {mostrarDatos?.notas_completado && (
              <div className={styles.infoSection}>
                <h4 className={styles.sectionSubtitle}>📝 Notas del trabajo</h4>
                <div className={styles.notasBox}>{mostrarDatos.notas_completado}</div>
              </div>
            )}

            {/* Evidencias - CON GALERÍA DE IMÁGENES */}
            <div className={styles.infoSection}>
              <h4 className={styles.sectionSubtitle}>📸 Evidencias</h4>
              {loadingEvidencias ? (
                <p className={styles.loadingText}>Cargando evidencias...</p>
              ) : evidencias.length > 0 ? (
                <ImageGallery images={evidencias} title="Evidencias del mantenimiento" />
              ) : (
                <p className={styles.emptyMessage}>No hay evidencias adjuntas</p>
              )}
            </div>
          </div>

          <div className={styles.modalFooter}>
            <button className={styles.closeButton} onClick={onClose}>Cerrar</button>
          </div>
        </div>
      </div>
    </div>
  );
}