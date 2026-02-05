const express = require('express');
const router = express.Router();
const parametroLaboralController = require('../controllers/parametroLaboralController');

router.get('/', parametroLaboralController.get);
router.put('/', parametroLaboralController.update);

module.exports = router;
