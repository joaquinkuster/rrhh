const express = require('express');
const router = express.Router();
const solicitudController = require('../controllers/solicitudController');
const { isAuthenticated, requirePermiso } = require('../middlewares/authMiddleware');

// Todas las rutas requieren autenticación
router.use(isAuthenticated);

// GET - requiere permiso 'leer' en 'solicitudes' (si es empleado)
router.get('/', requirePermiso('solicitudes', 'leer'), solicitudController.getAll);
router.get('/:id', requirePermiso('solicitudes', 'leer'), solicitudController.getById);
// GET vacation days for a contract
router.get('/vacaciones/diasDisponibles/:contratoId', requirePermiso('solicitudes', 'leer'), solicitudController.getDiasDisponiblesVacaciones);
// GET vacation days for a contract
router.get('/vacaciones/diasSolicitados', requirePermiso('solicitudes', 'leer'), solicitudController.getDiasSolicitadosVacaciones);

// POST - requiere permiso 'crear' en 'solicitudes' (si es empleado)
router.post('/', requirePermiso('solicitudes', 'crear'), solicitudController.create);

// PUT - requiere permiso 'actualizar' en 'solicitudes' (si es empleado)
router.put('/:id', requirePermiso('solicitudes', 'actualizar'), solicitudController.update);
router.patch('/:id/reactivate', requirePermiso('solicitudes', 'actualizar'), solicitudController.reactivate);

// DELETE - requiere permiso 'eliminar' en 'solicitudes' (si es empleado)
router.delete('/:id', requirePermiso('solicitudes', 'eliminar'), solicitudController.remove);
router.delete('/bulk', requirePermiso('solicitudes', 'eliminar'), solicitudController.bulkRemove);

module.exports = router;
