const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Area = sequelize.define('Area', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
    },
    nombre: {
        type: DataTypes.STRING(100),
        allowNull: false,
        validate: {
            notEmpty: { msg: 'El nombre del área es requerido' },
        },
    },
    descripcion: {
        type: DataTypes.STRING(500),
        allowNull: true,
    },
    empresaId: {
        type: DataTypes.INTEGER,
        allowNull: false,
    },
}, {
    tableName: 'areas',
    timestamps: true,
});

module.exports = Area;
