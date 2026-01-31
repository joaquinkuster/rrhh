import React, { useState, useEffect } from 'react';

const DocumentacionModal = ({ onClose, onSuccess }) => {
    const [liquidaciones, setLiquidaciones] = useState([]);
    const [formData, setFormData] = useState({
        liquidacionId: '',
        tipo: 'FACTURA',
        numero: '',
        archivoUrl: '' // Simulado por ahora
    });
    const [loading, setLoading] = useState(false);
    const [loadingLiquidaciones, setLoadingLiquidaciones] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        fetchLiquidaciones();
    }, []);

    const fetchLiquidaciones = async () => {
        try {
            const response = await fetch('/api/liquidaciones?estado=GENERADO');
            if (response.ok) {
                const data = await response.json();
                setLiquidaciones(data);
            }
        } catch (err) {
            console.error(err);
        } finally {
            setLoadingLiquidaciones(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const response = await fetch('/api/documentacion-pagos', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });

            if (response.ok) {
                onSuccess();
            } else {
                const data = await response.json();
                setError(data.message || 'Error al subir documentación');
            }
        } catch (err) {
            console.error(err);
            setError('Error al subir documentación');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: '600px' }}>
                <div className="modal-header">
                    <h2 className="modal-title">Subir Documentación</h2>
                    <button className="modal-close" onClick={onClose}>
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" style={{ width: 24, height: 24 }}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                <div className="modal-body" style={{ padding: '2rem' }}>
                    {error && <div className="alert alert-error" style={{ marginBottom: '1rem' }}>{error}</div>}

                    <form id="doc-form" onSubmit={handleSubmit}>
                        <div className="form-group" style={{ marginBottom: '1rem' }}>
                            <label className="form-label">Liquidación Asociada</label>
                            <select
                                className="form-select"
                                value={formData.liquidacionId}
                                onChange={(e) => setFormData({ ...formData, liquidacionId: e.target.value })}
                                required
                                disabled={loadingLiquidaciones}
                            >
                                <option value="">Seleccione una liquidación</option>
                                {liquidaciones.map(liq => (
                                    <option key={liq.id} value={liq.id}>
                                        {liq.empleado ? `${liq.empleado.apellido}, ${liq.empleado.nombre}` : 'Empleado'} - {liq.periodo} (${liq.totalNeto})
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div className="form-group" style={{ marginBottom: '1rem' }}>
                            <label className="form-label">Tipo de Documento</label>
                            <select
                                className="form-select"
                                value={formData.tipo}
                                onChange={(e) => setFormData({ ...formData, tipo: e.target.value })}
                            >
                                <option value="FACTURA">Factura C (Monotributo)</option>
                                <option value="RECIBO">Recibo de Pago</option>
                                <option value="COMPROBANTE">Comprobante de Transferencia</option>
                            </select>
                        </div>

                        <div className="form-group" style={{ marginBottom: '1rem' }}>
                            <label className="form-label">Número de Comprobante</label>
                            <input
                                type="text"
                                className="form-input"
                                value={formData.numero}
                                onChange={(e) => setFormData({ ...formData, numero: e.target.value })}
                                required
                                placeholder="Ej: 00001-00000123"
                            />
                        </div>

                        <div className="form-group">
                            <label className="form-label">URL del Archivo (Simulado)</label>
                            <input
                                type="text"
                                className="form-input"
                                value={formData.archivoUrl}
                                onChange={(e) => setFormData({ ...formData, archivoUrl: e.target.value })}
                                placeholder="https://ejemplo.com/factura.pdf"
                            />
                            <small style={{ color: 'var(--neutral-500)', display: 'block', marginTop: '0.5rem' }}>
                                * En una implementación real, aquí iría un input file real.
                            </small>
                        </div>
                    </form>
                </div>

                <div className="modal-footer" style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', padding: '1.5rem 2rem', borderTop: '1px solid var(--border-color)' }}>
                    <button type="button" className="btn btn-secondary" onClick={onClose} disabled={loading}>
                        Cancelar
                    </button>
                    <button type="submit" form="doc-form" className="btn btn-primary" disabled={loading}>
                        {loading ? 'Subiendo...' : 'Subir Documento'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default DocumentacionModal;
