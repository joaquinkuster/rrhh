const express = require('express');
const router = express.Router();
const contactoController = require('../controllers/contactoController');

router.get('/', contactoController.getAll);
router.get('/:id', contactoController.getById);
router.post('/', contactoController.create);
router.put('/:id', contactoController.update);
router.delete('/bulk', contactoController.bulkRemove);
router.delete('/:id', contactoController.remove);
router.patch('/:id/reactivate', contactoController.reactivate);

module.exports = router;
