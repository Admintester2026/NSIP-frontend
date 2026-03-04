import StatsCard from './StatsCard';
import styles from "../styles/index";

export default function StatsSummary({ historicoData, statsData }) {
  const totalRegistros = historicoData.length;
  const promedioLuz = historicoData.reduce((acc, row) => acc + (row.LUZ || 0), 0) / (totalRegistros || 1);
  const maxLuz = Math.max(...historicoData.map(row => row.LUZ || 0));
  const minLuz = Math.min(...historicoData.map(row => row.LUZ || 0));
  
  const totalEncendidos = statsData?.data?.relays?.reduce((acc, relay) => acc + relay.hours_on, 0) || 0;
  const promedioUso = statsData?.data?.relays?.reduce((acc, relay) => acc + relay.percent, 0) / 8 || 0;

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
        value={promedioLuz.toFixed(1)}
        unit="lux"
        icon="💡"
        color="#ffb340"
      />
      <StatsCard
        title="Máximo Luz"
        value={maxLuz.toFixed(1)}
        unit="lux"
        icon="⬆️"
        color="#ff4d4d"
      />
      <StatsCard
        title="Mínimo Luz"
        value={minLuz.toFixed(1)}
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