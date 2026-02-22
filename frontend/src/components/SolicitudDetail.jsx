import { formatDateOnly } from '../utils/formatters';
import { useAuth } from '../context/AuthContext';

const TIPO_LABELS = {
    vacaciones: { label: 'Vacaciones', icon: '🏖️' },
    licencia: { label: 'Licencia / Inasistencia', icon: '📋' },
    horas_extras: { label: 'Horas Extras', icon: '⏰' },
    renuncia: { label: 'Renuncia', icon: '👋' },
};

const MOTIVO_LABELS = {
    matrimonio: 'Matrimonio (LCT Art. 168)',
    nacimiento_hijo: 'Nacimiento de hijo',
    fallecimiento_conyugue_hijo_padres: 'Fallecimiento familiar directo',
    fallecimiento_hermano: 'Fallecimiento de hermano',
    examen_estudio: 'Examen / Estudio',
    accidente_trabajo_art: 'Accidente de trabajo (ART)',
    enfermedad_inculpable: 'Enfermedad inculpable',
    maternidad: 'Maternidad',
    excedencia: 'Estado de excedencia',
    donacion_sangre: 'Donación de sangre',
    citacion_judicial: 'Citación judicial',
    presidente_mesa: 'Presidente de mesa',
    mudanza: 'Mudanza',
    cumpleanos: 'Día de cumpleaños',
    tramites_personales: 'Trámites personales',
    compensatorio_franco: 'Compensatorio / Franco',
};

const ESTADO_STYLES = {
    pendiente: { bg: '#fef3c7', color: '#92400e', label: 'Pendiente' },
    justificada: { bg: '#d1fae5', color: '#065f46', label: 'Justificada' },
    injustificada: { bg: '#fee2e2', color: '#991b1b', label: 'Injustificada' },
    rechazada: { bg: '#fee2e2', color: '#991b1b', label: 'Rechazada' },
    aprobada: { bg: '#d1fae5', color: '#065f46', label: 'Aprobada' },
    aceptada: { bg: '#dbeafe', color: '#1e40af', label: 'Aceptada' },
    procesada: { bg: '#f3e8ff', color: '#6b21a8', label: 'Procesada' },
};

// Icons
const Icons = {
    calendar: (
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" style={{ width: 18, height: 18 }}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
        </svg>
    ),
    clock: (
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" style={{ width: 18, height: 18 }}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
    ),
    document: (
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" style={{ width: 18, height: 18 }}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
        </svg>
    ),
    user: (
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" style={{ width: 18, height: 18 }}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
        </svg>
    ),
    building: (
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" style={{ width: 18, height: 18 }}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 21h19.5m-18-18v18m10.5-18v18m6-13.5V21M6.75 6.75h.75m-.75 3h.75m-.75 3h.75m3-6h.75m-.75 3h.75m-.75 3h.75M6.75 21v-3.375c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21M3 3h12m-.75 4.5H21m-3.75 3.75h.008v.008h-.008v-.008zm0 3h.008v.008h-.008v-.008zm0 3h.008v.008h-.008v-.008z" />
        </svg>
    ),
    briefcase: (
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" style={{ width: 18, height: 18 }}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 14.15v4.25c0 1.094-.787 2.036-1.872 2.18-2.087.277-4.216.42-6.378.42s-4.291-.143-6.378-.42c-1.085-.144-1.872-1.086-1.872-2.18v-4.25m16.5 0a2.18 2.18 0 00.75-1.661V8.706c0-1.081-.768-2.015-1.837-2.175a48.114 48.114 0 00-3.413-.387m4.5 8.006c-.194.165-.42.295-.673.38A23.978 23.978 0 0112 15.75c-2.648 0-5.195-.429-7.577-1.22a2.016 2.016 0 01-.673-.38m0 0A2.18 2.18 0 013 12.489V8.706c0-1.081.768-2.015 1.837-2.175a48.111 48.111 0 013.413-.387m7.5 0V5.25A2.25 2.25 0 0013.5 3h-3a2.25 2.25 0 00-2.25 2.25v.894m7.5 0a48.667 48.667 0 00-7.5 0M12 12.75h.008v.008H12v-.008z" />
        </svg>
    ),
    circle: (
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" style={{ width: 20, height: 20 }}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
    ),
    edit: (
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" style={{ width: 16, height: 16 }}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
        </svg>
    ),
};

// Field component with icon
const Field = ({ icon, label, value }) => (
    <div style={{
        display: 'flex',
        alignItems: 'flex-start',
        gap: '0.75rem',
        padding: '0.75rem 0',
        borderBottom: '1px solid var(--border-color)'
    }}>
        <div style={{
            color: 'var(--primary-color)',
            flexShrink: 0,
            marginTop: '2px'
        }}>
            {icon}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{
                fontSize: '0.75rem',
                color: 'var(--text-secondary)',
                marginBottom: '0.25rem'
            }}>
                {label}
            </div>
            <div style={{
                fontWeight: 500,
                color: 'var(--text-primary)',
                wordBreak: 'break-word'
            }}>
                {value || '-'}
            </div>
        </div>
    </div>
);

// Section header component
const SectionHeader = ({ title, subtitle }) => (
    <div style={{ marginBottom: '0.75rem' }}>
        <div style={{
            display: 'flex',
            alignItems: 'baseline',
            justifyContent: 'space-between',
            paddingBottom: '0.5rem',
            borderBottom: '2px solid var(--primary-color)'
        }}>
            <span style={{
                fontSize: '0.875rem',
                fontWeight: 700,
                color: 'var(--text-primary)'
            }}>
                {title}
            </span>
            {subtitle && (
                <span style={{
                    fontSize: '0.75rem',
                    color: 'var(--text-secondary)'
                }}>
                    {subtitle}
                </span>
            )}
        </div>
    </div>
);

const SolicitudDetail = ({ solicitud, onEdit, onClose }) => {
    if (!solicitud) return null;

    // Permisos del módulo solicitudes
    const { user } = useAuth();
    const isEmpleadoUser = user?.esEmpleado && !user?.esAdministrador;
    const userPermisos = user?.rol?.permisos || [];
    const canEdit = !isEmpleadoUser || user?.esAdministrador || userPermisos.some(p => p.modulo === 'solicitudes' && p.accion === 'actualizar');

    const tipoInfo = TIPO_LABELS[solicitud.tipoSolicitud] || { label: solicitud.tipoSolicitud, icon: '📄' };
    const typeData = solicitud.licencia || solicitud.vacaciones || solicitud.horasExtras || solicitud.renuncia || {};
    const estadoStyle = ESTADO_STYLES[typeData.estado] || ESTADO_STYLES.pendiente;

    const empleado = solicitud.contrato?.empleado;
    const puesto = solicitud.contrato?.puestos?.[0];
    const empresa = puesto?.departamento?.area?.empresa;

    const getRelativeTime = (dateString) => {
        if (!dateString) return 'fecha desconocida';
        const date = new Date(dateString);
        const now = new Date();
        const diffMs = now - date;
        const diffMinutes = Math.floor(diffMs / (1000 * 60));
        const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
        const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

        if (diffMinutes < 1) return 'menos de un minuto';
        if (diffMinutes < 60) return `${diffMinutes} minuto${diffMinutes !== 1 ? 's' : ''}`;
        if (diffHours < 24) return `${diffHours} hora${diffHours !== 1 ? 's' : ''}`;
        return `${diffDays} día${diffDays !== 1 ? 's' : ''}`;
    };

    const renderLicenciaDetails = () => {
        const data = solicitud.licencia;
        if (!data) return null;
        return (
            <>
                <Field icon={Icons.document} label="Tipo" value={data.esLicencia ? 'Licencia' : 'Inasistencia'} />
                <Field icon={Icons.document} label="Motivo Legal" value={MOTIVO_LABELS[data.motivoLegal] || data.motivoLegal} />
                <Field icon={Icons.calendar} label="Fecha Inicio" value={formatDateOnly(data.fechaInicio)} />
                <Field icon={Icons.calendar} label="Fecha Fin" value={formatDateOnly(data.fechaFin)} />
                <Field icon={Icons.calendar} label="Días Solicitados" value={data.diasSolicitud} />
                {data.urlJustificativo && <Field icon={Icons.document} label="Justificativo" value={<a href={data.urlJustificativo} target="_blank" rel="noreferrer" style={{ color: 'var(--primary-color)' }}>Ver documento</a>} />}
                {data.descripcion && <Field icon={Icons.document} label="Descripción" value={data.descripcion} />}
                {data.registroSalud && (
                    <Field
                        icon={Icons.document}
                        label="Registro de Salud Asociado"
                        value={`${data.registroSalud.tipoExamen} - ${data.registroSalud.nombreExamen}`}
                    />
                )}
            </>
        );
    };

    const renderVacacionesDetails = () => {
        const data = solicitud.vacaciones;
        if (!data) return null;
        return (
            <>
                <Field icon={Icons.calendar} label="Período" value={data.periodo} />
                <Field icon={Icons.calendar} label="Días Correspondientes" value={data.diasCorrespondientes} />
                <Field icon={Icons.calendar} label="Días Tomados" value={data.diasTomados} />
                <Field icon={Icons.calendar} label="Días Disponibles" value={data.diasDisponibles} />
                <Field icon={Icons.calendar} label="Fecha Inicio" value={formatDateOnly(data.fechaInicio)} />
                <Field icon={Icons.calendar} label="Fecha Fin" value={formatDateOnly(data.fechaFin)} />
                <Field icon={Icons.calendar} label="Fecha Regreso" value={formatDateOnly(data.fechaRegreso)} />
                <Field icon={Icons.calendar} label="Días Solicitados" value={data.diasSolicitud} />
                {data.notificadoEl && <Field icon={Icons.calendar} label="Notificado el" value={formatDateOnly(data.notificadoEl)} />}
                {data.descripcion && <Field icon={Icons.document} label="Descripción" value={data.descripcion} />}
            </>
        );
    };

    const renderHorasExtrasDetails = () => {
        const data = solicitud.horasExtras;
        if (!data) return null;
        return (
            <>
                <Field icon={Icons.calendar} label="Fecha" value={formatDateOnly(data.fecha)} />
                <Field icon={Icons.clock} label="Hora Inicio" value={data.horaInicio} />
                <Field icon={Icons.clock} label="Hora Fin" value={data.horaFin} />
                <Field icon={Icons.clock} label="Cantidad de Horas" value={data.cantidadHoras} />
                <Field icon={Icons.document} label="Tipo" value={data.tipoHorasExtra === '50' ? '50% (hábiles)' : '100% (fines de semana/feriados)'} />
                {data.urlJustificativo && <Field icon={Icons.document} label="Justificativo" value={<a href={data.urlJustificativo} target="_blank" rel="noreferrer" style={{ color: 'var(--primary-color)' }}>Ver documento</a>} />}
                {data.motivo && <Field icon={Icons.document} label="Motivo" value={data.motivo} />}
            </>
        );
    };

    const renderRenunciaDetails = () => {
        const data = solicitud.renuncia;
        if (!data) return null;
        return (
            <>
                <Field icon={Icons.calendar} label="Fecha Notificación" value={formatDateOnly(data.fechaNotificacion)} />
                <Field icon={Icons.calendar} label="Fecha Baja Efectiva" value={formatDateOnly(data.fechaBajaEfectiva)} />
                <Field icon={Icons.document} label="Preaviso" value={data.preaviso === true ? 'Sí' : data.preaviso === false ? 'No' : '-'} />
                {data.urlComprobanteRenuncia && <Field icon={Icons.document} label="Comprobante" value={<a href={data.urlComprobanteRenuncia} target="_blank" rel="noreferrer" style={{ color: 'var(--primary-color)' }}>Ver documento</a>} />}
                {data.motivo && <Field icon={Icons.document} label="Motivo" value={data.motivo} />}
            </>
        );
    };

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: '950px' }}>
                {/* Header */}
                <div className="modal-header">
                    <h2 className="modal-title">Detalle de Solicitud</h2>
                    <button className="modal-close" onClick={onClose}>
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" style={{ width: 24, height: 24 }}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                <div className="modal-body" style={{ padding: '1.5rem 2rem 2rem' }}>
                    {/* Top Section: Type + ID + Edit button */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                            <span style={{ fontSize: '2rem' }}>{tipoInfo.icon}</span>
                            <div>
                                <h2 style={{
                                    fontSize: '1.5rem',
                                    fontWeight: 700,
                                    color: 'var(--text-primary)',
                                    margin: 0
                                }}>
                                    {tipoInfo.label}
                                </h2>
                                <span style={{
                                    fontSize: '0.85rem',
                                    color: 'var(--text-secondary)',
                                    fontWeight: 500
                                }}>
                                    #{solicitud.id}
                                </span>
                            </div>
                        </div>
                        {typeData.estado === 'pendiente' && onEdit && canEdit && (
                            <button className="btn btn-warning btn-sm" onClick={() => onEdit(solicitud)} title="Editar">
                                {Icons.edit}
                                Editar
                            </button>
                        )}
                    </div>

                    {/* Registro de Actividad Section - FIRST */}
                    <div style={{ marginBottom: '1.5rem' }}>
                        <SectionHeader title="Registro de Actividad" subtitle={`Últimos cambios hace ${getRelativeTime(solicitud.updatedAt)}`} />
                        <div style={{
                            background: 'var(--card-bg)',
                            borderRadius: '0.5rem',
                            border: '1px solid var(--border-color)',
                            display: 'grid',
                            gridTemplateColumns: '1fr 1fr 1fr',
                            overflow: 'hidden'
                        }}>
                            {/* Fecha de Creación */}
                            <div style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.75rem',
                                padding: '0.75rem 1rem',
                                borderRight: '1px solid var(--border-color)'
                            }}>
                                <div style={{ color: 'var(--primary-color)', flexShrink: 0 }}>
                                    {Icons.calendar}
                                </div>
                                <div style={{ flex: 1, minWidth: 0 }}>
                                    <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>
                                        Fecha de Creación
                                    </div>
                                    <div style={{ fontWeight: 500, color: 'var(--text-primary)' }}>
                                        {formatDateOnly(solicitud.createdAt)}
                                    </div>
                                </div>
                            </div>
                            {/* Estado */}
                            <div style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.75rem',
                                padding: '0.75rem 1rem',
                                borderRight: '1px solid var(--border-color)'
                            }}>
                                <div style={{ color: 'var(--primary-color)', flexShrink: 0 }}>
                                    {Icons.circle}
                                </div>
                                <div style={{ flex: 1, minWidth: 0 }}>
                                    <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>
                                        Estado
                                    </div>
                                    <span style={{
                                        display: 'inline-flex',
                                        alignItems: 'center',
                                        gap: '0.4rem',
                                        fontSize: '0.8rem',
                                        padding: '0.3rem 0.7rem',
                                        borderRadius: '9999px',
                                        background: estadoStyle.bg,
                                        color: estadoStyle.color,
                                        fontWeight: 700
                                    }}>
                                        <span style={{
                                            width: '7px',
                                            height: '7px',
                                            borderRadius: '50%',
                                            background: estadoStyle.color
                                        }} />
                                        {estadoStyle.label}
                                    </span>
                                </div>
                            </div>
                            {/* Última Modificación */}
                            <div style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.75rem',
                                padding: '0.75rem 1rem'
                            }}>
                                <div style={{ color: 'var(--primary-color)', flexShrink: 0 }}>
                                    {Icons.clock}
                                </div>
                                <div style={{ flex: 1, minWidth: 0 }}>
                                    <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>
                                        Última Modificación
                                    </div>
                                    <div style={{ fontWeight: 500, color: 'var(--text-primary)' }}>
                                        {formatDateOnly(solicitud.updatedAt)}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Main Content: 2 columns */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
                        {/* Column 1: Información del Empleado */}
                        <div>
                            <SectionHeader title="Información del Empleado" subtitle={`Últimos cambios hace ${getRelativeTime(solicitud.updatedAt)}`} />
                            <div style={{
                                background: 'var(--card-bg)',
                                borderRadius: '0.5rem',
                                border: '1px solid var(--border-color)',
                                padding: '0 1rem'
                            }}>
                                <Field
                                    icon={Icons.user}
                                    label="Empleado"
                                    value={empleado ? `${empleado.apellido}, ${empleado.nombre}` : 'Sin empleado'}
                                />
                                <Field
                                    icon={Icons.briefcase}
                                    label="Puesto"
                                    value={puesto?.nombre || 'Sin puesto'}
                                />
                                <Field
                                    icon={Icons.building}
                                    label="Empresa"
                                    value={empresa?.nombre || 'Sin empresa'}
                                />
                            </div>
                        </div>

                        {/* Column 2: Detalles de la Solicitud */}
                        <div>
                            <SectionHeader title="Detalles de la Solicitud" subtitle={`Últimos cambios hace ${getRelativeTime(solicitud.updatedAt)}`} />
                            <div style={{
                                background: 'var(--card-bg)',
                                borderRadius: '0.5rem',
                                border: '1px solid var(--border-color)',
                                padding: '0 1rem'
                            }}>
                                {solicitud.tipoSolicitud === 'licencia' && renderLicenciaDetails()}
                                {solicitud.tipoSolicitud === 'vacaciones' && renderVacacionesDetails()}
                                {solicitud.tipoSolicitud === 'horas_extras' && renderHorasExtrasDetails()}
                                {solicitud.tipoSolicitud === 'renuncia' && renderRenunciaDetails()}
                            </div>
                        </div>
                    </div>
                </div>

                <div className="modal-footer" style={{
                    display: 'flex',
                    justifyContent: 'flex-end',
                    padding: '1rem 2rem',
                    borderTop: '1px solid var(--border-color)'
                }}>
                    <button className="btn btn-secondary" onClick={onClose}>
                        Cerrar
                    </button>
                </div>
            </div>
        </div>
    );
};

export default SolicitudDetail;
