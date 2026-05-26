// src/api/mantenimiento.js
const API_BASE = import.meta.env.VITE_API_URL;

// Normalizar URLs para que apunten al backend correctamente
function normalizeUrl(url) {
  if (!url) return null;
  // Si ya es una URL completa (http o https), devolverla tal cual
  if (url.startsWith('http://') || url.startsWith('https://')) {
    return url;
  }
  // Si la URL comienza con /uploads, agregar la base del backend
  if (url.startsWith('/uploads')) {
    // Eliminar /api de API_BASE para obtener la base del backend
    const backendBase = API_BASE ? API_BASE.replace('/api', '') : '';
    return `${backendBase}${url}`;
  }
  return url;
}

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
    const equipos = data.datos || [];
    
    // Normalizar URLs de todos los equipos
    return equipos.map(equipo => ({
      ...equipo,
      foto_url: normalizeUrl(equipo.foto_url),
      ficha_tecnica_url: normalizeUrl(equipo.ficha_tecnica_url),
      manual_url: normalizeUrl(equipo.manual_url)
    }));
  },

  getEquipoById: async (id) => {
    const url = `${API_BASE}/mantenimiento/equipos/${id}`;
    const response = await fetch(url);
    const data = await handleResponse(response);
    const equipo = data.datos;
    
    if (equipo) {
      equipo.foto_url = normalizeUrl(equipo.foto_url);
      equipo.ficha_tecnica_url = normalizeUrl(equipo.ficha_tecnica_url);
      equipo.manual_url = normalizeUrl(equipo.manual_url);
    }
    
    return equipo;
  },

  createEquipo: async (equipoData) => {
    const url = `${API_BASE}/mantenimiento/equipos`;
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(equipoData)
    });
    const result = await handleResponse(response);
    return result;
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
    const mantenimientos = data.datos || [];
    
    // Normalizar URLs de evidencias en mantenimientos
    return mantenimientos.map(m => ({
      ...m,
      evidencias_urls: m.evidencias_urls?.map(normalizeUrl) || []
    }));
  },

  createMantenimiento: async (mantenimientoData) => {
    const url = `${API_BASE}/mantenimiento/mantenimientos`;
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(mantenimientoData)
    });
    const result = await handleResponse(response);
    return result;
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

  updateMantenimiento: async (id, data) => {
    const url = `${API_BASE}/mantenimiento/mantenimientos/${id}`;
    const response = await fetch(url, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    return handleResponse(response);
  },

  deleteMantenimiento: async (id) => {
    const url = `${API_BASE}/mantenimiento/mantenimientos/${id}`;
    const response = await fetch(url, { method: 'DELETE' });
    return handleResponse(response);
  },

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
    const incidencias = data.datos || [];
    
    // Normalizar URLs de evidencias en incidencias
    return incidencias.map(i => ({
      ...i,
      evidencias_urls: i.evidencias_urls?.map(normalizeUrl) || []
    }));
  },

  createIncidencia: async (incidenciaData) => {
    const url = `${API_BASE}/mantenimiento/incidencias`;
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(incidenciaData)
    });
    const result = await handleResponse(response);
    return {
      ok: result.ok,
      id: result.id,
      message: result.message
    };
  },

  // ACTUALIZAR INCIDENCIA CON HISTORIAL
  updateIncidencia: async (id, incidenciaData) => {
    const url = `${API_BASE}/mantenimiento/incidencias/${id}`;
    const response = await fetch(url, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(incidenciaData)
    });
    return handleResponse(response);
  },

  // OBTENER HISTORIAL DE VERSIONES DE INCIDENCIA
  getHistorialVersionesIncidencia: async (id) => {
    const url = `${API_BASE}/mantenimiento/incidencias/${id}/historial-versiones`;
    const response = await fetch(url);
    const data = await handleResponse(response);
    return data.datos || [];
  },

  updateIncidenciaEvidencias: async (id, evidenciasUrls) => {
    const url = `${API_BASE}/mantenimiento/incidencias/${id}/evidencias`;
    const response = await fetch(url, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ evidencias_urls: evidenciasUrls })
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
  // HISTORIAL DE EQUIPOS / CAMBIOS
  // ==========================================
  
  getHistorialEquipo: async (equipoId) => {
    const url = `${API_BASE}/mantenimiento/equipos/${equipoId}/historial`;
    const response = await fetch(url);
    const data = await handleResponse(response);
    const historial = data.datos || [];
    
    // Normalizar URLs de facturas en historial
    return historial.map(h => ({
      ...h,
      facturas_urls: h.facturas_urls?.map(normalizeUrl) || []
    }));
  },

  registrarCambio: async (equipoId, cambioData) => {
    const url = `${API_BASE}/mantenimiento/equipos/${equipoId}/historial`;
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(cambioData)
    });
    const result = await handleResponse(response);
    return {
      ok: result.ok,
      id: result.id,
      message: result.message
    };
  },

  updateHistorial: async (id, historialData) => {
    const url = `${API_BASE}/mantenimiento/historial/${id}`;
    const response = await fetch(url, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(historialData)
    });
    return handleResponse(response);
  },

  updateHistorialFacturas: async (id, facturasUrls) => {
    const url = `${API_BASE}/mantenimiento/historial/${id}/facturas`;
    const response = await fetch(url, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ facturas_urls: facturasUrls })
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
  // SUBIDA DE ARCHIVOS (UTILIDAD)
  // ==========================================
  
  uploadFile: async (file, tipo, entidadId) => {
    const formData = new FormData();
    formData.append('archivo', file);
    formData.append('tipo', tipo);
    formData.append('entidad_id', entidadId);
    
    const response = await fetch(`${API_BASE}/mantenimiento/upload`, {
      method: 'POST',
      body: formData
    });
    const result = await handleResponse(response);
    // La URL que devuelve el backend es relativa, hay que normalizarla
    return normalizeUrl(result.url);
  },

  uploadMultipleFiles: async (files, tipo, entidadId, onProgress) => {
    const uploadedUrls = [];
    for (let i = 0; i < files.length; i++) {
      if (onProgress) {
        onProgress(Math.round(((i + 1) / files.length) * 100));
      }
      const url = await mantenimientoAPI.uploadFile(files[i], tipo, entidadId);
      uploadedUrls.push(url);
    }
    return uploadedUrls;
  }
};