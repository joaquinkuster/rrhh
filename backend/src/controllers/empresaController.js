const { Empresa, Area, Departamento, Puesto } = require('../models');
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

// Obtener empresa por ID con toda su estructura
const getById = async (req, res) => {
    try {
        const empresa = await Empresa.findByPk(req.params.id, {
            include: [{
                model: Area,
                as: 'areas',
                include: [{
                    model: Departamento,
                    as: 'departamentos',
                    include: [{
                        model: Puesto,
                        as: 'puestos'
                    }]
                }]
            }]
        });

        if (!empresa) {
            return res.status(404).json({ error: 'Empresa no encontrada' });
        }

        res.json(empresa);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Crear empresa con estructura anidada (Areas -> Departamentos -> Puestos)
const create = async (req, res) => {
    try {
        const { nombre, email, telefono, industria, direccion, areas } = req.body;

        const nuevaEmpresa = await Empresa.create({
            nombre,
            email,
            telefono,
            industria,
            direccion,
            areas // Sequelize creará automáticamente la estructura anidada si se pasa el include adecuado
        }, {
            include: [{
                model: Area,
                as: 'areas',
                include: [{
                    model: Departamento,
                    as: 'departamentos',
                    include: [{
                        model: Puesto,
                        as: 'puestos'
                    }]
                }]
            }]
        });

        res.status(201).json(nuevaEmpresa);
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

// Actualizar empresa con estructura anidada
const update = async (req, res) => {
    try {
        const { id } = req.params;
        const { nombre, email, telefono, industria, direccion, areas } = req.body;

        const empresa = await Empresa.findByPk(id);
        if (!empresa) {
            return res.status(404).json({ error: 'Empresa no encontrada' });
        }

        // Actualizar datos básicos de la empresa
        await empresa.update({ nombre, email, telefono, industria, direccion });

        // Si se envían áreas, eliminar las existentes y crear las nuevas
        if (areas !== undefined) {
            // Obtener IDs de áreas existentes
            const areasExistentes = await Area.findAll({ where: { empresaId: id } });
            const areaIds = areasExistentes.map(a => a.id);

            // Obtener IDs de departamentos pertenecientes a estas áreas
            const deptosExistentes = await Departamento.findAll({ where: { areaId: areaIds } });
            const deptoIds = deptosExistentes.map(d => d.id);

            // Eliminar en orden correcto: puestos -> departamentos -> áreas
            if (deptoIds.length > 0) {
                await Puesto.destroy({ where: { departamentoId: deptoIds } });
            }
            if (areaIds.length > 0) {
                await Departamento.destroy({ where: { areaId: areaIds } });
                await Area.destroy({ where: { empresaId: id } });
            }

            // Crear nuevas áreas con estructura anidada
            if (areas && areas.length > 0) {
                for (const areaData of areas) {
                    const { departamentos, ...areaRest } = areaData;
                    const newArea = await Area.create({ ...areaRest, empresaId: id });

                    if (departamentos && departamentos.length > 0) {
                        for (const deptoData of departamentos) {
                            const { puestos, ...deptoRest } = deptoData;
                            const newDepto = await Departamento.create({ ...deptoRest, areaId: newArea.id });

                            if (puestos && puestos.length > 0) {
                                for (const puestoData of puestos) {
                                    await Puesto.create({ ...puestoData, departamentoId: newDepto.id });
                                }
                            }
                        }
                    }
                }
            }
        }

        // Obtener empresa actualizada con estructura completa
        const empresaActualizada = await Empresa.findByPk(id, {
            include: [{
                model: Area,
                as: 'areas',
                include: [{
                    model: Departamento,
                    as: 'departamentos',
                    include: [{
                        model: Puesto,
                        as: 'puestos'
                    }]
                }]
            }]
        });

        res.json(empresaActualizada);
    } catch (error) {
        if (error.name === 'SequelizeValidationError') {
            const messages = error.errors.map(e => e.message);
            return res.status(400).json({ error: messages.join(', ') });
        }
        res.status(500).json({ error: error.message });
    }
};

module.exports = {
    getAll,
    getById,
    create,
    update,
    remove,
    removeBulk,
};
