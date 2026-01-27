import { useState, useEffect } from 'react';

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

const InfoRow = ({ label, value }) => (
    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.75rem 0', borderBottom: '1px solid var(--border-color)' }}>
        <span style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>{label}</span>
        <span style={{ fontWeight: '500', color: 'var(--text-primary)', textAlign: 'right', maxWidth: '60%' }}>{value || '-'}</span>
    </div>
);

const SolicitudDetail = ({ solicitud, onEdit, onClose }) => {
    if (!solicitud) return null;

    const tipoInfo = TIPO_LABELS[solicitud.tipoSolicitud] || { label: solicitud.tipoSolicitud, icon: '📄' };
    const typeData = solicitud.licencia || solicitud.vacaciones || solicitud.horasExtras || solicitud.renuncia || {};
    const estadoStyle = ESTADO_STYLES[typeData.estado] || ESTADO_STYLES.pendiente;

    const empleado = solicitud.contrato?.empleado;
    const puesto = solicitud.contrato?.puestos?.[0];
    const empresa = puesto?.departamento?.area?.empresa;

    const formatDate = (dateString) => {
        if (!dateString) return '-';
        return new Date(dateString).toLocaleDateString('es-AR');
    };

    const renderLicenciaDetails = () => {
        const data = solicitud.licencia;
        if (!data) return null;
        return (
            <>
                <InfoRow label="Tipo" value={data.esLicencia ? 'Licencia' : 'Inasistencia'} />
                <InfoRow label="Motivo Legal" value={MOTIVO_LABELS[data.motivoLegal] || data.motivoLegal} />
                <InfoRow label="Fecha Inicio" value={formatDate(data.fechaInicio)} />
                <InfoRow label="Fecha Fin" value={formatDate(data.fechaFin)} />
                <InfoRow label="Días Solicitados" value={data.diasSolicitud} />
                {data.urlJustificativo && <InfoRow label="Justificativo" value={<a href={data.urlJustificativo} target="_blank" rel="noreferrer" style={{ color: '#0d9488' }}>Ver documento</a>} />}
                {data.descripcion && <InfoRow label="Descripción" value={data.descripcion} />}
            </>
        );
    };

    const renderVacacionesDetails = () => {
        const data = solicitud.vacaciones;
        if (!data) return null;
        return (
            <>
                <InfoRow label="Período" value={data.periodo} />
                <InfoRow label="Días Correspondientes" value={data.diasCorrespondientes} />
                <InfoRow label="Días Tomados" value={data.diasTomados} />
                <InfoRow label="Días Disponibles" value={data.diasDisponibles} />
                <InfoRow label="Fecha Inicio" value={formatDate(data.fechaInicio)} />
                <InfoRow label="Fecha Fin" value={formatDate(data.fechaFin)} />
                <InfoRow label="Fecha Regreso" value={formatDate(data.fechaRegreso)} />
                <InfoRow label="Días Solicitados" value={data.diasSolicitud} />
                {data.notificadoEl && <InfoRow label="Notificado el" value={formatDate(data.notificadoEl)} />}
                {data.descripcion && <InfoRow label="Descripción" value={data.descripcion} />}
            </>
        );
    };

    const renderHorasExtrasDetails = () => {
        const data = solicitud.horasExtras;
        if (!data) return null;
        return (
            <>
                <InfoRow label="Fecha" value={formatDate(data.fecha)} />
                <InfoRow label="Hora Inicio" value={data.horaInicio} />
                <InfoRow label="Hora Fin" value={data.horaFin} />
                <InfoRow label="Cantidad de Horas" value={data.cantidadHoras} />
                <InfoRow label="Tipo" value={data.tipoHorasExtra === '50' ? '50% (hábiles)' : '100% (fines de semana/feriados)'} />
                {data.urlJustificativo && <InfoRow label="Justificativo" value={<a href={data.urlJustificativo} target="_blank" rel="noreferrer" style={{ color: '#0d9488' }}>Ver documento</a>} />}
                {data.motivo && <InfoRow label="Motivo" value={data.motivo} />}
            </>
        );
    };

    const renderRenunciaDetails = () => {
        const data = solicitud.renuncia;
        if (!data) return null;
        return (
            <>
                <InfoRow label="Fecha Notificación" value={formatDate(data.fechaNotificacion)} />
                <InfoRow label="Fecha Baja Efectiva" value={formatDate(data.fechaBajaEfectiva)} />
                <InfoRow label="Preaviso" value={data.preaviso === true ? 'Sí' : data.preaviso === false ? 'No' : '-'} />
                {data.urlComprobanteRenuncia && <InfoRow label="Comprobante" value={<a href={data.urlComprobanteRenuncia} target="_blank" rel="noreferrer" style={{ color: '#0d9488' }}>Ver documento</a>} />}
                {data.motivo && <InfoRow label="Motivo" value={data.motivo} />}
            </>
        );
    };

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: '600px' }}>
                <div className="modal-header">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <span style={{ fontSize: '1.5rem' }}>{tipoInfo.icon}</span>
                        <div>
                            <h2 className="modal-title" style={{ margin: 0 }}>{tipoInfo.label}</h2>
                            <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>ID: {solicitud.id}</span>
                        </div>
                    </div>
                    <button className="modal-close" onClick={onClose}>
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" style={{ width: 24, height: 24 }}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                <div className="modal-body" style={{ padding: '1.5rem' }}>
                    {/* Estado Badge */}
                    <div style={{ marginBottom: '1.5rem', textAlign: 'center' }}>
                        <span style={{
                            display: 'inline-block',
                            padding: '0.5rem 1.5rem',
                            borderRadius: '9999px',
                            backgroundColor: estadoStyle.bg,
                            color: estadoStyle.color,
                            fontWeight: '600',
                            fontSize: '0.875rem',
                        }}>
                            {estadoStyle.label}
                        </span>
                    </div>

                    {/* Empleado Info */}
                    <div style={{ marginBottom: '1.5rem', padding: '1rem', background: 'var(--bg-secondary)', borderRadius: '0.75rem' }}>
                        <h3 style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '0.5rem', textTransform: 'uppercase' }}>Empleado</h3>
                        <p style={{ fontWeight: '600', color: 'var(--text-primary)', margin: 0 }}>
                            {empleado ? `${empleado.apellido}, ${empleado.nombre}` : 'Sin empleado'}
                        </p>
                        <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', margin: '0.25rem 0 0' }}>
                            {puesto?.nombre || 'Sin puesto'} {empresa ? `• ${empresa.nombre}` : ''}
                        </p>
                    </div>

                    {/* Type-specific Details */}
                    <div>
                        {solicitud.tipoSolicitud === 'licencia' && renderLicenciaDetails()}
                        {solicitud.tipoSolicitud === 'vacaciones' && renderVacacionesDetails()}
                        {solicitud.tipoSolicitud === 'horas_extras' && renderHorasExtrasDetails()}
                        {solicitud.tipoSolicitud === 'renuncia' && renderRenunciaDetails()}
                    </div>

                    {/* Dates */}
                    <div style={{ marginTop: '1.5rem', padding: '1rem', background: 'var(--bg-secondary)', borderRadius: '0.75rem' }}>
                        <InfoRow label="Creado" value={formatDate(solicitud.createdAt)} />
                        <InfoRow label="Actualizado" value={formatDate(solicitud.updatedAt)} />
                    </div>
                </div>

                <div className="modal-footer" style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', padding: '1rem 1.5rem', borderTop: '1px solid var(--border-color)' }}>
                    <button className="btn btn-secondary" onClick={onClose}>Cerrar</button>
                    <button
                        className="btn btn-primary"
                        onClick={() => onEdit(solicitud)}
                        disabled={typeData.estado !== 'pendiente'}
                        title={typeData.estado !== 'pendiente' ? 'Solo se pueden editar solicitudes pendientes' : 'Editar'}
                        style={typeData.estado !== 'pendiente' ? { opacity: 0.5, cursor: 'not-allowed' } : {}}
                    >
                        Editar
                    </button>
                </div>
            </div>
        </div>
    );
};

export default SolicitudDetail;
