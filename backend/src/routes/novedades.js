const express = require('express');
const router = express.Router();
const novedadController = require('../controllers/novedadController');

router.get('/', novedadController.listar);
router.post('/', novedadController.crear);
router.put('/:id', novedadController.actualizar);
router.delete('/:id', novedadController.eliminar);

module.exports = router;
