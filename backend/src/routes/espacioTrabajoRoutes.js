const express = require('express');
const router = express.Router();
const espacioTrabajoController = require('../controllers/espacioTrabajoController');
const { isAuthenticated, isAdmin } = require('../middlewares/authMiddleware');

// Todas las rutas requieren autenticación
router.get('/', isAuthenticated, espacioTrabajoController.getAll);
router.delete('/bulk', isAuthenticated, espacioTrabajoController.deleteBulk);
router.get('/:id', isAuthenticated, espacioTrabajoController.getById);
router.post('/', isAuthenticated, espacioTrabajoController.create);
router.put('/:id', isAuthenticated, espacioTrabajoController.update);
router.delete('/:id', isAuthenticated, espacioTrabajoController.deleteEspacio);
router.patch('/:id/reactivate', isAuthenticated, espacioTrabajoController.reactivate);

module.exports = router;
