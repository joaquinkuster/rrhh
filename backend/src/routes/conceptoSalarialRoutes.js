const express = require('express');
const router = express.Router();
const conceptoSalarialController = require('../controllers/conceptoSalarialController');

router.get('/', conceptoSalarialController.getAll);
router.get('/:id', conceptoSalarialController.getById);
router.post('/', conceptoSalarialController.create);
router.put('/:id', conceptoSalarialController.update);
router.delete('/:id', conceptoSalarialController.remove);

module.exports = router;
