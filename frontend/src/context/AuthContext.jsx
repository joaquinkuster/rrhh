import { createContext, useContext, useState, useEffect } from 'react';
import { getCurrentUser, login as loginAPI, logout as logoutAPI, register as registerAPI } from '../services/api';

const AuthContext = createContext();

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth debe usarse dentro de un AuthProvider');
    }
    return context;
};

import { useTheme } from './ThemeContext';

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const { resetTheme } = useTheme();

    // Verificar sesión al cargar
    useEffect(() => {
        checkAuth();
    }, []);

    const checkAuth = async () => {
        try {
            setLoading(true);
            const userData = await getCurrentUser();
            if (userData) {
                setUser(userData);
                setIsAuthenticated(true);
            } else {
                setUser(null);
                setIsAuthenticated(false);
            }
        } catch (error) {
            console.error('Error al verificar autenticación:', error);
            setUser(null);
            setIsAuthenticated(false);
        } finally {
            setLoading(false);
        }
    };

    const login = async (credentials) => {
        try {
            const response = await loginAPI(credentials);
            setUser(response.usuario);
            setIsAuthenticated(true);
            return response;
        } catch (error) {
            throw error;
        }
    };

    const logout = async () => {
        try {
            await logoutAPI();
            setUser(null);
            setIsAuthenticated(false);
            resetTheme();
        } catch (error) {
            console.error('Error al cerrar sesión:', error);
            // Limpiar sesión localmente incluso si falla el logout en servidor
            setUser(null);
            setIsAuthenticated(false);
            resetTheme();
        }
    };

    const register = async (empleadoData) => {
        try {
            const response = await registerAPI(empleadoData);
            setUser(response.usuario);
            setIsAuthenticated(true);
            return response;
        } catch (error) {
            throw error;
        }
    };

    const value = {
        user,
        loading,
        isAuthenticated,
        login,
        logout,
        register,
        checkAuth,
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
