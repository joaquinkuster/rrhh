import React, { useState, useEffect } from 'react';

const NovedadModal = ({ novedad, onClose, onSuccess }) => {
    const isEditing = !!novedad;
    const [empleados, setEmpleados] = useState([]);
    const [formData, setFormData] = useState({
        empleadoId: '',
        tipo: 'LICENCIA',
        fecha: new Date().toISOString().slice(0, 10),
        cantidad: 1,
        observaciones: ''
    });
    const [loading, setLoading] = useState(false);
    const [loadingEmpleados, setLoadingEmpleados] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        fetchEmpleados();
        if (novedad) {
            setFormData({
                empleadoId: novedad.empleadoId,
                tipo: novedad.tipo,
                fecha: new Date(novedad.fecha).toISOString().slice(0, 10),
                cantidad: novedad.cantidad,
                observaciones: novedad.observaciones || ''
            });
        }
    }, [novedad]);

    const fetchEmpleados = async () => {
        try {
            const response = await fetch('/api/empleados?activo=true');
            if (response.ok) {
                const data = await response.json();
                setEmpleados(Array.isArray(data) ? data : (data.data || []));
            }
        } catch (err) {
            console.error(err);
        } finally {
            setLoadingEmpleados(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const url = isEditing ? `/api/novedades/${novedad.id}` : '/api/novedades';
            const method = isEditing ? 'PUT' : 'POST';

            const response = await fetch(url, {
                method: method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });

            if (response.ok) {
                onSuccess();
            } else {
                const data = await response.json();
                setError(data.message || 'Error al guardar');
            }
        } catch (err) {
            console.error(err);
            setError('Error al guardar');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: '600px' }}>
                <div className="modal-header">
                    <h2 className="modal-title">{isEditing ? 'Editar Novedad' : 'Nueva Novedad'}</h2>
                    <button className="modal-close" onClick={onClose}>
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" style={{ width: 24, height: 24 }}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                <div className="modal-body" style={{ padding: '2rem' }}>
                    {error && <div className="alert alert-error" style={{ marginBottom: '1rem' }}>{error}</div>}

                    <form id="novedad-form" onSubmit={handleSubmit}>
                        <div className="form-group" style={{ marginBottom: '1rem' }}>
                            <label className="form-label">Empleado</label>
                            <select
                                className="form-select"
                                value={formData.empleadoId}
                                onChange={(e) => setFormData({ ...formData, empleadoId: e.target.value })}
                                required
                                disabled={loadingEmpleados}
                            >
                                <option value="">Seleccione un empleado</option>
                                {empleados.map(emp => (
                                    <option key={emp.id} value={emp.id}>
                                        {emp.apellido}, {emp.nombre}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div className="form-group" style={{ marginBottom: '1rem' }}>
                            <label className="form-label">Tipo</label>
                            <select
                                className="form-select"
                                value={formData.tipo}
                                onChange={(e) => setFormData({ ...formData, tipo: e.target.value })}
                            >
                                <option value="LICENCIA">Licencia / Inasistencia</option>
                                <option value="VACACIONES">Vacaciones</option>
                                <option value="RENUNCIA">Renuncia</option>
                            </select>
                        </div>

                        <div className="form-group" style={{ marginBottom: '1rem' }}>
                            <label className="form-label">Fecha</label>
                            <input
                                type="date"
                                className="form-input"
                                value={formData.fecha}
                                onChange={(e) => setFormData({ ...formData, fecha: e.target.value })}
                                required
                            />
                        </div>

                        <div className="form-group" style={{ marginBottom: '1rem' }}>
                            <label className="form-label">Cantidad / Monto</label>
                            <input
                                type="number"
                                step="0.01"
                                className="form-input"
                                value={formData.cantidad}
                                onChange={(e) => setFormData({ ...formData, cantidad: e.target.value })}
                                required
                            />
                        </div>

                        <div className="form-group">
                            <label className="form-label">Observaciones</label>
                            <textarea
                                className="form-input"
                                value={formData.observaciones}
                                onChange={(e) => setFormData({ ...formData, observaciones: e.target.value })}
                                rows="3"
                            />
                        </div>
                    </form>
                </div>

                <div className="modal-footer" style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', padding: '1.5rem 2rem', borderTop: '1px solid var(--border-color)' }}>
                    <button type="button" className="btn btn-secondary" onClick={onClose} disabled={loading}>
                        Cancelar
                    </button>
                    <button type="submit" form="novedad-form" className="btn btn-primary" disabled={loading}>
                        {loading ? 'Guardando...' : 'Guardar'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default NovedadModal;
