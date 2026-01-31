import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const NovedadForm = () => {
    const navigate = useNavigate();
    const [empleados, setEmpleados] = useState([]);
    const [formData, setFormData] = useState({
        empleadoId: '',
        tipo: 'AUSENCIA',
        fecha: new Date().toISOString().slice(0, 10),
        cantidad: 1,
        observaciones: ''
    });
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        fetchEmpleados();
    }, []);

    const fetchEmpleados = async () => {
        try {
            const response = await fetch('/api/empleados');
            if (response.ok) {
                const data = await response.json();
                setEmpleados(Array.isArray(data) ? data : (data.data || []));
            }
        } catch (err) {
            console.error(err);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const response = await fetch('/api/novedades', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });

            if (response.ok) {
                navigate('/liquidaciones/novedades');
            } else {
                alert('Error al guardar');
            }
        } catch (err) {
            console.error(err);
            alert('Error al guardar');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{ maxWidth: '600px', margin: '0 auto' }}>
            <div className="page-header">
                <h1 className="page-title">Registrar Novedad</h1>
            </div>

            <div className="card">
                <form onSubmit={handleSubmit}>
                    <div className="form-group" style={{ marginBottom: '1rem' }}>
                        <label className="form-label">Empleado</label>
                        <select
                            className="form-select"
                            value={formData.empleadoId}
                            onChange={(e) => setFormData({ ...formData, empleadoId: e.target.value })}
                            required
                        >
                            <option value="">Seleccione un empleado</option>
                            {Array.isArray(empleados) && empleados.map(emp => (
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
                            <option value="AUSENCIA">Ausencia</option>
                            <option value="HORA_EXTRA">Hora Extra</option>
                            <option value="LLEGADA_TARDE">Llegada Tarde</option>
                            <option value="BONO">Bono / Gratificación</option>
                            <option value="ADELANTO">Adelanto de Sueldo</option>
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

                    <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                        <label className="form-label">Observaciones</label>
                        <textarea
                            className="form-input"
                            value={formData.observaciones}
                            onChange={(e) => setFormData({ ...formData, observaciones: e.target.value })}
                            rows="3"
                        />
                    </div>

                    <div className="form-actions">
                        <button
                            type="button"
                            onClick={() => navigate('/liquidaciones/novedades')}
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
                            {loading ? 'Guardando...' : 'Guardar'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default NovedadForm;
