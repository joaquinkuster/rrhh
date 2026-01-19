const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Puesto = sequelize.define('Puesto', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
    },
    nombre: {
        type: DataTypes.STRING(100),
        allowNull: false,
        validate: {
            notEmpty: { msg: 'El nombre del puesto es requerido' },
        },
    },
    descripcion: {
        type: DataTypes.STRING(500),
        allowNull: true,
    },
    departamentoId: {
        type: DataTypes.INTEGER,
        allowNull: false,
    },
}, {
    tableName: 'puestos',
    timestamps: true,
});

module.exports = Puesto;
