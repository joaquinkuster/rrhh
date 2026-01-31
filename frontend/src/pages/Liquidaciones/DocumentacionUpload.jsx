import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const DocumentacionUpload = () => {
    const navigate = useNavigate();
    const [liquidaciones, setLiquidaciones] = useState([]);
    const [formData, setFormData] = useState({
        liquidacionId: '',
        tipo: 'FACTURA',
        numero: '',
        archivoUrl: '' // Simulado por ahora
    });
    const [loading, setLoading] = useState(false);

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
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const response = await fetch('/api/documentacion-pagos', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });

            if (response.ok) {
                navigate('/liquidaciones/documentacion');
            } else {
                alert('Error al subir documentación');
            }
        } catch (err) {
            console.error(err);
            alert('Error al subir documentación');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{ maxWidth: '600px', margin: '0 auto' }}>
            <div className="page-header">
                <h1 className="page-title">Subir Documentación</h1>
            </div>

            <div className="card">
                <form onSubmit={handleSubmit}>
                    <div className="form-group" style={{ marginBottom: '1rem' }}>
                        <label className="form-label">Liquidación Asociada</label>
                        <select
                            className="form-select"
                            value={formData.liquidacionId}
                            onChange={(e) => setFormData({ ...formData, liquidacionId: e.target.value })}
                            required
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

                    <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                        <label className="form-label">URL del Archivo (Simulado)</label>
                        <input
                            type="text"
                            className="form-input"
                            value={formData.archivoUrl}
                            onChange={(e) => setFormData({ ...formData, archivoUrl: e.target.value })}
                            placeholder="https://ejemplo.com/factura.pdf"
                        />
                        <small style={{ color: 'var(--neutral-500)' }}>
                            * En una implementación real, aquí iría un input file real.
                        </small>
                    </div>

                    <div className="form-actions">
                        <button
                            type="button"
                            onClick={() => navigate('/liquidaciones/documentacion')}
                            className="btn btn-secondary"
                            style={{ flex: 1 }}
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            className="btn btn-primary"
                            disabled={loading}
                            style={{ flex: 1 }}
                        >
                            {loading ? 'Subiendo...' : 'Subir Documento'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default DocumentacionUpload;
