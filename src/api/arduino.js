//const API_BASE = 'http://192.168.3.124:3000/api/arduino-plantas';     --> para pruebas locales
const API_BASE = '/api/arduino-plantas';

// Helper para manejar respuestas
async function handleResponse(response) {
  if (!response.ok) {
    const error = await response.text();
    throw new Error(`HTTP ${response.status}: ${error}`);
  }
  const data = await response.json();
  return data;
}

export const arduinoAPI = {
  // Obtener estado actual del Arduino
  getStatus: async () => {
    const response = await fetch(`${API_BASE}/status`);
    const data = await handleResponse(response);
    return data.data;
  },

  // Obtener último registro de SQL
  getUltimo: async () => {
    const response = await fetch(`${API_BASE}/ultimo`);
    const data = await handleResponse(response);
    return data;
  },

  // Obtener estadísticas diarias
  getStats: async () => {
    const response = await fetch(`${API_BASE}/stats`);
    const data = await handleResponse(response);
    return data;
  },

  // Obtener ciclos configurados
  getCycles: async () => {
    const response = await fetch(`${API_BASE}/cycles`);
    const data = await handleResponse(response);
    return data;
  },

  // Obtener histórico (últimos 100 registros)
  getHistorico: async () => {
    const response = await fetch(`${API_BASE}/historico`);
    const data = await handleResponse(response);
    return data.datos || [];
  },

  // Obtener histórico de hoy
  getHistoricoHoy: async () => {
    const response = await fetch(`${API_BASE}/historico/hoy`);
    const data = await handleResponse(response);
    return data.datos || [];
  },

  // Buscar registros
  buscarRegistros: async (termino) => {
    const response = await fetch(`${API_BASE}/buscar?q=${encodeURIComponent(termino)}`);
    const data = await response.json();
    return data.datos || [];
  },

  // Controlar relé
  setRelay: async (relay, state) => {
    const response = await fetch(`${API_BASE}/relay`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ relay, state })
    });
    return handleResponse(response);
  },

  // Cambiar modo
  setMode: async (mode) => {
    const response = await fetch(`${API_BASE}/mode`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ mode })
    });
    return handleResponse(response);
  },

  // Guardar ciclo
  setCycle: async (cycleData) => {
    const response = await fetch(`${API_BASE}/cycle`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(cycleData)
    });
    return handleResponse(response);
  }
};