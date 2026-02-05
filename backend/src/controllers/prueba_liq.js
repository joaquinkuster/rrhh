const { liquidarSueldos } = require('../services/prueba_liq');

// controllers/liquidacion.controller.js
const ejecutarLiquidacion = async (req, res) => {
    await liquidarSueldos();
    res.json({ ok: true });
};

module.exports = {
    ejecutarLiquidacion,
};
