const express = require('express');
const router = express.Router();
const { ejecutarLiquidacion } = require('../controllers/prueba_liq');

router.post('/', ejecutarLiquidacion);

module.exports = router;
