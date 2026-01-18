import { useState } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import Empleados from './pages/Empleados';
import Nacionalidades from './pages/Nacionalidades';
import Empresas from './pages/Empresas';

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
                    <Route path="/nacionalidades" element={<Nacionalidades />} />
                    <Route path="/empresas" element={<Empresas />} />
                </Routes>
            </main>
        </div>
    );
}

export default App;
