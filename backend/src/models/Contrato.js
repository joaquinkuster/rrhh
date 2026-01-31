const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

// Tipos de contrato por categoría
const TIPOS_CONTRATO = [
    // Relación de Dependencia (Ley 20.744 – LCT)
    'tiempo_indeterminado',
    'periodo_prueba',
    'plazo_fijo',
    'eventual',
    'teletrabajo',
    // No Laborales / Extracontractuales
    'locacion_servicios',
    'monotributista',
    'responsable_inscripto',
    'honorarios',
    'contrato_obra',
    // Formativos (Educativos)
    'pasantia_educativa',
    'beca',
    'ad_honorem',
];

const Contrato = sequelize.define('Contrato', {
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
            key: 'id',
        },
        validate: {
            notEmpty: { msg: 'El empleado es requerido' },
        },
    },
    tipoContrato: {
        type: DataTypes.ENUM(...TIPOS_CONTRATO),
        allowNull: false,
        validate: {
            notEmpty: { msg: 'El tipo de contrato es requerido' },
            isIn: {
                args: [TIPOS_CONTRATO],
                msg: 'Tipo de contrato inválido',
            },
        },
    },
    fechaInicio: {
        type: DataTypes.DATEONLY,
        allowNull: false,
        validate: {
            notEmpty: { msg: 'La fecha de inicio es requerida' },
            isDate: { msg: 'Debe ser una fecha válida' },
            isNotPast(value) {
                const today = new Date();
                today.setHours(0, 0, 0, 0);
                const [year, month, day] = value.split('-');
                const startDate = new Date(year, month - 1, day); // fecha local
                if (startDate < today) {
                    throw new Error('La fecha de inicio no puede ser anterior a hoy');
                }
            },
        },
    },
    fechaFin: {
        type: DataTypes.DATEONLY,
        allowNull: true,
        validate: {
            isDate: { msg: 'Debe ser una fecha válida' },
        },
    },
    horario: {
        type: DataTypes.STRING(100),
        allowNull: false,
        validate: {
            notEmpty: { msg: 'El horario es requerido' },
            len: { args: [5, 100], msg: 'El horario debe tener entre 5 y 100 caracteres' },
        },
    },
    salario: {
        type: DataTypes.DECIMAL(12, 2),
        allowNull: false,
        validate: {
            notEmpty: { msg: 'El salario es requerido' },
            isDecimal: { msg: 'Debe ser un número válido' },
            min: {
                args: [0],
                msg: 'El salario no puede ser negativo',
            },
            max: {
                args: [999999999.99],
                msg: 'El salario no puede exceder 999,999,999.99',
            },
        },
    },
    compensacion: {
        type: DataTypes.STRING(500),
        allowNull: true,
        validate: {
            len: { args: [0, 500], msg: 'La compensación no puede exceder 500 caracteres' },
        },
    },
    activo: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true,
    },
}, {
    tableName: 'contratos',
    timestamps: true,
});

// Hook para validar que fechaFin no sea anterior a fechaInicio
Contrato.addHook('beforeValidate', (contrato) => {
    if (contrato.fechaFin && contrato.fechaInicio) {
        if (new Date(contrato.fechaFin) < new Date(contrato.fechaInicio)) {
            throw new Error('La fecha de fin no puede ser anterior a la fecha de inicio');
        }
    }
});

// Helper methods
Contrato.prototype.esRelacionDependencia = function () {
    return [
        'tiempo_indeterminado',
        'periodo_prueba',
        'plazo_fijo',
        'eventual',
        'teletrabajo'
    ].includes(this.tipoContrato);
};

Contrato.prototype.esNoLaboral = function () {
    return [
        'locacion_servicios',
        'monotributista',
        'responsable_inscripto',
        'honorarios',
        'contrato_obra'
    ].includes(this.tipoContrato);
};

module.exports = Contrato;

