const express = require('express');
const router = express.Router();
const conceptoController = require('../controllers/conceptoController');

router.get('/', conceptoController.listar);
router.post('/', conceptoController.crear);
router.put('/:id', conceptoController.actualizar);
router.delete('/:id', conceptoController.eliminar);
router.post('/inicializar', conceptoController.inicializar);

module.exports = router;
