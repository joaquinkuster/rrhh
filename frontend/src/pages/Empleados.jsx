import { useState, useEffect } from 'react';
import {
    getEmpleados,
    createEmpleado,
    updateEmpleado,
    deleteEmpleado,
    getNacionalidades,
} from '../services/api';
import EmpleadoForm from '../components/EmpleadoForm';
import EmpleadoList from '../components/EmpleadoList';
import ConfirmDialog from '../components/ConfirmDialog';

const GENEROS = [
    { value: '', label: 'Todos' },
    { value: 'femenino', label: 'Femenino' },
    { value: 'masculino', label: 'Masculino' },
    { value: 'otro', label: 'Otro' },
];

const ESTADOS_CIVILES = [
    { value: '', label: 'Todos' },
    { value: 'soltero', label: 'Soltero/a' },
    { value: 'casado', label: 'Casado/a' },
    { value: 'divorciado', label: 'Divorciado/a' },
    { value: 'viudo', label: 'Viudo/a' },
];

const Empleados = () => {
    const [empleados, setEmpleados] = useState([]);
    const [nacionalidades, setNacionalidades] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingEmp, setEditingEmp] = useState(null);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [filters, setFilters] = useState({
        nombre: '',
        apellido: '',
        email: '',
        nacionalidadId: '',
        genero: '',
        estadoCivil: '',
    });

    // Confirm dialog state
    const [confirmOpen, setConfirmOpen] = useState(false);
    const [employeeToDelete, setEmployeeToDelete] = useState(null);

    useEffect(() => {
        loadData();
    }, []);

    useEffect(() => {
        loadEmpleados();
    }, [filters]);

    const loadData = async () => {
        try {
            const nacs = await getNacionalidades();
            setNacionalidades(nacs);
        } catch (err) {
            console.error('Error al cargar nacionalidades:', err);
        }
    };

    const loadEmpleados = async () => {
        try {
            setLoading(true);
            const data = await getEmpleados(filters);
            setEmpleados(data);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleFilterChange = (e) => {
        const { name, value } = e.target;
        setFilters((prev) => ({ ...prev, [name]: value }));
    };

    const clearFilters = () => {
        setFilters({
            nombre: '',
            apellido: '',
            email: '',
            nacionalidadId: '',
            genero: '',
            estadoCivil: '',
        });
    };

    const handleCreate = () => {
        setEditingEmp(null);
        setShowModal(true);
        setError('');
        setSuccess('');
    };

    const handleEdit = (emp) => {
        setEditingEmp(emp);
        setShowModal(true);
        setError('');
        setSuccess('');
    };

    const handleSubmit = async (data) => {
        try {
            if (editingEmp) {
                await updateEmpleado(editingEmp.id, data);
                setSuccess('Empleado actualizado correctamente');
            } else {
                await createEmpleado(data);
                setSuccess('Empleado creado correctamente');
            }
            setShowModal(false);
            loadEmpleados();
        } catch (err) {
            setError(err.message);
        }
    };

    const handleDeleteClick = (emp) => {
        setEmployeeToDelete(emp);
        setConfirmOpen(true);
    };

    const handleConfirmDelete = async () => {
        if (!employeeToDelete) return;

        try {
            await deleteEmpleado(employeeToDelete.id);
            setSuccess('Empleado eliminado correctamente');
            loadEmpleados();
        } catch (err) {
            setError(err.message);
        } finally {
            setConfirmOpen(false);
            setEmployeeToDelete(null);
        }
    };

    const handleCancelDelete = () => {
        setConfirmOpen(false);
        setEmployeeToDelete(null);
    };

    const handleCloseModal = () => {
        setShowModal(false);
        setEditingEmp(null);
    };

    const hasActiveFilters = Object.values(filters).some((v) => v !== '');

    return (
        <div>
            <div className="page-header">
                <h1 className="page-title">Empleados</h1>
                <p className="page-subtitle">Gestiona los empleados de la organización</p>
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
                    <h3 className="card-title">Filtros</h3>
                    <button className="btn btn-primary" onClick={handleCreate}>
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" style={{ width: 20, height: 20 }}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                        </svg>
                        Nuevo Empleado
                    </button>
                </div>

                <div className="filters-bar">
                    <div className="filter-group">
                        <input
                            type="text"
                            name="nombre"
                            className="filter-input"
                            placeholder="Nombre..."
                            value={filters.nombre}
                            onChange={handleFilterChange}
                        />
                    </div>
                    <div className="filter-group">
                        <input
                            type="text"
                            name="apellido"
                            className="filter-input"
                            placeholder="Apellido..."
                            value={filters.apellido}
                            onChange={handleFilterChange}
                        />
                    </div>
                    <div className="filter-group">
                        <input
                            type="text"
                            name="email"
                            className="filter-input"
                            placeholder="Email..."
                            value={filters.email}
                            onChange={handleFilterChange}
                        />
                    </div>
                    <div className="filter-group">
                        <select
                            name="nacionalidadId"
                            className="filter-input"
                            value={filters.nacionalidadId}
                            onChange={handleFilterChange}
                        >
                            <option value="">Todas las nacionalidades</option>
                            {nacionalidades.map((nac) => (
                                <option key={nac.id} value={nac.id}>
                                    {nac.nombre}
                                </option>
                            ))}
                        </select>
                    </div>
                    <div className="filter-group">
                        <select
                            name="genero"
                            className="filter-input"
                            value={filters.genero}
                            onChange={handleFilterChange}
                        >
                            {GENEROS.map((g) => (
                                <option key={g.value} value={g.value}>
                                    {g.label}
                                </option>
                            ))}
                        </select>
                    </div>
                    <div className="filter-group">
                        <select
                            name="estadoCivil"
                            className="filter-input"
                            value={filters.estadoCivil}
                            onChange={handleFilterChange}
                        >
                            {ESTADOS_CIVILES.map((e) => (
                                <option key={e.value} value={e.value}>
                                    {e.label}
                                </option>
                            ))}
                        </select>
                    </div>
                    {hasActiveFilters && (
                        <button className="btn btn-secondary btn-sm" onClick={clearFilters}>
                            Limpiar filtros
                        </button>
                    )}
                </div>

                <EmpleadoList
                    empleados={empleados}
                    onEdit={handleEdit}
                    onDelete={handleDeleteClick}
                    loading={loading}
                />
            </div>

            {showModal && (
                <div className="modal-overlay" onClick={handleCloseModal}>
                    <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '800px' }}>
                        <div className="modal-header">
                            <h2 className="modal-title">
                                {editingEmp ? 'Editar' : 'Nuevo'} Empleado
                            </h2>
                            <button className="modal-close" onClick={handleCloseModal}>
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" style={{ width: 24, height: 24 }}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>
                        <div className="modal-body">
                            <EmpleadoForm
                                empleado={editingEmp}
                                onSubmit={handleSubmit}
                                onCancel={handleCloseModal}
                            />
                        </div>
                    </div>
                </div>
            )}

            <ConfirmDialog
                isOpen={confirmOpen}
                title="Eliminar empleado"
                message={employeeToDelete ? `¿Estás seguro de eliminar al empleado "${employeeToDelete.nombre} ${employeeToDelete.apellido}"? Esta acción no se puede deshacer.` : ''}
                onConfirm={handleConfirmDelete}
                onCancel={handleCancelDelete}
                confirmText="Eliminar"
                cancelText="Cancelar"
                variant="danger"
            />
        </div>
    );
};

export default Empleados;
