// src/api/mantenimiento.js
const API_BASE = import.meta.env.VITE_API_URL;

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
    const url = `${API_BASE}/mantenimiento/equipos${estado ? `?estado=${estado}` : ''}`;
    console.log('URL getEquipos:', url); // Para debug
    const response = await fetch(url);
    const data = await handleResponse(response);
    return data.datos || [];
  },

  getEquipoById: async (id) => {
    const url = `${API_BASE}/mantenimiento/equipos/${id}`;
    console.log('URL getEquipoById:', url);
    const response = await fetch(url);
    const data = await handleResponse(response);
    return data.datos;
  },

  createEquipo: async (equipoData) => {
    const url = `${API_BASE}/mantenimiento/equipos`;
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(equipoData)
    });
    return handleResponse(response);
  },

  updateEquipo: async (id, equipoData) => {
    const url = `${API_BASE}/mantenimiento/equipos/${id}`;
    const response = await fetch(url, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(equipoData)
    });
    return handleResponse(response);
  },

  deleteEquipo: async (id) => {
    const url = `${API_BASE}/mantenimiento/equipos/${id}`;
    const response = await fetch(url, {
      method: 'DELETE'
    });
    return handleResponse(response);
  },

  getCategorias: async () => {
    const url = `${API_BASE}/mantenimiento/categorias`;
    console.log('URL getCategorias:', url);
    const response = await fetch(url);
    const data = await handleResponse(response);
    return data.datos || [];
  }
};