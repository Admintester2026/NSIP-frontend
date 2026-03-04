import styles from "../../styles/IndexCyclesStyles";  // ← RUTA CORREGIDA (2 niveles)

export default function CycleListSections({ cyclesData, onDeleteCycle, onEdit }) {
  if (!cyclesData?.relays) return null;

  // Recolectar todos los ciclos activos
  const allCycles = [];
  
  cyclesData.relays.forEach(relay => {
    relay.cycles.forEach((cycle, idx) => {
      if (cycle && cycle.enabled) {
        allCycles.push({
          relayId: relay.id,
          cycleNumber: idx + 1,
          start: cycle.start,
          end: cycle.end,
          relayName: `R${relay.id}`
        });
      }
    });
  });

  if (allCycles.length === 0) {
    return (
      <div className={styles.listsContainer}>
        <div className={styles.emptyTable}>
          <span className={styles.emptyIcon}>🕒</span>
          <p>No hay ciclos activos configurados</p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.listsContainer}>
      <div className={styles.cycleList}>
        <h3 className={styles.listTitle}>📋 Todos los Ciclos Activos</h3>
        <div className={styles.listGrid}>
          {allCycles.map((cycle, idx) => (
            <div key={`${cycle.relayId}-${cycle.cycleNumber}`} className={styles.listItem}>
              <span className={styles.listBadge}>R{cycle.relayId}</span>
              <span className={styles.listTime}>
                {cycle.start} - {cycle.end}
              </span>
              <span className={styles.listCycle}>C{cycle.cycleNumber}</span>
              <div className={styles.listActions}>
                <button
                  className={styles.editButton}
                  onClick={() => onEdit(cycle.relayId, cycle.cycleNumber - 1, {
                    start: cycle.start,
                    end: cycle.end,
                    enabled: true
                  })}
                  title="Editar"
                >
                  ✎
                </button>
                <button
                  className={styles.deleteButton}
                  onClick={() => onDeleteCycle(cycle.relayId, cycle.cycleNumber - 1)}
                  title="Eliminar"
                >
                  ✕
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}