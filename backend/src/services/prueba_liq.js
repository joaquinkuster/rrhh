const { Contrato, Liquidacion, Empleado } = require('../models');
const { calcularLiquidacionContrato } = require('./liquidacionService');
const { parseLocalDate } = require('../utils/fechas');
const { Op } = require('sequelize');

// services/liquidacion.service.js
async function liquidarSueldos() {
    try {
        console.log('Ejecutando cron de liquidaciones automáticas...');

        const hoy = new Date();
        hoy.setHours(0, 0, 0, 0);

        // Obtener contratos en curso
        const contratosActivos = await Contrato.findAll({
            where: {
                estado: 'en_curso',
                activo: true,
            },
            include: [{
                model: Empleado,
                as: 'empleado',
                attributes: ['espacioTrabajoId']
            }]
        });

        let liquidacionesGeneradas = 0;

        for (const contrato of contratosActivos) {
            try {
                // Determinar si ha pasado un mes desde el inicio o desde la última liquidación
                const ultimaLiquidacion = await Liquidacion.findOne({
                    where: {
                        contratoId: contrato.id,
                    },
                    order: [['fechaFin', 'DESC']],
                });

                // Usar parseLocalDate para evitar problemas de zona horaria
                const fechaInicioContrato = parseLocalDate(contrato.fechaInicio);

                let fechaInicioLiquidacion;
                let fechaFinLiquidacion;

                if (ultimaLiquidacion) {
                    // Si ya hay liquidaciones previas, la nueva comienza el día siguiente al fin de la última
                    const fechaUltimaFin = parseLocalDate(ultimaLiquidacion.fechaFin);
                    fechaInicioLiquidacion = new Date(fechaUltimaFin);
                    fechaInicioLiquidacion.setDate(fechaInicioLiquidacion.getDate() + 1);
                } else {
                    // Si es la primera liquidación, comienza en la fecha de inicio del contrato
                    fechaInicioLiquidacion = new Date(fechaInicioContrato);
                }

                // Calcular fecha fin (un mes después)
                fechaFinLiquidacion = new Date(fechaInicioLiquidacion);
                // Sumar 1 mes
                fechaFinLiquidacion.setMonth(fechaFinLiquidacion.getMonth() + 1);
                // Restar 1 día para obtener el último día del mes de la liquidación
                fechaFinLiquidacion.setDate(fechaFinLiquidacion.getDate() - 1);

                // Verificar si ya pasó un mes completo
                if (hoy < fechaFinLiquidacion) {
                    //continue; // Aún no se completa el mes
                }

                // Verificar si ya existe una liquidación para este período
                const liquidacionExistente = await Liquidacion.findOne({
                    where: {
                        contratoId: contrato.id,
                        fechaInicio: fechaInicioLiquidacion.toISOString().split('T')[0],
                        fechaFin: fechaFinLiquidacion.toISOString().split('T')[0],
                    },
                });

                if (liquidacionExistente) {
                    continue; // Ya existe liquidación para este período
                }

                // Calcular liquidación usando el servicio
                const fechaInicioStr = fechaInicioLiquidacion.toISOString().split('T')[0];
                const fechaFinStr = fechaFinLiquidacion.toISOString().split('T')[0];

                const datosLiquidacion = await calcularLiquidacionContrato(contrato, fechaInicioStr, fechaFinStr);

                // Crear liquidación en la base de datos
                await Liquidacion.create({
                    contratoId: contrato.id,
                    fechaInicio: fechaInicioStr,
                    fechaFin: fechaFinStr,
                    basico: datosLiquidacion.basico,
                    antiguedad: datosLiquidacion.antiguedad,
                    presentismo: datosLiquidacion.presentismo,
                    horasExtras: datosLiquidacion.horasExtras,
                    vacaciones: datosLiquidacion.vacaciones,
                    sac: datosLiquidacion.sac,
                    inasistencias: datosLiquidacion.inasistencias,
                    totalBruto: datosLiquidacion.totalBruto,
                    totalRetenciones: datosLiquidacion.totalRetenciones,
                    vacacionesNoGozadas: datosLiquidacion.vacacionesNoGozadas,
                    neto: datosLiquidacion.neto,
                    detalleRemunerativo: datosLiquidacion.detalleRemunerativo,
                    detalleRetenciones: datosLiquidacion.detalleRetenciones,
                    estaPagada: false,
                    activo: true,
                });

                liquidacionesGeneradas++;
                console.log(`Liquidación generada para contrato ${contrato.id}: ${fechaInicioStr} - ${fechaFinStr}`);
            } catch (error) {
                console.error(`Error al generar liquidación para contrato ${contrato.id}:`, error.message);
            }
        }

        if (liquidacionesGeneradas > 0) {
            console.log(`Cron de liquidaciones completado: ${liquidacionesGeneradas} liquidaciones generadas`);
        } else {
            console.log('Cron de liquidaciones completado: No hay liquidaciones pendientes');
        }
    } catch (error) {
        console.error('Error en cron de liquidaciones:', error);
    }
}

module.exports = {
    liquidarSueldos,
};
