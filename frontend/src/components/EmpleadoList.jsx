const EmpleadoList = ({ empleados, onEdit, onDelete, loading }) => {
    const getGeneroLabel = (genero) => {
        const labels = { femenino: 'Femenino', masculino: 'Masculino', otro: 'Otro' };
        return labels[genero] || genero;
    };

    const getEstadoCivilLabel = (estado) => {
        const labels = { soltero: 'Soltero/a', casado: 'Casado/a', divorciado: 'Divorciado/a', viudo: 'Viudo/a' };
        return labels[estado] || estado;
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
                                <div className="table-actions">
                                    <button
                                        className="btn btn-secondary btn-sm"
                                        onClick={() => onEdit(emp)}
                                        title="Editar"
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" style={{ width: 16, height: 16 }}>
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
                                        </svg>
                                        Editar
                                    </button>
                                    <button
                                        className="btn btn-danger btn-sm"
                                        onClick={() => onDelete(emp)}
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
                </tbody>
            </table>
        </div>
    );
};

export default EmpleadoList;
