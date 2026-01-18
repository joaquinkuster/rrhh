const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Empleado = sequelize.define('Empleado', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
    },
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
        validate: {
            notEmpty: { msg: 'El número de documento es requerido' },
        },
    },
    cuil: {
        type: DataTypes.STRING(13),
        allowNull: true,
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
            isBefore: {
                args: new Date().toISOString().split('T')[0],
                msg: 'La fecha de nacimiento debe ser anterior a hoy',
            },
        },
    },
    nacionalidadId: {
        type: DataTypes.INTEGER,
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
    activo: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true,
    },
}, {
    tableName: 'empleados',
    timestamps: true,
});

module.exports = Empleado;
