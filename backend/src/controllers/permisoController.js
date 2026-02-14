const { Permiso, Rol } = require('../models');

/**
 * Obtener todos los permisos
 */
const getAll = async (req, res) => {
    try {
        const permisos = await Permiso.findAll({
            order: [['modulo', 'ASC'], ['accion', 'ASC']],
        });

        res.json(permisos);
    } catch (error) {
        console.error('Error al obtener permisos:', error);
        res.status(500).json({ error: 'Error al obtener permisos' });
    }
};

/**
 * Obtener permisos agrupados por módulo
 */
const getGroupedByModule = async (req, res) => {
    try {
        const permisos = await Permiso.findAll({
            order: [['modulo', 'ASC'], ['accion', 'ASC']],
        });

        // Agrupar por módulo
        const grouped = permisos.reduce((acc, permiso) => {
            if (!acc[permiso.modulo]) {
                acc[permiso.modulo] = [];
            }
            acc[permiso.modulo].push(permiso);
            return acc;
        }, {});

        res.json(grouped);
    } catch (error) {
        console.error('Error al obtener permisos agrupados:', error);
        res.status(500).json({ error: 'Error al obtener permisos agrupados' });
    }
};

/**
 * Inicializar permisos del sistema
 * Este endpoint crea todos los permisos necesarios para cada módulo
 */
const initializePermisos = async (req, res) => {
    try {
        const modulos = [
            { key: 'empleados', label: 'Empleados' },
            { key: 'empresas', label: 'Empresas' },
            { key: 'contratos', label: 'Contratos' },
            { key: 'registros_salud', label: 'Registros de Salud' },
            { key: 'evaluaciones', label: 'Evaluaciones' },
            { key: 'contactos', label: 'Contactos' },
            { key: 'solicitudes', label: 'Solicitudes' },
            { key: 'liquidaciones', label: 'Liquidaciones' },
            { key: 'conceptos_salariales', label: 'Conceptos Salariales' },
            { key: 'roles', label: 'Roles y Permisos' },
        ];

        const acciones = [
            { key: 'crear', label: 'Crear' },
            { key: 'leer', label: 'Leer' },
            { key: 'actualizar', label: 'Actualizar' },
            { key: 'eliminar', label: 'Eliminar' },
        ];

        const permisosCreados = [];

        for (const modulo of modulos) {
            for (const accion of acciones) {
                const [permiso, created] = await Permiso.findOrCreate({
                    where: {
                        modulo: modulo.key,
                        accion: accion.key,
                    },
                    defaults: {
                        descripcion: `${accion.label} ${modulo.label}`,
                    },
                });

                if (created) {
                    permisosCreados.push(permiso);
                }
            }
        }

        res.json({
            message: `Inicialización completada. ${permisosCreados.length} permisos creados.`,
            permisosCreados,
        });
    } catch (error) {
        console.error('Error al inicializar permisos:', error);
        res.status(500).json({ error: 'Error al inicializar permisos' });
    }
};

module.exports = {
    getAll,
    getGroupedByModule,
    initializePermisos,
};
