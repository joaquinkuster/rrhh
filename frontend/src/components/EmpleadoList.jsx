import { ActionButtons } from './shared';

const EmpleadoList = ({ empleados, onEdit, onDelete, loading }) => {
    const getGeneroLabel = (genero) => {
        const labels = { femenino: 'Femenino', masculino: 'Masculino', otro: 'Otro' };
        return labels[genero] || genero;
    };

    const getTipoDocLabel = (tipo) => {
        const labels = { cedula: 'Cédula', pasaporte: 'Pasaporte' };
        return labels[tipo] || tipo;
    };

    if (loading) {
        return (
            <div className="loading">
                <div className="spinner"></div>
            </div>
        );
    }

    if (empleados.length === 0) {
        return (
            <div className="empty-state">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
                </svg>
                <h3>No hay empleados</h3>
                <p>Crea un nuevo empleado para comenzar</p>
            </div>
        );
    }

    return (
        <div className="table-container">
            <table className="table">
                <thead>
                    <tr>
                        <th>Nombre Completo</th>
                        <th>Email</th>
                        <th>Documento</th>
                        <th>Nacionalidad</th>
                        <th>Género</th>
                        <th>Estado</th>
                        <th>Acciones</th>
                    </tr>
                </thead>
                <tbody>
                    {empleados.map((emp) => (
                        <tr key={emp.id} className={!emp.activo ? 'row-inactive' : ''}>
                            <td>
                                <strong>{emp.apellido}, {emp.nombre}</strong>
                            </td>
                            <td>{emp.email}</td>
                            <td>
                                <span className="badge badge-secondary">
                                    {getTipoDocLabel(emp.tipoDocumento)}: {emp.numeroDocumento}
                                </span>
                            </td>
                            <td>
                                <span className="badge badge-primary">
                                    {emp.nacionalidad?.nombre || 'N/A'}
                                </span>
                            </td>
                            <td>{getGeneroLabel(emp.genero)}</td>
                            <td>
                                <span className={`badge ${emp.activo ? 'badge-success' : 'badge-danger'}`}>
                                    {emp.activo ? 'Activo' : 'Baja'}
                                </span>
                            </td>
                            <td>
                                <ActionButtons
                                    onEdit={() => onEdit(emp)}
                                    onDelete={() => onDelete(emp)}
                                />
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};

export default EmpleadoList;
