const express = require('express');
const router = express.Router();
const solicitudController = require('../controllers/solicitudController');
const { isAuthenticated } = require('../middlewares/authMiddleware');

// Todas las rutas requieren autenticación
router.use(isAuthenticated);

// GET all solicitudes
router.get('/', solicitudController.getAll);

// GET vacation days for a contract
router.get('/vacaciones/diasDisponibles/:contratoId', solicitudController.getDiasDisponiblesVacaciones);

// GET vacation days for a contract
router.get('/vacaciones/diasSolicitados', solicitudController.getDiasSolicitadosVacaciones);

// GET solicitud by ID
router.get('/:id', solicitudController.getById);

// POST create solicitud
router.post('/', solicitudController.create);

// PUT update solicitud
router.put('/:id', solicitudController.update);

// DELETE soft delete solicitud
router.delete('/:id', solicitudController.remove);

// PATCH reactivate solicitud
router.patch('/:id/reactivate', solicitudController.reactivate);

// DELETE bulk soft delete
router.delete('/bulk', solicitudController.bulkRemove);

module.exports = router;
