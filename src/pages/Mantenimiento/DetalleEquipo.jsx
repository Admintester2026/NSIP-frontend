import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { mantenimientoAPI } from '../../api/mantenimiento';
import { useAsync } from '../../hooks/useAsync';
import styles from './styles/DetalleEquipo.module.css';

export default function DetalleEquipo() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [equipo, setEquipo] = useState(null);
  const [activeTab, setActiveTab] = useState('info');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Cargar datos del equipo
  const { data, loading: loadingEquipo, error: errorEquipo, execute: loadEquipo } = useAsync(
    () => mantenimientoAPI.getEquipoById(id)
  );

  useEffect(() => {
    if (data) {
      setEquipo(data);
      setLoading(false);
    }
  }, [data]);

  useEffect(() => {
    if (errorEquipo) {
      setError('Error al cargar el equipo');
      setLoading(false);
    }
  }, [errorEquipo]);

  const handleDelete = async () => {
    if (window.confirm(`Â¿EstÃ¡s seguro de eliminar "${equipo?.nombre}"?`)) {
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
      case 'daÃ±ado': return styles.estadoDanado;
      case 'suspension': return styles.estadoSuspension;
      case 'baja': return styles.estadoBaja;
      default: return '';
    }
  };

  const getEstadoTexto = () => {
    switch (equipo?.estado) {
      case 'activo': return 'Activo';
      case 'daÃ±ado': return 'DaÃ±ado';
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
        <span className={styles.errorIcon}>âš ï¸</span>
        <h2>Error al cargar el equipo</h2>
        <p>{error || 'El equipo no existe o ha sido eliminado'}</p>
        <Link to="/mantenimiento/equipos" className={styles.backButton}>
          â† Volver a Equipos
        </Link>
      </div>
    );
  }

  return (
    <div className={styles.detalle}>
      <div className={styles.header}>
        <Link to="/mantenimiento/equipos" className={styles.backLink}>
          â† Volver a Equipos
        </Link>
        <div className={styles.headerActions}>
          <button className={styles.editButton} onClick={() => setActiveTab('editar')}>
            âœï¸ Editar
          </button>
          <button className={styles.deleteButton} onClick={handleDelete}>
            ðŸ—‘ï¸ Eliminar
          </button>
        </div>
      </div>

      <div className={styles.content}>
        {/* InformaciÃ³n bÃ¡sica */}
        <div className={styles.infoCard}>
          <div className={styles.infoHeader}>
            <div className={styles.iconContainer}>
              <span className={styles.icon}>ðŸ”§</span>
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
              <span className={styles.infoLabel}>ðŸ“ UbicaciÃ³n:</span>
              <span className={styles.infoValue}>{equipo.ubicacion}</span>
            </div>
          )}

          {equipo.descripcion && (
            <div className={styles.infoRow}>
              <span className={styles.infoLabel}>ðŸ“ DescripciÃ³n:</span>
              <span className={styles.infoValue}>{equipo.descripcion}</span>
            </div>
          )}

          <div className={styles.infoRow}>
            <span className={styles.infoLabel}>ðŸ“… Registrado:</span>
            <span className={styles.infoValue}>
              {new Date(equipo.fecha_registro).toLocaleString()}
            </span>
          </div>

          {equipo.categorias?.length > 0 && (
            <div className={styles.categorias}>
              <span className={styles.infoLabel}>ðŸ·ï¸ CategorÃ­as:</span>
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

        {/* Archivos */}
        {(equipo.foto_url || equipo.ficha_tecnica_url || equipo.manual_url) && (
          <div className={styles.filesCard}>
            <h3 className={styles.sectionTitle}>Archivos</h3>
            <div className={styles.filesGrid}>
              {equipo.foto_url && (
                <a href={equipo.foto_url} target="_blank" rel="noopener noreferrer" className={styles.fileLink}>
                  <span className={styles.fileIcon}>ðŸ“·</span>
                  <span>Ver foto</span>
                </a>
              )}
              {equipo.ficha_tecnica_url && (
                <a href={equipo.ficha_tecnica_url} target="_blank" rel="noopener noreferrer" className={styles.fileLink}>
                  <span className={styles.fileIcon}>ðŸ“„</span>
                  <span>Ficha tÃ©cnica</span>
                </a>
              )}
              {equipo.manual_url && (
                <a href={equipo.manual_url} target="_blank" rel="noopener noreferrer" className={styles.fileLink}>
                  <span className={styles.fileIcon}>ðŸ“˜</span>
                  <span>Manual de usuario</span>
                </a>
              )}
            </div>
          </div>
        )}

        {/* Tabs */}
        <div className={styles.tabsContainer}>
          <div className={styles.tabs}>
            <button
              className={`${styles.tab} ${activeTab === 'info' ? styles.active : ''}`}
              onClick={() => setActiveTab('info')}
            >
              â„¹ï¸ InformaciÃ³n
            </button>
            <button
              className={`${styles.tab} ${activeTab === 'mantenimientos' ? styles.active : ''}`}
              onClick={() => setActiveTab('mantenimientos')}
            >
              ðŸ”§ Mantenimientos
            </button>
            <button
              className={`${styles.tab} ${activeTab === 'historial' ? styles.active : ''}`}
              onClick={() => setActiveTab('historial')}
            >
              ðŸ“œ Historial
            </button>
            <button
              className={`${styles.tab} ${activeTab === 'incidencias' ? styles.active : ''}`}
              onClick={() => setActiveTab('incidencias')}
            >
              âš ï¸ Incidencias
            </button>
          </div>

          <div className={styles.tabContent}>
            {activeTab === 'info' && (
              <div className={styles.infoTab}>
                <div className={styles.placeholderCard}>
                  <p className={styles.placeholderText}>
                    InformaciÃ³n detallada del equipo. PrÃ³ximamente:
                  </p>
                  <ul className={styles.placeholderList}>
                    <li>Especificaciones tÃ©cnicas</li>
                    <li>Historial de cambios</li>
                    <li>ConfiguraciÃ³n actual</li>
                    <li>DocumentaciÃ³n asociada</li>
                  </ul>
                </div>
              </div>
            )}

            {activeTab === 'mantenimientos' && (
              <div className={styles.placeholderCard}>
                <p className={styles.placeholderText}>
                  GestiÃ³n de mantenimientos. PrÃ³ximamente:
                </p>
                <ul className={styles.placeholderList}>
                  <li>Mantenimientos programados</li>
                  <li>Mantenimientos realizados</li>
                  <li>PrÃ³ximos mantenimientos</li>
                  <li>Calendario de rutinas</li>
                </ul>
              </div>
            )}

            {activeTab === 'historial' && (
              <div className={styles.placeholderCard}>
                <p className={styles.placeholderText}>
                  Historial de cambios. PrÃ³ximamente:
                </p>
                <ul className={styles.placeholderList}>
                  <li>Cambios en configuraciÃ³n</li>
                  <li>Reemplazo de piezas</li>
                  <li>Actualizaciones</li>
                  <li>Registro de operadores</li>
                </ul>
              </div>
            )}

            {activeTab === 'incidencias' && (
              <div className={styles.placeholderCard}>
                <p className={styles.placeholderText}>
                  Registro de incidencias. PrÃ³ximamente:
                </p>
                <ul className={styles.placeholderList}>
                  <li>Reporte de fallas</li>
                  <li>DaÃ±os registrados</li>
                  <li>Soluciones aplicadas</li>
                  <li>Costos asociados</li>
                </ul>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
