import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getContratos } from '../services/api';
import EmpleadoDetail from './EmpleadoDetail';
import EmpleadoWizard from './EmpleadoWizard';
import ConfirmDialog from './ConfirmDialog';
import './Navbar.css';

const Navbar = () => {
    const navigate = useNavigate();
    const { user, logout, checkAuth, seleccionarContrato } = useAuth();
    const [showMenu, setShowMenu] = useState(false);
    const [contratos, setContratos] = useState([]);
    const [showProfile, setShowProfile] = useState(false);
    const [showEditWizard, setShowEditWizard] = useState(false);
    const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
    const [avatarPath, setAvatarPath] = useState('');
    const menuRef = useRef(null);

    // Cerrar menú al hacer click fuera
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (menuRef.current && !menuRef.current.contains(event.target)) {
                setShowMenu(false);
            }
        };

        if (showMenu) {
            document.addEventListener('mousedown', handleClickOutside);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [showMenu]);

    if (!user) return null;

    // Determinar avatar según género y cargar contratos
    useEffect(() => {
        if (!user) return;

        const genero = user.genero?.toLowerCase() || 'otro';
        const randomIndex = Math.floor(Math.random() * 3) + 1;

        setAvatarPath(`/avatares/${genero}/${genero}${randomIndex}.jpg`);

        // Fetch user contracts for selector
        if (user.esEmpleado && user.empleadoId) {
            getContratos({ empleadoId: user.empleadoId, activo: true })
                .then(res => {
                    setContratos(res.data || []);
                })
                .catch(console.error);
        } else {
            setContratos([]);
        }
    }, [user]);

    const handleContractChange = async (e) => {
        const id = e.target.value;
        if (id) {
            try {
                await seleccionarContrato(parseInt(id));
                setShowMenu(false); // Close menu after selection or keep it open? User preference usually to keep context. Let's close to feedback success implicitly.
            } catch (err) {
                console.error("Failed to select contract", err);
            }
        }
    };

    // Truncar nombre si es muy largo
    const truncateName = (name, maxLength = 20) => {
        if (!name) return '';
        return name.length > maxLength ? `${name.substring(0, maxLength)}...` : name;
    };

    const fullName = `${user.nombre} ${user.apellido}`;
    const displayName = truncateName(fullName);
    const role = user.esAdministrador ? 'Administrador' : 'Usuario';

    const handleViewProfile = () => {
        setShowMenu(false);
        setShowProfile(true);
    };

    const handleEditProfile = () => {
        setShowProfile(false);
        setShowEditWizard(true);
    };

    const handleEditSuccess = async () => {
        setShowEditWizard(false);
        await checkAuth(); // Recargar datos del usuario
    };

    const handleLogoutClick = () => {
        setShowMenu(false);
        setShowLogoutConfirm(true);
    };

    const handleConfirmLogout = async () => {
        try {
            await logout();
            navigate('/login');
        } catch (error) {
            console.error('Error al cerrar sesión:', error);
        }
    };

    return (
        <>
            <nav className="navbar">
                <div className="navbar-content">
                    <div className="navbar-left">
                        {/* Espacio para breadcrumbs o título si se necesita */}
                    </div>

                    <div className="navbar-right">
                        <div className="user-menu-wrapper" ref={menuRef}>
                            <button
                                className="user-menu-trigger"
                                onClick={() => setShowMenu(!showMenu)}
                                aria-label="Menú de usuario"
                            >
                                <img
                                    src={avatarPath}
                                    alt="Avatar"
                                    className="user-avatar"
                                    onError={(e) => {
                                        e.target.src = '/avatares/otro/otro1.jpg';
                                    }}
                                />
                                <div className="user-info">
                                    <span className="user-name">{displayName}</span>
                                    <span className="user-role">{role}</span>
                                </div>
                                <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    strokeWidth={1.5}
                                    stroke="currentColor"
                                    className={`chevron-icon ${showMenu ? 'rotated' : ''}`}
                                >
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                                </svg>
                            </button>

                            {showMenu && (
                                <div className="user-menu-dropdown">
                                    <div style={{ padding: '0.75rem 1rem', borderBottom: '1px solid var(--neutral-200)', minWidth: '220px' }}>
                                        <label style={{ display: 'block', fontSize: '0.70rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--neutral-500)', marginBottom: '0.5rem', letterSpacing: '0.05em' }}>
                                            Contrato Activo
                                        </label>
                                        <select
                                            className="form-select"
                                            style={{ width: '100%', fontSize: '0.85rem', padding: '0.5rem', height: 'auto', backgroundColor: 'var(--neutral-50)', borderColor: 'var(--neutral-200)' }}
                                            value={user.ultimoContratoSeleccionadoId || ''}
                                            onChange={handleContractChange}
                                            disabled={!contratos.length}
                                            onClick={(e) => e.stopPropagation()}
                                        >
                                            {contratos.length === 0 ? (
                                                <option value="">Sin contratos</option>
                                            ) : (
                                                contratos.map(c => {
                                                    const puesto = c.puestos && c.puestos.length > 0 ? c.puestos[0].nombre : 'Sin Puesto';
                                                    const empresa = c.puestos && c.puestos.length > 0 ? c.puestos[0].departamento?.area?.empresa?.nombre : 'Empresa';
                                                    return (
                                                        <option key={c.id} value={c.id}>
                                                            {puesto} - {empresa}
                                                        </option>
                                                    );
                                                })
                                            )}
                                        </select>
                                    </div>

                                    <button
                                        className="menu-item"
                                        onClick={handleViewProfile}
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
                                        </svg>
                                        Ver información
                                    </button>
                                    <div className="menu-divider"></div>
                                    <button
                                        className="menu-item menu-item-danger"
                                        onClick={handleLogoutClick}
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15M12 9l-3 3m0 0l3 3m-3-3h12.75" />
                                        </svg>
                                        Cerrar sesión
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </nav>

            {/* Modal de perfil */}
            {showProfile && user && (
                <EmpleadoDetail
                    empleado={user}
                    onClose={() => setShowProfile(false)}
                    onEdit={handleEditProfile}
                    hideEditButton={!user.esAdministrador && user.esEmpleado}
                />
            )}

            {/* Wizard de edición */}
            {showEditWizard && user && (
                <EmpleadoWizard
                    empleado={user}
                    onClose={() => setShowEditWizard(false)}
                    onSuccess={handleEditSuccess}
                />
            )}

            {/* Confirmación de cierre de sesión */}
            <ConfirmDialog
                isOpen={showLogoutConfirm}
                title="Cerrar sesión"
                message="¿Estás seguro de que deseas cerrar sesión?"
                onConfirm={handleConfirmLogout}
                onCancel={() => setShowLogoutConfirm(false)}
                confirmText="Cerrar sesión"
                variant="danger"
            />
        </>
    );
};

export default Navbar;
