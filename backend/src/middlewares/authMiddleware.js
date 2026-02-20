const { Empleado, Contrato, Rol, Permiso } = require('../models');

// Middleware de autenticación
const isAuthenticated = (req, res, next) => {
    if (req.session && req.session.empleadoId) {
        return next();
    }
    return res.status(401).json({
        error: 'No autorizado. Debe iniciar sesión.'
    });
};

// Middleware de autorización - solo administradores
const isAdmin = (req, res, next) => {
    if (req.session && req.session.esAdministrador) {
        return next();
    }
    return res.status(403).json({
        error: 'Acceso denegado. Solo administradores pueden realizar esta acción.'
    });
};

// Middleware para verificar si puede editar empleado
const canEditEmployee = (req, res, next) => {
    const empleadoIdTarget = parseInt(req.params.id);
    const empleadoIdSesion = req.session.empleadoId;
    const esAdmin = req.session.esAdministrador;

    if (esAdmin) return next();

    if (empleadoIdTarget === empleadoIdSesion) return next();

    return res.status(403).json({
        error: 'No tiene permisos para acceder a esta información.'
    });
};

/**
 * Middleware de permisos por módulo.
 * - Admin global → pasa siempre.
 * - No empleado (propietario/externo) → pasa siempre.
 * - Empleado sin contrato seleccionado → pasa (sin restricción configurada).
 * - Empleado sin permisos en su rol para este módulo → pasa (no configurado = sin restricción).
 * - Empleado con permisos para el módulo pero SIN la acción solicitada → 403.
 *
 * @param {string} modulo  Nombre del módulo, ej: 'empleados'
 * @param {string} accion  'ver' | 'crear' | 'editar' | 'eliminar'
 */
const requirePermiso = (modulo, accion) => async (req, res, next) => {
    try {
        if (req.session.esAdministrador) return next();

        const usuarioId = req.session.usuarioId || req.session.empleadoId;

        const empleado = await Empleado.findOne({ where: { usuarioId } });

        // No es empleado (propietario/externo) → puede pasar
        if (!empleado) return next();

        // Es empleado sin contrato seleccionado → pasa (sin permisos configurados)
        if (!empleado.ultimoContratoSeleccionadoId) return next();

        const contrato = await Contrato.findByPk(empleado.ultimoContratoSeleccionadoId, {
            include: [{
                model: Rol,
                as: 'rol',
                include: [{ model: Permiso, as: 'permisos', through: { attributes: [] } }]
            }]
        });

        // Sin rol asignado al contrato → pasa (sin restricción configurada)
        if (!contrato?.rol) return next();

        const permisosDelModulo = (contrato.rol.permisos || []).filter(
            p => p.modulo === modulo
        );

        // El módulo no tiene permisos configurados en este rol → pasa
        if (permisosDelModulo.length === 0) return next();

        // El módulo SÍ tiene permisos configurados: verificar que incluya la acción
        const tiene = permisosDelModulo.some(p => p.accion === accion);

        if (!tiene) {
            return res.status(403).json({
                error: `No tiene permiso para "${accion}" en el módulo "${modulo}".`
            });
        }

        return next();
    } catch (err) {
        console.error('requirePermiso error:', err);
        return res.status(500).json({ error: err.message });
    }
};

module.exports = {
    isAuthenticated,
    isAdmin,
    canEditEmployee,
    requirePermiso,
};
