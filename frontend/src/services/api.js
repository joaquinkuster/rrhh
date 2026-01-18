const API_URL = '/api';

// ===== Nacionalidades =====
export const getNacionalidades = async (search = '') => {
    const params = search ? `?search=${encodeURIComponent(search)}` : '';
    const response = await fetch(`${API_URL}/nacionalidades${params}`);
    if (!response.ok) throw new Error('Error al obtener nacionalidades');
    return response.json();
};

export const getNacionalidadById = async (id) => {
    const response = await fetch(`${API_URL}/nacionalidades/${id}`);
    if (!response.ok) throw new Error('Error al obtener nacionalidad');
    return response.json();
};

export const createNacionalidad = async (data) => {
    const response = await fetch(`${API_URL}/nacionalidades`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || 'Error al crear nacionalidad');
    return result;
};

export const updateNacionalidad = async (id, data) => {
    const response = await fetch(`${API_URL}/nacionalidades/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || 'Error al actualizar nacionalidad');
    return result;
};

export const deleteNacionalidad = async (id) => {
    const response = await fetch(`${API_URL}/nacionalidades/${id}`, {
        method: 'DELETE',
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || 'Error al eliminar nacionalidad');
    return result;
};

// ===== Empleados =====
export const getEmpleados = async (filters = {}) => {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
        if (value) params.append(key, value);
    });
    const query = params.toString() ? `?${params.toString()}` : '';
    const response = await fetch(`${API_URL}/empleados${query}`);
    if (!response.ok) throw new Error('Error al obtener empleados');
    return response.json();
};

export const getEmpleadoById = async (id) => {
    const response = await fetch(`${API_URL}/empleados/${id}`);
    if (!response.ok) throw new Error('Error al obtener empleado');
    return response.json();
};

export const createEmpleado = async (data) => {
    const response = await fetch(`${API_URL}/empleados`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || 'Error al crear empleado');
    return result;
};

export const updateEmpleado = async (id, data) => {
    const response = await fetch(`${API_URL}/empleados/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || 'Error al actualizar empleado');
    return result;
};

export const deleteEmpleado = async (id) => {
    const response = await fetch(`${API_URL}/empleados/${id}`, {
        method: 'DELETE',
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || 'Error al eliminar empleado');
    return result;
};

// ===== Empresas =====
export const getEmpresas = async (params = {}) => {
    const query = new URLSearchParams();
    if (params.search) query.append('search', params.search);
    if (params.page) query.append('page', params.page);
    if (params.limit) query.append('limit', params.limit);

    const queryString = query.toString() ? `?${query.toString()}` : '';
    const response = await fetch(`${API_URL}/empresas${queryString}`);
    if (!response.ok) throw new Error('Error al obtener empresas');
    return response.json();
};

export const createEmpresa = async (data) => {
    const response = await fetch(`${API_URL}/empresas`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || 'Error al crear empresa');
    return result;
};

export const deleteEmpresa = async (id) => {
    const response = await fetch(`${API_URL}/empresas/${id}`, {
        method: 'DELETE',
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || 'Error al eliminar empresa');
    return result;
};

export const deleteEmpresasBulk = async (ids) => {
    const response = await fetch(`${API_URL}/empresas/bulk`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids }),
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || 'Error al eliminar empresas');
    return result;
};
