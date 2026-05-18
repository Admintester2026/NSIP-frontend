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
    const response = await fetch(url);
    const data = await handleResponse(response);
    return data.datos || [];
  },

  getEquipoById: async (id) => {
    const url = `${API_BASE}/mantenimiento/equipos/${id}`;
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
    const response = await fetch(url, { method: 'DELETE' });
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
  
  getMantenimientosByEquipo: async (equipoId) => {
    const url = `${API_BASE}/mantenimiento/mantenimientos/equipo/${equipoId}`;
    const response = await fetch(url);
    const data = await handleResponse(response);
    return data.datos || [];
  },

  createMantenimiento: async (mantenimientoData) => {
    const url = `${API_BASE}/mantenimiento/mantenimientos`;
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(mantenimientoData)
    });
    return handleResponse(response);
  },

  updateMantenimientoEstado: async (id, estado, notas = null) => {
    const url = `${API_BASE}/mantenimiento/mantenimientos/${id}/estado`;
    const response = await fetch(url, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ estado, notas_completado: notas })
    });
    return handleResponse(response);
  },

  // Actualizar mantenimiento (reprogramar)
  updateMantenimiento: async (id, data) => {
    const url = `${API_BASE}/mantenimiento/mantenimientos/${id}`;
    const response = await fetch(url, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    return handleResponse(response);
  },

  // Eliminar mantenimiento pendiente
  deleteMantenimiento: async (id) => {
    const url = `${API_BASE}/mantenimiento/mantenimientos/${id}`;
    const response = await fetch(url, { method: 'DELETE' });
    return handleResponse(response);
  },

  // Editar mantenimiento completado (con historial)
  editarMantenimientoCompletado: async (id, data) => {
    const url = `${API_BASE}/mantenimiento/mantenimientos/${id}/editar`;
    const response = await fetch(url, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        notas_completado: data.notas_completado,
        tecnico: data.tecnico,
        duracion: data.duracion,
        materiales_usados: data.materiales_usados,
        costo_materiales: data.costo_materiales,
        observaciones: data.observaciones || ''
      })
    });
    return handleResponse(response);
  },

  // Obtener historial de versiones de un mantenimiento
  getHistorialVersiones: async (id) => {
    const url = `${API_BASE}/mantenimiento/mantenimientos/${id}/historial-versiones`;
    const response = await fetch(url);
    const data = await handleResponse(response);
    return data.datos || [];
  },

  // ==========================================
  // INCIDENCIAS / DAÑOS
  // ==========================================
  
  getIncidenciasByEquipo: async (equipoId) => {
    const url = `${API_BASE}/mantenimiento/incidencias/equipo/${equipoId}`;
    const response = await fetch(url);
    const data = await handleResponse(response);
    return data.datos || [];
  },

  createIncidencia: async (incidenciaData) => {
    const url = `${API_BASE}/mantenimiento/incidencias`;
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(incidenciaData)
    });
    return handleResponse(response);
  },

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
  
  getOrdenes: async (estado = null) => {
    const url = estado 
      ? `${API_BASE}/mantenimiento/ordenes?estado=${estado}`
      : `${API_BASE}/mantenimiento/ordenes`;
    const response = await fetch(url);
    const data = await handleResponse(response);
    return data.datos || [];
  },

  createOrden: async (ordenData) => {
    const url = `${API_BASE}/mantenimiento/ordenes`;
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(ordenData)
    });
    return handleResponse(response);
  },

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
  
  getHistorialEquipo: async (equipoId) => {
    const url = `${API_BASE}/mantenimiento/equipos/${equipoId}/historial`;
    const response = await fetch(url);
    const data = await handleResponse(response);
    return data.datos || [];
  },

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