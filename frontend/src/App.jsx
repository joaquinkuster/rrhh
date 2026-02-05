import { useState } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import PublicRoute from './components/PublicRoute';
import Sidebar from './components/Sidebar';
import Navbar from './components/Navbar';
import Login from './pages/Login';
import Register from './pages/Register';
import Empleados from './pages/Empleados';
import Empresas from './pages/Empresas';
import Contratos from './pages/Contratos';
import RegistrosSalud from './pages/RegistrosSalud';
import Evaluaciones from './pages/Evaluaciones';
import Contactos from './pages/Contactos';
import Solicitudes from './pages/Solicitudes';
import Liquidaciones from './pages/Liquidaciones';

// Component wrapper para rutas protegidas con sidebar
function ProtectedLayout({ sidebarCollapsed, setSidebarCollapsed, children }) {
    return (
        <div className={`app-layout ${sidebarCollapsed ? 'sidebar-collapsed' : ''}`}>
            <Sidebar
                isCollapsed={sidebarCollapsed}
                onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
            />
            <main className="main-content">
                <Navbar />
                <div className="page-container">
                    {children}
                </div>
            </main>
        </div>
    );
}

function App() {
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

    return (
        <AuthProvider>
            <Routes>
                {/* Rutas públicas - redirigen a /empleados si ya está autenticado */}
                <Route path="/login" element={
                    <PublicRoute>
                        <Login />
                    </PublicRoute>
                } />
                <Route path="/register" element={
                    <PublicRoute>
                        <Register />
                    </PublicRoute>
                } />

                {/* Rutas protegidas */}
                <Route element={<ProtectedRoute />}>
                    <Route path="/" element={<Navigate to="/empleados" replace />} />
                    <Route path="/empleados" element={
                        <ProtectedLayout sidebarCollapsed={sidebarCollapsed} setSidebarCollapsed={setSidebarCollapsed}>
                            <Empleados />
                        </ProtectedLayout>
                    } />
                    <Route path="/empresas" element={
                        <ProtectedLayout sidebarCollapsed={sidebarCollapsed} setSidebarCollapsed={setSidebarCollapsed}>
                            <Empresas />
                        </ProtectedLayout>
                    } />
                    <Route path="/contratos" element={
                        <ProtectedLayout sidebarCollapsed={sidebarCollapsed} setSidebarCollapsed={setSidebarCollapsed}>
                            <Contratos />
                        </ProtectedLayout>
                    } />
                    <Route path="/registros-salud" element={
                        <ProtectedLayout sidebarCollapsed={sidebarCollapsed} setSidebarCollapsed={setSidebarCollapsed}>
                            <RegistrosSalud />
                        </ProtectedLayout>
                    } />
                    <Route path="/evaluaciones" element={
                        <ProtectedLayout sidebarCollapsed={sidebarCollapsed} setSidebarCollapsed={setSidebarCollapsed}>
                            <Evaluaciones />
                        </ProtectedLayout>
                    } />
                    <Route path="/contactos" element={
                        <ProtectedLayout sidebarCollapsed={sidebarCollapsed} setSidebarCollapsed={setSidebarCollapsed}>
                            <Contactos />
                        </ProtectedLayout>
                    } />
                    <Route path="/solicitudes" element={
                        <ProtectedLayout sidebarCollapsed={sidebarCollapsed} setSidebarCollapsed={setSidebarCollapsed}>
                            <Solicitudes />
                        </ProtectedLayout>
                    } />
                    <Route path="/liquidaciones" element={
                        <ProtectedLayout sidebarCollapsed={sidebarCollapsed} setSidebarCollapsed={setSidebarCollapsed}>
                            <Liquidaciones />
                        </ProtectedLayout>
                    } />
                </Route>
            </Routes>
        </AuthProvider>
    );
}

export default App;
