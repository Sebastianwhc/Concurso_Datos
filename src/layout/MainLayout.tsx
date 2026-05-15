import React, { useState } from 'react';
import { Outlet, NavLink } from 'react-router-dom';
import { Activity, Map as MapIcon, Menu, Cpu } from 'lucide-react';
import styles from './MainLayout.module.css';

const MainLayout: React.FC = () => {
  const [isSidebarOpen, setSidebarOpen] = useState(true);

  return (
    <div className={styles.appContainer}>
      {/* SIDEBAR: Navegación con efecto Glassmorphism */}
      <aside className={`${styles.sidebar} ${isSidebarOpen ? styles.open : styles.closed}`}>
        <div className={styles.brand}>
          <div className={styles.logoGlow}></div>
          {isSidebarOpen && <h2>EcoSalud IA</h2>}
        </div>
        
        <nav className={styles.navMenu}>
          <NavLink 
            to="/dashboard" 
            className={({ isActive }) => isActive ? `${styles.navItem} ${styles.active}` : styles.navItem}
          >
            <Activity className={styles.icon} />
            {isSidebarOpen && <span>SIVIGILA Actual</span>}
          </NavLink>
          
          <NavLink 
            to="/simulador" 
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
      </main>
    </div>
  );
};

export default MainLayout;
