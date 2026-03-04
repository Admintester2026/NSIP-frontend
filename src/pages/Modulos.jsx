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

        <div className={`${styles.moduleCard} ${styles.disabled}`}>
          <span className={styles.moduleIcon}>⚡</span>
          <h2 className={styles.moduleName}>Control de Voltaje</h2>
          <p className={styles.moduleDesc}>Sistema de monitoreo de voltaje (Próximamente)</p>
          <span className={`${styles.moduleStatus} ${styles.comingSoon}`}>EN DESARROLLO</span>
        </div>
      </div>
    </div>
  );
}