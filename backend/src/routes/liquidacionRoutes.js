const express = require('express');
const router = express.Router();
const liquidacionController = require('../controllers/liquidacionController');
const { isAuthenticated } = require('../middlewares/authMiddleware');

// Todas las rutas requieren autenticación
router.use(isAuthenticated);

router.get('/', liquidacionController.getAll);
router.get('/:id', liquidacionController.getById);
// NO POST - liquidaciones are created automatically by cron job
router.put('/:id', liquidacionController.update);
router.delete('/bulk', liquidacionController.bulkRemove);
router.delete('/:id', liquidacionController.remove);
router.patch('/:id/reactivate', liquidacionController.reactivate);

module.exports = router;
