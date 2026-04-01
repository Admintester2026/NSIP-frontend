const API_BASE = import.meta.env.VITE_API_URL || 'http://192.168.3.65:3000/api/mantenimiento';

async function handleResponse(response) {
  if (!response.ok) {
    let errorMessage = `HTTP ${response.status}`;
    try {
      const error = await response.json();
      errorMessage = error.mensaje || error.error || errorMessage;
    } catch {
      errorMessage = await response.text() || errorMessage;
    }
    throw new Error(errorMessage);
  }
  const data = await response.json();
  return data;
}

export const mantenimientoAPI = {
  getEquipos: async (estado = 'activo') => {
    const url = estado ? `${API_BASE}/equipos?estado=${estado}` : `${API_BASE}/equipos`;
    const response = await fetch(url);
    const data = await handleResponse(response);
    return data.datos || [];
  },

  getEquipoById: async (id) => {
    const response = await fetch(`${API_BASE}/equipos/${id}`);
    const data = await handleResponse(response);
    return data.datos;
  },

  createEquipo: async (equipoData) => {
    const response = await fetch(`${API_BASE}/equipos`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(equipoData)
    });
    return handleResponse(response);
  },

  updateEquipo: async (id, equipoData) => {
    const response = await fetch(`${API_BASE}/equipos/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(equipoData)
    });
    return handleResponse(response);
  },

  deleteEquipo: async (id) => {
    const response = await fetch(`${API_BASE}/equipos/${id}`, {
      method: 'DELETE'
    });
    return handleResponse(response);
  },

  getCategorias: async () => {
    const response = await fetch(`${API_BASE}/categorias`);
    const data = await handleResponse(response);
    return data.datos || [];
  }
};