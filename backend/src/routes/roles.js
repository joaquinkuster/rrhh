const express = require('express');
const router = express.Router();
const rolController = require('../controllers/rolController');
const { isAuthenticated, isAdmin } = require('../middlewares/authMiddleware');


// Todas las rutas requieren autenticación y permisos de administrador
router.use(isAuthenticated);
router.use(isAdmin);


// Rutas de roles
router.get('/', rolController.getAll);
router.delete('/bulk', rolController.deleteBulk);
router.get('/:id', rolController.getById);
router.post('/', rolController.create);
router.put('/:id', rolController.update);
router.delete('/:id', rolController.deleteRol);
router.patch('/:id/reactivate', rolController.reactivate);


module.exports = router;
