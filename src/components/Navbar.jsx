import { useState, useEffect, useRef } from 'react';
import { Link, useLocation } from 'react-router-dom';
import styles from './Navbar.module.css';

export default function Navbar() {
  const location = useLocation();
  const [modulosOpen, setModulosOpen] = useState(false);
  const [mantenimientoOpen, setMantenimientoOpen] = useState(false);
  const menuRef = useRef(null);

  // Cerrar menús al hacer clic fuera
  useEffect(() => {
    function handleClickOutside(event) {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setModulosOpen(false);
        setMantenimientoOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Cerrar menús al cambiar de ruta
  useEffect(() => {
    setModulosOpen(false);
    setMantenimientoOpen(false);
  }, [location]);

  // Verificar si estamos en una ruta de mantenimiento
  const isMantenimientoActive = location.pathname.startsWith('/mantenimiento');

  return (
    <nav className={styles.navbar}>
      <div className={styles.navContainer}>
        <Link to="/" className={styles.logo}>
          <span className={styles.logoIcon}>⚙️</span>
          <span className={styles.logoText}>NSIP: CTRL Y MANT</span>
        </Link>

        <div className={styles.navLinks} ref={menuRef}>
          <Link 
            to="/" 
            className={`${styles.navLink} ${location.pathname === '/' ? styles.active : ''}`}
          >
            Inicio
          </Link>

          {/* Menú Módulos */}
          <div className={styles.dropdown}>
            <button 
              className={`${styles.dropdownButton} ${modulosOpen ? styles.active : ''}`}
              onClick={() => {
                setModulosOpen(!modulosOpen);
                setMantenimientoOpen(false);
              }}
            >
              Módulos
              <span className={styles.dropdownArrow}>▼</span>
            </button>
            
            {modulosOpen && (
              <div className={styles.dropdownMenu}>
                <Link to="/modulos/luminarias" className={styles.dropdownItem}>
                  <span className={styles.dropdownIcon}>💡</span>
                  <div className={styles.dropdownContent}>
                    <span className={styles.dropdownTitle}>Control de Luminarias</span>
                    <span className={styles.dropdownDesc}>8 relés con sensor BH1750</span>
                  </div>
                  <span className={styles.statusBadge}>ACTIVO</span>
                </Link>
                
                <Link to="/modulos/voltaje" className={styles.dropdownItem}>
                  <span className={styles.dropdownIcon}>⚡</span>
                  <div className={styles.dropdownContent}>
                    <span className={styles.dropdownTitle}>Control de Voltaje</span>
                    <span className={styles.dropdownDesc}>Monitoreo de 3 fases ZMPT101B</span>
                  </div>
                  <span className={styles.statusBadge}>ACTIVO</span>
                </Link>
              </div>
            )}
          </div>

          {/* Menú Mantenimiento */}
          <div className={styles.dropdown}>
            <button 
              className={`${styles.dropdownButton} ${mantenimientoOpen || isMantenimientoActive ? styles.active : ''}`}
              onClick={() => {
                setMantenimientoOpen(!mantenimientoOpen);
                setModulosOpen(false);
              }}
            >
              Mantenimiento
              <span className={styles.dropdownArrow}>▼</span>
            </button>
            
            {mantenimientoOpen && (
              <div className={styles.dropdownMenu}>
                <Link to="/mantenimiento/equipos" className={styles.dropdownItem}>
                  <span className={styles.dropdownIcon}>🔧</span>
                  <div className={styles.dropdownContent}>
                    <span className={styles.dropdownTitle}>Equipos</span>
                    <span className={styles.dropdownDesc}>Gestión de equipos y maquinaria</span>
                  </div>
                  <span className={styles.statusBadge}>ACTIVO</span>
                </Link>
                
                <Link to="/mantenimiento/ordenes" className={styles.dropdownItem}>
                  <span className={styles.dropdownIcon}>📋</span>
                  <div className={styles.dropdownContent}>
                    <span className={styles.dropdownTitle}>Órdenes de Trabajo</span>
                    <span className={styles.dropdownDesc}>Pendientes, urgentes y próximas</span>
                  </div>
                  <span className={`${styles.statusBadge} ${styles.comingSoon}`}>
                    PRÓXIMAMENTE
                  </span>
                </Link>
                
                <div className={styles.dropdownDivider}></div>
                
                <Link to="/mantenimiento/papelera" className={styles.dropdownItem}>
                  <span className={styles.dropdownIcon}>🗑️</span>
                  <div className={styles.dropdownContent}>
                    <span className={styles.dropdownTitle}>Papelera</span>
                    <span className={styles.dropdownDesc}>Equipos eliminados</span>
                  </div>
                  <span className={`${styles.statusBadge} ${styles.comingSoon}`}>
                    PRÓXIMAMENTE
                  </span>
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}