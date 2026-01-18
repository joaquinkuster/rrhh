const sequelize = require('../config/database');
const Empleado = require('./Empleado');
const Nacionalidad = require('./Nacionalidad');
const Empresa = require('./Empresa');

// Definir relaciones
Nacionalidad.hasMany(Empleado, {
    foreignKey: 'nacionalidadId',
    as: 'empleados',
});

Empleado.belongsTo(Nacionalidad, {
    foreignKey: 'nacionalidadId',
    as: 'nacionalidad',
});

module.exports = {
    sequelize,
    Empleado,
    Nacionalidad,
    Empresa,
};
