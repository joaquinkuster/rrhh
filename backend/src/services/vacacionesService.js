const { Solicitud, Vacaciones, Licencia, HorasExtras, Renuncia, Contrato } = require('../models');
const { Op } = require('sequelize');
const { condicionSolapamientoFechas, condicionFechaEnRango, calcularDiasEntre } = require('../utils/solapamiento');
const { calcularDiasEfectivos, calcularAntiguedadEnAnios } = require('../services/empleadoService');
const { getLicenciasNoAprobadas } = require('../services/licenciaService');
const { esDiaHabil, parseLocalDate } = require('../utils/fechas');

/**
 * Valida creación/edición de vacaciones
 * @param {number} contratoId - ID del contrato
 * @param {object} datos - Datos de la solicitud
 * @param {number|null} solicitudIdActual - ID de solicitud actual (para edición)
 * @returns {object} - { valido: boolean, error?: string }
 */
const validarVacaciones = async (contratoId, datos, solicitudIdActual = null) => {
    const { fechaInicio, fechaFin, periodo } = datos;

    // 0. Validar rango de fechas según período (1 de Mayo año X al 30 de Abril año X+1)
    if (periodo && fechaInicio && fechaFin) {
        const anioPeriodo = parseInt(periodo);
        const fechaMinima = `${anioPeriodo}-05-01`;
        const fechaMaxima = `${anioPeriodo + 1}-04-30`;

        if (fechaInicio < fechaMinima || fechaInicio > fechaMaxima) {
            return {
                valido: false,
                error: `Para el período ${periodo}, la fecha de inicio debe estar entre el 01/05/${anioPeriodo} y el 30/04/${anioPeriodo + 1}`
            };
        }
        if (fechaFin < fechaMinima || fechaFin > fechaMaxima) {
            return {
                valido: false,
                error: `Para el período ${periodo}, la fecha de fin debe estar entre el 01/05/${anioPeriodo} y el 30/04/${anioPeriodo + 1}`
            };
        }
    }

    // Condición para excluir la solicitud actual (para edición)
    const excludeCondition = solicitudIdActual
        ? { id: { [Op.ne]: solicitudIdActual } }
        : {};

    // 1. Verificar si hay vacaciones pendientes
    const pendiente = await Solicitud.findOne({
        where: {
            contratoId,
            tipoSolicitud: 'vacaciones',
            activo: true,
            ...excludeCondition
        },
        include: [{
            model: Vacaciones,
            as: 'vacaciones',
            where: { estado: 'pendiente' }
        }]
    });

    if (pendiente) {
        return { valido: false, error: 'Ya existe una solicitud de vacaciones pendiente para este contrato. Revísala antes de continuar.' };
    }

    // 2. Verificar solapamiento con vacaciones aprobadas
    const vacacionesAprobadas = await Solicitud.findOne({
        where: {
            contratoId,
            tipoSolicitud: 'vacaciones',
            activo: true,
            ...excludeCondition
        },
        include: [{
            model: Vacaciones,
            as: 'vacaciones',
            where: {
                estado: 'aprobada',
                ...condicionSolapamientoFechas(fechaInicio, fechaFin)
            }
        }]
    });

    if (vacacionesAprobadas) {
        return { valido: false, error: 'Las fechas se solapan con vacaciones aprobadas existentes. Por favor, elige otro período.' };
    }

    // 3. Verificar solapamiento con licencias justificadas
    const licenciasJustificadas = await Solicitud.findOne({
        where: {
            contratoId,
            tipoSolicitud: 'licencia',
            activo: true
        },
        include: [{
            model: Licencia,
            as: 'licencia',
            where: {
                estado: 'justificada',
                ...condicionSolapamientoFechas(fechaInicio, fechaFin)
            }
        }]
    });

    if (licenciasJustificadas) {
        return { valido: false, error: 'Las fechas se solapan con una licencia justificada existente. Por favor, elige otro período.' };
    }

    // 4. Verificar solapamiento con horas extras aprobadas
    const horasExtrasAprobadas = await Solicitud.findOne({
        where: {
            contratoId,
            tipoSolicitud: 'horas_extras',
            activo: true
        },
        include: [{
            model: HorasExtras,
            as: 'horasExtras',
            where: {
                estado: 'aprobada',
                fecha: {
                    [Op.between]: [fechaInicio, fechaFin]
                }
            }
        }]
    });

    if (horasExtrasAprobadas) {
        return { valido: false, error: 'Las fechas incluyen un día con horas extras aprobadas. Por favor, elige otro período.' };
    }

    return { valido: true };
};

/**
 * Ejecuta acciones al aprobar vacaciones
 * @param {number} contratoId - ID del contrato
 * @param {number} diasAprobados - Cantidad de días de vacaciones
 * @param {object} transaction - Transacción de Sequelize
 */
const onAprobacion = async (contratoId, diasAprobados, transaction) => {
    // Si hay renuncia aprobada, sumar días a fechaBajaEfectiva
    const renunciaAprobada = await Solicitud.findOne({
        where: {
            contratoId,
            tipoSolicitud: 'renuncia',
            activo: true
        },
        include: [{
            model: Renuncia,
            as: 'renuncia',
            where: { estado: 'aceptada' }
        }]
    });

    if (renunciaAprobada && renunciaAprobada.renuncia) {
        const fechaBaja = new Date(renunciaAprobada.renuncia.fechaBajaEfectiva);
        fechaBaja.setDate(fechaBaja.getDate() + diasAprobados);

        await renunciaAprobada.renuncia.update({
            fechaBajaEfectiva: fechaBaja.toISOString().split('T')[0]
        }, { transaction });
    }
};

/**
 * Calcula días de vacaciones según Ley 20.744
 */
const calcularDiasCorrespondientesVacaciones = async (contrato) => {
    const licencias = await getLicenciasNoAprobadas(contrato);
    const diasEfectivos = calcularDiasEfectivos(
        contrato.fechaInicio,
        licencias
    );

    // Si trabajó menos de la mitad del año
    if (diasEfectivos < 180) {
        return Math.floor(diasEfectivos / 20);
    }

    const antiguedad = calcularAntiguedadEnAnios(contrato.fechaInicio);

    if (antiguedad < 5) return 14;
    if (antiguedad < 10) return 21;
    if (antiguedad < 20) return 28;
    return 35;
};

// Get vacation days info for a contract
const getDiasDisponiblesVacaciones = async (req, res) => {
    try {
        const { contratoId } = req.params;
        const { periodo } = req.query;

        const contrato = await Contrato.findByPk(contratoId);
        if (!contrato) {
            return res.status(404).json({ error: 'Contrato no encontrado' });
        }

        const diasCorrespondientes = await calcularDiasCorrespondientesVacaciones(contrato);

        // Calculate days taken from approved vacations in the period
        const vacacionesAprobadas = await Solicitud.findAll({
            where: {
                contratoId: parseInt(contratoId),
                tipoSolicitud: 'vacaciones',
                activo: true,
            },
            include: [{
                model: Vacaciones,
                as: 'vacaciones',
                where: {
                    periodo: periodo ? parseInt(periodo) : new Date().getFullYear(),
                    estado: 'aprobada',
                },
            }],
        });

        const diasTomados = vacacionesAprobadas.reduce((sum, sol) => {
            return sum + (sol.vacaciones?.diasSolicitud || 0);
        }, 0);

        const diasDisponibles = Math.max(0, diasCorrespondientes - diasTomados);

        res.json({
            diasCorrespondientes,
            diasTomados,
            diasDisponibles,
            antiguedad: contrato.fechaInicio,
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

const getDiasSolicitadosVacaciones = async (req, res) => {
    try {
        const { fechaInicio, fechaFin } = req.query;

        if (!fechaInicio || !fechaFin) {
            return res.status(400).json({ error: 'Faltan parámetros: fechaInicio y fechaFin' });
        }

        const inicio = parseLocalDate(fechaInicio);
        inicio.setHours(0, 0, 0, 0);
        const fin = parseLocalDate(fechaFin);
        fin.setHours(0, 0, 0, 0);

        if (fin < inicio) {
            return res.status(400).json({ error: 'La fecha fin no puede ser anterior a la fecha inicio' });
        }

        let diasSolicitud = 0;
        let cursor = new Date(inicio);

        // Contar días hábiles
        while (cursor <= fin) {
            const habil = esDiaHabil(cursor.toISOString().split('T')[0]);

            console.log(
                cursor.toISOString().split('T')[0],
                habil ? 'HÁBIL' : 'NO HÁBIL'
            );

            if (habil) {
                diasSolicitud++;
            }

            cursor.setDate(cursor.getDate() + 1);
        }

        // Fecha de regreso (primer día hábil)
        let fechaRegreso = new Date(fin);
        fechaRegreso.setDate(fechaRegreso.getDate() + 1);

        while (!esDiaHabil(fechaRegreso.toISOString().split('T')[0])) {
            fechaRegreso.setDate(fechaRegreso.getDate() + 1);
        }

        res.json({
            diasSolicitud,
            fechaRegreso: fechaRegreso.toISOString().split('T')[0],
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};


module.exports = {
    validarVacaciones,
    onAprobacion,
    calcularDiasCorrespondientesVacaciones,
    getDiasDisponiblesVacaciones,
    getDiasSolicitadosVacaciones
};
