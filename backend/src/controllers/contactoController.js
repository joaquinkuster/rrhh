const { Contacto, Empleado } = require('../models');
const { Op } = require('sequelize');

// Obtener todos los contactos con filtros y paginación
const getAll = async (req, res) => {
    try {
        const { nombre, empleadoId, activo, page = 1, limit = 10 } = req.query;
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
            where.nombreCompleto = { [Op.like]: `%${nombre}%` };
        }

        if (empleadoId) {
            where.empleadoId = empleadoId;
        }

        const offset = (parseInt(page) - 1) * parseInt(limit);

        const { count, rows } = await Contacto.findAndCountAll({
            where,
            include: [{
                model: Empleado,
                as: 'empleado',
                attributes: ['id', 'nombre', 'apellido', 'numeroDocumento'],
            }],
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
        res.status(500).json({ error: error.message });
    }
};

// Obtener contacto por ID
const getById = async (req, res) => {
    try {
        const contacto = await Contacto.findByPk(req.params.id, {
            include: [{
                model: Empleado,
                as: 'empleado',
                attributes: ['id', 'nombre', 'apellido', 'numeroDocumento'],
            }],
        });

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
    const where = {
        empleadoId,
        dni,
        activo: true,
    };

    if (excludeId) {
        where.id = { [Op.ne]: excludeId };
    }

    const existing = await Contacto.findOne({ where });
    return existing !== null;
};

// Crear contacto
const create = async (req, res) => {
    try {
        const { empleadoId, dni } = req.body;

        // Verificar DNI duplicado
        const isDuplicate = await checkDuplicateDNI(empleadoId, dni);
        if (isDuplicate) {
            return res.status(400).json({
                error: 'Ya existe un contacto con el mismo DNI para este empleado'
            });
        }

        const contacto = await Contacto.create(req.body);

        // Recargar con relaciones
        const contactoWithRelations = await Contacto.findByPk(contacto.id, {
            include: [{
                model: Empleado,
                as: 'empleado',
                attributes: ['id', 'nombre', 'apellido', 'numeroDocumento'],
            }],
        });

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
        const contacto = await Contacto.findByPk(req.params.id);

        if (!contacto) {
            return res.status(404).json({ error: 'Contacto no encontrado' });
        }

        const { empleadoId, dni } = req.body;

        // Verificar DNI duplicado (excluyendo el registro actual)
        const isDuplicate = await checkDuplicateDNI(
            empleadoId || contacto.empleadoId,
            dni || contacto.dni,
            contacto.id
        );
        if (isDuplicate) {
            return res.status(400).json({
                error: 'Ya existe un contacto con el mismo DNI para este empleado'
            });
        }

        await contacto.update(req.body);

        // Recargar con relaciones
        const contactoWithRelations = await Contacto.findByPk(contacto.id, {
            include: [{
                model: Empleado,
                as: 'empleado',
                attributes: ['id', 'nombre', 'apellido', 'numeroDocumento'],
            }],
        });

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

        const contactoWithRelations = await Contacto.findByPk(contacto.id, {
            include: [{
                model: Empleado,
                as: 'empleado',
                attributes: ['id', 'nombre', 'apellido', 'numeroDocumento'],
            }],
        });

        res.json(contactoWithRelations);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Eliminar múltiples contactos (eliminación lógica en lote)
const bulkRemove = async (req, res) => {
    try {
        const { ids } = req.body;

        if (!ids || !Array.isArray(ids) || ids.length === 0) {
            return res.status(400).json({ error: 'Se requiere un array de IDs' });
        }

        await Contacto.update(
            { activo: false },
            { where: { id: ids } }
        );

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
