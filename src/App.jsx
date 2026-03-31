import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import Modulos from './pages/Modulos';

//MÃ³dulo planta
import PlantasDashboard from './pages/modules/Plantas/Dashboard';
import PlantasCycles from './pages/modules/Plantas/Cycles';
import PlantasStats from './pages/modules/Plantas/Stats';
import PlantasComparativa from './pages/modules/Plantas/Comparativa';

//MÃ³dulo voltaje
import VoltajeGraficas from './components/Sensorvoltaje/VoltajeGraficas';
import VoltajeDashboard from './pages/modules/Voltaje/VoltajeDashboard';
import VoltajeStats from './pages/modules/Voltaje/VoltajeStats';
import VoltajeHistorico from './pages/modules/Voltaje/VoltajeHistorico';

// Archivo de contexto para graficas.
import { ModeProvider } from './context/ModeContext';
import './styles/global.css';

// Sistema de Mantenimiento.
import Equipos from './pages/Mantenimiento/Equipos';
import Ordenes from './pages/Mantenimiento/Ordenes';
import Papelera from './pages/Mantenimiento/Papelera';
import DetalleEquipo from './pages/Mantenimiento/DetalleEquipo';

function App() {
  return (
    <BrowserRouter>
      <ModeProvider>
        <Navbar />
        <Routes>
          {/* PÃ¡gina principal */}
          <Route path="/" element={<Home />} />

          {/* PÃ¡gina de mÃ³dulos */}
          <Route path="/modulos" element={<Modulos />} />

          {/* MÃ³dulo de Luminarias */}
          <Route path="/modulos/luminarias" element={<PlantasDashboard />} />
          <Route path="/modulos/luminarias/ciclos" element={<PlantasCycles />} />
          <Route path="/modulos/luminarias/estadisticas" element={<PlantasStats />} />
          <Route path="/modulos/luminarias/comparativa" element={<PlantasComparativa />} />

          {/* MÃ³dulo de voltaje */}
          <Route path="/modulos/voltaje" element={<VoltajeDashboard />} />
          <Route path="/modulos/voltaje/estadisticas" element={<VoltajeStats />} />
          <Route path="/modulos/voltaje/historico" element={<VoltajeHistorico />} />
          <Route path="/modulos/voltaje/graficas" element={<VoltajeGraficas />} />

          {/* Mantenimiento (futuro) */}
          <Route path="/mantenimiento/equipos" element={<Equipos />} />
          <Route path="/mantenimiento/ordenes" element={<Ordenes />} />
          <Route path="/mantenimiento/papelera" element={<Papelera />} />
          <Route path="/mantenimiento/equipo/:id" element={<DetalleEquipo />} />

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

