// Usar variable de entorno de Vercel, o ruta relativa como fallback
const API_BASE = import.meta.env.VITE_API_URL 
  ? `${import.meta.env.VITE_API_URL}/arduino-voltaje`
  : '/api/arduino-voltaje';

console.log('🔧 [voltaje.js] API_BASE:', API_BASE); // Para debugging

async function handleResponse(response) {
  if (!response.ok) {
    const error = await response.text();
    throw new Error(`HTTP ${response.status}: ${error}`);
  }
  const data = await response.json();
  return data;
}

export const voltajeAPI = {
  // Obtener estado actual del Arduino
  getStatus: async () => {
    const response = await fetch(`${API_BASE}/status`);
    const data = await handleResponse(response);
    return data.data;
  },

  // Obtener último registro SQL
  getUltimo: async () => {
    const response = await fetch(`${API_BASE}/ultimo`);
    const data = await handleResponse(response);
    return data.datos;
  },

  // Obtener histórico
  // Obtener histórico con límite variable
    getHistorico: async (limite = 100) => {
      // Agregar el parámetro limite a la URL
      const response = await fetch(`${API_BASE}/historico?limite=${limite}`);
      const data = await handleResponse(response);
      return data.datos || [];
    },

  // Buscar registros
  buscarRegistros: async (termino) => {
    const response = await fetch(`${API_BASE}/buscar?q=${encodeURIComponent(termino)}`);
    const data = await response.json();
    return data.datos || [];
  },

  // Obtener estadísticas
  getStats: async () => {
    const response = await fetch(`${API_BASE}/stats`);
    const data = await handleResponse(response);
    return data.data;
  },

  // Obtener resumen rápido
  getResumen: async () => {
    const response = await fetch(`${API_BASE}/resumen`);
    const data = await handleResponse(response);
    return data.data;
  }
};