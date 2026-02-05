const { ConceptoSalarial } = require('../models');
const { Op } = require('sequelize');

// Obtener todos los conceptos salariales
const getAll = async (req, res) => {
    try {
        const { tipo, activo } = req.query;

        const where = {};

        if (tipo) {
            where.tipo = tipo;
        }

        if (activo !== undefined) {
            where.activo = activo === 'true' || activo === true || activo === '1';
        }

        const conceptos = await ConceptoSalarial.findAll({
            where,
            order: [['nombre', 'ASC']],
        });


        res.json(conceptos);
    } catch (error) {
        console.error('Error al obtener conceptos salariales:', error);
        res.status(500).json({ error: error.message });
    }
};

// Obtener concepto por ID
const getById = async (req, res) => {
    try {
        const { id } = req.params;

        const concepto = await ConceptoSalarial.findByPk(id);

        if (!concepto) {
            return res.status(404).json({ error: 'Concepto salarial no encontrado' });
        }

        res.json(concepto);
    } catch (error) {
        console.error('Error al obtener concepto salarial:', error);
        res.status(500).json({ error: error.message });
    }
};

// Crear concepto salarial
const create = async (req, res) => {
    try {
        const { nombre, tipo, esPorcentaje, valor } = req.body;

        // Validar campos requeridos
        if (!nombre || !tipo || valor === undefined) {
            return res.status(400).json({ error: 'Nombre, tipo y valor son requeridos' });
        }

        const concepto = await ConceptoSalarial.create({
            nombre,
            tipo,
            esPorcentaje: esPorcentaje || false,
            valor,
            activo: true,
        });

        res.status(201).json({ message: 'Concepto salarial creado exitosamente', concepto });
    } catch (error) {
        console.error('Error al crear concepto salarial:', error);
        res.status(400).json({ error: error.message });
    }
};

// Actualizar concepto salarial
const update = async (req, res) => {
    try {
        const { id } = req.params;
        const { nombre, tipo, esPorcentaje, valor, activo } = req.body;

        const concepto = await ConceptoSalarial.findByPk(id);

        if (!concepto) {
            return res.status(404).json({ error: 'Concepto salarial no encontrado' });
        }

        if (nombre !== undefined) concepto.nombre = nombre;
        if (tipo !== undefined) concepto.tipo = tipo;
        if (esPorcentaje !== undefined) concepto.esPorcentaje = esPorcentaje;
        if (valor !== undefined) concepto.valor = valor;
        if (activo !== undefined) concepto.activo = activo;

        await concepto.save();

        res.json({ message: 'Concepto salarial actualizado exitosamente', concepto });
    } catch (error) {
        console.error('Error al actualizar concepto salarial:', error);
        res.status(400).json({ error: error.message });
    }
};

// Eliminar concepto salarial
const remove = async (req, res) => {
    try {
        const { id } = req.params;

        const concepto = await ConceptoSalarial.findByPk(id);

        if (!concepto) {
            return res.status(404).json({ error: 'Concepto salarial no encontrado' });
        }

        // Validar que no sea un concepto obligatorio (seed)
        const conceptosObligatorios = ['Jubilación', 'Obra Social', 'PAMI', 'Cuota Sindical'];
        if (conceptosObligatorios.includes(concepto.nombre)) {
            return res.status(400).json({ error: 'No se puede eliminar un concepto obligatorio' });
        }

        await concepto.destroy();

        res.json({ message: 'Concepto salarial eliminado exitosamente' });
    } catch (error) {
        console.error('Error al eliminar concepto salarial:', error);
        res.status(500).json({ error: error.message });
    }
};

module.exports = {
    getAll,
    getById,
    create,
    update,
    remove,
};
