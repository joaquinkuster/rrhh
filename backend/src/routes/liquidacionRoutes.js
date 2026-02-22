const express = require('express');
const router = express.Router();
const liquidacionController = require('../controllers/liquidacionController');
const { isAuthenticated, requirePermiso } = require('../middlewares/authMiddleware');

// Todas las rutas requieren autenticación
router.use(isAuthenticated);

// GET — requiere permiso 'leer' en 'liquidaciones' (si es empleado)
router.get('/', requirePermiso('liquidaciones', 'leer'), liquidacionController.getAll);
router.get('/:id', requirePermiso('liquidaciones', 'leer'), liquidacionController.getById);

// PUT — requiere permiso 'actualizar' en 'liquidaciones' (si es empleado)
router.put('/:id', requirePermiso('liquidaciones', 'actualizar'), liquidacionController.update);

// PATCH — requiere permiso 'actualizar' en 'liquidaciones' (si es empleado)
router.patch('/:id/reactivate', requirePermiso('liquidaciones', 'actualizar'), liquidacionController.reactivate);

module.exports = router;
