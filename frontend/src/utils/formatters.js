/**
 * Formatea una fecha DATEONLY (YYYY-MM-DD) a formato local sin problemas de zona horaria
 * @param {string} dateString - Fecha en formato YYYY-MM-DD
 * @returns {string} - Fecha formateada como DD/MM/YYYY o '-' si no hay fecha
 */
export const formatDateOnly = (dateString) => {
    if (!dateString) return '-';

    // Para fechas DATEONLY (YYYY-MM-DD), parseamos como fecha local
    const [year, month, day] = dateString.split('T')[0].split('-');
    const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));

    // Obtener los componentes formateados
    const dayStr = date.toLocaleDateString('es-AR', { day: '2-digit' });
    const monthStr = date.toLocaleDateString('es-AR', { month: 'short' });
    const yearStr = date.toLocaleDateString('es-AR', { year: 'numeric' });

    // Construir manualmente: "04 de dic de 1990"
    return `${dayStr} de ${monthStr} de ${yearStr}`;
};

/**
 * Formatea una fecha con hora (timestamp) a formato local
 * @param {string} dateString - Fecha ISO con hora
 * @returns {string} - Fecha formateada como DD/MM/YYYY HH:MM o '-' si no hay fecha
 */
export const formatDateTime = (dateString) => {
    if (!dateString) return '-';

    const date = new Date(dateString);
    return date.toLocaleDateString('es-AR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
};

/**
 * Formatea un valor monetario en pesos argentinos
 * @param {number} value - Valor numérico
 * @returns {string} - Valor formateado como moneda o '-' si no hay valor
 */
export const formatCurrency = (value) => {
    if (!value) return '-';
    return new Intl.NumberFormat('es-AR', {
        style: 'currency',
        currency: 'ARS'
    }).format(value);
};

/**
 * Truncate a text string to a specific length and append '...'
 * @param {string} text - The text to truncate
 * @param {number} maxLength - Maximum length before truncation
 * @returns {string} - Truncated string
 */
export const truncateText = (text, maxLength = 15) => {
    if (!text) return '-';
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
};
/**
 * Obtiene la fecha de hoy en formato local YYYY-MM-DD
 * @returns {string} - Fecha en formato YYYY-MM-DD
 */
export const getTodayStr = () => {
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};

/**
 * Formatea el nombre completo de un empleado o usuario, manejando estructuras anidadas (usuario) o planas.
 * @param {Object} person - Objeto del empleado o usuario
 * @returns {string} - "Apellido, Nombre"
 */
export const formatFullName = (person) => {
    if (!person) return '-';
    // Si viene de una relación anidada como contrato.empleado, person.usuario existirá.
    // Si viene de una respuesta aplanada del backend, nombre/apellido estarán en la raíz.
    const u = person.usuario || person;
    const apellido = u.apellido || person.apellido || 'Desconocido';
    const nombre = u.nombre || person.nombre || '';
    return nombre ? `${apellido}, ${nombre}` : apellido;
};
