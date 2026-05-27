// FRONTEND/src/pages/Mantenimiento/Papelera.jsx
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { papeleraAPI } from '../../api/papelera';
import styles from './styles/Papelera.module.css';

export default function Papelera() {
  const [equipos, setEquipos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedEquipos, setSelectedEquipos] = useState(new Set());

  const cargarEquipos = async () => {
    setLoading(true);
    try {
      const data = await papeleraAPI.getEquipos();
      console.log('📦 Equipos en papelera:', data);
      setEquipos(data);
    } catch (err) {
      setError('Error cargando equipos en papelera');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarEquipos();
  }, []);

  const handleRestaurar = async (id) => {
    try {
      await papeleraAPI.restaurarEquipo(id);
      await cargarEquipos();
      setSelectedEquipos(new Set());
    } catch (err) {
      setError('Error al restaurar el equipo');
    }
  };

  const handleEliminarPermanente = async (id) => {
    if (window.confirm('¿Eliminar este equipo permanentemente? Esta acción no se puede deshacer.')) {
      try {
        await papeleraAPI.eliminarPermanentemente(id);
        await cargarEquipos();
        setSelectedEquipos(new Set());
      } catch (err) {
        setError('Error al eliminar el equipo');
      }
    }
  };

  const handleVaciarPapelera = async () => {
    if (window.confirm('¿Estás seguro de vaciar la papelera? Esta acción no se puede deshacer.')) {
      try {
        await papeleraAPI.vaciarPapelera();
        await cargarEquipos();
        setSelectedEquipos(new Set());
      } catch (err) {
        setError('Error al vaciar la papelera');
      }
    }
  };

  const handleSelectEquipo = (id) => {
    setSelectedEquipos(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  const handleSelectAll = () => {
    if (selectedEquipos.size === equipos.length) {
      setSelectedEquipos(new Set());
    } else {
      setSelectedEquipos(new Set(equipos.map(e => e.id)));
    }
  };

  const handleRestaurarSeleccionados = async () => {
    if (selectedEquipos.size === 0) return;
    for (const id of selectedEquipos) {
      await papeleraAPI.restaurarEquipo(id);
    }
    await cargarEquipos();
    setSelectedEquipos(new Set());
  };

  const handleEliminarSeleccionados = async () => {
    if (selectedEquipos.size === 0) return;
    if (window.confirm(`¿Eliminar permanentemente ${selectedEquipos.size} equipo(s)?`)) {
      for (const id of selectedEquipos) {
        await papeleraAPI.eliminarPermanentemente(id);
      }
      await cargarEquipos();
      setSelectedEquipos(new Set());
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Fecha desconocida';
    const date = new Date(dateString);
    return date.toLocaleDateString('es-MX');
  };

  if (loading) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.loadingSpinner}></div>
        <p>Cargando equipos en papelera...</p>
      </div>
    );
  }

  return (
    <div className={styles.papelera}>
      <div className={styles.header}>
        <div className={styles.titleSection}>
          <h1 className={styles.title}>🗑️ Papelera</h1>
          <p className={styles.subtitle}>Equipos eliminados y registros históricos</p>
        </div>
        <div className={styles.navTabs}>
          <Link to="/mantenimiento/equipos" className={styles.tab}>
            📋 Equipos
          </Link>
          <Link to="/mantenimiento/ordenes" className={styles.tab}>
            📝 Órdenes de Trabajo
          </Link>
          <Link to="/mantenimiento/papelera" className={`${styles.tab} ${styles.active}`}>
            🗑️ Papelera
          </Link>
        </div>
      </div>

      {error && (
        <div className={styles.errorMessage}>
          <span>⚠️</span> {error}
          <button onClick={() => setError('')}>✕</button>
        </div>
      )}

      <div className={styles.toolbar}>
        <div className={styles.selectionInfo}>
          {selectedEquipos.size > 0 && (
            <span>✅ {selectedEquipos.size} equipo(s) seleccionado(s)</span>
          )}
        </div>
        <div className={styles.actions}>
          <button 
            className={styles.selectAllBtn}
            onClick={handleSelectAll}
            disabled={equipos.length === 0}
          >
            {selectedEquipos.size === equipos.length && equipos.length > 0 ? '☑️ Deseleccionar' : '☑️ Seleccionar'}
          </button>
          <button 
            className={styles.restaurarBtn}
            onClick={handleRestaurarSeleccionados}
            disabled={selectedEquipos.size === 0}
          >
            🔄 Restaurar seleccionados
          </button>
          <button 
            className={styles.deletePermBtn}
            onClick={handleEliminarSeleccionados}
            disabled={selectedEquipos.size === 0}
          >
            🗑️ Eliminar seleccionados
          </button>
          <button 
            className={styles.vaciarBtn}
            onClick={handleVaciarPapelera}
            disabled={equipos.length === 0}
          >
            🧹 Vaciar papelera
          </button>
        </div>
      </div>

      {equipos.length === 0 ? (
        <div className={styles.emptyState}>
          <span className={styles.emptyIcon}>🗑️</span>
          <h3>La papelera está vacía</h3>
          <p>Los equipos que elimines aparecerán aquí</p>
          <Link to="/mantenimiento/equipos" className={styles.backButton}>
            ← Volver a Equipos
          </Link>
        </div>
      ) : (
        <div className={styles.equiposGrid}>
          {equipos.map(equipo => (
            <div key={equipo.id} className={styles.equipoCard}>
              <div className={styles.checkboxContainer}>
                <input
                  type="checkbox"
                  checked={selectedEquipos.has(equipo.id)}
                  onChange={() => handleSelectEquipo(equipo.id)}
                />
              </div>
              
              <div className={styles.cardContent}>
                <div className={styles.fotoContainer}>
                  {equipo.foto_url ? (
                    <img src={equipo.foto_url} alt={equipo.nombre} />
                  ) : (
                    <div className={styles.fotoPlaceholder}>🔧</div>
                  )}
                </div>
                
                <div className={styles.infoContainer}>
                  <h3 className={styles.equipoNombre}>{equipo.nombre}</h3>
                  <p className={styles.equipoUbicacion}>📍 {equipo.ubicacion || 'Sin ubicación'}</p>
                  <div className={styles.categoriasContainer}>
                    {equipo.categorias?.slice(0, 3).map(cat => (
                      <span key={cat.id} className={styles.categoriaTag} style={{ borderColor: cat.color || '#00ff9d' }}>
                        {cat.nombre}
                      </span>
                    ))}
                  </div>
                  <div className={styles.statsContainer}>
                    <span>🔧 {equipo.total_mantenimientos || 0} mantenimientos</span>
                    <span>⚠️ {equipo.total_incidencias || 0} incidencias</span>
                    <span>📅 Eliminado: {formatDate(equipo.fecha_actualizacion)}</span>
                  </div>
                </div>
                
                <div className={styles.actionsContainer}>
                  <button 
                    className={styles.restaurarBtn}
                    onClick={() => handleRestaurar(equipo.id)}
                    title="Restaurar equipo"
                  >
                    🔄 Restaurar
                  </button>
                  <button 
                    className={styles.deleteBtn}
                    onClick={() => handleEliminarPermanente(equipo.id)}
                    title="Eliminar permanentemente"
                  >
                    🗑️ Eliminar
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}