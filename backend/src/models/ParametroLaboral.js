const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const ParametroLaboral = sequelize.define('ParametroLaboral', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
    },
    limiteAusenciaInjustificada: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 1,
        validate: {
            isInt: { msg: 'El límite de ausencia debe ser un número entero' },
            min: { args: [0], msg: 'El límite de ausencia no puede ser negativo' },
            max: { args: [10], msg: 'El límite de ausencia no puede superar 10' },
        },
    },
}, {
    tableName: 'parametros_laborales',
    timestamps: true,
});

module.exports = ParametroLaboral;
