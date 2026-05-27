// FRONTEND/src/components/mantenimiento/OrdenCard.jsx
import { useNavigate } from 'react-router-dom';
import styles from './OrdenCard.module.css';

export default function OrdenCard({ orden, onGeneratePDF }) {
  const navigate = useNavigate();

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

  const getEstadoClass = () => {
    if (orden.estado === 'completado') return styles.estadoCompletado;
    const hoy = new Date().toISOString().split('T')[0];
    if (orden.fecha_inicio < hoy) return styles.estadoAtrasado;
    return styles.estadoPendiente;
  };

  const getEstadoTexto = () => {
    if (orden.estado === 'completado') return '✅ Completado';
    const hoy = new Date().toISOString().split('T')[0];
    if (orden.fecha_inicio < hoy) return '⚠️ Atrasado';
    return '🟡 Pendiente';
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Fecha no disponible';
    const date = new Date(dateString);
    return date.toLocaleDateString('es-MX');
  };

  const handleClick = () => {
    navigate(`/mantenimiento/equipo/${orden.equipo_id}`);
  };

  const handleVerDetalle = (e) => {
    e.stopPropagation();
    // Podrías abrir un modal con más detalles
    console.log('Ver detalle de orden:', orden.id);
  };

  const handleGeneratePDF = (e) => {
    e.stopPropagation();
    if (onGeneratePDF) onGeneratePDF(orden);
  };

  return (
    <div className={`${styles.ordenCard} ${getEstadoClass()}`} onClick={handleClick}>
      <div className={styles.cardHeader}>
        <div className={styles.headerLeft}>
          <span className={styles.ordenId}>#ORD-{orden.id}</span>
          <span className={`${styles.prioridadBadge} ${getPrioridadClass(orden.prioridad)}`}>
            {getPrioridadTexto(orden.prioridad)}
          </span>
          <span className={`${styles.estadoBadge} ${getEstadoClass()}`}>
            {getEstadoTexto()}
          </span>
        </div>
        <div className={styles.headerRight}>
          <button className={styles.pdfBtn} onClick={handleGeneratePDF} title="Generar PDF">
            📄 PDF
          </button>
          <button className={styles.detalleBtn} onClick={handleVerDetalle}>
            🔍 Ver detalles
          </button>
        </div>
      </div>

      <div className={styles.cardBody}>
        <div className={styles.equipoInfo}>
          <div className={styles.equipoFoto}>
            {orden.equipo_foto_url ? (
              <img src={orden.equipo_foto_url} alt={orden.equipo_nombre} />
            ) : (
              <span>🔧</span>
            )}
          </div>
          <div className={styles.equipoDetalles}>
            <h4 className={styles.equipoNombre}>{orden.equipo_nombre}</h4>
            <p className={styles.equipoUbicacion}>📍 {orden.equipo_ubicacion || 'Sin ubicación'}</p>
          </div>
        </div>

        <div className={styles.ordenInfo}>
          <h3 className={styles.ordenTitulo}>{orden.titulo}</h3>
          {orden.descripcion && (
            <p className={styles.ordenDescripcion}>
              {orden.descripcion.length > 100 ? orden.descripcion.substring(0, 100) + '...' : orden.descripcion}
            </p>
          )}
          <div className={styles.fechasInfo}>
            <span>📅 Inicio: {formatDate(orden.fecha_inicio)}</span>
            {orden.fecha_fin && <span>🔚 Fin: {formatDate(orden.fecha_fin)}</span>}
            {orden.fecha_completado && <span>✅ Completado: {formatDate(orden.fecha_completado)}</span>}
          </div>
          {orden.completado_por && (
            <div className={styles.tecnicoInfo}>
              👤 Técnico: {orden.completado_por}
            </div>
          )}
          {orden.materiales_usados && (
            <div className={styles.materialesInfo}>
              🔧 Materiales: {orden.materiales_usados}
            </div>
          )}
        </div>
      </div>

      <div className={styles.cardFooter}>
        <span className={styles.tipoTag}>
          {orden.tipo === 'preventivo' ? '🔧 Preventivo' : orden.tipo === 'correctivo' ? '🛠️ Correctivo' : '📋 Rutina'}
        </span>
        {orden.costo_materiales > 0 && (
          <span className={styles.costoTag}>💰 Costo: ${orden.costo_materiales}</span>
        )}
        {orden.duracion && (
          <span className={styles.duracionTag}>⏱️ Duración: {orden.duracion} min</span>
        )}
      </div>
    </div>
  );
}