const express = require('express');
const router = express.Router();
const evaluacionController = require('../controllers/evaluacionController');
const { isAuthenticated } = require('../middlewares/authMiddleware');

// Todas las rutas requieren autenticación
router.use(isAuthenticated);

router.get('/', evaluacionController.getAll);
router.get('/:id', evaluacionController.getById);
router.post('/', evaluacionController.create);
router.put('/:id', evaluacionController.update);
router.delete('/bulk', evaluacionController.bulkRemove);
router.delete('/:id', evaluacionController.remove);
router.patch('/:id/reactivate', evaluacionController.reactivate);

module.exports = router;
