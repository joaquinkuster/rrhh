const express = require('express');
const router = express.Router();
const documentacionPagoController = require('../controllers/documentacionPagoController');

router.get('/', documentacionPagoController.listar);
router.post('/', documentacionPagoController.crear);
router.put('/:id/estado', documentacionPagoController.actualizarEstado);
router.delete('/:id', documentacionPagoController.eliminar);

module.exports = router;
