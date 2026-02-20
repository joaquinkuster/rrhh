const { EspacioTrabajo, Usuario, ConceptoSalarial, ParametroLaboral, Rol, Permiso, Empleado, Empresa, Contrato, RegistroSalud, Contacto, ContratoPuesto, Puesto, Departamento, Area, sequelize } = require('../models');
const { Op } = require('sequelize');

// Obtener todos los espacios de trabajo con filtros y paginación
const getAll = async (req, res) => {
    try {
        const { nombre, propietario, propietarioId, activo, descripcion, fechaCreacion, page = 1, limit = 10 } = req.query;
        const where = {};

        // Por defecto solo mostrar activos
        if (activo === 'false') {
            where.activo = false;
        } else if (activo === 'all') {
            // No filtrar
        } else {
            where.activo = true;
        }

        if (nombre) {
            where.nombre = { [Op.like]: `%${nombre}%` };
        }

        if (descripcion) where.descripcion = { [Op.like]: `%${descripcion}%` };

        if (fechaCreacion) {
            // Parseo manual de 'YYYY-MM-DD' para evitar desfase de zona horaria
            // new Date('YYYY-MM-DD') lo interpreta en UTC, causando errores en servidores con TZ local
            const parts = fechaCreacion.split('-');
            if (parts.length === 3) {
                const year = parseInt(parts[0]);
                const month = parseInt(parts[1]) - 1; // month es 0-indexed
                const day = parseInt(parts[2]);
                const startDate = new Date(year, month, day, 0, 0, 0, 0);
                const endDate = new Date(year, month, day, 23, 59, 59, 999);
                where.createdAt = {
                    [Op.between]: [startDate, endDate]
                };
            }
        }

        // --- Lógica de permisos ---
        const usuarioId = req.session.usuarioId || req.session.empleadoId;
        const esAdmin = req.session.esAdministrador;

        // Si no es admin, solo mostrar sus propios espacios
        // Si no es admin, solo mostrar sus propios espacios o el espacio donde es empleado
        if (!esAdmin) {
            const emp = await Empleado.findOne({ where: { usuarioId } });

            if (emp && emp.espacioTrabajoId) {
                // Si es empleado, puede ver sus espacios propios Y su espacio asignado
                where[Op.or] = [
                    { propietarioId: usuarioId },
                    { id: emp.espacioTrabajoId }
                ];
            } else {
                // Si no es empleado, solo sus porpios espacios
                where.propietarioId = usuarioId;
            }
        } else if (propietario || propietarioId) {
            // Si es admin y quiere filtrar por propietario específico
            where.propietarioId = propietario || propietarioId;
        }

        const offset = (parseInt(page) - 1) * parseInt(limit);

        const { count, rows } = await EspacioTrabajo.findAndCountAll({
            where,
            include: [
                {
                    model: Usuario,
                    as: 'propietario',
                    attributes: ['id', 'nombre', 'apellido', 'email'],
                },
            ],
            order: [['createdAt', 'DESC']],
            limit: parseInt(limit),
            offset,
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
        res.status(500).json({ error: error.message });
    }
};

// Obtener espacio de trabajo por ID
const getById = async (req, res) => {
    try {
        const espacio = await EspacioTrabajo.findByPk(req.params.id, {
            include: [
                {
                    model: Usuario,
                    as: 'propietario',
                    attributes: ['id', 'nombre', 'apellido', 'email'],
                },
            ],
        });

        if (!espacio) {
            return res.status(404).json({ error: 'Espacio de trabajo no encontrado' });
        }

        res.json(espacio);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Crear espacio de trabajo
const create = async (req, res) => {
    const t = await sequelize.transaction();
    try {
        // Asignar automáticamente el propietario como el usuario en sesión
        // req.session ahora debe tener usuarioId (ajustar middleware auth)
        const usuarioId = req.session.usuarioId || req.session.empleadoId; // Fallback temporal

        const espacioData = {
            ...req.body,
            propietarioId: usuarioId,
        };

        const espacio = await EspacioTrabajo.create(espacioData, { transaction: t });

        // --- Generar Datos Obligatorios ---

        // 1. Conceptos Salariales
        const conceptosDefault = [
            { nombre: 'Jubilación', tipo: 'deduccion', esPorcentaje: true, valor: 11, esObligatorio: true, espacioTrabajoId: espacio.id },
            { nombre: 'Obra Social', tipo: 'deduccion', esPorcentaje: true, valor: 3, esObligatorio: true, espacioTrabajoId: espacio.id },
            { nombre: 'PAMI', tipo: 'deduccion', esPorcentaje: true, valor: 3, esObligatorio: true, espacioTrabajoId: espacio.id },
            { nombre: 'Cuota Sindical', tipo: 'deduccion', esPorcentaje: true, valor: 2.5, esObligatorio: true, espacioTrabajoId: espacio.id },
        ];
        await ConceptoSalarial.bulkCreate(conceptosDefault, { transaction: t });

        // 2. Parámetros Laborales
        await ParametroLaboral.create({
            tipo: 'limite_ausencia_injustificada',
            valor: '1',
            descripcion: 'Límite de ausencias injustificadas permitidas por mes',
            esObligatorio: true,
            espacioTrabajoId: espacio.id
        }, { transaction: t });

        // 3. Roles por Defecto
        const allPermisos = await Permiso.findAll({ transaction: t });

        // Helper para filtrar permisos
        const getPermisosIds = (criterios) => {
            return allPermisos.filter(p => {
                // Si criterio es string (modulo), todas las acciones
                // Si es objeto { modulo, acciones: [] }
                return criterios.some(c => {
                    if (typeof c === 'string') return p.modulo === c;
                    return p.modulo === c.modulo && c.acciones.includes(p.accion);
                });
            }).map(p => p.id);
        };

        // 3.1 Director Ejecutivo (CEO) - Todos los permisos
        const rolCEO = await Rol.create({
            nombre: 'Director Ejecutivo',
            descripcion: 'Acceso total al sistema (CEO)',
            esObligatorio: true,
            espacioTrabajoId: espacio.id,
            activo: true
        }, { transaction: t });

        if (allPermisos.length > 0) {
            await rolCEO.setPermisos(allPermisos.map(p => p.id), { transaction: t });
        }

        // 3.2 Administrador de RRHH
        const rolRRHH = await Rol.create({
            nombre: 'Administrador de RRHH',
            descripcion: 'Gestión de RRHH, Dashboard y Reportes',
            esObligatorio: true,
            espacioTrabajoId: espacio.id,
            activo: true
        }, { transaction: t });

        const permisosRRHH = getPermisosIds([
            'empleados',
            'contratos',
            'registros_salud',
            'evaluaciones',
            'contactos',
            'solicitudes',
            // Agrego lectura de empresas para operatividad básica en selects
            { modulo: 'empresas', acciones: ['leer'] },
            { modulo: 'dashboard', acciones: ['leer'] },
            { modulo: 'reportes', acciones: ['leer'] },
            { modulo: 'liquidaciones', acciones: ['leer', 'actualizar'] }
        ]);

        if (permisosRRHH.length > 0) {
            await rolRRHH.setPermisos(permisosRRHH, { transaction: t });
        }

        // 3.3 Personal Operativo
        const rolOperativo = await Rol.create({
            nombre: 'Personal Operativo',
            descripcion: 'Acceso de lectura limitado',
            esObligatorio: true,
            espacioTrabajoId: espacio.id,
            activo: true
        }, { transaction: t });

        const permisosOperativo = getPermisosIds([
            { modulo: 'registros_salud', acciones: ['leer'] },
            { modulo: 'evaluaciones', acciones: ['leer'] },
            { modulo: 'contactos', acciones: ['leer'] },
            { modulo: 'solicitudes', acciones: ['leer'] },
            { modulo: 'liquidaciones', acciones: ['leer'] }
        ]);

        if (permisosOperativo.length > 0) {
            await rolOperativo.setPermisos(permisosOperativo, { transaction: t });
        }

        await t.commit();

        // Cargar el espacio con el propietario para devolver
        const espacioCompleto = await EspacioTrabajo.findByPk(espacio.id, {
            include: [
                {
                    model: Usuario,
                    as: 'propietario',
                    attributes: ['id', 'nombre', 'apellido', 'email'],
                },
            ],
        });

        res.status(201).json(espacioCompleto);
    } catch (error) {
        await t.rollback();
        if (error.name === 'SequelizeValidationError') {
            const messages = error.errors.map(e => e.message);
            return res.status(400).json({ error: messages.join(', ') });
        }
        res.status(500).json({ error: error.message });
    }
};

// Actualizar espacio de trabajo
const update = async (req, res) => {
    try {
        const espacio = await EspacioTrabajo.findByPk(req.params.id);

        if (!espacio) {
            return res.status(404).json({ error: 'Espacio de trabajo no encontrado' });
        }

        // No permitir cambiar el propietario por ahora
        const { propietarioId, ...updateData } = req.body;

        await espacio.update(updateData);

        // Recargar con el propietario
        const espacioActualizado = await EspacioTrabajo.findByPk(espacio.id, {
            include: [
                {
                    model: Usuario,
                    as: 'propietario',
                    attributes: ['id', 'nombre', 'apellido', 'email'],
                },
            ],
        });

        res.json(espacioActualizado);
    } catch (error) {
        if (error.name === 'SequelizeValidationError') {
            const messages = error.errors.map(e => e.message);
            return res.status(400).json({ error: messages.join(', ') });
        }
        res.status(500).json({ error: error.message });
    }
};

// Eliminar (desactivar) espacio de trabajo
const deleteEspacio = async (req, res) => {
    try {
        const espacio = await EspacioTrabajo.findByPk(req.params.id);

        if (!espacio) {
            return res.status(404).json({ error: 'Espacio de trabajo no encontrado' });
        }

        await espacio.update({ activo: false });
        res.json({ message: 'Espacio de trabajo desactivado exitosamente' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Eliminar múltiples espacios de trabajo
const deleteBulk = async (req, res) => {
    try {
        const { ids } = req.body;

        if (!ids || !Array.isArray(ids) || ids.length === 0) {
            return res.status(400).json({ error: 'Se requiere un array de IDs' });
        }

        await EspacioTrabajo.update(
            { activo: false },
            { where: { id: ids } }
        );

        res.json({ message: `${ids.length} espacio(s) de trabajo desactivado(s) exitosamente` });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Reactivar espacio de trabajo
const reactivate = async (req, res) => {
    try {
        const espacio = await EspacioTrabajo.findByPk(req.params.id);

        if (!espacio) {
            return res.status(404).json({ error: 'Espacio de trabajo no encontrado' });
        }

        await espacio.update({ activo: true });

        // Recargar con el propietario
        const espacioReactivado = await EspacioTrabajo.findByPk(espacio.id, {
            include: [
                {
                    model: Usuario,
                    as: 'propietario',
                    attributes: ['id', 'nombre', 'apellido', 'email'],
                },
            ],
        });

        res.json(espacioReactivado);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

/**
 * Verificar si un empleado puede cambiar de espacio de trabajo
 * No puede cambiar si tiene contratos, registros de salud o contactos (incluso inactivos)
 */
const canChangeEmpleadoWorkspace = async (req, res) => {
    try {
        const { empleadoId } = req.params;

        // Verificar contratos (activos e inactivos)
        const contratosCount = await Contrato.count({
            where: { empleadoId }
        });

        if (contratosCount > 0) {
            return res.json({
                canChange: false,
                reason: 'El empleado tiene contratos asociados'
            });
        }

        // Verificar registros de salud (activos e inactivos)
        const registrosSaludCount = await RegistroSalud.count({
            where: { empleadoId }
        });

        if (registrosSaludCount > 0) {
            return res.json({
                canChange: false,
                reason: 'El empleado tiene registros de salud asociados'
            });
        }

        // Verificar contactos (activos e inactivos)
        const contactosCount = await Contacto.count({
            where: { empleadoId }
        });

        if (contactosCount > 0) {
            return res.json({
                canChange: false,
                reason: 'El empleado tiene contactos asociados'
            });
        }

        res.json({ canChange: true });
    } catch (error) {
        console.error('Error al verificar cambio de espacio de trabajo del empleado:', error);
        res.status(500).json({ error: 'Error al verificar cambio de espacio de trabajo' });
    }
};

/**
 * Verificar si una empresa puede cambiar de espacio de trabajo
 * No puede cambiar si tiene contratos asociados (incluso inactivos)
 */
const canChangeEmpresaWorkspace = async (req, res) => {
    try {
        const { empresaId } = req.params;

        // Obtener todos los puestos de la empresa (a través de áreas y departamentos)
        const puestos = await Puesto.findAll({
            include: [{
                model: Departamento,
                as: 'departamento',
                required: true,
                include: [{
                    model: Area,
                    as: 'area',
                    required: true,
                    where: { empresaId }
                }]
            }]
        });

        const puestoIds = puestos.map(p => p.id);

        if (puestoIds.length > 0) {
            // Verificar si hay contratos asociados a estos puestos (activos e inactivos)
            const contratosCount = await ContratoPuesto.count({
                where: { puestoId: puestoIds }
            });

            if (contratosCount > 0) {
                return res.json({
                    canChange: false,
                    reason: 'La empresa tiene contratos asociados a sus puestos'
                });
            }
        }

        res.json({ canChange: true });
    } catch (error) {
        console.error('Error al verificar cambio de espacio de trabajo de la empresa:', error);
        res.status(500).json({ error: 'Error al verificar cambio de espacio de trabajo' });
    }
};

/**
 * Verificar si un rol puede cambiar de espacio de trabajo
 * No puede cambiar si tiene contratos asociados (incluso inactivos)
 */
const canChangeRolWorkspace = async (req, res) => {
    try {
        const { rolId } = req.params;

        // Verificar contratos asociados al rol (activos e inactivos)
        const contratosCount = await Contrato.count({
            where: { rolId }
        });

        if (contratosCount > 0) {
            return res.json({
                canChange: false,
                reason: 'El rol tiene contratos asociados'
            });
        }

        res.json({ canChange: true });
    } catch (error) {
        console.error('Error al verificar cambio de espacio de trabajo del rol:', error);
        res.status(500).json({ error: 'Error al verificar cambio de espacio de trabajo' });
    }
};

module.exports = {
    getAll,
    getById,
    create,
    update,
    deleteEspacio,
    deleteBulk,
    reactivate,
    canChangeEmpleadoWorkspace,
    canChangeEmpresaWorkspace,
    canChangeRolWorkspace,
};
