const express = require('express');
const router = express.Router();
const empresaController = require('../controllers/empresaController');
const { isAuthenticated } = require('../middlewares/authMiddleware');

// Todas las rutas requieren autenticación
router.use(isAuthenticated);

router.get('/', empresaController.getAll);
router.get('/check-can-delete/:type/:id', empresaController.checkCanDelete);
router.get('/:id', empresaController.getById);
router.post('/', empresaController.create);
router.put('/:id', empresaController.update);
router.delete('/bulk', empresaController.removeBulk);
router.delete('/:id', empresaController.remove);
router.patch('/:id/reactivate', empresaController.reactivate);

module.exports = router;
