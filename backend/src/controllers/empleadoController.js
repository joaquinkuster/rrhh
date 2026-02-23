const { Empleado, Usuario, RegistroSalud, Contrato, EspacioTrabajo, sequelize, Contacto } = require('../models');
const { Op } = require('sequelize');

// Obtener todos los empleados con filtros y paginación
const getAll = async (req, res) => {
    try {
        const { nombre, apellido, email, nacionalidad, genero, estadoCivil, activo, page = 1, limit = 10, documento } = req.query;

        // Filtros para la tabla Empleado
        const whereEmpleado = {};
        // Filtros para la tabla Usuario
        const whereUsuario = {};

        // Filtro de activo AHORA EN USUARIO
        if (activo === 'false') {
            whereUsuario.activo = false;
        } else if (activo === 'all') {
            // No filtrar
        } else {
            whereUsuario.activo = true;
        }

        // Filtros que ahora viven en Empleado
        if (nacionalidad) whereEmpleado.nacionalidadId = nacionalidad;
        if (genero) whereEmpleado.genero = genero;
        if (estadoCivil) whereEmpleado.estadoCivil = estadoCivil;
        if (documento) whereEmpleado.numeroDocumento = { [Op.like]: `${documento}%` };

        // Filtros de texto en Usuario
        if (nombre) whereUsuario.nombre = { [Op.like]: `%${nombre}%` };
        if (apellido) whereUsuario.apellido = { [Op.like]: `%${apellido}%` };
        if (email) whereUsuario.email = { [Op.like]: `%${email}%` };

        // Restricción de Espacio de Trabajo
        const usuarioSesionId = req.session.usuarioId || req.session.empleadoId;
        const esAdmin = req.session.esAdministrador;

        // Si viene un espacioTrabajoId en la query, usarlo (asumiendo que el front ya validó o que es un filtro deseado)
        // TODO: idealmente validar que el usuario tenga acceso a ese espacio
        if (req.query.espacioTrabajoId) {
            whereEmpleado.espacioTrabajoId = req.query.espacioTrabajoId;
        } else if (!esAdmin) {
            // Si NO es admin y no hay filtro explícito, buscar sus espacios
            // 1. Si es empleado
            const empleadoSesion = await Empleado.findOne({ where: { usuarioId: usuarioSesionId } });

            if (empleadoSesion) {
                whereEmpleado.espacioTrabajoId = empleadoSesion.espacioTrabajoId;
            } else {
                // 2. Si es propietario (puede tener múltiples espacios)
                const espaciosPropios = await EspacioTrabajo.findAll({
                    where: { propietarioId: usuarioSesionId },
                    attributes: ['id']
                });

                if (espaciosPropios.length > 0) {
                    const espaciosIds = espaciosPropios.map(e => e.id);
                    whereEmpleado.espacioTrabajoId = { [Op.in]: espaciosIds };
                } else {
                    // Si no tiene espacios propios ni es empleado, no debe ver nada
                    whereEmpleado.espacioTrabajoId = -1;
                }
            }
        }

        const offset = (parseInt(page) - 1) * parseInt(limit);

        const { count, rows } = await Empleado.findAndCountAll({
            where: whereEmpleado,
            include: [
                {
                    model: Usuario,
                    as: 'usuario',
                    where: whereUsuario,
                    // Traer atributos de usuario
                    attributes: ['id', 'nombre', 'apellido', 'email', 'activo']
                },
                {
                    model: EspacioTrabajo,
                    as: 'espacioTrabajo',
                    attributes: ['id', 'nombre']
                }
            ],
            order: [
                [{ model: Usuario, as: 'usuario' }, 'apellido', 'ASC'],
                [{ model: Usuario, as: 'usuario' }, 'nombre', 'ASC']
            ],
            limit: parseInt(limit),
            offset,
        });

        const flatRows = rows.map(emp => {
            const plainEmp = emp.get({ plain: true });
            const usuario = plainEmp.usuario || {};
            // Mezclar propiedades de usuario en el nivel superior
            return {
                ...plainEmp,
                ...usuario, // nombre, apellido, email
                usuarioActivo: usuario.activo, // Alias para no pisar activo del empleado (si existiera)
                id: plainEmp.id, // Mantener ID de empleado como id principal
                usuarioId: usuario.id
            };
        });

        res.json({
            data: flatRows,
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

// Obtener empleado por ID
const getById = async (req, res) => {
    try {
        const empleado = await Empleado.findByPk(req.params.id, {
            include: [{
                model: Usuario,
                as: 'usuario',
                attributes: { exclude: ['contrasena'] }
            }]
        });

        if (!empleado) {
            return res.status(404).json({ error: 'Empleado no encontrado' });
        }

        // Aplanar
        const plainEmp = empleado.get({ plain: true });
        const usuario = plainEmp.usuario || {};

        const result = {
            ...plainEmp,
            ...usuario,
            id: plainEmp.id,
            usuarioId: usuario.id,
            usuarioActivo: usuario.activo
        };

        res.json(result);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Crear empleado (Usuario + Empleado)
const create = async (req, res) => {
    const t = await sequelize.transaction();
    try {
        // Extraer campos que van a Usuario vs Empleado
        // Extraer campos que van a Usuario vs Empleado
        let {
            nombre, apellido, email, contrasena,
            // Datos personales ahora van a Empleado
            telefono, tipoDocumento, numeroDocumento, cuil, fechaNacimiento, nacionalidadId, genero, estadoCivil,
            calle, numero, piso, departamento, codigoPostal, provinciaId, ciudadId,
            espacioTrabajoId, // Extraer explícitamente
            ...otrosDatosEmpleado
        } = req.body;

        if (!espacioTrabajoId) {
            throw new Error('No se pudo determinar el espacio de trabajo para crear el empleado');
        }

        // Validar unicidad de documento dentro del mismo espacioTrabajo y tipoDocumento
        if (numeroDocumento && tipoDocumento) {
            const docExistente = await Empleado.findOne({
                where: { espacioTrabajoId, tipoDocumento, numeroDocumento }
            });
            if (docExistente) {
                await t.rollback();
                return res.status(400).json({ error: `El número de documento ya está registrado para el tipo ${tipoDocumento} en este espacio de trabajo` });
            }
        }

        // Validar unicidad de CUIL dentro del mismo espacioTrabajo
        if (cuil) {
            const cuilExistente = await Empleado.findOne({
                where: { espacioTrabajoId, cuil }
            });
            if (cuilExistente) {
                await t.rollback();
                return res.status(400).json({ error: 'El CUIL ya está registrado en este espacio de trabajo' });
            }
        }

        // 1. Crear Usuario (Solo Auth + Nombre)
        const rawPassword = contrasena || 'Sistema123!';

        const usuario = await Usuario.create({
            nombre,
            apellido,
            email,
            contrasena: rawPassword,
            esEmpleado: true,
            esAdministrador: false,
            activo: true,
            creadoPorRrhh: true
        }, { transaction: t });

        // 2. Crear Empleado (Datos personales + Dirección + Vinculación)
        const nuevoEmpleado = await Empleado.create({
            ...otrosDatosEmpleado,
            usuarioId: usuario.id,
            espacioTrabajoId: espacioTrabajoId,
            // Datos personales
            telefono, tipoDocumento, numeroDocumento, cuil, fechaNacimiento, nacionalidadId, genero, estadoCivil,
            // Dirección
            calle, numero, piso, departamento, codigoPostal, provinciaId, ciudadId
        }, { transaction: t });

        await t.commit();

        // Responder con estructura aplanada
        res.status(201).json({
            ...nuevoEmpleado.get({ plain: true }),
            ...usuario.get({ plain: true }), // Mezclar datos de usuario
            id: nuevoEmpleado.id, // Preservar ID empleado
            usuarioId: usuario.id
        });

    } catch (error) {
        await t.rollback();
        if (error.name === 'SequelizeUniqueConstraintError') {
            const field = error.errors?.[0]?.path || '';
            if (field === 'email') return res.status(400).json({ error: 'El email ya está registrado' });
        }
        res.status(500).json({ error: error.message });
    }
};

// Actualizar empleado (y usuario)
const update = async (req, res) => {
    const t = await sequelize.transaction();
    try {
        const empleado = await Empleado.findByPk(req.params.id);

        if (!empleado) {
            return res.status(404).json({ error: 'Empleado no encontrado' });
        }

        // Separar datos
        const {
            nombre, apellido, email,
            // Datos personales ahora en Empleado
            telefono, tipoDocumento, numeroDocumento, cuil, fechaNacimiento, nacionalidadId, genero, estadoCivil,
            calle, numero, piso, departamento, codigoPostal, provinciaId, ciudadId, espacioTrabajoId,
            ...empleadoData
        } = req.body;

        const currentEspacio = espacioTrabajoId || empleado.espacioTrabajoId;
        const currentTipo = tipoDocumento || empleado.tipoDocumento;
        const currentDoc = numeroDocumento || empleado.numeroDocumento;

        if (currentDoc && currentTipo) {
            const docExistente = await Empleado.findOne({
                where: {
                    espacioTrabajoId: currentEspacio,
                    tipoDocumento: currentTipo,
                    numeroDocumento: currentDoc,
                    id: { [Op.ne]: empleado.id }
                }
            });
            if (docExistente) {
                await t.rollback();
                return res.status(400).json({ error: `El número de documento ya está registrado para el tipo ${currentTipo} en este espacio de trabajo` });
            }
        }

        const currentCuil = cuil !== undefined ? cuil : empleado.cuil;
        if (currentCuil) {
            const cuilExistente = await Empleado.findOne({
                where: {
                    espacioTrabajoId: currentEspacio,
                    cuil: currentCuil,
                    id: { [Op.ne]: empleado.id }
                }
            });
            if (cuilExistente) {
                await t.rollback();
                return res.status(400).json({ error: 'El CUIL ya está registrado en este espacio de trabajo' });
            }
        }

        // Actualizar Empleado (Datos personales + Dirección + Otros)
        await empleado.update({
            ...empleadoData,
            telefono, tipoDocumento, numeroDocumento, cuil, fechaNacimiento, nacionalidadId, genero, estadoCivil,
            calle, numero, piso, departamento, codigoPostal, provinciaId, ciudadId
        }, { transaction: t });

        // Actualizar Usuario asociado (Solo Auth + Nombre)
        const usuario = await Usuario.findByPk(empleado.usuarioId);
        if (usuario) {
            await usuario.update({
                nombre, apellido, email
            }, { transaction: t });
        }

        await t.commit();

        // Recargar para devolver datos frescos
        const empleadoUpdated = await Empleado.findByPk(req.params.id, {
            include: [{ model: Usuario, as: 'usuario' }]
        });

        const plainEmp = empleadoUpdated.get({ plain: true });
        const plainUser = plainEmp.usuario || {};

        res.json({
            ...plainEmp,
            ...plainUser,
            id: plainEmp.id,
            usuarioId: plainUser.id
        });

    } catch (error) {
        await t.rollback();
        if (error.name === 'SequelizeUniqueConstraintError') {
            return res.status(400).json({ error: 'El email ya está en uso' });
        }
        res.status(500).json({ error: error.message });
    }
};

// Eliminar empleado (desactiva usuario y empleado)
const remove = async (req, res) => {
    const t = await sequelize.transaction();
    try {
        const empleado = await Empleado.findByPk(req.params.id, {
            include: [{ model: Usuario, as: 'usuario' }]
        });

        if (!empleado) {
            return res.status(404).json({ error: 'Empleado no encontrado' });
        }

        // Verificar registros activos (manteniendo lógica anterior)
        const registrosActivos = await RegistroSalud.count({
            where: { empleadoId: empleado.id, activo: true }
        });
        const contratosActivos = await Contrato.count({
            where: { empleadoId: empleado.id, activo: true }
        });
        const contactosActivos = await Contacto.count({
            where: { empleadoId: empleado.id, activo: true }
        });

        if (registrosActivos > 0) {
            return res.status(400).json({ error: `No se puede desactivar el empleado "${empleado.usuario.nombre}" porque tiene ${registrosActivos} registro(s) de salud activo(s). Primero desactive los registros de salud.` });
        }

        if (contratosActivos > 0) {
            return res.status(400).json({ error: `No se puede desactivar el empleado "${empleado.usuario.nombre}" porque tiene ${contratosActivos} contrato(s) activo(s). Primero desactive los contratos.` });
        }

        if (contactosActivos > 0) {
            return res.status(400).json({ error: `No se puede desactivar el empleado "${empleado.usuario.nombre}" porque tiene ${contactosActivos} contacto(s) activo(s). Primero desactive los contactos.` });
        }

        // Empleado ya no tiene campo activo
        // await empleado.update({ activo: false }, { transaction: t });

        // Desactivar Usuario
        await Usuario.update({ activo: false }, { where: { id: empleado.usuarioId }, transaction: t });

        await t.commit();
        res.json({ message: 'Empleado desactivado correctamente' });
    } catch (error) {
        await t.rollback();
        res.status(500).json({ error: error.message });
    }
};

// Reactivar
const reactivate = async (req, res) => {
    const t = await sequelize.transaction();
    try {
        const empleado = await Empleado.findByPk(req.params.id, {
            include: [{ model: Usuario, as: 'usuario' }]
        });
        if (!empleado) return res.status(404).json({ error: 'Empleado no encontrado' });

        // 1. Validar unicidad de email activo
        const emailDuplicado = await Usuario.findOne({
            where: {
                email: empleado.usuario.email,
                activo: true,
                id: { [Op.ne]: empleado.usuarioId }
            }
        });
        if (emailDuplicado) {
            await t.rollback();
            return res.status(400).json({ error: 'Ya existe un usuario activo con este email' });
        }

        // 2. Validar unicidad de documento activo en el mismo espacio
        if (empleado.numeroDocumento && empleado.tipoDocumento) {
            const docExistente = await Empleado.findOne({
                where: {
                    espacioTrabajoId: empleado.espacioTrabajoId,
                    tipoDocumento: empleado.tipoDocumento,
                    numeroDocumento: empleado.numeroDocumento,
                    id: { [Op.ne]: empleado.id }
                },
                include: [{
                    model: Usuario,
                    as: 'usuario',
                    where: { activo: true }
                }]
            });
            if (docExistente) {
                await t.rollback();
                return res.status(400).json({ error: `El número de documento ya está registrado para el tipo ${empleado.tipoDocumento} en este espacio de trabajo` });
            }
        }

        // 3. Validar unicidad de CUIL activo en el mismo espacio
        if (empleado.cuil) {
            const cuilExistente = await Empleado.findOne({
                where: {
                    espacioTrabajoId: empleado.espacioTrabajoId,
                    cuil: empleado.cuil,
                    id: { [Op.ne]: empleado.id }
                },
                include: [{
                    model: Usuario,
                    as: 'usuario',
                    where: { activo: true }
                }]
            });
            if (cuilExistente) {
                await t.rollback();
                return res.status(400).json({ error: 'El CUIL ya está registrado en este espacio de trabajo' });
            }
        }

        await Usuario.update({ activo: true }, { where: { id: empleado.usuarioId }, transaction: t });

        await t.commit();
        res.json(empleado);
    } catch (error) {
        await t.rollback();
        res.status(500).json({ error: error.message });
    }
};

// Bulk remove
const bulkRemove = async (req, res) => {
    try {
        const { ids } = req.body;
        if (!ids || !ids.length) return res.status(400).json({ error: 'IDs requeridos' });

        // --- Verificaciones de entidades asociadas activas para cada empleado ---
        for (const id of ids) {
            const empleado = await Empleado.findByPk(id, {
                include: [{ model: Usuario, as: 'usuario' }]
            });
            if (!empleado) continue;

            const registrosActivos = await RegistroSalud.count({ where: { empleadoId: id, activo: true } });
            if (registrosActivos > 0) {
                return res.status(400).json({ error: `No se puede desactivar el empleado "${empleado.usuario.nombre}" porque tiene ${registrosActivos} registro(s) de salud activo(s). Primero desactive los registros de salud.` });
            }

            const contratosActivos = await Contrato.count({
                where: { empleadoId: id, activo: true }
            });
            if (contratosActivos > 0) {
                return res.status(400).json({ error: `No se puede desactivar el empleado "${empleado.usuario.nombre}" porque tiene ${contratosActivos} contrato(s) activo(s). Primero desactive los contratos.` });
            }

            const contactosActivos = await Contacto.count({ where: { empleadoId: id, activo: true } });
            if (contactosActivos > 0) {
                return res.status(400).json({ error: `No se puede desactivar el empleado "${empleado.usuario.nombre}" porque tiene ${contactosActivos} contacto(s) activo(s). Primero desactive los contactos.` });
            }
        }

        // await Empleado.update({ activo: false }, { where: { id: ids } });
        await Usuario.update({ activo: false }, { where: { id: ids } });

        res.json({ message: 'Empleados desactivados' });
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
    reactivate,
    bulkRemove,
};
