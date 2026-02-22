const express = require('express');
const router = express.Router();
const rolController = require('../controllers/rolController');
const { isAuthenticated, requirePermiso } = require('../middlewares/authMiddleware');

// Todas las rutas requieren autenticación
router.use(isAuthenticated);

// GET — requiere permiso 'leer' en 'roles' (si es empleado)
router.get('/', requirePermiso('roles', 'leer'), rolController.getAll);
router.get('/:id', requirePermiso('roles', 'leer'), rolController.getById);

// POST - requiere permiso 'crear' en 'roles' (si es empleado)
router.post('/', requirePermiso('roles', 'crear'), rolController.create);

// PUT - requiere permiso 'actualizar' en 'roles' (si es empleado)
router.put('/:id', requirePermiso('roles', 'actualizar'), rolController.update);

// PATCH - requiere permiso 'actualizar' en 'roles' (si es empleado)
router.patch('/:id/reactivate', requirePermiso('roles', 'actualizar'), rolController.reactivate);

// DELETE - requiere permiso 'eliminar' en 'roles' (si es empleado)
router.delete('/bulk', requirePermiso('roles', 'eliminar'), rolController.deleteBulk);
router.delete('/:id', requirePermiso('roles', 'eliminar'), rolController.deleteRol);


module.exports = router;
