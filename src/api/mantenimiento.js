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
  // ==========================================
  // EQUIPOS
  // ==========================================
  
  getEquipos: async (estado = 'activo') => {
    const url = `${API_BASE}/mantenimiento/equipos${estado ? `?estado=${estado}` : ''}`;
    console.log('URL getEquipos:', url);
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

  cambiarEstado: async (id, estado) => {
    const url = `${API_BASE}/mantenimiento/equipos/${id}/estado`;
    const response = await fetch(url, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ estado })
    });
    return handleResponse(response);
  },

  // ==========================================
  // CATEGORÍAS
  // ==========================================
  
  getCategorias: async () => {
    const url = `${API_BASE}/mantenimiento/categorias`;
    console.log('URL getCategorias:', url);
    const response = await fetch(url);
    const data = await handleResponse(response);
    return data.datos || [];
  },

  createCategoria: async (categoriaData) => {
    const url = `${API_BASE}/mantenimiento/categorias`;
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(categoriaData)
    });
    return handleResponse(response);
  },

  // ==========================================
  // MANTENIMIENTOS
  // ==========================================
  
  // Obtener todos los mantenimientos de un equipo
  getMantenimientosByEquipo: async (equipoId) => {
    const url = `${API_BASE}/mantenimiento/mantenimientos/equipo/${equipoId}`;
    console.log('URL getMantenimientosByEquipo:', url);
    const response = await fetch(url);
    const data = await handleResponse(response);
    return data.datos || [];
  },

  // Crear un nuevo mantenimiento
  createMantenimiento: async (mantenimientoData) => {
    const url = `${API_BASE}/mantenimiento/mantenimientos`;
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(mantenimientoData)
    });
    return handleResponse(response);
  },

  // Actualizar estado de un mantenimiento (completar/cancelar)
  updateMantenimientoEstado: async (id, estado, notas = null) => {
    const url = `${API_BASE}/mantenimiento/mantenimientos/${id}/estado`;
    const response = await fetch(url, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ estado, notas_completado: notas })
    });
    return handleResponse(response);
  },

  // Obtener último mantenimiento de un equipo (para tarjeta)
  getUltimoMantenimiento: async (equipoId) => {
    const url = `${API_BASE}/mantenimiento/equipos/${equipoId}/ultimo-mantenimiento`;
    const response = await fetch(url);
    const data = await handleResponse(response);
    return data.datos;
  },

  // Obtener próximo mantenimiento de un equipo (para tarjeta)
  getProximoMantenimiento: async (equipoId) => {
    const url = `${API_BASE}/mantenimiento/equipos/${equipoId}/proximo-mantenimiento`;
    const response = await fetch(url);
    const data = await handleResponse(response);
    return data.datos;
  },

  // ==========================================
  // INCIDENCIAS / DAÑOS
  // ==========================================
  
  // Obtener incidencias de un equipo
  getIncidenciasByEquipo: async (equipoId) => {
    const url = `${API_BASE}/mantenimiento/incidencias/equipo/${equipoId}`;
    const response = await fetch(url);
    const data = await handleResponse(response);
    return data.datos || [];
  },

  // Reportar una incidencia/daño
  createIncidencia: async (incidenciaData) => {
    const url = `${API_BASE}/mantenimiento/incidencias`;
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(incidenciaData)
    });
    return handleResponse(response);
  },

  // Actualizar estado de una incidencia
  updateIncidenciaEstado: async (id, estado, solucion = null) => {
    const url = `${API_BASE}/mantenimiento/incidencias/${id}/estado`;
    const response = await fetch(url, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ estado, solucion })
    });
    return handleResponse(response);
  },

  // ==========================================
  // ÓRDENES DE TRABAJO
  // ==========================================
  
  // Obtener órdenes de trabajo (con filtro por estado)
  getOrdenes: async (estado = null) => {
    const url = estado 
      ? `${API_BASE}/mantenimiento/ordenes?estado=${estado}`
      : `${API_BASE}/mantenimiento/ordenes`;
    const response = await fetch(url);
    const data = await handleResponse(response);
    return data.datos || [];
  },

  // Crear una orden de trabajo
  createOrden: async (ordenData) => {
    const url = `${API_BASE}/mantenimiento/ordenes`;
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(ordenData)
    });
    return handleResponse(response);
  },

  // Actualizar estado de una orden de trabajo
  updateOrdenEstado: async (id, estado, observaciones = null) => {
    const url = `${API_BASE}/mantenimiento/ordenes/${id}/estado`;
    const response = await fetch(url, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ estado, observaciones })
    });
    return handleResponse(response);
  },

  // ==========================================
  // HISTORIAL DE CAMBIOS
  // ==========================================
  
  // Obtener historial de cambios de un equipo
  getHistorialEquipo: async (equipoId) => {
    const url = `${API_BASE}/mantenimiento/equipos/${equipoId}/historial`;
    const response = await fetch(url);
    const data = await handleResponse(response);
    return data.datos || [];
  },

  // Registrar un cambio manual en el historial
  registrarCambio: async (equipoId, cambioData) => {
    const url = `${API_BASE}/mantenimiento/equipos/${equipoId}/historial`;
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(cambioData)
    });
    return handleResponse(response);
  }
};