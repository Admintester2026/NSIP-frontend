import { useState, useMemo } from 'react';
import styles from '../../styles/IndexCyclesStyles';

export default function CycleTable({ cyclesData, onEdit }) {
  // --- TODOS LOS HOOKS VAN AL PRINCIPIO, SIEMPRE ---
  const [filterRelay, setFilterRelay] = useState('todos');
  const [filterCycle, setFilterCycle] = useState('todos');
  const [searchText, setSearchText] = useState('');

  // --- 1. Procesar datos brutos (esto NO es un hook, es lógica directa) ---
  const allCycles = [];
  if (cyclesData?.relays) {
    cyclesData.relays.forEach((relay) => {
      if (Array.isArray(relay.cycles)) {
        relay.cycles.forEach((cycle, idx) => {
          if (cycle?.enabled === true) {
            allCycles.push({
              relayId: relay.id,
              relayName: `R${relay.id}`,
              cycleNumber: idx + 1,
              start: cycle.start || '??:??',
              end: cycle.end || '??:??',
              label: `Anaquel ${relay.id}`,
            });
          }
        });
      }
    });
  }

  // --- 2. GENERAR OPCIONES PARA LOS SELECTS (USANDO useMemo) ---
  const relayOptions = useMemo(() => {
    const options = ['todos', ...new Set(allCycles.map(c => c.relayId))];
    return options.sort((a, b) => {
      if (a === 'todos') return -1;
      if (b === 'todos') return 1;
      return a - b;
    });
  }, [allCycles]);

  const cycleOptions = useMemo(() => {
    const options = ['todos', ...new Set(allCycles.map(c => c.cycleNumber))];
    return options.sort((a, b) => {
      if (a === 'todos') return -1;
      if (b === 'todos') return 1;
      return a - b;
    });
  }, [allCycles]);

  // --- 3. FILTRAR CICLOS (USANDO useMemo) ---
  const filteredCycles = useMemo(() => {
    return allCycles.filter(cycle => {
      if (filterRelay !== 'todos' && cycle.relayId !== parseInt(filterRelay)) return false;
      if (filterCycle !== 'todos' && cycle.cycleNumber !== parseInt(filterCycle)) return false;
      if (searchText) {
        const searchLower = searchText.toLowerCase();
        return (
          cycle.relayName.toLowerCase().includes(searchLower) ||
          cycle.label.toLowerCase().includes(searchLower) ||
          cycle.start.includes(searchText) ||
          cycle.end.includes(searchText)
        );
      }
      return true;
    });
  }, [allCycles, filterRelay, filterCycle, searchText]);

  // --- 4. LOS RETORNOS CONDICIONALES 
  if (!cyclesData?.relays) {
    return <div className={styles.tableContainer}>Cargando datos...</div>;
  }

  if (allCycles.length === 0) {
    return (
      <div className={styles.tableContainer}>
        <h3 className={styles.tableTitle}>📋 Todos los Ciclos Activos</h3>
        <div className={styles.emptyTable}>
          <span className={styles.emptyIcon}>🕒</span>
          <p>No hay ciclos activos configurados</p>
        </div>
      </div>
    );
  }

  // --- 5. RENDERIZADO FINAL 
  return (
    <div className={styles.tableContainer}>
      <h3 className={styles.tableTitle}>📋 Todos los Ciclos Activos</h3>

      {/* Filtros con estilo mejorado */}
      <div className={styles.tableFilters}>
        <div className={styles.filterGroup}>
          <label htmlFor="filterRelay">Relé:</label>
          <select
            id="filterRelay"
            value={filterRelay}
            onChange={(e) => setFilterRelay(e.target.value)}
            className={styles.filterSelect}
          >
            {relayOptions.map(opt => (
              <option key={opt} value={opt}>
                {opt === 'todos' ? 'Todos' : `R${opt}`}
              </option>
            ))}
          </select>
        </div>

        <div className={styles.filterGroup}>
          <label htmlFor="filterCycle">Ciclo:</label>
          <select
            id="filterCycle"
            value={filterCycle}
            onChange={(e) => setFilterCycle(e.target.value)}
            className={styles.filterSelect}
          >
            {cycleOptions.map(opt => (
              <option key={opt} value={opt}>
                {opt === 'todos' ? 'Todos' : `C${opt}`}
              </option>
            ))}
          </select>
        </div>

        <div className={styles.filterGroup}>
          <label htmlFor="searchText">Buscar:</label>
          <input
            type="text"
            id="searchText"
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            placeholder="Hora o anaquel..."
            className={styles.filterInput}
          />
        </div>

        <button
          className={styles.clearFiltersButton}
          onClick={() => {
            setFilterRelay('todos');
            setFilterCycle('todos');
            setSearchText('');
          }}
        >
          QUITAR FILTRO
        </button>
      </div>

      {/* Tabla con scroll y colores neón */}
      <div className={styles.tableScrollable}>
        <table className={styles.cyclesTable}>
          <thead>
            <tr>
              <th>Relé</th>
              <th>Anaquel</th>
              <th>Ciclo</th>
              <th>Inicio</th>
              <th>Fin</th>
              <th>Acción</th>
            </tr>
          </thead>
          <tbody>
            {filteredCycles.length > 0 ? (
              filteredCycles.map((cycle) => (
                <tr key={`${cycle.relayId}-${cycle.cycleNumber}`}>
                  <td>
                    <span className={`${styles.relayId} ${styles[`ciclo${cycle.cycleNumber}`]}`}>
                      {cycle.relayName}
                    </span>
                  </td>
                  <td>{cycle.label}</td>
                  <td>C{cycle.cycleNumber}</td>
                  <td className={styles.timeCell}>{cycle.start}</td>
                  <td className={styles.timeCell}>{cycle.end}</td>
                  <td>
                    <button
                      className={styles.tableEditButton}
                      onClick={() => onEdit(
                        cycle.relayId,
                        cycle.cycleNumber - 1,
                        { start: cycle.start, end: cycle.end, enabled: true }
                      )}
                    >
                      ✎ Editar
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="6" className={styles.noResults}>
                  No hay resultados
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className={styles.tableFooter}>
        <span>Mostrando {filteredCycles.length} de {allCycles.length}</span>
      </div>
    </div>
  );
}