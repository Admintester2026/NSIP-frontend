import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { arduinoAPI } from '/src/api/arduino';

const ModeContext = createContext();

export function ModeProvider({ children }) {
  const [mode, setMode] = useState('auto');
  const [loading, setLoading] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(null);

  // Función para obtener el modo actual
  const fetchMode = useCallback(async () => {
    try {
      const status = await arduinoAPI.getStatus();
      const newMode = status.mode || 'auto';
      
      if (newMode !== mode) {
        console.log('🔄 Modo cambiado:', mode, '→', newMode);
        setMode(newMode);
      }
      
      setLastUpdated(new Date());
      return newMode;
    } catch (error) {
      console.error('Error obteniendo modo:', error);
      return mode;
    }
  }, [mode]);

  // Efecto para polling cada 5 segundos
  useEffect(() => {
    fetchMode(); // Primera carga
    
    const interval = setInterval(fetchMode, 5000);
    return () => clearInterval(interval);
  }, [fetchMode]);

  // Cambiar a modo automático
  const switchToAuto = useCallback(async () => {
    setLoading(true);
    try {
      console.log('📤 Cambiando a modo AUTO...');
      const result = await arduinoAPI.setMode('auto');
      console.log('✅ Respuesta:', result);
      
      // Esperar y verificar
      await new Promise(resolve => setTimeout(resolve, 1000));
      await fetchMode();
      
      return result;
    } catch (error) {
      console.error('Error cambiando a modo auto:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, [fetchMode]);

  // Cambiar a modo manual
  const switchToManual = useCallback(async () => {
    setLoading(true);
    try {
      console.log('📤 Cambiando a modo MANUAL...');
      const result = await arduinoAPI.setMode('manual');
      console.log('✅ Respuesta:', result);
      
      await new Promise(resolve => setTimeout(resolve, 1000));
      await fetchMode();
      
      return result;
    } catch (error) {
      console.error('Error cambiando a modo manual:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, [fetchMode]);

  const value = {
    mode,
    loading,
    lastUpdated,
    switchToAuto,
    switchToManual,
    fetchMode,
    isAuto: mode === 'auto',
    isManual: mode === 'manual'
  };

  return (
    <ModeContext.Provider value={value}>
      {children}
    </ModeContext.Provider>
  );
}

// Hook personalizado para usar el contexto
export function useMode() {
  const context = useContext(ModeContext);
  if (!context) {
    throw new Error('useMode debe usarse dentro de ModeProvider');
  }
  return context;
}