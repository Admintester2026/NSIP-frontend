import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { mantenimientoAPI } from '../../api/mantenimiento';
import { usePolling } from '../../hooks/useAsync';
import EquipmentCard from '../../components/mantenimiento/EquipmentCard';
import AddEquipmentModal from '../../components/mantenimiento/AddEquipmentModal';
import styles from './styles/Equipos.module.css';

export default function Equipos() {
  const [equipos, setEquipos] = useState([]);
  const [filteredEquipos, setFilteredEquipos] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategoria, setSelectedCategoria] = useState('todas');
  const [selectedEstado, setSelectedEstado] = useState('activo');
  const [ordenPor, setOrdenPor] = useState('nombre');
  const [ordenDir, setOrdenDir] = useState('asc');
  const [inactivosExpandidos, setInactivosExpandidos] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [loading, setLoading] = useState(true);

  // Obtener equipos con polling según estado seleccionado
  const fetchEquipos = useCallback(() => mantenimientoAPI.getEquipos(selectedEstado), [selectedEstado]);
  const { data: equiposData, refetch } = usePolling(fetchEquipos, 30000);

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

  // Función para ordenar equipos
  const ordenarEquipos = (equiposList) => {
    return [...equiposList].sort((a, b) => {
      let valA, valB;
      switch (ordenPor) {
        case 'nombre':
          valA = a.nombre?.toLowerCase() || '';
          valB = b.nombre?.toLowerCase() || '';
          break;
        case 'fecha':
          valA = new Date(a.fecha_registro);
          valB = new Date(b.fecha_registro);
          break;
        case 'estado':
          const estadoOrder = { activo: 1, dañado: 2, suspension: 3, baja: 4 };
          valA = estadoOrder[a.estado] || 5;
          valB = estadoOrder[b.estado] || 5;
          break;
        default:
          return 0;
      }
      
      if (valA < valB) return ordenDir === 'asc' ? -1 : 1;
      if (valA > valB) return ordenDir === 'asc' ? 1 : -1;
      return 0;
    });
  };

  const applyFilters = (data, search, categoria) => {
    let filtered = [...data];

    // Filtrar por búsqueda
    if (search.trim() !== '') {
      const searchLower = search.toLowerCase();
      filtered = filtered.filter(item =>
        item.nombre?.toLowerCase().includes(searchLower) ||
        item.ubicacion?.toLowerCase().includes(searchLower)
      );
    }

    // Filtrar por categoría
    if (categoria !== 'todas') {
      filtered = filtered.filter(item =>
        item.categorias?.some(cat => cat.nombre === categoria)
      );
    }

    // Aplicar ordenamiento
    filtered = ordenarEquipos(filtered);
    setFilteredEquipos(filtered);
  };

  // Separar equipos por estado
  const equiposActivos = filteredEquipos.filter(e => e.estado === 'activo');
  const equiposInactivos = filteredEquipos.filter(e => 
    e.estado === 'dañado' || e.estado === 'suspension' || e.estado === 'baja'
  );

  const handleSearch = (e) => {
    const term = e.target.value;
    setSearchTerm(term);
    applyFilters(equipos, term, selectedCategoria);
  };

  const handleCategoriaFilter = (catNombre) => {
    setSelectedCategoria(catNombre);
    applyFilters(equipos, searchTerm, catNombre);
  };

  const handleEstadoChange = (e) => {
    setSelectedEstado(e.target.value);
  };

  const handleOrdenChange = (e) => {
    setOrdenPor(e.target.value);
    applyFilters(equipos, searchTerm, selectedCategoria);
  };

  const toggleOrdenDir = () => {
    setOrdenDir(ordenDir === 'asc' ? 'desc' : 'asc');
    applyFilters(equipos, searchTerm, selectedCategoria);
  };

  const handleAddEquipo = () => {
    setShowAddModal(true);
  };

  const handleCloseModal = () => {
    setShowAddModal(false);
    refetch();
  };

  const clearFilters = () => {
    setSearchTerm('');
    setSelectedCategoria('todas');
    applyFilters(equipos, '', 'todas');
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
      {/* Header */}
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
          {searchTerm && (
            <button className={styles.clearSearchBtn} onClick={clearFilters}>✕</button>
          )}
        </div>

        <div className={styles.filtersRow}>
          {/* Filtro por estado */}
          <div className={styles.estadoFilter}>
            <label className={styles.filterLabel}>Estado:</label>
            <select 
              className={styles.estadoSelect}
              value={selectedEstado}
              onChange={handleEstadoChange}
            >
              <option value="activo">Activos</option>
              <option value="dañado">Dañados</option>
              <option value="suspension">Suspendidos</option>
              <option value="baja">Dados de Baja</option>
              <option value="todos">Todos</option>
            </select>
          </div>

          {/* Ordenamiento */}
          <div className={styles.ordenFilter}>
            <label className={styles.filterLabel}>Ordenar por:</label>
            <select 
              className={styles.ordenSelect}
              value={ordenPor}
              onChange={handleOrdenChange}
            >
              <option value="nombre">Nombre</option>
              <option value="fecha">Fecha de registro</option>
              <option value="estado">Estado</option>
            </select>
            <button 
              className={styles.ordenDirBtn}
              onClick={toggleOrdenDir}
              title={ordenDir === 'asc' ? 'Ascendente' : 'Descendente'}
            >
              {ordenDir === 'asc' ? '↑' : '↓'}
            </button>
          </div>
        </div>
      </div>

      {/* Filtro de categorías */}
      <div className={styles.categoriaFilterBar}>
        <span className={styles.categoriaFilterLabel}>Categorías:</span>
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
        Total: {filteredEquipos.length} equipo{filteredEquipos.length !== 1 ? 's' : ''}
      </div>

      {/* Sección de equipos activos */}
      <section className={styles.seccionEquipos}>
        <h2 className={styles.seccionTitulo}>
          📋 Equipos Activos ({equiposActivos.length})
        </h2>
        {equiposActivos.length > 0 ? (
          <div className={styles.equiposGrid}>
            {equiposActivos.map(equipo => (
              <EquipmentCard key={equipo.id} equipo={equipo} />
            ))}
          </div>
        ) : (
          <div className={styles.emptySubsection}>
            <p>No hay equipos activos</p>
          </div>
        )}
      </section>

      {/* Sección de equipos inactivos (colapsable) */}
      {equiposInactivos.length > 0 && (
        <section className={styles.seccionEquipos}>
          <button 
            className={styles.seccionTituloCollapsible}
            onClick={() => setInactivosExpandidos(!inactivosExpandidos)}
          >
            <span className={styles.collapseIcon}>
              {inactivosExpandidos ? '▼' : '▶'}
            </span>
            ⚠️ Equipos con Problemas ({equiposInactivos.length})
          </button>
          {inactivosExpandidos && (
            <div className={styles.equiposGrid}>
              {equiposInactivos.map(equipo => (
                <EquipmentCard key={equipo.id} equipo={equipo} />
              ))}
            </div>
          )}
        </section>
      )}

      {/* Estado vacío total */}
      {filteredEquipos.length === 0 && (
        <div className={styles.emptyState}>
          <span className={styles.emptyIcon}>🔧</span>
          <h3>No hay equipos registrados</h3>
          <p>Haz clic en el botón "+" para agregar tu primer equipo</p>
          {(searchTerm || selectedCategoria !== 'todas') && (
            <button 
              className={styles.clearSearch}
              onClick={clearFilters}
            >
              Limpiar filtros
            </button>
          )}
        </div>
      )}

      {/* Botón flotante */}
      <button className={styles.fab} onClick={handleAddEquipo}>
        <span className={styles.fabIcon}>+</span>
      </button>

      {/* Modal */}
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