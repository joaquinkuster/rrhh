const { Novedad, Empleado } = require('../models');

const novedadController = {
    listar: async (req, res) => {
        try {
            const { empleadoId, tipo } = req.query;
            const where = {};
            if (empleadoId) where.empleadoId = empleadoId;
            if (tipo) where.tipo = tipo;

            const novedades = await Novedad.findAll({
                where,
                include: [{ model: Empleado, as: 'empleado', attributes: ['id', 'nombre', 'apellido'] }],
                order: [['fecha', 'DESC']]
            });
            res.json(novedades);
        } catch (error) {
            res.status(500).json({ message: 'Error al listar novedades', error: error.message });
        }
    },

    crear: async (req, res) => {
        try {
            const { empleadoId, tipo, fecha, cantidad, observaciones } = req.body;
            const novedad = await Novedad.create({
                empleadoId,
                tipo,
                fecha,
                cantidad,
                observaciones
            });
            res.status(201).json(novedad);
        } catch (error) {
            res.status(500).json({ message: 'Error al crear novedad', error: error.message });
        }
    },

    actualizar: async (req, res) => {
        try {
            const { id } = req.params;
            const novedad = await Novedad.findByPk(id);
            if (!novedad) return res.status(404).json({ message: 'Novedad no encontrada' });

            await novedad.update(req.body);
            res.json(novedad);
        } catch (error) {
            res.status(500).json({ message: 'Error al actualizar novedad', error: error.message });
        }
    },

    eliminar: async (req, res) => {
        try {
            const { id } = req.params;
            const novedad = await Novedad.findByPk(id);
            if (!novedad) return res.status(404).json({ message: 'Novedad no encontrada' });

            await novedad.destroy();
            res.json({ message: 'Novedad eliminada' });
        } catch (error) {
            res.status(500).json({ message: 'Error al eliminar novedad', error: error.message });
        }
    }
};

module.exports = novedadController;
