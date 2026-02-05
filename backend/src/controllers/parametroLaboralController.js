const { ParametroLaboral } = require('../models');

// Obtener parámetros laborales (singleton)
const get = async (req, res) => {
    try {
        let parametros = await ParametroLaboral.findOne();

        // Si no existe, crear con valores por defecto
        if (!parametros) {
            parametros = await ParametroLaboral.create({
                limiteAusenciaInjustificada: 1,
            });
        }

        res.json(parametros);
    } catch (error) {
        console.error('Error al obtener parámetros laborales:', error);
        res.status(500).json({ error: error.message });
    }
};

// Actualizar parámetros laborales (singleton)
const update = async (req, res) => {
    try {
        const { limiteAusenciaInjustificada } = req.body;

        let parametros = await ParametroLaboral.findOne();

        // Si no existe, crear
        if (!parametros) {
            parametros = await ParametroLaboral.create({
                limiteAusenciaInjustificada: limiteAusenciaInjustificada !== undefined ? limiteAusenciaInjustificada : 1,
            });
        } else {
            // Actualizar
            if (limiteAusenciaInjustificada !== undefined) {
                parametros.limiteAusenciaInjustificada = limiteAusenciaInjustificada;
            }
            await parametros.save();
        }

        res.json({ message: 'Parámetros laborales actualizados exitosamente', parametros });
    } catch (error) {
        console.error('Error al actualizar parámetros laborales:', error);
        res.status(400).json({ error: error.message });
    }
};

module.exports = {
    get,
    update,
};
