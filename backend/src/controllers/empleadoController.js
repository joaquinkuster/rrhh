const { Empleado, RegistroSalud } = require('../models');
const { Op } = require('sequelize');

// Removed includeRelations - Puesto is now associated with Contrato, not Empleado

// Obtener todos los empleados con filtros y paginación
const getAll = async (req, res) => {
    try {
        const { nombre, apellido, email, nacionalidad, genero, estadoCivil, activo, page = 1, limit = 10 } = req.query;
        const where = {};

        // Por defecto solo mostrar activos
        if (activo === 'false') {
            where.activo = false;
        } else if (activo === 'all') {
            // No filtrar
        } else {
            where.activo = true;
        }

        if (nombre) {
            where[Op.or] = [
                { nombre: { [Op.like]: `%${nombre}%` } },
                { apellido: { [Op.like]: `%${nombre}%` } }
            ];
        }
        if (apellido) {
            where.apellido = { [Op.like]: `%${apellido}%` };
        }
        if (email) {
            where.email = { [Op.like]: `%${email}%` };
        }
        if (nacionalidad) {
            where.nacionalidadId = { [Op.like]: `%${nacionalidad}%` };
        }
        if (genero) {
            where.genero = genero;
        }
        if (estadoCivil) {
            where.estadoCivil = estadoCivil;
        }

        const offset = (parseInt(page) - 1) * parseInt(limit);

        const { count, rows } = await Empleado.findAndCountAll({
            where,
            order: [['apellido', 'ASC'], ['nombre', 'ASC']],
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

// Obtener empleado por ID
const getById = async (req, res) => {
    try {
        const empleado = await Empleado.findByPk(req.params.id);

        if (!empleado) {
            return res.status(404).json({ error: 'Empleado no encontrado' });
        }

        res.json(empleado);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Crear empleado
const create = async (req, res) => {
    try {
        const empleado = await Empleado.create(req.body);

        res.status(201).json(empleado);
    } catch (error) {
        if (error.name === 'SequelizeUniqueConstraintError') {
            const field = error.errors?.[0]?.path || '';
            if (field === 'numeroDocumento') {
                return res.status(400).json({ error: 'El número de documento ya está registrado' });
            }
            if (field === 'cuil') {
                return res.status(400).json({ error: 'El CUIL ya está registrado' });
            }
            return res.status(400).json({ error: 'El email ya está registrado' });
        }
        if (error.name === 'SequelizeValidationError') {
            const messages = error.errors.map(e => e.message);
            return res.status(400).json({ error: messages.join(', ') });
        }
        res.status(500).json({ error: error.message });
    }
};

// Actualizar empleado
const update = async (req, res) => {
    try {
        const empleado = await Empleado.findByPk(req.params.id);

        if (!empleado) {
            return res.status(404).json({ error: 'Empleado no encontrado' });
        }

        await empleado.update(req.body);

        res.json(empleado);
    } catch (error) {
        if (error.name === 'SequelizeUniqueConstraintError') {
            const field = error.errors?.[0]?.path || '';
            if (field === 'numeroDocumento') {
                return res.status(400).json({ error: 'El número de documento ya está registrado' });
            }
            if (field === 'cuil') {
                return res.status(400).json({ error: 'El CUIL ya está registrado' });
            }
            return res.status(400).json({ error: 'El email ya está registrado' });
        }
        if (error.name === 'SequelizeValidationError') {
            const messages = error.errors.map(e => e.message);
            return res.status(400).json({ error: messages.join(', ') });
        }
        res.status(500).json({ error: error.message });
    }
};

// Eliminar empleado (eliminación lógica)
const remove = async (req, res) => {
    try {
        const { Contrato } = require('../models');
        const empleado = await Empleado.findByPk(req.params.id);

        if (!empleado) {
            return res.status(404).json({ error: 'Empleado no encontrado' });
        }

        // Verificar registros de salud activos
        const registrosActivos = await RegistroSalud.count({
            where: {
                empleadoId: empleado.id,
                activo: true
            }
        });

        // Verificar si tiene contratos activos
        const contratosActivos = await Contrato.count({
            where: {
                empleadoId: empleado.id,
                activo: true
            }
        });

        if (registrosActivos > 0 || contratosActivos > 0) {
            const reasons = [];
            if (registrosActivos > 0) reasons.push(`${registrosActivos} registro(s) de salud activo(s)`);
            if (contratosActivos > 0) reasons.push(`${contratosActivos} contrato(s) activo(s)`);

            return res.status(400).json({
                error: `No se puede desactivar el empleado porque tiene ${reasons.join(' y ')}. Primero desactive los registros correspondientes.`
            });
        }

        await empleado.update({ activo: false });
        res.json({ message: 'Empleado desactivado correctamente' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Reactivar empleado
const reactivate = async (req, res) => {
    try {
        const empleado = await Empleado.findByPk(req.params.id);

        if (!empleado) {
            return res.status(404).json({ error: 'Empleado no encontrado' });
        }

        await empleado.update({ activo: true });

        res.json(empleado);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Eliminar múltiples empleados (eliminación lógica en lote)
const bulkRemove = async (req, res) => {
    try {
        const { ids } = req.body;

        if (!ids || !Array.isArray(ids) || ids.length === 0) {
            return res.status(400).json({ error: 'Se requiere un array de IDs' });
        }

        await Empleado.update(
            { activo: false },
            { where: { id: ids } }
        );

        res.json({ message: `${ids.length} empleado(s) desactivado(s) correctamente` });
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
