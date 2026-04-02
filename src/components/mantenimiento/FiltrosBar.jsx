// src/components/mantenimiento/FiltrosBar.jsx
import { useState, useEffect } from 'react';
import { mantenimientoAPI } from '../../api/mantenimiento';
import styles from './FiltrosBar.module.css';

export default function FiltrosBar({ 
  searchTerm, 
  onSearchChange, 
  selectedCategoria, 
  onCategoriaChange,
  selectedEstado,
  onEstadoChange,
  ordenPor,
  onOrdenChange,
  ordenDir,
  onOrdenDirToggle,
  onClearFilters
}) {
  const [categorias, setCategorias] = useState([]);
  const [loadingCategorias, setLoadingCategorias] = useState(false);

  useEffect(() => {
    cargarCategorias();
  }, []);

  const cargarCategorias = async () => {
    setLoadingCategorias(true);
    try {
      const data = await mantenimientoAPI.getCategorias();
      setCategorias(data);
    } catch (err) {
      console.error('Error cargando categorías:', err);
    } finally {
      setLoadingCategorias(false);
    }
  };

  return (
    <div className={styles.filtrosBar}>
      {/* Barra de búsqueda */}
      <div className={styles.searchSection}>
        <div className={styles.searchBox}>
          <input
            type="text"
            placeholder="Buscar por nombre o ubicación..."
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            className={styles.searchInput}
          />
          <span className={styles.searchIcon}>🔍</span>
          {searchTerm && (
            <button className={styles.clearSearchBtn} onClick={onClearFilters}>
              ✕
            </button>
          )}
        </div>
      </div>

      {/* Filtros de estado y orden */}
      <div className={styles.filtersRow}>
        <div className={styles.filterGroup}>
          <label className={styles.filterLabel}>Estado:</label>
          <select 
            className={styles.filterSelect}
            value={selectedEstado}
            onChange={(e) => onEstadoChange(e.target.value)}
          >
            <option value="activo">✅ Activos</option>
            <option value="dañado">⚠️ Dañados</option>
            <option value="suspension">⏸️ Suspendidos</option>
            <option value="baja">❌ Dados de Baja</option>
            <option value="todos">📋 Todos</option>
          </select>
        </div>

        <div className={styles.filterGroup}>
          <label className={styles.filterLabel}>Ordenar por:</label>
          <select 
            className={styles.filterSelect}
            value={ordenPor}
            onChange={(e) => onOrdenChange(e.target.value)}
          >
            <option value="nombre">🔤 Nombre</option>
            <option value="fecha">📅 Fecha de registro</option>
            <option value="estado">🏷️ Estado</option>
          </select>
          <button 
            className={styles.ordenDirBtn}
            onClick={onOrdenDirToggle}
            title={ordenDir === 'asc' ? 'Ascendente' : 'Descendente'}
          >
            {ordenDir === 'asc' ? '↑' : '↓'}
          </button>
        </div>

        {/* Botón limpiar filtros aquí */}
        <button className={styles.clearFiltersBtn} onClick={onClearFilters} title="Limpiar todos los filtros">
          🧹 Limpiar filtros
        </button>
      </div>

      {/* Filtro de categorías */}
      <div className={styles.categoriaSection}>
        <span className={styles.categoriaLabel}>🏷️ Categorías:</span>
        <div className={styles.categoriaList}>
          <button
            className={`${styles.categoriaBtn} ${selectedCategoria === 'todas' ? styles.active : ''}`}
            onClick={() => onCategoriaChange('todas')}
          >
            Todas
          </button>
          {categorias.map(cat => (
            <button
              key={cat.id}
              className={`${styles.categoriaBtn} ${selectedCategoria === cat.nombre ? styles.active : ''}`}
              onClick={() => onCategoriaChange(cat.nombre)}
              style={{
                borderColor: selectedCategoria === cat.nombre ? cat.color : 'var(--border-dim)',
                backgroundColor: selectedCategoria === cat.nombre ? `${cat.color}20` : 'var(--bg-raised)'
              }}
            >
              <span 
                className={styles.categoriaDot} 
                style={{ 
                  backgroundColor: cat.color,
                  boxShadow: selectedCategoria === cat.nombre ? `0 0 4px ${cat.color}` : 'none'
                }}
              />
              {cat.nombre}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}