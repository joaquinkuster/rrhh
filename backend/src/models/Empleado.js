const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const { parseLocalDate } = require('../utils/fechas');
const bcrypt = require('bcrypt');

const Empleado = sequelize.define('Empleado', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
    },
    // Información básica
    nombre: {
        type: DataTypes.STRING(100),
        allowNull: false,
        validate: {
            notEmpty: { msg: 'El nombre es requerido' },
            len: { args: [2, 100], msg: 'El nombre debe tener entre 2 y 100 caracteres' },
        },
    },
    apellido: {
        type: DataTypes.STRING(100),
        allowNull: false,
        validate: {
            notEmpty: { msg: 'El apellido es requerido' },
            len: { args: [2, 100], msg: 'El apellido debe tener entre 2 y 100 caracteres' },
        },
    },
    email: {
        type: DataTypes.STRING(150),
        allowNull: false,
        unique: true,
        validate: {
            notEmpty: { msg: 'El email es requerido' },
            isEmail: { msg: 'Debe ser un email válido' },
        },
    },
    telefono: {
        type: DataTypes.STRING(20),
        allowNull: true,
        validate: {
            is: {
                args: /^[0-9+\-\s()]*$/,
                msg: 'El teléfono solo puede contener números, +, -, espacios y paréntesis',
            },
        },
    },
    tipoDocumento: {
        type: DataTypes.ENUM('cedula', 'pasaporte'),
        allowNull: false,
        validate: {
            notEmpty: { msg: 'El tipo de documento es requerido' },
            isIn: {
                args: [['cedula', 'pasaporte']],
                msg: 'El tipo de documento debe ser cedula o pasaporte',
            },
        },
    },
    numeroDocumento: {
        type: DataTypes.STRING(20),
        allowNull: false,
        unique: true,
        validate: {
            notEmpty: { msg: 'El número de documento es requerido' },
            is: {
                args: /^(\d{8}|[MF]\d{7})$/,
                msg: 'El documento debe ser 8 números o comenzar con M/F seguido de 7 números',
            },
        },
    },
    cuil: {
        type: DataTypes.STRING(13),
        allowNull: true,
        unique: true,
        set(value) {
            // Convert empty string to null to avoid unique constraint issues
            this.setDataValue('cuil', value === '' ? null : value);
        },
        validate: {
            is: {
                args: /^(\d{2}-\d{8}-\d{1})?$/,
                msg: 'El CUIL debe tener el formato XX-XXXXXXXX-X',
            },
        },
    },
    fechaNacimiento: {
        type: DataTypes.DATEONLY,
        allowNull: false,
        validate: {
            notEmpty: { msg: 'La fecha de nacimiento es requerida' },
            isDate: { msg: 'Debe ser una fecha válida' },
            isAfter: {
                args: '1899-12-31',
                msg: 'La fecha de nacimiento no es válida',
            },
            isNotFuture(value) {
                const today = new Date();
                today.setHours(0, 0, 0, 0);
                value = parseLocalDate(value);
                value.setHours(0, 0, 0, 0);
                if (value > today) {
                    throw new Error('La fecha de nacimiento no puede ser futura');
                }
            },
            isMinimumAge(value) {
                const today = new Date();
                today.setHours(0, 0, 0, 0);
                value = parseLocalDate(value);
                value.setHours(0, 0, 0, 0);
                const birthDate = value;
                let age = today.getFullYear() - birthDate.getFullYear();
                const monthDiff = today.getMonth() - birthDate.getMonth();
                if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
                    age--;
                }
                if (age < 14) {
                    throw new Error('El empleado debe tener al menos 14 años');
                }
            },
        },
    },
    nacionalidad: {
        type: DataTypes.STRING(100),
        allowNull: false,
        validate: {
            notEmpty: { msg: 'La nacionalidad es requerida' },
        },
    },
    genero: {
        type: DataTypes.ENUM('femenino', 'masculino', 'otro'),
        allowNull: false,
        validate: {
            notEmpty: { msg: 'El género es requerido' },
            isIn: {
                args: [['femenino', 'masculino', 'otro']],
                msg: 'El género debe ser femenino, masculino u otro',
            },
        },
    },
    estadoCivil: {
        type: DataTypes.ENUM('soltero', 'casado', 'divorciado', 'viudo'),
        allowNull: false,
        validate: {
            notEmpty: { msg: 'El estado civil es requerido' },
            isIn: {
                args: [['soltero', 'casado', 'divorciado', 'viudo']],
                msg: 'El estado civil debe ser soltero, casado, divorciado o viudo',
            },
        },
    },
    // Dirección
    calle: {
        type: DataTypes.STRING(200),
        allowNull: false,
        validate: {
            notEmpty: { msg: 'La calle es requerida' },
            len: { args: [1, 200], msg: 'La calle debe tener entre 1 y 200 caracteres' },
        },
    },
    numero: {
        type: DataTypes.STRING(20),
        allowNull: false,
        validate: {
            notEmpty: { msg: 'El número es requerido' },
            len: { args: [1, 20], msg: 'El número debe tener entre 1 y 20 caracteres' },
        },
    },
    piso: {
        type: DataTypes.STRING(10),
        allowNull: true,
        validate: {
            len: { args: [0, 10], msg: 'El piso no puede exceder 10 caracteres' },
        },
    },
    departamento: {
        type: DataTypes.STRING(10),
        allowNull: true,
        validate: {
            len: { args: [0, 10], msg: 'El departamento no puede exceder 10 caracteres' },
        },
    },
    codigoPostal: {
        type: DataTypes.STRING(10),
        allowNull: true,
        validate: {
            len: { args: [0, 10], msg: 'El código postal no puede exceder 10 caracteres' },
            is: { args: /^[A-Z0-9]*$/i, msg: 'El código postal solo puede contener letras y números' },
        },
    },
    provinciaId: {
        type: DataTypes.STRING(10),
        allowNull: false,
        validate: {
            notEmpty: { msg: 'La provincia es requerida' },
        },
    },
    provinciaNombre: {
        type: DataTypes.STRING(100),
        allowNull: true,
        validate: {
            len: { args: [0, 100], msg: 'El nombre de provincia no puede exceder 100 caracteres' },
        },
    },
    ciudadId: {
        type: DataTypes.STRING(10),
        allowNull: true,
    },
    ciudadNombre: {
        type: DataTypes.STRING(100),
        allowNull: true,
        validate: {
            len: { args: [0, 100], msg: 'El nombre de ciudad no puede exceder 100 caracteres' },
        },
    },
    activo: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true,
    },
    // Autenticación y autorización
    esAdministrador: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
    },
    contrasena: {
        type: DataTypes.STRING(255),
        allowNull: false,
        validate: {
            notEmpty: { msg: 'La contraseña es requerida' },
        },
    },
    creadoPorRrhh: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true,
    },
}, {
    tableName: 'empleados',
    timestamps: true,
    hooks: {
        beforeCreate: async (empleado) => {
            // Hashear contraseña antes de crear
            if (empleado.contrasena) {
                const salt = await bcrypt.genSalt(10);
                empleado.contrasena = await bcrypt.hash(empleado.contrasena, salt);
            }
        },
        beforeUpdate: async (empleado) => {
            // Solo hashear si la contraseña fue modificada
            if (empleado.changed('contrasena')) {
                const salt = await bcrypt.genSalt(10);
                empleado.contrasena = await bcrypt.hash(empleado.contrasena, salt);
            }
        },
    },
});

// Método de instancia para verificar contraseña
Empleado.prototype.verificarContrasena = async function (contrasena) {
    return await bcrypt.compare(contrasena, this.contrasena);
};

module.exports = Empleado;
