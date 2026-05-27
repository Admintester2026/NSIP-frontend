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

export const ordenesAPI = {
  getOrdenes: async (filtros = {}) => {
    const params = new URLSearchParams();
    if (filtros.estado && filtros.estado !== 'todos') params.append('estado', filtros.estado);
    if (filtros.equipo_id) params.append('equipo_id', filtros.equipo_id);
    if (filtros.fecha_desde) params.append('fecha_desde', filtros.fecha_desde);
    if (filtros.fecha_hasta) params.append('fecha_hasta', filtros.fecha_hasta);
    if (filtros.busqueda) params.append('busqueda', filtros.busqueda);
    if (filtros.incluir_papelera) params.append('incluir_papelera', 'true');
    
    const url = `${API_BASE}/ordenes${params.toString() ? `?${params.toString()}` : ''}`;
    const response = await fetch(url);
    const data = await handleResponse(response);
    return data.datos || [];
  },

  getOrdenById: async (id) => {
    const response = await fetch(`${API_BASE}/ordenes/${id}`);
    const data = await handleResponse(response);
    return data.datos;
  },

  getEstadisticas: async () => {
    const response = await fetch(`${API_BASE}/ordenes/estadisticas`);
    const data = await handleResponse(response);
    return data.datos;
  }
};