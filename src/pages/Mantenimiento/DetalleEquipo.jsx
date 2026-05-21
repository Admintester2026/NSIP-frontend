import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { mantenimientoAPI } from '../../api/mantenimiento';
import { useDateUtils } from '../../context/DateContext';
import AddEquipmentModal from '../../components/mantenimiento/AddEquipmentModal';
import AddMantenimientoModal from '../../components/mantenimiento/AddMantenimientoModal';
import AddHistorialModal from '../../components/mantenimiento/AddHistorialModal';
import AddIncidenciaModal from '../../components/mantenimiento/AddIncidenciaModal';
import CompletarMantenimientoModal from '../../components/mantenimiento/CompletarMantenimientoModal';
import DetalleMantenimientoModal from '../../components/mantenimiento/DetalleMantenimientoModal';
import DetalleIncidenciaModal from '../../components/mantenimiento/DetalleIncidenciaModal';
import DetalleHistorialModal from '../../components/mantenimiento/DetalleHistorialModal';
import ReprogramarModal from '../../components/mantenimiento/ReprogramarModal';
import styles from './styles/Detallesquiposestilos/DetalleEquipo.module.css';

export default function DetalleEquipo() {
  const { id } = useParams();
  const navigate = useNavigate();
  
  const { 
    isoToLocalDate, 
    getTodayLocal, 
    compareDates,
    isToday,
    getMonthIndicator
  } = useDateUtils();
  
  const [equipo, setEquipo] = useState(null);
  const [mantenimientos, setMantenimientos] = useState([]);
  const [incidencias, setIncidencias] = useState([]);
  const [historial, setHistorial] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('mantenimientos');
  const [error, setError] = useState('');
  const [imageError, setImageError] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  const mountedRef = useRef(true);
  const retryCountRef = useRef(0);
  const refreshIntervalRef = useRef(null);
  
  // Estados para modales
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showMantModal, setShowMantModal] = useState(false);
  const [showHistorialModal, setShowHistorialModal] = useState(false);
  const [showIncidenciaModal, setShowIncidenciaModal] = useState(false);
  const [showCompletarModal, setShowCompletarModal] = useState(false);
  const [mantenimientoACompletar, setMantenimientoACompletar] = useState(null);
  
  // Estados para detalle de mantenimiento
  const [showDetalleModal, setShowDetalleModal] = useState(false);
  const [mantenimientoSeleccionado, setMantenimientoSeleccionado] = useState(null);
  
  // Estados para detalle de incidencia
  const [showDetalleIncidenciaModal, setShowDetalleIncidenciaModal] = useState(false);
  const [incidenciaSeleccionada, setIncidenciaSeleccionada] = useState(null);
  
  // Estados para detalle de historial
  const [showDetalleHistorialModal, setShowDetalleHistorialModal] = useState(false);
  const [historialSeleccionado, setHistorialSeleccionado] = useState(null);

  // Estados para las mejoras
  const [buscarEnCompletados, setBuscarEnCompletados] = useState('');
  const [showReprogramarModal, setShowReprogramarModal] = useState(false);
  const [mantenimientoAReprogramar, setMantenimientoAReprogramar] = useState(null);
  const [showAlert, setShowAlert] = useState(false);
  const [alertMessage, setAlertMessage] = useState('');

  // Estados para ordenamiento y filtros
  const [ordenProximos, setOrdenProximos] = useState('asc');
  const [ordenVencidos, setOrdenVencidos] = useState('asc');
  const [ordenCompletados, setOrdenCompletados] = useState('asc');
  const [filtroCompletadosPor, setFiltroCompletadosPor] = useState('completado');

  // Estados para clave preventiva
  const [showClaveModal, setShowClaveModal] = useState(false);
  const [claveModalData, setClaveModalData] = useState({ 
    mantenimiento: null, 
    accion: 'completar'
  });
  const [clavePreventiva, setClavePreventiva] = useState('');
  const [claveError, setClaveError] = useState('');

  const CLAVE_PREVENTIVA = 'C';

  // ==========================================
  // FUNCIONES DE FORMATO CORREGIDAS
  // ==========================================
  
  const formatDate = (dateString) => {
    if (!dateString) return 'No definida';
    const [year, month, day] = dateString.split('-').map(Number);
    if (isNaN(year) || isNaN(month) || isNaN(day)) return 'Fecha inválida';
    const date = new Date(year, month - 1, day);
    return date.toLocaleDateString('es-MX', { 
      day: '2-digit', 
      month: 'long', 
      year: 'numeric' 
    });
  };

  const formatDateTime = (dateString) => {
    if (!dateString) return 'No definida';
    const fechaLimpia = dateString.split('T')[0];
    const [year, month, day] = fechaLimpia.split('-').map(Number);
    if (isNaN(year) || isNaN(month) || isNaN(day)) return 'Fecha inválida';
    const date = new Date(year, month - 1, day);
    return date.toLocaleDateString('es-MX', { 
      day: '2-digit', 
      month: 'long', 
      year: 'numeric'
    });
  };

  // ==========================================
  // FUNCIONES AUXILIARES
  // ==========================================
  
  const filtrarMantenimientosCompletados = () => {
    if (!buscarEnCompletados.trim()) return mantenimientosCompletados;
    
    const busqueda = buscarEnCompletados.toLowerCase();
    return mantenimientosCompletados.filter(m => {
      let fecha;
      if (filtroCompletadosPor === 'completado') {
        fecha = isoToLocalDate(m.fecha_completado || m.fecha_fin);
      } else {
        fecha = isoToLocalDate(m.fecha_inicio);
      }
      if (!fecha) return false;
      const fechaStr = `${fecha.getDate().toString().padStart(2,'0')}/${(fecha.getMonth()+1).toString().padStart(2,'0')}/${fecha.getFullYear()}`;
      
      return fechaStr.includes(busqueda) ||
             m.titulo?.toLowerCase().includes(busqueda) ||
             m.completado_por?.toLowerCase().includes(busqueda) ||
             m.notas_completado?.toLowerCase().includes(busqueda);
    });
  };

  const ordenarProximos = (lista) => {
    return [...lista].sort((a, b) => {
      const fechaA = isoToLocalDate(a.fecha_inicio);
      const fechaB = isoToLocalDate(b.fecha_inicio);
      if (!fechaA || !fechaB) return 0;
      return ordenProximos === 'asc' ? fechaA - fechaB : fechaB - fechaA;
    });
  };

  const ordenarVencidos = (lista) => {
    return [...lista].sort((a, b) => {
      const fechaA = isoToLocalDate(a.fecha_inicio);
      const fechaB = isoToLocalDate(b.fecha_inicio);
      if (!fechaA || !fechaB) return 0;
      return ordenVencidos === 'asc' ? fechaA - fechaB : fechaB - fechaA;
    });
  };

  const ordenarCompletados = (lista) => {
    return [...lista].sort((a, b) => {
      let fechaA, fechaB;
      if (filtroCompletadosPor === 'completado') {
        fechaA = isoToLocalDate(a.fecha_completado || a.fecha_fin);
        fechaB = isoToLocalDate(b.fecha_completado || b.fecha_fin);
      } else {
        fechaA = isoToLocalDate(a.fecha_inicio);
        fechaB = isoToLocalDate(b.fecha_inicio);
      }
      if (!fechaA || !fechaB) return 0;
      return ordenCompletados === 'asc' ? fechaA - fechaB : fechaB - fechaA;
    });
  };

  // ==========================================
  // HANDLERS PARA VER DETALLES
  // ==========================================
  
  const handleVerDetalleMantenimiento = (mantenimiento) => {
    setMantenimientoSeleccionado(mantenimiento);
    setShowDetalleModal(true);
  };

  const handleVerDetalleIncidencia = (incidencia) => {
    setIncidenciaSeleccionada(incidencia);
    setShowDetalleIncidenciaModal(true);
  };

  const handleVerDetalleHistorial = (historialItem) => {
    setHistorialSeleccionado(historialItem);
    setShowDetalleHistorialModal(true);
  };

  // ==========================================
  // FUNCIÓN CON REINTENTOS
  // ==========================================
  const fetchWithRetry = useCallback(async (fn, fnName, retries = 3, delay = 1000) => {
    for (let i = 0; i < retries; i++) {
      if (!mountedRef.current) return null;
      try {
        return await fn();
      } catch (err) {
        console.log(`⚠️ ${fnName} - Intento ${i + 1}/${retries} falló:`, err.message);
        if (i === retries - 1) throw err;
        await new Promise(resolve => setTimeout(resolve, delay * Math.pow(2, i)));
      }
    }
    return null;
  }, []);

  // ==========================================
  // CARGA DE DATOS
  // ==========================================
  const cargarDatos = useCallback(async (isRetry = false) => {
    if (!mountedRef.current) return;
    if (!isRetry) setLoading(true);
    setError('');
    
    try {
      const results = await Promise.allSettled([
        fetchWithRetry(() => mantenimientoAPI.getEquipoById(id), 'getEquipoById'),
        fetchWithRetry(() => mantenimientoAPI.getMantenimientosByEquipo(id).catch(() => []), 'getMantenimientosByEquipo'),
        fetchWithRetry(() => mantenimientoAPI.getIncidenciasByEquipo?.(id).catch(() => []), 'getIncidenciasByEquipo'),
        fetchWithRetry(() => mantenimientoAPI.getHistorialEquipo?.(id).catch(() => []), 'getHistorialEquipo')
      ]);
      
      const [equipoResult, mantenimientosResult, incidenciasResult, historialResult] = results;
      
      if (equipoResult.status === 'fulfilled' && equipoResult.value) {
        setEquipo(equipoResult.value);
      } else {
        throw new Error('No se pudo cargar la información del equipo');
      }
      
      setMantenimientos(mantenimientosResult.status === 'fulfilled' ? mantenimientosResult.value || [] : []);
      setIncidencias(incidenciasResult.status === 'fulfilled' ? incidenciasResult.value || [] : []);
      setHistorial(historialResult.status === 'fulfilled' ? historialResult.value || [] : []);
      
      retryCountRef.current = 0;
    } catch (err) {
      if (retryCountRef.current < 2 && mountedRef.current) {
        retryCountRef.current++;
        setTimeout(() => cargarDatos(true), 3000);
      } else {
        setError('Error al cargar los datos del equipo. Por favor, recarga la página.');
      }
    } finally {
      if (mountedRef.current && !isRetry) setLoading(false);
    }
  }, [id, fetchWithRetry]);

  // ==========================================
  // EFECTOS
  // ==========================================
  useEffect(() => {
    refreshIntervalRef.current = setInterval(async () => {
      if (!mountedRef.current) return;
      try {
        await fetch('/api/mantenimiento/equipos?limit=1', { method: 'HEAD', cache: 'no-cache' });
      } catch (err) {}
    }, 45000);
    return () => clearInterval(refreshIntervalRef.current);
  }, []);

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden && mountedRef.current && id && !loading) {
        setIsRefreshing(true);
        cargarDatos().finally(() => setIsRefreshing(false));
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [id, cargarDatos, loading]);

  useEffect(() => {
    mountedRef.current = true;
    cargarDatos();
    return () => { mountedRef.current = false; };
  }, [id, cargarDatos]);

  useEffect(() => {
    const handleOffline = () => setError('⚠️ Sin conexión a internet. Verifica tu red.');
    const handleOnline = () => { setError(''); cargarDatos(); };
    window.addEventListener('offline', handleOffline);
    window.addEventListener('online', handleOnline);
    return () => {
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('online', handleOnline);
    };
  }, [cargarDatos]);

  // ==========================================
  // HANDLERS DE ACCIONES
  // ==========================================
  const handleEditSuccess = () => {
    setShowEditModal(false);
    cargarDatos();
  };

  const handleDeleteClick = () => {
    setShowDeleteConfirm(true);
  };

  const handleConfirmDelete = async () => {
    try {
      await mantenimientoAPI.deleteEquipo(id);
      navigate('/mantenimiento/equipos');
    } catch (err) {
      setError('Error al eliminar el equipo');
      setShowDeleteConfirm(false);
    }
  };

  const handleRetry = () => {
    setError('');
    retryCountRef.current = 0;
    cargarDatos();
  };

  const requiereClave = (mantenimiento) => {
    const esPreventivo = mantenimiento.tipo === 'preventivo';
    if (!esPreventivo) return false;
    const fechaMant = isoToLocalDate(mantenimiento.fecha_inicio);
    const hoyLocal = getTodayLocal();
    return fechaMant && fechaMant > hoyLocal;
  };

  const handleCompletarClick = (mantenimiento) => {
    if (requiereClave(mantenimiento)) {
      setClaveModalData({ mantenimiento, accion: 'completar' });
      setShowClaveModal(true);
    } else {
      setMantenimientoACompletar(mantenimiento);
      setShowCompletarModal(true);
    }
  };

  const handleReprogramarClick = (mantenimiento) => {
    if (requiereClave(mantenimiento)) {
      setClaveModalData({ mantenimiento, accion: 'reprogramar' });
      setShowClaveModal(true);
    } else {
      setMantenimientoAReprogramar(mantenimiento);
      setShowReprogramarModal(true);
    }
  };

  const verificarClave = () => {
    if (clavePreventiva === CLAVE_PREVENTIVA) {
      setShowClaveModal(false);
      setClavePreventiva('');
      setClaveError('');
      if (claveModalData.accion === 'completar') {
        setMantenimientoACompletar(claveModalData.mantenimiento);
        setShowCompletarModal(true);
      } else if (claveModalData.accion === 'reprogramar') {
        setMantenimientoAReprogramar(claveModalData.mantenimiento);
        setShowReprogramarModal(true);
      }
    } else {
      setClaveError('Clave incorrecta. No puedes realizar esta acción en un mantenimiento preventivo futuro.');
    }
  };

  const handleCompletarSuccess = () => {
    setShowCompletarModal(false);
    setMantenimientoACompletar(null);
    cargarDatos();
    setAlertMessage('✅ Mantenimiento completado exitosamente');
    setShowAlert(true);
    setTimeout(() => setShowAlert(false), 3000);
  };

  const handleReprogramarSuccess = () => {
    setShowReprogramarModal(false);
    setMantenimientoAReprogramar(null);
    cargarDatos();
    setAlertMessage('✅ Mantenimiento reprogramado exitosamente');
    setShowAlert(true);
    setTimeout(() => setShowAlert(false), 3000);
  };

  const handleEliminarMantenimiento = async (mantenimiento) => {
    if (window.confirm(`¿Eliminar permanentemente el mantenimiento "${mantenimiento.titulo}"?`)) {
      try {
        await mantenimientoAPI.deleteMantenimiento(mantenimiento.id);
        cargarDatos();
        setAlertMessage('🗑️ Mantenimiento eliminado');
        setShowAlert(true);
        setTimeout(() => setShowAlert(false), 3000);
      } catch (err) {
        setError('Error al eliminar el mantenimiento');
      }
    }
  };

  // ==========================================
  // FUNCIONES DE ESTILO
  // ==========================================
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

  // ==========================================
  // FILTRADO DE MANTENIMIENTOS
  // ==========================================
  const hoyLocal = getTodayLocal();

  const mantenimientosPendientes = mantenimientos.filter(m => m.estado === 'pendiente');
  const mantenimientosCompletados = mantenimientos.filter(m => m.estado === 'completado');

  const mantenimientosProximos = mantenimientosPendientes.filter(m => {
    const fechaMant = isoToLocalDate(m.fecha_inicio);
    return fechaMant && compareDates(fechaMant, hoyLocal) >= 0;
  });

  const mantenimientosVencidos = mantenimientosPendientes.filter(m => {
    const fechaMant = isoToLocalDate(m.fecha_inicio);
    return fechaMant && compareDates(fechaMant, hoyLocal) < 0;
  });

  const mantenimientosCompletadosFiltrados = filtrarMantenimientosCompletados();

  // ==========================================
  // RENDER
  // ==========================================
  if (isRefreshing) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.loadingSpinner}></div>
        <p>Actualizando información...</p>
      </div>
    );
  }

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
        <div className={styles.errorActions}>
          <button onClick={handleRetry} className={styles.retryButton}>🔄 Reintentar</button>
          <Link to="/mantenimiento/equipos" className={styles.backButton}>← Volver a Equipos</Link>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.detalleEquipo}>
      {showAlert && (
        <div className={styles.alert}>
          <span>✅</span> {alertMessage}
        </div>
      )}

      <div className={styles.header}>
        <Link to="/mantenimiento/equipos" className={styles.backLink}>← Volver a Equipos</Link>
        <div className={styles.headerActions}>
          <button className={styles.editButton} onClick={() => setShowEditModal(true)}>✏️ Editar</button>
          <button className={styles.deleteButton} onClick={handleDeleteClick}>🗑️ Eliminar</button>
          <button className={styles.refreshButton} onClick={() => cargarDatos()} title="Actualizar datos">🔄</button>
        </div>
      </div>

      <div className={styles.heroSection}>
        <div className={styles.fotoContainer}>
          {equipo.foto_url && !imageError ? (
            <img src={equipo.foto_url} alt={equipo.nombre} className={styles.foto} onError={() => setImageError(true)} />
          ) : (
            <div className={styles.fotoPlaceholder}><span className={styles.fotoPlaceholderIcon}>🔧</span></div>
          )}
        </div>
        <div className={styles.infoPrincipal}>
          <h1 className={styles.nombre}>{equipo.nombre}</h1>
          <div className={styles.badgesRow}>
            <div className={`${styles.estadoBadge} ${getEstadoClass()}`}>{getEstadoTexto()}</div>
            {equipo.ubicacion && <div className={styles.ubicacionBadge}>📍 {equipo.ubicacion}</div>}
          </div>
          {equipo.descripcion && <p className={styles.descripcion}>{equipo.descripcion}</p>}
          <div className={styles.categoriasRow}>
            {equipo.categorias?.map((cat, idx) => (
              <span key={idx} className={styles.categoriaTag} style={{ borderColor: cat.color, backgroundColor: `${cat.color}15` }}>
                <span className={styles.categoriaDot} style={{ backgroundColor: cat.color }} />
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

      <div className={styles.actionButtonsBar}>
        <button className={styles.actionBtn} onClick={() => setShowMantModal(true)}>🔧 Programar Mantenimiento</button>
        <button className={styles.actionBtn} onClick={() => setShowHistorialModal(true)}>📝 Registrar Cambio</button>
        <button className={styles.actionBtn} onClick={() => setShowIncidenciaModal(true)}>⚠️ Reportar Incidencia</button>
      </div>

      <div className={styles.tabsContainer}>
        <button className={`${styles.tab} ${activeTab === 'mantenimientos' ? styles.active : ''}`} onClick={() => setActiveTab('mantenimientos')}>🔧 Mantenimientos</button>
        <button className={`${styles.tab} ${activeTab === 'incidencias' ? styles.active : ''}`} onClick={() => setActiveTab('incidencias')}>⚠️ Incidencias</button>
        <button className={`${styles.tab} ${activeTab === 'documentos' ? styles.active : ''}`} onClick={() => setActiveTab('documentos')}>📄 Documentos</button>
        <button className={`${styles.tab} ${activeTab === 'historial' ? styles.active : ''}`} onClick={() => setActiveTab('historial')}>📜 Historial</button>
      </div>

      <div className={styles.tabContent}>
        {/* Tab Mantenimientos */}
        {activeTab === 'mantenimientos' && (
          <div className={styles.mantenimientosTab}>
            <div className={styles.card}>
              <div className={styles.cardHeaderWithButton}>
                <h3 className={styles.cardTitle}>⏰ Próximos Mantenimientos ({mantenimientosProximos.length})</h3>
                <button className={styles.orderButton} onClick={() => setOrdenProximos(ordenProximos === 'asc' ? 'desc' : 'asc')}>
                  {ordenProximos === 'asc' ? '📅 ↑' : '📅 ↓'}
                </button>
              </div>
              <div className={styles.mantenimientosListScroll}>
                {ordenarProximos(mantenimientosProximos).map(m => {
                  const prioridadClass = getPrioridadClass(m.prioridad);
                  const indicador = getMonthIndicator(m.fecha_inicio);
                  const esHoy = isToday(isoToLocalDate(m.fecha_inicio));
                  return (
                    <div key={m.id} className={`${styles.mantenimientoItem} ${prioridadClass} ${styles[indicador?.clase || '']}`}>
                      <div className={styles.mantenimientoHeader}>
                        <span className={styles.mantenimientoTitulo}>{m.titulo}</span>
                        {esHoy && <span className={styles.hoyIcon} title="Programado para hoy">🔔</span>}
                        {indicador && <span className={`${styles.indicadorMes} ${styles[indicador.clase]}`}>{indicador.texto}</span>}
                        <span className={`${styles.prioridadBadge} ${prioridadClass}`}>{getPrioridadTexto(m.prioridad)}</span>
                      </div>
                      <div className={styles.mantenimientoInfo}>
                        <span>📅 Inicio: {formatDate(m.fecha_inicio)}</span>
                        {m.fecha_fin && <span>🔚 Fin: {formatDate(m.fecha_fin)}</span>}
                        <span className={styles.tipoTag}>{m.tipo || 'Rutina'}</span>
                      </div>
                      {m.descripcion && <p className={styles.mantenimientoDesc}>{m.descripcion}</p>}
                      <div className={styles.mantenimientoActions}>
                        <button className={styles.completarButton} onClick={() => handleCompletarClick(m)}>✅ Completar</button>
                        <button className={styles.reprogramarButton} onClick={() => handleReprogramarClick(m)}>📅 Reprogramar</button>
                        <button className={styles.eliminarButton} onClick={() => handleEliminarMantenimiento(m)}>🗑️ Eliminar</button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {ordenarVencidos(mantenimientosVencidos).length > 0 && (
              <div className={`${styles.card} ${styles.vencido}`}>
                <div className={styles.cardHeaderWithButton}>
                  <h3 className={styles.cardTitle}>⚠️ Mantenimientos Atrasados ({mantenimientosVencidos.length})</h3>
                  <button className={styles.orderButton} onClick={() => setOrdenVencidos(ordenVencidos === 'asc' ? 'desc' : 'asc')}>
                    {ordenVencidos === 'asc' ? '📅 ↑' : '📅 ↓'}
                  </button>
                </div>
                <div className={styles.mantenimientosListScroll}>
                  {ordenarVencidos(mantenimientosVencidos).map(m => {
                    const prioridadClass = getPrioridadClass(m.prioridad);
                    return (
                      <div key={m.id} className={`${styles.mantenimientoItem} ${prioridadClass}`}>
                        <div className={styles.mantenimientoHeader}>
                          <span className={styles.mantenimientoTitulo}>{m.titulo}</span>
                          <span className={`${styles.prioridadBadge} ${prioridadClass}`}>{getPrioridadTexto(m.prioridad)}</span>
                        </div>
                        <div className={styles.mantenimientoInfo}>
                          <span>📅 Debía iniciar: {formatDate(m.fecha_inicio)}</span>
                        </div>
                        <div className={styles.mantenimientoActions}>
                          <button className={styles.completarButton} onClick={() => handleCompletarClick(m)}>✅ Completar</button>
                          <button className={styles.reprogramarButton} onClick={() => handleReprogramarClick(m)}>📅 Reprogramar</button>
                          <button className={styles.eliminarButton} onClick={() => handleEliminarMantenimiento(m)}>🗑️ Eliminar</button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            <div className={styles.card}>
              <div className={styles.cardHeaderWithSearch}>
                <h3 className={styles.cardTitle}>✅ Mantenimientos Completados ({mantenimientosCompletados.length})</h3>
                <div className={styles.searchControls}>
                  <select className={styles.filterSelect} value={filtroCompletadosPor} onChange={(e) => setFiltroCompletadosPor(e.target.value)}>
                    <option value="completado">Ordenar por fecha completado</option>
                    <option value="programado">Ordenar por fecha programado</option>
                  </select>
                  <button className={styles.orderButton} onClick={() => setOrdenCompletados(ordenCompletados === 'asc' ? 'desc' : 'asc')}>
                    {ordenCompletados === 'asc' ? '📅 ↑' : '📅 ↓'}
                  </button>
                  <div className={styles.searchContainer}>
                    <input type="text" className={styles.searchInputSmall} placeholder="Buscar por fecha o texto..." value={buscarEnCompletados} onChange={(e) => setBuscarEnCompletados(e.target.value)} />
                    {buscarEnCompletados && <button className={styles.clearSearchBtn} onClick={() => setBuscarEnCompletados('')}>✕</button>}
                  </div>
                </div>
              </div>
              <div className={styles.mantenimientosListScroll}>
                {ordenarCompletados(mantenimientosCompletadosFiltrados).map(m => {
                  const indicador = getMonthIndicator(m.fecha_completado || m.fecha_fin);
                  return (
                    <div key={m.id} className={`${styles.mantenimientoItem} ${styles.clickable} ${styles[indicador?.clase || '']}`} onClick={() => handleVerDetalleMantenimiento(m)}>
                      <div className={styles.mantenimientoHeader}>
                        <span className={styles.mantenimientoTitulo}>{m.titulo}</span>
                        {indicador && <span className={`${styles.indicadorMes} ${styles[indicador.clase]}`}>{indicador.texto}</span>}
                        <span className={styles.verDetalleBadge}>🔍 Ver detalles</span>
                      </div>
                      <div className={styles.mantenimientoInfo}>
                        <span>📅 Completado: {formatDateTime(m.fecha_completado || m.fecha_fin)}</span>
                        {m.completado_por && <span>👤 Por: {m.completado_por}</span>}
                        {m.duracion && <span>⏱️ Duración: {m.duracion} min</span>}
                        {m.costo_materiales && <span>💰 Costo: ${m.costo_materiales}</span>}
                      </div>
                      {m.notas_completado && (
                        <p className={styles.mantenimientoDesc}>
                          📝 {m.notas_completado.length > 100 ? m.notas_completado.substring(0, 100) + '...' : m.notas_completado}
                        </p>
                      )}
                      {m.materiales_usados && (
                        <p className={styles.materialesUsados}>🔧 Materiales: {m.materiales_usados}</p>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* Tab Incidencias - AHORA CON VER DETALLES */}
        {activeTab === 'incidencias' && (
          <div className={styles.incidenciasTab}>
            <div className={styles.card}>
              <h3 className={styles.cardTitle}>⚠️ Reporte de Incidencias</h3>
              {incidencias.length > 0 ? (
                <div className={styles.incidenciasList}>
                  {incidencias.map(i => (
                    <div key={i.id} className={`${styles.incidenciaItem} ${styles.clickable}`} onClick={() => handleVerDetalleIncidencia(i)}>
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
                      <div className={styles.verDetalleContainer}>
                        <span className={styles.verDetalleBadge}>🔍 Ver detalles</span>
                      </div>
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
                {equipo.foto_url && <a href={equipo.foto_url} target="_blank" rel="noopener noreferrer" className={styles.documentoLink}><span className={styles.documentoIcon}>🖼️</span><span>Ver Foto del Equipo</span></a>}
                {equipo.ficha_tecnica_url && <a href={equipo.ficha_tecnica_url} target="_blank" rel="noopener noreferrer" className={styles.documentoLink}><span className={styles.documentoIcon}>📑</span><span>Ficha Técnica</span></a>}
                {equipo.manual_url && <a href={equipo.manual_url} target="_blank" rel="noopener noreferrer" className={styles.documentoLink}><span className={styles.documentoIcon}>📘</span><span>Manual de Usuario</span></a>}
                {!equipo.foto_url && !equipo.ficha_tecnica_url && !equipo.manual_url && <p className={styles.emptyMessage}>No hay documentos cargados para este equipo</p>}
              </div>
            </div>
          </div>
        )}

        {/* Tab Historial - AHORA CON VER DETALLES */}
        {activeTab === 'historial' && (
          <div className={styles.historialTab}>
            <div className={styles.card}>
              <h3 className={styles.cardTitle}>📜 Historial de Cambios</h3>
              {historial.length > 0 ? (
                <div className={styles.historialList}>
                  {historial.map(h => (
                    <div key={h.id} className={`${styles.historialItem} ${styles.clickable}`} onClick={() => handleVerDetalleHistorial(h)}>
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
                      <div className={styles.verDetalleContainer}>
                        <span className={styles.verDetalleBadge}>🔍 Ver detalles</span>
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

      {/* MODALES */}
      <AddEquipmentModal isOpen={showEditModal} onClose={() => setShowEditModal(false)} onSuccess={handleEditSuccess} editMode={true} equipoData={equipo} />
      <AddMantenimientoModal isOpen={showMantModal} onClose={() => setShowMantModal(false)} onSuccess={cargarDatos} equipoId={equipo.id} />
      <AddHistorialModal isOpen={showHistorialModal} onClose={() => setShowHistorialModal(false)} onSuccess={cargarDatos} equipoId={equipo.id} />
      <AddIncidenciaModal isOpen={showIncidenciaModal} onClose={() => setShowIncidenciaModal(false)} onSuccess={cargarDatos} equipoId={equipo.id} />
      
      <CompletarMantenimientoModal isOpen={showCompletarModal} onClose={() => setShowCompletarModal(false)} onSuccess={handleCompletarSuccess} mantenimiento={mantenimientoACompletar} equipoNombre={equipo?.nombre} />
      
      <DetalleMantenimientoModal isOpen={showDetalleModal} onClose={() => setShowDetalleModal(false)} mantenimiento={mantenimientoSeleccionado} equipoNombre={equipo?.nombre} onEdit={cargarDatos} />
      
      <DetalleIncidenciaModal isOpen={showDetalleIncidenciaModal} onClose={() => setShowDetalleIncidenciaModal(false)} incidencia={incidenciaSeleccionada} equipoNombre={equipo?.nombre} />
      
      <DetalleHistorialModal isOpen={showDetalleHistorialModal} onClose={() => setShowDetalleHistorialModal(false)} historialItem={historialSeleccionado} equipoNombre={equipo?.nombre} />
      
      <ReprogramarModal isOpen={showReprogramarModal} onClose={() => setShowReprogramarModal(false)} onSuccess={handleReprogramarSuccess} mantenimiento={mantenimientoAReprogramar} />

      {/* Modal para clave preventiva */}
      {showClaveModal && (
        <div className={styles.modalOverlay} onClick={() => setShowClaveModal(false)}>
          <div className={styles.confirmModal} onClick={(e) => e.stopPropagation()}>
            <div className={styles.confirmModalHeader}>
              <span className={styles.confirmIcon}>🔐</span>
              <h3>Clave de Autorización</h3>
            </div>
            <div className={styles.confirmModalBody}>
              <p>Este es un mantenimiento <strong>preventivo</strong> programado para el futuro.</p>
              <p>Para <strong>{claveModalData.accion === 'completar' ? 'completarlo' : 'reprogramarlo'}</strong>, ingresa la clave de autorización:</p>
              {claveError && <p className={styles.claveError}>{claveError}</p>}
              <input type="password" className={styles.claveInput} value={clavePreventiva} onChange={(e) => setClavePreventiva(e.target.value)} placeholder="Ingrese clave" autoFocus onKeyPress={(e) => e.key === 'Enter' && verificarClave()} />
            </div>
            <div className={styles.confirmModalFooter}>
              <button className={styles.cancelConfirmBtn} onClick={() => setShowClaveModal(false)}>Cancelar</button>
              <button className={styles.confirmDeleteBtn} onClick={verificarClave}>Verificar</button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de confirmación de eliminación del equipo */}
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
              <button className={styles.cancelConfirmBtn} onClick={() => setShowDeleteConfirm(false)}>Cancelar</button>
              <button className={styles.confirmDeleteBtn} onClick={handleConfirmDelete}>Sí, Eliminar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}