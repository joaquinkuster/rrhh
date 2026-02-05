const express = require('express');
const router = express.Router();
const empleadoController = require('../controllers/empleadoController');
const { isAuthenticated, isAdmin } = require('../middlewares/authMiddleware');

// Todas las rutas requieren autenticación
router.use(isAuthenticated);

// Rutas de empleados
router.get('/', empleadoController.getAll);
router.get('/:id', empleadoController.getById);
router.post('/', isAdmin, empleadoController.create); // Solo admin puede crear
router.put('/:id', isAdmin, empleadoController.update); // Solo admin puede editar
router.delete('/bulk', isAdmin, empleadoController.bulkRemove); // Solo admin puede eliminar en lote
router.delete('/:id', isAdmin, empleadoController.remove); // Solo admin puede eliminar
router.patch('/:id/reactivate', isAdmin, empleadoController.reactivate); // Solo admin puede reactivar

module.exports = router;
