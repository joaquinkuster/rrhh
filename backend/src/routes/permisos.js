const express = require('express');
const router = express.Router();
const permisoController = require('../controllers/permisoController');
const { isAuthenticated, isAdmin } = require('../middlewares/authMiddleware');


// Todas las rutas requieren autenticación y permisos de administrador
router.use(isAuthenticated);
router.use(isAdmin);

// Rutas de permisos
router.get('/', permisoController.getAll);
router.get('/grouped', permisoController.getGroupedByModule);
router.post('/initialize', permisoController.initializePermisos);

module.exports = router;
