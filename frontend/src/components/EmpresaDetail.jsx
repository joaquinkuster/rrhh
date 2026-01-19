import React from 'react';

const EmpresaDetail = ({ empresa, onClose }) => {
    if (!empresa) return null;

    const primaryColor = '#0d9488';

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: '900px' }}>
                <div className="modal-header">
                    <h2 className="modal-title">Detalle de Empresa</h2>
                    <button className="modal-close" onClick={onClose}>
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" style={{ width: 24, height: 24 }}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                <div className="modal-body" style={{ maxHeight: 'calc(90vh - 100px)', overflowY: 'auto' }}>
                    {/* Información de la Empresa */}
                    <div style={{ marginBottom: '2rem' }}>
                        <h3 style={{ fontSize: '1.25rem', fontWeight: '600', color: 'var(--text-primary)', marginBottom: '1rem' }}>
                            Información de la Empresa
                        </h3>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                            <div style={{ padding: '1rem', background: 'var(--card-bg)', border: '1px solid var(--border-color)', borderRadius: '0.5rem' }}>
                                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: '0.25rem' }}>Nombre</div>
                                <div style={{ fontSize: '1.125rem', fontWeight: '600', color: 'var(--text-primary)' }}>{empresa.nombre}</div>
                            </div>
                            <div style={{ padding: '1rem', background: 'var(--card-bg)', border: '1px solid var(--border-color)', borderRadius: '0.5rem' }}>
                                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: '0.25rem' }}>Industria</div>
                                <div style={{ fontSize: '1rem', color: 'var(--text-primary)' }}>{empresa.industria || '-'}</div>
                            </div>
                            <div style={{ padding: '1rem', background: 'var(--card-bg)', border: '1px solid var(--border-color)', borderRadius: '0.5rem' }}>
                                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: '0.25rem' }}>Email</div>
                                <div style={{ fontSize: '1rem', color: 'var(--text-primary)' }}>{empresa.email || '-'}</div>
                            </div>
                            <div style={{ padding: '1rem', background: 'var(--card-bg)', border: '1px solid var(--border-color)', borderRadius: '0.5rem' }}>
                                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: '0.25rem' }}>Teléfono</div>
                                <div style={{ fontSize: '1rem', color: 'var(--text-primary)' }}>{empresa.telefono || '-'}</div>
                            </div>
                            <div style={{ padding: '1rem', background: 'var(--card-bg)', border: '1px solid var(--border-color)', borderRadius: '0.5rem', gridColumn: '1 / -1' }}>
                                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: '0.25rem' }}>Dirección</div>
                                <div style={{ fontSize: '1rem', color: 'var(--text-primary)' }}>{empresa.direccion || '-'}</div>
                            </div>
                        </div>
                    </div>

                    {/* Estadísticas */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem', marginBottom: '2rem' }}>
                        <div style={{ padding: '1.25rem', background: 'var(--card-bg)', border: '1px solid var(--border-color)', borderRadius: '0.5rem', textAlign: 'center' }}>
                            <div style={{ fontSize: '1.5rem', fontWeight: '700', color: primaryColor }}>{empresa.areas?.length || 0}</div>
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Áreas</div>
                        </div>
                        <div style={{ padding: '1.25rem', background: 'var(--card-bg)', border: '1px solid var(--border-color)', borderRadius: '0.5rem', textAlign: 'center' }}>
                            <div style={{ fontSize: '1.5rem', fontWeight: '700', color: '#22c55e' }}>
                                {empresa.areas?.reduce((acc, area) => acc + (area.departamentos?.length || 0), 0) || 0}
                            </div>
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Departamentos</div>
                        </div>
                        <div style={{ padding: '1.25rem', background: 'var(--card-bg)', border: '1px solid var(--border-color)', borderRadius: '0.5rem', textAlign: 'center' }}>
                            <div style={{ fontSize: '1.5rem', fontWeight: '700', color: '#3b82f6' }}>
                                {empresa.areas?.reduce((acc, area) => acc + (area.departamentos?.reduce((acc2, depto) => acc2 + (depto.puestos?.length || 0), 0) || 0), 0) || 0}
                            </div>
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Puestos</div>
                        </div>
                    </div>

                    {/* Estructura Jerárquica */}
                    <div style={{ background: 'var(--card-bg)', border: '1px solid var(--border-color)', borderRadius: '0.75rem', padding: '1.5rem' }}>
                        <h4 style={{ fontSize: '1rem', fontWeight: '600', color: 'var(--text-primary)', marginBottom: '1.5rem' }}>
                            Estructura Jerárquica
                        </h4>

                        {!empresa.areas || empresa.areas.length === 0 ? (
                            <p style={{ textAlign: 'center', color: 'var(--text-secondary)', padding: '2rem' }}>Sin estructura definida</p>
                        ) : (
                            <div style={{ paddingLeft: '1rem' }}>
                                {empresa.areas.map((area, areaIndex) => (
                                    <div key={area.id} style={{ position: 'relative', paddingLeft: '1.5rem', marginBottom: areaIndex === empresa.areas.length - 1 ? 0 : '1.5rem' }}>
                                        <div style={{ position: 'absolute', left: 0, top: '0.75rem', bottom: area.departamentos?.length > 0 ? '0.75rem' : 0, width: '2px', background: primaryColor }} />
                                        <div style={{ position: 'absolute', left: 0, top: '0.75rem', width: '1rem', height: '2px', background: primaryColor }} />

                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.75rem' }}>
                                            <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: primaryColor, flexShrink: 0 }} />
                                            <span style={{ fontWeight: '600', color: 'var(--text-primary)', fontSize: '1rem' }}>{area.nombre}</span>
                                            <span style={{ fontSize: '0.75rem', padding: '0.25rem 0.75rem', background: `${primaryColor}15`, color: primaryColor, borderRadius: '1rem', fontWeight: '500' }}>
                                                {area.departamentos?.length || 0} Depto(s)
                                            </span>
                                        </div>

                                        {area.departamentos?.map((depto, deptoIndex) => (
                                            <div key={depto.id} style={{ position: 'relative', paddingLeft: '2rem', marginBottom: deptoIndex === area.departamentos.length - 1 ? 0 : '0.75rem' }}>
                                                {depto.puestos?.length > 0 && (
                                                    <div style={{ position: 'absolute', left: '1rem', top: '0.5rem', bottom: '0.5rem', width: '2px', background: '#22c55e' }} />
                                                )}
                                                <div style={{ position: 'absolute', left: 0, top: '0.5rem', width: '1.5rem', height: '2px', background: '#22c55e' }} />

                                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: depto.puestos?.length > 0 ? '0.5rem' : 0 }}>
                                                    <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#22c55e', flexShrink: 0 }} />
                                                    <span style={{ fontWeight: '500', color: 'var(--text-primary)' }}>{depto.nombre}</span>
                                                    <span style={{ fontSize: '0.75rem', padding: '0.125rem 0.5rem', background: '#22c55e20', color: '#22c55e', borderRadius: '1rem' }}>
                                                        {depto.puestos?.length || 0} Puesto(s)
                                                    </span>
                                                </div>

                                                {depto.puestos?.map((puesto, puestoIndex) => (
                                                    <div key={puesto.id} style={{ position: 'relative', paddingLeft: '2rem', marginBottom: puestoIndex === depto.puestos.length - 1 ? 0 : '0.25rem' }}>
                                                        <div style={{ position: 'absolute', left: '0.5rem', top: '0.5rem', width: '1rem', height: '2px', background: 'var(--text-secondary)', opacity: 0.3 }} />
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                            <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--text-secondary)', opacity: 0.5, flexShrink: 0 }} />
                                                            <span style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>{puesto.nombre}</span>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        ))}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Botón Cerrar */}
                    <div className="form-actions">
                        <button className="btn btn-secondary" onClick={onClose}>Cerrar</button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default EmpresaDetail;
