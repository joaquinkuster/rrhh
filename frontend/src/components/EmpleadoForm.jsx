import { useState, useEffect } from 'react';
import { getNacionalidades } from '../services/api';

const TIPOS_DOCUMENTO = [
    { value: 'cedula', label: 'Cédula' },
    { value: 'pasaporte', label: 'Pasaporte' },
];

const GENEROS = [
    { value: 'femenino', label: 'Femenino' },
    { value: 'masculino', label: 'Masculino' },
    { value: 'otro', label: 'Otro' },
];

const ESTADOS_CIVILES = [
    { value: 'soltero', label: 'Soltero/a' },
    { value: 'casado', label: 'Casado/a' },
    { value: 'divorciado', label: 'Divorciado/a' },
    { value: 'viudo', label: 'Viudo/a' },
];

const initialFormData = {
    nombre: '',
    apellido: '',
    email: '',
    telefono: '',
    tipoDocumento: 'cedula',
    numeroDocumento: '',
    cuil: '',
    fechaNacimiento: '',
    nacionalidadId: '',
    genero: 'masculino',
    estadoCivil: 'soltero',
    activo: true,
};

const formatCuil = (value) => {
    // Remove all non-digits
    const digits = value.replace(/\D/g, '');

    // Format as XX-XXXXXXXX-X
    if (digits.length <= 2) {
        return digits;
    } else if (digits.length <= 10) {
        return `${digits.slice(0, 2)}-${digits.slice(2)}`;
    } else {
        return `${digits.slice(0, 2)}-${digits.slice(2, 10)}-${digits.slice(10, 11)}`;
    }
};

const EmpleadoForm = ({ empleado, onSubmit, onCancel }) => {
    const [formData, setFormData] = useState(initialFormData);
    const [nacionalidades, setNacionalidades] = useState([]);
    const [errors, setErrors] = useState({});
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        loadNacionalidades();
        if (empleado) {
            setFormData({
                nombre: empleado.nombre || '',
                apellido: empleado.apellido || '',
                email: empleado.email || '',
                telefono: empleado.telefono || '',
                tipoDocumento: empleado.tipoDocumento || 'cedula',
                numeroDocumento: empleado.numeroDocumento || '',
                cuil: empleado.cuil || '',
                fechaNacimiento: empleado.fechaNacimiento || '',
                nacionalidadId: empleado.nacionalidadId || '',
                genero: empleado.genero || 'masculino',
                estadoCivil: empleado.estadoCivil || 'soltero',
                activo: empleado.activo !== undefined ? empleado.activo : true,
            });
        }
    }, [empleado]);

    const loadNacionalidades = async () => {
        try {
            const data = await getNacionalidades();
            setNacionalidades(data);
        } catch (error) {
            console.error('Error al cargar nacionalidades:', error);
        }
    };

    const validateForm = () => {
        const newErrors = {};

        if (!formData.nombre.trim()) {
            newErrors.nombre = 'El nombre es requerido';
        } else if (formData.nombre.length < 2) {
            newErrors.nombre = 'El nombre debe tener al menos 2 caracteres';
        }

        if (!formData.apellido.trim()) {
            newErrors.apellido = 'El apellido es requerido';
        } else if (formData.apellido.length < 2) {
            newErrors.apellido = 'El apellido debe tener al menos 2 caracteres';
        }

        if (!formData.email.trim()) {
            newErrors.email = 'El email es requerido';
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
            newErrors.email = 'El email no es válido';
        }

        if (!formData.numeroDocumento.trim()) {
            newErrors.numeroDocumento = 'El número de documento es requerido';
        }

        if (formData.cuil && !/^(\d{2}-\d{8}-\d{1})?$/.test(formData.cuil)) {
            newErrors.cuil = 'El CUIL debe tener el formato XX-XXXXXXXX-X';
        }

        if (!formData.fechaNacimiento) {
            newErrors.fechaNacimiento = 'La fecha de nacimiento es requerida';
        }

        if (!formData.nacionalidadId) {
            newErrors.nacionalidadId = 'La nacionalidad es requerida';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;

        if (name === 'cuil') {
            const formatted = formatCuil(value);
            setFormData((prev) => ({ ...prev, cuil: formatted }));
        } else if (type === 'checkbox') {
            setFormData((prev) => ({ ...prev, [name]: checked }));
        } else {
            setFormData((prev) => ({ ...prev, [name]: value }));
        }

        if (errors[name]) {
            setErrors((prev) => ({ ...prev, [name]: '' }));
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!validateForm()) return;

        setLoading(true);
        try {
            await onSubmit(formData);
        } finally {
            setLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit}>
            <div className="form-grid">
                {/* Nombre */}
                <div className="form-group">
                    <label className="form-label">
                        Nombre <span className="required">*</span>
                    </label>
                    <input
                        type="text"
                        name="nombre"
                        className={`form-input ${errors.nombre ? 'error' : ''}`}
                        value={formData.nombre}
                        onChange={handleChange}
                        placeholder="Ej: Juan"
                    />
                    {errors.nombre && <span className="form-error">{errors.nombre}</span>}
                </div>

                {/* Apellido */}
                <div className="form-group">
                    <label className="form-label">
                        Apellido <span className="required">*</span>
                    </label>
                    <input
                        type="text"
                        name="apellido"
                        className={`form-input ${errors.apellido ? 'error' : ''}`}
                        value={formData.apellido}
                        onChange={handleChange}
                        placeholder="Ej: Pérez"
                    />
                    {errors.apellido && <span className="form-error">{errors.apellido}</span>}
                </div>

                {/* Email */}
                <div className="form-group">
                    <label className="form-label">
                        Email <span className="required">*</span>
                    </label>
                    <input
                        type="email"
                        name="email"
                        className={`form-input ${errors.email ? 'error' : ''}`}
                        value={formData.email}
                        onChange={handleChange}
                        placeholder="Ej: juan@email.com"
                    />
                    {errors.email && <span className="form-error">{errors.email}</span>}
                </div>

                {/* Teléfono */}
                <div className="form-group">
                    <label className="form-label">Teléfono</label>
                    <input
                        type="tel"
                        name="telefono"
                        className="form-input"
                        value={formData.telefono}
                        onChange={handleChange}
                        placeholder="Ej: +54 11 1234-5678"
                    />
                </div>

                {/* Tipo de Documento */}
                <div className="form-group">
                    <label className="form-label">
                        Tipo de Documento <span className="required">*</span>
                    </label>
                    <select
                        name="tipoDocumento"
                        className="form-select"
                        value={formData.tipoDocumento}
                        onChange={handleChange}
                    >
                        {TIPOS_DOCUMENTO.map((tipo) => (
                            <option key={tipo.value} value={tipo.value}>
                                {tipo.label}
                            </option>
                        ))}
                    </select>
                </div>

                {/* Número de Documento */}
                <div className="form-group">
                    <label className="form-label">
                        Número de Documento <span className="required">*</span>
                    </label>
                    <input
                        type="text"
                        name="numeroDocumento"
                        className={`form-input ${errors.numeroDocumento ? 'error' : ''}`}
                        value={formData.numeroDocumento}
                        onChange={handleChange}
                        placeholder="Ej: 12345678"
                    />
                    {errors.numeroDocumento && <span className="form-error">{errors.numeroDocumento}</span>}
                </div>

                {/* CUIL */}
                <div className="form-group">
                    <label className="form-label">CUIL</label>
                    <input
                        type="text"
                        name="cuil"
                        className={`form-input ${errors.cuil ? 'error' : ''}`}
                        value={formData.cuil}
                        onChange={handleChange}
                        placeholder="XX-XXXXXXXX-X"
                        maxLength={13}
                    />
                    {errors.cuil && <span className="form-error">{errors.cuil}</span>}
                </div>

                {/* Fecha de Nacimiento */}
                <div className="form-group">
                    <label className="form-label">
                        Fecha de Nacimiento <span className="required">*</span>
                    </label>
                    <input
                        type="date"
                        name="fechaNacimiento"
                        className={`form-input ${errors.fechaNacimiento ? 'error' : ''}`}
                        value={formData.fechaNacimiento}
                        onChange={handleChange}
                    />
                    {errors.fechaNacimiento && <span className="form-error">{errors.fechaNacimiento}</span>}
                </div>

                {/* Nacionalidad */}
                <div className="form-group">
                    <label className="form-label">
                        Nacionalidad <span className="required">*</span>
                    </label>
                    <select
                        name="nacionalidadId"
                        className={`form-select ${errors.nacionalidadId ? 'error' : ''}`}
                        value={formData.nacionalidadId}
                        onChange={handleChange}
                    >
                        <option value="">Seleccione una nacionalidad</option>
                        {nacionalidades.map((nac) => (
                            <option key={nac.id} value={nac.id}>
                                {nac.nombre}
                            </option>
                        ))}
                    </select>
                    {errors.nacionalidadId && <span className="form-error">{errors.nacionalidadId}</span>}
                </div>

                {/* Género */}
                <div className="form-group">
                    <label className="form-label">
                        Género <span className="required">*</span>
                    </label>
                    <select
                        name="genero"
                        className="form-select"
                        value={formData.genero}
                        onChange={handleChange}
                    >
                        {GENEROS.map((genero) => (
                            <option key={genero.value} value={genero.value}>
                                {genero.label}
                            </option>
                        ))}
                    </select>
                </div>

                {/* Estado Civil */}
                <div className="form-group">
                    <label className="form-label">
                        Estado Civil <span className="required">*</span>
                    </label>
                    <select
                        name="estadoCivil"
                        className="form-select"
                        value={formData.estadoCivil}
                        onChange={handleChange}
                    >
                        {ESTADOS_CIVILES.map((estado) => (
                            <option key={estado.value} value={estado.value}>
                                {estado.label}
                            </option>
                        ))}
                    </select>
                </div>

                {/* Estado Activo */}
                <div className="form-group">
                    <label className="form-label checkbox-label">
                        <input
                            type="checkbox"
                            name="activo"
                            className="form-checkbox"
                            checked={formData.activo}
                            onChange={handleChange}
                        />
                        <span>Empleado activo</span>
                    </label>
                </div>
            </div>

            <div className="form-actions">
                <button type="button" className="btn btn-secondary" onClick={onCancel} disabled={loading}>
                    Cancelar
                </button>
                <button type="submit" className="btn btn-primary" disabled={loading}>
                    {loading ? 'Guardando...' : empleado ? 'Actualizar' : 'Crear'} Empleado
                </button>
            </div>
        </form>
    );
};

export default EmpleadoForm;
