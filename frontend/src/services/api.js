const API_URL = '/api';

// ===== Default fetch options with credentials =====
const fetchWithCredentials = (url, options = {}) => {
    return fetch(url, {
        ...options,
        credentials: 'include', // Incluir cookies en todas las peticiones
        headers: {
            'Content-Type': 'application/json',
            ...options.headers,
        },
    });
};

// ===== Autenticación =====
export const login = async (credentials) => {
    const response = await fetchWithCredentials(`${API_URL}/auth/login`, {
        method: 'POST',
        body: JSON.stringify(credentials),
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || 'Error al iniciar sesión');
    return result;
};

export const logout = async () => {
    const response = await fetchWithCredentials(`${API_URL}/auth/logout`, {
        method: 'POST',
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || 'Error al cerrar sesión');
    return result;
};

export const register = async (empleadoData) => {
    const response = await fetchWithCredentials(`${API_URL}/auth/register`, {
        method: 'POST',
        body: JSON.stringify(empleadoData),
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || 'Error al registrarse');
    return result;
};

export const getCurrentUser = async () => {
    const response = await fetchWithCredentials(`${API_URL}/auth/me`);
    if (response.status === 401) return null; // No autenticado
    if (!response.ok) throw new Error('Error al obtener usuario actual');
    return response.json();
};

export const updatePassword = async (passwordData) => {
    const response = await fetchWithCredentials(`${API_URL}/auth/password`, {
        method: 'PUT',
        body: JSON.stringify(passwordData),
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || 'Error al actualizar contraseña');
    return result;
};

export const updateMe = async (data) => {
    const response = await fetchWithCredentials(`${API_URL}/auth/me`, {
        method: 'PUT',
        body: JSON.stringify(data),
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || 'Error al actualizar perfil');
    return result;
};

export const updateSelectedContract = async (contratoId) => {
    const response = await fetchWithCredentials(`${API_URL}/auth/selected-contract`, {
        method: 'PUT',
        body: JSON.stringify({ contratoId }),
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || 'Error al actualizar contrato seleccionado');
    return result;
};

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
        if (value !== undefined && value !== null && value !== '') {
            params.append(key, value);
        }
    });
    const query = params.toString() ? `?${params.toString()}` : '';
    const response = await fetchWithCredentials(`${API_URL}/empleados${query}`);
    if (!response.ok) throw new Error('Error al obtener empleados');
    return response.json();
};

export const getEmpleadoById = async (id) => {
    const response = await fetchWithCredentials(`${API_URL}/empleados/${id}`);
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
export const getEmpresas = async (filters = {}) => {
    const params = new URLSearchParams();

    // Defaults si no vienen en filters
    if (filters.page === undefined) params.append('page', 1);
    if (filters.limit === undefined) params.append('limit', 10);

    Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
            params.append(key, value);
        }
    });

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

// ===== Solicitudes =====
export const getSolicitudes = async (filters = {}) => {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== '') params.append(key, value);
    });
    const query = params.toString() ? `?${params.toString()}` : '';
    const response = await fetchWithCredentials(`${API_URL}/solicitudes${query}`);
    if (!response.ok) throw new Error('Error al obtener solicitudes');
    return response.json();
};

export const getSolicitudById = async (id) => {
    const response = await fetch(`${API_URL}/solicitudes/${id}`);
    if (!response.ok) throw new Error('Error al obtener solicitud');
    return response.json();
};

export const createSolicitud = async (data) => {
    const response = await fetch(`${API_URL}/solicitudes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || 'Error al crear solicitud');
    return result;
};

export const updateSolicitud = async (id, data) => {
    const response = await fetch(`${API_URL}/solicitudes/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || 'Error al actualizar solicitud');
    return result;
};

export const deleteSolicitud = async (id) => {
    const response = await fetch(`${API_URL}/solicitudes/${id}`, {
        method: 'DELETE',
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || 'Error al eliminar solicitud');
    return result;
};

export const deleteSolicitudesBulk = async (ids) => {
    const response = await fetch(`${API_URL}/solicitudes/bulk`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids }),
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || 'Error al eliminar solicitudes');
    return result;
};

export const reactivateSolicitud = async (id) => {
    const response = await fetch(`${API_URL}/solicitudes/${id}/reactivate`, {
        method: 'PATCH',
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || 'Error al reactivar solicitud');
    return result;
};

export const getDiasDisponiblesVacaciones = async (contratoId, periodo) => {
    const params = periodo ? `?periodo=${periodo}` : '';
    const response = await fetch(`${API_URL}/solicitudes/vacaciones/diasDisponibles/${contratoId}${params}`);
    if (!response.ok) throw new Error('Error al obtener días de vacaciones');
    return response.json();
};

export const getDiasSolicitadosVacaciones = async (fechaInicio, fechaFin) => {
    const params = new URLSearchParams({ fechaInicio, fechaFin });
    const response = await fetch(`${API_URL}/solicitudes/vacaciones/diasSolicitados?${params.toString()}`);
    if (!response.ok) throw new Error('Error al calcular días solicitados');
    return response.json();
};

// ===== LIQUIDACIONES =====
export const getLiquidaciones = async (params = {}) => {
    const queryParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
            queryParams.append(key, value);
        }
    });
    const response = await fetch(`${API_URL}/liquidaciones?${queryParams.toString()}`);
    if (!response.ok) throw new Error('Error al obtener liquidaciones');
    return response.json();
};

export const ejecutarLiquidacion = async () => {
    const response = await fetch(`${API_URL}/liquidaciones`, {
        method: 'POST',
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || 'Error al ejecutar liquidación');
    return result;
};


export const getLiquidacionById = async (id) => {
    const response = await fetch(`${API_URL}/liquidaciones/${id}`);
    if (!response.ok) throw new Error('Error al obtener liquidación');
    return response.json();
};

export const updateLiquidacion = async (id, liquidacion) => {
    const response = await fetch(`${API_URL}/liquidaciones/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(liquidacion),
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || 'Error al actualizar liquidación');
    return result;
};

export const deleteLiquidacion = async (id) => {
    const response = await fetch(`${API_URL}/liquidaciones/${id}`, {
        method: 'DELETE',
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || 'Error al eliminar liquidación');
    return result;
};

export const deleteLiquidacionesBulk = async (ids) => {
    const response = await fetch(`${API_URL}/liquidaciones/bulk`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids }),
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || 'Error al eliminar liquidaciones');
    return result;
};

export const reactivateLiquidacion = async (id) => {
    const response = await fetch(`${API_URL}/liquidaciones/${id}/reactivate`, {
        method: 'PATCH',
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || 'Error al reactivar liquidación');
    return result;
};

export const marcarLiquidacionComoPagada = async (id, estaPagada) => {
    const response = await fetch(`${API_URL}/liquidaciones/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ estaPagada }),
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || 'Error al actualizar liquidación');
    return result;
};

// ===== CONCEPTOS SALARIALES =====
export const getConceptosSalariales = async (params = {}) => {
    const queryParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
            queryParams.append(key, value);
        }
    });
    const response = await fetch(`${API_URL}/conceptos-salariales?${queryParams.toString()}`);
    if (!response.ok) throw new Error('Error al obtener conceptos salariales');
    return response.json();
};

export const getConceptoSalarialById = async (id) => {
    const response = await fetch(`${API_URL}/conceptos-salariales/${id}`);
    if (!response.ok) throw new Error('Error al obtener concepto salarial');
    return response.json();
};

export const createConceptoSalarial = async (concepto) => {
    const response = await fetch(`${API_URL}/conceptos-salariales`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(concepto),
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || 'Error al crear concepto salarial');
    return result;
};

export const updateConceptoSalarial = async (id, concepto) => {
    const response = await fetch(`${API_URL}/conceptos-salariales/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(concepto),
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || 'Error al actualizar concepto salarial');
    return result;
};

export const deleteConceptoSalarial = async (id) => {
    const response = await fetch(`${API_URL}/conceptos-salariales/${id}`, {
        method: 'DELETE',
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || 'Error al eliminar concepto salarial');
    return result;
};

// ===== PARÁMETROS LABORALES =====
export const getParametrosLaborales = async (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    const response = await fetchWithCredentials(`${API_URL}/parametros-laborales${queryString ? `?${queryString}` : ''}`);
    if (!response.ok) throw new Error('Error al obtener parámetros laborales');
    return response.json();
};

export const updateParametrosLaborales = async (parametrosData) => {
    const response = await fetchWithCredentials(`${API_URL}/parametros-laborales`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(parametrosData),
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || 'Error al actualizar parámetros laborales');
    return result;
};

// ===== FERIADOS =====
export const getFeriados = async () => {
    const response = await fetch(`${API_URL}/feriados`);
    if (!response.ok) throw new Error('Error al obtener feriados');
    return response.json();
};

// ===== DASHBOARD =====
export const getDashboardStats = async () => {
    const response = await fetch(`${API_URL}/dashboard/stats`);
    if (!response.ok) throw new Error('Error al obtener estadísticas del dashboard');
    return response.json();
};

// ===== REPORTES =====
export const getReportesEmpresa = async (empresaId) => {
    const response = await fetch(`${API_URL}/reportes/empresa/${empresaId}`);
    if (!response.ok) throw new Error('Error al obtener reportes de empresa');
    return response.json();
};

// ===== ROLES =====
export const getRoles = async (params = {}) => {
    const queryParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
            queryParams.append(key, value);
        }
    });

    const response = await fetch(`${API_URL}/roles?${queryParams.toString()}`);
    if (!response.ok) throw new Error('Error al obtener roles');
    return response.json();
};

export const getRolById = async (id) => {
    const response = await fetch(`${API_URL}/roles/${id}`);
    if (!response.ok) throw new Error('Error al obtener rol');
    return response.json();
};

export const createRol = async (rol) => {
    const response = await fetch(`${API_URL}/roles`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(rol),
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || 'Error al crear rol');
    return result;
};

export const updateRol = async (id, rol) => {
    const response = await fetch(`${API_URL}/roles/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(rol),
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || 'Error al actualizar rol');
    return result;
};

export const deleteRol = async (id) => {
    const response = await fetch(`${API_URL}/roles/${id}`, {
        method: 'DELETE',
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || 'Error al eliminar rol');
    return result;
};

export const reactivateRol = async (id) => {
    const response = await fetch(`${API_URL}/roles/${id}/reactivate`, {
        method: 'PATCH',
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || 'Error al reactivar rol');
    return result;
};

export const deleteRolesBulk = async (ids) => {
    const response = await fetch(`${API_URL}/roles/bulk`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids }),
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || 'Error al eliminar roles');
    return result;
};

// ===== PERMISOS =====
export const getPermisos = async () => {
    const response = await fetch(`${API_URL}/permisos`);
    if (!response.ok) throw new Error('Error al obtener permisos');
    return response.json();
};

export const getPermisosGrouped = async () => {
    const response = await fetch(`${API_URL}/permisos/grouped`);
    if (!response.ok) throw new Error('Error al obtener permisos agrupados');
    return response.json();
};

export const initializePermisos = async () => {
    const response = await fetch(`${API_URL}/permisos/initialize`, {
        method: 'POST',
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || 'Error al inicializar permisos');
    return result;
};

// ===== ESPACIOS DE TRABAJO =====
export const getEspaciosTrabajo = async (filters = {}) => {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
            params.append(key, value);
        }
    });
    const query = params.toString() ? `?${params.toString()}` : '';
    const response = await fetchWithCredentials(`${API_URL}/espacios-trabajo${query}`);
    if (!response.ok) throw new Error('Error al obtener espacios de trabajo');
    return response.json();
};

export const getEspacioTrabajoById = async (id) => {
    const response = await fetchWithCredentials(`${API_URL}/espacios-trabajo/${id}`);
    if (!response.ok) throw new Error('Error al obtener espacio de trabajo');
    return response.json();
};

export const createEspacioTrabajo = async (espacioData) => {
    const response = await fetchWithCredentials(`${API_URL}/espacios-trabajo`, {
        method: 'POST',
        body: JSON.stringify(espacioData),
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || 'Error al crear espacio de trabajo');
    return result;
};

export const updateEspacioTrabajo = async (id, espacioData) => {
    const response = await fetchWithCredentials(`${API_URL}/espacios-trabajo/${id}`, {
        method: 'PUT',
        body: JSON.stringify(espacioData),
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || 'Error al actualizar espacio de trabajo');
    return result;
};

export const deleteEspacioTrabajo = async (id) => {
    const response = await fetchWithCredentials(`${API_URL}/espacios-trabajo/${id}`, {
        method: 'DELETE',
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || 'Error al eliminar espacio de trabajo');
    return result;
};

export const reactivateEspacioTrabajo = async (id) => {
    const response = await fetchWithCredentials(`${API_URL}/espacios-trabajo/${id}/reactivate`, {
        method: 'PATCH',
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || 'Error al reactivar espacio de trabajo');
    return result;
};

export const deleteEspaciosTrabajoB = async (ids) => {
    const response = await fetchWithCredentials(`${API_URL}/espacios-trabajo/bulk`, {
        method: 'DELETE',
        body: JSON.stringify({ ids }),
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || 'Error al eliminar espacios de trabajo');
    return result;
};

// Validaciones de cambio de espacio de trabajo
export const canChangeEmpleadoWorkspace = async (empleadoId) => {
    const response = await fetchWithCredentials(`${API_URL}/espacios-trabajo/validation/empleado/${empleadoId}/can-change`);
    if (!response.ok) throw new Error('Error al verificar cambio de espacio de trabajo');
    return response.json();
};

export const canChangeEmpresaWorkspace = async (empresaId) => {
    const response = await fetchWithCredentials(`${API_URL}/espacios-trabajo/validation/empresa/${empresaId}/can-change`);
    if (!response.ok) throw new Error('Error al verificar cambio de espacio de trabajo');
    return response.json();
};

export const canChangeRolWorkspace = async (rolId) => {
    const response = await fetchWithCredentials(`${API_URL}/espacios-trabajo/validation/rol/${rolId}/can-change`);
    if (!response.ok) throw new Error('Error al verificar cambio de espacio de trabajo');
    return response.json();
};

// ===== Conceptos Salariales =====

// ===== Usuarios (propietarios de espacios) =====
export const getUsuarios = async (params = {}) => {
    const queryParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
            queryParams.append(key, value);
        }
    });
    const query = queryParams.toString();
    const response = await fetchWithCredentials(`${API_URL}/usuarios?${query}`);
    if (!response.ok) {
        const result = await response.json();
        throw new Error(result.error || 'Error al obtener usuarios');
    }
    return response.json();
};
