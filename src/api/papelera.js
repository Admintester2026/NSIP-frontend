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

export const papeleraAPI = {
  getEquipos: async () => {
    const response = await fetch(`${API_BASE}/papelera/equipos`);
    const data = await handleResponse(response);
    return data.datos || [];
  },

  restaurarEquipo: async (id) => {
    const response = await fetch(`${API_BASE}/papelera/equipos/${id}/restaurar`, {
      method: 'POST'
    });
    return handleResponse(response);
  },

  eliminarPermanentemente: async (id) => {
    const response = await fetch(`${API_BASE}/papelera/equipos/${id}/permanente`, {
      method: 'DELETE'
    });
    return handleResponse(response);
  },

  vaciarPapelera: async () => {
    const response = await fetch(`${API_BASE}/papelera/vaciar`, {
      method: 'DELETE'
    });
    return handleResponse(response);
  }
};