import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { mantenimientoAPI } from '../../api/mantenimiento';
import AddEquipmentModal from '../../components/mantenimiento/AddEquipmentModal';
import styles from './styles/DetalleEquipo.module.css';

export default function DetalleEquipo() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [equipo, setEquipo] = useState(null);
  const [mantenimientos, setMantenimientos] = useState([]);
  const [incidencias, setIncidencias] = useState([]);
  const [historial, setHistorial] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('mantenimientos');
  const [error, setError] = useState('');
  const [imageError, setImageError] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  useEffect(() => {
    cargarDatos();
  }, [id]);

  const cargarDatos = async () => {
    setLoading(true);
    setError('');
    try {
      const [equipoData, mantenimientosData, incidenciasData, historialData] = await Promise.all([
        mantenimientoAPI.getEquipoById(id),
        mantenimientoAPI.getMantenimientosByEquipo(id).catch(() => []),
        mantenimientoAPI.getIncidenciasByEquipo?.(id).catch(() => []),
        mantenimientoAPI.getHistorialEquipo?.(id).catch(() => [])
      ]);
      
      setEquipo(equipoData);
      setMantenimientos(mantenimientosData);
      setIncidencias(incidenciasData);
      setHistorial(historialData);
    } catch (err) {
      console.error('Error cargando datos:', err);
      setError('Error al cargar los datos del equipo');
    } finally {
      setLoading(false);
    }
  };

  const handleEditClick = () => {
    setShowEditModal(true);
  };

  const handleEditSuccess = () => {
    setShowEditModal(false);
    cargarDatos(); // Recargar datos después de editar
  };

  const handleDeleteClick = () => {
    setShowDeleteConfirm(true);
  };

  const handleConfirmDelete = async () => {
    try {
      await mantenimientoAPI.deleteEquipo(id);
      navigate('/mantenimiento/equipos');
    } catch (err) {
      console.error('Error eliminando equipo:', err);
      setError('Error al eliminar el equipo');
      setShowDeleteConfirm(false);
    }
  };

  const getEstadoClass = () => {
    switch (equipo?.estado) {
      case 'activo': return styles.estadoActivo;
      case 'dañado': return styles.estadoDanado;
      case 'suspension': return styles.estadoSuspension;
      case 'baja': return styles.estadoBaja;
      default: return '';
    }
  };

  const getEstadoTexto = () => {
    switch (equipo?.estado) {
      case 'activo': return 'Activo';
      case 'dañado': return 'Dañado';
      case 'suspension': return 'Suspendido';
      case 'baja': return 'Dado de Baja';
      default: return equipo?.estado || 'Desconocido';
    }
  };

  const getPrioridadClass = (prioridad) => {
    switch (prioridad) {
      case 'urgente': return styles.prioridadUrgente;
      case 'alta': return styles.prioridadAlta;
      case 'media': return styles.prioridadMedia;
      case 'baja': return styles.prioridadBaja;
      default: return '';
    }
  };

  const getPrioridadTexto = (prioridad) => {
    switch (prioridad) {
      case 'urgente': return '🚨 Urgente';
      case 'alta': return '⚠️ Alta';
      case 'media': return '📋 Media';
      case 'baja': return '✅ Baja';
      default: return prioridad;
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'No definida';
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return 'Fecha inválida';
    return date.toLocaleDateString('es-MX', { 
      day: '2-digit', 
      month: 'long', 
      year: 'numeric' 
    });
  };

  const mantenimientosPendientes = mantenimientos.filter(m => m.estado === 'pendiente');
  const mantenimientosCompletados = mantenimientos.filter(m => m.estado === 'completado');
  const mantenimientosProximos = mantenimientosPendientes.filter(m => new Date(m.fecha_inicio) > new Date());
  const mantenimientosVencidos = mantenimientosPendientes.filter(m => new Date(m.fecha_inicio) < new Date());

  if (loading) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.loadingSpinner}></div>
        <p>Cargando información del equipo...</p>
      </div>
    );
  }

  if (error || !equipo) {
    return (
      <div className={styles.errorContainer}>
        <span className={styles.errorIcon}>⚠️</span>
        <h2>Error al cargar el equipo</h2>
        <p>{error || 'El equipo no existe o ha sido eliminado'}</p>
        <Link to="/mantenimiento/equipos" className={styles.backButton}>
          ← Volver a Equipos
        </Link>
      </div>
    );
  }

  return (
    <div className={styles.detalleEquipo}>
      {/* Header con botones */}
      <div className={styles.header}>
        <Link to="/mantenimiento/equipos" className={styles.backLink}>
          ← Volver a Equipos
        </Link>
        <div className={styles.headerActions}>
          <button className={styles.editButton} onClick={handleEditClick}>
            ✏️ Editar
          </button>
          <button className={styles.deleteButton} onClick={handleDeleteClick}>
            🗑️ Eliminar
          </button>
        </div>
      </div>

      {/* Hero / Información principal */}
      <div className={styles.heroSection}>
        <div className={styles.fotoContainer}>
          {equipo.foto_url && !imageError ? (
            <img 
              src={equipo.foto_url} 
              alt={equipo.nombre}
              className={styles.foto}
              onError={() => setImageError(true)}
            />
          ) : (
            <div className={styles.fotoPlaceholder}>
              <span className={styles.fotoPlaceholderIcon}>🔧</span>
            </div>
          )}
        </div>
        <div className={styles.infoPrincipal}>
          <h1 className={styles.nombre}>{equipo.nombre}</h1>
          <div className={styles.badgesRow}>
            <div className={`${styles.estadoBadge} ${getEstadoClass()}`}>
              {getEstadoTexto()}
            </div>
            {equipo.ubicacion && (
              <div className={styles.ubicacionBadge}>
                📍 {equipo.ubicacion}
              </div>
            )}
          </div>
          {equipo.descripcion && (
            <p className={styles.descripcion}>{equipo.descripcion}</p>
          )}
          <div className={styles.categoriasRow}>
            {equipo.categorias?.map((cat, idx) => (
              <span 
                key={idx} 
                className={styles.categoriaTag}
                style={{ 
                  borderColor: cat.color || 'var(--border-dim)',
                  backgroundColor: `${cat.color || '#00ff9d'}15`
                }}
              >
                <span 
                  className={styles.categoriaDot} 
                  style={{ backgroundColor: cat.color || '#00ff9d' }}
                />
                {cat.nombre}
              </span>
            ))}
          </div>
          <div className={styles.metaInfo}>
            <span className={styles.metaItem}>📅 Registrado: {formatDate(equipo.fecha_registro)}</span>
            <span className={styles.metaItem}>🆔 ID: {equipo.id}</span>
          </div>
        </div>
      </div>

      {/* Tabs de navegación */}
      <div className={styles.tabsContainer}>
        <button 
          className={`${styles.tab} ${activeTab === 'mantenimientos' ? styles.active : ''}`}
          onClick={() => setActiveTab('mantenimientos')}
        >
          🔧 Mantenimientos
        </button>
        <button 
          className={`${styles.tab} ${activeTab === 'incidencias' ? styles.active : ''}`}
          onClick={() => setActiveTab('incidencias')}
        >
          ⚠️ Incidencias
        </button>
        <button 
          className={`${styles.tab} ${activeTab === 'documentos' ? styles.active : ''}`}
          onClick={() => setActiveTab('documentos')}
        >
          📄 Documentos
        </button>
        <button 
          className={`${styles.tab} ${activeTab === 'historial' ? styles.active : ''}`}
          onClick={() => setActiveTab('historial')}
        >
          📜 Historial
        </button>
      </div>

      {/* Contenido de los tabs */}
      <div className={styles.tabContent}>
        {/* Tab Mantenimientos */}
        {activeTab === 'mantenimientos' && (
          <div className={styles.mantenimientosTab}>
            {/* Próximos mantenimientos */}
            <div className={styles.card}>
              <h3 className={styles.cardTitle}>
                ⏰ Próximos Mantenimientos ({mantenimientosProximos.length})
              </h3>
              {mantenimientosProximos.length > 0 ? (
                <div className={styles.mantenimientosList}>
                  {mantenimientosProximos.map(m => (
                    <div key={m.id} className={styles.mantenimientoItem}>
                      <div className={styles.mantenimientoHeader}>
                        <span className={styles.mantenimientoTitulo}>{m.titulo}</span>
                        <span className={`${styles.prioridadBadge} ${getPrioridadClass(m.prioridad)}`}>
                          {getPrioridadTexto(m.prioridad)}
                        </span>
                      </div>
                      <div className={styles.mantenimientoInfo}>
                        <span>📅 Inicio: {formatDate(m.fecha_inicio)}</span>
                        {m.fecha_fin && <span>🔚 Fin: {formatDate(m.fecha_fin)}</span>}
                        <span className={styles.tipoTag}>{m.tipo || 'Rutina'}</span>
                      </div>
                      {m.descripcion && <p className={styles.mantenimientoDesc}>{m.descripcion}</p>}
                    </div>
                  ))}
                </div>
              ) : (
                <p className={styles.emptyMessage}>No hay mantenimientos programados próximamente</p>
              )}
            </div>

            {/* Mantenimientos vencidos */}
            {mantenimientosVencidos.length > 0 && (
              <div className={`${styles.card} ${styles.vencido}`}>
                <h3 className={styles.cardTitle}>
                  ⚠️ Mantenimientos Atrasados ({mantenimientosVencidos.length})
                </h3>
                <div className={styles.mantenimientosList}>
                  {mantenimientosVencidos.map(m => (
                    <div key={m.id} className={styles.mantenimientoItem}>
                      <div className={styles.mantenimientoHeader}>
                        <span className={styles.mantenimientoTitulo}>{m.titulo}</span>
                        <span className={`${styles.prioridadBadge} ${getPrioridadClass(m.prioridad)}`}>
                          {getPrioridadTexto(m.prioridad)}
                        </span>
                      </div>
                      <div className={styles.mantenimientoInfo}>
                        <span>📅 Debía iniciar: {formatDate(m.fecha_inicio)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Historial de mantenimientos completados */}
            <div className={styles.card}>
              <h3 className={styles.cardTitle}>
                ✅ Mantenimientos Completados ({mantenimientosCompletados.length})
              </h3>
              {mantenimientosCompletados.length > 0 ? (
                <div className={styles.mantenimientosList}>
                  {mantenimientosCompletados.map(m => (
                    <div key={m.id} className={styles.mantenimientoItem}>
                      <div className={styles.mantenimientoHeader}>
                        <span className={styles.mantenimientoTitulo}>{m.titulo}</span>
                      </div>
                      <div className={styles.mantenimientoInfo}>
                        <span>📅 Completado: {formatDate(m.fecha_completado || m.fecha_fin)}</span>
                        {m.completado_por && <span>👤 Por: {m.completado_por}</span>}
                      </div>
                      {m.notas_completado && <p className={styles.mantenimientoDesc}>📝 {m.notas_completado}</p>}
                    </div>
                  ))}
                </div>
              ) : (
                <p className={styles.emptyMessage}>No hay mantenimientos completados registrados</p>
              )}
            </div>
          </div>
        )}

        {/* Tab Incidencias */}
        {activeTab === 'incidencias' && (
          <div className={styles.incidenciasTab}>
            <div className={styles.card}>
              <h3 className={styles.cardTitle}>⚠️ Reporte de Incidencias</h3>
              {incidencias.length > 0 ? (
                <div className={styles.incidenciasList}>
                  {incidencias.map(i => (
                    <div key={i.id} className={styles.incidenciaItem}>
                      <div className={styles.incidenciaHeader}>
                        <span className={styles.incidenciaTitulo}>{i.titulo}</span>
                        <span className={`${styles.estadoIncidencia} ${i.estado === 'resuelto' ? styles.resuelto : styles.pendiente}`}>
                          {i.estado === 'resuelto' ? '✅ Resuelto' : '🟡 Pendiente'}
                        </span>
                      </div>
                      <p className={styles.incidenciaDesc}>{i.descripcion}</p>
                      <div className={styles.incidenciaInfo}>
                        <span>📅 Reportado: {formatDate(i.fecha_reporte)}</span>
                        {i.gravedad && <span className={styles.gravedadTag}>🔥 {i.gravedad}</span>}
                        {i.fecha_solucion && <span>🔧 Solucionado: {formatDate(i.fecha_solucion)}</span>}
                      </div>
                      {i.solucion && <p className={styles.solucionText}>💡 Solución: {i.solucion}</p>}
                    </div>
                  ))}
                </div>
              ) : (
                <p className={styles.emptyMessage}>No hay incidencias reportadas para este equipo</p>
              )}
            </div>
          </div>
        )}

        {/* Tab Documentos */}
        {activeTab === 'documentos' && (
          <div className={styles.documentosTab}>
            <div className={styles.card}>
              <h3 className={styles.cardTitle}>📄 Documentos del Equipo</h3>
              <div className={styles.documentosGrid}>
                {equipo.foto_url && (
                  <a href={equipo.foto_url} target="_blank" rel="noopener noreferrer" className={styles.documentoLink}>
                    <span className={styles.documentoIcon}>🖼️</span>
                    <span>Ver Foto del Equipo</span>
                  </a>
                )}
                {equipo.ficha_tecnica_url && (
                  <a href={equipo.ficha_tecnica_url} target="_blank" rel="noopener noreferrer" className={styles.documentoLink}>
                    <span className={styles.documentoIcon}>📑</span>
                    <span>Ficha Técnica</span>
                  </a>
                )}
                {equipo.manual_url && (
                  <a href={equipo.manual_url} target="_blank" rel="noopener noreferrer" className={styles.documentoLink}>
                    <span className={styles.documentoIcon}>📘</span>
                    <span>Manual de Usuario</span>
                  </a>
                )}
                {!equipo.foto_url && !equipo.ficha_tecnica_url && !equipo.manual_url && (
                  <p className={styles.emptyMessage}>No hay documentos cargados para este equipo</p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Tab Historial */}
        {activeTab === 'historial' && (
          <div className={styles.historialTab}>
            <div className={styles.card}>
              <h3 className={styles.cardTitle}>📜 Historial de Cambios</h3>
              {historial.length > 0 ? (
                <div className={styles.historialList}>
                  {historial.map(h => (
                    <div key={h.id} className={styles.historialItem}>
                      <div className={styles.historialHeader}>
                        <span className={styles.historialFecha}>{formatDate(h.fecha)}</span>
                        <span className={styles.historialUsuario}>👤 {h.usuario || 'sistema'}</span>
                      </div>
                      <div className={styles.historialContenido}>
                        <span className={styles.historialCampo}>📝 {h.campo_modificado}:</span>
                        {h.valor_anterior && <span className={styles.valorAnterior}>Antes: {h.valor_anterior}</span>}
                        {h.valor_nuevo && <span className={styles.valorNuevo}>Después: {h.valor_nuevo}</span>}
                        {h.descripcion && <p className={styles.historialDesc}>{h.descripcion}</p>}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className={styles.emptyMessage}>No hay registros de cambios para este equipo</p>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Modal de edición (reutiliza el mismo componente) */}
      <AddEquipmentModal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        onSuccess={handleEditSuccess}
        editMode={true}
        equipoData={equipo}
      />

      {/* Modal de confirmación de eliminación */}
      {showDeleteConfirm && (
        <div className={styles.modalOverlay} onClick={() => setShowDeleteConfirm(false)}>
          <div className={styles.confirmModal} onClick={(e) => e.stopPropagation()}>
            <div className={styles.confirmModalHeader}>
              <span className={styles.confirmIcon}>⚠️</span>
              <h3>Confirmar Eliminación</h3>
            </div>
            <div className={styles.confirmModalBody}>
              <p>¿Estás seguro de eliminar el equipo <strong>"{equipo.nombre}"</strong>?</p>
              <p className={styles.confirmWarning}>Esta acción moverá el equipo a la papelera y no podrá deshacerse fácilmente.</p>
            </div>
            <div className={styles.confirmModalFooter}>
              <button className={styles.cancelConfirmBtn} onClick={() => setShowDeleteConfirm(false)}>
                Cancelar
              </button>
              <button className={styles.confirmDeleteBtn} onClick={handleConfirmDelete}>
                Sí, Eliminar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}