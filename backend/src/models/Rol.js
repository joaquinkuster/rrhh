const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Rol = sequelize.define('Rol', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
    },
    nombre: {
        type: DataTypes.STRING(100),
        allowNull: false,
        unique: {
            msg: 'Ya existe un rol con este nombre',
        },
        validate: {
            notEmpty: { msg: 'El nombre del rol es requerido' },
            len: { args: [1, 100], msg: 'El nombre debe tener entre 1 y 100 caracteres' },
        },
    },
    descripcion: {
        type: DataTypes.TEXT,
        allowNull: true,
    },
    activo: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
        allowNull: false,
    },
}, {
    tableName: 'roles',
    timestamps: true,
});

module.exports = Rol;
