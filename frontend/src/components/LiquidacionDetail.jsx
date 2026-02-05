import { formatDateOnly, formatCurrency } from '../utils/formatters';

const LiquidacionDetail = ({ liquidacion, onClose, onEdit }) => {
    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: '950px' }}>
                <div className="modal-header">
                    <h2 className="modal-title">Detalle de Liquidación</h2>
                    <button className="modal-close" onClick={onClose}>
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" style={{ width: 24, height: 24 }}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                <div className="modal-body" style={{ padding: '2rem' }}>
                    {/* Título y subtít

ulo dentro del body */}
                    <div style={{ marginBottom: '2rem', textAlign: 'center' }}>
                        <h3 style={{ fontSize: '1.5rem', fontWeight: '600', color: 'var(--text-primary)', marginBottom: '0.5rem' }}>
                            Información de la Liquidación
                        </h3>
                        <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                            Visualiza todos los detalles y conceptos de la liquidación
                        </p>
                    </div>

                    {/* Información del Empleado */}
                    <div style={{ marginBottom: '2rem' }}>
                        <h4 style={{ marginBottom: '1rem', fontSize: '1rem', fontWeight: '600' }}>Empleado</h4>
                        <div style={{ padding: '1rem', background: 'var(--bg-secondary)', borderRadius: '8px' }}>
                            <div><strong>Nombre:</strong> {liquidacion?.contrato?.empleado?.apellido}, {liquidacion?.contrato?.empleado?.nombre}</div>
                            <div><strong>Documento:</strong> {liquidacion?.contrato?.empleado?.numeroDocumento}</div>
                            <div><strong>Período:</strong> {formatDateOnly(liquidacion?.fechaInicio)} - {formatDateOnly(liquidacion?.fechaFin)}</div>
                        </div>
                    </div>

                    {/* Conceptos Remunerativos */}
                    <div style={{ marginBottom: '2rem' }}>
                        <h4 style={{ marginBottom: '1rem', fontSize: '1rem', fontWeight: '600' }}>Conceptos Remunerativos</h4>
                        <table className="table" style={{ border: '1px solid var(--border-color)' }}>
                            <tbody>
                                <tr><td>Básico</td><td style={{ textAlign: 'right' }}>{formatCurrency(liquidacion?.basico)}</td></tr>
                                <tr><td>Antigüedad</td><td style={{ textAlign: 'right' }}>{formatCurrency(liquidacion?.antiguedad)}</td></tr>
                                <tr><td>Presentismo</td><td style={{ textAlign: 'right' }}>{formatCurrency(liquidacion?.presentismo)}</td></tr>
                                {liquidacion?.horasExtras > 0 && <tr><td>Horas Extras</td><td style={{ textAlign: 'right' }}>{formatCurrency(liquidacion?.horasExtras)}</td></tr>}
                                {liquidacion?.vacaciones > 0 && <tr><td>Vacaciones</td><td style={{ textAlign: 'right' }}>{formatCurrency(liquidacion?.vacaciones)}</td></tr>}
                                {liquidacion?.sac > 0 && <tr><td>SAC</td><td style={{ textAlign: 'right' }}>{formatCurrency(liquidacion?.sac)}</td></tr>}
                                {liquidacion?.vacacionesNoGozadas > 0 && <tr><td>Vacaciones No Gozadas</td><td style={{ textAlign: 'right' }}>{formatCurrency(liquidacion?.vacacionesNoGozadas)}</td></tr>}
                            </tbody>
                        </table>
                    </div>

                    {/* Deducciones/Retenciones */}
                    {(liquidacion?.inasistencias > 0 || liquidacion?.totalRetenciones > 0 || (liquidacion?.detalleRetenciones && liquidacion.detalleRetenciones.length > 0)) && (
                        <div style={{ marginBottom: '2rem' }}>
                            <h4 style={{ marginBottom: '1rem', fontSize: '1rem', fontWeight: '600' }}>Deducciones</h4>
                            <table className="table" style={{ border: '1px solid var(--border-color)' }}>
                                <tbody>
                                    {liquidacion?.inasistencias > 0 && <tr><td>Inasistencias Injustificadas</td><td style={{ textAlign: 'right' }}>{formatCurrency(liquidacion?.inasistencias)}</td></tr>}

                                    {/* Detalle de Retenciones */}
                                    {liquidacion?.detalleRetenciones && liquidacion.detalleRetenciones.length > 0 && liquidacion.detalleRetenciones.map((retencion, index) => (
                                        <tr key={index}>
                                            <td>
                                                <div>{retencion.nombre}</div>
                                                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                                                    {retencion.porcentaje}% del bruto
                                                </div>
                                            </td>
                                            <td style={{ textAlign: 'right' }}>{formatCurrency(retencion.monto)}</td>
                                        </tr>
                                    ))}

                                    {/* Total Retenciones */}
                                    {liquidacion?.totalRetenciones > 0 && (
                                        <tr style={{ borderTop: '2px solid var(--border-color)', fontWeight: 'bold' }}>
                                            <td>Total Retenciones</td>
                                            <td style={{ textAlign: 'right' }}>{formatCurrency(liquidacion?.totalRetenciones)}</td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    )}

                    {/* Totales */}
                    <div style={{ padding: '1rem', background: 'var(--bg-secondary)', borderRadius: '8px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                            <strong>Total Bruto:</strong>
                            <span>{formatCurrency(liquidacion?.totalBruto)}</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                            <strong>Total Deducciones:</strong>
                            <span>-{formatCurrency((liquidacion?.inasistencias || 0) + (liquidacion?.totalRetenciones || 0))}</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: '0.5rem', borderTop: '2px solid var(--border-color)', fontSize: '1.2rem' }}>
                            <strong>Neto:</strong>
                            <strong style={{ color: 'var(--primary-color)' }}>{formatCurrency(liquidacion?.neto)}</strong>
                        </div>
                    </div>
                </div>

                <div className="modal-footer" style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', padding: '1.5rem 2rem', borderTop: '1px solid var(--border-color)' }}>
                    <button type="button" className="btn btn-secondary" onClick={onClose}>
                        Cerrar
                    </button>
                    <button type="button" className="btn btn-primary" onClick={() => onEdit(liquidacion)}>
                        Editar
                    </button>
                </div>
            </div>
        </div>
    );
};

export default LiquidacionDetail;
