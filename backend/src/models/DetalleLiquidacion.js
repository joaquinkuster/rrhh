const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const DetalleLiquidacion = sequelize.define('DetalleLiquidacion', {
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
    conceptoNombre: {
        type: DataTypes.STRING(100),
        allowNull: false,
    },
    tipo: {
        type: DataTypes.ENUM('remunerativo', 'no_remunerativo', 'deduccion'),
        allowNull: false,
    },
    monto: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
    },
    cantidad: {
        type: DataTypes.DECIMAL(10, 2), // Horas, días, unidades
        defaultValue: 1,
    }
}, {
    tableName: 'detalles_liquidacion',
    timestamps: true,
});

module.exports = DetalleLiquidacion;
