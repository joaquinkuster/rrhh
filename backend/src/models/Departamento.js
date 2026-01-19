const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Departamento = sequelize.define('Departamento', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
    },
    nombre: {
        type: DataTypes.STRING(100),
        allowNull: false,
        validate: {
            notEmpty: { msg: 'El nombre del departamento es requerido' },
        },
    },
    descripcion: {
        type: DataTypes.STRING(500),
        allowNull: true,
    },
    areaId: {
        type: DataTypes.INTEGER,
        allowNull: false,
    },
}, {
    tableName: 'departamentos',
    timestamps: true,
});

module.exports = Departamento;
