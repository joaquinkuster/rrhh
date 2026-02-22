const { Usuario, Empleado, Contrato, Rol, Permiso } = require('../models');
const { body, validationResult } = require('express-validator');
const bcrypt = require('bcrypt');

/**
 * Login de usuario
 */
const login = async (req, res) => {
    try {
        const { email, contrasena, recordarme } = req.body;

        // Validación básica
        if (!email || !contrasena) {
            return res.status(400).json({
                error: 'Email y contraseña son requeridos'
            });
        }

        // Buscar usuario por email
        const usuario = await Usuario.findOne({
            where: { email, activo: true }
        });

        if (!usuario) {
            return res.status(401).json({
                error: 'Credenciales inválidas'
            });
        }

        // Verificar contraseña
        const isMatch = await bcrypt.compare(contrasena, usuario.contrasena);
        if (!isMatch) {
            return res.status(401).json({
                error: 'Credenciales inválidas'
            });
        }

        // Crear sesión
        req.session.usuarioId = usuario.id;
        req.session.empleadoId = usuario.id; // Retrocompatibilidad temporal: ID de usuario
        req.session.esAdministrador = usuario.esAdministrador;

        // Si "recordarme" está activo, extender duración de la cookie
        if (recordarme) {
            req.session.cookie.maxAge = 30 * 24 * 60 * 60 * 1000; // 30 días
        }

        // Buscar un empleo asociado para mezclar datos (compatibilidad frontend)
        const emp = await Empleado.findOne({
            where: {
                usuarioId: usuario.id
            }
        });

        // Lógica de contrato seleccionado por defecto
        if (emp && !emp.ultimoContratoSeleccionadoId) {
            const ultimoContrato = await Contrato.findOne({
                where: { empleadoId: emp.id, activo: true },
                order: [['fechaInicio', 'DESC'], ['createdAt', 'DESC']]
            });
            if (ultimoContrato) {
                await emp.update({ ultimoContratoSeleccionadoId: ultimoContrato.id });
                emp.ultimoContratoSeleccionadoId = ultimoContrato.id;
            }
        }

        // Construir respuesta userData
        const userData = usuario.get({ plain: true });
        delete userData.contrasena;

        if (emp) {
            const empData = emp.get({ plain: true });

            // Cargar Rol y Permisos del contrato seleccionado
            if (empData.ultimoContratoSeleccionadoId) {
                const contrato = await Contrato.findByPk(empData.ultimoContratoSeleccionadoId, {
                    include: [{
                        model: Rol,
                        as: 'rol',
                        attributes: ['id', 'nombre'],
                        include: [{
                            model: Permiso,
                            as: 'permisos',
                            through: { attributes: [] },
                            attributes: ['id', 'modulo', 'accion']
                        }]
                    }]
                });

                if (contrato && contrato.rol) {
                    userData.rol = contrato.rol;
                }
            }

            // Mezclar datos de empleado en el objeto usuario (para compatibilidad con frontend actual)
            Object.assign(userData, {
                empleadoId: empData.id,
                espacioTrabajoId: empData.espacioTrabajoId,
                telefono: empData.telefono,
                tipoDocumento: empData.tipoDocumento,
                numeroDocumento: empData.numeroDocumento,
                cuil: empData.cuil,
                fechaNacimiento: empData.fechaNacimiento,
                nacionalidadId: empData.nacionalidadId,
                genero: empData.genero,
                estadoCivil: empData.estadoCivil,
                calle: empData.calle,
                numero: empData.numero,
                piso: empData.piso,
                departamento: empData.departamento,
                codigoPostal: empData.codigoPostal,
                provinciaId: empData.provinciaId,
                ciudadId: empData.ciudadId,
                ultimoContratoSeleccionadoId: empData.ultimoContratoSeleccionadoId,
            });
        }

        // Guardar sesión y retornar datos
        req.session.save((err) => {
            if (err) {
                console.error('Error al guardar sesión:', err);
                return res.status(500).json({ error: 'Error al iniciar sesión' });
            }

            res.json({
                message: 'Inicio de sesión exitoso',
                usuario: userData
            });
        });

    } catch (error) {
        console.error('Error en login:', error);
        res.status(500).json({ error: 'Error al procesar la solicitud' });
    }
};

/**
 * Logout de usuario
 */
const logout = (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            console.error('Error al cerrar sesión:', err);
            return res.status(500).json({ error: 'Error al cerrar sesión' });
        }
        res.clearCookie('connect.sid');
        res.json({ message: 'Sesión cerrada exitosamente' });
    });
};

/**
 * Registro público de usuario (esEmpleado = false)
 */
const register = [
    // Validaciones
    body('email').isEmail().withMessage('Email inválido'),
    body('contrasena')
        .isLength({ min: 8 }).withMessage('La contraseña debe tener al menos 8 caracteres')
        .matches(/[A-Z]/).withMessage('La contraseña debe contener al menos una mayúscula')
        .matches(/[0-9]/).withMessage('La contraseña debe contener al menos un número')
        .matches(/[@$!%*?&#]/).withMessage('La contraseña debe contener al menos un carácter especial'),
    body('nombre').notEmpty().withMessage('El nombre es requerido'),
    body('apellido').notEmpty().withMessage('El apellido es requerido'),

    async (req, res) => {
        try {
            // Validar errores
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({
                    error: errors.array()[0].msg
                });
            }

            const usuarioData = {
                nombre: req.body.nombre,
                apellido: req.body.apellido,
                email: req.body.email,
                contrasena: req.body.contrasena,
                esEmpleado: false, // Registro público
                esAdministrador: false,
                activo: true,
            };

            // Crear usuario
            const nuevoUsuario = await Usuario.create(usuarioData);

            return res.status(201).json({
                message: 'Registro exitoso',
                usuario: {
                    id: nuevoUsuario.id,
                    nombre: nuevoUsuario.nombre,
                    apellido: nuevoUsuario.apellido,
                    email: nuevoUsuario.email,
                    esAdministrador: false,
                    esEmpleado: false,
                    activo: true,
                    createdAt: nuevoUsuario.createdAt,
                    updatedAt: nuevoUsuario.updatedAt,
                }
            });

        } catch (error) {
            console.error('Error en registro:', error);

            if (error.name === 'SequelizeUniqueConstraintError') {
                return res.status(400).json({
                    error: 'El email ya está registrado'
                });
            }

            if (error.name === 'SequelizeValidationError') {
                return res.status(400).json({
                    error: error.errors[0].message
                });
            }

            res.status(500).json({ error: 'Error al procesar el registro' });
        }
    }
];

/**
 * Obtener usuario actual en sesión
 */
const getCurrentUser = async (req, res) => {
    try {
        const usuarioId = req.session.usuarioId || req.session.empleadoId;

        if (!usuarioId) {
            return res.status(401).json({ error: 'No autorizado' });
        }

        const usuario = await Usuario.findByPk(usuarioId, {
            attributes: { exclude: ['contrasena'] },
        });

        if (!usuario) {
            return res.status(404).json({ error: 'Usuario no encontrado' });
        }

        const result = usuario.get({ plain: true });

        // Buscar empleado asociado por separado (evita problemas con limit en hasMany)
        const empleado = await Empleado.findOne({ where: { usuarioId } });
        if (empleado) {
            // Lógica de contrato seleccionado por defecto si es nulo
            if (!empleado.ultimoContratoSeleccionadoId) {
                const ultimoContrato = await Contrato.findOne({
                    where: { empleadoId: empleado.id, activo: true },
                    order: [['fechaInicio', 'DESC'], ['createdAt', 'DESC']]
                });
                if (ultimoContrato) {
                    await empleado.update({ ultimoContratoSeleccionadoId: ultimoContrato.id });
                    empleado.ultimoContratoSeleccionadoId = ultimoContrato.id;
                }
            }

            const emp = empleado.get({ plain: true });

            // Cargar Rol y Permisos del contrato seleccionado
            if (emp.ultimoContratoSeleccionadoId) {
                const contrato = await Contrato.findByPk(emp.ultimoContratoSeleccionadoId, {
                    include: [{
                        model: Rol,
                        as: 'rol',
                        attributes: ['id', 'nombre'],
                        include: [{
                            model: Permiso,
                            as: 'permisos',
                            through: { attributes: [] }, // Tabla intermedia
                            attributes: ['id', 'modulo', 'accion']
                        }]
                    }]
                });

                if (contrato && contrato.rol) {
                    result.rol = contrato.rol;
                }
            }

            Object.assign(result, {
                empleadoId: emp.id,
                espacioTrabajoId: emp.espacioTrabajoId,
                telefono: emp.telefono,
                tipoDocumento: emp.tipoDocumento,
                numeroDocumento: emp.numeroDocumento,
                cuil: emp.cuil,
                fechaNacimiento: emp.fechaNacimiento,
                nacionalidadId: emp.nacionalidadId,
                genero: emp.genero,
                estadoCivil: emp.estadoCivil,
                calle: emp.calle,
                numero: emp.numero,
                piso: emp.piso,
                departamento: emp.departamento,
                codigoPostal: emp.codigoPostal,
                provinciaId: emp.provinciaId,
                ciudadId: emp.ciudadId,
                ultimoContratoSeleccionadoId: emp.ultimoContratoSeleccionadoId,
            });
        }

        res.json(result);

    } catch (error) {
        console.error('Error al obtener usuario:', error);
        res.status(500).json({ error: 'Error al obtener información del usuario' });
    }
};

/**
 * Cambiar contraseña
 */
const updatePassword = [
    body('nuevaContrasena')
        .isLength({ min: 8 }).withMessage('La contraseña debe tener al menos 8 caracteres')
        .matches(/[A-Z]/).withMessage('La contraseña debe contener al menos una mayúscula')
        .matches(/[0-9]/).withMessage('La contraseña debe contener al menos un número')
        .matches(/[@$!%*?&#]/).withMessage('La contraseña debe contener al menos un carácter especial'),

    async (req, res) => {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({
                    error: errors.array()[0].msg
                });
            }

            const { usuarioId, contrasenaActual, nuevaContrasena } = req.body;
            const usuarioIdSesion = req.session.usuarioId || req.session.empleadoId;
            const esAdmin = req.session.esAdministrador;

            const targetId = usuarioId || usuarioIdSesion;

            // Verificar permisos
            if (targetId !== usuarioIdSesion && !esAdmin) {
                return res.status(403).json({
                    error: 'No tiene permisos para cambiar esta contraseña'
                });
            }

            const usuario = await Usuario.findByPk(targetId);
            if (!usuario) {
                return res.status(404).json({ error: 'Usuario no encontrado' });
            }

            // Si no es admin y está cambiando su propia contraseña, verificar la actual
            if (!esAdmin && targetId === usuarioIdSesion) {
                if (!contrasenaActual) {
                    return res.status(400).json({
                        error: 'Debe proporcionar la contraseña actual'
                    });
                }

                const isMatch = await bcrypt.compare(contrasenaActual, usuario.contrasena);
                if (!isMatch) {
                    return res.status(401).json({
                        error: 'Contraseña actual incorrecta'
                    });
                }
            }

            usuario.contrasena = nuevaContrasena;
            await usuario.save(); // Hook hashea

            res.json({ message: 'Contraseña actualizada exitosamente' });

        } catch (error) {
            console.error('Error al actualizar contraseña:', error);
            res.status(500).json({ error: 'Error al actualizar contraseña' });
        }
    }
];

/**
 * Actualizar contrato seleccionado
 */
const updateSelectedContract = async (req, res) => {
    try {
        const { contratoId } = req.body;
        const usuarioSesionId = req.session.usuarioId || req.session.empleadoId;

        if (!usuarioSesionId) return res.status(401).json({ error: 'No autorizado' });

        const emp = await Empleado.findOne({ where: { usuarioId: usuarioSesionId } });

        if (!emp) {
            return res.status(404).json({ error: 'Empleado no encontrado' });
        }

        if (contratoId) {
            // Validar que el contrato sea del empleado
            const contrato = await Contrato.findOne({
                where: {
                    id: contratoId,
                    empleadoId: emp.id
                }
            });

            if (!contrato) {
                return res.status(403).json({ error: 'Contrato no válido o no pertenece al empleado' });
            }

            await emp.update({ ultimoContratoSeleccionadoId: contratoId });
        }

        res.json({ success: true, contratoId });

    } catch (error) {
        console.error('Error updating selected contract:', error);
        res.status(500).json({ error: 'Error interno al actualizar contrato seleccionado' });
    }
};

/**
 * Actualizar perfil del usuario actual (nombre, apellido, email)
 */
const updateMe = async (req, res) => {
    try {
        const usuarioId = req.session.usuarioId || req.session.empleadoId;
        if (!usuarioId) return res.status(401).json({ error: 'No autorizado' });

        const { nombre, apellido, email } = req.body;

        if (!nombre?.trim()) return res.status(400).json({ error: 'El nombre es requerido' });
        if (!apellido?.trim()) return res.status(400).json({ error: 'El apellido es requerido' });
        if (!email?.trim()) return res.status(400).json({ error: 'El email es requerido' });
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return res.status(400).json({ error: 'Email inválido' });

        const usuario = await Usuario.findByPk(usuarioId);
        if (!usuario) return res.status(404).json({ error: 'Usuario no encontrado' });

        // Verificar email único (ignorando el propio)
        if (email.toLowerCase() !== usuario.email.toLowerCase()) {
            const existing = await Usuario.findOne({ where: { email } });
            if (existing) return res.status(400).json({ error: 'El email ya está registrado por otro usuario' });
        }

        await usuario.update({ nombre: nombre.trim(), apellido: apellido.trim(), email: email.trim() });

        res.json({
            message: 'Perfil actualizado correctamente', usuario: {
                id: usuario.id, nombre: usuario.nombre, apellido: usuario.apellido, email: usuario.email
            }
        });
    } catch (error) {
        console.error('Error al actualizar perfil:', error);
        res.status(500).json({ error: 'Error al actualizar el perfil' });
    }
};

module.exports = {
    login,
    logout,
    register,
    getCurrentUser,
    updatePassword,
    updateSelectedContract,
    updateMe,
};
