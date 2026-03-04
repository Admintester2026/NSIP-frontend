import { useMode } from '../../../../context/ModeContext';
import styles from '../styles/IndexCyclesStyles';

export default function ManualModeWarning() {
  const { mode, switchToAuto, loading } = useMode();

  // Si el modo es automático, no mostrar nada
  if (mode === 'auto' || mode === 'automatic') return null;

  return (
    <div className={styles.warningBanner}>
      <div className={styles.warningIcon}>⚠️</div>
      <div className={styles.warningContent}>
        <strong>Modo Manual Activado</strong>
        <p>Los ciclos están desactivados porque el sistema está en modo manual.</p>
      </div>
      <button 
        className={styles.autoButton}
        onClick={switchToAuto}
        disabled={loading}
      >
        {loading ? 'Cambiando...' : 'Cambiar a Modo Automático'}
      </button>
    </div>
  );
}