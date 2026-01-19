import { useState, useEffect, useCallback } from 'react';
import { getEmpresas, deleteEmpresa, deleteEmpresasBulk, getEmpresaById, updateEmpresa } from '../services/api';
import ConfirmDialog from '../components/ConfirmDialog';
import EmpresaWizard from '../components/EmpresaWizard';
import EmpresaDetail from '../components/EmpresaDetail';

const ROWS_PER_PAGE_OPTIONS = [10, 25, 50];

const Empresas = () => {
    const [empresas, setEmpresas] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    // Pagination
    const [page, setPage] = useState(1);
    const [limit, setLimit] = useState(10);
    const [totalPages, setTotalPages] = useState(1);
    const [total, setTotal] = useState(0);

    // Search
    const [search, setSearch] = useState('');
    const [searchInput, setSearchInput] = useState('');

    // Selection
    const [selectedIds, setSelectedIds] = useState(new Set());

    // Modals
    const [showWizard, setShowWizard] = useState(false);
    const [editingEmpresa, setEditingEmpresa] = useState(null);
    const [selectedEmpresa, setSelectedEmpresa] = useState(null);
    const [showDetail, setShowDetail] = useState(false);
    const [confirmOpen, setConfirmOpen] = useState(false);
    const [confirmBulkOpen, setConfirmBulkOpen] = useState(false);
    const [empresaToDelete, setEmpresaToDelete] = useState(null);

    // Column visibility
    const [visibleColumns, setVisibleColumns] = useState({
        nombre: true,
        email: true,
        telefono: true,
        industria: true,
        direccion: true,
    });
    const [showColumnSelector, setShowColumnSelector] = useState(false);

    const loadEmpresas = useCallback(async () => {
        try {
            setLoading(true);
            const result = await getEmpresas({ search, page, limit });
            setEmpresas(result.data);
            setTotalPages(result.pagination.totalPages);
            setTotal(result.pagination.total);
            setSelectedIds(new Set());
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, [search, page, limit]);

    useEffect(() => {
        loadEmpresas();
    }, [loadEmpresas]);

    useEffect(() => {
        const timer = setTimeout(() => {
            setSearch(searchInput);
            setPage(1);
        }, 300);
        return () => clearTimeout(timer);
    }, [searchInput]);

    const handleSelectAll = (e) => {
        if (e.target.checked) {
            setSelectedIds(new Set(empresas.map(emp => emp.id)));
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

    const handleWizardSuccess = () => {
        setShowWizard(false);
        setEditingEmpresa(null);
        setSuccess(editingEmpresa ? 'Empresa actualizada correctamente' : 'Empresa creada correctamente');
        loadEmpresas();
    };

    const handleNewEmpresa = () => {
        setEditingEmpresa(null);
        setShowWizard(true);
    };

    const handleEditClick = async (empresa) => {
        try {
            const fullEmpresa = await getEmpresaById(empresa.id);
            setEditingEmpresa(fullEmpresa);
            setShowWizard(true);
        } catch (err) {
            setError(err.message);
        }
    };

    const handleViewClick = async (empresa) => {
        try {
            const fullEmpresa = await getEmpresaById(empresa.id);
            setSelectedEmpresa(fullEmpresa);
            setShowDetail(true);
        } catch (err) {
            setError(err.message);
        }
    };

    const handleDeleteClick = (empresa) => {
        setEmpresaToDelete(empresa);
        setConfirmOpen(true);
    };

    const handleConfirmDelete = async () => {
        if (!empresaToDelete) return;

        try {
            await deleteEmpresa(empresaToDelete.id);
            setSuccess('Empresa eliminada correctamente');
            loadEmpresas();
        } catch (err) {
            setError(err.message);
        } finally {
            setConfirmOpen(false);
            setEmpresaToDelete(null);
        }
    };

    const handleBulkDeleteClick = () => {
        if (selectedIds.size === 0) return;
        setConfirmBulkOpen(true);
    };

    const handleConfirmBulkDelete = async () => {
        try {
            await deleteEmpresasBulk(Array.from(selectedIds));
            setSuccess(`${selectedIds.size} empresa(s) eliminada(s) correctamente`);
            setSelectedIds(new Set());
            loadEmpresas();
        } catch (err) {
            setError(err.message);
        } finally {
            setConfirmBulkOpen(false);
        }
    };

    const toggleColumn = (col) => {
        setVisibleColumns(prev => ({ ...prev, [col]: !prev[col] }));
    };

    const allSelected = empresas.length > 0 && empresas.every(emp => selectedIds.has(emp.id));
    const someSelected = empresas.some(emp => selectedIds.has(emp.id)) && !allSelected;

    return (
        <div>
            <div className="page-header">
                <h1 className="page-title">Empresas</h1>
                <p className="page-subtitle">Gestiona las empresas del sistema</p>
            </div>

            {error && (
                <div className="alert alert-error">
                    {error}
                    <button onClick={() => setError('')} style={{ float: 'right', background: 'none', border: 'none', cursor: 'pointer' }}>×</button>
                </div>
            )}

            {success && (
                <div className="alert alert-success">
                    {success}
                    <button onClick={() => setSuccess('')} style={{ float: 'right', background: 'none', border: 'none', cursor: 'pointer' }}>×</button>
                </div>
            )}

            <div className="card">
                <div className="card-header">
                    <div className="header-left">
                        <h3 className="card-title">Listado de Empresas</h3>
                        <span className="selection-indicator">
                            {selectedIds.size} de {total} seleccionados
                        </span>
                    </div>
                    <div className="header-actions">
                        {selectedIds.size > 0 && (
                            <button className="btn btn-danger" onClick={handleBulkDeleteClick}>
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" style={{ width: 20, height: 20 }}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                                </svg>
                                Eliminar seleccionados
                            </button>
                        )}
                        <button className="btn btn-primary" onClick={handleNewEmpresa}>
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" style={{ width: 20, height: 20 }}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                            </svg>
                            Nueva Empresa
                        </button>
                    </div>
                </div>

                <div className="filters-bar">
                    <div className="filter-group" style={{ flex: 1 }}>
                        <input
                            type="text"
                            className="filter-input"
                            placeholder="Buscar por nombre..."
                            value={searchInput}
                            onChange={(e) => setSearchInput(e.target.value)}
                            style={{ width: '100%', maxWidth: '300px' }}
                        />
                    </div>

                    <div className="filter-group">
                        <div className="column-selector-wrapper">
                            <button
                                className="btn btn-secondary btn-sm"
                                onClick={() => setShowColumnSelector(!showColumnSelector)}
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" style={{ width: 16, height: 16 }}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.24-.438.613-.431.992a6.759 6.759 0 010 .255c-.007.378.138.75.43.99l1.004.828c.424.35.534.954.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.57 6.57 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.28c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.02-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.992a6.932 6.932 0 010-.255c.007-.378-.138-.75-.43-.99l-1.004-.828a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.087.22-.128.332-.183.582-.495.644-.869l.214-1.281z" />
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                </svg>
                                Columnas
                            </button>
                            {showColumnSelector && (
                                <div className="column-selector-dropdown">
                                    {Object.entries({ email: 'Email', telefono: 'Teléfono', industria: 'Industria', direccion: 'Dirección' }).map(([key, label]) => (
                                        <label key={key} className="column-option">
                                            <input
                                                type="checkbox"
                                                checked={visibleColumns[key]}
                                                onChange={() => toggleColumn(key)}
                                            />
                                            <span>{label}</span>
                                        </label>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {loading ? (
                    <div className="loading">
                        <div className="spinner"></div>
                    </div>
                ) : empresas.length === 0 ? (
                    <div className="empty-state">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 21h16.5M4.5 3h15M5.25 3v18m13.5-18v18M9 6.75h1.5m-1.5 3h1.5m-1.5 3h1.5m3-6H15m-1.5 3H15m-1.5 3H15M9 21v-3.375c0-.621.504-1.125 1.125-1.125h3.75c.621 0 1.125.504 1.125 1.125V21" />
                        </svg>
                        <h3>No hay empresas</h3>
                        <p>Crea una nueva empresa para comenzar</p>
                    </div>
                ) : (
                    <>
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
                                        <th>Nombre</th>
                                        {visibleColumns.email && <th>Email</th>}
                                        {visibleColumns.telefono && <th>Teléfono</th>}
                                        {visibleColumns.industria && <th>Industria</th>}
                                        {visibleColumns.direccion && <th>Dirección</th>}
                                        <th>Acciones</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {empresas.map((empresa) => (
                                        <tr key={empresa.id} className={selectedIds.has(empresa.id) ? 'row-selected' : ''}>
                                            <td>
                                                <input
                                                    type="checkbox"
                                                    checked={selectedIds.has(empresa.id)}
                                                    onChange={() => handleSelectOne(empresa.id)}
                                                />
                                            </td>
                                            <td><strong>{empresa.nombre}</strong></td>
                                            {visibleColumns.email && <td>{empresa.email || '-'}</td>}
                                            {visibleColumns.telefono && <td>{empresa.telefono || '-'}</td>}
                                            {visibleColumns.industria && <td>{empresa.industria || '-'}</td>}
                                            {visibleColumns.direccion && <td style={{ maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{empresa.direccion || '-'}</td>}
                                            <td>
                                                <div className="table-actions">
                                                    <button
                                                        className="btn-icon"
                                                        title="Ver empresa"
                                                        onClick={() => handleViewClick(empresa)}
                                                    >
                                                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" style={{ width: 18, height: 18 }}>
                                                            <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                                                            <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                                        </svg>
                                                    </button>
                                                    <button
                                                        className="btn-icon"
                                                        title="Editar empresa"
                                                        onClick={() => handleEditClick(empresa)}
                                                    >
                                                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" style={{ width: 18, height: 18 }}>
                                                            <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
                                                        </svg>
                                                    </button>
                                                    <button
                                                        className="btn-icon"
                                                        title="Eliminar empresa"
                                                        onClick={() => handleDeleteClick(empresa)}
                                                    >
                                                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" style={{ width: 18, height: 18 }}>
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

                        <div className="pagination-bar">
                            <div className="pagination-info">
                                <span>Filas por página:</span>
                                <select
                                    value={limit}
                                    onChange={(e) => {
                                        setLimit(Number(e.target.value));
                                        setPage(1);
                                    }}
                                    className="pagination-select"
                                >
                                    {ROWS_PER_PAGE_OPTIONS.map(opt => (
                                        <option key={opt} value={opt}>{opt}</option>
                                    ))}
                                </select>
                                <span className="pagination-total">
                                    {((page - 1) * limit) + 1}-{Math.min(page * limit, total)} de {total}
                                </span>
                            </div>
                            <div className="pagination-controls">
                                <button
                                    className="btn btn-secondary btn-sm"
                                    disabled={page === 1}
                                    onClick={() => setPage(1)}
                                >
                                    «
                                </button>
                                <button
                                    className="btn btn-secondary btn-sm"
                                    disabled={page === 1}
                                    onClick={() => setPage(p => p - 1)}
                                >
                                    ‹
                                </button>
                                <span className="pagination-page">
                                    Página {page} de {totalPages}
                                </span>
                                <button
                                    className="btn btn-secondary btn-sm"
                                    disabled={page === totalPages}
                                    onClick={() => setPage(p => p + 1)}
                                >
                                    ›
                                </button>
                                <button
                                    className="btn btn-secondary btn-sm"
                                    disabled={page === totalPages}
                                    onClick={() => setPage(totalPages)}
                                >
                                    »
                                </button>
                            </div>
                        </div>
                    </>
                )}
            </div>

            {/* Wizard Modal - Create/Edit */}
            {showWizard && (
                <EmpresaWizard
                    empresa={editingEmpresa}
                    onClose={() => {
                        setShowWizard(false);
                        setEditingEmpresa(null);
                    }}
                    onSuccess={handleWizardSuccess}
                />
            )}

            {/* View Detail Modal */}
            {showDetail && selectedEmpresa && (
                <EmpresaDetail
                    empresa={selectedEmpresa}
                    onClose={() => {
                        setShowDetail(false);
                        setSelectedEmpresa(null);
                    }}
                />
            )}

            <ConfirmDialog
                isOpen={confirmOpen}
                title="Eliminar empresa"
                message={empresaToDelete ? `¿Estás seguro de eliminar la empresa "${empresaToDelete.nombre}"? Esta acción no se puede deshacer.` : ''}
                onConfirm={handleConfirmDelete}
                onCancel={() => { setConfirmOpen(false); setEmpresaToDelete(null); }}
                confirmText="Eliminar"
                variant="danger"
            />

            <ConfirmDialog
                isOpen={confirmBulkOpen}
                title="Eliminar empresas"
                message={`¿Estás seguro de eliminar ${selectedIds.size} empresa(s)? Esta acción no se puede deshacer.`}
                onConfirm={handleConfirmBulkDelete}
                onCancel={() => setConfirmBulkOpen(false)}
                confirmText="Eliminar todas"
                variant="danger"
            />
        </div>
    );
};

export default Empresas;
