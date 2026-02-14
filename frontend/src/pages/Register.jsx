import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import EmpleadoWizard from '../components/EmpleadoWizard';
import BackgroundCarousel from '../components/BackgroundCarousel';
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
            navigate('/dashboard');
        }, 1500);
    };

    return (
        <>
            <BackgroundCarousel />

            {showSuccessAlert && (
                <Alert
                    type="success"
                    message="¡Registro exitoso! Iniciando sesión..."
                    onClose={() => setShowSuccessAlert(false)}
                    duration={1500}
                />
            )}

            <div className="auth-container">
                <div className="auth-card register-card">
                    {/* Left side - Branding (30%) */}
                    <div className="auth-right register-left-side">
                        <div className="auth-promo">
                            <img src="/logo.png" alt="CataratasRH" className="register-sidebar-logo" />
                            <h2>Cataratas<span>RH</span></h2>
                            <p>Bienvenido al Sistema de Gestión de Recursos Humanos</p>
                            <Link to="/login" className="register-back-link">
                                ← Volver al inicio de sesión
                            </Link>
                        </div>
                    </div>

                    {/* Right side - Form (70%) */}
                    <div className="auth-left register-right-side">
                        <EmpleadoWizard
                            onClose={() => navigate('/login')}
                            onSuccess={handleSuccess}
                            isPublicRegistration={true}
                        />
                    </div>
                </div>
            </div>
        </>
    );
};

export default Register;
