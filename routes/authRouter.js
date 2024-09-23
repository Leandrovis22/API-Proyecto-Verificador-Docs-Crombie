const express = require('express');
const router = express.Router();

const authController = require('../controllers/authController');


// Rutas públicas

router.post('/register', authController.register); // Registrar un usuario, devuelve un token JWT
router.post('/login', authController.login); // Iniciar sesión, devuelve un token JWT


module.exports = router;