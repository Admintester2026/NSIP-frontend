// FRONTEND/src/components/mantenimiento/FiltrosOrdenes.jsx
import { useState, useEffect } from 'react';
import { mantenimientoAPI } from '../../api/mantenimiento';
import styles from './FiltrosOrdenes.module.css';

export default function FiltrosOrdenes({ filtros, onFilterChange, onReset }) {
  const [equipos, setEquipos] = useState([]);
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    cargarEquipos();
  }, []);

  const cargarEquipos = async () => {
    try {
      const equiposActivos = await mantenimientoAPI.getEquipos('activo');
      setEquipos(equiposActivos);
    } catch (err) {
      console.error('Error cargando equipos:', err);
    }
  };

  const handleChange = (field, value) => {
    onFilterChange({ ...filtros, [field]: value });
  };

  return (
    <div className={styles.filtrosContainer}>
      <div className={styles.filtrosHeader}>
        <button 
          className={styles.toggleFiltersBtn}
          onClick={() => setShowFilters(!showFilters)}
        >
          {showFilters ? '▲ Ocultar filtros' : '▼ Mostrar filtros'}
        </button>
        <button className={styles.resetBtn} onClick={onReset}>
          🧹 Limpiar filtros
        </button>
      </div>

      {showFilters && (
        <div className={styles.filtrosGrid}>
          <div className={styles.filterGroup}>
            <label>Estado</label>
            <select 
              value={filtros.estado || 'todos'} 
              onChange={(e) => handleChange('estado', e.target.value)}
            >
              <option value="todos">Todos</option>
              <option value="pendiente">🟡 Pendientes</option>
              <option value="completado">✅ Completados</option>
            </select>
          </div>

          <div className={styles.filterGroup}>
            <label>Equipo</label>
            <select 
              value={filtros.equipo_id || ''} 
              onChange={(e) => handleChange('equipo_id', e.target.value || null)}
            >
              <option value="">Todos los equipos</option>
              {equipos.map(equipo => (
                <option key={equipo.id} value={equipo.id}>
                  {equipo.nombre}
                </option>
              ))}
            </select>
          </div>

          <div className={styles.filterGroup}>
            <label>Incluir equipos en papelera</label>
            <input 
              type="checkbox"
              checked={filtros.incluir_papelera || false}
              onChange={(e) => handleChange('incluir_papelera', e.target.checked)}
            />
          </div>

          <div className={styles.filterGroup}>
            <label>Fecha desde</label>
            <input 
              type="date"
              value={filtros.fecha_desde || ''}
              onChange={(e) => handleChange('fecha_desde', e.target.value)}
            />
          </div>

          <div className={styles.filterGroup}>
            <label>Fecha hasta</label>
            <input 
              type="date"
              value={filtros.fecha_hasta || ''}
              onChange={(e) => handleChange('fecha_hasta', e.target.value)}
            />
          </div>

          <div className={styles.filterGroup}>
            <label>Buscar</label>
            <input 
              type="text"
              placeholder="Título, equipo o técnico..."
              value={filtros.busqueda || ''}
              onChange={(e) => handleChange('busqueda', e.target.value)}
            />
          </div>
        </div>
      )}

      <div className={styles.activeFilters}>
        {filtros.estado && filtros.estado !== 'todos' && (
          <span className={styles.filterBadge}>
            Estado: {filtros.estado === 'pendiente' ? '🟡 Pendiente' : '✅ Completado'}
            <button onClick={() => handleChange('estado', 'todos')}>✕</button>
          </span>
        )}
        {filtros.equipo_id && (
          <span className={styles.filterBadge}>
            Equipo: {equipos.find(e => e.id === parseInt(filtros.equipo_id))?.nombre}
            <button onClick={() => handleChange('equipo_id', null)}>✕</button>
          </span>
        )}
        {filtros.fecha_desde && (
          <span className={styles.filterBadge}>
            Desde: {filtros.fecha_desde}
            <button onClick={() => handleChange('fecha_desde', '')}>✕</button>
          </span>
        )}
        {filtros.fecha_hasta && (
          <span className={styles.filterBadge}>
            Hasta: {filtros.fecha_hasta}
            <button onClick={() => handleChange('fecha_hasta', '')}>✕</button>
          </span>
        )}
        {filtros.busqueda && (
          <span className={styles.filterBadge}>
            Búsqueda: {filtros.busqueda}
            <button onClick={() => handleChange('busqueda', '')}>✕</button>
          </span>
        )}
      </div>
    </div>
  );
}