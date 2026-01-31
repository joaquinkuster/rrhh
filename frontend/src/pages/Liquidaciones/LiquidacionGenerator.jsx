import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import LiquidacionTable from '../../components/LiquidacionTable';

const LiquidacionGenerator = () => {
    const navigate = useNavigate();
    const [empleados, setEmpleados] = useState([]);
    const [formData, setFormData] = useState({
        empleadoId: '', // Optional now
        periodo: new Date().toISOString().slice(0, 7) // YYYY-MM
    });
    const [preview, setPreview] = useState(null); // Can be single object or array
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [mode, setMode] = useState('single'); // 'single' or 'mass'

    useEffect(() => {
        fetchEmpleados();
    }, []);

    const fetchEmpleados = async () => {
        try {
            const response = await fetch(`/api/empleados`);
            if (response.ok) {
                const data = await response.json();
                const allEmpleados = Array.isArray(data) ? data : (data.data || []);
                const empleadosLiquidables = allEmpleados.filter(emp => {
                    return emp.contratos && emp.contratos.some(c => c.activo && c.tipoContrato !== 'LOCACION');
                });
                setEmpleados(empleadosLiquidables.length > 0 ? empleadosLiquidables : allEmpleados);
            }
        } catch (err) {
            console.error('Error fetching empleados:', err);
        }
    };

    const handleCalculate = async (e) => {
        if (e) e.preventDefault();
        setLoading(true);
        setError(null);
        setPreview(null);

        const endpoint = mode === 'mass' ? '/api/liquidaciones/masivo/calcular' : '/api/liquidaciones/calcular';

        try {
            const response = await fetch(endpoint, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Error al calcular');
            }

            if (mode === 'mass' && Array.isArray(data) && data.length === 0) {
                setError('No hay empleados pendientes de liquidación para este período.');
                setPreview(null);
            } else {
                setPreview(data);
            }

        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        if (!preview) return;
        setLoading(true);

        const endpoint = mode === 'mass' ? '/api/liquidaciones/masivo/crear' : '/api/liquidaciones/crear';
        const body = mode === 'mass'
            ? { liquidaciones: preview }
            : {
                empleadoId: formData.empleadoId,
                periodo: formData.periodo,
                detalles: preview.detalles,
                totales: preview.totales,
                tipo: preview.tipo
            };

        try {
            const response = await fetch(endpoint, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body)
            });

            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.message || 'Error al guardar');
            }

            navigate('/liquidaciones');
        } catch (err) {
            setError(err.message);
            setLoading(false);
        }
    };

    // Helper to organize data for Sabana View
    const getSabanaData = (liquidaciones) => {
        if (!Array.isArray(liquidaciones)) return null;

        // 1. Collect all unique concept names
        const allConcepts = new Set();
        liquidaciones.forEach(liq => {
            liq.detalles.forEach(d => allConcepts.add(d.conceptoNombre));
        });

        // Define fixed order matching the Excel
        const remunerativeOrder = ['Sueldo Básico', 'Antigüedad', 'Presentismo'];
        const deductionsOrder = ['Jubilación', 'Obra Social', 'PAMI', 'Cuota Sindical'];

        // Find any other concepts not in the fixed lists
        const otherRemunerative = Array.from(allConcepts).filter(c =>
            !remunerativeOrder.includes(c) &&
            !deductionsOrder.includes(c) &&
            liquidaciones.some(l => l.detalles.some(d => d.conceptoNombre === c && d.tipo === 'remunerativo'))
        );

        const otherDeductions = Array.from(allConcepts).filter(c =>
            !remunerativeOrder.includes(c) &&
            !deductionsOrder.includes(c) &&
            liquidaciones.some(l => l.detalles.some(d => d.conceptoNombre === c && d.tipo === 'deduccion'))
        );

        const rows = [
            ...remunerativeOrder,
            ...otherRemunerative,
            'TOTAL BRUTO',
            'RETENCIONES', // Section Header
            ...deductionsOrder,
            ...otherDeductions,
            'TOTAL RET.',
            'NETO A COBRAR'
        ];

        return { rows, cols: liquidaciones };
    };

    const renderSabana = () => {
        const { rows, cols } = getSabanaData(preview);

        // Helper to get percentage label
        const getPercentage = (rowLabel) => {
            if (rowLabel === 'Jubilación') return '11%';
            if (rowLabel === 'Obra Social') return '3%';
            if (rowLabel === 'PAMI') return '3%';
            if (rowLabel === 'Cuota Sindical') return '2.5%';
            return '';
        };

        return (
            <div className="table-container" style={{ overflowX: 'auto', padding: '1rem', background: '#e0e0e0' }}>
                <div style={{ background: 'white', padding: '1rem', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
                    <div style={{ textAlign: 'center', marginBottom: '1rem', fontWeight: 'bold', fontSize: '1.2em' }}>
                        {formData.periodo}
                    </div>
                    <table className="table table-bordered" style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem', fontFamily: 'Arial, sans-serif' }}>
                        <thead>
                            <tr style={{ background: '#0070c0', color: 'white' }}>
                                <th style={{ width: '50px', border: '1px solid #999' }}></th> {/* Percentage Col */}
                                <th style={{ textAlign: 'left', border: '1px solid #999', padding: '8px' }}>EMPLEADO</th>
                                {cols.map(liq => (
                                    <th key={liq.empleado.id} style={{ textAlign: 'right', border: '1px solid #999', padding: '8px', minWidth: '120px' }}>
                                        {liq.empleado.apellido.toUpperCase()} {liq.empleado.nombre.charAt(0).toUpperCase()}.
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {rows.map(rowLabel => {
                                const isTotalBruto = rowLabel === 'TOTAL BRUTO';
                                const isTotalRet = rowLabel === 'TOTAL RET.';
                                const isNeto = rowLabel === 'NETO A COBRAR';
                                const isHeader = rowLabel === 'RETENCIONES';

                                const percentage = getPercentage(rowLabel);

                                let rowStyle = { borderBottom: '1px solid #ccc' };
                                let cellStyle = { border: '1px solid #ccc', padding: '4px 8px' };
                                let labelStyle = { ...cellStyle, textAlign: 'left' };

                                if (isHeader) {
                                    return (
                                        <tr key={rowLabel} style={{ background: '#f0f0f0', fontWeight: 'bold' }}>
                                            <td style={cellStyle}></td>
                                            <td style={labelStyle}>RETENCIONES</td>
                                            {cols.map(liq => <td key={liq.empleado.id} style={cellStyle}></td>)}
                                        </tr>
                                    );
                                }

                                if (isTotalBruto || isTotalRet || isNeto) {
                                    rowStyle = { fontWeight: 'bold', background: isNeto ? 'white' : '#f9f9f9' };
                                    if (isNeto) labelStyle = { ...labelStyle, fontSize: '1.1em', border: '2px solid #000' };
                                }

                                return (
                                    <tr key={rowLabel} style={rowStyle}>
                                        <td style={{ ...cellStyle, textAlign: 'right', color: '#666', fontSize: '0.85em' }}>
                                            {percentage}
                                        </td>
                                        <td style={isNeto ? { ...labelStyle, border: '2px solid #000', borderRight: '1px solid #ccc' } : labelStyle}>
                                            {rowLabel}
                                        </td>
                                        {cols.map(liq => {
                                            let value = '';
                                            let style = { ...cellStyle, textAlign: 'right' };

                                            if (isTotalBruto) {
                                                value = liq.totales.bruto;
                                            } else if (isTotalRet) {
                                                value = liq.totales.deducciones;
                                            } else if (isNeto) {
                                                value = liq.totales.neto;
                                                style = { ...style, fontWeight: 'bold', fontSize: '1.1em', border: '2px solid #000', borderLeft: '1px solid #ccc' };
                                            } else {
                                                const detalle = liq.detalles.find(d => d.conceptoNombre === rowLabel);
                                                if (detalle) {
                                                    value = parseFloat(detalle.monto).toFixed(2);
                                                }
                                            }

                                            return (
                                                <td key={liq.empleado.id} style={style}>
                                                    {value ? value : ''}
                                                </td>
                                            );
                                        })}
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>
        );
    };

    return (
        <div>
            <div className="page-header">
                <div>
                    <h1 className="page-title">Generar Liquidación</h1>
                    <p className="page-subtitle">Calcula y registra nuevas liquidaciones de sueldo</p>
                </div>
            </div>

            <div className="card" style={{ marginBottom: '2rem' }}>
                <div className="card-header">
                    <h3 className="card-title">Configuración</h3>
                    <div style={{ display: 'flex', gap: '1rem' }}>
                        <button
                            className={`btn ${mode === 'single' ? 'btn-primary' : 'btn-secondary'}`}
                            onClick={() => { setMode('single'); setPreview(null); }}
                        >
                            Individual
                        </button>
                        <button
                            className={`btn ${mode === 'mass' ? 'btn-primary' : 'btn-secondary'}`}
                            onClick={() => { setMode('mass'); setPreview(null); }}
                        >
                            Masiva (Todos)
                        </button>
                    </div>
                </div>

                <div style={{ padding: '1.5rem' }}>
                    <form onSubmit={handleCalculate} style={{ display: 'flex', gap: '1rem', alignItems: 'flex-end' }}>
                        {mode === 'single' && (
                            <div className="form-group" style={{ flex: 1 }}>
                                <label className="form-label">Empleado</label>
                                <select
                                    className="form-select"
                                    value={formData.empleadoId}
                                    onChange={(e) => setFormData({ ...formData, empleadoId: e.target.value })}
                                    required={mode === 'single'}
                                >
                                    <option value="">Seleccione un empleado</option>
                                    {Array.isArray(empleados) && empleados.map(emp => (
                                        <option key={emp.id} value={emp.id}>
                                            {emp.apellido}, {emp.nombre} ({emp.cuil})
                                        </option>
                                    ))}
                                </select>
                            </div>
                        )}

                        <div className="form-group" style={{ width: '250px' }}>
                            <label className="form-label">Fecha de emisión del sueldo</label>
                            <input
                                type="month"
                                className="form-input"
                                value={formData.periodo}
                                onChange={(e) => setFormData({ ...formData, periodo: e.target.value })}
                                required
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="btn btn-primary"
                            style={{ height: '42px' }}
                        >
                            {loading ? 'Calculando...' : (mode === 'mass' ? 'Calcular Todo' : 'Calcular')}
                        </button>
                    </form>
                    {error && <div className="alert alert-error" style={{ marginTop: '1rem' }}>{error}</div>}
                </div>
            </div>

            {/* Previsualización Modal */}
            {preview && (
                <div className="modal-overlay" style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                    backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000
                }}>
                    <div className="modal-content" style={{
                        backgroundColor: 'white', padding: '2rem', borderRadius: '8px',
                        maxWidth: '900px', width: '90%', maxHeight: '90vh', overflowY: 'auto', position: 'relative',
                        boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
                    }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', borderBottom: '1px solid #eee', paddingBottom: '1rem' }}>
                            <h3 className="card-title" style={{ margin: 0 }}>Vista Previa de Liquidación</h3>
                            <button
                                onClick={() => setPreview(null)}
                                style={{ background: 'transparent', border: 'none', fontSize: '1.5rem', cursor: 'pointer', color: '#666' }}
                            >
                                ×
                            </button>
                        </div>

                        <div style={{ padding: '0 0 1.5rem 0' }}>
                            {/* Header Info - Only for Mass view or if needed, but LiquidacionTable handles it for Single */}
                            {/* Actually LiquidacionTable handles employee info internally for single view. 
                            For Mass view (Sabana), renderSabana handles it. 
                        */}

                            {mode === 'mass' ? renderSabana() : (
                                <LiquidacionTable
                                    empleado={preview.empleado}
                                    periodo={preview.periodo}
                                    detalles={preview.detalles}
                                    totales={preview.totales}
                                />
                            )}
                        </div>

                        <div className="form-actions" style={{ justifyContent: 'flex-end', gap: '1rem', borderTop: '1px solid #eee', paddingTop: '1rem' }}>
                            <button
                                type="button"
                                onClick={() => setPreview(null)}
                                className="btn btn-secondary"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={handleSave}
                                disabled={loading}
                                className="btn btn-success"
                            >
                                {loading ? 'Guardando...' : 'Confirmar y Guardar'}
                            </button>
                        </div>
                    </div>
                </div>
            )}</div>
    );
};

export default LiquidacionGenerator;
