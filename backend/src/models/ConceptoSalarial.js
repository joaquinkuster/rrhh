const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const ConceptoSalarial = sequelize.define('ConceptoSalarial', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
    },
    nombre: {
        type: DataTypes.STRING(100),
        allowNull: false,
    },
    tipo: {
        type: DataTypes.ENUM('remunerativo', 'no_remunerativo', 'deduccion'),
        allowNull: false,
    },
    esPorcentaje: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
    },
    valor: {
        type: DataTypes.DECIMAL(10, 2), // Puede ser un monto fijo o un porcentaje
        allowNull: false,
    },
    formula: {
        type: DataTypes.STRING(255), // Para casos complejos como antigüedad
        allowNull: true,
    },
    activo: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
    }
}, {
    tableName: 'conceptos_salariales',
    timestamps: true,
});

module.exports = ConceptoSalarial;
