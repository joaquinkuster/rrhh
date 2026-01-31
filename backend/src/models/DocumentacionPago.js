const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const DocumentacionPago = sequelize.define('DocumentacionPago', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
    },
    liquidacionId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'liquidaciones',
            key: 'id'
        }
    },
    tipo: {
        type: DataTypes.ENUM('FACTURA', 'RECIBO'),
        allowNull: false
    },
    numero: {
        type: DataTypes.STRING,
        allowNull: false
    },
    archivoUrl: {
        type: DataTypes.STRING,
        allowNull: true
    },
    estado: {
        type: DataTypes.ENUM('PENDIENTE', 'VERIFICADO', 'RECHAZADO'),
        defaultValue: 'PENDIENTE'
    }
}, {
    tableName: 'documentacion_pagos',
    timestamps: true,
});

module.exports = DocumentacionPago;
