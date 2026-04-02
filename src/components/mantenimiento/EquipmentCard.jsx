import { Link } from 'react-router-dom';
import { useState } from 'react';
import styles from './EquipmentCard.module.css';

export default function EquipmentCard({ 
  equipo, 
  onEdit, 
  ultimoMantenimiento = null, 
  proximoMantenimiento = null 
}) {
  const [imageError, setImageError] = useState(false);

  const getEstadoClass = () => {
    switch (equipo.estado) {
      case 'activo': return styles.estadoActivo;
      case 'dañado': return styles.estadoDanado;
      case 'suspension': return styles.estadoSuspension;
      case 'baja': return styles.estadoBaja;
      default: return '';
    }
  };

  const getEstadoTexto = () => {
    switch (equipo.estado) {
      case 'activo': return 'Activo';
      case 'dañado': return 'Dañado';
      case 'suspension': return 'Suspendido';
      case 'baja': return 'Dado de Baja';
      default: return equipo.estado || 'Desconocido';
    }
  };

  const getEstadoIcon = () => {
    switch (equipo.estado) {
      case 'activo': return '✅';
      case 'dañado': return '⚠️';
      case 'suspension': return '⏸️';
      case 'baja': return '❌';
      default: return '🔧';
    }
  };

  const categoriasList = equipo.categorias || [];
  const categoriasMostrar = categoriasList.slice(0, 3);
  const tieneMas = categoriasList.length > 3;

  // Formatear fecha
  const formatDate = (dateString) => {
    if (!dateString) return null;
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return null;
    return date.toLocaleDateString('es-MX', { 
      day: '2-digit', 
      month: 'short', 
      year: 'numeric' 
    });
  };

  const handleEditClick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (onEdit) onEdit(equipo);
  };

  // Obtener fecha del último mantenimiento
  const ultimoMantFecha = ultimoMantenimiento?.fecha || ultimoMantenimiento;
  const proximoMantFecha = proximoMantenimiento?.fecha || proximoMantenimiento;

  return (
    <div className={styles.cardWrapper}>
      <Link to={`/mantenimiento/equipo/${equipo.id}`} className={styles.card}>
        {/* Botón de edición rápida */}
        <button className={styles.editButton} onClick={handleEditClick} title="Editar equipo">
          ✏️
        </button>

        <div className={styles.cardHeader}>
          <div className={styles.iconContainer}>
            <span className={styles.icon}>{getEstadoIcon()}</span>
          </div>
          <div className={`${styles.estadoBadge} ${getEstadoClass()}`}>
            {getEstadoTexto()}
          </div>
        </div>

        <h3 className={styles.nombre} title={equipo.nombre}>
          {equipo.nombre}
        </h3>

        {/* Foto del equipo */}
        {equipo.foto_url && !imageError && (
          <div className={styles.fotoContainer}>
            <img 
              src={equipo.foto_url} 
              alt={equipo.nombre}
              className={styles.foto}
              onError={() => setImageError(true)}
              loading="lazy"
            />
          </div>
        )}

        {equipo.ubicacion && (
          <div className={styles.ubicacion}>
            <span className={styles.ubicacionIcon}>📍</span>
            <span title={equipo.ubicacion}>{equipo.ubicacion}</span>
          </div>
        )}

        {/* Información de mantenimientos */}
        <div className={styles.mantenimientoInfo}>
          {ultimoMantFecha && (
            <div className={styles.ultimoMant}>
              <span className={styles.mantIcon}>🔧</span>
              <span>Último: {formatDate(ultimoMantFecha)}</span>
            </div>
          )}
          {proximoMantFecha && (
            <div className={styles.proximoMant}>
              <span className={styles.mantIcon}>⏰</span>
              <span>Próximo: {formatDate(proximoMantFecha)}</span>
            </div>
          )}
        </div>

        {/* Categorías */}
        {categoriasMostrar.length > 0 && (
          <div className={styles.categorias}>
            {categoriasMostrar.map((cat, idx) => (
              <span 
                key={idx} 
                className={styles.categoriaTag}
                style={{ 
                  borderColor: cat.color || 'var(--border-dim)',
                  backgroundColor: `${cat.color || '#00ff9d'}10`
                }}
              >
                <span 
                  className={styles.categoriaDot} 
                  style={{ backgroundColor: cat.color || '#00ff9d' }}
                />
                {typeof cat === 'object' ? cat.nombre : cat}
              </span>
            ))}
            {tieneMas && (
              <span className={styles.categoriaTagMas}>
                +{categoriasList.length - 3}
              </span>
            )}
          </div>
        )}

        <div className={styles.cardFooter}>
          <span className={styles.fecha}>
            📅 {formatDate(equipo.fecha_registro) || 'Fecha desconocida'}
          </span>
          <span className={styles.verDetalle}>
            Ver detalles →
          </span>
        </div>
      </Link>
    </div>
  );
}