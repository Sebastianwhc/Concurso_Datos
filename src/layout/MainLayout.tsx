import React, { useState } from 'react';
import { Outlet, NavLink, Link } from 'react-router-dom';
import { Activity, Map as MapIcon, Menu, Cpu, Home } from 'lucide-react';
import styles from './MainLayout.module.css';

const MainLayout: React.FC = () => {
  // En móvil arranca colapsado (off-canvas) para no tapar el contenido.
  const [isSidebarOpen, setSidebarOpen] = useState(
    () => typeof window === 'undefined' || window.innerWidth > 768
  );

  return (
    <div className={styles.appContainer}>
      {/* Backdrop para cerrar el sidebar en móvil */}
      {isSidebarOpen && (
        <div className={styles.backdrop} onClick={() => setSidebarOpen(false)} />
      )}

      {/* SIDEBAR: Navegación con efecto Glassmorphism */}
      <aside className={`${styles.sidebar} ${isSidebarOpen ? styles.open : styles.closed}`}>
        <Link
          to="/"
          className={styles.brand}
          onClick={() => { if (window.innerWidth <= 768) setSidebarOpen(false); }}
        >
          <div className={styles.logoGlow}></div>
          {isSidebarOpen && <h2>EcoSalud IA</h2>}
        </Link>

        <nav className={styles.navMenu}>
          <NavLink
            to="/"
            end
            onClick={() => { if (window.innerWidth <= 768) setSidebarOpen(false); }}
            className={({ isActive }) => isActive ? `${styles.navItem} ${styles.active}` : styles.navItem}
          >
            <Home className={styles.icon} />
            {isSidebarOpen && <span>Volver al inicio</span>}
          </NavLink>

          <NavLink
            to="/dashboard"
            onClick={() => { if (window.innerWidth <= 768) setSidebarOpen(false); }}
            className={({ isActive }) => isActive ? `${styles.navItem} ${styles.active}` : styles.navItem}
          >
            <Activity className={styles.icon} />
            {isSidebarOpen && <span>SIVIGILA Actual</span>}
          </NavLink>

          <NavLink
            to="/simulador"
            onClick={() => { if (window.innerWidth <= 768) setSidebarOpen(false); }}
            className={({ isActive }) => isActive ? `${styles.navItem} ${styles.active}` : styles.navItem}
          >
            <MapIcon className={styles.icon} />
            {isSidebarOpen && <span>Simulador Predictivo</span>}
          </NavLink>
        </nav>

        {/* Indicador de Estado para inmersión UX */}
        <div className={styles.systemStatus}>
          <Cpu className={styles.statusIcon} />
          {isSidebarOpen && (
            <div className={styles.statusText}>
              <span>Motor Predictivo</span>
              <span className={styles.onlineBadge}>Online</span>
            </div>
          )}
        </div>
      </aside>

      {/* ÁREA DE CONTENIDO */}
      <main className={styles.mainContent}>
        <header className={styles.topHeader}>
          <button className={styles.menuToggle} onClick={() => setSidebarOpen(!isSidebarOpen)}>
            <Menu />
          </button>
          <div className={styles.headerInfo}>
            <h1>Bucaramanga - Monitoreo y Predicción de Dengue</h1>
            <p className={styles.subtitle}>Reto: Salud y Bienestar | Inteligencia Artificial</p>
          </div>
        </header>

        <div className={styles.pageContent}>
          {/* Aquí se renderiza dinámicamente DashboardView o SimulatorView */}
          <Outlet />
        </div>

        {/* FOOTER GENERAL DE CONTACTO */}
        <footer className={styles.appFooter}>
          <span>Desarrollado por: </span>
          <a href="mailto:daalreba@gmail.com" className={styles.footerLink}>Daniela Reyes</a>
          <span className={styles.separator}>|</span>
          <a href="mailto:sebastian00735@gmail.com" className={styles.footerLink}>Sebastián Díaz</a>
        </footer>
      </main>
    </div>
  );
};

export default MainLayout;
