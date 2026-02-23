const { Solicitud, Licencia, Vacaciones, HorasExtras, Renuncia, Contrato, Empleado, Puesto, Departamento, Area, Empresa, RegistroSalud, Usuario, EspacioTrabajo, Rol, Permiso } = require('../models');
const { Op } = require('sequelize');
const sequelize = require('../config/database');
const { esDiaHabil, parseLocalDate } = require('../utils/fechas');
const { calcularDiasCorrespondientesVacaciones, getDiasDisponiblesVacaciones, getDiasSolicitadosVacaciones } = require('../services/vacacionesService');

// Servicios de validación
const vacacionesService = require('../services/vacacionesService');
const licenciaService = require('../services/licenciaService');
const horasExtrasService = require('../services/horasExtrasService');
const renunciaService = require('../services/renunciaService');

// Helper: verifica si el usuario en sesión tiene un permiso específico en el módulo solicitudes
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
        p => p.modulo === 'solicitudes'
    );

    // El módulo no tiene permisos configurados en este rol → pasa
    if (permisosDelModulo.length === 0) return true;

    // Verificar si tiene la acción especifica
    return permisosDelModulo.some(p => p.accion === accion);
};


// Include relations for contract info
const includeContrato = {
    model: Contrato,
    as: 'contrato',
    include: [
        {
            model: Empleado,
            as: 'empleado',
            include: [
                {
                    model: Usuario,
                    as: 'usuario',
                    attributes: ['id', 'nombre', 'apellido']
                },
                {
                    model: EspacioTrabajo,
                    as: 'espacioTrabajo',
                    attributes: ['id', 'nombre']
                }
            ]
        },
        {
            model: Puesto,
            as: 'puestos',
            through: { attributes: [] },
            include: [{
                model: Departamento,
                as: 'departamento',
                include: [{
                    model: Area,
                    as: 'area',
                    include: [{
                        model: Empresa,
                        as: 'empresa'
                    }]
                }]
            }]
        }
    ]
};

// Include relations for each type
const includeTypes = [
    { model: Licencia, as: 'licencia', include: [{ model: RegistroSalud, as: 'registroSalud' }] },
    { model: Vacaciones, as: 'vacaciones' },
    { model: HorasExtras, as: 'horasExtras' },
    { model: Renuncia, as: 'renuncia' },
];

// Get all solicitudes with filters and pagination
const getAll = async (req, res) => {
    try {
        const { contratoId, empleadoId, espacioTrabajoId, tipoSolicitud, estado, activo, page = 1, limit = 10 } = req.query;
        const where = {};

        // Filtro de activo
        if (activo === 'false') {
            where.activo = false;
        } else if (activo === 'all') {
            // No filtrar
        } else {
            where.activo = true;
        }

        if (tipoSolicitud) where.tipoSolicitud = tipoSolicitud;

        // Filtro por estado usando notación $association.column$ de Sequelize (genera JOINs)
        if (estado) {
            const estadoVal = estado === 'pendiente'
                ? { [Op.or]: ['pendiente', ''] } // '' = legacy dato sin estado
                : estado;
            where[Op.and] = where[Op.and] || [];
            where[Op.and].push({
                [Op.or]: [
                    { '$licencia.estado$': estadoVal },
                    { '$vacaciones.estado$': estadoVal },
                    { '$horasExtras.estado$': estadoVal },
                    { '$renuncia.estado$': estadoVal },
                ]
            });
        }

        // --- Filtrado por Espacio de Trabajo y Permisos ---
        // Las solicitudes pertenecen a contratos, resolver: empleado → contratos → where.contratoId
        const usuarioSesionId = req.session.usuarioId || req.session.empleadoId;
        const esAdmin = req.session.esAdministrador;

        if (!esAdmin) {
            const empleadoSesion = await Empleado.findOne({ where: { usuarioId: usuarioSesionId } });

            if (empleadoSesion) {
                // ES EMPLEADO — verificar si tiene permisos de gestión (puede ver todos del workspace)
                const tienePermisoVerTodos = await tienePermiso(req.session, 'crear') ||
                    await tienePermiso(req.session, 'actualizar') ||
                    await tienePermiso(req.session, 'eliminar');

                if (tienePermisoVerTodos) {
                    // Puede ver las solicitudes de todos los empleados de su workspace
                    const empleadosWorkspace = await Empleado.findAll({
                        where: { espacioTrabajoId: empleadoSesion.espacioTrabajoId },
                        attributes: ['id']
                    });
                    const idsEmpleadosWs = empleadosWorkspace.map(e => e.id);

                    let whereContrato = { empleadoId: { [Op.in]: idsEmpleadosWs } };
                    if (empleadoId) {
                        if (!idsEmpleadosWs.includes(parseInt(empleadoId))) {
                            return res.json({ data: [], pagination: { total: 0, page: 1, limit: 10, totalPages: 0 } });
                        }
                        whereContrato = { empleadoId };
                    }
                    if (espacioTrabajoId && parseInt(espacioTrabajoId) !== empleadoSesion.espacioTrabajoId) {
                        return res.json({ data: [], pagination: { total: 0, page: 1, limit: 10, totalPages: 0 } });
                    }
                    const contratosPermitidos = await Contrato.findAll({ where: whereContrato, attributes: ['id'] });
                    where.contratoId = { [Op.in]: contratosPermitidos.map(c => c.id) };

                } else {
                    // Solo ve sus propias solicitudes
                    if (empleadoId && parseInt(empleadoId) !== empleadoSesion.id) {
                        return res.json({ data: [], pagination: { total: 0, page: 1, limit: 10, totalPages: 0 } });
                    }
                    const contratosPropio = await Contrato.findAll({
                        where: { empleadoId: empleadoSesion.id },
                        attributes: ['id']
                    });
                    where.contratoId = { [Op.in]: contratosPropio.map(c => c.id) };
                }

            } else {
                // ES PROPIETARIO (no empleado) → ve solicitudes de empleados de sus espacios
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

                let whereContrato = { empleadoId: { [Op.in]: idsPermitidos } };
                if (empleadoId) {
                    if (!idsPermitidos.includes(parseInt(empleadoId))) {
                        return res.json({ data: [], pagination: { total: 0, page: 1, limit: 10, totalPages: 0 } });
                    }
                    whereContrato = { empleadoId };
                }
                const contratosPermitidos = await Contrato.findAll({ where: whereContrato, attributes: ['id'] });
                const idsContratos = contratosPermitidos.map(c => c.id);
                where.contratoId = idsContratos.length > 0 ? { [Op.in]: idsContratos } : -1;
            }

        } else {
            // ADMIN GLOBAL — filtros opcionales
            if (contratoId) {
                where.contratoId = parseInt(contratoId);
            } else if (empleadoId || espacioTrabajoId) {
                let whereContratoAdmin = {};
                if (empleadoId) whereContratoAdmin.empleadoId = empleadoId;
                if (espacioTrabajoId) {
                    const empleadosWs = await Empleado.findAll({ where: { espacioTrabajoId }, attributes: ['id'] });
                    const idsWs = empleadosWs.map(e => e.id);
                    if (empleadoId && !idsWs.includes(parseInt(empleadoId))) {
                        return res.json({ data: [], pagination: { total: 0, page: 1, limit: 10, totalPages: 0 } });
                    }
                    if (!empleadoId) whereContratoAdmin.empleadoId = { [Op.in]: idsWs };
                }
                const contratosAdmin = await Contrato.findAll({ where: whereContratoAdmin, attributes: ['id'] });
                where.contratoId = { [Op.in]: contratosAdmin.map(c => c.id) };
            }
        }

        const offset = (parseInt(page) - 1) * parseInt(limit);

        let result = await Solicitud.findAndCountAll({
            where,
            include: [includeContrato, ...includeTypes],
            order: [['createdAt', 'DESC']],
            limit: parseInt(limit),
            offset,
            subQuery: false,
            distinct: true,
        });

        res.json({
            data: result.rows,
            pagination: {
                total: result.count,
                page: parseInt(page),
                limit: parseInt(limit),
                totalPages: Math.ceil(result.count / parseInt(limit)),
            },
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: error.message });
    }
};

// Get solicitud by ID
const getById = async (req, res) => {
    try {
        const solicitud = await Solicitud.findByPk(req.params.id, {
            include: [includeContrato, ...includeTypes],
        });

        if (!solicitud) {
            return res.status(404).json({ error: 'Solicitud no encontrada' });
        }

        res.json(solicitud);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Create solicitud
const create = async (req, res) => {
    const transaction = await sequelize.transaction();

    try {
        // Verificar permiso de creación
        if (!(await tienePermiso(req.session, 'crear'))) {
            await transaction.rollback();
            return res.status(403).json({ error: 'No tiene permiso para crear solicitudes' });
        }

        const { contratoId, tipoSolicitud, ...typeData } = req.body;

        // Validate contract exists and is active
        const contrato = await Contrato.findByPk(contratoId);
        if (!contrato) {
            await transaction.rollback();
            return res.status(400).json({ error: 'El contrato no existe' });
        }
        if (!contrato.activo) {
            await transaction.rollback();
            return res.status(400).json({ error: 'El contrato no está activo' });
        }

        // Validate no pending solicitudes for this contract
        const solicitudesPendientes = await Solicitud.findOne({
            where: {
                contratoId: contratoId,
                activo: true,
                [Op.and]: [{
                    [Op.or]: [
                        { '$licencia.estado$': { [Op.or]: ['pendiente', ''] } },
                        { '$vacaciones.estado$': { [Op.or]: ['pendiente', ''] } },
                        { '$horasExtras.estado$': { [Op.or]: ['pendiente', ''] } },
                        { '$renuncia.estado$': { [Op.or]: ['pendiente', ''] } }
                    ]
                }]
            },
            include: includeTypes
        });
        if (solicitudesPendientes) {
            return res.status(400).json({ error: 'No se puede crear la solicitud porque ya existe otra solicitud pendiente para este contrato' });
        }

        // Type-specific validations using services
        if (tipoSolicitud === 'vacaciones') {
            const validacion = await vacacionesService.validarVacaciones(contratoId, typeData);
            if (!validacion.valido) {
                await transaction.rollback();
                return res.status(400).json({ error: validacion.error });
            }
        }

        if (tipoSolicitud === 'licencia') {
            const validacion = await licenciaService.validarLicencia(contratoId, typeData);
            if (!validacion.valido) {
                await transaction.rollback();
                return res.status(400).json({ error: validacion.error });
            }
        }

        if (tipoSolicitud === 'horas_extras') {
            const validacion = await horasExtrasService.validarHorasExtras(contratoId, typeData);
            if (!validacion.valido) {
                await transaction.rollback();
                return res.status(400).json({ error: validacion.error });
            }
        }

        if (tipoSolicitud === 'renuncia') {
            const validacion = await renunciaService.validarRenuncia(contratoId);
            if (!validacion.valido) {
                await transaction.rollback();
                return res.status(400).json({ error: validacion.error });
            }
            // Auto-set fechaBajaEfectiva from service
            //typeData.fechaBajaEfectiva = validacion.fechaBajaEfectiva;
        }

        // Create base solicitud
        const solicitud = await Solicitud.create({
            contratoId,
            tipoSolicitud,
        }, { transaction });

        // Create type-specific record
        let typeRecord;
        switch (tipoSolicitud) {
            case 'licencia':
                typeRecord = await Licencia.create({
                    solicitudId: solicitud.id,
                    ...typeData,
                }, { transaction });
                break;
            case 'vacaciones':
                typeRecord = await Vacaciones.create({
                    solicitudId: solicitud.id,
                    ...typeData,
                }, { transaction });
                break;
            case 'horas_extras':
                typeRecord = await HorasExtras.create({
                    solicitudId: solicitud.id,
                    ...typeData,
                }, { transaction });
                break;
            case 'renuncia':
                typeRecord = await Renuncia.create({
                    solicitudId: solicitud.id,
                    ...typeData,
                }, { transaction });
                break;
            default:
                await transaction.rollback();
                return res.status(400).json({ error: 'Tipo de solicitud inválido' });
        }

        await transaction.commit();

        // Get full record with relations
        const fullSolicitud = await Solicitud.findByPk(solicitud.id, {
            include: [includeContrato, ...includeTypes],
        });

        res.status(201).json(fullSolicitud);
    } catch (error) {
        await transaction.rollback();
        if (error.name === 'SequelizeValidationError') {
            const messages = error.errors.map(e => e.message);
            return res.status(400).json({ error: messages.join(', ') });
        }
        res.status(500).json({ error: error.message });
    }
};

// Update solicitud
const update = async (req, res) => {
    const transaction = await sequelize.transaction();

    try {
        // Verificar permiso de edición
        if (!(await tienePermiso(req.session, 'actualizar'))) {
            await transaction.rollback();
            return res.status(403).json({ error: 'No tiene permiso para editar solicitudes' });
        }

        const { tipoSolicitud, ...typeData } = req.body;
        const solicitud = await Solicitud.findByPk(req.params.id, {
            include: includeTypes,
        });

        if (!solicitud) {
            await transaction.rollback();
            return res.status(404).json({ error: 'Solicitud no encontrada' });
        }

        // Get current state
        const typeRecord = solicitud.licencia || solicitud.vacaciones || solicitud.horasExtras || solicitud.renuncia;
        const currentState = typeRecord?.estado;

        // Block editing if not pending (except for state change)
        if (currentState !== 'pendiente') {
            // Only allow state changes
            const allowedFields = ['estado'];
            const otherFields = Object.keys(typeData).filter(k => !allowedFields.includes(k));
            if (otherFields.length > 0) {
                await transaction.rollback();
                return res.status(400).json({ error: 'No se puede editar una solicitud que no está en estado Pendiente' });
            }
        }

        // Validate overlaps when editing dates (only if pending)
        if (currentState === 'pendiente') {
            if (solicitud.tipoSolicitud === 'vacaciones' && (typeData.fechaInicio || typeData.fechaFin)) {
                const datosValidar = {
                    fechaInicio: typeData.fechaInicio || solicitud.vacaciones.fechaInicio,
                    fechaFin: typeData.fechaFin || solicitud.vacaciones.fechaFin
                };
                const validacion = await vacacionesService.validarVacaciones(solicitud.contratoId, datosValidar, solicitud.id);
                if (!validacion.valido) {
                    await transaction.rollback();
                    return res.status(400).json({ error: validacion.error });
                }
            }

            if (solicitud.tipoSolicitud === 'licencia' && (typeData.fechaInicio || typeData.fechaFin)) {
                const datosValidar = {
                    fechaInicio: typeData.fechaInicio || solicitud.licencia.fechaInicio,
                    fechaFin: typeData.fechaFin || solicitud.licencia.fechaFin
                };
                const validacion = await licenciaService.validarLicencia(solicitud.contratoId, datosValidar, solicitud.id);
                if (!validacion.valido) {
                    await transaction.rollback();
                    return res.status(400).json({ error: validacion.error });
                }
            }

            if (solicitud.tipoSolicitud === 'horas_extras' && (typeData.fecha || typeData.horaInicio || typeData.horaFin)) {
                const datosValidar = {
                    fecha: typeData.fecha || solicitud.horasExtras.fecha,
                    horaInicio: typeData.horaInicio || solicitud.horasExtras.horaInicio,
                    horaFin: typeData.horaFin || solicitud.horasExtras.horaFin
                };
                const validacion = await horasExtrasService.validarHorasExtras(solicitud.contratoId, datosValidar, solicitud.id);
                if (!validacion.valido) {
                    await transaction.rollback();
                    return res.status(400).json({ error: validacion.error });
                }
            }
        }

        // Validate resignation approval/processing
        if (solicitud.tipoSolicitud === 'renuncia' && typeData.estado) {
            const nuevoEstado = typeData.estado;
            const estadosQueRequierenValidacion = ['aceptada', 'procesada'];

            if (estadosQueRequierenValidacion.includes(nuevoEstado) && currentState !== nuevoEstado) {
                const validacion = await renunciaService.validarAprobacion(solicitud.contratoId);
                if (!validacion.valido) {
                    await transaction.rollback();
                    return res.status(400).json({ error: validacion.error });
                }
            }
        }

        // Update type-specific record
        switch (solicitud.tipoSolicitud) {
            case 'licencia':
                const prevEstadoLic = solicitud.licencia?.estado;

                // Si cambia a 'justificada', sumar días a fechaBajaEfectiva de renuncia activa
                if (typeData.estado === 'justificada' && prevEstadoLic !== 'justificada') {
                    const licenciaData = solicitud.licencia;
                    const diasLicencia = licenciaData?.diasSolicitados || 0;

                    if (diasLicencia > 0) {
                        await licenciaService.onAprobacion(solicitud.contratoId, diasLicencia, transaction);
                    }
                }

                await Licencia.update(typeData, {
                    where: { solicitudId: solicitud.id },
                    transaction,
                });
                break;
            case 'vacaciones':
                const prevEstadoVac = solicitud.vacaciones?.estado;

                // Si cambia a 'aprobada', establecer notificadoEl a hoy
                if (typeData.estado === 'aprobada' && prevEstadoVac !== 'aprobada') {
                    typeData.notificadoEl = new Date().toISOString().split('T')[0];

                    // Si hay renuncia aceptada, sumar días de vacaciones a fechaBajaEfectiva
                    const vacacionesData = solicitud.vacaciones;
                    const diasVacaciones = vacacionesData?.diasSolicitud || 0;

                    if (diasVacaciones > 0) {
                        await vacacionesService.onAprobacion(solicitud.contratoId, diasVacaciones, transaction);
                    }
                }

                await Vacaciones.update(typeData, {
                    where: { solicitudId: solicitud.id },
                    transaction,
                });
                break;
            case 'horas_extras':
                await HorasExtras.update(typeData, {
                    where: { solicitudId: solicitud.id },
                    transaction,
                });
                break;
            case 'renuncia':
                const prevEstado = solicitud.renuncia?.estado;

                if (typeData.estado === 'aceptada' && prevEstado !== 'aceptada') {
                    typeData.fechaBajaEfectiva = renunciaService.calcularFechaBajaEfectiva();
                }

                // Si cambia a 'procesada', establecer fechaBajaEfectiva a hoy automáticamente
                if (typeData.estado === 'procesada' && prevEstado !== 'procesada') {
                    const today = new Date().toISOString().split('T')[0];
                    typeData.fechaBajaEfectiva = today;
                }

                await Renuncia.update(typeData, {
                    where: { solicitudId: solicitud.id },
                    transaction,
                });

                // If changing to 'procesada', update contract fechaFin (NOT deactivate)
                if (typeData.estado === 'procesada' && prevEstado !== 'procesada') {
                    await Contrato.update({
                        fechaFin: typeData.fechaBajaEfectiva,
                    }, {
                        where: { id: solicitud.contratoId },
                        transaction,
                    });
                }
                break;
        }

        await transaction.commit();

        const updatedSolicitud = await Solicitud.findByPk(solicitud.id, {
            include: [includeContrato, ...includeTypes],
        });

        res.json(updatedSolicitud);
    } catch (error) {
        await transaction.rollback();
        if (error.name === 'SequelizeValidationError') {
            const messages = error.errors.map(e => e.message);
            return res.status(400).json({ error: messages.join(', ') });
        }
        res.status(500).json({ error: error.message });
    }
};

// Delete solicitud (soft delete)
const remove = async (req, res) => {
    try {
        // Verificar permiso de eliminación
        if (!(await tienePermiso(req.session, 'eliminar'))) {
            return res.status(403).json({ error: 'No tiene permiso para desactivar solicitudes' });
        }

        const solicitud = await Solicitud.findByPk(req.params.id);

        if (!solicitud) {
            return res.status(404).json({ error: 'Solicitud no encontrada' });
        }

        await solicitud.update({ activo: false });
        res.json({ message: 'Solicitud desactivada correctamente' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Reactivate solicitud
const reactivate = async (req, res) => {
    try {
        const solicitud = await Solicitud.findByPk(req.params.id);

        if (!solicitud) {
            return res.status(404).json({ error: 'Solicitud no encontrada' });
        }

        const solicitudesPendientes = await Solicitud.findOne({
            where: {
                contratoId: solicitud.contratoId,
                activo: true,
                id: { [Op.ne]: solicitud.id },
                [Op.and]: [{
                    [Op.or]: [
                        { '$licencia.estado$': { [Op.or]: ['pendiente', ''] } },
                        { '$vacaciones.estado$': { [Op.or]: ['pendiente', ''] } },
                        { '$horasExtras.estado$': { [Op.or]: ['pendiente', ''] } },
                        { '$renuncia.estado$': { [Op.or]: ['pendiente', ''] } }
                    ]
                }]
            },
            include: includeTypes
        });

        if (solicitudesPendientes) {
            return res.status(400).json({ error: 'No se puede reactivar porque ya existe otra solicitud pendiente para este contrato' });
        }

        await solicitud.update({ activo: true });

        const fullSolicitud = await Solicitud.findByPk(solicitud.id, {
            include: [includeContrato, ...includeTypes],
        });

        res.json(fullSolicitud);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Bulk delete
const bulkRemove = async (req, res) => {
    try {
        // Verificar permiso de eliminación
        if (!(await tienePermiso(req.session, 'eliminar'))) {
            return res.status(403).json({ error: 'No tiene permiso para desactivar solicitudes en lote' });
        }

        const { ids } = req.body;

        if (!ids || !Array.isArray(ids) || ids.length === 0) {
            return res.status(400).json({ error: 'Se requiere un array de IDs' });
        }

        await Solicitud.update(
            { activo: false },
            { where: { id: ids } }
        );

        res.json({ message: `${ids.length} solicitud(es) desactivada(s) correctamente` });
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
    getDiasDisponiblesVacaciones,
    getDiasSolicitadosVacaciones,
};
