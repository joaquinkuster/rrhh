const cron = require('node-cron');
const { liquidarSueldos } = require('../services/prueba_liq');

// Ejecutar todos los días a las 00:00
cron.schedule('0 0 * * *', async () => {
    await liquidarSueldos();
});

module.exports = {
    startLiquidacionCron: () => {
        console.log('Cron de liquidaciones iniciado');
    },
};
