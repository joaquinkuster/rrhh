const { Empleado } = require('../models');
const { body, validationResult } = require('express-validator');

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

        // Buscar empleado por email
        const empleado = await Empleado.findOne({
            where: { email, activo: true }
        });

        if (!empleado) {
            return res.status(401).json({
                error: 'Credenciales inválidas'
            });
        }

        // Verificar contraseña
        const contrasenaValida = await empleado.verificarContrasena(contrasena);
        if (!contrasenaValida) {
            return res.status(401).json({
                error: 'Credenciales inválidas'
            });
        }

        // Crear sesión
        req.session.empleadoId = empleado.id;
        req.session.esAdministrador = empleado.esAdministrador;

        // Si "recordarme" está activo, extender duración de la cookie
        if (recordarme) {
            req.session.cookie.maxAge = 30 * 24 * 60 * 60 * 1000; // 30 días
        }

        // Guardar sesión y retornar datos del usuario (sin contraseña)
        req.session.save((err) => {
            if (err) {
                console.error('Error al guardar sesión:', err);
                return res.status(500).json({ error: 'Error al iniciar sesión' });
            }

            res.json({
                message: 'Inicio de sesión exitoso',
                usuario: {
                    id: empleado.id,
                    nombre: empleado.nombre,
                    apellido: empleado.apellido,
                    email: empleado.email,
                    telefono: empleado.telefono,
                    genero: empleado.genero,
                    esAdministrador: empleado.esAdministrador,
                    creadoPorRrhh: empleado.creadoPorRrhh,
                    activo: empleado.activo,
                    // Datos personales
                    tipoDocumento: empleado.tipoDocumento,
                    numeroDocumento: empleado.numeroDocumento,
                    cuil: empleado.cuil,
                    fechaNacimiento: empleado.fechaNacimiento,
                    nacionalidadId: empleado.nacionalidadId,
                    estadoCivil: empleado.estadoCivil,
                    // Dirección
                    calle: empleado.calle,
                    numero: empleado.numero,
                    piso: empleado.piso,
                    departamento: empleado.departamento,
                    codigoPostal: empleado.codigoPostal,
                    provinciaId: empleado.provinciaId,
                    ciudadId: empleado.ciudadId,
                    // Timestamps
                    createdAt: empleado.createdAt,
                    updatedAt: empleado.updatedAt,
                }
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
 * Registro público de usuario (creadoPorRrhh = false)
 */
const register = [
    // Validaciones
    body('email').isEmail().withMessage('Email inválido'),
    body('contrasena')
        .isLength({ min: 8 }).withMessage('La contraseña debe tener al menos 8 caracteres')
        .matches(/[A-Z]/).withMessage('La contraseña debe contener al menos una mayúscula')
        .matches(/[0-9]/).withMessage('La contraseña debe contener al menos un número')
        .matches(/[@$!%*?&#]/).withMessage('La contraseña debe contener al menos un carácter especial'),

    async (req, res) => {
        try {
            // Validar errores
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({
                    error: errors.array()[0].msg
                });
            }

            const empleadoData = {
                ...req.body,
                creadoPorRrhh: false, // Registro público siempre es false
                esAdministrador: false, // Registro público nunca es admin
                activo: true,
            };

            // Crear empleado
            const nuevoEmpleado = await Empleado.create(empleadoData);

            // Auto-login después del registro
            req.session.empleadoId = nuevoEmpleado.id;
            req.session.esAdministrador = false;

            req.session.save((err) => {
                if (err) {
                    console.error('Error al guardar sesión:', err);
                    return res.status(500).json({ error: 'Registro exitoso pero error al iniciar sesión' });
                }

                res.status(201).json({
                    message: 'Registro exitoso',
                    usuario: {
                        id: nuevoEmpleado.id,
                        nombre: nuevoEmpleado.nombre,
                        apellido: nuevoEmpleado.apellido,
                        email: nuevoEmpleado.email,
                        telefono: nuevoEmpleado.telefono,
                        genero: nuevoEmpleado.genero,
                        esAdministrador: false,
                        creadoPorRrhh: false,
                        activo: true,
                        // Datos personales
                        tipoDocumento: nuevoEmpleado.tipoDocumento,
                        numeroDocumento: nuevoEmpleado.numeroDocumento,
                        cuil: nuevoEmpleado.cuil,
                        fechaNacimiento: nuevoEmpleado.fechaNacimiento,
                        nacionalidadId: nuevoEmpleado.nacionalidadId,
                        estadoCivil: nuevoEmpleado.estadoCivil,
                        // Dirección
                        calle: nuevoEmpleado.calle,
                        numero: nuevoEmpleado.numero,
                        piso: nuevoEmpleado.piso,
                        departamento: nuevoEmpleado.departamento,
                        codigoPostal: nuevoEmpleado.codigoPostal,
                        provinciaId: nuevoEmpleado.provinciaId,
                        ciudadId: nuevoEmpleado.ciudadId,
                        // Timestamps
                        createdAt: nuevoEmpleado.createdAt,
                        updatedAt: nuevoEmpleado.updatedAt,
                    }
                });
            });

        } catch (error) {
            console.error('Error en registro:', error);

            // Manejar error de email duplicado
            if (error.name === 'SequelizeUniqueConstraintError') {
                return res.status(400).json({
                    error: 'El email ya está registrado'
                });
            }

            // Manejar errores de validación
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
        const empleado = await Empleado.findByPk(req.session.empleadoId, {
            attributes: { exclude: ['contrasena'] }
        });

        if (!empleado) {
            return res.status(404).json({ error: 'Usuario no encontrado' });
        }

        // Formatear respuesta con datos completos
        const userData = {
            id: empleado.id,
            nombre: empleado.nombre,
            apellido: empleado.apellido,
            email: empleado.email,
            telefono: empleado.telefono,
            genero: empleado.genero,
            esAdministrador: empleado.esAdministrador,
            creadoPorRrhh: empleado.creadoPorRrhh,
            activo: empleado.activo,
            // Datos personales
            tipoDocumento: empleado.tipoDocumento,
            numeroDocumento: empleado.numeroDocumento,
            cuil: empleado.cuil,
            fechaNacimiento: empleado.fechaNacimiento,
            nacionalidadId: empleado.nacionalidadId,
            estadoCivil: empleado.estadoCivil,
            // Dirección
            calle: empleado.calle,
            numero: empleado.numero,
            piso: empleado.piso,
            departamento: empleado.departamento,
            codigoPostal: empleado.codigoPostal,
            provinciaId: empleado.provinciaId,
            ciudadId: empleado.ciudadId,
            // Timestamps
            createdAt: empleado.createdAt,
            updatedAt: empleado.updatedAt,
        };

        res.json(userData);

    } catch (error) {
        console.error('Error al obtener usuario:', error);
        res.status(500).json({ error: 'Error al obtener información del usuario' });
    }
};

/**
 * Cambiar contraseña (solo RRHH / admin puede cambiar contraseñas de otros)
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

            const { empleadoId, contrasenaActual, nuevaContrasena } = req.body;
            const empleadoIdSesion = req.session.empleadoId;
            const esAdmin = req.session.esAdministrador;

            // Determinar qué empleado actualizar
            const targetEmpleadoId = empleadoId || empleadoIdSesion;

            // Verificar permisos
            if (targetEmpleadoId !== empleadoIdSesion && !esAdmin) {
                return res.status(403).json({
                    error: 'No tiene permisos para cambiar esta contraseña'
                });
            }

            const empleado = await Empleado.findByPk(targetEmpleadoId);
            if (!empleado) {
                return res.status(404).json({ error: 'Empleado no encontrado' });
            }

            // Si no es admin y está cambiando su propia contraseña, verificar la actual
            if (!esAdmin && targetEmpleadoId === empleadoIdSesion) {
                if (!contrasenaActual) {
                    return res.status(400).json({
                        error: 'Debe proporcionar la contraseña actual'
                    });
                }

                const contrasenaValida = await empleado.verificarContrasena(contrasenaActual);
                if (!contrasenaValida) {
                    return res.status(401).json({
                        error: 'Contraseña actual incorrecta'
                    });
                }
            }

            // Actualizar contraseña (el hook hasheará automáticamente)
            empleado.contrasena = nuevaContrasena;
            await empleado.save();

            res.json({ message: 'Contraseña actualizada exitosamente' });

        } catch (error) {
            console.error('Error al actualizar contraseña:', error);
            res.status(500).json({ error: 'Error al actualizar contraseña' });
        }
    }
];

module.exports = {
    login,
    logout,
    register,
    getCurrentUser,
    updatePassword,
};
