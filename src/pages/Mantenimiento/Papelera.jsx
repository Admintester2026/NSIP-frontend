import { Link } from 'react-router-dom';
import styles from './styles/Papelera.module.css';

export default function Papelera() {
  return (
    <div className={styles.papelera}>
      <div className={styles.header}>
        <div className={styles.titleSection}>
          <h1 className={styles.title}>Papelera</h1>
          <p className={styles.subtitle}>Equipos eliminados y registros históricos</p>
        </div>
        <div className={styles.navTabs}>
          <Link to="/mantenimiento/equipos" className={styles.tab}>
            📋 Equipos
          </Link>
          <Link to="/mantenimiento/ordenes" className={styles.tab}>
            📝 Órdenes de Trabajo
          </Link>
          <Link to="/mantenimiento/papelera" className={`${styles.tab} ${styles.active}`}>
            🗑️ Papelera
          </Link>
        </div>
      </div>

      <div className={styles.comingSoon}>
        <div className={styles.comingSoonContent}>
          <span className={styles.comingSoonIcon}>🗑️</span>
          <h2>Próximamente</h2>
          <p>El módulo de papelera está en desarrollo.</p>
          <p className={styles.comingSoonDesc}>
            Permitirá:
            <br />• Ver equipos eliminados (soft delete)
            <br />• Restaurar equipos
            <br />• Eliminación definitiva
            <br />• Historial de cambios
          </p>
          <Link to="/mantenimiento/equipos" className={styles.backButton}>
            ← Volver a Equipos
          </Link>
        </div>
      </div>
    </div>
  );
}