const cron = require('node-cron');
const { Op } = require('sequelize');
const { Renuncia, Solicitud, Contrato } = require('../models');
const { generarLiquidacionFinal } = require('../services/prueba_liq');

// Ejecutar todos los días a las 01:00 (después de los otros crones)
cron.schedule('0 1 * * *', async () => {
    try {
        console.log('Ejecutando cron de procesamiento automático de renuncias...');

        const hoy = new Date();
        const hoyStr = hoy.toISOString().split('T')[0];

        // Buscar renuncias aceptadas cuya fecha de baja efectiva ya llegó o pasó
        const renunciasAceptadas = await Renuncia.findAll({
            where: {
                estado: 'aceptada',
                fechaBajaEfectiva: { [Op.lte]: hoyStr }
            },
            include: [{
                model: Solicitud,
                as: 'solicitud',
                where: { activo: true }
            }]
        });

        console.log(`Se encontraron ${renunciasAceptadas.length} renuncias para procesar.`);

        for (const renuncia of renunciasAceptadas) {
            try {
                // 1. Marcar renuncia como procesada
                await renuncia.update({ estado: 'procesada' });

                // 2. Actualizar fecha fin del contrato al día de hoy
                await Contrato.update(
                    { fechaFin: hoyStr },
                    {
                        where: { id: renuncia.solicitud.contratoId },
                        individualHooks: true
                    }
                );

                // 3. Generar liquidación final hasta hoy
                await generarLiquidacionFinal(renuncia.solicitud.contratoId, hoyStr);

                console.log(`Renuncia ${renuncia.id} procesada automáticamente para contrato ${renuncia.solicitud.contratoId}`);
            } catch (error) {
                console.error(`Error al procesar automáticamente la renuncia ${renuncia.id}:`, error);
            }
        }

    } catch (error) {
        console.error('Error en cron de renuncias:', error);
    }
});

module.exports = {
    startRenunciaCron: () => {
        console.log('✅ Cron de renuncias iniciado');
    }
};
