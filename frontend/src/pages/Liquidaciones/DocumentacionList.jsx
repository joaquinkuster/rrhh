import React, { useState, useEffect } from 'react';
import DocumentacionModal from './DocumentacionModal';
import LiquidacionTabs from '../../components/LiquidacionTabs';

const DocumentacionList = () => {
    const [documentos, setDocumentos] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [showModal, setShowModal] = useState(false);

    const [search, setSearch] = useState('');
    const [filterEstado, setFilterEstado] = useState('');
    const [filterTipo, setFilterTipo] = useState('');

    useEffect(() => {
        fetchDocumentos();
    }, []);

    const fetchDocumentos = async () => {
        try {
            setLoading(true);
            const response = await fetch('/api/documentacion-pagos');
            if (response.ok) {
                const data = await response.json();
                setDocumentos(data);
            } else {
                throw new Error('Error al cargar documentación');
            }
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleEstadoChange = async (id, nuevoEstado) => {
        try {
            const response = await fetch(`/api/documentacion-pagos/${id}/estado`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ estado: nuevoEstado })
            });
            if (response.ok) {
                fetchDocumentos();
            }
        } catch (err) {
            alert('Error al actualizar estado');
        }
    };

    const handleCreate = () => {
        setShowModal(true);
    };

    const handleModalSuccess = () => {
        setShowModal(false);
        fetchDocumentos();
    };

    // Filtering Logic
    const filteredItems = documentos.filter(item => {
        const matchesSearch = search === '' ||
            item.numero.toLowerCase().includes(search.toLowerCase()) ||
            (item.liquidacion && item.liquidacion.periodo.includes(search));
        const matchesEstado = filterEstado === '' || item.estado === filterEstado;
        const matchesTipo = filterTipo === '' || item.tipo === filterTipo;

        return matchesSearch && matchesEstado && matchesTipo;
    });

    const clearFilters = () => {
        setSearch('');
        setFilterEstado('');
        setFilterTipo('');
    };

    const hasActiveFilters = search !== '' || filterEstado !== '' || filterTipo !== '';

    if (loading) return <div className="loading"><div className="spinner"></div></div>;

    return (
        <div>
            <div className="page-header">
                <div>
                    <h1 className="page-title">Documentación de Pagos</h1>
                    <p className="page-subtitle">Gestión de facturas y comprobantes de pago</p>
                </div>
            </div>

            <LiquidacionTabs />

            {error && <div className="alert alert-error">{error}</div>}

            <div className="card">
                <div className="card-header">
                    <div className="header-left">
                        <h3 className="card-title">Listado de Documentos</h3>
                    </div>
                    <div className="header-actions">
                        <button className="btn btn-primary" onClick={handleCreate}>
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" style={{ width: 20, height: 20 }}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
                            </svg>
                            Subir Documento
                        </button>
                    </div>
                </div>

                {/* Filters */}
                <div className="filters-bar" style={{ padding: '1rem', borderBottom: '1px solid var(--neutral-200)', display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center', backgroundColor: 'var(--neutral-50)' }}>
                    <div className="filter-group">
                        <input
                            type="text"
                            className="filter-input form-input"
                            placeholder="Buscar por número o periodo..."
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
                            <option value="VERIFICADO">Verificado</option>
                            <option value="RECHAZADO">Rechazado</option>
                        </select>
                    </div>
                    <div className="filter-group">
                        <select
                            className="filter-input form-select"
                            value={filterTipo}
                            onChange={(e) => setFilterTipo(e.target.value)}
                        >
                            <option value="">Todos los tipos</option>
                            <option value="FACTURA">Factura C</option>
                            <option value="RECIBO">Recibo de Pago</option>
                            <option value="COMPROBANTE">Comprobante</option>
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
                                <th>Fecha Subida</th>
                                <th>Liquidación</th>
                                <th>Tipo</th>
                                <th>Número</th>
                                <th>Estado</th>
                                <th>Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredItems.map(doc => (
                                <tr key={doc.id}>
                                    <td>{new Date(doc.createdAt).toLocaleDateString()}</td>
                                    <td>{doc.liquidacion ? `${doc.liquidacion.periodo}` : '-'}</td>
                                    <td>{doc.tipo}</td>
                                    <td>{doc.numero}</td>
                                    <td>
                                        <span className={`badge ${doc.estado === 'VERIFICADO' ? 'badge-success' :
                                            doc.estado === 'RECHAZADO' ? 'badge-error' : 'badge-warning'
                                            }`}>
                                            {doc.estado}
                                        </span>
                                    </td>
                                    <td>
                                        <div className="table-actions">
                                            {doc.estado === 'PENDIENTE' && (
                                                <>
                                                    <button
                                                        onClick={() => handleEstadoChange(doc.id, 'VERIFICADO')}
                                                        className="btn btn-success btn-sm"
                                                        title="Verificar"
                                                    >
                                                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" style={{ width: 16, height: 16 }}>
                                                            <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                                                        </svg>
                                                        Verificar
                                                    </button>
                                                    <button
                                                        onClick={() => handleEstadoChange(doc.id, 'RECHAZADO')}
                                                        className="btn btn-danger btn-sm"
                                                        title="Rechazar"
                                                    >
                                                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" style={{ width: 16, height: 16 }}>
                                                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                                                        </svg>
                                                        Rechazar
                                                    </button>
                                                </>
                                            )}
                                            {doc.archivoUrl && (
                                                <a
                                                    href={doc.archivoUrl}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="btn btn-secondary btn-sm"
                                                    title="Ver Archivo"
                                                >
                                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" style={{ width: 16, height: 16 }}>
                                                        <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                                                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                                    </svg>
                                                    Ver
                                                </a>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {filteredItems.length === 0 && (
                                <tr>
                                    <td colSpan="6" style={{ textAlign: 'center', padding: '2rem' }}>
                                        <div className="empty-state">
                                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                                            </svg>
                                            <h3>No hay documentos {hasActiveFilters ? 'que coincidan' : 'registrados'}</h3>
                                            <p>{hasActiveFilters ? 'Intenta ajustar los filtros' : 'Sube un nuevo documento para comenzar'}</p>
                                        </div>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {showModal && (
                <DocumentacionModal
                    onClose={() => setShowModal(false)}
                    onSuccess={handleModalSuccess}
                />
            )}
        </div>
    );
};

export default DocumentacionList;
