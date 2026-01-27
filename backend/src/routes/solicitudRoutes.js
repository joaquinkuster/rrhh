const express = require('express');
const router = express.Router();
const solicitudController = require('../controllers/solicitudController');

// GET all solicitudes
router.get('/', solicitudController.getAll);

// GET vacation days for a contract
router.get('/vacaciones/dias/:contratoId', solicitudController.getVacacionesDias);

// GET Argentine holidays
router.get('/feriados/:year', solicitudController.getFeriados);

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
