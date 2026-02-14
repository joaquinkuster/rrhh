const { Rol, Permiso, RolPermiso } = require('../models');
const { Op } = require('sequelize');

/**
 * Obtener todos los roles con paginación y filtros
 */
const getAll = async (req, res) => {
    try {
        const { search = '', page = 1, limit = 10, activo } = req.query;

        const whereClause = {};

        // Filtro de búsqueda
        if (search) {
            whereClause[Op.or] = [
                { nombre: { [Op.like]: `%${search}%` } },
                { descripcion: { [Op.like]: `%${search}%` } },
            ];
        }

        // Filtro de estado activo
        if (activo !== undefined) {
            whereClause.activo = activo === 'true';
        }

        const offset = (parseInt(page) - 1) * parseInt(limit);

        const { count, rows } = await Rol.findAndCountAll({
            where: whereClause,
            include: [
                {
                    model: Permiso,
                    as: 'permisos',
                    through: { attributes: [] },
                    attributes: ['id', 'modulo', 'accion', 'descripcion'],
                },
            ],
            limit: parseInt(limit),
            offset: offset,
            order: [['nombre', 'ASC']],
        });

        res.json({
            roles: rows,
            total: count,
            page: parseInt(page),
            totalPages: Math.ceil(count / parseInt(limit)),
        });
    } catch (error) {
        console.error('Error al obtener roles:', error);
        res.status(500).json({ error: 'Error al obtener roles' });
    }
};

/**
 * Obtener un rol por ID
 */
const getById = async (req, res) => {
    try {
        const { id } = req.params;

        const rol = await Rol.findByPk(id, {
            include: [
                {
                    model: Permiso,
                    as: 'permisos',
                    through: { attributes: [] },
                    attributes: ['id', 'modulo', 'accion', 'descripcion'],
                },
            ],
        });

        if (!rol) {
            return res.status(404).json({ error: 'Rol no encontrado' });
        }

        res.json(rol);
    } catch (error) {
        console.error('Error al obtener rol:', error);
        res.status(500).json({ error: 'Error al obtener rol' });
    }
};

/**
 * Crear un nuevo rol
 */
const create = async (req, res) => {
    try {
        const { nombre, descripcion, permisos = [] } = req.body;

        // Validar datos requeridos
        if (!nombre) {
            return res.status(400).json({ error: 'El nombre del rol es requerido' });
        }

        // Crear el rol
        const nuevoRol = await Rol.create({
            nombre,
            descripcion,
            activo: true,
        });

        // Asignar permisos si se proporcionaron
        if (permisos.length > 0) {
            await nuevoRol.setPermisos(permisos);
        }

        // Obtener el rol con sus permisos
        const rolConPermisos = await Rol.findByPk(nuevoRol.id, {
            include: [
                {
                    model: Permiso,
                    as: 'permisos',
                    through: { attributes: [] },
                    attributes: ['id', 'modulo', 'accion', 'descripcion'],
                },
            ],
        });

        res.status(201).json(rolConPermisos);
    } catch (error) {
        console.error('Error al crear rol:', error);

        if (error.name === 'SequelizeUniqueConstraintError') {
            return res.status(400).json({ error: 'Ya existe un rol con este nombre' });
        }

        if (error.name === 'SequelizeValidationError') {
            return res.status(400).json({ error: error.errors[0].message });
        }

        res.status(500).json({ error: 'Error al crear rol' });
    }
};

/**
 * Actualizar un rol
 */
const update = async (req, res) => {
    try {
        const { id } = req.params;
        const { nombre, descripcion, permisos } = req.body;

        const rol = await Rol.findByPk(id);

        if (!rol) {
            return res.status(404).json({ error: 'Rol no encontrado' });
        }

        // Actualizar datos básicos
        if (nombre !== undefined) rol.nombre = nombre;
        if (descripcion !== undefined) rol.descripcion = descripcion;

        await rol.save();

        // Actualizar permisos si se proporcionaron
        if (permisos !== undefined) {
            await rol.setPermisos(permisos);
        }

        // Obtener el rol actualizado con sus permisos
        const rolActualizado = await Rol.findByPk(id, {
            include: [
                {
                    model: Permiso,
                    as: 'permisos',
                    through: { attributes: [] },
                    attributes: ['id', 'modulo', 'accion', 'descripcion'],
                },
            ],
        });

        res.json(rolActualizado);
    } catch (error) {
        console.error('Error al actualizar rol:', error);

        if (error.name === 'SequelizeUniqueConstraintError') {
            return res.status(400).json({ error: 'Ya existe un rol con este nombre' });
        }

        if (error.name === 'SequelizeValidationError') {
            return res.status(400).json({ error: error.errors[0].message });
        }

        res.status(500).json({ error: 'Error al actualizar rol' });
    }
};

/**
 * Eliminar (desactivar) un rol
 */
const deleteRol = async (req, res) => {
    try {
        const { id } = req.params;

        const rol = await Rol.findByPk(id);

        if (!rol) {
            return res.status(404).json({ error: 'Rol no encontrado' });
        }

        // Desactivar en lugar de eliminar
        rol.activo = false;
        await rol.save();

        res.json({ message: 'Rol desactivado exitosamente' });
    } catch (error) {
        console.error('Error al eliminar rol:', error);
        res.status(500).json({ error: 'Error al eliminar rol' });
    }
};

/**
 * Reactivar un rol
 */
const reactivate = async (req, res) => {
    try {
        const { id } = req.params;

        const rol = await Rol.findByPk(id);

        if (!rol) {
            return res.status(404).json({ error: 'Rol no encontrado' });
        }

        rol.activo = true;
        await rol.save();

        res.json({ message: 'Rol reactivado exitosamente', rol });
    } catch (error) {
        console.error('Error al reactivar rol:', error);
        res.status(500).json({ error: 'Error al reactivar rol' });
    }
};

/**
 * Eliminación masiva de roles
 */
const deleteBulk = async (req, res) => {
    try {
        const { ids } = req.body;

        if (!ids || !Array.isArray(ids) || ids.length === 0) {
            return res.status(400).json({ error: 'Se requiere un array de IDs' });
        }

        await Rol.update(
            { activo: false },
            { where: { id: ids } }
        );

        res.json({ message: `${ids.length} roles desactivados exitosamente` });
    } catch (error) {
        console.error('Error al eliminar roles:', error);
        res.status(500).json({ error: 'Error al eliminar roles' });
    }
};

module.exports = {
    getAll,
    getById,
    create,
    update,
    deleteRol,
    reactivate,
    deleteBulk,
};
