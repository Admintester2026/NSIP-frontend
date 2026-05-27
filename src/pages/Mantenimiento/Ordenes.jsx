// FRONTEND/src/pages/Mantenimiento/Ordenes.jsx
import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { ordenesAPI } from '../../api/ordenes';
import { mantenimientoAPI } from '../../api/mantenimiento';
import OrdenCard from '../../components/mantenimiento/OrdenCard';
import FiltrosOrdenes from '../../components/mantenimiento/FiltrosOrdenes';
import GenerarPDFModal from '../../components/mantenimiento/GenerarPDFModal';
import styles from './styles/Ordenes.module.css';

export default function Ordenes() {
  const [ordenes, setOrdenes] = useState([]);
  const [filteredOrdenes, setFilteredOrdenes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [estadisticas, setEstadisticas] = useState({ pendientes: 0, completados: 0, atrasados: 0, proximos: 0 });
  const [filtros, setFiltros] = useState({
    estado: 'todos',
    equipo_id: null,
    fecha_desde: '',
    fecha_hasta: '',
    busqueda: '',
    incluir_papelera: false
  });
  const [ordenSeleccionada, setOrdenSeleccionada] = useState(null);
  const [equipoSeleccionado, setEquipoSeleccionado] = useState(null);
  const [showPDFModal, setShowPDFModal] = useState(false);

  const cargarDatos = useCallback(async () => {
    setLoading(true);
    try {
      const [ordenesData, statsData] = await Promise.all([
        ordenesAPI.getOrdenes(filtros),
        ordenesAPI.getEstadisticas()
      ]);
      setOrdenes(ordenesData);
      setFilteredOrdenes(ordenesData);
      setEstadisticas(statsData);
    } catch (err) {
      setError('Error cargando órdenes de trabajo');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [filtros]);

  useEffect(() => {
    cargarDatos();
  }, [cargarDatos]);

  const handleFilterChange = (nuevosFiltros) => {
    setFiltros(nuevosFiltros);
  };

  const handleResetFilters = () => {
    setFiltros({
      estado: 'todos',
      equipo_id: null,
      fecha_desde: '',
      fecha_hasta: '',
      busqueda: '',
      incluir_papelera: false
    });
  };

  const handleGeneratePDF = async (orden) => {
    try {
      const equipo = await mantenimientoAPI.getEquipoById(orden.equipo_id);
      setOrdenSeleccionada(orden);
      setEquipoSeleccionado(equipo);
      setShowPDFModal(true);
    } catch (err) {
      console.error('Error cargando equipo para PDF:', err);
    }
  };

  const ordenesAtrasados = filteredOrdenes.filter(o => o.estado === 'pendiente' && o.fecha_inicio < new Date().toISOString().split('T')[0]);
  const ordenesProximos = filteredOrdenes.filter(o => o.estado === 'pendiente' && o.fecha_inicio >= new Date().toISOString().split('T')[0]);
  const ordenesCompletados = filteredOrdenes.filter(o => o.estado === 'completado');

  if (loading) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.loadingSpinner}></div>
        <p>Cargando órdenes de trabajo...</p>
      </div>
    );
  }

  return (
    <div className={styles.ordenesContainer}>
      <div className={styles.header}>
        <div className={styles.titleSection}>
          <h1 className={styles.title}>📝 Órdenes de Trabajo</h1>
          <p className={styles.subtitle}>Gestión de mantenimientos programados y completados</p>
        </div>
        <div className={styles.navTabs}>
          <Link to="/mantenimiento/equipos" className={styles.tab}>
            📋 Equipos
          </Link>
          <Link to="/mantenimiento/ordenes" className={`${styles.tab} ${styles.active}`}>
            📝 Órdenes de Trabajo
          </Link>
          <Link to="/mantenimiento/papelera" className={styles.tab}>
            🗑️ Papelera
          </Link>
        </div>
      </div>

      <div className={styles.statsGrid}>
        <div className={`${styles.statCard} ${styles.statPendientes}`}>
          <span className={styles.statIcon}>🟡</span>
          <div className={styles.statInfo}>
            <span className={styles.statValue}>{estadisticas.pendientes || 0}</span>
            <span className={styles.statLabel}>Pendientes</span>
          </div>
        </div>
        <div className={`${styles.statCard} ${styles.statAtrasados}`}>
          <span className={styles.statIcon}>⚠️</span>
          <div className={styles.statInfo}>
            <span className={styles.statValue}>{estadisticas.atrasados || 0}</span>
            <span className={styles.statLabel}>Atrasados</span>
          </div>
        </div>
        <div className={`${styles.statCard} ${styles.statProximos}`}>
          <span className={styles.statIcon}>📅</span>
          <div className={styles.statInfo}>
            <span className={styles.statValue}>{estadisticas.proximos || 0}</span>
            <span className={styles.statLabel}>Próximos</span>
          </div>
        </div>
        <div className={`${styles.statCard} ${styles.statCompletados}`}>
          <span className={styles.statIcon}>✅</span>
          <div className={styles.statInfo}>
            <span className={styles.statValue}>{estadisticas.completados || 0}</span>
            <span className={styles.statLabel}>Completados</span>
          </div>
        </div>
      </div>

      <FiltrosOrdenes 
        filtros={filtros}
        onFilterChange={handleFilterChange}
        onReset={handleResetFilters}
      />

      {error && (
        <div className={styles.errorMessage}>
          <span>⚠️</span> {error}
          <button onClick={() => setError('')}>✕</button>
        </div>
      )}

      {filteredOrdenes.length === 0 ? (
        <div className={styles.emptyState}>
          <span className={styles.emptyIcon}>📋</span>
          <h3>No hay órdenes de trabajo</h3>
          <p>No se encontraron órdenes con los filtros seleccionados</p>
          <button className={styles.resetBtn} onClick={handleResetFilters}>
            Limpiar filtros
          </button>
        </div>
      ) : (
        <div className={styles.ordenesList}>
          {ordenesAtrasados.length > 0 && (
            <div className={styles.seccion}>
              <h2 className={styles.seccionTitulo}>⚠️ Atrasados ({ordenesAtrasados.length})</h2>
              {ordenesAtrasados.map(orden => (
                <OrdenCard 
                  key={orden.id} 
                  orden={orden} 
                  onGeneratePDF={handleGeneratePDF}
                />
              ))}
            </div>
          )}

          {ordenesProximos.length > 0 && (
            <div className={styles.seccion}>
              <h2 className={styles.seccionTitulo}>📅 Próximos ({ordenesProximos.length})</h2>
              {ordenesProximos.map(orden => (
                <OrdenCard 
                  key={orden.id} 
                  orden={orden} 
                  onGeneratePDF={handleGeneratePDF}
                />
              ))}
            </div>
          )}

          {ordenesCompletados.length > 0 && (
            <div className={styles.seccion}>
              <h2 className={styles.seccionTitulo}>✅ Completados ({ordenesCompletados.length})</h2>
              {ordenesCompletados.map(orden => (
                <OrdenCard 
                  key={orden.id} 
                  orden={orden} 
                  onGeneratePDF={handleGeneratePDF}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {showPDFModal && ordenSeleccionada && equipoSeleccionado && (
        <GenerarPDFModal
          isOpen={showPDFModal}
          onClose={() => {
            setShowPDFModal(false);
            setOrdenSeleccionada(null);
            setEquipoSeleccionado(null);
          }}
          orden={ordenSeleccionada}
          equipo={equipoSeleccionado}
        />
      )}
    </div>
  );
}