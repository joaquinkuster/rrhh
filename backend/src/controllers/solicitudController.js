const { Solicitud, Licencia, Vacaciones, HorasExtras, Renuncia, Contrato, Empleado, Puesto, Departamento, Area, Empresa, RegistroSalud } = require('../models');
const { Op } = require('sequelize');
const sequelize = require('../config/database');

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

// Calculate vacation days based on seniority (Ley 20.744)
const calcularDiasVacaciones = (fechaInicio) => {
    const hoy = new Date();
    const inicio = new Date(fechaInicio);
    const antiguedad = (hoy - inicio) / (1000 * 60 * 60 * 24 * 365);

    if (antiguedad < 0.5) return 0; // Menos de 6 meses
    if (antiguedad < 5) return 14;
    if (antiguedad < 10) return 21;
    if (antiguedad < 20) return 28;
    return 35; // 20+ años
};

// Get vacation days info for a contract
const getVacacionesDias = async (req, res) => {
    try {
        const { contratoId } = req.params;
        const { periodo } = req.query;

        const contrato = await Contrato.findByPk(contratoId);
        if (!contrato) {
            return res.status(404).json({ error: 'Contrato no encontrado' });
        }

        const diasCorrespondientes = calcularDiasVacaciones(contrato.fechaInicio);

        // Calculate days taken from approved vacations in the period
        const vacacionesAprobadas = await Solicitud.findAll({
            where: {
                contratoId: parseInt(contratoId),
                tipoSolicitud: 'vacaciones',
                activo: true,
            },
            include: [{
                model: Vacaciones,
                as: 'vacaciones',
                where: {
                    periodo: periodo ? parseInt(periodo) : new Date().getFullYear(),
                    estado: 'aprobada',
                },
            }],
        });

        const diasTomados = vacacionesAprobadas.reduce((sum, sol) => {
            return sum + (sol.vacaciones?.diasSolicitud || 0);
        }, 0);

        const diasDisponibles = Math.max(0, diasCorrespondientes - diasTomados);

        res.json({
            diasCorrespondientes,
            diasTomados,
            diasDisponibles,
            antiguedad: contrato.fechaInicio,
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Get Argentine holidays
const getFeriados = async (req, res) => {
    try {
        const { year } = req.params;
        const response = await fetch(`https://nolaborables.com.ar/api/v2/feriados/${year}`);

        if (!response.ok) {
            // Fallback to default holidays
            return res.json([]);
        }

        const feriados = await response.json();
        res.json(feriados);
    } catch (error) {
        // Return empty array on error
        res.json([]);
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

        // Type-specific validations
        if (tipoSolicitud === 'vacaciones') {
            // Check for existing pending vacation
            const pendingVacation = await Solicitud.findOne({
                where: {
                    contratoId,
                    tipoSolicitud: 'vacaciones',
                    activo: true,
                },
                include: [{
                    model: Vacaciones,
                    as: 'vacaciones',
                    where: { estado: 'pendiente' },
                }],
            });

            if (pendingVacation) {
                await transaction.rollback();
                return res.status(400).json({ error: 'Ya existe una solicitud de vacaciones pendiente para este contrato' });
            }

            // Check for overlapping approved vacations
            const overlapping = await Solicitud.findOne({
                where: {
                    contratoId,
                    tipoSolicitud: 'vacaciones',
                    activo: true,
                },
                include: [{
                    model: Vacaciones,
                    as: 'vacaciones',
                    where: {
                        estado: 'aprobada',
                        [Op.or]: [
                            {
                                fechaInicio: {
                                    [Op.between]: [typeData.fechaInicio, typeData.fechaFin],
                                },
                            },
                            {
                                fechaFin: {
                                    [Op.between]: [typeData.fechaInicio, typeData.fechaFin],
                                },
                            },
                            {
                                [Op.and]: [
                                    { fechaInicio: { [Op.lte]: typeData.fechaInicio } },
                                    { fechaFin: { [Op.gte]: typeData.fechaFin } },
                                ],
                            },
                        ],
                    },
                }],
            });

            if (overlapping) {
                await transaction.rollback();
                return res.status(400).json({ error: 'Las fechas se solapan con vacaciones ya aprobadas' });
            }
        }

        if (tipoSolicitud === 'horas_extras') {
            // Check for overlapping overtime on same day
            const overlapping = await Solicitud.findOne({
                where: {
                    contratoId,
                    tipoSolicitud: 'horas_extras',
                    activo: true,
                },
                include: [{
                    model: HorasExtras,
                    as: 'horasExtras',
                    where: {
                        fecha: typeData.fecha,
                        [Op.or]: [
                            {
                                horaInicio: {
                                    [Op.between]: [typeData.horaInicio, typeData.horaFin],
                                },
                            },
                            {
                                horaFin: {
                                    [Op.between]: [typeData.horaInicio, typeData.horaFin],
                                },
                            },
                            {
                                [Op.and]: [
                                    { horaInicio: { [Op.lte]: typeData.horaInicio } },
                                    { horaFin: { [Op.gte]: typeData.horaFin } },
                                ],
                            },
                        ],
                    },
                }],
            });

            if (overlapping) {
                await transaction.rollback();
                return res.status(400).json({ error: 'Las horas se solapan con otra solicitud de horas extras del mismo día' });
            }
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

        // Update type-specific record
        switch (solicitud.tipoSolicitud) {
            case 'licencia':
                await Licencia.update(typeData, {
                    where: { solicitudId: solicitud.id },
                    transaction,
                });
                break;
            case 'vacaciones':
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
    getVacacionesDias,
    getFeriados,
};
