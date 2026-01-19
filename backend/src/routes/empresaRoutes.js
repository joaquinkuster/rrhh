const express = require('express');
const router = express.Router();
const empresaController = require('../controllers/empresaController');

router.get('/', empresaController.getAll);
router.get('/:id', empresaController.getById);
router.post('/', empresaController.create);
router.put('/:id', empresaController.update);
router.delete('/bulk', empresaController.removeBulk);
router.delete('/:id', empresaController.remove);

module.exports = router;
