import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import Select from 'react-select';
import {
    getLiquidaciones,
    getLiquidacionById,
    marcarLiquidacionComoPagada,
    getConceptosSalariales,
    getParametrosLaborales,
    updateParametrosLaborales,
    getEmpleados,
    getEspaciosTrabajo,
    ejecutarLiquidacion,
} from '../services/api';
import { formatDateOnly, formatCurrency, truncateText } from '../utils/formatters';
import LiquidacionFormulario from '../components/LiquidacionFormulario';
import LiquidacionDetail from '../components/LiquidacionDetail';
import ConceptosSalarialesModal from '../components/ConceptosSalarialesModal';
import ParametrosLaboralesModal from '../components/ParametrosLaboralesModal';

const buildSelectStyles = (isDark) => ({
    control: (b, s) => ({ ...b, backgroundColor: isDark ? '#1e293b' : 'white', borderColor: s.isFocused ? '#0d9488' : (isDark ? '#334155' : '#e2e8f0'), boxShadow: 'none', '&:hover': { borderColor: '#0d9488' }, minHeight: '36px', fontSize: '0.875rem', borderRadius: '0.5rem' }),
    menu: (b) => ({ ...b, backgroundColor: isDark ? '#1e293b' : 'white', border: `1px solid ${isDark ? '#334155' : '#e2e8f0'}`, borderRadius: '0.5rem', boxShadow: '0 4px 12px rgba(0,0,0,0.15)', zIndex: 9999 }),
    option: (b, s) => ({ ...b, backgroundColor: s.isSelected ? '#0d9488' : s.isFocused ? (isDark ? '#334155' : '#f1f5f9') : 'transparent', color: s.isSelected ? 'white' : (isDark ? '#e2e8f0' : '#1e293b'), fontSize: '0.875rem', cursor: 'pointer' }),
    groupHeading: (b) => ({ ...b, fontWeight: 'bold', textTransform: 'uppercase', fontSize: '0.7rem', color: '#64748b' }),
    input: (b) => ({ ...b, color: isDark ? '#e2e8f0' : '#1e293b', fontSize: '0.875rem' }),
    singleValue: (b) => ({ ...b, color: isDark ? '#e2e8f0' : '#1e293b' }),
    placeholder: (b) => ({ ...b, color: '#94a3b8', fontSize: '0.875rem' }),
    valueContainer: (b) => ({ ...b, padding: '0 8px' }),
});

const ROWS_PER_PAGE_OPTIONS = [10, 25, 50];

// Status based on estaPagada
const getStatusInfo = (estaPagada) => {
    if (estaPagada) {
        return { label: 'Pagada', color: '#10b981' }; // green
    }
    return { label: 'Generada', color: '#3b82f6' }; // blue
};

const Liquidaciones = () => {
    const navigate = useNavigate();
    const { user } = useAuth();

    // Permisos del módulo liquidaciones
    const isEmpleadoUser = user?.esEmpleado && !user?.esAdministrador;
    const userPermisos = user?.rol?.permisos || [];
    const canRead = !isEmpleadoUser || user?.esAdministrador || userPermisos.some(p => p.modulo === 'liquidaciones' && p.accion === 'leer');
    const canEdit = !isEmpleadoUser || user?.esAdministrador || userPermisos.some(p => p.modulo === 'liquidaciones' && p.accion === 'actualizar');

    // Data State
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    // Pagination
    const [page, setPage] = useState(1);
    const [limit, setLimit] = useState(10);
    const [totalPages, setTotalPages] = useState(1);
    const [total, setTotal] = useState(0);

    // Filters
    const [filterEspacio, setFilterEspacio] = useState(null);
    const [filterEmpleado, setFilterEmpleado] = useState(null);
    const [filterEstado, setFilterEstado] = useState('');
    const [filterFechaDesde, setFilterFechaDesde] = useState('');
    const [filterFechaHasta, setFilterFechaHasta] = useState('');

    // Filter lists
    const [empleadosList, setEmpleadosList] = useState([]);
    const [espaciosList, setEspaciosList] = useState([]);
    const [isDark, setIsDark] = useState(() => document.documentElement.classList.contains('dark'));

    // Selection
    const [selectedIds, setSelectedIds] = useState(new Set());

    // Column Visibility
    const [visibleColumns, setVisibleColumns] = useState({
        espacio: false,
        periodo: true,
        totalBruto: true,
        retenciones: true,
        neto: true,
        estado: true,
    });
    const [showColumnSelector, setShowColumnSelector] = useState(false);

    // Delete Confirmation (not used in Liquidaciones but keep pattern)
    const [confirmMarkPaid, setConfirmMarkPaid] = useState(null);

    // Modal State
    const [showFormulario, setShowFormulario] = useState(false);
    const [showDetail, setShowDetail] = useState(false);
    const [editingItem, setEditingItem] = useState(null);
    const [selectedItem, setSelectedItem] = useState(null);
    const [showConceptosModal, setShowConceptosModal] = useState(false);
    const [showParametrosModal, setShowParametrosModal] = useState(false);


    // Theme observer
    useEffect(() => {
        const obs = new MutationObserver(() => setIsDark(document.documentElement.classList.contains('dark')));
        obs.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
        return () => obs.disconnect();
    }, []);

    // Redirigir si no tiene permiso de lectura
    useEffect(() => {
        if (user && isEmpleadoUser && !canRead) {
            navigate('/dashboard', { replace: true });
        }
    }, [user, isEmpleadoUser, canRead, navigate]);

    // Load filter data
    useEffect(() => {
        const load = async () => {
            try {
                const [empRes, espRes] = await Promise.all([
                    getEmpleados({ limit: 500, activo: 'true' }),
                    getEspaciosTrabajo({ limit: 200, activo: 'true' }),
                ]);
                setEmpleadosList(empRes.data || []);
                setEspaciosList(espRes.data || []);
            } catch (e) { console.error(e); }
        };
        load();
    }, []);

    // Permisos y restricciones
    const isRestricted = user?.esEmpleado && !user?.esAdministrador;
    const hasFullAccess = user?.esAdministrador || (user?.rol?.permisos?.some(p => p.modulo === 'liquidaciones' && ['crear', 'editar', 'eliminar'].includes(p.accion)));
    const isSingleEmployee = (empleadosList.length === 1 && isRestricted) || (isRestricted && !hasFullAccess);
    const isSingleWorkspace = espaciosList.length === 1 && isRestricted;

    // Auto-select espacio y empleado para usuarios restringidos
    useEffect(() => {
        if (isRestricted) {
            if (espaciosList.length === 1 && !filterEspacio) {
                setFilterEspacio({ value: espaciosList[0].id, label: espaciosList[0].nombre });
            }
            if (!filterEmpleado) {
                if (empleadosList.length === 1) {
                    const emp = empleadosList[0];
                    const label = `${emp.usuario?.apellido || emp.apellido}, ${emp.usuario?.nombre || emp.nombre}`;
                    setFilterEmpleado({ value: emp.id, label });
                } else if (!hasFullAccess && user?.empleadoId) {
                    const myEmp = empleadosList.find(e => e.id === user.empleadoId);
                    if (myEmp) {
                        const label = `${myEmp.usuario?.apellido || myEmp.apellido}, ${myEmp.usuario?.nombre || myEmp.nombre}`;
                        setFilterEmpleado({ value: myEmp.id, label });
                    }
                }
            }
        }
    }, [user, espaciosList, empleadosList, filterEspacio, filterEmpleado, isRestricted, hasFullAccess]);

    // Build select options
    const empleadoOptions = Object.values(
        (empleadosList).reduce((acc, emp) => {
            const ws = emp.espacioTrabajo?.nombre || 'Sin Espacio';
            if (!acc[ws]) acc[ws] = { label: ws, options: [] };
            const ap = emp.usuario?.apellido || emp.apellido || '';
            const nm = emp.usuario?.nombre || emp.nombre || '';
            acc[ws].options.push({ value: emp.id, label: `${ap}, ${nm}` });
            return acc;
        }, {})
    );
    const espacioOptions = espaciosList.map(e => ({ value: e.id, label: e.nombre }));
    const selectStyles = buildSelectStyles(isDark);

    // Load Items
    const loadItems = useCallback(async () => {
        try {
            setLoading(true);
            const params = {
                activo: 'true',
                page,
                limit,
            };
            if (filterEspacio) params.espacioTrabajoId = filterEspacio.value;
            if (filterEmpleado) params.empleadoId = filterEmpleado.value;
            if (filterEstado !== '') params.estaPagada = filterEstado;
            if (filterFechaDesde) params.fechaDesde = filterFechaDesde;
            if (filterFechaHasta) params.fechaHasta = filterFechaHasta;
            const result = await getLiquidaciones(params);
            setItems(result.liquidaciones);
            setTotalPages(result.totalPages);
            setTotal(result.total);
            setSelectedIds(new Set());
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, [filterEstado, page, limit, filterEspacio, filterEmpleado, filterFechaDesde, filterFechaHasta]);

    useEffect(() => {
        loadItems();
    }, [loadItems]);

    // Handlers
    const clearFilters = () => {
        if (!isSingleWorkspace) setFilterEspacio(null);
        if (!isSingleEmployee) setFilterEmpleado(null);
        setFilterEstado('');
        setFilterFechaDesde('');
        setFilterFechaHasta('');
        setPage(1);
    };

    const hasActiveFilters = filterEstado || (!isSingleWorkspace && filterEspacio) || (!isSingleEmployee && filterEmpleado) || filterFechaDesde || filterFechaHasta;

    // Selection Handlers
    const handleSelectAll = (e) => {
        if (e.target.checked) {
            setSelectedIds(new Set(items.filter(item => !item.estaPagada).map(item => item.id)));
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

    const allSelected = items.length > 0 && items.every(item => selectedIds.has(item.id));
    const someSelected = items.some(item => selectedIds.has(item.id)) && !allSelected;

    // Column Toggle
    const toggleColumn = (col) => {
        setVisibleColumns(prev => ({ ...prev, [col]: !prev[col] }));
    };

    // CRUD Handlers
    const handleEdit = async (item) => {
        try {
            const fullItem = await getLiquidacionById(item.id);
            setEditingItem(fullItem);
            setShowFormulario(true);
            setError('');
            setSuccess('');
        } catch (err) {
            setError(err.message);
        }
    };

    const handleView = async (item) => {
        try {
            const fullItem = await getLiquidacionById(item.id);
            setSelectedItem(fullItem);
            setShowDetail(true);
        } catch (err) {
            setError(err.message);
        }
    };

    const handleCloseFormulario = () => {
        setShowFormulario(false);
        setEditingItem(null);
    };

    const handleFormularioSuccess = () => {
        handleCloseFormulario();
        setSuccess('Liquidación actualizada correctamente');
        loadItems();
    };

    const handleMarcarComoPagada = async (item) => {
        try {
            await marcarLiquidacionComoPagada(item.id, true);
            setSuccess('Liquidación marcada como pagada correctamente');
            loadItems();
        } catch (err) {
            setError(err.message);
        }
    };

    const handleSimularLiquidacion = async () => {
        try {
            setLoading(true);
            await ejecutarLiquidacion();
            setSuccess('Simulación de liquidaciones ejecutada correctamente');
            loadItems();
        } catch (err) {
            setError(err.message);
            setLoading(false);
        }
    };

    return (
        <div>
            {/* Header */}
            <div className="page-header">
                <div>
                    <h1 className="page-title">Liquidaciones</h1>
                    <p className="page-subtitle">Visualiza y gestiona las liquidaciones generadas automáticamente</p>
                </div>
            </div>

            {/* Alerts */}
            {error && (
                <div className="alert alert-error" style={{ marginBottom: '1rem' }}>
                    {error}
                    <button onClick={() => setError('')} style={{ marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer' }}>✕</button>
                </div>
            )}
            {success && (
                <div className="alert alert-success" style={{ marginBottom: '1rem' }}>
                    {success}
                    <button onClick={() => setSuccess('')} style={{ marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer' }}>✕</button>
                </div>
            )}

            {/* Card */}
            <div className="card">
                <div className="card-header">
                    <div className="header-left">
                        <h3 className="card-title">Listado de Liquidaciones</h3>
                        <span className="selection-indicator">
                            {selectedIds.size} de {total} seleccionados
                        </span>
                    </div>
                    <div className="header-actions">
                        {canEdit && (
                            <button className="btn btn-primary" onClick={handleSimularLiquidacion}>
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" style={{ width: 20, height: 20 }}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
                                </svg>
                                Simular Liquidación
                            </button>
                        )}
                        {canEdit && (
                            <button className="btn btn-secondary" onClick={() => setShowConceptosModal(true)}>
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" style={{ width: 20, height: 20 }}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                Conceptos Salariales
                            </button>
                        )}
                        {canEdit && (
                            <button className="btn btn-secondary" onClick={() => setShowParametrosModal(true)}>
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" style={{ width: 20, height: 20 }}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.24-.438.613-.431.992a6.759 6.759 0 010 .255c-.007.378.138.75.43.99l1.004.828c.424.35.534.954.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.57 6.57 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.28c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.02-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.992a6.932 6.932 0 010-.255c.007-.378-.138-.75-.43-.99l-1.004-.828a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.087.22-.128.332-.183.582-.495.644-.869l.214-1.281z" />
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                </svg>
                                Parámetros Laborales
                            </button>
                        )}
                    </div>
                </div>

                {/* Filters */}
                <div className="filters-bar">
                    <div className="filters-inputs">
                        <div className="filter-group" style={{ minWidth: '160px' }}>
                            <Select isDisabled={isSingleWorkspace} options={espacioOptions} value={filterEspacio} onChange={opt => { setFilterEspacio(opt); setPage(1); }} placeholder="Espacio..." isClearable={!isSingleWorkspace} styles={selectStyles} noOptionsMessage={() => 'Sin resultados'} />
                        </div>
                        <div className="filter-group" style={{ minWidth: '200px' }}>
                            <Select isDisabled={isSingleEmployee} options={empleadoOptions} value={filterEmpleado} onChange={opt => { setFilterEmpleado(opt); setPage(1); }} placeholder="Empleado..." isClearable={!isSingleEmployee} styles={selectStyles} noOptionsMessage={() => 'Sin resultados'} />
                        </div>
                        <div className="filter-group">
                            <input
                                type="date"
                                className="filter-input"
                                value={filterFechaDesde}
                                onChange={(e) => { setFilterFechaDesde(e.target.value); setPage(1); }}
                                title="Desde"
                            />
                        </div>
                        <div className="filter-group">
                            <input
                                type="date"
                                className="filter-input"
                                value={filterFechaHasta}
                                onChange={(e) => { setFilterFechaHasta(e.target.value); setPage(1); }}
                                title="Hasta"
                            />
                        </div>
                        <div className="filter-group">
                            <select className="filter-input" value={filterEstado} onChange={(e) => { setFilterEstado(e.target.value); setPage(1); }}>
                                <option value="">Todas</option>
                                <option value="false">Generadas</option>
                                <option value="true">Pagadas</option>
                            </select>
                        </div>
                    </div>
                    <div className="filters-actions">
                        <div className="column-selector-wrapper">
                            <button className="btn btn-secondary btn-sm" onClick={() => setShowColumnSelector(!showColumnSelector)}>
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" style={{ width: 16, height: 16 }}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.24-.438.613-.431.992a6.759 6.759 0 010 .255c-.007.378.138.75.43.99l1.004.828c.424.35.534.954.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.57 6.57 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.28c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.02-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.992a6.932 6.932 0 010-.255c.007-.378-.138-.75-.43-.99l-1.004-.828a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.087.22-.128.332-.183.582-.495.644-.869l.214-1.281z" />
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                </svg>
                                Columnas
                            </button>
                            {showColumnSelector && (
                                <div className="column-selector-dropdown">
                                    {Object.entries({ espacio: 'Espacio', periodo: 'Período', totalBruto: 'Total Bruto', retenciones: 'Retenciones', neto: 'Neto', estado: 'Estado' }).map(([key, label]) => (
                                        <label key={key} className="column-option">
                                            <input type="checkbox" checked={visibleColumns[key]} onChange={() => toggleColumn(key)} />
                                            <span>{label}</span>
                                        </label>
                                    ))}
                                </div>
                            )}
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
                </div>

                {/* Content */}
                {loading ? (
                    <div className="loading"><div className="spinner"></div></div>
                ) : items.length === 0 ? (
                    <div className="empty-state">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18.75a60.07 60.07 0 0115.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 013 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 00-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 01-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 003 15h-.75M15 10.5a3 3 0 11-6 0 3 3 0 016 0zm3 0h.008v.008H18V10.5zm-12 0h.008v.008H6V10.5z" />
                        </svg>
                        <h3>No hay liquidaciones</h3>
                        <p>Las liquidaciones se generan automáticamente el primer día de cada mes</p>
                    </div>
                ) : (
                    <>
                        <div className="table-container">
                            <table className="table">
                                <thead>
                                    <tr>
                                        <th style={{ width: '40px' }}>
                                            <input type="checkbox" checked={allSelected} ref={input => { if (input) input.indeterminate = someSelected; }} onChange={handleSelectAll} />
                                        </th>
                                        <th>Empleado</th>
                                        {visibleColumns.espacio && <th>Espacio</th>}
                                        {visibleColumns.periodo && <th>Período</th>}
                                        {visibleColumns.totalBruto && <th>Total Bruto</th>}
                                        {visibleColumns.retenciones && <th>Retenciones</th>}
                                        {visibleColumns.neto && <th>Neto</th>}
                                        {visibleColumns.estado && <th>Estado</th>}
                                        <th>Acciones</th>

                                    </tr>
                                </thead>
                                <tbody>
                                    {items.map((item) => (
                                        <tr key={item.id} className={`${selectedIds.has(item.id) ? 'row-selected' : ''} ${!item.activo ? 'row-inactive' : ''}`}>
                                            <td><input type="checkbox" disabled={item.estaPagada} checked={selectedIds.has(item.id)} onChange={() => handleSelectOne(item.id)} /></td>
                                            <td>
                                                <strong>{item.contrato?.empleado?.usuario?.apellido}, {item.contrato?.empleado?.usuario?.nombre}</strong>
                                                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                                                    {item.contrato?.empleado?.usuario?.numeroDocumento}
                                                </div>
                                            </td>
                                            {visibleColumns.espacio && <td>{truncateText(item.contrato?.empleado?.espacioTrabajo?.nombre || '-')}</td>}
                                            {visibleColumns.periodo && (
                                                <td>
                                                    {formatDateOnly(item.fechaInicio)} - {formatDateOnly(item.fechaFin)}
                                                </td>
                                            )}
                                            {visibleColumns.totalBruto && <td>{formatCurrency(item.totalBruto)}</td>}
                                            {visibleColumns.retenciones && <td>{formatCurrency(item.totalRetenciones)}</td>}
                                            {visibleColumns.neto && <td><strong>{formatCurrency(item.neto)}</strong></td>}
                                            {visibleColumns.estado && (
                                                <td>
                                                    {(() => {
                                                        const statusInfo = getStatusInfo(item.estaPagada);
                                                        return (
                                                            <span style={{
                                                                display: 'inline-flex',
                                                                alignItems: 'center',
                                                                gap: '0.4rem',
                                                                fontSize: '0.75rem',
                                                                padding: '0.25rem 0.6rem',
                                                                borderRadius: '9999px',
                                                                background: `${statusInfo.color}20`,
                                                                color: statusInfo.color,
                                                                fontWeight: 700
                                                            }}>
                                                                {statusInfo.label}
                                                            </span>
                                                        );
                                                    })()}
                                                </td>
                                            )}
                                            <td>
                                                <div className="table-actions">
                                                    <>
                                                        <button className="btn btn-info btn-sm" onClick={() => handleView(item)} title="Ver">
                                                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" style={{ width: 16, height: 16 }}>
                                                                <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                                                                <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                                            </svg>
                                                            Ver
                                                        </button>
                                                        {canEdit && !item.estaPagada && (
                                                            <button className="btn btn-warning btn-sm" onClick={() => handleEdit(item)} title="Editar">
                                                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" style={{ width: 16, height: 16 }}>
                                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
                                                                </svg>
                                                                Editar
                                                            </button>
                                                        )}
                                                        {canEdit && (
                                                            <button
                                                                className="btn btn-success btn-sm"
                                                                onClick={() => handleMarcarComoPagada(item)}
                                                                title="Marcar como Pagada"
                                                                style={{ display: item.estaPagada ? 'none' : 'inline-flex' }}
                                                            >
                                                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" style={{ width: 16, height: 16 }}>
                                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                                </svg>
                                                                Pagada
                                                            </button>
                                                        )}
                                                    </>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {/* Pagination */}
                        <div className="pagination-bar">
                            <div className="pagination-info">
                                <span>Filas por página:</span>
                                <select value={limit} onChange={(e) => { setLimit(Number(e.target.value)); setPage(1); }} className="pagination-select">
                                    {ROWS_PER_PAGE_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                                </select>
                                <span className="pagination-total">
                                    {((page - 1) * limit) + 1}-{Math.min(page * limit, total)} de {total}
                                </span>
                            </div>
                            <div className="pagination-controls">
                                <button className="btn btn-secondary btn-sm" disabled={page === 1} onClick={() => setPage(1)}>«</button>
                                <button className="btn btn-secondary btn-sm" disabled={page === 1} onClick={() => setPage(p => p - 1)}>‹</button>
                                <span className="pagination-page">Página {page} de {totalPages || 1}</span>
                                <button className="btn btn-secondary btn-sm" disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}>›</button>
                                <button className="btn btn-secondary btn-sm" disabled={page >= totalPages} onClick={() => setPage(totalPages)}>»</button>
                            </div>
                        </div>
                    </>
                )}
            </div>

            {/* Modals */}
            {
                showFormulario && (
                    <LiquidacionFormulario liquidacion={editingItem} onClose={handleCloseFormulario} onSuccess={handleFormularioSuccess} />
                )
            }

            {
                showDetail && selectedItem && (
                    <LiquidacionDetail
                        liquidacion={selectedItem}
                        onClose={() => { setShowDetail(false); setSelectedItem(null); }}
                        onEdit={(liquidacion) => {
                            setShowDetail(false);
                            setSelectedItem(null);
                            setEditingItem(liquidacion);
                            setShowFormulario(true);
                        }}
                    />
                )
            }

            {
                showConceptosModal && (
                    <ConceptosSalarialesModal
                        onClose={() => setShowConceptosModal(false)}
                    />
                )
            }

            {
                showParametrosModal && (
                    <ParametrosLaboralesModal
                        onClose={() => setShowParametrosModal(false)}
                    />
                )
            }

        </div >
    );
};

export default Liquidaciones;
