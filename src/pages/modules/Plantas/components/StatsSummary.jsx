// src/pages/modules/Plantas/components/StatsSummary.jsx
import StatsCard from './StatsCard';
import styles from "../styles/index";

// Función para validar si un valor de luz es válido
function isValidLuz(value) {
  return value !== undefined && value !== null && !isNaN(value) && isFinite(value) && value >= 0;
}

export default function StatsSummary({ historicoData, statsData }) {
  // Validar que historicoData existe y es un array
  const datosValidos = Array.isArray(historicoData) ? historicoData : [];
  const totalRegistros = datosValidos.length;
  
  // Calcular estadísticas de luz solo si hay datos
  let promedioLuz = 0;
  let maxLuz = 0;
  let minLuz = 0;
  
  if (totalRegistros > 0) {
    // Filtrar solo valores válidos de luz
    const valoresLuz = datosValidos
      .map(row => row?.LUZ)
      .filter(isValidLuz);
    
    if (valoresLuz.length > 0) {
      promedioLuz = valoresLuz.reduce((acc, val) => acc + val, 0) / valoresLuz.length;
      maxLuz = Math.max(...valoresLuz);
      minLuz = Math.min(...valoresLuz);
    }
  }
  
  // Calcular estadísticas de relés
  let totalEncendidos = 0;
  let promedioUso = 0;
  
  if (statsData?.data?.relays && Array.isArray(statsData.data.relays)) {
    totalEncendidos = statsData.data.relays.reduce((acc, relay) => acc + (relay?.hours_on || 0), 0);
    promedioUso = statsData.data.relays.reduce((acc, relay) => acc + (relay?.percent || 0), 0) / 8;
  }

  return (
    <div className={styles.summaryCards}>
      <StatsCard
        title="Total Registros"
        value={totalRegistros}
        unit=""
        icon="📊"
        color="#00ff9d"
      />
      <StatsCard
        title="Promedio Luz"
        value={totalRegistros > 0 ? promedioLuz.toFixed(1) : '0.0'}
        unit="lux"
        icon="💡"
        color="#ffb340"
      />
      <StatsCard
        title="Máximo Luz"
        value={totalRegistros > 0 ? maxLuz.toFixed(1) : '0.0'}
        unit="lux"
        icon="⬆️"
        color="#ff4d4d"
      />
      <StatsCard
        title="Mínimo Luz"
        value={totalRegistros > 0 ? minLuz.toFixed(1) : '0.0'}
        unit="lux"
        icon="⬇️"
        color="#4d7fff"
      />
      <StatsCard
        title="Horas Encendido"
        value={totalEncendidos.toFixed(1)}
        unit="h"
        icon="⏰"
        color="#00ff9d"
      />
      <StatsCard
        title="Uso Promedio"
        value={promedioUso.toFixed(1)}
        unit="%"
        icon="📈"
        color="#ffb340"
      />
    </div>
  );
}