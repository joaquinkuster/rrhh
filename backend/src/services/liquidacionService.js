const { Contrato, Licencia, Vacaciones, HorasExtras, ConceptoSalarial, ParametroLaboral, Solicitud } = require('../models');
const { parseLocalDate } = require('../utils/fechas');
const { Op } = require('sequelize');

/**
 * Determinar si un tipo de contrato es de relación de dependencia
 */
const esRelacionDependencia = (tipoContrato) => {
    const tiposRelacion = [
        'tiempo_indeterminado',
        'periodo_prueba',
        'plazo_fijo',
        'eventual',
        'teletrabajo',
    ];
    return tiposRelacion.includes(tipoContrato);
};

/**
 * Helper to ensure a value is a valid number, returns 0 if not
 */
const safeNumber = (value) => {
    const num = parseFloat(value);
    return (isNaN(num) || !isFinite(num)) ? 0 : num;
};


/**
 * Obtener días HÁBILES dentro de un período específico
 */
const getDiasDelPeriodo = (fechaInicio, fechaFin, fechaInicioItem, fechaFinItem) => {
    const { esDiaHabil } = require('../utils/fechas');

    const inicio = parseLocalDate(fechaInicio);
    const fin = parseLocalDate(fechaFin);
    const itemInicio = parseLocalDate(fechaInicioItem);
    const itemFin = parseLocalDate(fechaFinItem);

    // Calcular intersección de períodos
    const interseccionInicio = itemInicio > inicio ? itemInicio : inicio;
    const interseccionFin = itemFin < fin ? itemFin : fin;

    if (interseccionInicio > interseccionFin) {
        return 0; // No hay intersección
    }

    console.log('=== DEBUG getDiasDelPeriodo ===');
    console.log('Item:', fechaInicioItem, 'al', fechaFinItem);
    console.log('Período:', fechaInicio, 'al', fechaFin);
    console.log('Intersección:', interseccionInicio.toISOString().split('T')[0], 'al', interseccionFin.toISOString().split('T')[0]);

    // Contar solo días hábiles en el período de intersección
    let diasHabiles = 0;
    let cursor = new Date(interseccionInicio);

    while (cursor <= interseccionFin) {
        const fechaStr = cursor.toISOString().split('T')[0];
        const habil = esDiaHabil(fechaStr);
        console.log('  -', fechaStr, habil ? 'HÁBIL ✓' : 'NO HÁBIL ✗');
        if (habil) {
            diasHabiles++;
        }
        cursor.setDate(cursor.getDate() + 1);
    }

    console.log('Total días hábiles:', diasHabiles);
    return diasHabiles;
};

/**
 * Calcular días de un semestre (~180)
 */
const getDiasSemestre = (fechaInicio) => {
    const fecha = parseLocalDate(fechaInicio);
    const mes = fecha.getMonth();

    // Junio (mes 5) o Diciembre (mes 11)
    if (mes >= 0 && mes <= 5) {
        // Primer semestre (enero-junio)
        return 181; // Aproximado
    } else {
        // Segundo semestre (julio-diciembre)
        return 184; // Aproximado
    }
};

/**
 * Calcular días trabajados (excluyendo licencias/inasistencias injustificadas)
 */
const getDiasTrabajados = async (contrato, fechaInicio, fechaFin) => {
    const inicio = parseLocalDate(fechaInicio);
    const fin = parseLocalDate(fechaFin);
    const diffTime = Math.abs(fin - inicio);
    const totalDias = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;

    // Obtener licencias injustificadas (inasistencias)
    const licencias = await Licencia.findAll({
        include: [{
            model: Solicitud,
            as: 'solicitud',
            where: {
                contratoId: contrato.id,
                activo: true,
            },
        }],
        where: {
            //esLicencia: false, // Tanto licencias como inasistencias se marcan como injustificadas
            estado: 'injustificada',
        },
    });

    let diasInasistencias = 0;
    for (const licencia of licencias) {
        diasInasistencias += getDiasDelPeriodo(fechaInicio, fechaFin, licencia.fechaInicio, licencia.fechaFin);
    }

    return Math.max(0, totalDias - diasInasistencias);
};

/**
 * Calcular salario básico
 */
const calcularBasico = (contrato) => {
    return parseFloat(contrato.salario) || 0;
};

/**
 * Calcular antigüedad
 * - 1% por año completo sobre el básico
 * - 0.083% por mes si no completa un año
 */
const calcularAntiguedad = (contrato, fechaInicio) => {
    const basico = calcularBasico(contrato);
    const inicioContrato = parseLocalDate(contrato.fechaInicio);
    const fechaCalculo = parseLocalDate(fechaInicio);

    // Calcular meses de antigüedad
    const diffTime = Math.abs(fechaCalculo - inicioContrato);
    const meses = diffTime / (1000 * 60 * 60 * 24 * 30.44); // Promedio de días por mes

    if (meses < 12) {
        // Menos de un año: 0.083% por mes
        return basico * (meses * 0.00083);
    } else {
        // Años completos: 1% por año
        const años = Math.floor(meses / 12);
        return basico * (años * 0.01);
    }
};

/**
 * Calcular presentismo
 * (Básico + Antigüedad) / 12
 * Solo si no supera el límite de ausencias injustificadas
 */
const calcularPresentismo = async (basico, antiguedad, contrato, fechaInicio, fechaFin) => {
    // Obtener límite de ausencias desde parámetros laborales
    const parametros = await ParametroLaboral.findOne();
    const limiteAusencias = parametros ? parametros.limiteAusenciaInjustificada : 1;

    // Obtener inasistencias injustificadas del período
    const licencias = await Licencia.findAll({
        include: [{
            model: Solicitud,
            as: 'solicitud',
            where: {
                contratoId: contrato.id,
                activo: true,
            },
        }],
        where: {
            //esLicencia: false, // Tanto licencias como inasistencias se marcan como injustificadas
            estado: 'injustificada',
        },
    });

    let diasInasistencias = 0;
    for (const licencia of licencias) {
        diasInasistencias += getDiasDelPeriodo(fechaInicio, fechaFin, licencia.fechaInicio, licencia.fechaFin);
    }

    // Si supera el límite, no cobra presentismo
    if (diasInasistencias > limiteAusencias) {
        return 0;
    }

    return (basico + antiguedad) / 12;
};

/**
 * Calcular horas extras
 * Jornal horario = (Básico + Antigüedad + Presentismo) / 192
 * Aplicar 50% o 100% según cada solicitud
 */
const calcularHorasExtras = async (contrato, bruto, fechaInicio, fechaFin) => {
    // Obtener horas extras aprobadas del período
    const horasExtrasAprobadas = await HorasExtras.findAll({
        include: [{
            model: Solicitud,
            as: 'solicitud',
            where: {
                contratoId: contrato.id,
                activo: true,
            },
        }],
        where: {
            estado: 'aprobada',
        },
    });

    const jornalHorario = bruto / 192;
    let totalHorasExtras = 0;

    for (const horaExtra of horasExtrasAprobadas) {
        // Verificar si la fecha está dentro del período liquidado
        const fechaHE = parseLocalDate(horaExtra.fecha);
        const inicio = parseLocalDate(fechaInicio);
        const fin = parseLocalDate(fechaFin);

        if (fechaHE >= inicio && fechaHE <= fin) {
            const porcentaje = horaExtra.tipoHorasExtra;
            const valorHora = jornalHorario * (1 + porcentaje / 100);
            totalHorasExtras += valorHora * horaExtra.cantidadHoras;
        }
    }

    return totalHorasExtras;
};

/**
 * Calcular vacaciones
 * (Básico + Antigüedad + Presentismo) × días de vacaciones / 25
 */
const calcularVacaciones = async (contrato, bruto, fechaInicio, fechaFin) => {
    // Obtener vacaciones aprobadas
    const vacacionesAprobadas = await Vacaciones.findAll({
        include: [{
            model: Solicitud,
            as: 'solicitud',
            where: {
                contratoId: contrato.id,
                activo: true,
            },
        }],
        where: {
            estado: 'aprobada',
            periodo: parseLocalDate(fechaInicio).getFullYear()
        },
    });

    let totalVacaciones = 0;

    for (const vacacion of vacacionesAprobadas) {
        // Calcular días que corresponden a este período
        const diasEnPeriodo = getDiasDelPeriodo(fechaInicio, fechaFin, vacacion.fechaInicio, vacacion.fechaFin);

        console.log('=== CALCULO VACACIONES ===');
        console.log('Período liquidación:', fechaInicio, 'al', fechaFin);
        console.log('Vacación:', vacacion.fechaInicio, 'al', vacacion.fechaFin);
        console.log('Días hábiles en período:', diasEnPeriodo);
        console.log('Monto a liquidar:', (bruto * diasEnPeriodo) / 25);

        if (diasEnPeriodo > 0) {
            totalVacaciones += (bruto * diasEnPeriodo) / 25;
        }
    }

    return totalVacaciones;
};

/**
 * Calcular SAC (Sueldo Anual Complementario)
 * SAC = (Básico + Antigüedad + Presentismo) / 2
 * Se paga en junio y diciembre
 * Si el contrato inició a mitad del semestre, calcular proporcional
 */
const calcularSAC = async (contrato, bruto, fechaInicio, fechaFin) => {
    const inicio = parseLocalDate(fechaInicio);
    const mes = inicio.getMonth();

    // SAC solo se paga en junio (mes 5) y diciembre (mes 11)
    if (mes !== 5 && mes !== 11) {
        return 0;
    }

    const sacCompleto = bruto / 2;

    // Determinar inicio del semestre
    const año = inicio.getFullYear();
    const inicioSemestre = mes === 5
        ? new Date(año, 0, 1) // Enero 1
        : new Date(año, 6, 1); // Julio 1

    const inicioContrato = parseLocalDate(contrato.fechaInicio);

    // Si el contrato comenzó en este semestre, calcular proporcional
    if (inicioContrato > inicioSemestre) {
        const diasTrabajados = await getDiasTrabajados(contrato, contrato.fechaInicio, fechaFin);
        const diasSemestre = getDiasSemestre(fechaInicio);

        if (isNaN(diasTrabajados) || isNaN(diasSemestre) || diasSemestre === 0) {
            return 0;
        }

        return (sacCompleto * diasTrabajados) / diasSemestre;
    }

    return sacCompleto;
};

/**
 * Calcular inasistencias injustificadas (descuento)
 * (Básico + Antigüedad + Presentismo) / 30 × cantidad de inasistencias
 */
const calcularInasistencias = async (contrato, bruto, fechaInicio, fechaFin) => {
    // Obtener licencias injustificadas (sin goce de sueldo)
    const licencias = await Licencia.findAll({
        include: [{
            model: Solicitud,
            as: 'solicitud',
            where: {
                contratoId: contrato.id,
                activo: true,
            },
        }],
        where: {
            //esLicencia: false,
            estado: 'injustificada',
        },
    });

    let diasInasistencias = 0;
    for (const licencia of licencias) {
        diasInasistencias += getDiasDelPeriodo(fechaInicio, fechaFin, licencia.fechaInicio, licencia.fechaFin);
    }

    return (bruto / 30) * diasInasistencias;
};

/**
 * Calcular retenciones desde conceptos salariales en DB
 */
const calcularRetenciones = async (totalBruto, tipoContrato) => {
    const conceptos = await ConceptoSalarial.findAll({
        where: {
            tipo: 'deduccion',
            activo: true,
        },
    });

    let totalRetenciones = 0;
    const detalleRetenciones = [];

    for (const concepto of conceptos) {
        // Para contratos no laborales, solo aplicar Obra Social
        if (!esRelacionDependencia(tipoContrato) && concepto.nombre !== 'Obra Social') {
            continue;
        }

        let monto = 0;
        if (concepto.esPorcentaje) {
            monto = totalBruto * (parseFloat(concepto.valor) / 100);
        } else {
            monto = parseFloat(concepto.valor);
        }

        // Ensure monto is a valid number
        if (isNaN(monto) || !isFinite(monto)) {
            monto = 0;
        }

        totalRetenciones += monto;
        detalleRetenciones.push({
            nombre: concepto.nombre,
            tipo: 'deduccion',
            porcentaje: concepto.esPorcentaje ? concepto.valor : null,
            monto: parseFloat(monto.toFixed(2)),
        });
    }

    // Ensure totalRetenciones is valid
    if (isNaN(totalRetenciones) || !isFinite(totalRetenciones)) {
        totalRetenciones = 0;
    }

    return { totalRetenciones, detalleRetenciones };
};

const calcularDiasCorrespondientes = async (contrato, fechaFinLiquidacion) => {
    const diasEfectivos = await getDiasTrabajados(contrato, contrato.fechaInicio, fechaFinLiquidacion);

    // Si trabajó menos de la mitad del año
    if (diasEfectivos < 180) {
        return Math.floor(diasEfectivos / 20);
    }

    const inicio = parseLocalDate(contrato.fechaInicio);
    const fecha = parseLocalDate(fechaFinLiquidacion);

    let anios = fecha.getFullYear() - inicio.getFullYear();

    const cumplioEsteAnio =
        fecha.getMonth() > inicio.getMonth() ||
        (fecha.getMonth() === inicio.getMonth() && fecha.getDate() >= inicio.getDate());

    if (!cumplioEsteAnio) {
        anios--;
    }

    // Devolver días según antigüedad (Ley 20.744 Argentina)
    if (anios < 5) return 14;
    if (anios < 10) return 21;
    if (anios < 20) return 28;
    return 35;
}

/**
 * Calcular vacaciones no gozadas
 * Solo después del 30 de abril
 * Período: 1 mayo año anterior al 30 abril año actual
 */
const calcularVacacionesNoGozadas = async (contrato, bruto, fechaInicio, fechaFin) => {
    const fecha = parseLocalDate(fechaInicio);
    const mes = fecha.getMonth();
    const año = fecha.getFullYear();

    // Solo calcular en mayo (mes 4), una vez al año
    if (mes !== 4) {
        return 0;
    }

    // Período de vacaciones: 1 mayo año anterior al 30 abril año actual
    const inicioPeriodoVacacional = new Date(año - 1, 4, 1); // Mayo 1 año anterior
    const finPeriodoVacacional = new Date(año, 3, 30); // Abril 30 año actual

    // Obtener vacaciones aprobadas del período vacacional
    const vacacionesAprobadas = await Vacaciones.findAll({
        include: [{
            model: Solicitud,
            as: 'solicitud',
            where: {
                contratoId: contrato.id,
                activo: true,
            },
        }],
        where: {
            estado: 'aprobada',
            periodo: parseLocalDate(fechaInicio).getFullYear(),
        },
    });

    // Calcular días tomados dentro del período vacacional
    let diasTomados = 0;
    for (const vacacion of vacacionesAprobadas) {
        diasTomados += getDiasDelPeriodo(
            inicioPeriodoVacacional.toISOString().split('T')[0],
            finPeriodoVacacional.toISOString().split('T')[0],
            vacacion.fechaInicio,
            vacacion.fechaFin
        );
    }

    // Días de vacaciones según antigüedad (Argentina)
    const diasCorrespondientes = await calcularDiasCorrespondientes(contrato, fechaFin);

    const diasNoGozados = Math.max(0, diasCorrespondientes - diasTomados);

    console.log('=== VACACIONES NO GOZADAS ===');
    console.log('Período vacacional:', inicioPeriodoVacacional.toISOString().split('T')[0], 'al', finPeriodoVacacional.toISOString().split('T')[0]);
    console.log('Días correspondientes según antigüedad:', diasCorrespondientes);
    console.log('Días tomados en el período:', diasTomados);
    console.log('Días no gozados:', diasNoGozados);
    console.log('Bruto:', bruto);
    console.log('Monto a pagar:', (bruto * diasNoGozados) / 25);

    if (diasNoGozados === 0) {
        return 0;
    }

    return (bruto * diasNoGozados) / 25;
};

/**
 * Calcular liquidación para contratos de relación de dependencia
 */
const calcularRemunerativos = async (contrato, fechaInicio, fechaFin) => {

    const basico = calcularBasico(contrato);
    const antiguedad = calcularAntiguedad(contrato, fechaInicio);
    const presentismo = await calcularPresentismo(basico, antiguedad, contrato, fechaInicio, fechaFin);
    const bruto = basico + antiguedad + presentismo;

    const horasExtras = await calcularHorasExtras(contrato, bruto, fechaInicio, fechaFin);
    const vacaciones = await calcularVacaciones(contrato, bruto, fechaInicio, fechaFin);
    const sac = await calcularSAC(contrato, bruto, fechaInicio, fechaFin);
    const inasistencias = await calcularInasistencias(contrato, bruto, fechaInicio, fechaFin);

    const totalBruto = bruto + horasExtras + vacaciones + sac - inasistencias;

    const { totalRetenciones, detalleRetenciones } = await calcularRetenciones(totalBruto, contrato.tipoContrato);
    const vacacionesNoGozadas = await calcularVacacionesNoGozadas(contrato, bruto, fechaInicio, fechaFin);

    const neto = totalBruto - totalRetenciones + vacacionesNoGozadas;

    // Construir detalle de retenciones (solo retenciones, no todos los conceptos)
    // El detalle completo se maneja en el frontend

    return {
        basico: safeNumber(basico),
        antiguedad: safeNumber(antiguedad),
        presentismo: safeNumber(presentismo),
        horasExtras: safeNumber(horasExtras),
        vacaciones: safeNumber(vacaciones),
        sac: safeNumber(sac),
        inasistencias: safeNumber(inasistencias),
        totalBruto: safeNumber(totalBruto),
        totalRetenciones: safeNumber(totalRetenciones),
        vacacionesNoGozadas: safeNumber(vacacionesNoGozadas),
        neto: safeNumber(neto),
        detalleRetenciones,
    };
};

/**
 * Calcular liquidación para contratos no laborales / educativos
 */
const calcularNoLaborales = async (contrato, fechaInicio, fechaFin) => {
    const basico = calcularBasico(contrato);

    // Obtener inasistencias del período
    const licencias = await Licencia.findAll({
        include: [{
            model: Solicitud,
            as: 'solicitud',
            where: {
                contratoId: contrato.id,
                activo: true,
            },
        }],
        where: {
            //esLicencia: false,
            estado: 'injustificada',
        },
    });

    let diasInasistencias = 0;
    for (const licencia of licencias) {
        diasInasistencias += getDiasDelPeriodo(fechaInicio, fechaFin, licencia.fechaInicio, licencia.fechaFin);
    }

    // Descuento: Salario base / 80 horas mensuales × cantidad de inasistencias
    const descuentoInasistencias = (basico / 80) * diasInasistencias;
    const totalBruto = basico - descuentoInasistencias;

    // Solo Obra Social para no laborales
    const { totalRetenciones, detalleRetenciones } = await calcularRetenciones(totalBruto, contrato.tipoContrato);

    const neto = totalBruto - totalRetenciones;

    // Detalle de retenciones (solo retenciones)

    return {
        basico: safeNumber(basico),
        antiguedad: 0,
        presentismo: 0,
        horasExtras: 0,
        vacaciones: 0,
        sac: 0,
        inasistencias: safeNumber(descuentoInasistencias),
        totalBruto: safeNumber(totalBruto),
        totalRetenciones: safeNumber(totalRetenciones),
        vacacionesNoGozadas: 0,
        neto: safeNumber(neto),
        detalleRetenciones,
    };
};

/**
 * Calcular liquidación para un contrato (entrada principal)
 */
const calcularLiquidacionContrato = async (contrato, fechaInicio, fechaFin) => {
    if (esRelacionDependencia(contrato.tipoContrato)) {
        return await calcularRemunerativos(contrato, fechaInicio, fechaFin);
    } else {
        return await calcularNoLaborales(contrato, fechaInicio, fechaFin);
    }
};

module.exports = {
    calcularLiquidacionContrato,
    esRelacionDependencia,
    calcularBasico,
    calcularAntiguedad,
    calcularPresentismo,
    calcularHorasExtras,
    calcularVacaciones,
    calcularSAC,
    calcularInasistencias,
    calcularRetenciones,
    calcularVacacionesNoGozadas,
    getDiasDelPeriodo,
    getDiasSemestre,
    getDiasTrabajados,
};
