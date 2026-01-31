const { ConceptoSalarial } = require('../models');

const conceptoController = {
    // Listar todos los conceptos
    listar: async (req, res) => {
        try {
            const conceptos = await ConceptoSalarial.findAll({
                where: { activo: true }
            });
            res.json(conceptos);
        } catch (error) {
            res.status(500).json({ message: 'Error al listar conceptos', error: error.message });
        }
    },

    // Crear un nuevo concepto
    crear: async (req, res) => {
        try {
            const { nombre, tipo, esPorcentaje, valor, formula } = req.body;
            const concepto = await ConceptoSalarial.create({
                nombre,
                tipo,
                esPorcentaje,
                valor,
                formula
            });
            res.status(201).json(concepto);
        } catch (error) {
            res.status(500).json({ message: 'Error al crear concepto', error: error.message });
        }
    },

    // Actualizar un concepto
    actualizar: async (req, res) => {
        try {
            const { id } = req.params;
            const { nombre, tipo, esPorcentaje, valor, formula } = req.body;

            const concepto = await ConceptoSalarial.findByPk(id);
            if (!concepto) {
                return res.status(404).json({ message: 'Concepto no encontrado' });
            }

            await concepto.update({
                nombre,
                tipo,
                esPorcentaje,
                valor,
                formula
            });

            res.json(concepto);
        } catch (error) {
            res.status(500).json({ message: 'Error al actualizar concepto', error: error.message });
        }
    },

    // Eliminar (lógicamente) un concepto
    eliminar: async (req, res) => {
        try {
            const { id } = req.params;
            const concepto = await ConceptoSalarial.findByPk(id);
            if (!concepto) {
                return res.status(404).json({ message: 'Concepto no encontrado' });
            }

            await concepto.update({ activo: false });
            res.json({ message: 'Concepto eliminado correctamente' });
        } catch (error) {
            res.status(500).json({ message: 'Error al eliminar concepto', error: error.message });
        }
    },

    // Inicializar conceptos por defecto (Seed)
    inicializar: async (req, res) => {
        try {
            const count = await ConceptoSalarial.count();
            if (count > 0) {
                return res.status(400).json({ message: 'Ya existen conceptos cargados' });
            }

            const defaults = [
                { nombre: 'Sueldo Básico', tipo: 'remunerativo', esPorcentaje: false, valor: 0, formula: 'BASICO' },
                { nombre: 'Antigüedad', tipo: 'remunerativo', esPorcentaje: true, valor: 1, formula: 'ANTIGUEDAD' }, // 1% por año
                { nombre: 'Presentismo', tipo: 'remunerativo', esPorcentaje: true, valor: 8.33, formula: 'PRESENTISMO' },
                { nombre: 'Jubilación', tipo: 'deduccion', esPorcentaje: true, valor: 11, formula: 'BRUTO' },
                { nombre: 'Obra Social', tipo: 'deduccion', esPorcentaje: true, valor: 3, formula: 'BRUTO' },
                { nombre: 'Ley 19.032', tipo: 'deduccion', esPorcentaje: true, valor: 3, formula: 'BRUTO' }
            ];

            await ConceptoSalarial.bulkCreate(defaults);
            res.json({ message: 'Conceptos por defecto creados exitosamente' });
        } catch (error) {
            res.status(500).json({ message: 'Error al inicializar conceptos', error: error.message });
        }
    }
};

module.exports = conceptoController;
