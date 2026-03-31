import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { mantenimientoAPI } from '../../api/mantenimiento';
import { usePolling } from '../../hooks/useAsync';
import styles from './styles/DetalleEquipo.module.css';

export default function DetalleEquipo() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [equipo, setEquipo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchEquipo = async () => {
    try {
      const data = await mantenimientoAPI.getEquipoById(id);
      setEquipo(data);
      setLoading(false);
    } catch (err) {
      setError('Error al cargar el equipo');
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEquipo();
  }, [id]);

  const handleDelete = async () => {
    if (window.confirm(`¿Estás seguro de eliminar "${equipo?.nombre}"?`)) {
      try {
        await mantenimientoAPI.deleteEquipo(id);
        navigate('/mantenimiento/equipos');
      } catch (err) {
        setError('Error al eliminar el equipo');
      }
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
      default: return equipo?.estado;
    }
  };

  if (loading) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.loadingSpinner}></div>
        <p>Cargando equipo...</p>
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
    <div className={styles.detalle}>
      <div className={styles.header}>
        <Link to="/mantenimiento/equipos" className={styles.backLink}>
          ← Volver a Equipos
        </Link>
        <div className={styles.headerActions}>
          <button className={styles.deleteButton} onClick={handleDelete}>
            🗑️ Eliminar
          </button>
        </div>
      </div>

      <div className={styles.content}>
        <div className={styles.infoCard}>
          <div className={styles.infoHeader}>
            <div className={styles.iconContainer}>
              <span className={styles.icon}>🔧</span>
            </div>
            <div>
              <h1 className={styles.nombre}>{equipo.nombre}</h1>
              <div className={`${styles.estadoBadge} ${getEstadoClass()}`}>
                {getEstadoTexto()}
              </div>
            </div>
          </div>

          {equipo.ubicacion && (
            <div className={styles.infoRow}>
              <span className={styles.infoLabel}>📍 Ubicación:</span>
              <span className={styles.infoValue}>{equipo.ubicacion}</span>
            </div>
          )}

          {equipo.descripcion && (
            <div className={styles.infoRow}>
              <span className={styles.infoLabel}>📝 Descripción:</span>
              <span className={styles.infoValue}>{equipo.descripcion}</span>
            </div>
          )}

          <div className={styles.infoRow}>
            <span className={styles.infoLabel}>📅 Registrado:</span>
            <span className={styles.infoValue}>
              {new Date(equipo.fecha_registro).toLocaleString()}
            </span>
          </div>

          {equipo.categorias?.length > 0 && (
            <div className={styles.categorias}>
              <span className={styles.infoLabel}>🏷️ Categorías:</span>
              <div className={styles.categoriasList}>
                {equipo.categorias.map((cat, idx) => (
                  <span key={idx} className={styles.categoriaTag}>
                    {typeof cat === 'object' ? cat.nombre : cat}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}