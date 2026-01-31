const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Liquidacion = sequelize.define('Liquidacion', {
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
    periodo: {
        type: DataTypes.STRING(7), // Format: YYYY-MM
        allowNull: false,
    },
    fechaPago: {
        type: DataTypes.DATEONLY,
        allowNull: true,
    },
    totalBruto: {
        type: DataTypes.DECIMAL(10, 2),
        defaultValue: 0,
    },
    totalNeto: {
        type: DataTypes.DECIMAL(10, 2),
        defaultValue: 0,
    },
    estado: {
        type: DataTypes.ENUM('PENDIENTE', 'GENERADO', 'PAGADO'),
        defaultValue: 'PENDIENTE',
    },
    tipo: {
        type: DataTypes.ENUM('SUELDO', 'HONORARIOS', 'BECA'),
        defaultValue: 'SUELDO',
        allowNull: false
    },
    origen: {
        type: DataTypes.ENUM('AUTOMATICO', 'MANUAL'),
        defaultValue: 'MANUAL',
        allowNull: false
    },
    observaciones: {
        type: DataTypes.TEXT,
        allowNull: true
    }
}, {
    tableName: 'liquidaciones',
    timestamps: true,
});

module.exports = Liquidacion;
