import { formatDateOnly, formatCurrency } from '../utils/formatters';
import { useAuth } from '../context/AuthContext';

const LiquidacionDetail = ({ liquidacion, onClose, onEdit }) => {

    // Permisos del módulo liquidaciones
    const { user } = useAuth();
    const isEmpleadoUser = user?.esEmpleado && !user?.esAdministrador;
    const userPermisos = user?.rol?.permisos || [];
    const canEdit = !isEmpleadoUser || user?.esAdministrador || userPermisos.some(p => p.modulo === 'liquidaciones' && p.accion === 'actualizar');

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

                    {/* Información y Totales */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr)', gap: '1.5rem', marginBottom: '2rem' }}>
                        {/* Información del Empleado */}
                        <div>
                            <h4 style={{ marginBottom: '1rem', fontSize: '1rem', fontWeight: '600' }}>Empleado</h4>
                            <div style={{ padding: '1.25rem', background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '8px', boxSizing: 'border-box' }}>
                                <div style={{ marginBottom: '0.75rem', fontSize: '1.05rem' }}>
                                    <strong>{liquidacion?.contrato?.empleado?.usuario?.apellido}, {liquidacion?.contrato?.empleado?.usuario?.nombre}</strong>
                                </div>
                                <div style={{ marginBottom: '0.5rem', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                                    <strong style={{ color: 'var(--text-secondary)' }}>Documento:</strong> {liquidacion?.contrato?.empleado?.numeroDocumento}
                                </div>
                                <div style={{ fontSize: '0.9rem' }}>
                                    <strong style={{ color: 'var(--text-secondary)' }}>Período:</strong> {formatDateOnly(liquidacion?.fechaInicio)} al {formatDateOnly(liquidacion?.fechaFin)}
                                </div>
                            </div>
                        </div>

                        {/* Totales */}
                        <div>
                            <h4 style={{ marginBottom: '1rem', fontSize: '1rem', fontWeight: '600' }}>Resumen de Liquidación</h4>
                            <div style={{ padding: '1.25rem', background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '8px', display: 'flex', flexDirection: 'column', boxSizing: 'border-box' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                                    <strong>Total Bruto:</strong>
                                    <span>{formatCurrency(liquidacion?.totalBruto)}</span>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                                    <strong>Total Deducciones:</strong>
                                    <span style={{ color: '#ef4444' }}>-{formatCurrency(Number(liquidacion?.inasistencias || 0) + Number(liquidacion?.totalRetenciones || 0))}</span>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: '0.75rem', borderTop: '2px solid var(--border-color)', fontSize: '1.2rem', marginTop: '0.25rem' }}>
                                    <strong>Neto:</strong>
                                    <strong style={{ color: 'var(--primary-color)' }}>{formatCurrency(liquidacion?.neto)}</strong>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Detalles */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr)', gap: '1.5rem', marginBottom: '2rem' }}>
                        {/* Conceptos Remunerativos */}
                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                            <h4 style={{ marginBottom: '1rem', fontSize: '1rem', fontWeight: '600' }}>Conceptos Remunerativos</h4>
                            <div style={{ flexGrow: 1, border: '1px solid var(--border-color)', borderRadius: '8px', overflow: 'hidden' }}>
                                <table className="table" style={{ margin: 0, border: 'none' }}>
                                    <tbody>
                                        <tr><td style={{ padding: '0.75rem 1rem' }}>Básico</td><td style={{ textAlign: 'right', padding: '0.75rem 1rem' }}>{formatCurrency(liquidacion?.basico)}</td></tr>
                                        <tr><td style={{ padding: '0.75rem 1rem' }}>Antigüedad</td><td style={{ textAlign: 'right', padding: '0.75rem 1rem' }}>{formatCurrency(liquidacion?.antiguedad)}</td></tr>
                                        <tr><td style={{ padding: '0.75rem 1rem' }}>Presentismo</td><td style={{ textAlign: 'right', padding: '0.75rem 1rem' }}>{formatCurrency(liquidacion?.presentismo)}</td></tr>
                                        {liquidacion?.horasExtras > 0 && <tr><td style={{ padding: '0.75rem 1rem' }}>Horas Extras</td><td style={{ textAlign: 'right', padding: '0.75rem 1rem' }}>{formatCurrency(liquidacion?.horasExtras)}</td></tr>}
                                        {liquidacion?.vacaciones > 0 && <tr><td style={{ padding: '0.75rem 1rem' }}>Vacaciones</td><td style={{ textAlign: 'right', padding: '0.75rem 1rem' }}>{formatCurrency(liquidacion?.vacaciones)}</td></tr>}
                                        {liquidacion?.sac > 0 && <tr><td style={{ padding: '0.75rem 1rem' }}>SAC</td><td style={{ textAlign: 'right', padding: '0.75rem 1rem' }}>{formatCurrency(liquidacion?.sac)}</td></tr>}
                                        {liquidacion?.vacacionesNoGozadas > 0 && <tr><td style={{ padding: '0.75rem 1rem' }}>Vacaciones No Gozadas</td><td style={{ textAlign: 'right', padding: '0.75rem 1rem' }}>{formatCurrency(liquidacion?.vacacionesNoGozadas)}</td></tr>}

                                        {/* Detalle Remunerativo Adicional */}
                                        {liquidacion?.detalleRemunerativo && liquidacion.detalleRemunerativo.length > 0 && liquidacion.detalleRemunerativo.map((remunerativo, index) => (
                                            <tr key={`rem-${index}`}>
                                                <td style={{ padding: '0.75rem 1rem' }}>
                                                    <div>{remunerativo.nombre}</div>
                                                    {remunerativo.porcentaje && (
                                                        <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                                                            {remunerativo.porcentaje}%
                                                        </div>
                                                    )}
                                                </td>
                                                <td style={{ textAlign: 'right', padding: '0.75rem 1rem' }}>{formatCurrency(remunerativo.monto)}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        {/* Deducciones/Retenciones */}
                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                            <h4 style={{ marginBottom: '1rem', fontSize: '1rem', fontWeight: '600' }}>Deducciones</h4>
                            <div style={{ flexGrow: 1, border: '1px solid var(--border-color)', borderRadius: '8px', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
                                {(liquidacion?.inasistencias > 0 || liquidacion?.totalRetenciones > 0 || (liquidacion?.detalleRetenciones && liquidacion.detalleRetenciones.length > 0)) ? (
                                    <table className="table" style={{ margin: 0, border: 'none' }}>
                                        <tbody>
                                            {liquidacion?.inasistencias > 0 && <tr><td style={{ padding: '0.75rem 1rem', color: '#ef4444' }}>Inasistencias Injustificadas</td><td style={{ textAlign: 'right', padding: '0.75rem 1rem', color: '#ef4444' }}>-{formatCurrency(liquidacion?.inasistencias)}</td></tr>}

                                            {/* Detalle de Retenciones */}
                                            {liquidacion?.detalleRetenciones && liquidacion.detalleRetenciones.length > 0 && liquidacion.detalleRetenciones.map((retencion, index) => (
                                                <tr key={index}>
                                                    <td style={{ padding: '0.75rem 1rem' }}>
                                                        <div>{retencion.nombre}</div>
                                                        <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                                                            {retencion.porcentaje}% del bruto
                                                        </div>
                                                    </td>
                                                    <td style={{ textAlign: 'right', padding: '0.75rem 1rem', color: '#ef4444' }}>-{formatCurrency(retencion.monto)}</td>
                                                </tr>
                                            ))}

                                            {/* Total Retenciones */}
                                            {liquidacion?.totalRetenciones > 0 && (
                                                <tr style={{ background: 'var(--bg-secondary)', fontWeight: 'bold' }}>
                                                    <td style={{ padding: '0.75rem 1rem' }}>Total Retenciones</td>
                                                    <td style={{ textAlign: 'right', padding: '0.75rem 1rem', color: '#ef4444' }}>-{formatCurrency(liquidacion?.totalRetenciones)}</td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </table>
                                ) : (
                                    <div style={{ padding: '3rem 1rem', textAlign: 'center', color: 'var(--text-secondary)', margin: 'auto' }}>
                                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" style={{ width: 48, height: 48, opacity: 0.5, margin: '0 auto 1rem' }}>
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25zM6.75 12h.008v.008H6.75V12zm0 3h.008v.008H6.75V15zm0 3h.008v.008H6.75V18z" />
                                        </svg>
                                        <div>Sin deducciones en este período.</div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>


                </div>

                <div className="modal-footer" style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', padding: '1.5rem 2rem', borderTop: '1px solid var(--border-color)' }}>
                    <button type="button" className="btn btn-secondary" onClick={onClose}>
                        Cerrar
                    </button>
                </div>
            </div>
        </div>
    );
};

export default LiquidacionDetail;
