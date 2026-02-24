const { Liquidacion, Contrato, Empleado, Usuario, EspacioTrabajo, Rol, Permiso, Puesto } = require('../models');
const { Op } = require('sequelize');
const { liquidarSueldos } = require('../services/prueba_liq');

// Helper: verifica si el usuario en sesión tiene un permiso específico en el módulo liquidaciones
const tienePermiso = async (session, accion) => {
    if (session.esAdministrador) return true;

    // Si no es empleado (es Propietario), tiene acceso total
    if (session.esEmpleado === false) return true;

    const usuarioId = session.usuarioId || session.empleadoId;
    const empleado = await Empleado.findOne({ where: { usuarioId } });

    // Si no se encontró el empleado en DB, asumimos que es propietario
    if (!empleado) return true;

    // Es empleado pero no tiene contrato seleccionado, denegar
    if (!empleado.ultimoContratoSeleccionadoId) return false;

    const contrato = await Contrato.findByPk(empleado.ultimoContratoSeleccionadoId, {
        include: [{ model: Rol, as: 'rol', include: [{ model: Permiso, as: 'permisos', through: { attributes: [] } }] }]
    });
    if (!contrato?.rol?.permisos) return false;
    return contrato.rol.permisos.some(p => p.modulo === 'liquidaciones' && p.accion === accion);
};

// Include estándar para carga del contrato con empleado y espacio
const includeContrato = [{
    model: Contrato,
    as: 'contrato',
    include: [
        {
            model: Empleado,
            as: 'empleado',
            include: [
                { model: Usuario, as: 'usuario', attributes: ['nombre', 'apellido'] },
                { model: EspacioTrabajo, as: 'espacioTrabajo', attributes: ['id', 'nombre'] }
            ]
        },
        { model: Puesto, as: 'puestos', through: { attributes: [] } }
    ],
    attributes: ['id', 'tipoContrato', 'fechaInicio', 'fechaFin', 'estado'],
}];

// Obtener todas las liquidaciones con filtros y paginación
const getAll = async (req, res) => {
    try {
        const {
            empleadoId,
            espacioTrabajoId,
            contratoId,
            fechaDesde,
            fechaHasta,
            estado,
            activo,
            page = 1,
            limit = 10,
        } = req.query;

        const where = {};

        if (activo !== undefined) {
            where.activo = activo === 'true' || activo === true || activo === '1';
        }
        if (estado) where.estado = estado;
        if (req.query.estaPagada !== undefined) {
            where.estaPagada = req.query.estaPagada === 'true' || req.query.estaPagada === true || req.query.estaPagada === '1';
        }
        if (fechaDesde || fechaHasta) {
            where.fechaInicio = {};
            if (fechaDesde) where.fechaInicio[Op.gte] = fechaDesde;
            if (fechaHasta) where.fechaInicio[Op.lte] = fechaHasta;
        }

        // --- Filtrado por Espacio de Trabajo y Permisos ---
        // Las liquidaciones pertenecen a contratos: resolver empleado → contratos → where.contratoId
        const usuarioSesionId = req.session.usuarioId || req.session.empleadoId;
        const esAdmin = req.session.esAdministrador;

        if (!esAdmin) {
            const empleadoSesion = await Empleado.findOne({ where: { usuarioId: usuarioSesionId } });

            if (empleadoSesion) {
                // ES EMPLEADO — verificar si tiene permisos de gestión (puede ver todos del workspace)
                const tienePermisoVerTodos = await tienePermiso(req.session, 'crear') ||
                    await tienePermiso(req.session, 'actualizar') ||
                    await tienePermiso(req.session, 'eliminar');

                if (tienePermisoVerTodos) {
                    // Puede ver las liquidaciones de todos los empleados de su workspace
                    const empleadosWorkspace = await Empleado.findAll({
                        where: { espacioTrabajoId: empleadoSesion.espacioTrabajoId },
                        attributes: ['id']
                    });
                    const idsEmpleadosWs = empleadosWorkspace.map(e => e.id);

                    let whereContrato = { empleadoId: { [Op.in]: idsEmpleadosWs } };
                    if (empleadoId) {
                        if (!idsEmpleadosWs.includes(parseInt(empleadoId))) {
                            return res.json({ liquidaciones: [], total: 0, page: 1, totalPages: 0 });
                        }
                        whereContrato = { empleadoId };
                    }
                    if (espacioTrabajoId && parseInt(espacioTrabajoId) !== empleadoSesion.espacioTrabajoId) {
                        return res.json({ liquidaciones: [], total: 0, page: 1, totalPages: 0 });
                    }
                    const contratosPermitidos = await Contrato.findAll({ where: whereContrato, attributes: ['id'] });
                    where.contratoId = { [Op.in]: contratosPermitidos.map(c => c.id) };

                } else {
                    // Solo ve sus propias liquidaciones
                    if (empleadoId && parseInt(empleadoId) !== empleadoSesion.id) {
                        return res.json({ liquidaciones: [], total: 0, page: 1, totalPages: 0 });
                    }
                    const contratosPropio = await Contrato.findAll({
                        where: { empleadoId: empleadoSesion.id },
                        attributes: ['id']
                    });
                    where.contratoId = { [Op.in]: contratosPropio.map(c => c.id) };
                }

            } else {
                // ES PROPIETARIO (no empleado) → ve liquidaciones de empleados de sus espacios
                const espaciosPropios = await EspacioTrabajo.findAll({
                    where: { propietarioId: usuarioSesionId },
                    attributes: ['id']
                });
                const espaciosIds = espaciosPropios.map(e => e.id);

                let targetEspacios = espaciosIds;
                if (espacioTrabajoId) {
                    if (!espaciosIds.includes(parseInt(espacioTrabajoId))) {
                        return res.json({ liquidaciones: [], total: 0, page: 1, totalPages: 0 });
                    }
                    targetEspacios = [parseInt(espacioTrabajoId)];
                }

                const empleadosDeWorkspaces = await Empleado.findAll({
                    where: { espacioTrabajoId: { [Op.in]: targetEspacios } },
                    attributes: ['id']
                });
                const idsPermitidos = empleadosDeWorkspaces.map(e => e.id);

                let whereContrato = { empleadoId: { [Op.in]: idsPermitidos } };
                if (empleadoId) {
                    if (!idsPermitidos.includes(parseInt(empleadoId))) {
                        return res.json({ liquidaciones: [], total: 0, page: 1, totalPages: 0 });
                    }
                    whereContrato = { empleadoId };
                }
                const contratosPermitidos = await Contrato.findAll({ where: whereContrato, attributes: ['id'] });
                const idsContratos = contratosPermitidos.map(c => c.id);
                where.contratoId = idsContratos.length > 0 ? { [Op.in]: idsContratos } : -1;
            }

        } else {
            // ADMIN GLOBAL — filtros opcionales
            if (contratoId) {
                where.contratoId = contratoId;
            } else if (empleadoId || espacioTrabajoId) {
                let whereContratoAdmin = {};
                if (empleadoId) whereContratoAdmin.empleadoId = empleadoId;
                if (espacioTrabajoId) {
                    const empleadosWs = await Empleado.findAll({ where: { espacioTrabajoId }, attributes: ['id'] });
                    const idsWs = empleadosWs.map(e => e.id);
                    if (empleadoId && !idsWs.includes(parseInt(empleadoId))) {
                        return res.json({ liquidaciones: [], total: 0, page: 1, totalPages: 0 });
                    }
                    if (!empleadoId) whereContratoAdmin.empleadoId = { [Op.in]: idsWs };
                }
                const contratosAdmin = await Contrato.findAll({ where: whereContratoAdmin, attributes: ['id'] });
                where.contratoId = { [Op.in]: contratosAdmin.map(c => c.id) };
            }
        }

        const offset = (page - 1) * limit;

        const { count, rows } = await Liquidacion.findAndCountAll({
            where,
            include: includeContrato,
            order: [['estaPagada', 'ASC'], ['fechaInicio', 'DESC']],
            limit: parseInt(limit),
            offset: parseInt(offset),
        });

        res.json({
            liquidaciones: rows,
            total: count,
            page: parseInt(page),
            totalPages: Math.ceil(count / limit),
        });
    } catch (error) {
        console.error('Error al obtener liquidaciones:', error);
        res.status(500).json({ error: error.message });
    }
};

// Obtener liquidación por ID
const getById = async (req, res) => {
    try {
        const { id } = req.params;
        const liquidacion = await Liquidacion.findByPk(id, { include: includeContrato });
        if (!liquidacion) {
            return res.status(404).json({ error: 'Liquidación no encontrada' });
        }
        res.json(liquidacion);
    } catch (error) {
        console.error('Error al obtener liquidación:', error);
        res.status(500).json({ error: error.message });
    }
};

// Actualizar liquidación
const update = async (req, res) => {
    try {
        // Verificar permiso de edición
        if (!(await tienePermiso(req.session, 'actualizar'))) {
            return res.status(403).json({ error: 'No tiene permiso para editar liquidaciones' });
        }

        const { id } = req.params;
        const {
            basico, antiguedad, presentismo, horasExtras, vacaciones, sac,
            inasistencias, totalBruto, totalRetenciones, vacacionesNoGozadas,
            neto, detalleConceptos, detalleRemunerativo, detalleRetenciones, estado,
        } = req.body;

        const liquidacion = await Liquidacion.findByPk(id);
        if (!liquidacion) {
            return res.status(404).json({ error: 'Liquidación no encontrada' });
        }

        if (basico !== undefined) liquidacion.basico = basico;
        if (antiguedad !== undefined) liquidacion.antiguedad = antiguedad;
        if (presentismo !== undefined) liquidacion.presentismo = presentismo;
        if (horasExtras !== undefined) liquidacion.horasExtras = horasExtras;
        if (vacaciones !== undefined) liquidacion.vacaciones = vacaciones;
        if (sac !== undefined) liquidacion.sac = sac;
        if (inasistencias !== undefined) liquidacion.inasistencias = inasistencias;
        if (totalBruto !== undefined) liquidacion.totalBruto = totalBruto;
        if (totalRetenciones !== undefined) liquidacion.totalRetenciones = totalRetenciones;
        if (vacacionesNoGozadas !== undefined) liquidacion.vacacionesNoGozadas = vacacionesNoGozadas;
        if (neto !== undefined) liquidacion.neto = neto;
        if (detalleConceptos !== undefined) liquidacion.detalleConceptos = detalleConceptos;
        if (detalleRemunerativo !== undefined) liquidacion.detalleRemunerativo = detalleRemunerativo;
        if (detalleRetenciones !== undefined) liquidacion.detalleRetenciones = detalleRetenciones;
        if (estado !== undefined) liquidacion.estado = estado;
        if (req.body.estaPagada !== undefined) liquidacion.estaPagada = req.body.estaPagada;

        await liquidacion.save();

        const liquidacionActualizada = await Liquidacion.findByPk(id, { include: includeContrato });
        res.json({ message: 'Liquidación actualizada exitosamente', liquidacion: liquidacionActualizada });
    } catch (error) {
        console.error('Error al actualizar liquidación:', error);
        res.status(400).json({ error: error.message });
    }
};

// Eliminar liquidación (eliminación lógica)
const remove = async (req, res) => {
    try {
        // Verificar permiso de eliminación
        if (!(await tienePermiso(req.session, 'eliminar'))) {
            return res.status(403).json({ error: 'No tiene permiso para desactivar liquidaciones' });
        }

        const { id } = req.params;
        const liquidacion = await Liquidacion.findByPk(id);
        if (!liquidacion) {
            return res.status(404).json({ error: 'Liquidación no encontrada' });
        }

        liquidacion.activo = false;
        await liquidacion.save();

        res.json({ message: 'Liquidación eliminada exitosamente' });
    } catch (error) {
        console.error('Error al eliminar liquidación:', error);
        res.status(500).json({ error: error.message });
    }
};

// Reactivar liquidación
const reactivate = async (req, res) => {
    try {
        const { id } = req.params;
        const liquidacion = await Liquidacion.findByPk(id);
        if (!liquidacion) {
            return res.status(404).json({ error: 'Liquidación no encontrada' });
        }

        liquidacion.activo = true;
        await liquidacion.save();

        const liquidacionActualizada = await Liquidacion.findByPk(id, { include: includeContrato });
        res.json({ message: 'Liquidación reactivada exitosamente', liquidacion: liquidacionActualizada });
    } catch (error) {
        console.error('Error al reactivar liquidación:', error);
        res.status(500).json({ error: error.message });
    }
};

// Eliminar múltiples liquidaciones (eliminación lógica en lote)
const bulkRemove = async (req, res) => {
    try {
        // Verificar permiso de eliminación
        if (!(await tienePermiso(req.session, 'eliminar'))) {
            return res.status(403).json({ error: 'No tiene permiso para desactivar liquidaciones en lote' });
        }

        const { ids } = req.body;
        if (!ids || !Array.isArray(ids) || ids.length === 0) {
            return res.status(400).json({ error: 'Se requiere un array de IDs' });
        }

        await Liquidacion.update({ activo: false }, { where: { id: { [Op.in]: ids } } });
        res.json({ message: `${ids.length} liquidaciones eliminadas exitosamente` });
    } catch (error) {
        console.error('Error al eliminar liquidaciones:', error);
        res.status(500).json({ error: error.message });
    }
};

const ejecutarLiquidacion = async (req, res) => {
    try {
        if (!(await tienePermiso(req.session, 'crear')) && !(await tienePermiso(req.session, 'actualizar'))) {
            return res.status(403).json({ error: 'No tiene permiso para ejecutar liquidaciones' });
        }
        await liquidarSueldos();
        res.json({ message: 'Liquidaciones simuladas/ejecutadas exitosamente' });
    } catch (error) {
        console.error('Error al ejecutar liquidaciones:', error);
        res.status(500).json({ error: error.message });
    }
};

module.exports = {
    getAll,
    getById,
    update,
    remove,
    reactivate,
    bulkRemove,
    ejecutarLiquidacion,
};
