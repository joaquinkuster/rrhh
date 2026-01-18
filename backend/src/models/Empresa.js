const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Empresa = sequelize.define('Empresa', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
    },
    nombre: {
        type: DataTypes.STRING(200),
        allowNull: false,
        validate: {
            notEmpty: { msg: 'El nombre es requerido' },
            len: { args: [2, 200], msg: 'El nombre debe tener entre 2 y 200 caracteres' },
        },
    },
}, {
    tableName: 'empresas',
    timestamps: true,
});

module.exports = Empresa;
