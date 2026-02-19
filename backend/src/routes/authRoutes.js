const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { isAuthenticated, isAdmin } = require('../middlewares/authMiddleware');

// Rutas públicas
router.post('/login', authController.login);
router.post('/register', authController.register);

// Rutas protegidas
router.post('/logout', isAuthenticated, authController.logout);
router.get('/me', isAuthenticated, authController.getCurrentUser);
router.put('/password', isAuthenticated, authController.updatePassword);
router.put('/selected-contract', isAuthenticated, authController.updateSelectedContract);

module.exports = router;
