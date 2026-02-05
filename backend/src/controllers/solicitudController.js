const { Solicitud, Licencia, Vacaciones, HorasExtras, Renuncia, Contrato, Empleado, Puesto, Departamento, Area, Empresa, RegistroSalud } = require('../models');
const { Op } = require('sequelize');
const sequelize = require('../config/database');
const { esDiaHabil, parseLocalDate } = require('../utils/fechas');
const { calcularDiasCorrespondientesVacaciones, getDiasDisponiblesVacaciones, getDiasSolicitadosVacaciones } = require('../services/vacacionesService');

// Servicios de validación
const vacacionesService = require('../services/vacacionesService');
const licenciaService = require('../services/licenciaService');
const horasExtrasService = require('../services/horasExtrasService');
const renunciaService = require('../services/renunciaService');

// Include relations for contract info
const includeContrato = {
    model: Contrato,
    as: 'contrato',
    include: [
        {
            model: Empleado,
            as: 'empleado',
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
        const { contratoId, tipoSolicitud, estado, search, activo, page = 1, limit = 10 } = req.query;
        const where = {};

        // Por defecto solo mostrar activos
        if (activo === 'false') {
            where.activo = false;
        } else if (activo === 'all') {
            // No filtrar
        } else {
            where.activo = true;
        }

        if (contratoId) {
            where.contratoId = parseInt(contratoId);
        }

        if (tipoSolicitud) {
            where.tipoSolicitud = tipoSolicitud;
        }

        const offset = (parseInt(page) - 1) * parseInt(limit);

        let result = await Solicitud.findAndCountAll({
            where,
            include: [includeContrato, ...includeTypes],
            order: [['createdAt', 'DESC']],
            limit: parseInt(limit),
            offset,
            distinct: true,
        });

        // Filter by estado (requires checking type-specific table)
        if (estado) {
            result.rows = result.rows.filter(sol => {
                const typeData = sol.licencia || sol.vacaciones || sol.horasExtras || sol.renuncia;
                return typeData && typeData.estado === estado;
            });
        }

        // Filter by employee name if search
        if (search) {
            const searchLower = search.toLowerCase();
            result.rows = result.rows.filter(sol => {
                const empleado = sol.contrato?.empleado;
                if (!empleado) return false;
                const fullName = `${empleado.nombre} ${empleado.apellido}`.toLowerCase();
                const documento = empleado.numeroDocumento?.toLowerCase() || '';
                return fullName.includes(searchLower) || documento.includes(searchLower);
            });
        }

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
