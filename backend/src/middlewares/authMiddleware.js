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

    // Admin puede editar cualquiera
    if (esAdmin) {
        return next();
    }

    // Un empleado solo puede ver (pero no necesariamente editar) su propia información
    // La lógica de si puede editar dependerá de creadoPorRrhh en el controlador
    if (empleadoIdTarget === empleadoIdSesion) {
        return next();
    }

    return res.status(403).json({
        error: 'No tiene permisos para acceder a esta información.'
    });
};

module.exports = {
    isAuthenticated,
    isAdmin,
    canEditEmployee,
};
