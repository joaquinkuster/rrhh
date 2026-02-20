const express = require('express');
const router = express.Router();
const empleadoController = require('../controllers/empleadoController');
const { isAuthenticated, requirePermiso } = require('../middlewares/authMiddleware');

// Todas las rutas requieren autenticación
router.use(isAuthenticated);

// GET — requiere permiso 'leer' en 'empleados' (si es empleado)
router.get('/', requirePermiso('empleados', 'leer'), empleadoController.getAll);
router.get('/:id', requirePermiso('empleados', 'leer'), empleadoController.getById);

// POST — requiere permiso 'crear'
router.post('/', requirePermiso('empleados', 'crear'), empleadoController.create);

// PUT — requiere permiso 'actualizar'
router.put('/:id', requirePermiso('empleados', 'actualizar'), empleadoController.update);

// DELETE — requiere permiso 'eliminar'
router.delete('/bulk', requirePermiso('empleados', 'eliminar'), empleadoController.bulkRemove);
router.delete('/:id', requirePermiso('empleados', 'eliminar'), empleadoController.remove);
router.patch('/:id/reactivate', requirePermiso('empleados', 'eliminar'), empleadoController.reactivate);

module.exports = router;
