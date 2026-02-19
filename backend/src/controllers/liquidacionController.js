const { Liquidacion, Contrato, Empleado, Usuario } = require('../models');
const { Op } = require('sequelize');

// Obtener todas las liquidaciones con filtros y paginación
const getAll = async (req, res) => {
    try {
        const {
            empleadoId,
            contratoId,
            fechaDesde,
            fechaHasta,
            estado,
            activo,
            page = 1,
            limit = 10,
        } = req.query;

        const where = {};

        if (activo !== undefined) {
            where.activo = activo === 'true' || activo === true || activo === '1';
        }

        if (estado) {
            where.estado = estado;
        }

        if (req.query.estaPagada !== undefined) {
            where.estaPagada = req.query.estaPagada === 'true' || req.query.estaPagada === true || req.query.estaPagada === '1';
        }

        if (contratoId) {
            where.contratoId = contratoId;
        }

        if (fechaDesde || fechaHasta) {
            where.fechaInicio = {};
            if (fechaDesde) where.fechaInicio[Op.gte] = fechaDesde;
            if (fechaHasta) where.fechaInicio[Op.lte] = fechaHasta;
        }

        // Aplicar filtro de empleado si se proporciona
        const contratoWhere = {};
        if (empleadoId) {
            contratoWhere.empleadoId = empleadoId;
        }

        const offset = (page - 1) * limit;

        const { count, rows } = await Liquidacion.findAndCountAll({
            where,
            include: [{
                model: Contrato,
                as: 'contrato',
                where: Object.keys(contratoWhere).length > 0 ? contratoWhere : undefined,
                include: [{
                    model: Empleado,
                    as: 'empleado',
                    include: [{
                        model: Usuario,
                        as: 'usuario',
                        attributes: ['nombre', 'apellido']
                    }]
                }],
                attributes: ['id', 'tipoContrato', 'fechaInicio', 'fechaFin', 'estado'],
            }],
            order: [['id', 'DESC']],
            limit: parseInt(limit),
            offset: parseInt(offset),
        });

        res.json({
            liquidaciones: rows,
            total: count,
            page: parseInt(page),
            totalPages: Math.ceil(count / limit),
        });
    } catch (error) {
        console.error('Error al obtener liquidaciones:', error);
        res.status(500).json({ error: error.message });
    }
};

// Obtener liquidación por ID
const getById = async (req, res) => {
    try {
        const { id } = req.params;

        const liquidacion = await Liquidacion.findByPk(id, {
            include: [{
                model: Contrato,
                as: 'contrato',
                include: [{
                    model: Empleado,
                    as: 'empleado',
                    include: [{
                        model: Usuario,
                        as: 'usuario',
                        attributes: ['nombre', 'apellido']
                    }]
                }],
            }],
        });

        if (!liquidacion) {
            return res.status(404).json({ error: 'Liquidación no encontrada' });
        }

        res.json(liquidacion);
    } catch (error) {
        console.error('Error al obtener liquidación:', error);
        res.status(500).json({ error: error.message });
    }
};

// Actualizar liquidación
const update = async (req, res) => {
    try {
        const { id } = req.params;
        const {
            basico,
            antiguedad,
            presentismo,
            horasExtras,
            vacaciones,
            sac,
            inasistencias,
            totalBruto,
            totalRetenciones,
            vacacionesNoGozadas,
            neto,
            detalleConceptos,
            estado,
        } = req.body;

        const liquidacion = await Liquidacion.findByPk(id);

        if (!liquidacion) {
            return res.status(404).json({ error: 'Liquidación no encontrada' });
        }

        // Actualizar campos permitidos
        if (basico !== undefined) liquidacion.basico = basico;
        if (antiguedad !== undefined) liquidacion.antiguedad = antiguedad;
        if (presentismo !== undefined) liquidacion.presentismo = presentismo;
        if (horasExtras !== undefined) liquidacion.horasExtras = horasExtras;
        if (vacaciones !== undefined) liquidacion.vacaciones = vacaciones;
        if (sac !== undefined) liquidacion.sac = sac;
        if (inasistencias !== undefined) liquidacion.inasistencias = inasistencias;
        if (totalBruto !== undefined) liquidacion.totalBruto = totalBruto;
        if (totalRetenciones !== undefined) liquidacion.totalRetenciones = totalRetenciones;
        if (vacacionesNoGozadas !== undefined) liquidacion.vacacionesNoGozadas = vacacionesNoGozadas;
        if (neto !== undefined) liquidacion.neto = neto;
        if (detalleConceptos !== undefined) liquidacion.detalleConceptos = detalleConceptos;
        if (estado !== undefined) liquidacion.estado = estado;
        if (req.body.estaPagada !== undefined) liquidacion.estaPagada = req.body.estaPagada;

        await liquidacion.save();

        // Recargar con relaciones
        const liquidacionActualizada = await Liquidacion.findByPk(id, {
            include: [{
                model: Contrato,
                as: 'contrato',
                include: [{
                    model: Empleado,
                    as: 'empleado',
                    include: [{
                        model: Usuario,
                        as: 'usuario',
                        attributes: ['nombre', 'apellido']
                    }]
                }],
            }],
        });

        res.json({ message: 'Liquidación actualizada exitosamente', liquidacion: liquidacionActualizada });
    } catch (error) {
        console.error('Error al actualizar liquidación:', error);
        res.status(400).json({ error: error.message });
    }
};

// Eliminar liquidación (eliminación lógica)
const remove = async (req, res) => {
    try {
        const { id } = req.params;

        const liquidacion = await Liquidacion.findByPk(id);

        if (!liquidacion) {
            return res.status(404).json({ error: 'Liquidación no encontrada' });
        }

        liquidacion.activo = false;
        await liquidacion.save();

        res.json({ message: 'Liquidación eliminada exitosamente' });
    } catch (error) {
        console.error('Error al eliminar liquidación:', error);
        res.status(500).json({ error: error.message });
    }
};

// Reactivar liquidación
const reactivate = async (req, res) => {
    try {
        const { id } = req.params;

        const liquidacion = await Liquidacion.findByPk(id);

        if (!liquidacion) {
            return res.status(404).json({ error: 'Liquidación no encontrada' });
        }

        liquidacion.activo = true;
        await liquidacion.save();

        const liquidacionActualizada = await Liquidacion.findByPk(id, {
            include: [{
                model: Contrato,
                as: 'contrato',
                include: [{
                    model: Empleado,
                    as: 'empleado',
                    include: [{
                        model: Usuario,
                        as: 'usuario',
                        attributes: ['nombre', 'apellido']
                    }]
                }],
            }],
        });

        res.json({ message: 'Liquidación reactivada exitosamente', liquidacion: liquidacionActualizada });
    } catch (error) {
        console.error('Error al reactivar liquidación:', error);
        res.status(500).json({ error: error.message });
    }
};

// Eliminar múltiples liquidaciones (eliminación lógica en lote)
const bulkRemove = async (req, res) => {
    try {
        const { ids } = req.body;

        if (!ids || !Array.isArray(ids) || ids.length === 0) {
            return res.status(400).json({ error: 'Se requiere un array de IDs' });
        }

        await Liquidacion.update(
            { activo: false },
            { where: { id: { [Op.in]: ids } } }
        );

        res.json({ message: `${ids.length} liquidaciones eliminadas exitosamente` });
    } catch (error) {
        console.error('Error al eliminar liquidaciones:', error);
        res.status(500).json({ error: error.message });
    }
};

module.exports = {
    getAll,
    getById,
    update,
    remove,
    reactivate,
    bulkRemove,
};
