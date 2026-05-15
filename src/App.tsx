import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import MainLayout from './layout/MainLayout';
import LandingView from './features/landing/LandingView';
import DashboardView from './features/dashboard/DashboardView';
import SimulatorView from './features/simulator/SimulatorView';
import './styles/tokens.css';
import './styles/index.css';

const App: React.FC = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LandingView />} />
        
        <Route element={<MainLayout />}>
          <Route path="/dashboard" element={<DashboardView />} />
          <Route path="/simulador" element={<SimulatorView />} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
};

export default App;
