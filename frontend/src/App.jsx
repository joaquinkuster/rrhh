import { useState } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import Empleados from './pages/Empleados';
import Empresas from './pages/Empresas';
import Contratos from './pages/Contratos';
import RegistrosSalud from './pages/RegistrosSalud';
import Evaluaciones from './pages/Evaluaciones';
import Contactos from './pages/Contactos';
import Solicitudes from './pages/Solicitudes';

function App() {
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

    return (
        <div className={`app-layout ${sidebarCollapsed ? 'sidebar-collapsed' : ''}`}>
            <Sidebar
                isCollapsed={sidebarCollapsed}
                onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
            />
            <main className="main-content">
                <Routes>
                    <Route path="/" element={<Navigate to="/empleados" replace />} />
                    <Route path="/empleados" element={<Empleados />} />
                    <Route path="/empresas" element={<Empresas />} />
                    <Route path="/contratos" element={<Contratos />} />
                    <Route path="/registros-salud" element={<RegistrosSalud />} />
                    <Route path="/evaluaciones" element={<Evaluaciones />} />
                    <Route path="/contactos" element={<Contactos />} />
                    <Route path="/solicitudes" element={<Solicitudes />} />
                </Routes>
            </main>
        </div>
    );
}

export default App;
