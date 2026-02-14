const { EspacioTrabajo, Empleado } = require('../models');
const { Op } = require('sequelize');

// Obtener todos los espacios de trabajo con filtros y paginación
const getAll = async (req, res) => {
    try {
        const { nombre, propietario, activo, page = 1, limit = 10 } = req.query;
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
            where.nombre = { [Op.like]: `%${nombre}%` };
        }

        if (propietario) {
            where.propietarioId = propietario;
        }

        const offset = (parseInt(page) - 1) * parseInt(limit);

        const { count, rows } = await EspacioTrabajo.findAndCountAll({
            where,
            include: [
                {
                    model: Empleado,
                    as: 'propietario',
                    attributes: ['id', 'nombre', 'apellido', 'email'],
                },
            ],
            order: [['createdAt', 'DESC']],
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

// Obtener espacio de trabajo por ID
const getById = async (req, res) => {
    try {
        const espacio = await EspacioTrabajo.findByPk(req.params.id, {
            include: [
                {
                    model: Empleado,
                    as: 'propietario',
                    attributes: ['id', 'nombre', 'apellido', 'email'],
                },
            ],
        });

        if (!espacio) {
            return res.status(404).json({ error: 'Espacio de trabajo no encontrado' });
        }

        res.json(espacio);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Crear espacio de trabajo
const create = async (req, res) => {
    try {
        // Asignar automáticamente el propietario como el usuario en sesión
        const espacioData = {
            ...req.body,
            propietarioId: req.session.empleadoId,
        };

        const espacio = await EspacioTrabajo.create(espacioData);

        // Cargar el espacio con el propietario
        const espacioCompleto = await EspacioTrabajo.findByPk(espacio.id, {
            include: [
                {
                    model: Empleado,
                    as: 'propietario',
                    attributes: ['id', 'nombre', 'apellido', 'email'],
                },
            ],
        });

        res.status(201).json(espacioCompleto);
    } catch (error) {
        if (error.name === 'SequelizeValidationError') {
            const messages = error.errors.map(e => e.message);
            return res.status(400).json({ error: messages.join(', ') });
        }
        res.status(500).json({ error: error.message });
    }
};

// Actualizar espacio de trabajo
const update = async (req, res) => {
    try {
        const espacio = await EspacioTrabajo.findByPk(req.params.id);

        if (!espacio) {
            return res.status(404).json({ error: 'Espacio de trabajo no encontrado' });
        }

        // No permitir cambiar el propietario
        const { propietarioId, ...updateData } = req.body;

        await espacio.update(updateData);

        // Recargar con el propietario
        const espacioActualizado = await EspacioTrabajo.findByPk(espacio.id, {
            include: [
                {
                    model: Empleado,
                    as: 'propietario',
                    attributes: ['id', 'nombre', 'apellido', 'email'],
                },
            ],
        });

        res.json(espacioActualizado);
    } catch (error) {
        if (error.name === 'SequelizeValidationError') {
            const messages = error.errors.map(e => e.message);
            return res.status(400).json({ error: messages.join(', ') });
        }
        res.status(500).json({ error: error.message });
    }
};

// Eliminar (desactivar) espacio de trabajo
const deleteEspacio = async (req, res) => {
    try {
        const espacio = await EspacioTrabajo.findByPk(req.params.id);

        if (!espacio) {
            return res.status(404).json({ error: 'Espacio de trabajo no encontrado' });
        }

        await espacio.update({ activo: false });
        res.json({ message: 'Espacio de trabajo desactivado exitosamente' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Eliminar múltiples espacios de trabajo
const deleteBulk = async (req, res) => {
    try {
        const { ids } = req.body;

        if (!ids || !Array.isArray(ids) || ids.length === 0) {
            return res.status(400).json({ error: 'Se requiere un array de IDs' });
        }

        await EspacioTrabajo.update(
            { activo: false },
            { where: { id: ids } }
        );

        res.json({ message: `${ids.length} espacio(s) de trabajo desactivado(s) exitosamente` });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Reactivar espacio de trabajo
const reactivate = async (req, res) => {
    try {
        const espacio = await EspacioTrabajo.findByPk(req.params.id);

        if (!espacio) {
            return res.status(404).json({ error: 'Espacio de trabajo no encontrado' });
        }

        await espacio.update({ activo: true });

        // Recargar con el propietario
        const espacioReactivado = await EspacioTrabajo.findByPk(espacio.id, {
            include: [
                {
                    model: Empleado,
                    as: 'propietario',
                    attributes: ['id', 'nombre', 'apellido', 'email'],
                },
            ],
        });

        res.json(espacioReactivado);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

module.exports = {
    getAll,
    getById,
    create,
    update,
    deleteEspacio,
    deleteBulk,
    reactivate,
};
