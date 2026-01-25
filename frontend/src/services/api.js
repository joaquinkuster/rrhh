const API_URL = '/api';

// ===== Cache para APIs Externas =====
const cache = {
    nacionalidades: null,
    provincias: null,
    ciudades: {},
};

// Nacionalidades desde REST Countries (con cache)
export const getNacionalidades = async () => {
    if (cache.nacionalidades) return cache.nacionalidades;

    try {
        const response = await fetch('https://restcountries.com/v3.1/all?fields=name,demonyms');
        if (!response.ok) throw new Error('Error al obtener nacionalidades');
        const data = await response.json();

        const nacionalidades = data
            .map(country => {
                const demonym = country.demonyms?.spa?.m ||
                    country.demonyms?.spa?.f ||
                    country.demonyms?.eng?.m ||
                    country.name.common;
                return demonym;
            })
            .filter(n => n)
            .sort();

        cache.nacionalidades = [...new Set(nacionalidades)];
        return cache.nacionalidades;
    } catch (error) {
        console.error('Error al obtener nacionalidades:', error);
        return ['Argentino', 'Brasileño', 'Chileno', 'Paraguayo', 'Uruguayo', 'Boliviano', 'Peruano', 'Colombiano', 'Mexicano', 'Español'];
    }
};

// Provincias de Argentina desde Georef (con cache)
export const getProvincias = async () => {
    if (cache.provincias) return cache.provincias;

    try {
        const response = await fetch('https://apis.datos.gob.ar/georef/api/provincias?campos=id,nombre&max=50');
        if (!response.ok) throw new Error('Error al obtener provincias');
        const data = await response.json();
        cache.provincias = data.provincias.sort((a, b) => a.nombre.localeCompare(b.nombre));
        return cache.provincias;
    } catch (error) {
        console.error('Error al obtener provincias:', error);
        return [];
    }
};

// Municipios/Ciudades por provincia desde Georef (con cache)
export const getCiudades = async (provinciaId) => {
    if (!provinciaId) return [];
    if (cache.ciudades[provinciaId]) return cache.ciudades[provinciaId];

    try {
        const response = await fetch(`https://apis.datos.gob.ar/georef/api/municipios?provincia=${provinciaId}&campos=id,nombre&max=200`);
        if (!response.ok) throw new Error('Error al obtener ciudades');
        const data = await response.json();
        cache.ciudades[provinciaId] = data.municipios.sort((a, b) => a.nombre.localeCompare(b.nombre));
        return cache.ciudades[provinciaId];
    } catch (error) {
        console.error('Error al obtener ciudades:', error);
        return [];
    }
};

// ===== Empleados =====
export const getEmpleados = async (filters = {}) => {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== '') params.append(key, value);
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

export const reactivateEmpleado = async (id) => {
    const response = await fetch(`${API_URL}/empleados/${id}/reactivate`, {
        method: 'PATCH',
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || 'Error al reactivar empleado');
    return result;
};

export const deleteEmpleadosBulk = async (ids) => {
    const response = await fetch(`${API_URL}/empleados/bulk`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids }),
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || 'Error al eliminar empleados');
    return result;
};

// ===== Empresas =====
export const getEmpresas = async ({ search = '', page = 1, limit = 10, activo } = {}) => {
    const params = new URLSearchParams();
    if (search) params.append('search', search);
    params.append('page', page);
    params.append('limit', limit);
    if (activo !== undefined) params.append('activo', activo);

    const response = await fetch(`${API_URL}/empresas?${params.toString()}`);
    if (!response.ok) throw new Error('Error al obtener empresas');
    return response.json();
};

export const getEmpresaById = async (id) => {
    const response = await fetch(`${API_URL}/empresas/${id}`);
    if (!response.ok) throw new Error('Error al obtener empresa');
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

export const updateEmpresa = async (id, data) => {
    const response = await fetch(`${API_URL}/empresas/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || 'Error al actualizar empresa');
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

export const reactivateEmpresa = async (id) => {
    const response = await fetch(`${API_URL}/empresas/${id}/reactivate`, {
        method: 'PATCH',
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || 'Error al reactivar empresa');
    return result;
};

// Check if area/departamento/puesto can be deleted (no active contracts)
export const checkCanDeleteEmpresaItem = async (type, id) => {
    const response = await fetch(`${API_URL}/empresas/check-can-delete/${type}/${id}`);
    if (!response.ok) throw new Error('Error al verificar eliminación');
    return response.json();
};

// ===== Contratos =====
export const getContratos = async (filters = {}) => {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== '') params.append(key, value);
    });
    const query = params.toString() ? `?${params.toString()}` : '';
    const response = await fetch(`${API_URL}/contratos${query}`);
    if (!response.ok) throw new Error('Error al obtener contratos');
    return response.json();
};

export const getContratoById = async (id) => {
    const response = await fetch(`${API_URL}/contratos/${id}`);
    if (!response.ok) throw new Error('Error al obtener contrato');
    return response.json();
};

export const createContrato = async (data) => {
    const response = await fetch(`${API_URL}/contratos`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || 'Error al crear contrato');
    return result;
};

export const updateContrato = async (id, data) => {
    const response = await fetch(`${API_URL}/contratos/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || 'Error al actualizar contrato');
    return result;
};

export const deleteContrato = async (id) => {
    const response = await fetch(`${API_URL}/contratos/${id}`, {
        method: 'DELETE',
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || 'Error al eliminar contrato');
    return result;
};

export const deleteContratosBulk = async (ids) => {
    const response = await fetch(`${API_URL}/contratos/bulk`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids }),
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || 'Error al eliminar contratos');
    return result;
};

export const reactivateContrato = async (id) => {
    const response = await fetch(`${API_URL}/contratos/${id}/reactivate`, {
        method: 'PATCH',
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || 'Error al reactivar contrato');
    return result;
};

export const getPuestosConContrato = async (empleadoId) => {
    const response = await fetch(`${API_URL}/contratos/empleado/${empleadoId}/puestos-con-contrato`);
    if (!response.ok) throw new Error('Error al obtener puestos con contrato');
    return response.json();
};

// ===== Registros de Salud =====
export const getRegistrosSalud = async (filters = {}) => {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== '') params.append(key, value);
    });
    const query = params.toString() ? `?${params.toString()}` : '';
    const response = await fetch(`${API_URL}/registros-salud${query}`);
    if (!response.ok) throw new Error('Error al obtener registros de salud');
    return response.json();
};

export const getRegistroSaludById = async (id) => {
    const response = await fetch(`${API_URL}/registros-salud/${id}`);
    if (!response.ok) throw new Error('Error al obtener registro de salud');
    return response.json();
};

export const createRegistroSalud = async (data) => {
    const response = await fetch(`${API_URL}/registros-salud`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || 'Error al crear registro de salud');
    return result;
};

export const updateRegistroSalud = async (id, data) => {
    const response = await fetch(`${API_URL}/registros-salud/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || 'Error al actualizar registro de salud');
    return result;
};

export const deleteRegistroSalud = async (id) => {
    const response = await fetch(`${API_URL}/registros-salud/${id}`, {
        method: 'DELETE',
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || 'Error al eliminar registro de salud');
    return result;
};

export const deleteRegistrosSaludBulk = async (ids) => {
    const response = await fetch(`${API_URL}/registros-salud/bulk`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids }),
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || 'Error al eliminar registros de salud');
    return result;
};

export const reactivateRegistroSalud = async (id) => {
    const response = await fetch(`${API_URL}/registros-salud/${id}/reactivate`, {
        method: 'PATCH',
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || 'Error al reactivar registro de salud');
    return result;
};

// ===== Evaluaciones =====
export const getEvaluaciones = async (filters = {}) => {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== '') params.append(key, value);
    });
    const query = params.toString() ? `?${params.toString()}` : '';
    const response = await fetch(`${API_URL}/evaluaciones${query}`);
    if (!response.ok) throw new Error('Error al obtener evaluaciones');
    return response.json();
};

export const getEvaluacionById = async (id) => {
    const response = await fetch(`${API_URL}/evaluaciones/${id}`);
    if (!response.ok) throw new Error('Error al obtener evaluación');
    return response.json();
};

export const createEvaluacion = async (data) => {
    const response = await fetch(`${API_URL}/evaluaciones`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || 'Error al crear evaluación');
    return result;
};

export const updateEvaluacion = async (id, data) => {
    const response = await fetch(`${API_URL}/evaluaciones/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || 'Error al actualizar evaluación');
    return result;
};

export const deleteEvaluacion = async (id) => {
    const response = await fetch(`${API_URL}/evaluaciones/${id}`, {
        method: 'DELETE',
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || 'Error al eliminar evaluación');
    return result;
};

export const deleteEvaluacionesBulk = async (ids) => {
    const response = await fetch(`${API_URL}/evaluaciones/bulk`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids }),
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || 'Error al eliminar evaluaciones');
    return result;
};

export const reactivateEvaluacion = async (id) => {
    const response = await fetch(`${API_URL}/evaluaciones/${id}/reactivate`, {
        method: 'PATCH',
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || 'Error al reactivar evaluación');
    return result;
};

// ===== Contactos =====
export const getContactos = async (filters = {}) => {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== '') params.append(key, value);
    });
    const query = params.toString() ? `?${params.toString()}` : '';
    const response = await fetch(`${API_URL}/contactos${query}`);
    if (!response.ok) throw new Error('Error al obtener contactos');
    return response.json();
};

export const getContactoById = async (id) => {
    const response = await fetch(`${API_URL}/contactos/${id}`);
    if (!response.ok) throw new Error('Error al obtener contacto');
    return response.json();
};

export const createContacto = async (data) => {
    const response = await fetch(`${API_URL}/contactos`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || 'Error al crear contacto');
    return result;
};

export const updateContacto = async (id, data) => {
    const response = await fetch(`${API_URL}/contactos/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || 'Error al actualizar contacto');
    return result;
};

export const deleteContacto = async (id) => {
    const response = await fetch(`${API_URL}/contactos/${id}`, {
        method: 'DELETE',
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || 'Error al eliminar contacto');
    return result;
};

export const deleteContactosBulk = async (ids) => {
    const response = await fetch(`${API_URL}/contactos/bulk`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids }),
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || 'Error al eliminar contactos');
    return result;
};

export const reactivateContacto = async (id) => {
    const response = await fetch(`${API_URL}/contactos/${id}/reactivate`, {
        method: 'PATCH',
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || 'Error al reactivar contacto');
    return result;
};
