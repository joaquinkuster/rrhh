const express = require('express');
const router = express.Router();
const registroSaludController = require('../controllers/registroSaludController');
const { isAuthenticated } = require('../middlewares/authMiddleware');

// Todas las rutas requieren autenticación
router.use(isAuthenticated);

router.get('/', registroSaludController.getAll);
router.get('/:id', registroSaludController.getById);
router.post('/', registroSaludController.create);
router.put('/:id', registroSaludController.update);
router.delete('/bulk', registroSaludController.bulkRemove);
router.delete('/:id', registroSaludController.remove);
router.patch('/:id/reactivate', registroSaludController.reactivate);

module.exports = router;
