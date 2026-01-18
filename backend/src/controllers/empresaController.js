const { Empresa } = require('../models');
const { Op } = require('sequelize');

// Obtener todas las empresas con búsqueda y paginación
const getAll = async (req, res) => {
    try {
        const { search, page = 1, limit = 10 } = req.query;
        const where = {};

        if (search) {
            where.nombre = { [Op.like]: `%${search}%` };
        }

        const offset = (parseInt(page) - 1) * parseInt(limit);

        const { count, rows } = await Empresa.findAndCountAll({
            where,
            order: [['nombre', 'ASC']],
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

// Obtener empresa por ID
const getById = async (req, res) => {
    try {
        const empresa = await Empresa.findByPk(req.params.id);

        if (!empresa) {
            return res.status(404).json({ error: 'Empresa no encontrada' });
        }

        res.json(empresa);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Crear empresa
const create = async (req, res) => {
    try {
        const empresa = await Empresa.create(req.body);
        res.status(201).json(empresa);
    } catch (error) {
        if (error.name === 'SequelizeValidationError') {
            const messages = error.errors.map(e => e.message);
            return res.status(400).json({ error: messages.join(', ') });
        }
        res.status(500).json({ error: error.message });
    }
};

// Eliminar empresa
const remove = async (req, res) => {
    try {
        const empresa = await Empresa.findByPk(req.params.id);

        if (!empresa) {
            return res.status(404).json({ error: 'Empresa no encontrada' });
        }

        await empresa.destroy();
        res.json({ message: 'Empresa eliminada correctamente' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Eliminar empresas en lote
const removeBulk = async (req, res) => {
    try {
        const { ids } = req.body;

        if (!ids || !Array.isArray(ids) || ids.length === 0) {
            return res.status(400).json({ error: 'Se requiere un array de IDs' });
        }

        const deleted = await Empresa.destroy({
            where: { id: { [Op.in]: ids } },
        });

        res.json({ message: `${deleted} empresa(s) eliminada(s) correctamente` });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

module.exports = {
    getAll,
    getById,
    create,
    remove,
    removeBulk,
};
