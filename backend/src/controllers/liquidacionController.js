const { Liquidacion, DetalleLiquidacion, Empleado, Contrato, ConceptoSalarial, Puesto } = require('../models');
const { Op } = require('sequelize');

// Helper function to calculate liquidation for a single employee
const calculateLiquidationForEmployee = async (empleado, periodo, conceptos) => {
    const contrato = empleado.contratos[0]; // Assumes active contract is included
    if (!contrato) return null;

    // Determine liquidation type
    let tipoLiquidacion = 'SUELDO';
    if (contrato.esNoLaboral()) {
        tipoLiquidacion = contrato.tipoContrato === 'beca' ? 'BECA' : 'HONORARIOS';
    }

    let totalBruto = 0;
    let totalDeducciones = 0;
    const detalles = [];

    // --- DEPENDENCY RELATIONSHIP LOGIC ---
    if (contrato.esRelacionDependencia()) {
        // Calculate seniority
        const fechaInicio = new Date(contrato.fechaInicio);
        const hoy = new Date();
        let antiguedad = hoy.getFullYear() - fechaInicio.getFullYear();
        const m = hoy.getMonth() - fechaInicio.getMonth();
        if (m < 0 || (m === 0 && hoy.getDate() < fechaInicio.getDate())) {
            antiguedad--;
        }

        // 1. Basic Salary
        let sueldoBasico = parseFloat(contrato.salario || 0);

        // Calculate proportional if started this month
        const [anio, mes] = periodo.split('-');
        const fechaPeriodoInicio = new Date(anio, mes - 1, 1);
        const fechaPeriodoFin = new Date(anio, mes, 0);

        if (fechaInicio > fechaPeriodoInicio && fechaInicio <= fechaPeriodoFin) {
            const diasTrabajados = 30 - fechaInicio.getDate() + 1;
            sueldoBasico = (sueldoBasico / 30) * diasTrabajados;
        }

        // Add BASICO
        detalles.push({
            conceptoNombre: 'BASICO', // Fixed name as per Excel
            tipo: 'remunerativo',
            monto: sueldoBasico,
            cantidad: 1
        });
        totalBruto += sueldoBasico;

        // 2. Add ANTIGUEDAD
        let antiguedadMonto = 0;
        // Find ANTIGUEDAD concept for value/percentage if needed, but logic is somewhat fixed or derived
        const conceptoAntiguedad = conceptos.find(c => c.formula === 'ANTIGUEDAD');
        const antiguedadValor = conceptoAntiguedad ? (conceptoAntiguedad.valor / 100) : 0.01; // Default 1% per year if missing

        if (antiguedad > 0) {
            antiguedadMonto = sueldoBasico * (antiguedad * antiguedadValor);
            detalles.push({
                conceptoNombre: 'ANTIGUEDAD', // Fixed name as per Excel (ANTIG -> ANTIGUEDAD for clarity)
                tipo: 'remunerativo',
                monto: antiguedadMonto,
                cantidad: antiguedad
            });
            totalBruto += antiguedadMonto;
        }

        // 3. Add PRESENTISMO
        // Formula: (Basico + Antig) / 12
        const presentismoMonto = (sueldoBasico + antiguedadMonto) / 12;
        detalles.push({
            conceptoNombre: 'PRESENTISMO',
            tipo: 'remunerativo',
            monto: presentismoMonto,
            cantidad: 1
        });
        totalBruto += presentismoMonto;

        // 4. Generic Calculation for ALL Active Concepts
        // Track what we've already calculated to avoid duplicates
        const calculatedNames = new Set(['BASICO', 'ANTIGUEDAD', 'PRESENTISMO']);
        const normalize = (str) => str ? str.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toUpperCase() : '';

        // Filter concepts that we haven't already calculated
        const otherConcepts = conceptos.filter(c => !calculatedNames.has(normalize(c.nombre)));

        for (const concept of otherConcepts) {
            let base = 0;
            const normFormula = normalize(concept.formula);

            // Determine Base Amount based on Formula
            if (normFormula === 'BRUTO' || normFormula === 'TOTAL_BRUTO') {
                base = totalBruto;
            } else if (normFormula === 'BASICO') {
                base = sueldoBasico;
            } else if (normFormula === 'ANTIGUEDAD') {
                base = antiguedadMonto;
            } else if (normFormula === 'PRESENTISMO') {
                base = presentismoMonto;
            } else {
                // Default: use totalBruto for deductions, sueldoBasico for remunerative
                base = concept.tipo === 'deduccion' ? totalBruto : sueldoBasico;
            }

            let monto = 0;
            let cantidad = 0;

            if (concept.esPorcentaje) {
                monto = base * (concept.valor / 100);
                cantidad = concept.valor; // Store percentage for UI
            } else {
                monto = parseFloat(concept.valor);
                cantidad = 1; // Fixed units
            }

            if (monto > 0) {
                detalles.push({
                    conceptoNombre: concept.nombre,
                    tipo: concept.tipo,
                    monto: monto,
                    cantidad: cantidad
                });

                if (concept.tipo === 'remunerativo') {
                    totalBruto += monto;
                } else if (concept.tipo === 'deduccion') {
                    totalDeducciones += monto;
                }
            }
        }

    }
    // --- NON-LABOR LOGIC (HONORARIOS / BECAS) ---
    else {
        const montoAcordado = parseFloat(contrato.salario || 0);

        detalles.push({
            conceptoNombre: tipoLiquidacion === 'BECA' ? 'Asignación Estímulo' : 'Honorarios Profesionales',
            tipo: 'remunerativo',
            monto: montoAcordado,
            cantidad: 1
        });

        totalBruto = montoAcordado;
    }

    const totalNeto = totalBruto - totalDeducciones;

    return {
        empleado: {
            id: empleado.id,
            nombre: empleado.nombre,
            apellido: empleado.apellido,
            cuil: empleado.cuil
        },
        periodo,
        tipo: tipoLiquidacion,
        detalles,
        totales: {
            bruto: totalBruto.toFixed(2),
            deducciones: totalDeducciones.toFixed(2),
            neto: totalNeto.toFixed(2)
        }
    };
};

const liquidacionController = {
    // Calcular liquidación (Preview) - Single
    calcular: async (req, res) => {
        try {
            const { empleadoId, periodo } = req.body;

            const empleado = await Empleado.findByPk(empleadoId, {
                include: [{
                    model: Contrato,
                    as: 'contratos',
                    where: { activo: true },
                    include: [{ model: Puesto, as: 'puestos' }]
                }]
            });

            if (!empleado) {
                return res.status(404).json({ message: 'Empleado no encontrado o sin contrato activo' });
            }

            const conceptos = await ConceptoSalarial.findAll({ where: { activo: true } });
            const result = await calculateLiquidationForEmployee(empleado, periodo, conceptos);

            res.json(result);

        } catch (error) {
            console.error(error);
            res.status(500).json({ message: 'Error al calcular liquidación', error: error.message });
        }
    },

    // Calcular Masivo
    calcularMasivo: async (req, res) => {
        try {
            const { periodo } = req.body;

            // 1. Get all active employees with active contracts
            // Filter out LOCACION contracts
            const empleados = await Empleado.findAll({
                where: { activo: true },
                include: [{
                    model: Contrato,
                    as: 'contratos',
                    where: {
                        activo: true,
                        tipoContrato: { [Op.ne]: 'LOCACION' } // Exclude Monotributistas
                    },
                    include: [{ model: Puesto, as: 'puestos' }]
                }]
            });

            // 2. Get existing liquidations for this period to exclude them
            const liquidacionesExistentes = await Liquidacion.findAll({
                where: { periodo },
                attributes: ['empleadoId']
            });
            const empleadosLiquidadosIds = new Set(liquidacionesExistentes.map(l => l.empleadoId));

            // 3. Filter employees who haven't been paid yet
            const empleadosAPagar = empleados.filter(e => !empleadosLiquidadosIds.has(e.id));

            if (empleadosAPagar.length === 0) {
                return res.json({ message: 'No hay empleados pendientes de liquidación para este período', data: [] });
            }

            // 4. Calculate for each
            const conceptos = await ConceptoSalarial.findAll({ where: { activo: true } });
            const resultados = [];

            for (const emp of empleadosAPagar) {
                const liq = await calculateLiquidationForEmployee(emp, periodo, conceptos);
                if (liq) resultados.push(liq);
            }

            res.json(resultados);

        } catch (error) {
            console.error(error);
            res.status(500).json({ message: 'Error al calcular liquidaciones masivas', error: error.message });
        }
    },

    // Crear Masivo
    crearMasivo: async (req, res) => {
        const t = await Liquidacion.sequelize.transaction();
        try {
            const { liquidaciones } = req.body; // Array of liquidation objects (from preview)

            if (!liquidaciones || liquidaciones.length === 0) {
                return res.status(400).json({ message: 'No hay liquidaciones para guardar' });
            }

            const createdCount = 0;

            for (const liqData of liquidaciones) {
                // Double check existence to be safe
                const existente = await Liquidacion.findOne({
                    where: { empleadoId: liqData.empleado.id, periodo: liqData.periodo },
                    transaction: t
                });

                if (existente) continue;

                const liquidacion = await Liquidacion.create({
                    empleadoId: liqData.empleado.id,
                    periodo: liqData.periodo,
                    totalBruto: liqData.totales.bruto,
                    totalNeto: liqData.totales.neto,
                    estado: 'GENERADO',
                    tipo: liqData.tipo || 'SUELDO',
                    origen: 'MASIVO'
                }, { transaction: t });

                for (const detalle of liqData.detalles) {
                    await DetalleLiquidacion.create({
                        liquidacionId: liquidacion.id,
                        conceptoNombre: detalle.conceptoNombre,
                        tipo: detalle.tipo,
                        monto: detalle.monto,
                        cantidad: detalle.cantidad
                    }, { transaction: t });
                }
            }

            await t.commit();
            res.status(201).json({ message: 'Liquidaciones creadas exitosamente' });

        } catch (error) {
            await t.rollback();
            console.error(error);
            res.status(500).json({ message: 'Error al crear liquidaciones masivas', error: error.message });
        }
    },

    // Guardar liquidación (Single)
    crear: async (req, res) => {
        const t = await Liquidacion.sequelize.transaction();
        try {
            const { empleadoId, periodo, detalles, totales, tipo } = req.body;

            // Verificar si ya existe liquidación para ese periodo
            const existente = await Liquidacion.findOne({
                where: { empleadoId, periodo }
            });

            if (existente) {
                await t.rollback();
                return res.status(400).json({ message: 'Ya existe una liquidación para este empleado en este periodo' });
            }

            const liquidacion = await Liquidacion.create({
                empleadoId,
                periodo,
                totalBruto: totales.bruto,
                totalNeto: totales.neto,
                estado: 'GENERADO',
                tipo: tipo || 'SUELDO',
                origen: 'MANUAL'
            }, { transaction: t });

            for (const detalle of detalles) {
                await DetalleLiquidacion.create({
                    liquidacionId: liquidacion.id,
                    conceptoNombre: detalle.conceptoNombre,
                    tipo: detalle.tipo,
                    monto: detalle.monto,
                    cantidad: detalle.cantidad
                }, { transaction: t });
            }

            await t.commit();
            res.status(201).json(liquidacion);
        } catch (error) {
            await t.rollback();
            console.error(error);
            res.status(500).json({ message: 'Error al crear liquidación', error: error.message });
        }
    },

    // Listar liquidaciones
    listar: async (req, res) => {
        try {
            const { periodo, estado } = req.query;
            const where = {};
            if (periodo) where.periodo = periodo;
            if (estado) where.estado = estado;

            const liquidaciones = await Liquidacion.findAll({
                where,
                include: [{
                    model: Empleado,
                    as: 'empleado',
                    attributes: ['id', 'nombre', 'apellido', 'cuil']
                }],
                order: [['periodo', 'DESC'], ['createdAt', 'DESC']]
            });

            res.json(liquidaciones);
        } catch (error) {
            res.status(500).json({ message: 'Error al listar liquidaciones', error: error.message });
        }
    },

    // Obtener una liquidación
    obtener: async (req, res) => {
        try {
            const { id } = req.params;
            const liquidacion = await Liquidacion.findByPk(id, {
                include: [
                    {
                        model: Empleado,
                        as: 'empleado',
                        attributes: ['id', 'nombre', 'apellido', 'cuil', 'fechaNacimiento']
                    },
                    {
                        model: DetalleLiquidacion,
                        as: 'detalles'
                    }
                ]
            });

            if (!liquidacion) {
                return res.status(404).json({ message: 'Liquidación no encontrada' });
            }

            res.json(liquidacion);
        } catch (error) {
            res.status(500).json({ message: 'Error al obtener liquidación', error: error.message });
        }
    },

    // Actualizar estado
    actualizarEstado: async (req, res) => {
        try {
            const { id } = req.params;
            const { estado, fechaPago } = req.body;

            const liquidacion = await Liquidacion.findByPk(id);
            if (!liquidacion) {
                return res.status(404).json({ message: 'Liquidación no encontrada' });
            }

            liquidacion.estado = estado;
            if (estado === 'PAGADO' && fechaPago) {
                liquidacion.fechaPago = fechaPago;
            }

            await liquidacion.save();
            res.json({ message: 'Estado actualizado', liquidacion });
        } catch (error) {
            res.status(500).json({ message: 'Error al actualizar estado', error: error.message });
        }
    }
};

module.exports = liquidacionController;
