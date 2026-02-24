const { Contacto, Empleado, Usuario, EspacioTrabajo, Contrato, Rol, Permiso } = require('../models');
const { Op } = require('sequelize');

// Helper: verifica si el usuario en sesión tiene un permiso específico en el módulo contactos
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
        p => p.modulo === 'contactos'
    );

    // El módulo no tiene permisos configurados en este rol → pasa
    if (permisosDelModulo.length === 0) return true;

    // Verificar si tiene la acción especifica
    return permisosDelModulo.some(p => p.accion === accion);
};

// Include estándar con empleado
const includeEmpleado = [{
    model: Empleado,
    as: 'empleado',
    include: [
        { model: Usuario, as: 'usuario', attributes: ['nombre', 'apellido'] },
        { model: EspacioTrabajo, as: 'espacioTrabajo', attributes: ['id', 'nombre'] }
    ]
}];

// Obtener todos los contactos con filtros y paginación
const getAll = async (req, res) => {
    try {
        const { nombre, empleadoId, activo, dni, parentesco, tipo, espacioTrabajoId, page = 1, limit = 10 } = req.query;
        const where = {};

        // Filtro de activo
        if (activo === 'false') {
            where.activo = false;
        } else if (activo === 'all') {
            // No filtrar
        } else {
            where.activo = true;
        }

        if (nombre) where.nombreCompleto = { [Op.like]: `%${nombre}%` };
        if (dni) where.dni = { [Op.like]: `%${dni}%` };
        if (parentesco) where.parentesco = parentesco;
        if (tipo === 'Familiar') where.esFamiliar = true;
        if (tipo === 'Emergencia') where.esContactoEmergencia = true;

        // --- Filtrado por Espacio de Trabajo y Permisos ---
        const usuarioSesionId = req.session.usuarioId || req.session.empleadoId;
        const esAdmin = req.session.esAdministrador;

        if (!esAdmin) {
            const empleadoSesion = await Empleado.findOne({ where: { usuarioId: usuarioSesionId } });

            if (empleadoSesion) {
                // ES EMPLEADO — verificar permisos de escritura (equivale a "puede ver todos del workspace")
                const tienePermisoVerTodos = await tienePermiso(req.session, 'crear') ||
                    await tienePermiso(req.session, 'actualizar') ||
                    await tienePermiso(req.session, 'eliminar');

                if (tienePermisoVerTodos) {
                    // Puede ver los contactos de todos los empleados de su workspace
                    const empleadosWorkspace = await Empleado.findAll({
                        where: { espacioTrabajoId: empleadoSesion.espacioTrabajoId },
                        attributes: ['id']
                    });
                    const idsWs = empleadosWorkspace.map(e => e.id);

                    if (empleadoId) {
                        if (!idsWs.includes(parseInt(empleadoId))) {
                            return res.json({ data: [], pagination: { total: 0, page: 1, limit: 10, totalPages: 0 } });
                        }
                        where.empleadoId = empleadoId;
                    } else {
                        where.empleadoId = { [Op.in]: idsWs };
                    }

                    // Validar filtro de espacio (debe ser el suyo)
                    if (espacioTrabajoId && parseInt(espacioTrabajoId) !== empleadoSesion.espacioTrabajoId) {
                        return res.json({ data: [], pagination: { total: 0, page: 1, limit: 10, totalPages: 0 } });
                    }

                } else {
                    // Solo ve sus propios contactos
                    if (empleadoId && parseInt(empleadoId) !== empleadoSesion.id) {
                        return res.json({ data: [], pagination: { total: 0, page: 1, limit: 10, totalPages: 0 } });
                    }
                    where.empleadoId = empleadoSesion.id;
                }

            } else {
                // ES PROPIETARIO (no empleado) → ve los contactos de empleados de sus espacios
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
                    targetEspacios = [parseInt(espacioTrabajoId)];
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
                    where.empleadoId = -1; // Ninguno permitido
                }
            }

        } else {
            // ADMIN GLOBAL
            if (empleadoId) where.empleadoId = empleadoId;
            if (espacioTrabajoId) {
                const empleadosWs = await Empleado.findAll({ where: { espacioTrabajoId }, attributes: ['id'] });
                const ids = empleadosWs.map(e => e.id);
                if (empleadoId && !ids.includes(parseInt(empleadoId))) {
                    return res.json({ data: [], pagination: { total: 0, page: 1, limit: 10, totalPages: 0 } });
                }
                if (!empleadoId) where.empleadoId = { [Op.in]: ids };
            }
        }

        const offset = (parseInt(page) - 1) * parseInt(limit);

        const { count, rows } = await Contacto.findAndCountAll({
            where,
            include: includeEmpleado,
            order: [['nombreCompleto', 'ASC']],
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

// Obtener contacto por ID
const getById = async (req, res) => {
    try {
        const contacto = await Contacto.findByPk(req.params.id, { include: includeEmpleado });

        if (!contacto) {
            return res.status(404).json({ error: 'Contacto no encontrado' });
        }

        res.json(contacto);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Verificar DNI duplicado para el mismo empleado
const checkDuplicateDNI = async (empleadoId, dni, excludeId = null) => {
    const where = { empleadoId, dni, activo: true };
    if (excludeId) where.id = { [Op.ne]: excludeId };
    const existing = await Contacto.findOne({ where });
    return existing !== null;
};

// Crear contacto
const create = async (req, res) => {
    try {
        // Verificar permiso de creación
        if (!(await tienePermiso(req.session, 'crear'))) {
            return res.status(403).json({ error: 'No tiene permiso para crear contactos' });
        }

        const { empleadoId, dni } = req.body;

        const isDuplicate = await checkDuplicateDNI(empleadoId, dni);
        if (isDuplicate) {
            return res.status(400).json({ error: `Ya existe un contacto con el DNI ( ${dni} ) para el empleado` });
        }

        const contacto = await Contacto.create(req.body);

        const contactoWithRelations = await Contacto.findByPk(contacto.id, { include: includeEmpleado });
        res.status(201).json(contactoWithRelations);
    } catch (error) {
        if (error.name === 'SequelizeValidationError') {
            const messages = error.errors.map(e => e.message);
            return res.status(400).json({ error: messages.join(', ') });
        }
        res.status(500).json({ error: error.message });
    }
};

// Actualizar contacto
const update = async (req, res) => {
    try {
        // Verificar permiso de edición
        if (!(await tienePermiso(req.session, 'actualizar'))) {
            return res.status(403).json({ error: 'No tiene permiso para editar contactos' });
        }

        const contacto = await Contacto.findByPk(req.params.id);
        if (!contacto) {
            return res.status(404).json({ error: 'Contacto no encontrado' });
        }

        const { empleadoId, dni } = req.body;

        const isDuplicate = await checkDuplicateDNI(
            empleadoId || contacto.empleadoId,
            dni || contacto.dni,
            contacto.id
        );
        if (isDuplicate) {
            return res.status(400).json({ error: `Ya existe un contacto con el DNI ( ${dni} ) para el empleado` });
        }

        await contacto.update(req.body);

        const contactoWithRelations = await Contacto.findByPk(contacto.id, { include: includeEmpleado });
        res.json(contactoWithRelations);
    } catch (error) {
        if (error.name === 'SequelizeValidationError') {
            const messages = error.errors.map(e => e.message);
            return res.status(400).json({ error: messages.join(', ') });
        }
        res.status(500).json({ error: error.message });
    }
};

// Eliminar contacto (eliminación lógica)
const remove = async (req, res) => {
    try {
        // Verificar permiso de eliminación
        if (!(await tienePermiso(req.session, 'eliminar'))) {
            return res.status(403).json({ error: 'No tiene permiso para desactivar contactos' });
        }

        const contacto = await Contacto.findByPk(req.params.id);
        if (!contacto) {
            return res.status(404).json({ error: 'Contacto no encontrado' });
        }

        await contacto.update({ activo: false });
        res.json({ message: 'Contacto desactivado correctamente' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Reactivar contacto
const reactivate = async (req, res) => {
    try {
        const contacto = await Contacto.findByPk(req.params.id);
        if (!contacto) {
            return res.status(404).json({ error: 'Contacto no encontrado' });
        }

        await contacto.update({ activo: true });

        const contactoWithRelations = await Contacto.findByPk(contacto.id, { include: includeEmpleado });
        res.json(contactoWithRelations);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Eliminar múltiples contactos (eliminación lógica en lote)
const bulkRemove = async (req, res) => {
    try {
        // Verificar permiso de eliminación
        if (!(await tienePermiso(req.session, 'eliminar'))) {
            return res.status(403).json({ error: 'No tiene permiso para desactivar contactos en lote' });
        }

        const { ids } = req.body;
        if (!ids || !Array.isArray(ids) || ids.length === 0) {
            return res.status(400).json({ error: 'Se requiere un array de IDs' });
        }

        await Contacto.update({ activo: false }, { where: { id: ids } });
        res.json({ message: `${ids.length} contacto(s) desactivado(s) correctamente` });
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
    reactivate,
    bulkRemove,
};
