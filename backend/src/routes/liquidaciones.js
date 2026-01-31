const express = require('express');
const router = express.Router();
const liquidacionController = require('../controllers/liquidacionController');

// Rutas para liquidaciones
router.post('/calcular', liquidacionController.calcular);
router.post('/crear', liquidacionController.crear);
router.post('/masivo/calcular', liquidacionController.calcularMasivo);
router.post('/masivo/crear', liquidacionController.crearMasivo);
router.get('/', liquidacionController.listar);
router.get('/:id', liquidacionController.obtener);
router.put('/:id/estado', liquidacionController.actualizarEstado);

module.exports = router;
