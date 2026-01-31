const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Novedad = sequelize.define('Novedad', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
    },
    empleadoId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'empleados',
            key: 'id'
        }
    },
    tipo: {
        type: DataTypes.ENUM('LICENCIA', 'VACACIONES', 'RENUNCIA'),
        allowNull: false
    },
    fecha: {
        type: DataTypes.DATEONLY,
        allowNull: false
    },
    cantidad: {
        type: DataTypes.DECIMAL(10, 2),
        defaultValue: 1, // Días u horas
        allowNull: false
    },
    aprobado: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
    },
    observaciones: {
        type: DataTypes.STRING,
        allowNull: true
    }
}, {
    tableName: 'novedades',
    timestamps: true,
});

module.exports = Novedad;
