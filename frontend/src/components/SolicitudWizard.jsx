import { useState, useEffect } from 'react';
import Select from 'react-select';
import StepTracker from './StepTracker';
import { getContratos, getRegistrosSalud, createSolicitud, updateSolicitud, getDiasDisponiblesVacaciones, getDiasSolicitadosVacaciones } from '../services/api';
import { validarDiaHabil } from '../utils/diasHabiles';

// Constants
const TIPOS_SOLICITUD = [
    { value: 'vacaciones', label: 'Vacaciones' },
    { value: 'licencia', label: 'Licencia / Inasistencia' },
    { value: 'horas_extras', label: 'Horas Extras' },
    { value: 'renuncia', label: 'Renuncia' },
];

const MOTIVOS_LEGALES = [
    { value: 'matrimonio', label: 'Matrimonio (LCT Art. 168)' },
    { value: 'nacimiento_hijo', label: 'Nacimiento de hijo (Paternidad)' },
    { value: 'fallecimiento_conyugue_hijo_padres', label: 'Fallecimiento de cónyuge, hijo o padres' },
    { value: 'fallecimiento_hermano', label: 'Fallecimiento de hermano' },
    { value: 'examen_estudio', label: 'Examen / Estudio' },
    { value: 'accidente_trabajo_art', label: 'Accidente de trabajo / Enfermedad profesional (ART)' },
    { value: 'enfermedad_inculpable', label: 'Enfermedad inculpable' },
    { value: 'maternidad', label: 'Maternidad' },
    { value: 'excedencia', label: 'Estado de excedencia' },
    { value: 'donacion_sangre', label: 'Donación de sangre' },
    { value: 'citacion_judicial', label: 'Citación judicial' },
    { value: 'presidente_mesa', label: 'Presidente de mesa (electoral)' },
    { value: 'mudanza', label: 'Mudanza' },
    { value: 'cumpleanos', label: 'Día de cumpleaños' },
    { value: 'tramites_personales', label: 'Trámites personales' },
    { value: 'compensatorio_franco', label: 'Compensatorio / Franco' },
];

// Motivos que requieren registro de salud
const MOTIVOS_SALUD = ['accidente_trabajo_art', 'enfermedad_inculpable'];

const ESTADOS_LICENCIA = [
    { value: 'pendiente', label: 'Pendiente' },
    { value: 'justificada', label: 'Justificada' },
    { value: 'injustificada', label: 'Injustificada' },
    { value: 'rechazada', label: 'Rechazada' },
];

const ESTADOS_VACACIONES = [
    { value: 'pendiente', label: 'Pendiente' },
    { value: 'aprobada', label: 'Aprobada' },
    { value: 'rechazada', label: 'Rechazada' },
];

const ESTADOS_HORAS_EXTRAS = [
    { value: 'pendiente', label: 'Pendiente' },
    { value: 'aprobada', label: 'Aprobada' },
    { value: 'rechazada', label: 'Rechazada' },
];

const ESTADOS_RENUNCIA = [
    { value: 'pendiente', label: 'Pendiente' },
    { value: 'aceptada', label: 'Aceptada' },
    { value: 'procesada', label: 'Procesada' },
];

const TIPOS_HORAS_EXTRA = [
    { value: '50', label: '50% (días hábiles)' },
    { value: '100', label: '100% (fines de semana / feriados)' },
];

const TOOLTIP_VACACIONES = `Según la **Ley de Contrato de Trabajo de Argentina (LCT)**, los días de vacaciones se determinan por la antigüedad del trabajador:

• Hasta 5 años de antigüedad: **14 días corridos**
• Más de 5 y hasta 10 años: **21 días corridos**
• Más de 10 y hasta 20 años: **28 días corridos**
• Más de 20 años: **35 días corridos**

Si el trabajador no hubiere prestado servicios durante la mitad de los días hábiles del año calendario, tendrá derecho a **1 día de vacaciones por cada 20 días de trabajo efectivo**. 

Los días se calculan como días hábiles (excluyendo fines de semana y feriados nacionales).`;

const TOOLTIP_RENUNCIA = `Según la Ley de Contrato de Trabajo de Argentina (LCT), el **preaviso** es obligatorio y debe ser de 15 días, con el fin de que la empresa busque reemplazo.`;

const FieldError = ({ message }) => {
    if (!message) return null;
    return <span style={{ color: '#ef4444', fontSize: '0.75rem', marginTop: '0.25rem', display: 'block' }}>{message}</span>;
};

const getSelectStyles = (isDark) => ({
    control: (base, state) => ({
        ...base,
        backgroundColor: isDark ? '#1e293b' : 'white',
        borderColor: state.isFocused ? '#0d9488' : (isDark ? '#334155' : '#e2e8f0'),
        boxShadow: state.isFocused ? '0 0 0 2px rgba(13, 148, 136, 0.2)' : 'none',
        '&:hover': { borderColor: '#0d9488' },
        minHeight: '42px',
        borderRadius: '0.5rem',
    }),
    menu: (base) => ({
        ...base,
        backgroundColor: isDark ? '#1e293b' : 'white',
        border: `1px solid ${isDark ? '#334155' : '#e2e8f0'}`,
        borderRadius: '0.5rem',
        boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
        zIndex: 1000,
    }),
    option: (base, state) => ({
        ...base,
        backgroundColor: state.isSelected ? '#0d9488' : state.isFocused ? (isDark ? '#334155' : '#f1f5f9') : 'transparent',
        color: state.isSelected ? 'white' : (isDark ? '#e2e8f0' : '#1e293b'),
        cursor: 'pointer',
    }),
    input: (base) => ({ ...base, color: isDark ? '#e2e8f0' : '#1e293b' }),
    singleValue: (base) => ({ ...base, color: isDark ? '#e2e8f0' : '#1e293b' }),
    placeholder: (base) => ({ ...base, color: '#94a3b8' }),
});

// Calculate hours between two times
const calcularHoras = (horaInicio, horaFin) => {
    if (!horaInicio || !horaFin) return '';
    const [h1, m1] = horaInicio.split(':').map(Number);
    const [h2, m2] = horaFin.split(':').map(Number);
    const mins1 = h1 * 60 + m1;
    const mins2 = h2 * 60 + m2;
    const diff = mins2 - mins1;
    if (diff <= 0) return '';
    const hours = Math.floor(diff / 60);
    const mins = diff % 60;
    return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
};

// Get today's date in YYYY-MM-DD format (local time)
const getTodayStr = () => {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};

const SolicitudWizard = ({ solicitud, onClose, onSuccess }) => {
    const isEditing = !!solicitud;
    const [currentStep, setCurrentStep] = useState(isEditing ? 2 : 1);
    const [contratos, setContratos] = useState([]);
    const [loadingContratos, setLoadingContratos] = useState(true);
    const [isDark, setIsDark] = useState(() => document.documentElement.classList.contains('dark'));

    const [selectedContrato, setSelectedContrato] = useState(null);
    const [selectedTipo, setSelectedTipo] = useState('');

    const [formData, setFormData] = useState({});
    const [touched, setTouched] = useState({});
    const [fieldErrors, setFieldErrors] = useState({});
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [showTooltipVacaciones, setShowTooltipVacaciones] = useState(false);
    const [showTooltipRenuncia, setShowTooltipRenuncia] = useState(false);

    // Registros de salud para licencias ART/enfermedad
    const [registrosSalud, setRegistrosSalud] = useState([]);
    const [loadingRegistros, setLoadingRegistros] = useState(false);

    const steps = [
        { number: 1, title: 'Tipo de Solicitud' },
        { number: 2, title: 'Datos de la Solicitud' },
    ];

    useEffect(() => {
        const observer = new MutationObserver(() => {
            setIsDark(document.documentElement.classList.contains('dark'));
        });
        observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
        return () => observer.disconnect();
    }, []);

    useEffect(() => {
        const loadData = async () => {
            try {
                setLoadingContratos(true);
                const result = await getContratos({ activo: 'true', estado: 'en_curso', limit: 1000 });
                setContratos(result.data);
            } catch (err) {
                console.error('Error loading contratos:', err);
            } finally {
                setLoadingContratos(false);
            }
        };
        loadData();
    }, []);

    useEffect(() => {
        if (solicitud) {
            const contratoOpt = formatContratoOption(solicitud.contrato);
            setSelectedContrato(contratoOpt);
            setSelectedTipo(solicitud.tipoSolicitud);

            const typeData = solicitud.licencia || solicitud.vacaciones || solicitud.horasExtras || solicitud.renuncia || {};
            setFormData({ ...typeData });
        }
    }, [solicitud]);

    // Load vacation info when contrato or periodo changes and type is vacaciones
    useEffect(() => {
        const loadVacacionesDisponiblesInfo = async () => {
            if (selectedContrato && selectedTipo === 'vacaciones') {
                const periodo = formData.periodo || new Date().getFullYear();
                try {
                    const info = await getDiasDisponiblesVacaciones(selectedContrato.value, periodo);
                    setFormData(prev => ({
                        ...prev,
                        diasCorrespondientes: info.diasCorrespondientes || 0,
                        diasTomados: info.diasTomados || 0,
                        diasDisponibles: info.diasDisponibles || 0,
                        periodo: periodo,
                    }));
                } catch (err) {
                    console.error('Error loading vacation info:', err);
                }
            }
        };
        loadVacacionesDisponiblesInfo();
    }, [selectedContrato, selectedTipo, formData.periodo]);

    // Calculate vacation return date and days when dates change
    useEffect(() => {
        const loadVacacionesSolicitadosInfo = async () => {
            if (selectedTipo === 'vacaciones' && formData.fechaInicio && formData.fechaFin) {
                const fechaInicio = formData.fechaInicio;
                const fechaFin = formData.fechaFin;

                try {
                    const info = await getDiasSolicitadosVacaciones(fechaInicio, fechaFin);
                    setFormData(prev => ({
                        ...prev,
                        fechaRegreso: info.fechaRegreso,
                        diasSolicitud: info.diasSolicitud || 0,
                    }));
                } catch (err) {
                    console.error('Error loading vacation info:', err);
                }
            }
        };
        loadVacacionesSolicitadosInfo();
    }, [formData.fechaInicio, formData.fechaFin, selectedTipo]);

    // Calculate overtime hours when times change
    useEffect(() => {
        if (selectedTipo === 'horas_extras' && formData.horaInicio && formData.horaFin) {
            const cantidadHoras = calcularHoras(formData.horaInicio, formData.horaFin);
            setFormData(prev => ({
                ...prev,
                cantidadHoras,
            }));
        }
    }, [formData.horaInicio, formData.horaFin, selectedTipo]);

    // Calculate license days when dates change
    useEffect(() => {
        if (selectedTipo === 'licencia' && formData.fechaInicio && formData.fechaFin) {
            const inicio = new Date(formData.fechaInicio);
            const fin = new Date(formData.fechaFin);
            if (fin >= inicio) {
                const diffTime = Math.abs(fin - inicio);
                const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
                setFormData(prev => ({
                    ...prev,
                    diasSolicitados: diffDays,
                }));
            }
        }
    }, [formData.fechaInicio, formData.fechaFin, selectedTipo]);

    // Load registros de salud when motivo requires it
    useEffect(() => {
        const loadRegistros = async () => {
            // selectedContrato.contrato.empleado.id es la estructura correcta
            const empleadoId = selectedContrato?.contrato?.empleado?.id;
            if (selectedTipo === 'licencia' && MOTIVOS_SALUD.includes(formData.motivoLegal) && empleadoId) {
                try {
                    setLoadingRegistros(true);
                    // Solo filtrar por empleadoId y activo, sin vigente para mostrar todos los disponibles
                    const result = await getRegistrosSalud({ empleadoId, activo: 'true', limit: 100 });
                    setRegistrosSalud(result.data || []);
                } catch (err) {
                    console.error('Error loading registros:', err);
                    setRegistrosSalud([]);
                } finally {
                    setLoadingRegistros(false);
                }
            } else {
                setRegistrosSalud([]);
            }
        };
        loadRegistros();
    }, [formData.motivoLegal, selectedTipo, selectedContrato]);

    const formatContratoOption = (contrato) => {
        if (!contrato) return null;
        const nombre = contrato.empleado ? `${contrato.empleado.apellido}, ${contrato.empleado.nombre}` : 'Sin nombre';
        const puesto = contrato.puestos?.[0]?.nombre || 'Sin puesto';
        const empresa = contrato.puestos?.[0]?.departamento?.area?.empresa?.nombre;
        return {
            value: contrato.id,
            label: `${nombre} - ${puesto}${empresa ? ` (${empresa})` : ''}`,
            contrato,
        };
    };

    const contratoOptions = contratos.map(formatContratoOption);

    const handleChange = (field, value) => { // ✅ Síncrono ahora
        setFormData(prev => ({ ...prev, [field]: value }));
        setError('');

        // Validar día hábil en tiempo real SÍNCRONO
        const camposFecha = ['fechaInicio', 'fechaFin', 'fecha', 'fechaNotificacion', 'fechaBajaEfectiva', 'notificadoEl'];
        if (camposFecha.includes(field) && value) {
            try {
                const nombresCampos = {
                    fechaInicio: 'La fecha de inicio',
                    fechaFin: 'La fecha de fin',
                    fecha: 'La fecha',
                    fechaNotificacion: 'La fecha de notificación',
                    fechaBajaEfectiva: 'La fecha de baja',
                    notificadoEl: 'La fecha de notificación'
                };
                validarDiaHabil(value, nombresCampos[field]); // ✅ Síncrono
                setFieldErrors(prev => ({ ...prev, [field]: null }));
            } catch (error) {
                setFieldErrors(prev => ({ ...prev, [field]: error.message }));
                setTouched(prev => ({ ...prev, [field]: true })); // Marcar como touched para mostrar error
            }
        }

        if (touched[field]) {
            validateStep2();
        }
    };

    const handleBlur = (field) => {
        setTouched(prev => ({ ...prev, [field]: true }));
        validateStep2();
    };

    const isReadOnly = () => {
        if (!isEditing) return false;
        const typeData = solicitud.licencia || solicitud.vacaciones || solicitud.horasExtras || solicitud.renuncia;
        return typeData?.estado !== 'pendiente';
    };

    const validateStep1 = () => {
        const errors = {};
        if (!selectedContrato) errors.contrato = 'Debe seleccionar un contrato';
        if (!selectedTipo) errors.tipoSolicitud = 'Debe seleccionar un tipo de solicitud';

        setFieldErrors(prev => ({ ...prev, ...errors })); // Preservar errores existentes
        if (Object.keys(errors).length > 0) {
            setTouched({ contrato: true, tipoSolicitud: true });
            setError('Por favor complete todos los campos obligatorios');
            return false;
        }
        return true;
    };

    const validateStep2 = () => {
        const errors = {};
        const today = getTodayStr();

        if (selectedTipo === 'licencia') {
            if (!formData.motivoLegal) errors.motivoLegal = 'El motivo legal es requerido';
            if (!formData.fechaInicio) errors.fechaInicio = 'La fecha de inicio es requerida';
            if (!formData.fechaFin) errors.fechaFin = 'La fecha de fin es requerida';
            if (formData.fechaFin && formData.fechaInicio && formData.fechaFin < formData.fechaInicio) {
                errors.fechaFin = 'La fecha de fin no puede ser anterior a la de inicio';
            }
        } else if (selectedTipo === 'vacaciones') {
            if (!formData.periodo) errors.periodo = 'El período es requerido';
            if (!formData.fechaInicio) errors.fechaInicio = 'La fecha de inicio es requerida';
            if (!formData.fechaFin) errors.fechaFin = 'La fecha de fin es requerida';
            // Today IS valid - only reject strictly past dates
            if (formData.fechaInicio && formData.fechaInicio < today && !isEditing) {
                errors.fechaInicio = 'La fecha de inicio no puede ser anterior a hoy';
            }
            if (formData.fechaFin && formData.fechaInicio && formData.fechaFin < formData.fechaInicio) {
                errors.fechaFin = 'La fecha de fin no puede ser anterior a la de inicio';
            }
            if (formData.diasSolicitud && formData.diasDisponibles && formData.diasSolicitud > formData.diasDisponibles) {
                errors.fechaFin = `Los días solicitados (${formData.diasSolicitud}) exceden los disponibles (${formData.diasDisponibles})`;
            }
        } else if (selectedTipo === 'horas_extras') {
            if (!formData.fecha) errors.fecha = 'La fecha es requerida';
            if (formData.fecha && formData.fecha > today) {
                errors.fecha = 'La fecha no puede ser posterior a hoy';
            }
            if (!formData.horaInicio) errors.horaInicio = 'La hora de inicio es requerida';
            if (!formData.horaFin) errors.horaFin = 'La hora de fin es requerida';
            if (formData.horaInicio && formData.horaFin && formData.horaFin <= formData.horaInicio) {
                errors.horaFin = 'La hora de fin debe ser posterior a la de inicio';
            }
            if (!formData.tipoHorasExtra) errors.tipoHorasExtra = 'El tipo es requerido';
        } else if (selectedTipo === 'renuncia') {
            // Usar valor de formData o valor por defecto (hoy)
            const fechaNot = formData.fechaNotificacion || getTodayStr();
            if (!fechaNot) errors.fechaNotificacion = 'La fecha de notificación es requerida';
        }

        // Preservar solo los errores de días hábiles de campos que NO están siendo validados ahora
        const allErrors = setFieldErrors(prev => {
            const camposFecha = ['fechaInicio', 'fechaFin', 'fecha', 'fechaNotificacion', 'fechaBajaEfectiva', 'notificadoEl'];
            const erroresDiasHabiles = {};

            // Preservar solo errores de días hábiles en campos de fecha
            camposFecha.forEach(campo => {
                if (prev[campo] && prev[campo].includes('día hábil')) {
                    erroresDiasHabiles[campo] = prev[campo];
                }
            });

            // Combinar: errores de la validación actual + errores de días hábiles preservados
            const combined = { ...erroresDiasHabiles, ...errors };
            return combined;
        });

        // Retornar false si hay CUALQUIER error (validación básica O días hábiles)
        return Object.keys(errors).length === 0 && !Object.values(fieldErrors).some(err => err !== null);
    };

    const nextStep = () => {
        if (validateStep1()) {
            setCurrentStep(2);
            setError('');
            setTouched({});
            setFieldErrors({});
        }
    };

    const prevStep = () => setCurrentStep(1);

    const handleSubmit = async () => {
        // Mark all Step 2 fields as touched
        const step2Fields = selectedTipo === 'licencia'
            ? ['motivoLegal', 'fechaInicio', 'fechaFin']
            : selectedTipo === 'vacaciones'
                ? ['periodo', 'fechaInicio', 'fechaFin']
                : selectedTipo === 'horas_extras'
                    ? ['fecha', 'horaInicio', 'horaFin', 'tipoHorasExtra']
                    : ['fechaNotificacion'];

        setTouched(step2Fields.reduce((acc, f) => ({ ...acc, [f]: true }), {}));

        if (!validateStep2()) {
            setError('Por favor complete todos los campos obligatorios');
            return;
        }

        try {
            setLoading(true);
            const payload = {
                contratoId: selectedContrato.value,
                tipoSolicitud: selectedTipo,
                ...formData,
            };

            // Asegurar que fechaNotificacion tenga valor por defecto para renuncia
            if (selectedTipo === 'renuncia' && !payload.fechaNotificacion) {
                payload.fechaNotificacion = getTodayStr();
            }

            if (isEditing) {
                await updateSolicitud(solicitud.id, payload);
            } else {
                await createSolicitud(payload);
            }
            onSuccess();
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const renderStep1 = () => (
        <div style={{ display: 'grid', gap: '1.5rem' }}>
            <div className="form-group">
                <label className="form-label">Contrato *</label>
                <Select
                    isLoading={loadingContratos}
                    options={contratoOptions}
                    value={selectedContrato}
                    onChange={setSelectedContrato}
                    onBlur={() => setTouched(prev => ({ ...prev, contrato: true }))}
                    placeholder="Buscar contrato por empleado..."
                    noOptionsMessage={() => "No se encontraron contratos"}
                    styles={getSelectStyles(isDark)}
                    isDisabled={isEditing}
                />
                <FieldError message={touched.contrato && fieldErrors.contrato} />
            </div>

            <div className="form-group">
                <label className="form-label">Tipo de Solicitud *</label>
                <select
                    className={`form-input ${touched.tipoSolicitud && fieldErrors.tipoSolicitud ? 'input-error' : ''}`}
                    value={selectedTipo}
                    onChange={e => setSelectedTipo(e.target.value)}
                    onBlur={() => setTouched(prev => ({ ...prev, tipoSolicitud: true }))}
                    disabled={isEditing}
                >
                    <option value="">Seleccionar tipo de solicitud</option>
                    {TIPOS_SOLICITUD.map(tipo => (
                        <option key={tipo.value} value={tipo.value}>{tipo.label}</option>
                    ))}
                </select>
                <FieldError message={touched.tipoSolicitud && fieldErrors.tipoSolicitud} />
            </div>
        </div>
    );

    const renderLicenciaForm = () => {
        const requiresSalud = MOTIVOS_SALUD.includes(formData.motivoLegal);

        return (
            <div style={{ display: 'grid', gap: '1rem' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                    <div className="form-group">
                        <label className="form-label">Tipo *</label>
                        <select
                            className="form-input"
                            value={formData.esLicencia !== false ? 'true' : 'false'}
                            onChange={e => handleChange('esLicencia', e.target.value === 'true')}
                            disabled={isReadOnly()}
                        >
                            <option value="true">Licencia</option>
                            <option value="false">Inasistencia</option>
                        </select>
                    </div>
                    <div className="form-group">
                        <label className="form-label">Motivo Legal *</label>
                        <select
                            className={`form-input ${touched.motivoLegal && fieldErrors.motivoLegal ? 'input-error' : ''}`}
                            value={formData.motivoLegal || ''}
                            onChange={e => handleChange('motivoLegal', e.target.value)}
                            onBlur={() => handleBlur('motivoLegal')}
                            disabled={isReadOnly()}
                        >
                            <option value="">Seleccionar...</option>
                            {MOTIVOS_LEGALES.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
                        </select>
                        <FieldError message={touched.motivoLegal && fieldErrors.motivoLegal} />
                    </div>
                </div>

                {requiresSalud && (
                    <div className="form-group">
                        <label className="form-label">Registro de Salud Asociado</label>
                        <select
                            className="form-input"
                            value={formData.registroSaludId || ''}
                            onChange={e => handleChange('registroSaludId', e.target.value ? parseInt(e.target.value) : null)}
                            disabled={isReadOnly() || loadingRegistros}
                        >
                            <option value="">Seleccionar registro de salud...</option>
                            {registrosSalud.map(r => (
                                <option key={r.id} value={r.id}>
                                    {r.tipo === 'accidente' ? 'Accidente' : r.tipo === 'enfermedad_inculpable' ? 'Enfermedad' : r.tipo} - {new Date(r.fechaInicio).toLocaleDateString('es-AR')}
                                </option>
                            ))}
                        </select>
                        {loadingRegistros && <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Cargando registros...</span>}
                        {!loadingRegistros && registrosSalud.length === 0 && (
                            <span style={{ fontSize: '0.75rem', color: '#f59e0b' }}>No hay registros de salud para este empleado</span>
                        )}
                    </div>
                )}

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>
                    <div className="form-group">
                        <label className="form-label">Fecha Inicio *</label>
                        <input
                            type="date"
                            className={`form-input ${touched.fechaInicio && fieldErrors.fechaInicio ? 'input-error' : ''}`}
                            value={formData.fechaInicio || ''}
                            onChange={e => handleChange('fechaInicio', e.target.value)}
                            onBlur={() => handleBlur('fechaInicio')}
                            disabled={isReadOnly()}
                        />
                        <FieldError message={touched.fechaInicio && fieldErrors.fechaInicio} />
                    </div>
                    <div className="form-group">
                        <label className="form-label">Fecha Fin *</label>
                        <input
                            type="date"
                            className={`form-input ${touched.fechaFin && fieldErrors.fechaFin ? 'input-error' : ''}`}
                            value={formData.fechaFin || ''}
                            onChange={e => handleChange('fechaFin', e.target.value)}
                            onBlur={() => handleBlur('fechaFin')}
                            min={formData.fechaInicio || ''}
                            disabled={isReadOnly()}
                        />
                        <FieldError message={touched.fechaFin && fieldErrors.fechaFin} />
                    </div>
                    <div className="form-group">
                        <label className="form-label">Días Solicitados</label>
                        <input
                            type="number"
                            className="form-input"
                            value={formData.diasSolicitados || 0}
                            disabled
                        />
                    </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                    <div className="form-group">
                        <label className="form-label">URL Justificativo</label>
                        <input
                            type="url"
                            className="form-input"
                            value={formData.urlJustificativo || ''}
                            onChange={e => handleChange('urlJustificativo', e.target.value)}
                            placeholder="https://..."
                            maxLength={100}
                            disabled={isReadOnly()}
                        />
                    </div>
                    <div className="form-group">
                        <label className="form-label">Estado *</label>
                        <select
                            className="form-input"
                            value={formData.estado || 'pendiente'}
                            onChange={e => handleChange('estado', e.target.value)}
                        >
                            {ESTADOS_LICENCIA.map(e => <option key={e.value} value={e.value}>{e.label}</option>)}
                        </select>
                    </div>
                </div>

                <div className="form-group">
                    <label className="form-label">Descripción</label>
                    <textarea
                        className="form-input"
                        value={formData.descripcion || ''}
                        onChange={e => handleChange('descripcion', e.target.value)}
                        rows={2}
                        maxLength={500}
                        disabled={isReadOnly()}
                    />
                </div>
            </div>
        );
    };

    const renderVacacionesForm = () => {
        const currentYear = new Date().getFullYear();
        const periodos = [
            { value: currentYear, label: currentYear.toString() },
            { value: currentYear + 1, label: (currentYear + 1).toString() },
        ];

        return (
            <div style={{ display: 'grid', gap: '1rem' }}>
                {/* Row 1: Period and days info */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                    <div className="form-group">
                        <label className="form-label">Período *</label>
                        <select
                            className={`form-input ${touched.periodo && fieldErrors.periodo ? 'input-error' : ''}`}
                            value={formData.periodo || ''}
                            onChange={e => handleChange('periodo', parseInt(e.target.value))}
                            onBlur={() => handleBlur('periodo')}
                            disabled={isReadOnly()}
                        >
                            <option value="">Año...</option>
                            {periodos.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
                        </select>
                        <FieldError message={touched.periodo && fieldErrors.periodo} />
                    </div>
                    <div className="form-group">
                        <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            Días Corresp.
                            <span
                                className="tooltip-icon"
                                onClick={() => setShowTooltipVacaciones(!showTooltipVacaciones)}
                                style={{ cursor: 'pointer' }}
                            >
                                ?
                            </span>
                        </label>
                        <input type="number" className="form-input" value={formData.diasCorrespondientes || 0} disabled />
                    </div>
                </div>
                {showTooltipVacaciones && (
                    <div className="tooltip-info" style={{ whiteSpace: 'pre-line', marginTop: '0.25rem', marginBottom: '0.5rem' }}>
                        {TOOLTIP_VACACIONES.split('**').map((part, i) =>
                            i % 2 === 1 ? <strong key={i}>{part}</strong> : part
                        )}
                    </div>
                )}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                    <div className="form-group">
                        <label className="form-label">Días Tomados</label>
                        <input type="number" className="form-input" value={formData.diasTomados || 0} disabled />
                    </div>
                    <div className="form-group">
                        <label className="form-label">Días Disponibles</label>
                        <input type="number" className="form-input" value={formData.diasDisponibles || 0} disabled />
                    </div>
                </div>
                {/* Row 2: Dates */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                    <div className="form-group">
                        <label className="form-label">Fecha Inicio *</label>
                        <input
                            type="date"
                            className={`form-input ${touched.fechaInicio && fieldErrors.fechaInicio ? 'input-error' : ''}`}
                            value={formData.fechaInicio || ''}
                            onChange={e => handleChange('fechaInicio', e.target.value)}
                            onBlur={() => handleBlur('fechaInicio')}
                            disabled={isReadOnly()}
                        />
                        <FieldError message={touched.fechaInicio && fieldErrors.fechaInicio} />
                    </div>
                    <div className="form-group">
                        <label className="form-label">Fecha Fin *</label>
                        <input
                            type="date"
                            className={`form-input ${touched.fechaFin && fieldErrors.fechaFin ? 'input-error' : ''}`}
                            value={formData.fechaFin || ''}
                            onChange={e => handleChange('fechaFin', e.target.value)}
                            onBlur={() => handleBlur('fechaFin')}
                            min={formData.fechaInicio || ''}
                            disabled={isReadOnly()}
                        />
                        <FieldError message={touched.fechaFin && fieldErrors.fechaFin} />
                    </div>
                    <div className="form-group">
                        <label className="form-label">Fecha Regreso</label>
                        <input type="date" className="form-input" value={formData.fechaRegreso || ''} disabled />
                    </div>
                    <div className="form-group">
                        <label className="form-label">Días Solic.</label>
                        <input type="number" className="form-input" value={formData.diasSolicitud || 0} disabled />
                    </div>
                </div>

                {/* Row 3: Notificado and Estado */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                    <div className="form-group">
                        <label className="form-label">Notificado el</label>
                        <input
                            type="date"
                            className="form-input"
                            value={formData.notificadoEl || ''}
                            onChange={e => handleChange('notificadoEl', e.target.value)}
                            max={getTodayStr()}
                            disabled={true}
                        />
                        <small style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginTop: '0.25rem', display: 'block' }}>
                            Se completa automáticamente al aprobar la solicitud
                        </small>
                    </div>
                    <div className="form-group">
                        <label className="form-label">Estado *</label>
                        <select
                            className="form-input"
                            value={formData.estado || 'pendiente'}
                            onChange={e => handleChange('estado', e.target.value)}
                        >
                            {ESTADOS_VACACIONES.map(e => <option key={e.value} value={e.value}>{e.label}</option>)}
                        </select>
                    </div>
                </div>

                <div className="form-group">
                    <label className="form-label">Descripción</label>
                    <textarea
                        className="form-input"
                        value={formData.descripcion || ''}
                        onChange={e => handleChange('descripcion', e.target.value)}
                        rows={2}
                        maxLength={500}
                        disabled={isReadOnly()}
                    />
                </div>
            </div>
        );
    };

    const renderHorasExtrasForm = () => (
        <div style={{ display: 'grid', gap: '1rem' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '1rem' }}>
                <div className="form-group">
                    <label className="form-label">Fecha *</label>
                    <input
                        type="date"
                        className={`form-input ${touched.fecha && fieldErrors.fecha ? 'input-error' : ''}`}
                        value={formData.fecha || ''}
                        onChange={e => handleChange('fecha', e.target.value)}
                        onBlur={() => handleBlur('fecha')}
                        max={getTodayStr()}
                        disabled={isReadOnly()}
                    />
                    <FieldError message={touched.fecha && fieldErrors.fecha} />
                </div>
                <div className="form-group">
                    <label className="form-label">Hora Inicio *</label>
                    <input
                        type="time"
                        className={`form-input ${touched.horaInicio && fieldErrors.horaInicio ? 'input-error' : ''}`}
                        value={formData.horaInicio || ''}
                        onChange={e => handleChange('horaInicio', e.target.value)}
                        onBlur={() => handleBlur('horaInicio')}
                        disabled={isReadOnly()}
                    />
                    <FieldError message={touched.horaInicio && fieldErrors.horaInicio} />
                </div>
                <div className="form-group">
                    <label className="form-label">Hora Fin *</label>
                    <input
                        type="time"
                        className={`form-input ${touched.horaFin && fieldErrors.horaFin ? 'input-error' : ''}`}
                        value={formData.horaFin || ''}
                        onChange={e => handleChange('horaFin', e.target.value)}
                        onBlur={() => handleBlur('horaFin')}
                        disabled={isReadOnly()}
                    />
                    <FieldError message={touched.horaFin && fieldErrors.horaFin} />
                </div>
                <div className="form-group">
                    <label className="form-label">Cantidad Horas</label>
                    <input type="text" className="form-input" value={formData.cantidadHoras || 0} disabled />
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="form-group">
                    <label className="form-label">Tipo de Horas Extra *</label>
                    <select
                        className={`form-input ${touched.tipoHorasExtra && fieldErrors.tipoHorasExtra ? 'input-error' : ''}`}
                        value={formData.tipoHorasExtra || ''}
                        onChange={e => handleChange('tipoHorasExtra', e.target.value)}
                        onBlur={() => handleBlur('tipoHorasExtra')}
                        disabled={isReadOnly()}
                    >
                        <option value="">Seleccionar...</option>
                        {TIPOS_HORAS_EXTRA.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                    </select>
                    <FieldError message={touched.tipoHorasExtra && fieldErrors.tipoHorasExtra} />
                </div>
                <div className="form-group">
                    <label className="form-label">Estado *</label>
                    <select
                        className="form-input"
                        value={formData.estado || 'pendiente'}
                        onChange={e => handleChange('estado', e.target.value)}
                    >
                        {ESTADOS_HORAS_EXTRAS.map(e => <option key={e.value} value={e.value}>{e.label}</option>)}
                    </select>
                </div>
            </div>

            <div className="form-group">
                <label className="form-label">URL Justificativo</label>
                <input
                    type="url"
                    className="form-input"
                    value={formData.urlJustificativo || ''}
                    onChange={e => handleChange('urlJustificativo', e.target.value)}
                    maxLength={100}
                    disabled={isReadOnly()}
                />
            </div>

            <div className="form-group">
                <label className="form-label">Motivo / Descripción</label>
                <textarea
                    className="form-input"
                    value={formData.motivo || ''}
                    onChange={e => handleChange('motivo', e.target.value)}
                    rows={2}
                    maxLength={500}
                    disabled={isReadOnly()}
                />
            </div>
        </div>
    );

    const renderRenunciaForm = () => (
        <div style={{ display: 'grid', gap: '1rem' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="form-group">
                    <label className="form-label">Fecha Notificación *</label>
                    <input
                        type="date"
                        className={`form-input ${touched.fechaNotificacion && fieldErrors.fechaNotificacion ? 'input-error' : ''}`}
                        value={formData.fechaNotificacion || new Date().toISOString().split('T')[0]}
                        onChange={e => handleChange('fechaNotificacion', e.target.value)}
                        onBlur={() => handleBlur('fechaNotificacion')}
                        max={getTodayStr()}
                        disabled={isReadOnly()}
                    />
                    <FieldError message={touched.fechaNotificacion && fieldErrors.fechaNotificacion} />
                </div>
                <div className="form-group">
                    <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        Fecha Baja Efectiva
                        <span
                            className="tooltip-icon"
                            onClick={() => setShowTooltipRenuncia(!showTooltipRenuncia)}
                            style={{ cursor: 'pointer' }}
                        >
                            ?
                        </span>
                    </label>
                    <input
                        type="date"
                        className="form-input"
                        value={formData.fechaBajaEfectiva || ''}
                        disabled
                    />
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Se calcula automáticamente: 15 días desde la notificación (preaviso)</span>
                </div>
            </div>

            {showTooltipRenuncia && (
                <div className="tooltip-info" style={{ whiteSpace: 'pre-line', marginTop: '0.25rem', marginBottom: '0.5rem' }}>
                    {TOOLTIP_RENUNCIA.split('**').map((part, i) =>
                        i % 2 === 1 ? <strong key={i}>{part}</strong> : part
                    )}
                </div>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="form-group">
                    <label className="form-label">Estado *</label>
                    <select
                        className="form-input"
                        value={formData.estado || 'pendiente'}
                        onChange={e => handleChange('estado', e.target.value)}
                    >
                        {ESTADOS_RENUNCIA.map(e => <option key={e.value} value={e.value}>{e.label}</option>)}
                    </select>
                </div>
                <div className="form-group">
                    <label className="form-label">URL Comprobante</label>
                    <input
                        type="url"
                        className="form-input"
                        value={formData.urlComprobanteRenuncia || ''}
                        onChange={e => handleChange('urlComprobanteRenuncia', e.target.value)}
                        maxLength={100}
                        disabled={isReadOnly()}
                    />
                </div>
            </div>

            <div className="form-group">
                <label className="form-label">Motivo</label>
                <textarea
                    className="form-input"
                    value={formData.motivo || ''}
                    onChange={e => handleChange('motivo', e.target.value)}
                    rows={2}
                    maxLength={500}
                    disabled={isReadOnly()}
                />
            </div>
        </div>
    );

    const renderStep2 = () => {
        switch (selectedTipo) {
            case 'licencia': return renderLicenciaForm();
            case 'vacaciones': return renderVacacionesForm();
            case 'horas_extras': return renderHorasExtrasForm();
            case 'renuncia': return renderRenunciaForm();
            default: return <p>Seleccione un tipo de solicitud en el paso anterior</p>;
        }
    };

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: '900px' }}>
                <div className="modal-header">
                    <h2 className="modal-title">{isEditing ? 'Editar Solicitud' : 'Nueva Solicitud'}</h2>
                    <button className="modal-close" onClick={onClose}>
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" style={{ width: 24, height: 24 }}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                <div className="modal-body" style={{ padding: '1.5rem' }}>
                    <StepTracker steps={steps} currentStep={currentStep} />

                    <div style={{ marginTop: '1.5rem', textAlign: 'center', marginBottom: '1.5rem' }}>
                        <h3 style={{ fontSize: '1.25rem', fontWeight: '600', color: 'var(--text-primary)', marginBottom: '0.25rem' }}>
                            {steps[currentStep - 1].title}
                        </h3>
                        <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                            {currentStep === 1 && 'Selecciona el contrato y tipo de solicitud'}
                            {currentStep === 2 && 'Completa los datos de la solicitud'}
                        </p>
                    </div>

                    {isReadOnly() && (
                        <div className="alert alert-warning" style={{ marginBottom: '1rem' }}>
                            Esta solicitud no está en estado Pendiente. Solo puede modificar el estado.
                        </div>
                    )}

                    {error && <div className="alert alert-error" style={{ marginBottom: '1rem' }}>{error}</div>}

                    {currentStep === 1 && renderStep1()}
                    {currentStep === 2 && renderStep2()}
                </div>

                <div className="modal-footer" style={{ display: 'flex', justifyContent: 'space-between', padding: '1rem 1.5rem', borderTop: '1px solid var(--border-color)' }}>
                    <div>
                        {currentStep > 1 && !isEditing && (
                            <button className="btn btn-secondary" onClick={prevStep}>Anterior</button>
                        )}
                    </div>
                    <div style={{ display: 'flex', gap: '1rem' }}>
                        <button className="btn btn-secondary" onClick={onClose} disabled={loading}>Cancelar</button>
                        {currentStep < 2 ? (
                            <button className="btn btn-primary" onClick={nextStep}>Siguiente</button>
                        ) : (
                            <button className="btn btn-primary" onClick={handleSubmit} disabled={loading}>
                                {loading ? 'Guardando...' : (isEditing ? 'Actualizar' : 'Crear')} Solicitud
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SolicitudWizard;
