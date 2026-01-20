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
import { PageHeader, AlertMessage, FormModal } from '../components/shared';

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
    // State
    const [empleados, setEmpleados] = useState([]);
    const [nacionalidades, setNacionalidades] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    // Modal state
    const [showModal, setShowModal] = useState(false);
    const [editingItem, setEditingItem] = useState(null);

    // Delete confirmation state
    const [confirmOpen, setConfirmOpen] = useState(false);
    const [itemToDelete, setItemToDelete] = useState(null);

    // Filters
    const [filters, setFilters] = useState({
        nombre: '',
        apellido: '',
        email: '',
        nacionalidadId: '',
        genero: '',
        estadoCivil: '',
    });

    // Load data
    useEffect(() => {
        loadNacionalidades();
    }, []);

    useEffect(() => {
        loadEmpleados();
    }, [filters]);

    const loadNacionalidades = async () => {
        try {
            const data = await getNacionalidades();
            setNacionalidades(data);
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

    // Filter handlers
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

    const hasActiveFilters = Object.values(filters).some((v) => v !== '');

    // CRUD handlers
    const handleCreate = () => {
        setEditingItem(null);
        setShowModal(true);
        setError('');
        setSuccess('');
    };

    const handleEdit = (item) => {
        setEditingItem(item);
        setShowModal(true);
        setError('');
        setSuccess('');
    };

    const handleCloseModal = () => {
        setShowModal(false);
        setEditingItem(null);
    };

    const handleSubmit = async (data) => {
        try {
            if (editingItem) {
                await updateEmpleado(editingItem.id, data);
                setSuccess('Empleado actualizado correctamente');
            } else {
                await createEmpleado(data);
                setSuccess('Empleado creado correctamente');
            }
            handleCloseModal();
            loadEmpleados();
        } catch (err) {
            setError(err.message);
        }
    };

    const handleDeleteClick = (item) => {
        setItemToDelete(item);
        setConfirmOpen(true);
    };

    const handleConfirmDelete = async () => {
        if (!itemToDelete) return;

        try {
            await deleteEmpleado(itemToDelete.id);
            setSuccess('Empleado eliminado correctamente');
            loadEmpleados();
        } catch (err) {
            setError(err.message);
        } finally {
            setConfirmOpen(false);
            setItemToDelete(null);
        }
    };

    const handleCancelDelete = () => {
        setConfirmOpen(false);
        setItemToDelete(null);
    };

    return (
        <div>
            <PageHeader
                title="Empleados"
                subtitle="Gestiona los empleados de la organización"
            />

            <AlertMessage type="error" message={error} onClose={() => setError('')} />
            <AlertMessage type="success" message={success} onClose={() => setSuccess('')} />

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

            <FormModal
                isOpen={showModal}
                onClose={handleCloseModal}
                headerTitle={editingItem ? 'Editar Empleado' : 'Nuevo Empleado'}
                contentTitle="Información del Empleado"
                contentSubtitle="Ingresa los datos básicos del empleado"
            >
                <EmpleadoForm
                    empleado={editingItem}
                    onSubmit={handleSubmit}
                    onCancel={handleCloseModal}
                />
            </FormModal>

            <ConfirmDialog
                isOpen={confirmOpen}
                title="Eliminar empleado"
                message={itemToDelete ? `¿Estás seguro de eliminar al empleado "${itemToDelete.nombre} ${itemToDelete.apellido}"? Esta acción no se puede deshacer.` : ''}
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
