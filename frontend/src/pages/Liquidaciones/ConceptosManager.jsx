import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

const ConceptosManager = () => {
    const [conceptos, setConceptos] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [editingId, setEditingId] = useState(null);

    // Form state
    const [formData, setFormData] = useState({
        nombre: '',
        tipo: 'remunerativo',
        esPorcentaje: true,
        valor: '',
        formula: ''
    });

    useEffect(() => {
        fetchConceptos();
    }, []);

    const fetchConceptos = async () => {
        try {
            const response = await fetch(`/api/conceptos`);
            if (response.ok) {
                const data = await response.json();
                setConceptos(data);
            }
        } catch (err) {
            setError('Error al cargar conceptos');
        } finally {
            setLoading(false);
        }
    };

    const handleInputChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData({
            ...formData,
            [name]: type === 'checkbox' ? checked : value
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const url = editingId
                ? `/api/conceptos/${editingId}`
                : `/api/conceptos`;

            const method = editingId ? 'PUT' : 'POST';

            const response = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });

            if (!response.ok) throw new Error('Error al guardar concepto');

            await fetchConceptos();
            resetForm();
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleEdit = (concepto) => {
        setEditingId(concepto.id);
        setFormData({
            nombre: concepto.nombre,
            tipo: concepto.tipo,
            esPorcentaje: concepto.esPorcentaje,
            valor: concepto.valor,
            formula: concepto.formula || ''
        });
    };

    const handleDelete = async (id) => {
        if (!confirm('¿Está seguro de eliminar este concepto?')) return;

        try {
            const response = await fetch(`/api/conceptos/${id}`, {
                method: 'DELETE'
            });
            if (response.ok) {
                fetchConceptos();
            }
        } catch (err) {
            console.error(err);
        }
    };

    const handleInitialize = async () => {
        setLoading(true);
        try {
            const response = await fetch(`/api/conceptos/inicializar`, {
                method: 'POST'
            });
            if (response.ok) {
                fetchConceptos();
            } else {
                const data = await response.json();
                alert(data.message);
            }
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const resetForm = () => {
        setEditingId(null);
        setFormData({
            nombre: '',
            tipo: 'remunerativo',
            esPorcentaje: true,
            valor: '',
            formula: ''
        });
    };

    if (loading && conceptos.length === 0) return <div className="loading"><div className="spinner"></div></div>;

    return (
        <div>
            <div className="page-header">
                <div>
                    <h1 className="page-title">Configuración de Conceptos</h1>
                    <p className="page-subtitle">Administra los conceptos salariales para las liquidaciones</p>
                </div>
            </div>

            <div className="form-grid" style={{ gridTemplateColumns: '1fr 2fr' }}>
                {/* Formulario */}
                <div className="card">
                    <div className="card-header">
                        <h3 className="card-title">{editingId ? 'Editar Concepto' : 'Nuevo Concepto'}</h3>
                    </div>
                    <form onSubmit={handleSubmit}>
                        <div className="form-group" style={{ marginBottom: '1rem' }}>
                            <label className="form-label">Nombre</label>
                            <input
                                type="text"
                                name="nombre"
                                value={formData.nombre}
                                onChange={handleInputChange}
                                className="form-input"
                                required
                            />
                        </div>

                        <div className="form-group" style={{ marginBottom: '1rem' }}>
                            <label className="form-label">Tipo</label>
                            <select
                                name="tipo"
                                value={formData.tipo}
                                onChange={handleInputChange}
                                className="form-select"
                            >
                                <option value="remunerativo">Remunerativo</option>
                                <option value="no_remunerativo">No Remunerativo</option>
                                <option value="deduccion">Deducción</option>
                            </select>
                        </div>

                        <div className="form-group" style={{ marginBottom: '1rem' }}>
                            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                                <input
                                    type="checkbox"
                                    name="esPorcentaje"
                                    checked={formData.esPorcentaje}
                                    onChange={handleInputChange}
                                    style={{ width: '1.2rem', height: '1.2rem' }}
                                />
                                <span className="form-label" style={{ marginBottom: 0 }}>Es Porcentaje</span>
                            </label>
                        </div>

                        <div className="form-group" style={{ marginBottom: '1rem' }}>
                            <label className="form-label">Valor</label>
                            <input
                                type="number"
                                step="0.01"
                                name="valor"
                                value={formData.valor}
                                onChange={handleInputChange}
                                className="form-input"
                                required
                            />
                            <p style={{ fontSize: '0.8rem', color: 'var(--neutral-500)', marginTop: '0.25rem' }}>
                                {formData.esPorcentaje ? '% del Básico/Bruto' : 'Monto Fijo'}
                            </p>
                        </div>

                        <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                            <label className="form-label">Fórmula (Opcional)</label>
                            <select
                                name="formula"
                                value={formData.formula}
                                onChange={handleInputChange}
                                className="form-select"
                            >
                                <option value="">Ninguna (Fijo/Simple)</option>
                                <option value="BASICO">Sueldo Básico</option>
                                <option value="ANTIGUEDAD">Antigüedad</option>
                                <option value="PRESENTISMO">Presentismo</option>
                                <option value="BRUTO">Sobre Total Bruto</option>
                                <option value="JUBILACION">Jubilación (Bruto)</option>
                                <option value="OBRA_SOCIAL">Obra Social (Bruto)</option>
                                <option value="PAMI">PAMI (Bruto)</option>
                                <option value="SINDICAL">Cuota Sindical (Bruto)</option>
                            </select>
                        </div>

                        <div className="form-actions">
                            <button
                                type="submit"
                                disabled={loading}
                                className="btn btn-primary"
                                style={{ flex: 1 }}
                            >
                                {editingId ? 'Actualizar' : 'Guardar'}
                            </button>
                            {editingId && (
                                <button
                                    type="button"
                                    onClick={resetForm}
                                    className="btn btn-secondary"
                                >
                                    Cancelar
                                </button>
                            )}
                        </div>
                    </form>
                </div>

                {/* Lista */}
                <div className="card">
                    <div className="card-header">
                        <h3 className="card-title">Conceptos Activos</h3>
                        {conceptos.length === 0 && (
                            <button
                                onClick={handleInitialize}
                                className="btn btn-success btn-sm"
                            >
                                Cargar Defaults
                            </button>
                        )}
                    </div>

                    {conceptos.length === 0 && !loading ? (
                        <div className="empty-state">
                            <p>No hay conceptos configurados.</p>
                        </div>
                    ) : (
                        <div className="table-container">
                            <table className="table">
                                <thead>
                                    <tr>
                                        <th style={{ textAlign: 'left' }}>Nombre</th>
                                        <th style={{ textAlign: 'left' }}>Tipo</th>
                                        <th style={{ textAlign: 'left' }}>Valor</th>
                                        <th style={{ textAlign: 'left' }}>Fórmula</th>
                                        <th style={{ textAlign: 'right' }}>Acciones</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {/* Filter unique concepts by name to avoid duplicates in view */
                                        Object.values(
                                            conceptos.reduce((acc, current) => {
                                                if (!acc[current.nombre]) {
                                                    acc[current.nombre] = current;
                                                }
                                                return acc;
                                            }, {})
                                        ).map((c) => (
                                            <tr key={c.id}>
                                                <td style={{ textAlign: 'left', fontWeight: '500' }}>{c.nombre}</td>
                                                <td style={{ textAlign: 'left', textTransform: 'capitalize' }}>{c.tipo.replace('_', ' ')}</td>
                                                <td style={{ textAlign: 'left' }}>
                                                    {c.valor} {c.esPorcentaje ? '%' : ''}
                                                </td>
                                                <td style={{ textAlign: 'left', color: 'var(--neutral-500)' }}>{c.formula || '-'}</td>
                                                <td style={{ textAlign: 'right' }}>
                                                    <div className="table-actions" style={{ justifyContent: 'flex-end' }}>
                                                        <button
                                                            onClick={() => handleEdit(c)}
                                                            className="btn btn-warning btn-sm"
                                                            title="Editar"
                                                        >
                                                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" style={{ width: 16, height: 16 }}>
                                                                <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
                                                            </svg>
                                                        </button>
                                                        <button
                                                            onClick={() => handleDelete(c.id)}
                                                            className="btn btn-danger btn-sm"
                                                            title="Eliminar"
                                                        >
                                                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" style={{ width: 16, height: 16 }}>
                                                                <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                                                            </svg>
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>

            <div style={{ marginTop: '1.5rem' }}>
                <Link to="/liquidaciones" className="btn btn-secondary">
                    &larr; Volver a Liquidaciones
                </Link>
            </div>
        </div>
    );
};

export default ConceptosManager;
