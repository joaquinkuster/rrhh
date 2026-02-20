const { Contrato, Empleado, Puesto, Departamento, Area, Empresa, ContratoPuesto, Rol, Usuario, EspacioTrabajo } = require('../models');
const { Op } = require('sequelize');
const sequelize = require('../config/database');

// Incluir puestos con su jerarquía empresarial
const includeRelations = [
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
        model: Rol,
        as: 'rol',
        required: false
    },
    {
        model: Puesto,
        as: 'puestos',
        through: { attributes: [] }, // No incluir campos de la tabla junction
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
];

// Obtener todos los contratos con filtros y paginación
const getAll = async (req, res) => {
    try {
        const { empleadoId, tipoContrato, estado, search, activo, page = 1, limit = 10 } = req.query;
        const where = {};

        // Por defecto solo mostrar activos
        if (activo === 'false') {
            where.activo = false;
        } else if (activo === 'all') {
            // No filtrar
        } else {
            where.activo = true;
        }

        if (empleadoId) {
            where.empleadoId = parseInt(empleadoId);
        }

        if (tipoContrato) {
            where.tipoContrato = tipoContrato;
        }

        if (estado) {
            where.estado = estado;
        }

        // Filtro por rango salarial
        const { salarioMin, salarioMax } = req.query;
        if (salarioMin || salarioMax) {
            where.salario = {};
            if (salarioMin) where.salario[Op.gte] = parseFloat(salarioMin);
            if (salarioMax) where.salario[Op.lte] = parseFloat(salarioMax);
        }

        // --- Filtrado por Espacio de Trabajo (via Empleado) ---
        const usuarioSesionId = req.session.usuarioId || req.session.empleadoId;
        const esAdmin = req.session.esAdministrador;

        if (!esAdmin && !empleadoId) {
            // Solo aplicar filtro de workspace si no se pidió un empleadoId específico
            const empleadoSesion = await Empleado.findOne({ where: { usuarioId: usuarioSesionId } });

            if (empleadoSesion) {
                // Es empleado → solo contratos de empleados de su mismo workspace
                const empleadosDelWorkspace = await Empleado.findAll({
                    where: { espacioTrabajoId: empleadoSesion.espacioTrabajoId },
                    attributes: ['id']
                });
                where.empleadoId = { [Op.in]: empleadosDelWorkspace.map(e => e.id) };
            } else {
                // Es propietario (no empleado) → contratos de todos sus workspaces
                const espaciosPropios = await EspacioTrabajo.findAll({
                    where: { propietarioId: usuarioSesionId },
                    attributes: ['id']
                });

                if (espaciosPropios.length > 0) {
                    const espaciosIds = espaciosPropios.map(e => e.id);
                    const empleadosDeWorkspaces = await Empleado.findAll({
                        where: { espacioTrabajoId: { [Op.in]: espaciosIds } },
                        attributes: ['id']
                    });
                    where.empleadoId = { [Op.in]: empleadosDeWorkspaces.map(e => e.id) };
                } else {
                    // Sin workspace → no ve nada
                    where.empleadoId = -1;
                }
            }
        }

        const offset = (parseInt(page) - 1) * parseInt(limit);

        let result = await Contrato.findAndCountAll({
            where,
            include: includeRelations,
            order: [['createdAt', 'DESC']],
            limit: parseInt(limit),
            offset,
            distinct: true, // Para contar correctamente con M:N
        });

        // Filtrar por nombre de empleado si hay búsqueda
        if (search) {
            const searchLower = search.toLowerCase();
            result.rows = result.rows.filter(contrato => {
                const empleado = contrato.empleado;
                if (!empleado || !empleado.usuario) return false;
                const fullName = `${empleado.usuario.nombre} ${empleado.usuario.apellido}`.toLowerCase();
                const documento = empleado.usuario.numeroDocumento?.toLowerCase() || '';
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

// Obtener contrato por ID
const getById = async (req, res) => {
    try {
        const contrato = await Contrato.findByPk(req.params.id, {
            include: includeRelations,
        });

        if (!contrato) {
            return res.status(404).json({ error: 'Contrato no encontrado' });
        }

        res.json(contrato);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Crear contrato
const create = async (req, res) => {
    const transaction = await sequelize.transaction();

    try {
        const { empleadoId, puestoIds, ...contratoData } = req.body;

        if (!puestoIds || !Array.isArray(puestoIds) || puestoIds.length === 0) {
            await transaction.rollback();
            return res.status(400).json({ error: 'Debe seleccionar al menos un puesto' });
        }

        // Obtener todos los puestos con sus empresas
        const puestos = await Puesto.findAll({
            where: { id: puestoIds },
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
        });

        if (puestos.length !== puestoIds.length) {
            await transaction.rollback();
            return res.status(400).json({ error: 'Uno o más puestos no existen' });
        }

        // Validar que todos los puestos pertenecen a la misma empresa
        const empresaIds = [...new Set(puestos.map(p => p.departamento?.area?.empresa?.id))];
        if (empresaIds.length > 1) {
            await transaction.rollback();
            return res.status(400).json({
                error: 'Todos los puestos deben pertenecer a la misma empresa. Para asignar puestos de diferentes empresas, cree contratos separados.'
            });
        }

        // Validar que el empleado no tenga ya un contrato activo (y no finalizado) para alguno de estos puestos
        const contratosExistentes = await ContratoPuesto.findAll({
            where: { puestoId: puestoIds },
            include: [{
                model: Contrato,
                as: 'contrato',
                where: {
                    empleadoId: empleadoId,
                    activo: true,
                    estado: { [Op.ne]: 'finalizado' } // Permitir si el contrato anterior está finalizado
                }
            }]
        });

        if (contratosExistentes.length > 0) {
            const puestosConContrato = contratosExistentes.map(cp => cp.puestoId);
            const puestosNombres = puestos
                .filter(p => puestosConContrato.includes(p.id))
                .map(p => p.nombre)
                .join(', ');

            await transaction.rollback();
            return res.status(400).json({
                error: `El empleado ya tiene un contrato activo (no finalizado) para el/los puesto(s): ${puestosNombres}`
            });
        }

        // Crear el contrato
        const contrato = await Contrato.create({
            ...contratoData,
            empleadoId
        }, { transaction });

        // Asociar los puestos al contrato
        await ContratoPuesto.bulkCreate(
            puestoIds.map(puestoId => ({
                contratoId: contrato.id,
                puestoId: puestoId
            })),
            { transaction }
        );

        await transaction.commit();

        // Obtener el contrato con todas las relaciones
        const contratoConRelaciones = await Contrato.findByPk(contrato.id, {
            include: includeRelations,
        });

        res.status(201).json(contratoConRelaciones);
    } catch (error) {
        await transaction.rollback();
        if (error.name === 'SequelizeValidationError') {
            const messages = error.errors.map(e => e.message);
            return res.status(400).json({ error: messages.join(', ') });
        }
        if (error.name === 'SequelizeForeignKeyConstraintError') {
            return res.status(400).json({ error: 'El empleado seleccionado no existe' });
        }
        res.status(500).json({ error: error.message });
    }
};

// Actualizar contrato
const update = async (req, res) => {
    const transaction = await sequelize.transaction();

    try {
        const { puestoIds, ...contratoData } = req.body;
        const contrato = await Contrato.findByPk(req.params.id);

        if (!contrato) {
            await transaction.rollback();
            return res.status(404).json({ error: 'Contrato no encontrado' });
        }

        // No permitir editar contratos finalizados
        if (contrato.estado === 'finalizado') {
            await transaction.rollback();
            return res.status(400).json({
                error: 'No se puede editar un contrato finalizado. Solo puede visualizarlo o desactivarlo.'
            });
        }

        // Actualizar datos básicos del contrato
        await contrato.update(contratoData, { transaction });

        // Si se proporcionan puestos, actualizar la asociación (solo si hay al menos uno)
        if (puestoIds && Array.isArray(puestoIds) && puestoIds.length > 0) {
            // Obtener puestos para validar empresa
            const puestos = await Puesto.findAll({
                where: { id: puestoIds },
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
            });

            // Validar misma empresa
            const empresaIds = [...new Set(puestos.map(p => p.departamento?.area?.empresa?.id))];
            if (empresaIds.length > 1) {
                await transaction.rollback();
                return res.status(400).json({
                    error: 'Todos los puestos deben pertenecer a la misma empresa.'
                });
            }

            // Validar que no haya conflictos con otros contratos activos del mismo empleado
            const contratosExistentes = await ContratoPuesto.findAll({
                where: { puestoId: puestoIds },
                include: [{
                    model: Contrato,
                    as: 'contrato',
                    where: {
                        id: { [Op.ne]: contrato.id }, // Excluir el contrato actual
                        empleadoId: contrato.empleadoId,
                        activo: true,
                        estado: { [Op.ne]: 'finalizado' }
                    }
                }]
            });

            if (contratosExistentes.length > 0) {
                const puestosConContrato = contratosExistentes.map(cp => cp.puestoId);
                const puestosNombres = puestos
                    .filter(p => puestosConContrato.includes(p.id))
                    .map(p => p.nombre)
                    .join(', ');

                await transaction.rollback();
                return res.status(400).json({
                    error: `El empleado ya tiene otro contrato activo para el/los puesto(s): ${puestosNombres}`
                });
            }

            // Eliminar asociaciones anteriores
            await ContratoPuesto.destroy({
                where: { contratoId: contrato.id },
                transaction
            });

            // Crear nuevas asociaciones
            await ContratoPuesto.bulkCreate(
                puestoIds.map(puestoId => ({
                    contratoId: contrato.id,
                    puestoId: puestoId
                })),
                { transaction }
            );
        }

        await transaction.commit();

        const contratoActualizado = await Contrato.findByPk(contrato.id, {
            include: includeRelations,
        });

        res.json(contratoActualizado);
    } catch (error) {
        await transaction.rollback();
        if (error.name === 'SequelizeValidationError') {
            const messages = error.errors.map(e => e.message);
            return res.status(400).json({ error: messages.join(', ') });
        }
        res.status(500).json({ error: error.message });
    }
};

// Eliminar contrato (eliminación lógica)
const remove = async (req, res) => {
    try {
        const contrato = await Contrato.findByPk(req.params.id);

        if (!contrato) {
            return res.status(404).json({ error: 'Contrato no encontrado' });
        }

        await contrato.update({ activo: false });
        res.json({ message: 'Contrato desactivado correctamente' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Reactivar contrato
const reactivate = async (req, res) => {
    try {
        const contrato = await Contrato.findByPk(req.params.id);

        if (!contrato) {
            return res.status(404).json({ error: 'Contrato no encontrado' });
        }

        await contrato.update({ activo: true });

        const contratoReactivado = await Contrato.findByPk(contrato.id, {
            include: includeRelations,
        });

        res.json(contratoReactivado);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Eliminar múltiples contratos (eliminación lógica en lote)
const bulkRemove = async (req, res) => {
    try {
        const { ids } = req.body;

        if (!ids || !Array.isArray(ids) || ids.length === 0) {
            return res.status(400).json({ error: 'Se requiere un array de IDs' });
        }

        await Contrato.update(
            { activo: false },
            { where: { id: ids } }
        );

        res.json({ message: `${ids.length} contrato(s) desactivado(s) correctamente` });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Obtener puestos con contratos activos para un empleado
const getPuestosConContrato = async (req, res) => {
    try {
        const { empleadoId } = req.params;

        const contratosActivos = await Contrato.findAll({
            where: {
                empleadoId: parseInt(empleadoId),
                activo: true,
                estado: { [Op.ne]: 'finalizado' } // Excluir contratos finalizados
            },
            include: [{
                model: Puesto,
                as: 'puestos',
                through: { attributes: [] }
            }]
        });

        // Extraer IDs de puestos con contrato activo (no finalizado)
        const puestoIds = contratosActivos.flatMap(c => c.puestos.map(p => p.id));

        res.json({ puestoIds: [...new Set(puestoIds)] });
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
    getPuestosConContrato,
};
