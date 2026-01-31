import React from 'react';
import { Link, useLocation } from 'react-router-dom';

const LiquidacionTabs = () => {
    const location = useLocation();
    const currentPath = location.pathname;

    const getTabStyle = (path) => {
        const isActive = currentPath === path;
        return {
            padding: '0.75rem 1rem',
            borderBottom: isActive ? '2px solid var(--primary-600)' : '2px solid transparent',
            color: isActive ? 'var(--primary-700)' : 'var(--neutral-600)',
            fontWeight: isActive ? '600' : 'normal',
            textDecoration: 'none',
            cursor: 'pointer'
        };
    };

    return (
        <div className="tabs" style={{ marginBottom: '1.5rem', borderBottom: '1px solid var(--neutral-200)', display: 'flex', gap: '1rem' }}>
            <Link
                to="/liquidaciones"
                className="tab-link"
                style={getTabStyle('/liquidaciones')}
            >
                Liquidaciones
            </Link>
            <Link
                to="/liquidaciones/novedades"
                className="tab-link"
                style={getTabStyle('/liquidaciones/novedades')}
            >
                Novedades
            </Link>
            <Link
                to="/liquidaciones/documentacion"
                className="tab-link"
                style={getTabStyle('/liquidaciones/documentacion')}
            >
                Documentación
            </Link>
        </div>
    );
};

export default LiquidacionTabs;
