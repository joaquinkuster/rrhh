const express = require('express');
const router = express.Router();
const permisoController = require('../controllers/permisoController');
const { isAuthenticated, requirePermiso } = require('../middlewares/authMiddleware');


// Todas las rutas requieren autenticación
router.use(isAuthenticated);

// GET - requiere permiso 'leer' en 'permisos' (si es empleado)
router.get('/', requirePermiso('permisos', 'leer'), permisoController.getAll);
router.get('/grouped', requirePermiso('permisos', 'leer'), permisoController.getGroupedByModule);

// POST - requiere permiso 'crear' en 'permisos' (si es empleado)
router.post('/initialize', requirePermiso('permisos', 'crear'), permisoController.initializePermisos);

module.exports = router;
