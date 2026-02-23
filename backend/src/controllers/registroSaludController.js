const { RegistroSalud, Empleado, Usuario, EspacioTrabajo, Contrato, Rol, Permiso, Licencia } = require('../models');
const { Op } = require('sequelize');

// Helper: verifica si el usuario en sesión tiene un permiso específico en el módulo registros_salud
const tienePermiso = async (session, accion) => {
    if (session.esAdministrador) return true;
    const usuarioId = session.usuarioId || session.empleadoId;
    const empleado = await Empleado.findOne({ where: { usuarioId } });

    // No es empleado (propietario/externo) → pasa siempre
    if (!empleado) return true;

    // Es empleado sin contrato seleccionado → pasa (sin restricción configurada)
    if (!empleado.ultimoContratoSeleccionadoId) return true;

    const contrato = await Contrato.findByPk(empleado.ultimoContratoSeleccionadoId, {
        include: [{ model: Rol, as: 'rol', include: [{ model: Permiso, as: 'permisos', through: { attributes: [] } }] }]
    });

    // Sin rol asignado al contrato → pasa
    if (!contrato?.rol) return true;

    const permisosDelModulo = (contrato.rol.permisos || []).filter(
        p => p.modulo === 'registros_salud'
    );

    // El módulo no tiene permisos configurados en este rol → pasa
    if (permisosDelModulo.length === 0) return true;

    // Verificar si tiene la acción especifica
    return permisosDelModulo.some(p => p.accion === accion);
};

// Include para obtener empleado
const includeEmpleado = [{
    model: Empleado,
    as: 'empleado',
    include: [
        {
            model: Usuario,
            as: 'usuario',
            attributes: ['nombre', 'apellido']
        },
        {
            model: EspacioTrabajo,
            as: 'espacioTrabajo',
            attributes: ['id', 'nombre']
        }
    ]
}];

// Obtener todos los registros de salud con paginación y filtros
const getAll = async (req, res) => {
    try {
        const { search, page = 1, limit = 10, activo, tipoExamen, resultado, empleadoId, vigente, espacioTrabajoId } = req.query;
        const where = {};

        // --- Filtrado por Espacio de Trabajo y Permisos ---
        const usuarioSesionId = req.session.usuarioId || req.session.empleadoId;
        const esAdmin = req.session.esAdministrador;
        const filtrosEmpleados = []; // Array de IDs permitidos

        if (!esAdmin) {
            // Buscar si es empleado
            const empleadoSesion = await Empleado.findOne({ where: { usuarioId: usuarioSesionId } });

            if (empleadoSesion) {
                // Verificar usando el helper si tiene permisos de escritura (equivale a "puede ver todos")
                const tienePermisoVerTodos = await tienePermiso(req.session, 'crear') ||
                    await tienePermiso(req.session, 'actualizar') ||
                    await tienePermiso(req.session, 'eliminar');

                if (tienePermisoVerTodos) {
                    // Puede ver todo el workspace
                    const empleadosWorkspace = await Empleado.findAll({
                        where: { espacioTrabajoId: empleadoSesion.espacioTrabajoId },
                        attributes: ['id']
                    });
                    const idsWs = empleadosWorkspace.map(e => e.id);

                    if (empleadoId) {
                        // Si pide uno específico, validar que sea del ws
                        if (!idsWs.includes(parseInt(empleadoId))) {
                            return res.json({ data: [], pagination: { total: 0, page: 1, limit: 10, totalPages: 0 } });
                        }
                        where.empleadoId = empleadoId;
                    } else {
                        where.empleadoId = { [Op.in]: idsWs };
                    }
                } else {
                    // Solo ve sus propios registros
                    where.empleadoId = empleadoSesion.id;
                    // Si pidió otro empleadoId, lo ignoramos o retornamos vacío (por seguridad, forzamos el suyo)
                    if (empleadoId && parseInt(empleadoId) !== empleadoSesion.id) {
                        return res.json({ data: [], pagination: { total: 0, page: 1, limit: 10, totalPages: 0 } });
                    }
                }
            } else {
                // ES PROPIETARIO (No empleado)
                const espaciosPropios = await EspacioTrabajo.findAll({
                    where: { propietarioId: usuarioSesionId },
                    attributes: ['id']
                });
                const espaciosIds = espaciosPropios.map(e => e.id);

                let targetEspacios = espaciosIds;
                if (espacioTrabajoId) {
                    if (!espaciosIds.includes(parseInt(espacioTrabajoId))) {
                        return res.json({ data: [], pagination: { total: 0, page: 1, limit: 10, totalPages: 0 } });
                    }
                    targetEspacios = [espacioTrabajoId];
                }

                const empleadosDeWorkspaces = await Empleado.findAll({
                    where: { espacioTrabajoId: { [Op.in]: targetEspacios } },
                    attributes: ['id']
                });
                const idsPermitidos = empleadosDeWorkspaces.map(e => e.id);

                if (empleadoId) {
                    if (!idsPermitidos.includes(parseInt(empleadoId))) {
                        return res.json({ data: [], pagination: { total: 0, page: 1, limit: 10, totalPages: 0 } });
                    }
                    where.empleadoId = empleadoId;
                } else if (idsPermitidos.length > 0) {
                    where.empleadoId = { [Op.in]: idsPermitidos };
                } else {
                    where.empleadoId = -1; // Ninguno
                }
            }
        } else {
            // ADMIN GLOBAL
            if (empleadoId) where.empleadoId = empleadoId;
            // Si quisiera filtrar por espacioTrabajoId siendo admin
            if (espacioTrabajoId) {
                const empleadosWs = await Empleado.findAll({ where: { espacioTrabajoId } });
                const ids = empleadosWs.map(e => e.id);
                if (empleadoId && !ids.includes(parseInt(empleadoId))) {
                    return res.json({ data: [], pagination: { total: 0, page: 1, limit: 10, totalPages: 0 } });
                }
                if (!empleadoId) where.empleadoId = { [Op.in]: ids };
            }
        }

        // Filtro de activo
        if (activo === 'false') {
            where.activo = false;
        } else if (activo === 'all') {
            // No filtrar
        } else {
            where.activo = true;
        }

        // Filtro por tipo de examen
        if (tipoExamen) {
            where.tipoExamen = tipoExamen;
        }

        // Filtro por resultado
        if (resultado) {
            where.resultado = resultado;
        }

        // Filtro por vigente
        if (vigente) {
            where.vigente = vigente === 'true';
        }

        const offset = (parseInt(page) - 1) * parseInt(limit);

        const { count, rows } = await RegistroSalud.findAndCountAll({
            where,
            include: includeEmpleado,
            order: [['fechaRealizacion', 'DESC']],
            limit: parseInt(limit),
            offset,
        });

        res.json({
            data: rows,
            pagination: {
                total: count,
                page: parseInt(page),
                limit: parseInt(limit),
                totalPages: Math.ceil(count / parseInt(limit)),
            },
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: error.message });
    }
};

// Obtener registro por ID
const getById = async (req, res) => {
    try {
        const registro = await RegistroSalud.findByPk(req.params.id, {
            include: includeEmpleado
        });

        if (!registro) {
            return res.status(404).json({ error: 'Registro de salud no encontrado' });
        }

        res.json(registro);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Crear registro de salud
const create = async (req, res) => {
    try {
        // Verificar permiso de creación
        if (!(await tienePermiso(req.session, 'crear'))) {
            return res.status(403).json({ error: 'No tiene permiso para crear registros de salud' });
        }

        const { tipoExamen, resultado, fechaRealizacion, fechaVencimiento, comprobante, comprobanteNombre, comprobanteTipo, comprobantes, empleadoId } = req.body;

        // Validar empleado
        if (!empleadoId) {
            return res.status(400).json({ error: 'Debe seleccionar un empleado' });
        }

        const empleado = await Empleado.findByPk(empleadoId);
        if (!empleado) {
            return res.status(404).json({ error: 'Empleado no encontrado' });
        }

        // Crear el registro
        const nuevoRegistro = await RegistroSalud.create({
            tipoExamen,
            resultado,
            fechaRealizacion,
            fechaVencimiento,
            comprobante: comprobante || null,
            comprobanteNombre: comprobanteNombre || null,
            comprobanteTipo: comprobanteTipo || null,
            comprobantes: comprobantes || [],
            empleadoId,
        });

        // Retornar registro con empleado
        const registroConEmpleado = await RegistroSalud.findByPk(nuevoRegistro.id, {
            include: includeEmpleado
        });

        res.status(201).json(registroConEmpleado);
    } catch (error) {
        if (error.name === 'SequelizeValidationError') {
            const messages = error.errors.map(e => e.message);
            return res.status(400).json({ error: messages.join(', ') });
        }
        res.status(500).json({ error: error.message });
    }
};

// Actualizar registro de salud
const update = async (req, res) => {
    try {
        // Verificar permiso de edición
        if (!(await tienePermiso(req.session, 'actualizar'))) {
            return res.status(403).json({ error: 'No tiene permiso para editar registros de salud' });
        }

        const { id } = req.params;
        const { tipoExamen, resultado, fechaRealizacion, fechaVencimiento, comprobante, comprobanteNombre, comprobanteTipo, comprobantes, empleadoId } = req.body;

        const registro = await RegistroSalud.findByPk(id);
        if (!registro) {
            return res.status(404).json({ error: 'Registro de salud no encontrado' });
        }

        // Validar empleado si se envía
        if (empleadoId) {
            const empleado = await Empleado.findByPk(empleadoId);
            if (!empleado) {
                return res.status(404).json({ error: 'Empleado no encontrado' });
            }
        }

        // Actualizar campos
        await registro.update({
            tipoExamen,
            resultado,
            fechaRealizacion,
            fechaVencimiento,
            comprobante: comprobante || null,
            comprobanteNombre: comprobanteNombre || null,
            comprobanteTipo: comprobanteTipo || null,
            comprobantes: comprobantes || [],
            empleadoId: empleadoId || registro.empleadoId,
        });

        // Retornar registro actualizado
        const registroActualizado = await RegistroSalud.findByPk(id, {
            include: includeEmpleado
        });

        res.json(registroActualizado);
    } catch (error) {
        if (error.name === 'SequelizeValidationError') {
            const messages = error.errors.map(e => e.message);
            return res.status(400).json({ error: messages.join(', ') });
        }
        res.status(500).json({ error: error.message });
    }
};

// Eliminar registro (eliminación lógica)
const remove = async (req, res) => {
    try {
        // Verificar permiso de eliminación
        if (!(await tienePermiso(req.session, 'eliminar'))) {
            return res.status(403).json({ error: 'No tiene permiso para desactivar registros de salud' });
        }

        const registro = await RegistroSalud.findByPk(req.params.id);

        if (!registro) {
            return res.status(404).json({ error: 'Registro de salud no encontrado' });
        }

        // --- Verificaciones de entidades asociadas activas ---
        const licenciasActivas = await Licencia.count({ where: { registroSaludId: registro.id, activo: true } });
        if (licenciasActivas > 0) {
            return res.status(400).json({ error: `No se puede desactivar el registro de salud porque tiene ${licenciasActivas} licencia(s) activa(s). Primero desactive las licencias.` });
        }

        await registro.update({ activo: false });
        res.json({ message: 'Registro de salud desactivado correctamente' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Eliminar registros en lote (eliminación lógica)
const bulkRemove = async (req, res) => {
    try {
        // Verificar permiso de eliminación
        if (!(await tienePermiso(req.session, 'eliminar'))) {
            return res.status(403).json({ error: 'No tiene permiso para desactivar registros de salud en lote' });
        }

        const { ids } = req.body;

        if (!ids || !Array.isArray(ids) || ids.length === 0) {
            return res.status(400).json({ error: 'Se requiere un array de IDs' });
        }

        for (const id of ids) {
            const registro = await RegistroSalud.findByPk(id);
            if (!registro) continue;

            // --- Verificaciones de entidades asociadas activas ---
            const licenciasActivas = await Licencia.count({ where: { registroSaludId: registro.id, activo: true } });
            if (licenciasActivas > 0) {
                return res.status(400).json({ error: `No se puede desactivar el registro de salud porque tiene ${licenciasActivas} licencia(s) activa(s). Primero desactive las licencias.` });
            }
        }

        await RegistroSalud.update(
            { activo: false },
            { where: { id: { [Op.in]: ids } } }
        );

        res.json({ message: `${ids.length} registro(s) de salud desactivado(s) correctamente` });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Reactivar registro
const reactivate = async (req, res) => {
    try {
        const registro = await RegistroSalud.findByPk(req.params.id);

        if (!registro) {
            return res.status(404).json({ error: 'Registro de salud no encontrado' });
        }

        await registro.update({ activo: true });

        const registroReactivado = await RegistroSalud.findByPk(req.params.id, {
            include: includeEmpleado
        });

        res.json(registroReactivado);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

module.exports = {
    getAll,
    getById,
    create,
    update,
    remove,
    bulkRemove,
    reactivate,
};
