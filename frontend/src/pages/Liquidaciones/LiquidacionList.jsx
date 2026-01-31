import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import LiquidacionTable from '../../components/LiquidacionTable';
import LiquidacionTabs from '../../components/LiquidacionTabs';

const LiquidacionList = () => {
    const [liquidaciones, setLiquidaciones] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [search, setSearch] = useState('');
    const [filterEstado, setFilterEstado] = useState('');
    const [filterPeriodo, setFilterPeriodo] = useState('');
    const [selectedIds, setSelectedIds] = useState(new Set());
    const [viewLiquidation, setViewLiquidation] = useState(null);

    useEffect(() => {
        fetchLiquidaciones();
    }, []);

    const fetchLiquidaciones = async () => {
        try {
            const response = await fetch(`/api/liquidaciones`);
            if (!response.ok) throw new Error('Error al cargar liquidaciones');
            const data = await response.json();
            setLiquidaciones(data);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const getEstadoBadge = (estado) => {
        switch (estado) {
            case 'PENDIENTE': return 'badge badge-secondary';
            case 'GENERADO': return 'badge badge-primary';
            case 'PAGADO': return 'badge badge-success';
            default: return 'badge badge-secondary';
        }
    };

    const handleSelectAll = (e) => {
        if (e.target.checked) {
            setSelectedIds(new Set(filteredItems.map(l => l.id)));
        } else {
            setSelectedIds(new Set());
        }
    };

    const handleSelectOne = (id) => {
        const newSelected = new Set(selectedIds);
        if (newSelected.has(id)) {
            newSelected.delete(id);
        } else {
            newSelected.add(id);
        }
        setSelectedIds(newSelected);
    };

    // Filtering Logic
    const filteredItems = liquidaciones.filter(item => {
        const matchesSearch = search === '' ||
            (item.empleado && (
                item.empleado.nombre.toLowerCase().includes(search.toLowerCase()) ||
                item.empleado.apellido.toLowerCase().includes(search.toLowerCase()) ||
                item.empleado.cuil.includes(search)
            ));
        const matchesEstado = filterEstado === '' || item.estado === filterEstado;
        const matchesPeriodo = filterPeriodo === '' || item.periodo.includes(filterPeriodo);

        return matchesSearch && matchesEstado && matchesPeriodo;
    });

    const allSelected = filteredItems.length > 0 && filteredItems.every(l => selectedIds.has(l.id));
    const someSelected = filteredItems.some(l => selectedIds.has(l.id)) && !allSelected;

    const clearFilters = () => {
        setSearch('');
        setFilterEstado('');
        setFilterPeriodo('');
    };

    const hasActiveFilters = search !== '' || filterEstado !== '' || filterPeriodo !== '';

    if (loading) return <div className="loading"><div className="spinner"></div></div>;

    return (
        <div>
            {/* Header */}
            <div className="page-header">
                <div>
                    <h1 className="page-title">Liquidación de Sueldos</h1>
                    <p className="page-subtitle">Gestiona y visualiza las liquidaciones de sueldo</p>
                </div>
            </div>

            <LiquidacionTabs />

            {/* List */}
            <div className="card">
                <div className="card-header">
                    <div className="header-left">
                        <h3 className="card-title">Historial de Liquidaciones</h3>
                        <span className="selection-indicator" style={{ marginLeft: '1rem', fontSize: '0.875rem', color: 'var(--neutral-500)' }}>
                            {selectedIds.size} de {filteredItems.length} seleccionados
                        </span>
                    </div>
                    <div className="header-actions">
                        <Link
                            to="/liquidaciones/configuracion"
                            className="btn btn-secondary"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" style={{ width: 20, height: 20 }}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M10.34 15.84c-.688-.06-1.386-.09-2.09-.09H7.5a4.5 4.5 0 110-9h.75c.704 0 1.402-.03 2.09-.09m0 9.18c.253.962.584 1.892.985 2.783.247.55.06 1.21-.463 1.511l-.657.38c-.551.318-1.26.117-1.527-.461a20.845 20.845 0 01-1.44-4.282m3.102.069a18.03 18.03 0 01-.59-4.59c0-1.586.205-3.124.59-4.59m0 9.18a23.848 23.848 0 018.835 2.535M10.34 6.66c-.29-.966-.618-1.908-1.006-2.807-.252-.584.07-1.25.63-1.488l.659-.28c.57-.243 1.236-.084 1.551.417a23.846 23.846 0 002.808 8.15m-4.644-3.99a23.849 23.849 0 018.835-2.535m0 2.535a23.848 23.848 0 01-8.835 2.535m0-2.535a23.848 23.848 0 00-8.835-2.535" />
                            </svg>
                            Configurar Conceptos
                        </Link>
                        <Link
                            to="/liquidaciones/nueva"
                            className="btn btn-primary"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" style={{ width: 20, height: 20 }}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                            </svg>
                            Nueva Liquidación
                        </Link>
                    </div>
                </div>

                {/* Filters */}
                <div className="filters-bar" style={{ padding: '1rem', borderBottom: '1px solid var(--neutral-200)', display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center', backgroundColor: 'var(--neutral-50)' }}>
                    <div className="filter-group">
                        <input
                            type="text"
                            className="filter-input form-input"
                            placeholder="Buscar por empleado o CUIL..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            style={{ minWidth: '250px' }}
                        />
                    </div>
                    <div className="filter-group">
                        <select
                            className="filter-input form-select"
                            value={filterEstado}
                            onChange={(e) => setFilterEstado(e.target.value)}
                        >
                            <option value="">Todos los estados</option>
                            <option value="PENDIENTE">Pendiente</option>
                            <option value="GENERADO">Generado</option>
                            <option value="PAGADO">Pagado</option>
                        </select>
                    </div>
                    <div className="filter-group">
                        <input
                            type="month"
                            className="filter-input form-input"
                            value={filterPeriodo}
                            onChange={(e) => setFilterPeriodo(e.target.value)}
                        />
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

                {filteredItems.length === 0 ? (
                    <div className="empty-state">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                        </svg>
                        <h3>No hay liquidaciones {hasActiveFilters ? 'que coincidan' : 'registradas'}</h3>
                        <p>{hasActiveFilters ? 'Intenta ajustar los filtros' : 'Genera una nueva liquidación para comenzar'}</p>
                    </div>
                ) : (
                    <div className="table-container">
                        <table className="table">
                            <thead>
                                <tr>
                                    <th style={{ width: '40px' }}>
                                        <input
                                            type="checkbox"
                                            checked={allSelected}
                                            ref={input => { if (input) input.indeterminate = someSelected; }}
                                            onChange={handleSelectAll}
                                        />
                                    </th>
                                    <th>Periodo</th>
                                    <th>Empleado</th>
                                    <th>CUIL</th>
                                    <th>Total Neto</th>
                                    <th>Estado</th>
                                    <th>Acciones</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredItems.map((liq) => (
                                    <tr key={liq.id} className={selectedIds.has(liq.id) ? 'row-selected' : ''}>
                                        <td>
                                            <input
                                                type="checkbox"
                                                checked={selectedIds.has(liq.id)}
                                                onChange={() => handleSelectOne(liq.id)}
                                            />
                                        </td>
                                        <td>{liq.periodo}</td>
                                        <td>
                                            <strong>{liq.empleado ? `${liq.empleado.apellido}, ${liq.empleado.nombre}` : 'N/A'}</strong>
                                        </td>
                                        <td>{liq.empleado ? liq.empleado.cuil : 'N/A'}</td>
                                        <td>
                                            ${parseFloat(liq.totalNeto).toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                                        </td>
                                        <td>
                                            <span className={getEstadoBadge(liq.estado)}>
                                                {liq.estado}
                                            </span>
                                        </td>
                                        <td>
                                            <div className="table-actions">
                                                <button
                                                    className="btn btn-info btn-sm"
                                                    title="Ver Detalle"
                                                    onClick={() => setViewLiquidation(liq)}
                                                >
                                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" style={{ width: 16, height: 16 }}>
                                                        <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                                                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                                    </svg>
                                                    Ver
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
            {/* Detail Modal */}
            {viewLiquidation && (
                <div className="modal-overlay" style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                    backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000
                }}>
                    <div className="modal-content" style={{
                        backgroundColor: 'white', padding: '2rem', borderRadius: '8px',
                        maxWidth: '900px', width: '90%', maxHeight: '90vh', overflowY: 'auto', position: 'relative'
                    }}>
                        <button
                            onClick={() => setViewLiquidation(null)}
                            style={{
                                position: 'absolute', top: '10px', right: '10px',
                                background: 'transparent', border: 'none', fontSize: '1.5rem', cursor: 'pointer'
                            }}
                        >
                            ×
                        </button>
                        <h2 style={{ marginBottom: '1rem', borderBottom: '1px solid #eee', paddingBottom: '0.5rem' }}>Detalle de Liquidación</h2>

                        <LiquidacionTable
                            empleado={viewLiquidation.empleado}
                            periodo={viewLiquidation.periodo}
                            detalles={viewLiquidation.detalles || []}
                            totales={{
                                bruto: viewLiquidation.totalBruto,
                                neto: viewLiquidation.totalNeto,
                                deducciones: (parseFloat(viewLiquidation.totalBruto) - parseFloat(viewLiquidation.totalNeto)).toFixed(2)
                            }}
                        />

                        <div style={{ marginTop: '2rem', textAlign: 'right' }}>
                            <button className="btn btn-secondary" onClick={() => setViewLiquidation(null)}>Cerrar</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default LiquidacionList;
