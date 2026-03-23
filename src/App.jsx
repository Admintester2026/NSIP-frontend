import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import Modulos from './pages/Modulos';
import PlantasDashboard from './pages/modules/Plantas/Dashboard';
import PlantasCycles from './pages/modules/Plantas/Cycles';
import PlantasStats from './pages/modules/Plantas/Stats';
import PlantasComparativa from './pages/modules/Plantas/Comparativa';
import VoltajeGraficas from './components/Sensorvoltaje/VoltajeGraficas';

// IMPORTAR MÓDULO DE VOLTAJE
import VoltajeDashboard from './pages/modules/Voltaje/VoltajeDashboard';
import VoltajeStats from './pages/modules/Voltaje/VoltajeStats';
import VoltajeHistorico from './pages/modules/Voltaje/VoltajeHistorico';

import { ModeProvider } from './context/ModeContext';
import './styles/global.css';

function App() {
  return (
    <BrowserRouter>
      <ModeProvider>
        <Navbar />
        <Routes>
          {/* Página principal */}
          <Route path="/" element={<Home />} />

          {/* Página de módulos */}
          <Route path="/modulos" element={<Modulos />} />

          {/* Módulo de Luminarias */}
          <Route path="/modulos/luminarias" element={<PlantasDashboard />} />
          <Route path="/modulos/luminarias/ciclos" element={<PlantasCycles />} />
          <Route path="/modulos/luminarias/estadisticas" element={<PlantasStats />} />
          <Route path="/modulos/luminarias/comparativa" element={<PlantasComparativa />} />

          {/* ✅ MÓDULO DE VOLTAJE - ACTIVADO */}
          <Route path="/modulos/voltaje" element={<VoltajeDashboard />} />
          <Route path="/modulos/voltaje/estadisticas" element={<VoltajeStats />} />
          <Route path="/modulos/voltaje/historico" element={<VoltajeHistorico />} />
          <Route path="/modulos/voltaje/graficas" element={<VoltajeGraficas />} />

          {/* Mantenimiento (futuro) */}
          <Route path="/mantenimiento" element={<Navigate to="/" replace />} />

          {/* Redirecciones de compatibilidad */}
          <Route path="/dashboard" element={<Navigate to="/modulos/luminarias" replace />} />
          <Route path="/modulos/plantas" element={<Navigate to="/modulos/luminarias" replace />} />
          <Route path="/modulos/plantas/ciclos" element={<Navigate to="/modulos/luminarias/ciclos" replace />} />
          <Route path="/modulos/plantas/estadisticas" element={<Navigate to="/modulos/luminarias/estadisticas" replace />} />

          {/* 404 */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </ModeProvider>
    </BrowserRouter>
  );
}

export default App;
