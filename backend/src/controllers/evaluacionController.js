const { Evaluacion, Contrato, Empleado, Puesto, Empresa, Departamento, Area, Usuario, EspacioTrabajo, Rol, Permiso } = require('../models');
const { Op } = require('sequelize');
const sequelize = require('../config/database');

// Helper: verifica si el usuario en sesión tiene un permiso específico en el módulo evaluaciones
const tienePermiso = async (session, accion) => {
    if (session.esAdministrador) return true;
    const usuarioId = session.usuarioId || session.empleadoId;
    const empleado = await Empleado.findOne({ where: { usuarioId } });

    // No es empleado (propietario/externo) → pasa siempre
    if (!empleado) return true;

    // Es empleado sin contrato seleccionado → pasa (sin restricción configurada)
    if (!empleado.ultimoContratoSeleccionadoId) return true;

    const contrato = await Contrato.findByPk(empleado.ultimoContratoSeleccionadoId, {
        include: [{ model: Rol, as: 'rol', include: [{ model: Permiso, as: 'permisos', through: { attributes: [] } }] }]
    });

    // Sin rol asignado al contrato → pasa
    if (!contrato?.rol) return true;

    const permisosDelModulo = (contrato.rol.permisos || []).filter(
        p => p.modulo === 'evaluaciones'
    );

    // El módulo no tiene permisos configurados en este rol → pasa
    if (permisosDelModulo.length === 0) return true;

    // Verificar si tiene la acción especifica
    return permisosDelModulo.some(p => p.accion === accion);
};

// Includes para obtener detalle completo del contrato (empleado + puesto + empresa)
const includeContratoDetalle = (alias) => ({
    model: Contrato,
    as: alias,
    include: [
        {
            model: Empleado,
            as: 'empleado',
            include: [
                {
                    model: Usuario,
                    as: 'usuario',
                    attributes: ['nombre', 'apellido']
                },
                {
                    model: EspacioTrabajo,
                    as: 'espacioTrabajo',
                    attributes: ['id', 'nombre']
                }
            ]
        },
        {
            model: Puesto,
            as: 'puestos',
            through: { attributes: [] },
            include: [{
                model: Departamento,
                as: 'departamento',
                include: [{
                    model: Area,
                    as: 'area',
                    include: [{
                        model: Empresa,
                        as: 'empresa'
                    }]
                }]
            }]
        }
    ]
});

// Obtener todas las evaluaciones con paginación y filtros
const getAll = async (req, res) => {
    try {
        const { page = 1, limit = 10, activo, periodo, tipoEvaluacion, estado, escala, puntajeMin, puntajeMax, espacioTrabajoId, evaluadoId } = req.query;
        const where = {};

        // Filtros directos
        if (activo === 'false') {
            where.activo = false;
        } else if (activo === 'all') {
            // No filtrar
        } else {
            where.activo = true;
        }
        if (periodo) where.periodo = periodo;
        if (tipoEvaluacion) where.tipoEvaluacion = tipoEvaluacion;
        if (estado) where.estado = estado;
        if (escala) where.escala = escala;
        if (puntajeMin || puntajeMax) {
            where.puntaje = {};
            if (puntajeMin) where.puntaje[Op.gte] = parseFloat(puntajeMin);
            if (puntajeMax) where.puntaje[Op.lte] = parseFloat(puntajeMax);
        }

        // --- Filtrado por Espacio de Trabajo y Permisos ---
        // Las evaluaciones se filtran resolviendo primero los empleados permitidos
        // y luego los contratos de esos empleados → contratoEvaluadoId
        const usuarioSesionId = req.session.usuarioId || req.session.empleadoId;
        const esAdmin = req.session.esAdministrador;

        if (!esAdmin) {
            const empleadoSesion = await Empleado.findOne({ where: { usuarioId: usuarioSesionId } });

            if (empleadoSesion) {
                // ES EMPLEADO — verificar permisos de escritura (equivale a "puede ver todos del workspace")
                const tienePermisoVerTodos = await tienePermiso(req.session, 'crear') ||
                    await tienePermiso(req.session, 'actualizar') ||
                    await tienePermiso(req.session, 'eliminar');

                if (tienePermisoVerTodos) {
                    // Puede ver todo el workspace
                    const empleadosWorkspace = await Empleado.findAll({
                        where: { espacioTrabajoId: empleadoSesion.espacioTrabajoId },
                        attributes: ['id']
                    });
                    const idsEmpleadosWs = empleadosWorkspace.map(e => e.id);

                    // Resolver contratos de esos empleados
                    let whereEmpleadoContrato = { empleadoId: { [Op.in]: idsEmpleadosWs } };
                    if (evaluadoId) {
                        if (!idsEmpleadosWs.includes(parseInt(evaluadoId))) {
                            return res.json({ data: [], pagination: { total: 0, page: 1, limit: 10, totalPages: 0 } });
                        }
                        whereEmpleadoContrato = { empleadoId: evaluadoId };
                    }
                    if (espacioTrabajoId && parseInt(espacioTrabajoId) !== empleadoSesion.espacioTrabajoId) {
                        return res.json({ data: [], pagination: { total: 0, page: 1, limit: 10, totalPages: 0 } });
                    }
                    const contratosPermitidos = await Contrato.findAll({ where: whereEmpleadoContrato, attributes: ['id'] });
                    const idsContratosWs = contratosPermitidos.map(c => c.id);
                    where.contratoEvaluadoId = { [Op.in]: idsContratosWs };

                } else {
                    // Solo ve sus propios registros (solo evaluaciones donde él es el evaluado)
                    if (evaluadoId && parseInt(evaluadoId) !== empleadoSesion.id) {
                        return res.json({ data: [], pagination: { total: 0, page: 1, limit: 10, totalPages: 0 } });
                    }
                    const contratosPropio = await Contrato.findAll({
                        where: { empleadoId: empleadoSesion.id },
                        attributes: ['id']
                    });
                    const idsPropios = contratosPropio.map(c => c.id);
                    where.contratoEvaluadoId = { [Op.in]: idsPropios };
                }

            } else {
                // ES PROPIETARIO (no empleado) → ve los empleados de sus espacios de trabajo
                const espaciosPropios = await EspacioTrabajo.findAll({
                    where: { propietarioId: usuarioSesionId },
                    attributes: ['id']
                });
                const espaciosIds = espaciosPropios.map(e => e.id);

                let targetEspacios = espaciosIds;
                if (espacioTrabajoId) {
                    if (!espaciosIds.includes(parseInt(espacioTrabajoId))) {
                        return res.json({ data: [], pagination: { total: 0, page: 1, limit: 10, totalPages: 0 } });
                    }
                    targetEspacios = [parseInt(espacioTrabajoId)];
                }

                const empleadosDeWorkspaces = await Empleado.findAll({
                    where: { espacioTrabajoId: { [Op.in]: targetEspacios } },
                    attributes: ['id']
                });
                const idsPermitidos = empleadosDeWorkspaces.map(e => e.id);

                let whereContratoPermitido = { empleadoId: { [Op.in]: idsPermitidos } };
                if (evaluadoId) {
                    if (!idsPermitidos.includes(parseInt(evaluadoId))) {
                        return res.json({ data: [], pagination: { total: 0, page: 1, limit: 10, totalPages: 0 } });
                    }
                    whereContratoPermitido = { empleadoId: evaluadoId };
                }
                const contratosPermitidos = await Contrato.findAll({ where: whereContratoPermitido, attributes: ['id'] });
                const idsContratos = contratosPermitidos.map(c => c.id);
                where.contratoEvaluadoId = idsContratos.length > 0 ? { [Op.in]: idsContratos } : -1;
            }

        } else {
            // ADMIN GLOBAL — filtros opcionales
            if (evaluadoId || espacioTrabajoId) {
                let whereContratoAdmin = {};
                if (evaluadoId) whereContratoAdmin.empleadoId = evaluadoId;
                if (espacioTrabajoId) {
                    const empleadosWs = await Empleado.findAll({ where: { espacioTrabajoId }, attributes: ['id'] });
                    const idsWs = empleadosWs.map(e => e.id);
                    if (evaluadoId && !idsWs.includes(parseInt(evaluadoId))) {
                        return res.json({ data: [], pagination: { total: 0, page: 1, limit: 10, totalPages: 0 } });
                    }
                    if (!evaluadoId) whereContratoAdmin.empleadoId = { [Op.in]: idsWs };
                }
                const contratosAdmin = await Contrato.findAll({ where: whereContratoAdmin, attributes: ['id'] });
                where.contratoEvaluadoId = { [Op.in]: contratosAdmin.map(c => c.id) };
            }
        }

        const offset = (parseInt(page) - 1) * parseInt(limit);

        const { count, rows } = await Evaluacion.findAndCountAll({
            where,
            include: [
                includeContratoDetalle('contratoEvaluado'),
                includeContratoDetalle('evaluadores')
            ],
            order: [['fecha', 'DESC']],
            limit: parseInt(limit),
            offset,
            distinct: true,
        });

        res.json({
            data: rows,
            pagination: {
                total: count,
                page: parseInt(page),
                limit: parseInt(limit),
                totalPages: Math.ceil(count / parseInt(limit)),
            },
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: error.message });
    }
};


// Obtener evaluación por ID
const getById = async (req, res) => {
    try {
        const evaluacion = await Evaluacion.findByPk(req.params.id, {
            include: [
                includeContratoDetalle('contratoEvaluado'),
                includeContratoDetalle('evaluadores')
            ]
        });

        if (!evaluacion) {
            return res.status(404).json({ error: 'Evaluación no encontrada' });
        }

        res.json(evaluacion);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Crear evaluación (soporte para batch creation)
const create = async (req, res) => {
    const transaction = await sequelize.transaction();
    try {
        // Verificar permiso de creación
        if (!(await tienePermiso(req.session, 'crear'))) {
            await transaction.rollback();
            return res.status(403).json({ error: 'No tiene permiso para crear evaluaciones' });
        }
        const {
            periodo,
            tipoEvaluacion,
            fecha,
            evaluadoresIds, // Array de IDs de contratos evaluadores
            contratosEvaluadosIds, // Array de IDs de contratos a evaluar
            estado,
            puntaje,
            escala,
            feedback,
            reconocidoPorEmpleado,
            fechaReconocimiento,
            notas
        } = req.body;

        // Validaciones básicas
        if (!contratosEvaluadosIds || !Array.isArray(contratosEvaluadosIds) || contratosEvaluadosIds.length === 0) {
            await transaction.rollback();
            return res.status(400).json({ error: 'Debe seleccionar al menos un contrato a evaluar' });
        }

        if (!evaluadoresIds || !Array.isArray(evaluadoresIds) || evaluadoresIds.length === 0) {
            await transaction.rollback();
            return res.status(400).json({ error: 'Debe seleccionar al menos un evaluador' });
        }

        // Validar intersección: un contrato no puede ser evaluador y evaluado a la vez
        const intersection = contratosEvaluadosIds.filter(id => evaluadoresIds.includes(id));
        if (intersection.length > 0) {
            await transaction.rollback();
            return res.status(400).json({ error: 'Un contrato no puede ser evaluador y evaluado simultáneamente' });
        }

        // Validar existencia de evaluadores
        const evaluadores = await Contrato.findAll({ where: { id: evaluadoresIds } });
        if (evaluadores.length !== evaluadoresIds.length) {
            await transaction.rollback();
            return res.status(400).json({ error: 'Uno o más evaluadores no existen' });
        }

        // Crear evaluaciones en lote
        const evaluacionesCreadas = [];

        for (const contratoEvaluadoId of contratosEvaluadosIds) {
            // Validar existencia del contrato evaluado
            const contratoEvaluado = await Contrato.findByPk(contratoEvaluadoId);
            if (!contratoEvaluado) {
                throw new Error(`Contrato a evaluar ID ${contratoEvaluadoId} no encontrado`);
            }

            const nuevaEvaluacion = await Evaluacion.create({
                periodo,
                tipoEvaluacion,
                fecha,
                contratoEvaluadoId,
                estado: estado || 'pendiente',
                puntaje,
                escala,
                feedback,
                reconocidoPorEmpleado: reconocidoPorEmpleado || false,
                fechaReconocimiento: reconocidoPorEmpleado ? (fechaReconocimiento || new Date().toISOString().split('T')[0]) : null,
                notas: notas || null,
            }, { transaction });

            // Asociar evaluadores
            await nuevaEvaluacion.setEvaluadores(evaluadoresIds, { transaction });
            evaluacionesCreadas.push(nuevaEvaluacion);
        }

        await transaction.commit();

        res.status(201).json({
            message: `${evaluacionesCreadas.length} evaluación(es) creada(s) correctamente`,
            count: evaluacionesCreadas.length
        });

    } catch (error) {
        await transaction.rollback();
        if (error.name === 'SequelizeValidationError') {
            const messages = error.errors.map(e => e.message);
            return res.status(400).json({ error: messages.join(', ') });
        }
        res.status(500).json({ error: error.message });
    }
};

// Actualizar evaluación
const update = async (req, res) => {
    const transaction = await sequelize.transaction();
    try {
        // Verificar permiso de edición
        if (!(await tienePermiso(req.session, 'actualizar'))) {
            await transaction.rollback();
            return res.status(403).json({ error: 'No tiene permiso para editar evaluaciones' });
        }
        const { id } = req.params;
        const {
            periodo,
            tipoEvaluacion,
            fecha,
            evaluadoresIds, // Array de IDs
            contratoEvaluadoId, // Single ID (update es individual)
            estado,
            puntaje,
            escala,
            feedback,
            reconocidoPorEmpleado,
            fechaReconocimiento,
            notas
        } = req.body;

        const evaluacion = await Evaluacion.findByPk(id);
        if (!evaluacion) {
            await transaction.rollback();
            return res.status(404).json({ error: 'Evaluación no encontrada' });
        }

        // Validar contrato evaluado si cambia
        if (contratoEvaluadoId && contratoEvaluadoId !== evaluacion.contratoEvaluadoId) {
            const contrato = await Contrato.findByPk(contratoEvaluadoId);
            if (!contrato) {
                await transaction.rollback();
                return res.status(404).json({ error: 'Contrato a evaluar no encontrado' });
            }
        }

        // Si cambian evaluadores, validar intersección con el evaluado actual (o nuevo)
        const targetEvaluadoId = contratoEvaluadoId || evaluacion.contratoEvaluadoId;
        if (evaluadoresIds && evaluadoresIds.includes(targetEvaluadoId)) {
            await transaction.rollback();
            return res.status(400).json({ error: 'El contrato evaluado no puede ser su propio evaluador' });
        }

        // Lógica de fecha reconocimiento
        const updatedReconocido = reconocidoPorEmpleado !== undefined ? reconocidoPorEmpleado : evaluacion.reconocidoPorEmpleado;
        let newFechaReconocimiento = evaluacion.fechaReconocimiento;

        if (updatedReconocido && !evaluacion.fechaReconocimiento) {
            // Si se marca y no tenía fecha, poner hoy o la que venga
            newFechaReconocimiento = fechaReconocimiento || new Date().toISOString().split('T')[0];
        } else if (!updatedReconocido) {
            // Si se desmarca, limpiar fecha
            newFechaReconocimiento = null;
        } else if (fechaReconocimiento !== undefined) {
            // Si se pasa fecha explícita (e.g. edición), usarla
            newFechaReconocimiento = fechaReconocimiento;
        }

        await evaluacion.update({
            periodo,
            tipoEvaluacion,
            fecha,
            contratoEvaluadoId: contratoEvaluadoId || evaluacion.contratoEvaluadoId,
            estado,
            puntaje,
            escala,
            feedback,
            reconocidoPorEmpleado: updatedReconocido,
            fechaReconocimiento: newFechaReconocimiento,
            notas: notas !== undefined ? notas : evaluacion.notas,
        }, { transaction });

        // Actualizar evaluadores si se proporcionan
        if (evaluadoresIds) {
            await evaluacion.setEvaluadores(evaluadoresIds, { transaction });
        }

        await transaction.commit();

        const evaluacionActualizada = await Evaluacion.findByPk(id, {
            include: [
                includeContratoDetalle('contratoEvaluado'),
                includeContratoDetalle('evaluadores')
            ]
        });

        res.json(evaluacionActualizada);
    } catch (error) {
        await transaction.rollback();
        if (error.name === 'SequelizeValidationError') {
            const messages = error.errors.map(e => e.message);
            return res.status(400).json({ error: messages.join(', ') });
        }
        res.status(500).json({ error: error.message });
    }
};

// Eliminar evaluación (eliminación lógica)
const remove = async (req, res) => {
    try {
        // Verificar permiso de eliminación
        if (!(await tienePermiso(req.session, 'eliminar'))) {
            return res.status(403).json({ error: 'No tiene permiso para desactivar evaluaciones' });
        }
        const evaluacion = await Evaluacion.findByPk(req.params.id);

        if (!evaluacion) {
            return res.status(404).json({ error: 'Evaluación no encontrada' });
        }

        await evaluacion.update({ activo: false });
        res.json({ message: 'Evaluación desactivada correctamente' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Eliminar evaluaciones en lote (eliminación lógica)
const bulkRemove = async (req, res) => {
    try {
        // Verificar permiso de eliminación
        if (!(await tienePermiso(req.session, 'eliminar'))) {
            return res.status(403).json({ error: 'No tiene permiso para desactivar evaluaciones en lote' });
        }
        const { ids } = req.body;

        if (!ids || !Array.isArray(ids) || ids.length === 0) {
            return res.status(400).json({ error: 'Se requiere un array de IDs' });
        }

        await Evaluacion.update(
            { activo: false },
            { where: { id: { [Op.in]: ids } } }
        );

        res.json({ message: `${ids.length} evaluación(es) desactivada(s) correctamente` });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Reactivar evaluación
const reactivate = async (req, res) => {
    try {
        const evaluacion = await Evaluacion.findByPk(req.params.id);

        if (!evaluacion) {
            return res.status(404).json({ error: 'Evaluación no encontrada' });
        }

        await evaluacion.update({ activo: true });

        const evaluacionReactivada = await Evaluacion.findByPk(req.params.id, {
            include: [
                includeContratoDetalle('contratoEvaluado'),
                includeContratoDetalle('evaluadores')
            ]
        });

        res.json(evaluacionReactivada);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

module.exports = {
    getAll,
    getById,
    create,
    update,
    remove,
    bulkRemove,
    reactivate,
};
