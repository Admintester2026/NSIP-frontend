import { Link } from 'react-router-dom';
import styles from './styles/Ordenes.module.css';

export default function Ordenes() {
  return (
    <div className={styles.ordenes}>
      <div className={styles.header}>
        <div className={styles.titleSection}>
          <h1 className={styles.title}>Órdenes de Trabajo</h1>
          <p className={styles.subtitle}>Gestión de mantenimientos pendientes, urgentes y próximos</p>
        </div>
        <div className={styles.navTabs}>
          <Link to="/mantenimiento/equipos" className={styles.tab}>
            📋 Equipos
          </Link>
          <Link to="/mantenimiento/ordenes" className={`${styles.tab} ${styles.active}`}>
            📝 Órdenes de Trabajo
          </Link>
          <Link to="/mantenimiento/papelera" className={styles.tab}>
            🗑️ Papelera
          </Link>
        </div>
      </div>

      <div className={styles.comingSoon}>
        <div className={styles.comingSoonContent}>
          <span className={styles.comingSoonIcon}>📋</span>
          <h2>Próximamente</h2>
          <p>El módulo de órdenes de trabajo está en desarrollo.</p>
          <p className={styles.comingSoonDesc}>
            Permitirá gestionar:
            <br />• Mantenimientos pendientes
            <br />• Órdenes urgentes
            <br />• Programación de próximos mantenimientos
            <br />• Asignación de técnicos
          </p>
          <Link to="/mantenimiento/equipos" className={styles.backButton}>
            ← Volver a Equipos
          </Link>
        </div>
      </div>
    </div>
  );
}