const { parseLocalDate } = require('../utils/fechas');

/**
 * Calcula días efectivos trabajados desde inicio del contrato
 */
const calcularDiasEfectivos = (fechaInicio, licencias) => {
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);

    const inicio = parseLocalDate(fechaInicio);
    inicio.setHours(0, 0, 0, 0);

    const MS_POR_DIA = 1000 * 60 * 60 * 24;

    const diasTotales = Math.floor((hoy - inicio) / MS_POR_DIA);

    let diasNoTrabajados = 0;

    for (const licencia of licencias) {
        const desde = parseLocalDate(licencia.fechaInicio);
        const hasta = parseLocalDate(licencia.fechaFin);

        desde.setHours(0, 0, 0, 0);
        hasta.setHours(0, 0, 0, 0);

        const inicioEfectivo = new Date(Math.max(desde, inicio));
        const finEfectivo = new Date(Math.min(hasta, hoy));

        // Si no hay intersección, se ignora
        if (inicioEfectivo > finEfectivo) continue;

        // Días de licencia efectivamente transcurridos (INCLUSIVO)
        diasNoTrabajados +=
            Math.floor((finEfectivo - inicioEfectivo) / MS_POR_DIA) + 1;
    }

    return Math.max(diasTotales - diasNoTrabajados, 0);
};

/**
 * Calcula antigüedad en años cumplidos
 */
const calcularAntiguedadEnAnios = (fechaInicio) => {
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    const inicio = parseLocalDate(fechaInicio);
    inicio.setHours(0, 0, 0, 0);

    let anios = hoy.getFullYear() - inicio.getFullYear();

    const cumplioEsteAnio =
        hoy.getMonth() > inicio.getMonth() ||
        (hoy.getMonth() === inicio.getMonth() && hoy.getDate() >= inicio.getDate());

    if (!cumplioEsteAnio) {
        anios--;
    }

    return anios;
};

module.exports = {
    calcularDiasEfectivos,
    calcularAntiguedadEnAnios
};