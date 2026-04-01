const API_BASE = import.meta.env.VITE_API_URL || '/api/mantenimiento';

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
  // Equipos
  getEquipos: async (estado = 'activo') => {
    // Si usa VITE_API_URL, ya incluye /api, así que solo agregamos /mantenimiento/equipos
    const baseUrl = API_BASE.endsWith('/api') ? API_BASE : `${API_BASE}/mantenimiento`;
    const url = estado ? `${baseUrl}/equipos?estado=${estado}` : `${baseUrl}/equipos`;
    const response = await fetch(url);
    const data = await handleResponse(response);
    return data.datos || [];
  },

  getEquipoById: async (id) => {
    const baseUrl = API_BASE.endsWith('/api') ? API_BASE : `${API_BASE}/mantenimiento`;
    const response = await fetch(`${baseUrl}/equipos/${id}`);
    const data = await handleResponse(response);
    return data.datos;
  },

  createEquipo: async (equipoData) => {
    const baseUrl = API_BASE.endsWith('/api') ? API_BASE : `${API_BASE}/mantenimiento`;
    const response = await fetch(`${baseUrl}/equipos`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(equipoData)
    });
    return handleResponse(response);
  },

  updateEquipo: async (id, equipoData) => {
    const baseUrl = API_BASE.endsWith('/api') ? API_BASE : `${API_BASE}/mantenimiento`;
    const response = await fetch(`${baseUrl}/equipos/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(equipoData)
    });
    return handleResponse(response);
  },

  deleteEquipo: async (id) => {
    const baseUrl = API_BASE.endsWith('/api') ? API_BASE : `${API_BASE}/mantenimiento`;
    const response = await fetch(`${baseUrl}/equipos/${id}`, {
      method: 'DELETE'
    });
    return handleResponse(response);
  },

  cambiarEstado: async (id, estado) => {
    const baseUrl = API_BASE.endsWith('/api') ? API_BASE : `${API_BASE}/mantenimiento`;
    const response = await fetch(`${baseUrl}/equipos/${id}/estado`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ estado })
    });
    return handleResponse(response);
  },

  // Categorías
  getCategorias: async () => {
    const baseUrl = API_BASE.endsWith('/api') ? API_BASE : `${API_BASE}/mantenimiento`;
    const response = await fetch(`${baseUrl}/categorias`);
    const data = await handleResponse(response);
    return data.datos || [];
  },

  createCategoria: async (categoriaData) => {
    const baseUrl = API_BASE.endsWith('/api') ? API_BASE : `${API_BASE}/mantenimiento`;
    const response = await fetch(`${baseUrl}/categorias`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(categoriaData)
    });
    return handleResponse(response);
  }
};