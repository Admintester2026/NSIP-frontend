import { Link } from 'react-router-dom';
import styles from './EquipmentCard.module.css';

export default function EquipmentCard({ equipo }) {
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
      default: return equipo.estado;
    }
  };

  const categoriasList = equipo.categorias || [];
  const categoriasMostrar = categoriasList.slice(0, 2);
  const tieneMas = categoriasList.length > 2;

  return (
    <Link to={`/mantenimiento/equipo/${equipo.id}`} className={styles.card}>
      <div className={styles.cardHeader}>
        <div className={styles.iconContainer}>
          <span className={styles.icon}>🔧</span>
        </div>
        <div className={`${styles.estadoBadge} ${getEstadoClass()}`}>
          {getEstadoTexto()}
        </div>
      </div>

      <h3 className={styles.nombre}>{equipo.nombre}</h3>

      {equipo.ubicacion && (
        <div className={styles.ubicacion}>
          <span className={styles.ubicacionIcon}>📍</span>
          <span>{equipo.ubicacion}</span>
        </div>
      )}

      {categoriasMostrar.length > 0 && (
        <div className={styles.categorias}>
          {categoriasMostrar.map((cat, idx) => (
            <span key={idx} className={styles.categoriaTag}>
              {typeof cat === 'object' ? cat.nombre : cat}
            </span>
          ))}
          {tieneMas && (
            <span className={styles.categoriaTag}>+{categoriasList.length - 2}</span>
          )}
        </div>
      )}

      <div className={styles.cardFooter}>
        <span className={styles.fecha}>
          Registrado: {new Date(equipo.fecha_registro).toLocaleDateString()}
        </span>
        <span className={styles.verDetalle}>Ver detalles →</span>
      </div>
    </Link>
  );
}