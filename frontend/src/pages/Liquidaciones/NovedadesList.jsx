import React, { useState, useEffect } from 'react';
import NovedadModal from './NovedadModal';
import LiquidacionTabs from '../../components/LiquidacionTabs';

const NovedadesList = () => {
    const [novedades, setNovedades] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [showModal, setShowModal] = useState(false);
    const [editingItem, setEditingItem] = useState(null);

    const [search, setSearch] = useState('');
    const [filterTipo, setFilterTipo] = useState('');

    useEffect(() => {
        fetchNovedades();
    }, []);

    const fetchNovedades = async () => {
        try {
            setLoading(true);
            const response = await fetch('/api/novedades');
            if (response.ok) {
                const data = await response.json();
                setNovedades(data);
            } else {
                throw new Error('Error al cargar novedades');
            }
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('¿Está seguro de eliminar esta novedad?')) return;

        try {
            const response = await fetch(`/api/novedades/${id}`, {
                method: 'DELETE'
            });
            if (response.ok) {
                fetchNovedades();
            }
        } catch (err) {
            alert('Error al eliminar');
        }
    };

    const handleCreate = () => {
        setEditingItem(null);
        setShowModal(true);
    };

    const handleEdit = (item) => {
        setEditingItem(item);
        setShowModal(true);
    };

    const handleModalSuccess = () => {
        setShowModal(false);
        fetchNovedades();
    };

    // Filtering Logic
    const filteredItems = novedades.filter(item => {
        const matchesSearch = search === '' ||
            (item.empleado && (
                item.empleado.nombre.toLowerCase().includes(search.toLowerCase()) ||
                item.empleado.apellido.toLowerCase().includes(search.toLowerCase())
            ));
        const matchesTipo = filterTipo === '' || item.tipo === filterTipo;

        return matchesSearch && matchesTipo;
    });

    const clearFilters = () => {
        setSearch('');
        setFilterTipo('');
    };

    const hasActiveFilters = search !== '' || filterTipo !== '';

    if (loading) return <div className="loading"><div className="spinner"></div></div>;

    return (
        <div>
            <div className="page-header">
                <div>
                    <h1 className="page-title">Novedades</h1>
                    <p className="page-subtitle">Gestión de horas extras, ausencias y otros conceptos</p>
                </div>
            </div>

            <LiquidacionTabs />

            {error && <div className="alert alert-error">{error}</div>}

            <div className="card">
                <div className="card-header">
                    <div className="header-left">
                        <h3 className="card-title">Listado de Novedades</h3>
                    </div>
                    <div className="header-actions">
                        <button className="btn btn-primary" onClick={handleCreate}>
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" style={{ width: 20, height: 20 }}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                            </svg>
                            Nueva Novedad
                        </button>
                    </div>
                </div>

                {/* Filters */}
                <div className="filters-bar" style={{ padding: '1rem', borderBottom: '1px solid var(--neutral-200)', display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center', backgroundColor: 'var(--neutral-50)' }}>
                    <div className="filter-group">
                        <input
                            type="text"
                            className="filter-input form-input"
                            placeholder="Buscar por empleado..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            style={{ minWidth: '250px' }}
                        />
                    </div>
                    <div className="filter-group">
                        <select
                            className="filter-input form-select"
                            value={filterTipo}
                            onChange={(e) => setFilterTipo(e.target.value)}
                        >
                            <option value="">Todos los tipos</option>
                            <option value="LICENCIA">Licencia / Inasistencia</option>
                            <option value="VACACIONES">Vacaciones</option>
                            <option value="RENUNCIA">Renuncia</option>
                        </select>
                    </div>
                    {hasActiveFilters && (
                        <button className="btn btn-secondary btn-sm" onClick={clearFilters}>
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" style={{ width: 16, height: 16 }}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                            Limpiar
                        </button>
                    )}
                </div>

                <div className="table-container">
                    <table className="table">
                        <thead>
                            <tr>
                                <th>Fecha</th>
                                <th>Empleado</th>
                                <th>Tipo</th>
                                <th>Cantidad</th>
                                <th>Observaciones</th>
                                <th>Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredItems.map(nov => (
                                <tr key={nov.id}>
                                    <td>{new Date(nov.fecha).toLocaleDateString()}</td>
                                    <td>{nov.empleado ? `${nov.empleado.apellido}, ${nov.empleado.nombre}` : '-'}</td>
                                    <td>
                                        <span className="badge badge-secondary">{nov.tipo}</span>
                                    </td>
                                    <td>{nov.cantidad}</td>
                                    <td>{nov.observaciones}</td>
                                    <td>
                                        <div className="table-actions">
                                            <button
                                                onClick={() => handleEdit(nov)}
                                                className="btn btn-warning btn-sm"
                                                title="Editar"
                                            >
                                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" style={{ width: 16, height: 16 }}>
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
                                                </svg>
                                                Editar
                                            </button>
                                            <button
                                                onClick={() => handleDelete(nov.id)}
                                                className="btn btn-danger btn-sm"
                                                title="Eliminar"
                                            >
                                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" style={{ width: 16, height: 16 }}>
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                                                </svg>
                                                Eliminar
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {filteredItems.length === 0 && (
                                <tr>
                                    <td colSpan="6" style={{ textAlign: 'center', padding: '2rem' }}>
                                        <div className="empty-state">
                                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v6m3-3H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                                            </svg>
                                            <h3>No hay novedades {hasActiveFilters ? 'que coincidan' : 'registradas'}</h3>
                                            <p>{hasActiveFilters ? 'Intenta ajustar los filtros' : 'Crea una nueva novedad para comenzar'}</p>
                                        </div>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {showModal && (
                <NovedadModal
                    novedad={editingItem}
                    onClose={() => setShowModal(false)}
                    onSuccess={handleModalSuccess}
                />
            )}
        </div>
    );
};

export default NovedadesList;
