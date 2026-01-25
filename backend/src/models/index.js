const sequelize = require('../config/database');
const Empleado = require('./Empleado');
const Empresa = require('./Empresa');
const Area = require('./Area');
const Departamento = require('./Departamento');
const Puesto = require('./Puesto');
const Contrato = require('./Contrato');
const ContratoPuesto = require('./ContratoPuesto');
const RegistroSalud = require('./RegistroSalud');
const Evaluacion = require('./Evaluacion');
const Contacto = require('./Contacto');


// Relaciones

// Empresa -> Areas
Empresa.hasMany(Area, { foreignKey: 'empresaId', as: 'areas', onDelete: 'CASCADE' });
Area.belongsTo(Empresa, { foreignKey: 'empresaId', as: 'empresa' });

// Area -> Departamentos
Area.hasMany(Departamento, { foreignKey: 'areaId', as: 'departamentos', onDelete: 'CASCADE' });
Departamento.belongsTo(Area, { foreignKey: 'areaId', as: 'area' });

// Departamento -> Puestos
Departamento.hasMany(Puesto, { foreignKey: 'departamentoId', as: 'puestos', onDelete: 'CASCADE' });
Puesto.belongsTo(Departamento, { foreignKey: 'departamentoId', as: 'departamento' });

// Empleado -> Contratos
Empleado.hasMany(Contrato, { foreignKey: 'empleadoId', as: 'contratos', onDelete: 'CASCADE' });
Contrato.belongsTo(Empleado, { foreignKey: 'empleadoId', as: 'empleado' });

// Contrato <-> Puesto (Many-to-Many via ContratoPuesto)
Contrato.belongsToMany(Puesto, {
    through: ContratoPuesto,
    foreignKey: 'contratoId',
    otherKey: 'puestoId',
    as: 'puestos'
});
Puesto.belongsToMany(Contrato, {
    through: ContratoPuesto,
    foreignKey: 'puestoId',
    otherKey: 'contratoId',
    as: 'contratos'
});

// ContratoPuesto associations for direct access
ContratoPuesto.belongsTo(Contrato, { foreignKey: 'contratoId', as: 'contrato' });
ContratoPuesto.belongsTo(Puesto, { foreignKey: 'puestoId', as: 'puesto' });
Contrato.hasMany(ContratoPuesto, { foreignKey: 'contratoId', as: 'contratoPuestos' });
Puesto.hasMany(ContratoPuesto, { foreignKey: 'puestoId', as: 'contratoPuestos' });

// RegistroSalud -> Empleado
RegistroSalud.belongsTo(Empleado, { foreignKey: 'empleadoId', as: 'empleado' });
Empleado.hasMany(RegistroSalud, { foreignKey: 'empleadoId', as: 'registrosSalud' });

// Evaluacion -> Contrato (contratoEvaluado)
Evaluacion.belongsTo(Contrato, { foreignKey: 'contratoEvaluadoId', as: 'contratoEvaluado' });
Contrato.hasMany(Evaluacion, { foreignKey: 'contratoEvaluadoId', as: 'evaluacionesRecibidas' });

// Evaluacion <-> Contrato (evaluadores M:N)
Evaluacion.belongsToMany(Contrato, {
    through: 'evaluacion_evaluadores',
    foreignKey: 'evaluacionId',
    otherKey: 'evaluadorId',
    as: 'evaluadores'
});
Contrato.belongsToMany(Evaluacion, {
    through: 'evaluacion_evaluadores',
    foreignKey: 'evaluadorId',
    otherKey: 'evaluacionId',
    as: 'evaluacionesRealizadas'
});

// Contacto -> Empleado
Contacto.belongsTo(Empleado, { foreignKey: 'empleadoId', as: 'empleado' });
Empleado.hasMany(Contacto, { foreignKey: 'empleadoId', as: 'contactos', onDelete: 'CASCADE' });

module.exports = {
    sequelize,
    Empleado,
    Empresa,
    Area,
    Departamento,
    Puesto,
    Contrato,
    ContratoPuesto,
    RegistroSalud,
    Evaluacion,
    Contacto,
};
