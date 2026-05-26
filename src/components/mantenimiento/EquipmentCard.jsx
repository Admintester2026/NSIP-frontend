import { Link } from 'react-router-dom';
import { useState } from 'react';
import styles from './EquipmentCard.module.css';

export default function EquipmentCard({ 
  equipo, 
  isSelected,
  onSelect,
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

  const formatDate = (dateString) => {
    console.log('📅 [EquipmentCard] Formateando fecha:', dateString, 'tipo:', typeof dateString);
    
    if (!dateString) {
      console.log('⚠️ [EquipmentCard] fecha_registro es null o undefined');
      return null;
    }
    
    // Si ya es un objeto Date
    if (dateString instanceof Date) {
      if (isNaN(dateString.getTime())) {
        console.log('❌ [EquipmentCard] Fecha inválida (Date object)');
        return null;
      }
      const formatted = dateString.toLocaleDateString('es-MX', { 
        day: '2-digit', 
        month: 'short', 
        year: 'numeric' 
      });
      console.log('✅ [EquipmentCard] Fecha formateada (Date):', formatted);
      return formatted;
    }
    
    // Si es string, intentar parsear
    let fecha = new Date(dateString);
    
    // Si falla, intentar parsear formato YYYY-MM-DD
    if (isNaN(fecha.getTime()) && typeof dateString === 'string' && dateString.includes('-')) {
      const parts = dateString.split('-');
      if (parts.length === 3) {
        // Formato: YYYY-MM-DD
        fecha = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
        console.log('📅 [EquipmentCard] Parseando fecha manual:', parts, '->', fecha);
      }
    }
    
    if (isNaN(fecha.getTime())) {
      console.log('❌ [EquipmentCard] Fecha inválida después de parsear:', dateString);
      return null;
    }
    
    const formatted = fecha.toLocaleDateString('es-MX', { 
      day: '2-digit', 
      month: 'short', 
      year: 'numeric' 
    });
    console.log('✅ [EquipmentCard] Fecha formateada:', formatted);
    return formatted;
  };

  const handleSelectClick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (onSelect) onSelect(equipo.id);
  };

  const ultimoMantFecha = ultimoMantenimiento?.fecha || ultimoMantenimiento;
  const proximoMantFecha = proximoMantenimiento?.fecha || proximoMantenimiento;
  
  // Log para ver qué está llegando
  console.log('🔍 [EquipmentCard] Datos del equipo:', {
    id: equipo.id,
    nombre: equipo.nombre,
    fecha_registro_raw: equipo.fecha_registro,
    fecha_registro_type: typeof equipo.fecha_registro,
    fecha_registro_value: equipo.fecha_registro
  });

  const fechaFormateada = formatDate(equipo.fecha_registro);
  const fechaMostrar = fechaFormateada || 'Fecha desconocida';

  return (
    <div className={`${styles.cardWrapper} ${isSelected ? styles.selected : ''}`}>
      <Link to={`/mantenimiento/equipo/${equipo.id}`} className={styles.card}>
        {/* Checkbox de selección */}
        <div className={styles.checkboxContainer} onClick={handleSelectClick}>
          <div className={`${styles.checkbox} ${isSelected ? styles.checked : ''}`}>
            {isSelected && <span className={styles.checkmark}>✓</span>}
          </div>
        </div>

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
            📅 {fechaMostrar}
          </span>
          <span className={styles.verDetalle}>
            Ver detalles →
          </span>
        </div>
      </Link>
    </div>
  );
}