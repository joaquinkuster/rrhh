const { RegistroSalud, Empleado, Usuario } = require('../models');
const { Op } = require('sequelize');

// Include para obtener empleado
const includeEmpleado = [{
    model: Empleado,
    as: 'empleado',
    include: [{
        model: Usuario,
        as: 'usuario',
        attributes: ['nombre', 'apellido']
    }]
}];

// Obtener todos los registros de salud con paginación y filtros
const getAll = async (req, res) => {
    try {
        const { search, page = 1, limit = 10, activo, tipoExamen, resultado, empleadoId, vigente } = req.query;
        const where = {};

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

        // Filtro por empleadoId
        if (empleadoId) {
            where.empleadoId = empleadoId;
        }

        // Filtro por vigente
        if (vigente) {
            where.vigente = vigente;
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
        const registro = await RegistroSalud.findByPk(req.params.id);

        if (!registro) {
            return res.status(404).json({ error: 'Registro de salud no encontrado' });
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
        const { ids } = req.body;

        if (!ids || !Array.isArray(ids) || ids.length === 0) {
            return res.status(400).json({ error: 'Se requiere un array de IDs' });
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
