import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import styles from './Home.module.css';

export default function Home() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <div className={`${styles.home} ${mounted ? styles.mounted : ''}`}>
      <div className={styles.hero}>
        <h1 className={styles.title}>NSIP, SISTEMA DE CONTROL Y MANTENIMIENTO</h1>
        <p className={styles.subtitle}>Plataforma unificada para monitoreo y control</p>
      </div>

      <div className={styles.mainButtons}>
        <Link to="/modulos" className={styles.primaryButton}>
          <span className={styles.buttonIcon}>🔌</span>
          <span className={styles.buttonText}>MÓDULOS DE CONTROL</span>
          <span className={styles.buttonDesc}>Accede a todos los sistemas de control disponibles</span>
        </Link>

        <Link to="/mantenimiento" className={styles.secondaryButton}>
          <span className={styles.buttonIcon}>🔧</span>
          <span className={styles.buttonText}>MANTENIMIENTO</span>
          <span className={styles.buttonDesc}>Gestión de órdenes y mantenimiento (Próximamente)</span>
        </Link>
      </div>

      <div className={styles.footer}>
        <p>Backend Industrial v2.0 • Datos en tiempo real desde SQL Server</p>
        <p className={styles.footerSmall}>© 2026 - Sistema de Control Industrial</p>
      </div>
    </div>
  );
}