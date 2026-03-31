//Update 1
import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { mantenimientoAPI } from '../../../api/mantenimiento';
import { usePolling } from '../../../hooks/useAsync';
import EquipmentCard from '../../../components/mantenimiento/EquipmentCard';
import AddEquipmentModal from '../../../components/mantenimiento/AddEquipmentModal';
import styles from './styles/Equipos.module.css';

export default function Equipos() {
  const [equipos, setEquipos] = useState([]);
  const [filteredEquipos, setFilteredEquipos] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategoria, setSelectedCategoria] = useState('todas');
  const [showAddModal, setShowAddModal] = useState(false);
  const [loading, setLoading] = useState(true);

  // Obtener equipos con polling
  const fetchEquipos = useCallback(() => mantenimientoAPI.getEquipos('activo'), []);
  const { data: equiposData, loading: equiposLoading, refetch } = usePolling(fetchEquipos, 30000);

  // Obtener categorías
  const fetchCategorias = useCallback(() => mantenimientoAPI.getCategorias(), []);
  const { data: categoriasData } = usePolling(fetchCategorias, 60000);

  useEffect(() => {
    if (equiposData) {
      setEquipos(equiposData);
      applyFilters(equiposData, searchTerm, selectedCategoria);
      setLoading(false);
    }
  }, [equiposData]);

  useEffect(() => {
    if (categoriasData) {
      setCategorias(categoriasData);
    }
  }, [categoriasData]);

  const applyFilters = (data, search, categoria) => {
    let filtered = [...data];

    if (search.trim() !== '') {
      const searchLower = search.toLowerCase();
      filtered = filtered.filter(item =>
        item.nombre?.toLowerCase().includes(searchLower) ||
        item.ubicacion?.toLowerCase().includes(searchLower)
      );
    }

    if (categoria !== 'todas') {
      filtered = filtered.filter(item =>
        item.categorias?.some(cat => cat.nombre === categoria)
      );
    }

    setFilteredEquipos(filtered);
  };

  const handleSearch = (e) => {
    const term = e.target.value;
    setSearchTerm(term);
    applyFilters(equipos, term, selectedCategoria);
  };

  const handleCategoriaFilter = (catNombre) => {
    setSelectedCategoria(catNombre);
    applyFilters(equipos, searchTerm, catNombre);
  };

  const handleAddEquipo = () => {
    setShowAddModal(true);
  };

  const handleCloseModal = () => {
    setShowAddModal(false);
    refetch(); // Refrescar lista después de agregar
  };

  if (loading && equipos.length === 0) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.loadingSpinner}></div>
        <p>Cargando equipos...</p>
      </div>
    );
  }

  return (
    <div className={styles.equipos}>
      {/* Cabecera */}
      <div className={styles.header}>
        <div className={styles.titleSection}>
          <h1 className={styles.title}>Mantenimiento de Equipos</h1>
          <p className={styles.subtitle}>Gestión de equipos y maquinaria industrial</p>
        </div>
        <div className={styles.navTabs}>
          <Link to="/mantenimiento/equipos" className={`${styles.tab} ${styles.active}`}>
            📋 Equipos
          </Link>
          <Link to="/mantenimiento/ordenes" className={styles.tab}>
            📝 Órdenes de Trabajo
          </Link>
          <Link to="/mantenimiento/papelera" className={styles.tab}>
            🗑️ Papelera
          </Link>
        </div>
      </div>

      {/* Barra de filtros */}
      <div className={styles.filterBar}>
        <div className={styles.searchBox}>
          <input
            type="text"
            placeholder="Buscar por nombre o ubicación..."
            value={searchTerm}
            onChange={handleSearch}
            className={styles.searchInput}
          />
          <span className={styles.searchIcon}>🔍</span>
        </div>

        <div className={styles.categoriaFilter}>
          <button
            className={`${styles.categoriaButton} ${selectedCategoria === 'todas' ? styles.active : ''}`}
            onClick={() => handleCategoriaFilter('todas')}
          >
            Todas
          </button>
          {categorias.map(cat => (
            <button
              key={cat.id}
              className={`${styles.categoriaButton} ${selectedCategoria === cat.nombre ? styles.active : ''}`}
              onClick={() => handleCategoriaFilter(cat.nombre)}
            >
              <span 
                className={styles.categoriaDot} 
                style={{ backgroundColor: cat.color }}
              ></span>
              {cat.nombre}
            </button>
          ))}
        </div>
      </div>

      {/* Contador */}
      <div className={styles.counter}>
        {filteredEquipos.length} equipo{filteredEquipos.length !== 1 ? 's' : ''} encontrado{filteredEquipos.length !== 1 ? 's' : ''}
      </div>

      {/* Grid de equipos */}
      <div className={styles.equiposGrid}>
        {filteredEquipos.length > 0 ? (
          filteredEquipos.map(equipo => (
            <EquipmentCard
              key={equipo.id}
              equipo={equipo}
            />
          ))
        ) : (
          <div className={styles.emptyState}>
            <span className={styles.emptyIcon}>🔧</span>
            <h3>No hay equipos registrados</h3>
            <p>Haz clic en el botón "+" para agregar tu primer equipo</p>
            {searchTerm && (
              <button 
                className={styles.clearSearch}
                onClick={() => {
                  setSearchTerm('');
                  applyFilters(equipos, '', selectedCategoria);
                }}
              >
                Limpiar búsqueda
              </button>
            )}
          </div>
        )}
      </div>

      {/* Botón flotante */}
      <button className={styles.fab} onClick={handleAddEquipo}>
        <span className={styles.fabIcon}>+</span>
      </button>

      {/* Modal de agregar equipo */}
      {showAddModal && (
        <AddEquipmentModal
          isOpen={showAddModal}
          onClose={handleCloseModal}
          onSuccess={() => refetch()}
        />
      )}
    </div>
  );
}