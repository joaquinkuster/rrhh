const { DocumentacionPago, Liquidacion } = require('../models');

const documentacionPagoController = {
    listar: async (req, res) => {
        try {
            const { liquidacionId, estado, tipo } = req.query;
            const where = {};
            if (liquidacionId) where.liquidacionId = liquidacionId;
            if (estado) where.estado = estado;
            if (tipo) where.tipo = tipo;

            const docs = await DocumentacionPago.findAll({
                where,
                include: [{ model: Liquidacion, as: 'liquidacion' }],
                order: [['createdAt', 'DESC']]
            });
            res.json(docs);
        } catch (error) {
            res.status(500).json({ message: 'Error al listar documentación', error: error.message });
        }
    },

    crear: async (req, res) => {
        try {
            const { liquidacionId, tipo, numero, archivoUrl } = req.body;

            // Verificar que la liquidación exista
            const liquidacion = await Liquidacion.findByPk(liquidacionId);
            if (!liquidacion) {
                return res.status(404).json({ message: 'Liquidación no encontrada' });
            }

            const doc = await DocumentacionPago.create({
                liquidacionId,
                tipo,
                numero,
                archivoUrl,
                estado: 'PENDIENTE'
            });
            res.status(201).json(doc);
        } catch (error) {
            res.status(500).json({ message: 'Error al crear documentación', error: error.message });
        }
    },

    actualizarEstado: async (req, res) => {
        try {
            const { id } = req.params;
            const { estado } = req.body; // VERIFICADO, RECHAZADO

            const doc = await DocumentacionPago.findByPk(id);
            if (!doc) return res.status(404).json({ message: 'Documentación no encontrada' });

            doc.estado = estado;
            await doc.save();
            res.json(doc);
        } catch (error) {
            res.status(500).json({ message: 'Error al actualizar estado', error: error.message });
        }
    },

    eliminar: async (req, res) => {
        try {
            const { id } = req.params;
            const doc = await DocumentacionPago.findByPk(id);
            if (!doc) return res.status(404).json({ message: 'Documentación no encontrada' });

            await doc.destroy();
            res.json({ message: 'Documentación eliminada' });
        } catch (error) {
            res.status(500).json({ message: 'Error al eliminar documentación', error: error.message });
        }
    }
};

module.exports = documentacionPagoController;
