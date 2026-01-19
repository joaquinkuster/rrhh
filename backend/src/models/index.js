const sequelize = require('../config/database');
const Empleado = require('./Empleado');
const Nacionalidad = require('./Nacionalidad');
const Empresa = require('./Empresa');
const Area = require('./Area');
const Departamento = require('./Departamento');
const Puesto = require('./Puesto');

// Relaciones
// Empleados y Nacionalidad
Nacionalidad.hasMany(Empleado, { foreignKey: 'nacionalidadId', as: 'empleados' });
Empleado.belongsTo(Nacionalidad, { foreignKey: 'nacionalidadId', as: 'nacionalidad' });

// Empresa -> Areas
Empresa.hasMany(Area, { foreignKey: 'empresaId', as: 'areas', onDelete: 'CASCADE' });
Area.belongsTo(Empresa, { foreignKey: 'empresaId', as: 'empresa' });

// Area -> Departamentos
Area.hasMany(Departamento, { foreignKey: 'areaId', as: 'departamentos', onDelete: 'CASCADE' });
Departamento.belongsTo(Area, { foreignKey: 'areaId', as: 'area' });

// Departamento -> Puestos
Departamento.hasMany(Puesto, { foreignKey: 'departamentoId', as: 'puestos', onDelete: 'CASCADE' });
Puesto.belongsTo(Departamento, { foreignKey: 'departamentoId', as: 'departamento' });

module.exports = {
    sequelize,
    Nacionalidad,
    Empleado,
    Empresa,
    Area,
    Departamento,
    Puesto,
};
