import { Link } from 'react-router-dom';
import styles from './Modulos.module.css';

export default function Modulos() {
  return (
    <div className={styles.modulos}>
      <h1 className={styles.title}>Módulos de Control</h1>
      <p className={styles.subtitle}>Selecciona el sistema que deseas controlar</p>

      <div className={styles.modulesGrid}>
        <Link to="/modulos/luminarias" className={styles.moduleCard}>
          <span className={styles.moduleIcon}>💡</span>
          <h2 className={styles.moduleName}>Control de Luminarias</h2>
          <p className={styles.moduleDesc}>Gestión de 8 relés con sensor BH1750</p>
          <span className={styles.moduleStatus}>ACTIVO</span>
        </Link>

        {/* Módulo de Voltaje - AHORA ACTIVO */}
        <Link to="/modulos/voltaje" className={styles.moduleCard}>
          <span className={styles.moduleIcon}>⚡</span>
          <h2 className={styles.moduleName}>Control de Voltaje</h2>
          <p className={styles.moduleDesc}>Monitoreo de 3 fases con sensores ZMPT101B</p>
          <span className={styles.moduleStatus}>ACTIVO</span>
        </Link>
      </div>
    </div>
  );
}