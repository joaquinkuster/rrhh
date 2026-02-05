import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import EmpleadoWizard from '../components/EmpleadoWizard';
import Alert from '../components/Alert';
import './Register.css';

const Register = () => {
    const navigate = useNavigate();
    const { checkAuth } = useAuth();
    const [showSuccessAlert, setShowSuccessAlert] = useState(false);

    const handleSuccess = async (empleado) => {
        // Mostrar alerta de éxito
        setShowSuccessAlert(true);

        // Verificar autenticación (el backend ya creó la sesión)
        await checkAuth();

        // Redirigir después de un momento
        setTimeout(() => {
            navigate('/empleados');
        }, 1500);
    };

    return (
        <>
            {showSuccessAlert && (
                <Alert
                    type="success"
                    message="¡Registro exitoso! Iniciando sesión..."
                    onClose={() => setShowSuccessAlert(false)}
                    duration={1500}
                />
            )}

            <div className="register-container">
                <div className="register-content">
                    <div className="register-header">
                        <h1>Registro de Usuario</h1>
                        <p>Completá el formulario para registrarte en el sistema</p>
                    </div>
                    <EmpleadoWizard
                        onClose={() => navigate('/login')}
                        onSuccess={handleSuccess}
                        isPublicRegistration={true}
                    />
                </div>
            </div>
        </>
    );
};

export default Register;
