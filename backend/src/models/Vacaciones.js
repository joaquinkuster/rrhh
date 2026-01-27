const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

// Estados de vacaciones
const ESTADOS_VACACIONES = [
    'pendiente',
    'aprobada',
    'rechazada',
];

const Vacaciones = sequelize.define('Vacaciones', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
    },
    solicitudId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        unique: true,
        references: {
            model: 'solicitudes',
            key: 'id',
        },
    },
    periodo: {
        type: DataTypes.INTEGER,
        allowNull: false,
        validate: {
            notEmpty: { msg: 'El período es requerido' },
            isInt: { msg: 'El período debe ser un año válido' },
        },
    },
    diasCorrespondientes: {
        type: DataTypes.INTEGER,
        allowNull: false,
        validate: {
            min: { args: [1], msg: 'Los días correspondientes deben ser mayor a 0' },
        },
    },
    diasTomados: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
        validate: {
            min: { args: [0], msg: 'Los días tomados no pueden ser negativos' },
        },
    },
    diasDisponibles: {
        type: DataTypes.INTEGER,
        allowNull: false,
        validate: {
            min: { args: [0], msg: 'Los días disponibles no pueden ser negativos' },
        },
    },
    fechaInicio: {
        type: DataTypes.DATEONLY,
        allowNull: false,
        validate: {
            notEmpty: { msg: 'La fecha de inicio es requerida' },
            isDate: { msg: 'Debe ser una fecha válida' },
        },
    },
    fechaFin: {
        type: DataTypes.DATEONLY,
        allowNull: false,
        validate: {
            notEmpty: { msg: 'La fecha de fin es requerida' },
            isDate: { msg: 'Debe ser una fecha válida' },
        },
    },
    fechaRegreso: {
        type: DataTypes.DATEONLY,
        allowNull: false,
        validate: {
            notEmpty: { msg: 'La fecha de regreso es requerida' },
            isDate: { msg: 'Debe ser una fecha válida' },
        },
    },
    notificadoEl: {
        type: DataTypes.DATEONLY,
        allowNull: true,
        validate: {
            isDate: { msg: 'Debe ser una fecha válida' },
        },
    },
    diasSolicitud: {
        type: DataTypes.INTEGER,
        allowNull: false,
        validate: {
            min: { args: [1], msg: 'Los días solicitados deben ser mayor a 0' },
        },
    },
    descripcion: {
        type: DataTypes.STRING(500),
        allowNull: true,
        validate: {
            len: { args: [0, 500], msg: 'La descripción no puede exceder 500 caracteres' },
        },
    },
    documentos: {
        type: DataTypes.JSON,
        allowNull: true,
        defaultValue: [],
        get() {
            const rawValue = this.getDataValue('documentos');
            if (!rawValue) return [];
            if (typeof rawValue === 'string') {
                try {
                    return JSON.parse(rawValue);
                } catch {
                    return [];
                }
            }
            return rawValue;
        },
    },
    estado: {
        type: DataTypes.ENUM(...ESTADOS_VACACIONES),
        allowNull: false,
        defaultValue: 'pendiente',
        validate: {
            isIn: {
                args: [ESTADOS_VACACIONES],
                msg: 'Estado inválido',
            },
        },
    },
}, {
    tableName: 'vacaciones',
    timestamps: true,
});

// Hook para validar fechas
Vacaciones.addHook('beforeValidate', (vacaciones) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (vacaciones.fechaInicio) {
        const fechaInicio = new Date(vacaciones.fechaInicio);
        fechaInicio.setHours(0, 0, 0, 0);
        // La fecha de hoy es válida, solo rechazamos fechas estrictamente pasadas
        if (fechaInicio < today) {
            throw new Error('La fecha de inicio no puede ser anterior a hoy');
        }
    }

    if (vacaciones.fechaFin && vacaciones.fechaInicio) {
        const inicio = new Date(vacaciones.fechaInicio);
        const fin = new Date(vacaciones.fechaFin);

        if (fin <= inicio) {
            throw new Error('La fecha de fin debe ser posterior a la fecha de inicio');
        }

        // Calcular días solicitados (incluyendo inicio y fin)
        const diffTime = Math.abs(fin - inicio);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
        vacaciones.diasSolicitud = diffDays;
    }

    // Validar que días solicitados no superen días disponibles
    if (vacaciones.diasSolicitud && vacaciones.diasDisponibles) {
        if (vacaciones.diasSolicitud > vacaciones.diasDisponibles) {
            throw new Error('Los días solicitados no pueden superar los días disponibles');
        }
    }

    // Validar notificadoEl no sea futura
    if (vacaciones.notificadoEl) {
        const notificado = new Date(vacaciones.notificadoEl);
        if (notificado > today) {
            throw new Error('La fecha de notificación no puede ser futura');
        }
    }
});

module.exports = Vacaciones;
