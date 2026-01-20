import { useState, useEffect } from 'react';
import {
    getNacionalidades,
    createNacionalidad,
    updateNacionalidad,
    deleteNacionalidad,
} from '../services/api';
import NacionalidadForm from '../components/NacionalidadForm';
import NacionalidadList from '../components/NacionalidadList';
import ConfirmDialog from '../components/ConfirmDialog';
import { PageHeader, AlertMessage, FormModal } from '../components/shared';

const Nacionalidades = () => {
    // State
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

    // Search
    const [search, setSearch] = useState('');

    // Load data
    useEffect(() => {
        loadNacionalidades();
    }, [search]);

    const loadNacionalidades = async () => {
        try {
            setLoading(true);
            const data = await getNacionalidades(search);
            setNacionalidades(data);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

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
                await updateNacionalidad(editingItem.id, data);
                setSuccess('Nacionalidad actualizada correctamente');
            } else {
                await createNacionalidad(data);
                setSuccess('Nacionalidad creada correctamente');
            }
            handleCloseModal();
            loadNacionalidades();
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
            await deleteNacionalidad(itemToDelete.id);
            setSuccess('Nacionalidad eliminada correctamente');
            loadNacionalidades();
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
                title="Nacionalidades"
                subtitle="Gestiona las nacionalidades del sistema"
            />

            <AlertMessage type="error" message={error} onClose={() => setError('')} />
            <AlertMessage type="success" message={success} onClose={() => setSuccess('')} />

            <div className="card">
                <div className="card-header">
                    <div className="filter-group">
                        <input
                            type="text"
                            className="filter-input"
                            placeholder="Buscar nacionalidad..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>
                    <button className="btn btn-primary" onClick={handleCreate}>
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" style={{ width: 20, height: 20 }}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                        </svg>
                        Nueva Nacionalidad
                    </button>
                </div>

                <NacionalidadList
                    nacionalidades={nacionalidades}
                    onEdit={handleEdit}
                    onDelete={handleDeleteClick}
                    loading={loading}
                />
            </div>

            <FormModal
                isOpen={showModal}
                onClose={handleCloseModal}
                headerTitle={editingItem ? 'Editar Nacionalidad' : 'Nueva Nacionalidad'}
                contentTitle="Información de la Nacionalidad"
                contentSubtitle="Ingresa el nombre de la nacionalidad"
            >
                <NacionalidadForm
                    nacionalidad={editingItem}
                    onSubmit={handleSubmit}
                    onCancel={handleCloseModal}
                />
            </FormModal>

            <ConfirmDialog
                isOpen={confirmOpen}
                title="Eliminar nacionalidad"
                message={itemToDelete ? `¿Estás seguro de eliminar la nacionalidad "${itemToDelete.nombre}"? Esta acción no se puede deshacer.` : ''}
                onConfirm={handleConfirmDelete}
                onCancel={handleCancelDelete}
                confirmText="Eliminar"
                cancelText="Cancelar"
                variant="danger"
            />
        </div>
    );
};

export default Nacionalidades;
