import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import RegistroPublicoForm from '../components/RegistroPublicoForm';
import BackgroundCarousel from '../components/BackgroundCarousel';
import Alert from '../components/Alert';
import './Register.css';

const Register = () => {
    const navigate = useNavigate();
    const { checkAuth } = useAuth();
    const [showSuccessAlert, setShowSuccessAlert] = useState(false);

    const handleSuccess = async () => {
        sessionStorage.setItem('justLoggedIn', 'true');
        await checkAuth();
    };

    return (
        <>
            <BackgroundCarousel />

            <div className="auth-container">
                <div className="auth-card register-card">
                    {/* Left side - Branding (30%) */}
                    <div className="auth-right register-left-side">
                        <div className="auth-promo">
                            <img src="/logo.png" alt="CataratasRH" className="register-sidebar-logo" />
                            <h2>Cataratas<span>RH</span></h2>
                            <p>Registrate en el sistema</p>
                            <Link to="/login" className="register-back-link">
                                ← Iniciar sesión
                            </Link>
                        </div>
                    </div>

                    {/* Right side - Form (70%) */}
                    <div className="auth-left register-right-side">
                        <RegistroPublicoForm onSuccess={handleSuccess} />
                    </div>
                </div>
            </div>
        </>
    );
};

export default Register;
